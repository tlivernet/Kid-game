/* ==========================================================================
   La Fusée Alphabet 🚀 — relier les lettres dans l'ordre, de A à Z.
   Aucun autre jeu ne travaillait l'ORDRE de l'alphabet : savoir que le C
   vient après le B, c'est ce qui permet ensuite de chercher dans un
   abécédaire, de réciter, de se repérer. La fusée trace le chemin.
   ========================================================================== */
Games.fusee = (function () {
  var root, api, level, zone, canvas, ctx, rocket;
  var suite, idx, erreurs, pos, over;

  function config(lv) {
    if (lv <= 1) return { n: 5, depart: 0, casing: 'upper' };   // toujours A→E
    if (lv === 2) return { n: 6, depart: -1, casing: 'upper' };
    if (lv === 3) return { n: 8, depart: -1, casing: 'upper' };
    return { n: 10, depart: -1, casing: 'mix' };
  }

  function start(_root, _api, lv) {
    root = _root; api = _api; level = lv; over = false;
    var cfg = config(lv);
    var departs = [];
    for (var k = 0; k <= 26 - cfg.n; k++) departs.push(k);
    var d = cfg.depart >= 0 ? cfg.depart
                            : Number(Sacs.tirer('fusee-n' + lv, departs));
    suite = ALPHABET.slice(d, d + cfg.n);
    idx = 0; erreurs = 0; pos = null;

    root.innerHTML =
      '<div class="fusee-hud" id="f-hud"></div>' +
      '<div class="fusee-zone" id="f-zone">' +
        '<canvas id="f-canvas"></canvas>' +
        '<div class="rocket" id="f-rocket">🚀</div>' +
      '</div>';
    zone = document.getElementById('f-zone');
    canvas = document.getElementById('f-canvas');
    ctx = canvas.getContext('2d');
    rocket = document.getElementById('f-rocket');

    // On attend que la mise en page soit calculée avant de placer quoi que
    // ce soit : juste après innerHTML, zone.clientHeight vaut encore 616 au
    // lieu de 577 (le bandeau du haut n'a pas fini de prendre sa place), et
    // tout ce qu'on positionne se retrouve décalé vers le bas.
    majHud();
    api.dots(0, suite.length);
    requestAnimationFrame(function () {
      if (over || !zone) return;
      placer(cfg);
      setTimeout(repeat, 350);
    });
  }

  /* Les lettres sont posées sur une grille invisible puis bousculées :
     éparpillées mais jamais l'une sur l'autre. */
  function placer(cfg) {
    var W = zone.clientWidth, H = zone.clientHeight;
    canvas.width = W; canvas.height = H;
    var cols = Math.ceil(Math.sqrt(suite.length * (W / Math.max(1, H))));
    var rows = Math.ceil(suite.length / cols);
    var cases = shuffle(suite.map(function (_, i) { return i; }));

    suite.forEach(function (L, i) {
      var cellule = cases[i];
      var c = cellule % cols, r = Math.floor(cellule / cols);
      var x = (c + 0.5) / cols * W + (Math.random() - 0.5) * (W / cols) * 0.45;
      var y = (r + 0.5) / rows * H + (Math.random() - 0.5) * (H / rows) * 0.45;

      var b = el('button', 'star-letter',
                 cfg.casing === 'mix' && Math.random() < 0.5 ? L.toLowerCase() : L);
      b.dataset.letter = L;
      b.style.left = x + 'px';
      b.style.top = y + 'px';
      b.dataset.x = x; b.dataset.y = y;
      b.style.animationDelay = (i * 0.05) + 's';
      tap(b, function () { toucher(b, L); });
      zone.appendChild(b);
    });

    // la fusée attend en bas, POSÉE SUR LE SOL et entièrement visible :
    // l'enfant comprend qu'elle va se déplacer, et le décollage devient
    // une promesse. Position calculée sur sa hauteur réelle, sinon elle
    // dépassait du cadre en paysage (zone plus basse).
    // la fusée attend au sol, entièrement visible : l'enfant comprend
    // qu'elle va se déplacer, et le décollage devient une promesse
    var haut = rocket.getBoundingClientRect().height || H * 0.2;
    rocket.style.left = (W * 0.5) + 'px';
    rocket.style.top = (H - haut * 0.55) + 'px';
  }

  /* La fusée se POSE SUR la bulle comme sur une planète, au lieu d'atterrir
     en son centre — où la bulle, plus grande, la cachait complètement. */
  function poserFusee(x, y, btn) {
    var rayon = (btn.offsetHeight || 0) / 2;
    var haut = rocket.getBoundingClientRect().height || 0;
    // elle se pose sur le dôme de la bulle ; sur la rangée du haut il n'y a
    // pas la place, alors elle chevauche un peu plutôt que de sortir du cadre
    var cible = Math.max(haut * 0.55, y - rayon - haut * 0.28);
    rocket.style.left = x + 'px';
    rocket.style.top = cible + 'px';
    rocket.classList.remove('pose');
    void rocket.offsetWidth;
    rocket.classList.add('pose');
  }

  function majHud() {
    var hud = document.getElementById('f-hud');
    if (!hud) return;
    hud.innerHTML = suite.map(function (L, i) {
      return '<span class="f-step' + (i < idx ? ' done' : (i === idx ? ' now' : '')) +
             '">' + (i < idx ? L : (i === idx ? L : '?')) + '</span>';
    }).join('<span class="f-arrow">›</span>');
  }

  function toucher(btn, L) {
    if (over) return;
    if (L !== suite[idx]) {
      erreurs++;
      wiggle(btn);
      Sound.boing();
      if (erreurs % 2 === 0) {
        var bon = zone.querySelector('.star-letter[data-letter="' + suite[idx] + '"]');
        if (bon) bon.classList.add('helped');
        Voice.say('Après ' + LETTER_SAY[suite[idx - 1] || suite[0]] +
                  ', c\'est ' + LETTER_SAY[suite[idx]] + ' !', { coupe: true });
      } else {
        Voice.say('Non ! On cherche le ' + LETTER_SAY[suite[idx]], { coupe: true });
      }
      return;
    }

    // bonne lettre : la fusée y vole et laisse une traînée
    var x = parseFloat(btn.dataset.x), y = parseFloat(btn.dataset.y);
    if (pos) {
      ctx.strokeStyle = 'rgba(255,220,110,0.85)';
      ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.setLineDash([2, 14]);
      ctx.beginPath();
      ctx.moveTo(pos[0], pos[1]);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    pos = [x, y];
    poserFusee(x, y, btn);
    btn.classList.add('visited');
    btn.classList.remove('helped');
    btn.textContent = suite[idx];

    Sound.note(440 + idx * 60, 0, 0.16, 'triangle', 0.24);
    api.confetti(5);
    idx++;
    api.dots(idx, suite.length);
    majHud();

    if (idx >= suite.length) return gagne();
    sayLetter(L, { then: function () {
      if (!over && api.alive()) Voice.say('Et après ?');
    } });
  }

  /* Le décollage : c'est la récompense du jeu, elle mérite mieux qu'une
     fusée qui glisse hors de l'écran. Compte à rebours, flammes qui
     grossissent, écran qui tremble, puis départ dans les étoiles. */
  function gagne() {
    over = true;
    var W = zone.clientWidth, H = zone.clientHeight;

    // on efface les bulles : la fusée doit être seule en piste
    zone.classList.add('lancement');
    // la fusée rejoint le pas de tir, bien droite
    rocket.classList.add('surRampe');
    rocket.style.left = (W * 0.5) + 'px';
    rocket.style.top = (H * 0.66) + 'px';

    var flamme = el('div', 'flamme', '🔥');
    zone.appendChild(flamme);
    function placerFlamme() {
      flamme.style.left = rocket.style.left;
      flamme.style.top = (parseFloat(rocket.style.top) + H * 0.1) + 'px';
    }
    placerFlamme();

    var compteur = el('div', 'compte-rebours');
    zone.appendChild(compteur);

    var etapes = ['3', '2', '1'];
    var i = 0;
    (function tic() {
      if (!api.alive()) return;
      if (i < etapes.length) {
        compteur.textContent = etapes[i];
        compteur.classList.remove('bat'); void compteur.offsetWidth;
        compteur.classList.add('bat');
        Sound.note(300 + i * 120, 0, 0.22, 'square', 0.28);
        Voice.say(['trois', 'deux', 'un'][i], { coupe: true });
        i++;
        setTimeout(tic, 800);
        return;
      }
      // ---- allumage ----
      compteur.textContent = 'DÉCOLLAGE !';
      compteur.classList.add('go');
      flamme.classList.add('allumee');
      zone.classList.add('tremble');
      Sound.fanfare();
      Sound.prout(1.2);                 // le carburant, forcément
      api.confetti(60);
      Voice.say('Décollage ! Tu connais ton alphabet !');

      setTimeout(function () {
        if (!api.alive()) return;
        rocket.classList.add('decolle');
        flamme.classList.add('decolle');
        zone.classList.add('vitesse');   // traînées d'étoiles
        Sound.ballon();
      }, 700);

      setTimeout(function () {
        if (!api.alive()) return;
        var stars = erreurs === 0 ? 3 : (erreurs <= 3 ? 2 : 1);
        api.bumpLevel('fusee', erreurs <= 1);
        api.win(stars, '🚀');
      }, 2600);
    })();
  }

  function repeat() {
    if (over || !suite) return;
    Voice.say('Touche les lettres dans l\'ordre ! On commence par ' +
              LETTER_SAY[suite[idx]] + '.', { rate: 0.9, coupe: true });
  }

  function stop() { over = true; suite = null; ctx = null; }

  return {
    title: 'Fusée Alphabet', spoken: 'La fusée alphabet',
    emoji: '🚀', color: 'linear-gradient(160deg,#00c2a8,#075e6b)',
    need: 16,
    start: start, stop: stop, repeat: repeat
  };
})();
