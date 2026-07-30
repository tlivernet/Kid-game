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
  var courbe, courbeCible, prochainVirage, parcouru;
  var son, vitesseBase, boostJusqu, derniereVoie, clavier;

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
    vitesseBase = cfg.vitesse; vitesse = cfg.vitesse; spawnT = 0;
    boostJusqu = 0; derniereVoie = 1;
    courbe = 0; courbeCible = 0; prochainVirage = 2.5; parcouru = 0;

    root.innerHTML =
      '<div class="kart-bandeau">' +
        '<div class="coeurs-slot" id="k-coeurs"></div>' +
        '<div class="kart-suite" id="k-suite"></div>' +
      '</div>' +
      '<div class="kart-piste" id="k-piste">' +
        '<canvas id="k-cvs"></canvas>' +
      '</div>' +
      '<div class="kart-commandes">' +
        '<button class="volant" id="k-gauche">◀</button>' +
        '<button class="volant" id="k-droite">▶</button>' +
      '</div>';

    coeurs = Coeurs(3);
    document.getElementById('k-coeurs').appendChild(coeurs.el);
    cvs = document.getElementById('k-cvs');
    ctx = cvs.getContext('2d');

    // Deux grosses flèches sous la route : viser une voie en tapant sur la
    // route est trompeur, parce que la route est étroite en haut et large en
    // bas — toucher une lettre lointaine ne désigne pas sa voie. Les flèches,
    // elles, ne peuvent pas être mal comprises. Elles sont SOUS le canvas et
    // non posées dessus : dans les voies extrêmes le kart occupe les coins
    // bas de l'écran, un bouton flottant l'aurait caché.
    fleche('k-gauche', -1);
    fleche('k-droite', 1);
    // le toucher direct sur la route reste possible pour ceux qui préfèrent
    cvs.addEventListener('pointerdown', doigt);
    cvs.addEventListener('pointermove', doigt);
    // et les flèches du clavier, pratiques pour essayer sur un ordinateur
    clavier = function (e) {
      if (e.key === 'ArrowLeft') bouger(-1);
      else if (e.key === 'ArrowRight') bouger(1);
    };
    window.addEventListener('keydown', clavier);

    majSuite();
    // on attend la mise en page avant de mesurer : juste après innerHTML,
    // la piste n'a pas encore sa taille définitive
    requestAnimationFrame(function () {
      if (over || !cvs) return;
      dimensionner();
      last = performance.now();
      son = Sound.moteur();          // le moteur tourne tant qu'on joue
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

  /* Le virage : plus c'est loin, plus c'est décalé sur le côté. Au premier
     plan le décalage est nul, donc le kart n'a pas à corriger sa
     trajectoire — la route tourne, le pilote reste au milieu de sa voie.
     C'est ce que font tous les vieux jeux de course en fausse 3D, et c'est
     ce qui donne l'impression de rouler sans compliquer le pilotage. */
  function decal(z) {
    var t = 1 - ech(z);
    return courbe * W * t * t;
  }
  function centre(z) { return W / 2 + decal(z); }
  function voieX(v, z) {
    return centre(z) + (v - (VOIES - 1) / 2) * (demiRoute(z) * 2 / VOIES) * 0.92;
  }

  /* ---------- pilotage ---------- */

  /* On câble les flèches à la main au lieu d'utiliser tap() : tap() verrouille
     un bouton pendant 350 ms après chaque appui (utile contre les doubles
     touches dans les menus), or ici il faut pouvoir appuyer deux fois de suite
     très vite pour traverser deux voies — le deuxième appui était avalé, et
     dans une course c'est une lettre ratée. */
  function fleche(id, sens) {
    var b = document.getElementById(id);
    b.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      if (Date.now() - screenAt < GHOST_MS) return;   // touche fantôme
      bouger(sens);
    });
    b.addEventListener('click', function (ev) { ev.preventDefault(); });
  }

  function bouger(sens) {
    if (over) return;
    var nouvelle = Math.max(0, Math.min(VOIES - 1, voieCible + sens));
    if (nouvelle === voieCible) { Sound.boing(); return; }   // déjà au bord
    voieCible = nouvelle;
    Sound.derapage();
    var b = document.getElementById(sens < 0 ? 'k-gauche' : 'k-droite');
    if (b) { b.classList.remove('appui'); void b.offsetWidth; b.classList.add('appui'); }
  }

  function doigt(ev) {
    if (over) return;
    ev.preventDefault();
    var r = cvs.getBoundingClientRect();
    var x = (ev.clientX - r.left) / r.width;
    var nouvelle = Math.max(0, Math.min(VOIES - 1, Math.floor(x * VOIES)));
    if (nouvelle !== voieCible) Sound.derapage();   // crissement de pneus
    voieCible = nouvelle;
  }

  /* ---------- boucle de jeu ---------- */
  function boucle(now) {
    if (over || !ctx) return;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // la route serpente : on change de virage toutes les quelques secondes
    parcouru += dt;
    if (parcouru > prochainVirage) {
      parcouru = 0;
      prochainVirage = 2.5 + Math.random() * 3;
      courbeCible = (Math.random() * 2 - 1) * 0.33;
      if (Math.random() < 0.25) courbeCible = 0;      // parfois une ligne droite
    }
    courbe += (courbeCible - courbe) * Math.min(1, dt * 0.9);

    // fin du coup de turbo
    if (boostJusqu && now > boostJusqu) boostJusqu = 0;
    vitesse = vitesseBase * (boostJusqu ? 1.85 : 1);
    if (son) son.regime(Math.min(1, (vitesse - 0.2) / 0.6));

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

    // un éclair de temps en temps : le bonus d'accélération
    if (Math.random() < 0.18) {
      var libres2 = [];
      for (var j = 0; j < VOIES; j++) if (j !== v) libres2.push(j);
      items.push({ boost: true, voie: pick(libres2), z: 1.05, vue: '⚡' });
    }
  }

  /* Règle des cœurs, à l'envers de ce qu'on ferait d'instinct :
     percuter un intrus ne coûte PAS de cœur (ça freine, c'est tout), mais
     laisser filer la bonne lettre en coûte un. On sanctionne ainsi le fait
     de rater la cible, pas le fait d'hésiter — un enfant lent perdait
     sinon des cœurs sans avoir rien fait de mal. */
  function attraper(it) {
    if (it.boost) {
      if (it.voie !== voie) return;
      boostJusqu = performance.now() + 2600;
      Sound.turbo();
      api.confetti(14);
      api.flash('⚡ TURBO ⚡');
      return;
    }
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
      vitesseBase += 0.015;                    // ça s'emballe un peu
      api.dots(idx, suite.length);
      majSuite();
      if (idx >= suite.length) return gagne();
      sayLetter(it.L, { coupe: true });
    } else {
      Sound.prout(0.25);
      api.flash('💩 ' + it.vue);
      vitesseBase = Math.max(config(level).vitesse * 0.7, vitesseBase - 0.06);   // ça freine
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
    var pas = 0.02, zz2;
    ctx.moveTo(centre(1) - demiRoute(1), ligneY(1));
    for (zz2 = 1; zz2 >= 0; zz2 -= pas) ctx.lineTo(centre(zz2) - demiRoute(zz2), ligneY(zz2));
    for (zz2 = 0; zz2 <= 1; zz2 += pas) ctx.lineTo(centre(zz2) + demiRoute(zz2), ligneY(zz2));
    ctx.closePath();
    ctx.fill();

    // bandes défilantes : c'est ce qui donne la sensation de vitesse
    var defile = (now / 1000 * vitesse) % 0.2;
    for (var z = 1; z > 0; z -= 0.1) {
      var zz = z - defile;
      if (zz <= 0.02 || zz > 1) continue;
      var claire = Math.floor((zz + defile) / 0.1) % 2 === 0;
      var y1 = ligneY(zz), y2 = ligneY(Math.max(0.02, zz - 0.05));
      var zb = Math.max(0.02, zz - 0.05);
      var c1 = centre(zz), c2 = centre(zb);
      ctx.fillStyle = claire ? '#ffffff12' : '#00000018';
      ctx.beginPath();
      ctx.moveTo(c1 - demiRoute(zz), y1);
      ctx.lineTo(c1 + demiRoute(zz), y1);
      ctx.lineTo(c2 + demiRoute(zb), y2);
      ctx.lineTo(c2 - demiRoute(zb), y2);
      ctx.closePath();
      ctx.fill();
      // bordures rouge/blanc
      ctx.fillStyle = claire ? '#ff4d6d' : '#ffffff';
      var e1 = demiRoute(zz) * 0.09, e2 = demiRoute(zb) * 0.09;
      [-1, 1].forEach(function (c) {
        ctx.beginPath();
        ctx.moveTo(c1 + c * demiRoute(zz), y1);
        ctx.lineTo(c1 + c * (demiRoute(zz) + e1), y1);
        ctx.lineTo(c2 + c * (demiRoute(zb) + e2), y2);
        ctx.lineTo(c2 + c * demiRoute(zb), y2);
        ctx.closePath();
        ctx.fill();
      });
    }

    // séparations de voies
    ctx.strokeStyle = '#ffffff22';
    ctx.lineWidth = Math.max(1, W * 0.004);
    for (var v = 1; v < VOIES; v++) {
      ctx.beginPath();
      for (var zs = 1; zs >= 0; zs -= 0.04) {
        var xs = centre(zs) + (v - VOIES / 2) * (demiRoute(zs) * 2 / VOIES);
        if (zs === 1) ctx.moveTo(xs, ligneY(zs)); else ctx.lineTo(xs, ligneY(zs));
      }
      ctx.stroke();
    }

    // les lettres, des plus lointaines aux plus proches
    items.slice().sort(function (a, b) { return b.z - a.z; }).forEach(function (it) {
      var s = ech(it.z);
      var x = voieX(it.voie, it.z), y = ligneY(it.z);
      // bulles nettement plus petites qu'avant : à 0,16 de la largeur elles
      // arrivaient les unes sur les autres et on ne pouvait plus anticiper
      // laquelle éviter
      var r = W * (it.boost ? 0.085 : 0.10) * s;
      var estCible = !it.boost && it.L === suite[idx];
      var g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r);
      g.addColorStop(0, it.boost ? '#dff4ff' : (estCible ? '#eaffe7' : '#fff8c9'));
      g.addColorStop(1, it.boost ? '#2f8fff' : (estCible ? '#3fd97a' : '#ffb02e'));
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
    var kx = voieX(vf, 0);
    var taille = W * 0.20;
    var ky = H - taille * 0.42;
    dessinerKart(kx, ky, taille, (voieCible / (VOIES - 1) - kartX));
  }

  /* Le kart VU DE DOS, dessiné plutôt qu'emprunté à un emoji : les emojis
     de voiture sont tous de profil, ce qui casse la perspective. Ici on
     voit l'arrière — aileron, feux, deux grosses roues — et il s'incline
     quand on change de voie. */
  function dessinerKart(x, y, t, penche) {
    var L = t * 0.5;                 // demi-largeur
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(penche * 0.18);
    ctx.scale(1 - Math.abs(penche) * 0.12, 1);   // il se présente de trois quarts

    // ombre au sol
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, t * 0.20, L * 1.05, t * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();

    // roues arrière
    ctx.fillStyle = '#15121f';
    arrondi(-L * 1.02, -t * 0.16, L * 0.42, t * 0.36, t * 0.07);
    arrondi(L * 0.60, -t * 0.16, L * 0.42, t * 0.36, t * 0.07);
    ctx.fillStyle = '#4a4560';       // jantes
    arrondi(-L * 0.94, -t * 0.06, L * 0.26, t * 0.14, t * 0.04);
    arrondi(L * 0.68, -t * 0.06, L * 0.26, t * 0.14, t * 0.04);

    // carrosserie (plus large en bas : on la voit de derrière)
    var g = ctx.createLinearGradient(0, -t * 0.3, 0, t * 0.2);
    g.addColorStop(0, '#ff6b6b');
    g.addColorStop(1, '#c81d2e');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-L * 0.72, t * 0.2);
    ctx.lineTo(L * 0.72, t * 0.2);
    ctx.lineTo(L * 0.52, -t * 0.26);
    ctx.lineTo(-L * 0.52, -t * 0.26);
    ctx.closePath();
    ctx.fill();

    // casque du pilote
    ctx.fillStyle = '#ffe97a';
    ctx.beginPath();
    ctx.arc(0, -t * 0.30, t * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b1d00';
    ctx.beginPath();
    ctx.arc(0, -t * 0.30, t * 0.13, Math.PI * 1.15, Math.PI * 1.85);
    ctx.fill();

    // aileron
    ctx.fillStyle = '#1f1b33';
    arrondi(-L * 0.86, -t * 0.50, L * 1.72, t * 0.10, t * 0.03);
    ctx.fillStyle = '#ff4d6d';
    arrondi(-L * 0.30, -t * 0.44, L * 0.60, t * 0.16, t * 0.02);

    // feux arrière
    ctx.fillStyle = '#ff2d55';
    arrondi(-L * 0.55, 0, L * 0.26, t * 0.09, t * 0.03);
    arrondi(L * 0.29, 0, L * 0.26, t * 0.09, t * 0.03);
    ctx.restore();
  }

  function arrondi(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); }
    else {
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
    }
    ctx.fill();
  }

  /* ---------- fin ---------- */
  function gagne() {
    over = true;
    if (son) { son.stop(); son = null; }
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
    if (son) { son.stop(); son = null; }
    Sound.derapage();
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
    if (son) { son.stop(); son = null; }
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', dimensionner);
    if (clavier) { window.removeEventListener('keydown', clavier); clavier = null; }
    items = []; ctx = null; cvs = null;
  }

  return {
    title: 'Course des Lettres', spoken: 'La course des lettres',
    emoji: '🏎️', color: 'linear-gradient(160deg,#ff9f45,#a63d00)',
    need: 10, pleinEcran: true,
    start: start, stop: stop, repeat: repeat
  };
})();
