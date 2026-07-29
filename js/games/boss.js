/* ==========================================================================
   Le Monstre à Prouts 👹 — le combat de boss.
   Mélange TOUT ce que les autres jeux entraînent (lettres, sons, nombres,
   majuscule/minuscule). C'est la récompense de la progression : on ne
   l'ouvre qu'à 25 étoiles, et il rapporte gros.
   Perdre reste drôle : le monstre gagne en pétant, pas en punissant.
   ========================================================================== */
Games.boss = (function () {
  var TETES = ['👹', '👺', '👾', '🤖', '🐲'];
  var root, api, level, monstre, pvMonstre, pvMax, pvJoueur;
  var question, busy, over, minuteur, reste, tempsMax;

  function start(_root, _api) {
    root = _root; api = _api;
    var rang = App.state().boss || 0;          // combien de boss déjà battus
    level = rang;
    pvMax = 5 + Math.min(rang, 4);             // il devient plus coriace
    pvMonstre = pvMax;
    pvJoueur = 3;
    monstre = TETES[Math.min(rang, TETES.length - 1)];
    over = false;
    // pas de chrono pour le tout premier combat : on découvre d'abord
    tempsMax = rang === 0 ? 0 : Math.max(9, 16 - rang * 2);

    root.innerHTML =
      '<div class="boss-scene">' +
        '<div class="boss-vie" id="b-vie"></div>' +
        '<div class="boss-monstre" id="b-monstre">' + monstre + '</div>' +
        '<div class="boss-chrono"><div id="b-chrono"></div></div>' +
      '</div>' +
      '<div class="boss-question" id="b-question"></div>' +
      '<div class="choices" id="b-choices"></div>';

    majVie();
    Voice.say('Attention ! Le monstre à prouts ! Réponds bien pour le battre !',
              { pitch: 0.7, rate: 0.9 });
    setTimeout(poser, 1800);
  }

  function majVie() {
    document.getElementById('b-vie').innerHTML =
      '<span class="vie-monstre">' +
        '💀'.repeat(pvMonstre) + '<span class="perdu">' + '💀'.repeat(pvMax - pvMonstre) + '</span>' +
      '</span>' +
      '<span class="vie-joueur">' +
        '❤️'.repeat(pvJoueur) + '<span class="perdu">' + '🖤'.repeat(3 - pvJoueur) + '</span>' +
      '</span>';
    var m = document.getElementById('b-monstre');
    if (m) m.style.fontSize = (16 + (pvMonstre / pvMax) * 14) + 'vmin';
  }

  /* ---------- les questions ---------- */
  function poser() {
    if (over || !api.alive()) return;
    busy = false;
    question = fabriquer();

    document.getElementById('b-question').innerHTML = question.affiche;
    var box = document.getElementById('b-choices');
    box.innerHTML = '';
    box.className = 'choices c' + question.opts.length;
    question.opts.forEach(function (o) {
      var b = el('button', 'letter-btn', o);
      b.style.setProperty('--hue', Math.floor(Math.random() * 360));
      tap(b, function () { repondre(b, o); });
      box.appendChild(b);
    });

    Voice.say(question.dit, { rate: 0.9, coupe: true });
    lancerChrono();
  }

  function fabriquer() {
    // les quatre familles défilent en boucle : plus de « trois fois la même »
    var t = Sacs.tirer('boss-types', ['lettre', 'compte', 'debut', 'paire']);
    var pool = LETTER_LEVELS[Math.min(3, 1 + Math.floor(level / 2))];

    if (t === 'compte') {
      var nombres = [];
      for (var v = 3; v <= 12; v++) nombres.push(v);
      var n = Number(Sacs.tirer('boss-nombres', nombres));
      var emo = pick(COMPTE_EMOJIS);
      var opts = [n];
      [n - 1, n + 1, n - 2, n + 2].forEach(function (v) {
        if (v > 0 && opts.length < 4 && opts.indexOf(v) < 0) opts.push(v);
      });
      return {
        affiche: '<div class="bq-objets">' +
                 new Array(n + 1).join('<span>' + emo + '</span>') + '</div>',
        dit: 'Combien y en a-t-il ?',
        opts: shuffle(opts).map(String),
        bon: String(n)
      };
    }

    if (t === 'debut') {
      var w = Sacs.tirer('boss-mots',
                TOUS_LES_MOTS.filter(function (x) { return !x.h && x.m.length >= 3; }),
                function (x) { return x.m; });
      var L = w.m[0];
      var autres = shuffle(ALPHABET.filter(function (x) { return x !== L; })).slice(0, 3);
      return {
        affiche: '<div class="bq-emoji">' + (w.e || '👂') + '</div>',
        dit: w.d + ' ! Ça commence par quelle lettre ?',
        opts: shuffle([L].concat(autres)),
        bon: L
      };
    }

    if (t === 'paire') {
      // toutes les réponses sont en minuscules ici : le « i » a son point,
      // il ne peut pas être confondu avec le « l ». Pas de noAmbig, donc
      // une liste stable pour le sac.
      var P = Sacs.tirer('boss-paires', pool);
      var autresP = shuffle(ALPHABET.filter(function (x) { return x !== P; })).slice(0, 3);
      return {
        affiche: '<div class="bq-grande">' + P + '</div>',
        dit: 'Trouve la petite lettre de ' + LETTER_SAY[P],
        opts: shuffle([P].concat(autresP)).map(function (x) { return x.toLowerCase(); }),
        bon: P.toLowerCase()
      };
    }

    var C = Sacs.tirer('boss-lettres', pool);
    var autresC = shuffle(pool.filter(function (x) { return x !== C; })).slice(0, 3);
    return {
      affiche: '<div class="bq-oreille">👂</div>',
      dit: 'Touche la lettre ' + LETTER_SAY[C],
      opts: shuffle([C].concat(autresC)),
      bon: C
    };
  }

  /* ---------- chrono : le monstre prépare son attaque ---------- */
  function lancerChrono() {
    clearInterval(minuteur);
    var barre = document.getElementById('b-chrono');
    if (!tempsMax) { if (barre) barre.style.width = '0%'; return; }
    reste = tempsMax;
    if (barre) barre.style.width = '100%';
    minuteur = setInterval(function () {
      if (over || !api.alive()) return clearInterval(minuteur);
      reste -= 0.1;
      if (barre) barre.style.width = Math.max(0, reste / tempsMax * 100) + '%';
      if (reste <= 0) { clearInterval(minuteur); attaque(); }
    }, 100);
  }

  function attaque() {
    if (over || busy) return;
    busy = true;
    perdreCoeur('Trop lent ! Le monstre t\'a eu !');
  }

  /* ---------- réponses ---------- */
  function repondre(btn, val) {
    if (busy || over) return;
    if (val === question.bon) {
      busy = true;
      clearInterval(minuteur);
      btn.classList.add('ok');
      pvMonstre--;
      Sound.good();
      Sound.prout(0.3);
      secouer();
      api.confetti(12);
      majVie();
      var m = document.getElementById('b-monstre');
      m.textContent = pvMonstre > 0 ? '😵' : '💥';
      setTimeout(function () { if (m) m.textContent = monstre; }, 500);
      if (pvMonstre <= 0) return victoire();
      Voice.say(pick(['Touché !', 'Dans le mille !', 'Bien joué !', 'Aïe pour lui !']), {
        then: poser
      });
    } else {
      btn.classList.add('ko');
      wiggle(btn);
      busy = true;
      clearInterval(minuteur);
      perdreCoeur('Raté ! Le monstre rigole !');
    }
  }

  function perdreCoeur(phrase) {
    pvJoueur--;
    Sound.rot();
    majVie();
    var m = document.getElementById('b-monstre');
    if (m) { m.textContent = '😈'; wiggle(m); }
    setTimeout(function () { if (m) m.textContent = monstre; }, 600);
    if (pvJoueur <= 0) return defaite();
    Voice.say(phrase, { pitch: 0.7, then: poser });
  }

  function secouer() {
    var s = document.querySelector('.boss-scene');
    if (!s) return;
    s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake');
  }

  function victoire() {
    over = true;
    clearInterval(minuteur);
    api.confetti(80);
    Sound.fanfare();
    api.flash('💥 MONSTRE BATTU ! 💥', 'big');
    var st = App.state();
    st.boss = (st.boss || 0) + 1;
    App.save();
    Voice.say('Tu as battu le monstre ! Il repart en pétant !', {
      then: function () {
        if (!api.alive()) return;
        Sound.prout(0.9);
        api.addStars(2);          // le boss rapporte 5 étoiles en tout
        api.win(3, '👑');
      }
    });
  }

  function defaite() {
    over = true;
    clearInterval(minuteur);
    var m = document.getElementById('b-monstre');
    if (m) m.textContent = '😜';
    Sound.prout(0.8);
    api.flash('Le monstre a gagné… 😜', 'big');
    Voice.say('Le monstre a gagné cette fois ! Reviens vite le battre !', {
      then: function () { if (api.alive()) api.win(1, '😜'); }
    });
  }

  function repeat() { if (question && !over) Voice.say(question.dit); }

  function stop() { over = true; clearInterval(minuteur); question = null; }

  return {
    title: 'Le Monstre', spoken: 'Le monstre à prouts',
    emoji: '👹', color: 'linear-gradient(160deg,#ff3b6b,#5c0a2a)',
    need: 25, boss: true, maxLevel: 1,
    start: start, stop: stop, repeat: repeat
  };
})();
