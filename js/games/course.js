/* ==========================================================================
   La Grande Course 🏁 — course contre le monstre.
   Chaque bonne réponse fait avancer la voiture d'une case ; chaque erreur
   fait avancer le monstre. Et surtout, le monstre avance TOUT SEUL au bout
   d'un moment : c'est le seul jeu où ne rien faire fait perdre du terrain.
   D'où l'intérêt pédagogique — on ne cherche plus seulement à reconnaître
   la lettre, on cherche à la reconnaître VITE, ce qui est exactement le
   passage du déchiffrage laborieux à la lecture.
   ========================================================================== */
Games.course = (function () {
  var CASES = 10;
  var root, api, level;
  var joueur, monstre, question, busy, over, minuteur, fautes;

  function config(lv) {
    if (lv <= 1) return { pool: LETTER_LEVELS[0], rythme: 7000, mots: false, casing: 'upper' };
    if (lv === 2) return { pool: LETTER_LEVELS[1], rythme: 6000, mots: false, casing: 'upper' };
    if (lv === 3) return { pool: LETTER_LEVELS[2], rythme: 5000, mots: true,  casing: 'upper' };
    return          { pool: LETTER_LEVELS[3], rythme: 4000, mots: true,  casing: 'mix' };
  }

  function start(_root, _api, lv) {
    root = _root; api = _api; level = lv;
    joueur = 0; monstre = 0; fautes = 0; over = false;

    root.innerHTML =
      '<div class="piste">' +
        '<div class="voie">' +
          '<span class="coureur" id="co-joueur">🏎️</span>' +
        '</div>' +
        '<div class="voie monstre">' +
          '<span class="coureur" id="co-monstre">👹</span>' +
        '</div>' +
        '<div class="arrivee">🏁</div>' +
      '</div>' +
      '<div class="course-question" id="co-q"></div>' +
      '<div class="choices" id="co-choices"></div>';

    placer();
    api.dots(0, CASES);
    Voice.say('La grande course ! Réponds vite, sinon le monstre te double !',
              { coupe: true });
    setTimeout(poser, 1600);
    relancerMonstre();
  }

  /* Positions en pourcentage : aucune mesure de pixels, donc rien à
     recalculer quand la tablette tourne. */
  function placer() {
    var j = document.getElementById('co-joueur');
    var m = document.getElementById('co-monstre');
    if (j) j.style.left = (joueur / CASES * 88) + '%';
    if (m) m.style.left = (monstre / CASES * 88) + '%';
  }

  /* ---------- le monstre avance tout seul ---------- */
  function relancerMonstre() {
    clearInterval(minuteur);
    if (over) return;
    minuteur = setInterval(function () {
      if (over || !api.alive()) return clearInterval(minuteur);
      avanceMonstre('Le monstre avance !');
    }, config(level).rythme);
  }

  function avanceMonstre(phrase) {
    if (over) return;
    monstre++;
    placer();
    Sound.rot();
    var m = document.getElementById('co-monstre');
    if (m) wiggle(m);
    if (monstre >= CASES) return perdu();
    if (phrase) Voice.say(phrase, { pitch: 0.7, coupe: true });
  }

  /* ---------- les questions ---------- */
  function poser() {
    if (over || !api.alive()) return;
    busy = false;
    var cfg = config(level);
    question = cfg.mots && Math.random() < 0.4 ? questionMot(cfg) : questionLettre(cfg);

    document.getElementById('co-q').innerHTML = question.affiche;
    var box = document.getElementById('co-choices');
    box.innerHTML = '';
    box.className = 'choices c' + question.opts.length;
    question.opts.forEach(function (o) {
      var b = el('button', 'letter-btn', o);
      b.dataset.rep = o;
      b.style.setProperty('--hue', Math.floor(Math.random() * 360));
      tap(b, function () { repondre(b, o); });
      box.appendChild(b);
    });
    Voice.say(question.dit, { rate: 0.95, coupe: true });
  }

  function questionLettre(cfg) {
    var L = Sacs.tirer('course-lettres-n' + level, cfg.pool);
    var autres = shuffle(cfg.pool.filter(function (x) { return x !== L; })).slice(0, 3);
    var vue = function (x) {
      return cfg.casing === 'mix' && Math.random() < 0.5 ? x.toLowerCase() : x;
    };
    var bon = vue(L);
    return {
      affiche: '<div class="cq-oreille">👂</div>',
      dit: 'Touche la lettre ' + LETTER_SAY[L],
      opts: shuffle([bon].concat(autres.map(vue))),
      bon: bon
    };
  }

  function questionMot(cfg) {
    var w = Sacs.tirer('course-mots',
              TOUS_LES_MOTS.filter(function (x) { return !x.h && x.m.length >= 3; }),
              function (x) { return x.m; });
    var L = w.m[0];
    var autres = shuffle(ALPHABET.filter(function (x) { return x !== L; })).slice(0, 3);
    return {
      affiche: '<div class="cq-emoji">' + (w.e || '👂') + '</div>',
      dit: w.d + ' ! Ça commence par quelle lettre ?',
      opts: shuffle([L].concat(autres)),
      bon: L
    };
  }

  function repondre(btn, val) {
    if (busy || over) return;
    busy = true;
    if (val === question.bon) {
      btn.classList.add('ok');
      joueur++;
      placer();
      api.dots(joueur, CASES);
      Sound.good();
      Sound.note(320 + joueur * 40, 0.05, 0.18, 'sawtooth', 0.18);   // vroum
      api.confetti(6);
      var j = document.getElementById('co-joueur');
      if (j) { j.classList.remove('fonce'); void j.offsetWidth; j.classList.add('fonce'); }
      if (joueur >= CASES) return gagne();
      relancerMonstre();          // on repart pour un tour complet : réussir soulage
      Voice.say(pick(['Vroum !', 'Fonce !', 'En avant !', 'Super !']), { then: poser });
    } else {
      fautes++;
      btn.classList.add('ko');
      wiggle(btn);
      Sound.prout(0.25);
      avanceMonstre();
      if (over) return;
      Voice.say('Raté ! Le monstre en profite !', { pitch: 0.7, then: poser });
    }
  }

  function gagne() {
    over = true;
    clearInterval(minuteur);
    api.confetti(60);
    Sound.fanfare();
    api.flash('🏁 GAGNÉ ! 🏁', 'big');
    Voice.say('Tu as gagné la course !', {
      then: function () {
        if (!api.alive()) return;
        var stars = fautes === 0 ? 3 : (fautes <= 2 ? 2 : 1);
        api.bumpLevel('course', fautes <= 1);
        api.win(stars, '🏁');
      }
    });
  }

  function perdu() {
    over = true;
    clearInterval(minuteur);
    var m = document.getElementById('co-monstre');
    if (m) m.textContent = '😜';
    api.flash('Le monstre gagne ! 😜', 'big');
    api.bumpLevel('course', false);
    setTimeout(function () {
      if (api.alive()) api.perdu('😜', 'Le monstre est arrivé le premier ! Reprends ta revanche !');
    }, 900);
  }

  function repeat() { if (question && !over) Voice.say(question.dit, { coupe: true }); }

  function stop() {
    over = true;
    clearInterval(minuteur);
    question = null;
  }

  return {
    title: 'La Grande Course', spoken: 'La grande course',
    emoji: '🏁', color: 'linear-gradient(160deg,#ff9f45,#a63d00)',
    need: 10,
    start: start, stop: stop, repeat: repeat
  };
})();
