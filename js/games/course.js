/* ==========================================================================
   La Course des Lettres 🏎️ — un kart en fausse 3D.

   La route file vers l'enfant, les lettres arrivent de l'horizon sur trois
   voies, et il doit ATTRAPER LES BONNES DANS L'ORDRE en déplaçant son kart.
   Aux premiers niveaux c'est l'ordre de l'alphabet ; ensuite ce sont les
   lettres d'un mot, dans l'ordre — donc épeler en jouant.

   C'est le seul jeu où la bonne réponse ARRIVE et repart : il faut décider
   vite et au bon endroit. Rien à lire, tout se pilote au doigt.
   ========================================================================== */
Games.course = (function () {
  var VOIES = 3;
  var root, api, level, cvs, ctx, W, H, dpr, horizon;
  var items, suite, idx, voie, voieCible, kartX, vitesse, raf, last;
  var coeurs, over, spawnT, motActuel;

  function config(lv) {
    if (lv <= 1) return { n: 5, mot: false, vitesse: 0.24, tempo: 1250, casing: 'upper' };
    if (lv === 2) return { n: 6, mot: false, vitesse: 0.30, tempo: 1100, casing: 'upper' };
    if (lv === 3) return { n: 0, mot: true,  vitesse: 0.34, tempo: 1000, casing: 'upper' };
    return          { n: 0, mot: true,  vitesse: 0.40, tempo: 900,  casing: 'mix' };
  }

  /* ---------- mise en route ---------- */
  function start(_root, _api, lv) {
    root = _root; api = _api; level = lv; over = false;
    var cfg = config(lv);

    // ce qu'il faut attraper, dans l'ordre
    motActuel = null;
    if (cfg.mot) {
      var choix = TOUS_LES_MOTS.filter(function (w) {
        return w.m.length >= 4 && w.m.length <= (lv >= 4 ? 7 : 5);
      });
      motActuel = Sacs.tirer('course-mots', choix, function (w) { return w.m; });
      suite = motActuel.m.split('');
    } else {
      var departs = [];
      for (var k = 0; k <= 26 - cfg.n; k++) departs.push(k);
      var d = lv <= 1 ? 0 : Number(Sacs.tirer('course-departs', departs));
      suite = ALPHABET.slice(d, d + cfg.n);
    }

    idx = 0; items = []; voie = 1; voieCible = 1; kartX = 0.5;
    vitesse = cfg.vitesse; spawnT = 0;

    root.innerHTML =
      '<div class="kart-bandeau">' +
        '<div class="coeurs-slot" id="k-coeurs"></div>' +
        '<div class="kart-suite" id="k-suite"></div>' +
      '</div>' +
      '<div class="kart-piste" id="k-piste"><canvas id="k-cvs"></canvas></div>';

    coeurs = Coeurs(3);
    document.getElementById('k-coeurs').appendChild(coeurs.el);
    cvs = document.getElementById('k-cvs');
    ctx = cvs.getContext('2d');

    cvs.addEventListener('pointerdown', doigt);
    cvs.addEventListener('pointermove', doigt);

    majSuite();
    // on attend la mise en page avant de mesurer : juste après innerHTML,
    // la piste n'a pas encore sa taille définitive
    requestAnimationFrame(function () {
      if (over || !cvs) return;
      dimensionner();
      last = performance.now();
      raf = requestAnimationFrame(boucle);
      annonce();
    });
    window.addEventListener('resize', dimensionner);
  }

  function annonce() {
    if (motActuel) {
      Voice.say('Attrape les lettres du mot… ' + motActuel.d + ' ! Dans l\'ordre !',
                { rate: 0.9, coupe: true });
    } else {
      Voice.say('Attrape les lettres dans l\'ordre ! On commence par ' +
                LETTER_SAY[suite[0]], { rate: 0.9, coupe: true });
    }
  }

  function dimensionner() {
    if (!cvs) return;
    var box = document.getElementById('k-piste');
    if (!box) return;
    var r = box.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(120, r.width); H = Math.max(120, r.height);
    cvs.width = W * dpr; cvs.height = H * dpr;
    cvs.style.width = W + 'px'; cvs.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    horizon = H * 0.30;
  }

  /* ---------- perspective ----------
     z = 1 à l'horizon, 0 sous le nez du kart. L'échelle 1/(1+6z) donne la
     vraie sensation de profondeur : un objet lointain bouge à peine, puis
     grossit brutalement en arrivant. */
  function ech(z) { return 1 / (1 + z * 6); }
  function ligneY(z) { return horizon + (H - horizon) * ech(z); }
  function demiRoute(z) { return W * 0.52 * ech(z); }
  function voieX(v, z) {
    return W / 2 + (v - (VOIES - 1) / 2) * (demiRoute(z) * 2 / VOIES) * 0.92;
  }

  /* ---------- pilotage ---------- */
  function doigt(ev) {
    if (over) return;
    ev.preventDefault();
    var r = cvs.getBoundingClientRect();
    var x = (ev.clientX - r.left) / r.width;
    voieCible = Math.max(0, Math.min(VOIES - 1, Math.floor(x * VOIES)));
  }

  /* ---------- boucle de jeu ---------- */
  function boucle(now) {
    if (over || !ctx) return;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // le kart glisse vers la voie visée
    var cible = voieCible / (VOIES - 1);
    kartX += (cible - kartX) * Math.min(1, dt * 9);
    voie = Math.round(kartX * (VOIES - 1));

    // les lettres approchent
    for (var i = items.length - 1; i >= 0; i--) {
      var it = items[i];
      it.z -= vitesse * dt;
      if (it.z <= 0.02) {
        if (!it.pris) attraper(it);
        items.splice(i, 1);
      }
    }

    spawnT -= dt * 1000;
    if (spawnT <= 0) { pondre(); spawnT = config(level).tempo; }

    dessiner(now);
    raf = requestAnimationFrame(boucle);
  }

  /* ---------- ce qui arrive sur la route ---------- */
  function pondre() {
    var cfg = config(level);
    var cible = suite[idx];
    // presque une fois sur deux c'est la bonne lettre : sinon l'enfant
    // attend trop longtemps et s'ennuie
    // une seule bonne lettre sur la route à la fois : l'enfant sait
    // toujours quelle bulle il doit aller chercher, et la laisser filer
    // devient une faute claire au lieu d'un hasard
    var dejaLa = items.some(function (x) { return x.L === cible; });
    var bonne = !dejaLa && Math.random() < 0.55;
    var L = bonne ? cible : pick(
      (motActuel ? ALPHABET : LETTER_LEVELS[3]).filter(function (x) { return x !== cible; }));

    // La bonne lettre tombe n'importe où — c'est elle qui fait bouger.
    // Les intrus, eux, évitent la voie occupée : sinon l'enfant qui hésite
    // se fait percuter sans avoir rien fait (deux cœurs perdus en vingt
    // secondes lors des essais). Il doit perdre un cœur en se trompant de
    // voie, pas en réfléchissant.
    var v;
    if (bonne || Math.random() < 0.25) {
      v = Math.floor(Math.random() * VOIES);
    } else {
      var libres = [];
      for (var k = 0; k < VOIES; k++) if (k !== voieCible) libres.push(k);
      v = pick(libres);
    }
    // pas deux lettres au même endroit
    for (var i = 0; i < items.length; i++) {
      if (items[i].voie === v && items[i].z > 0.82) return;
    }
    items.push({
      L: L, voie: v, z: 1,
      vue: cfg.casing === 'mix' && Math.random() < 0.5 ? L.toLowerCase() : L
    });
  }

  /* Règle des cœurs, à l'envers de ce qu'on ferait d'instinct :
     percuter un intrus ne coûte PAS de cœur (ça freine, c'est tout), mais
     laisser filer la bonne lettre en coûte un. On sanctionne ainsi le fait
     de rater la cible, pas le fait d'hésiter — un enfant lent perdait
     sinon des cœurs sans avoir rien fait de mal. */
  function attraper(it) {
    if (it.voie !== voie) {
      if (it.L === suite[idx]) return echappee();
      return;
    }
    if (it.L === suite[idx]) {
      it.pris = true;
      idx++;
      Sound.good();
      Sound.note(420 + idx * 50, 0, 0.16, 'sawtooth', 0.18);
      api.confetti(10);
      vitesse += 0.015;                        // ça s'emballe un peu
      api.dots(idx, suite.length);
      majSuite();
      if (idx >= suite.length) return gagne();
      sayLetter(it.L, { coupe: true });
    } else {
      Sound.prout(0.25);
      api.flash('💩 ' + it.vue);
      vitesse = Math.max(config(level).vitesse * 0.7, vitesse - 0.06);   // ça freine
      Voice.say('Oups ! On cherche le ' + LETTER_SAY[suite[idx]], { coupe: true });
    }
  }

  function echappee() {
    Sound.oops();
    api.flash('Elle s\'est échappée ! ' + suite[idx]);
    if (!coeurs.perdre()) return perdu();
    Voice.say('Ratée ! Attrape le ' + LETTER_SAY[suite[idx]] + ' !', { coupe: true });
  }

  function majSuite() {
    var box = document.getElementById('k-suite');
    if (!box) return;
    box.innerHTML = (motActuel ? '<span class="k-mot">' + motActuel.e + '</span>' : '') +
      suite.map(function (L, i) {
        return '<span class="k-lettre' + (i < idx ? ' prise' : (i === idx ? ' maintenant' : '')) +
               '">' + L + '</span>';
      }).join('');
  }

  /* ---------- dessin ---------- */
  function dessiner(now) {
    ctx.clearRect(0, 0, W, H);

    // ciel + soleil
    var ciel = ctx.createLinearGradient(0, 0, 0, horizon);
    ciel.addColorStop(0, '#2a1b5e');
    ciel.addColorStop(1, '#6b3fa0');
    ctx.fillStyle = ciel;
    ctx.fillRect(0, 0, W, horizon);
    ctx.fillStyle = '#ffd06b';
    ctx.beginPath();
    ctx.arc(W * 0.5, horizon, H * 0.09, Math.PI, 0);
    ctx.fill();

    // herbe
    ctx.fillStyle = '#1d2b4a';
    ctx.fillRect(0, horizon, W, H - horizon);

    // route
    ctx.fillStyle = '#3a3560';
    ctx.beginPath();
    ctx.moveTo(W / 2 - demiRoute(1), ligneY(1));
    ctx.lineTo(W / 2 + demiRoute(1), ligneY(1));
    ctx.lineTo(W / 2 + demiRoute(0), ligneY(0));
    ctx.lineTo(W / 2 - demiRoute(0), ligneY(0));
    ctx.closePath();
    ctx.fill();

    // bandes défilantes : c'est ce qui donne la sensation de vitesse
    var defile = (now / 1000 * vitesse) % 0.2;
    for (var z = 1; z > 0; z -= 0.1) {
      var zz = z - defile;
      if (zz <= 0.02 || zz > 1) continue;
      var claire = Math.floor((zz + defile) / 0.1) % 2 === 0;
      var y1 = ligneY(zz), y2 = ligneY(Math.max(0.02, zz - 0.05));
      ctx.fillStyle = claire ? '#ffffff12' : '#00000018';
      ctx.beginPath();
      ctx.moveTo(W / 2 - demiRoute(zz), y1);
      ctx.lineTo(W / 2 + demiRoute(zz), y1);
      ctx.lineTo(W / 2 + demiRoute(Math.max(0.02, zz - 0.05)), y2);
      ctx.lineTo(W / 2 - demiRoute(Math.max(0.02, zz - 0.05)), y2);
      ctx.closePath();
      ctx.fill();
      // bordures rouge/blanc
      ctx.fillStyle = claire ? '#ff4d6d' : '#ffffff';
      var e1 = demiRoute(zz) * 0.09, e2 = demiRoute(Math.max(0.02, zz - 0.05)) * 0.09;
      [-1, 1].forEach(function (c) {
        ctx.beginPath();
        ctx.moveTo(W / 2 + c * demiRoute(zz), y1);
        ctx.lineTo(W / 2 + c * (demiRoute(zz) + e1), y1);
        ctx.lineTo(W / 2 + c * (demiRoute(Math.max(0.02, zz - 0.05)) + e2), y2);
        ctx.lineTo(W / 2 + c * demiRoute(Math.max(0.02, zz - 0.05)), y2);
        ctx.closePath();
        ctx.fill();
      });
    }

    // séparations de voies
    ctx.strokeStyle = '#ffffff22';
    ctx.lineWidth = Math.max(1, W * 0.004);
    for (var v = 1; v < VOIES; v++) {
      ctx.beginPath();
      ctx.moveTo(W / 2 + (v - VOIES / 2) * (demiRoute(1) * 2 / VOIES), ligneY(1));
      ctx.lineTo(W / 2 + (v - VOIES / 2) * (demiRoute(0) * 2 / VOIES), ligneY(0));
      ctx.stroke();
    }

    // les lettres, des plus lointaines aux plus proches
    items.slice().sort(function (a, b) { return b.z - a.z; }).forEach(function (it) {
      var s = ech(it.z);
      var x = voieX(it.voie, it.z), y = ligneY(it.z);
      var r = W * 0.16 * s;
      var estCible = it.L === suite[idx];
      var g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r);
      g.addColorStop(0, estCible ? '#eaffe7' : '#fff8c9');
      g.addColorStop(1, estCible ? '#3fd97a' : '#ffb02e');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y - r * 0.5, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2b1d00';
      ctx.font = '900 ' + (r * 1.25) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(it.vue, x, y - r * 0.5);
    });

    // Le kart : sa position est calculée avec la MÊME formule que les
    // voies des lettres, sinon il roule à côté de la voie qu'il croit
    // occuper et les collisions paraissent injustes.
    var vf = kartX * (VOIES - 1);
    var kx = W / 2 + (vf - (VOIES - 1) / 2) * (demiRoute(0) * 2 / VOIES) * 0.92;
    var taille = W * 0.17;
    var ky = H - taille * 0.62;   // posé au sol, jamais rogné par le bas
    ctx.save();
    ctx.translate(kx, ky);
    ctx.rotate((voieCible / (VOIES - 1) - kartX) * 0.5);   // il penche dans le virage
    ctx.font = taille + 'px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🏎️', 0, 0);
    ctx.restore();
  }

  /* ---------- fin ---------- */
  function gagne() {
    over = true;
    cancelAnimationFrame(raf);
    api.confetti(60);
    Sound.fanfare();
    api.flash('🏁 ' + (motActuel ? motActuel.m : 'GAGNÉ !'), 'big');
    Voice.say(motActuel ? 'Bravo ! Tu as écrit ' + motActuel.d + ' !'
                        : 'Bravo ! Tu as tout attrapé !', {
      then: function () {
        if (!api.alive()) return;
        var restants = coeurs.reste();
        api.bumpLevel('course', restants === 3);
        api.win(restants === 3 ? 3 : (restants === 2 ? 2 : 1), '🏎️');
      }
    });
  }

  function perdu() {
    over = true;
    cancelAnimationFrame(raf);
    api.perdu('🏎️', 'Plus de cœurs ! Il fallait attraper le ' +
                     LETTER_SAY[suite[idx]] + '.');
  }

  function repeat() {
    if (over) return;
    Voice.say('Attrape le ' + LETTER_SAY[suite[idx]] + ' !', { coupe: true });
  }

  function stop() {
    over = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', dimensionner);
    items = []; ctx = null; cvs = null;
  }

  return {
    title: 'Course des Lettres', spoken: 'La course des lettres',
    emoji: '🏎️', color: 'linear-gradient(160deg,#ff9f45,#a63d00)',
    need: 10,
    start: start, stop: stop, repeat: repeat
  };
})();
