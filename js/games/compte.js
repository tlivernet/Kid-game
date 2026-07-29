/* ==========================================================================
   Les Nombres 🔢 — 10 niveaux qui changent de NATURE, pas seulement de
   taille. Compter 18 zigotos au lieu de 9 n'apprend rien de plus : passé
   un certain point, il faut faire autre chose. D'où la progression :

     1-4   compter (de 5 à 12 objets, alignés puis éparpillés)
     5     LIRE le nombre : « touche le 14 » (entendu → chiffre écrit)
     6     compter jusqu'à 20 en désordre
     7     la SUITE : « quel nombre vient après 7 ? »
     8-9   ADDITION, les deux paquets sous les yeux
     10    SOUSTRACTION, les objets mangés sont barrés
   ========================================================================== */
Games.compte = (function () {
  var TOTAL = 6;
  var root, api, level, q, score, n, a, b, busy, timer, coeurs, essais;

  function config(lv) {
    return [
      { type: 'compter', min: 1,  max: 5,  choix: 3, eparpille: false },
      { type: 'compter', min: 2,  max: 8,  choix: 4, eparpille: false },
      { type: 'compter', min: 3,  max: 10, choix: 4, eparpille: false },
      { type: 'compter', min: 5,  max: 12, choix: 5, eparpille: true },
      { type: 'lire',    min: 1,  max: 16, choix: 5 },
      { type: 'compter', min: 9,  max: 20, choix: 6, eparpille: true, melange: true },
      { type: 'suite',   min: 1,  max: 19, choix: 5 },
      { type: 'plus',    min: 3,  max: 6,  choix: 4 },
      { type: 'plus',    min: 5,  max: 10, choix: 5 },
      { type: 'moins',   min: 1,  max: 8,  choix: 5 }
    ][Math.min(Math.max(lv, 1), 10) - 1];
  }

  function start(_root, _api, lv) {
    root = _root; api = _api; level = lv; q = 0; score = 0;
    root.innerHTML =
      '<div class="coeurs-slot" id="c-coeurs"></div>' +
      '<div class="compte-zone" id="c-zone"></div>' +
      '<div class="choices num" id="c-choices"></div>';
    coeurs = Coeurs(3);
    document.getElementById('c-coeurs').appendChild(coeurs.el);
    next();
  }

  function next() {
    if (!api.alive()) return;
    if (q >= TOTAL) return finish();
    busy = false; essais = 0;
    api.dots(q, TOTAL);
    var cfg = config(level);

    var possibles = [];
    for (var v = cfg.min; v <= cfg.max; v++) possibles.push(v);
    n = Number(Sacs.tirer('nombres-n' + level, possibles));

    if (cfg.type === 'plus') {
      a = 1 + Math.floor(Math.random() * (n - 1));   // jamais de zéro : trop abstrait
      b = n - a;
    } else if (cfg.type === 'moins') {
      b = 1 + Math.floor(Math.random() * 3);
      a = n + b;                                      // a - b = n
    }

    poser(cfg);
    proposer(cfg);
    setTimeout(repeat, 300);
  }

  /* ---------- ce qu'on montre ---------- */
  function poser(cfg) {
    var zone = document.getElementById('c-zone');
    zone.innerHTML = '';
    zone.className = 'compte-zone';

    if (cfg.type === 'lire') {              // rien à voir : tout est dans l'oreille
      zone.classList.add('ecoute');
      zone.appendChild(el('div', 'gros-ecoute', '👂'));
      return;
    }

    if (cfg.type === 'suite') {             // la frise des nombres
      zone.classList.add('ecoute');
      var f = el('div', 'frise');
      if (n > 1) f.appendChild(el('span', 'frise-n', String(n - 1)));
      f.appendChild(el('span', 'frise-n', String(n)));
      f.appendChild(el('span', 'frise-n vide', '?'));
      zone.appendChild(f);
      return;
    }

    var emo = pick(COMPTE_EMOJIS);
    var combien = cfg.type === 'moins' ? a : n;
    var taille = combien <= 6 ? 11 : (combien <= 12 ? 8 : 6.2);

    if (cfg.type === 'plus') {              // deux paquets séparés par un +
      zone.classList.add('calcul');
      var g1 = el('div', 'paquet'), g2 = el('div', 'paquet');
      for (var k = 0; k < n; k++) (k < a ? g1 : g2).appendChild(zigoto(emo, taille, k));
      zone.appendChild(g1);
      zone.appendChild(el('div', 'signe', '+'));
      zone.appendChild(g2);
      return;
    }

    if (cfg.type === 'moins') {             // les objets mangés sont barrés
      zone.classList.add('calcul');
      var p = el('div', 'paquet');
      for (var j = 0; j < a; j++) {
        var z = zigoto(emo, taille, j);
        if (j >= n) z.classList.add('barre');   // ceux-là sont partis
        p.appendChild(z);
      }
      zone.appendChild(p);
      return;
    }

    // compter
    if (cfg.eparpille) zone.classList.add('eparpille');
    var cols = Math.max(1, Math.ceil(Math.sqrt(n * 1.6)));
    var rows = Math.ceil(n / cols);
    for (var i = 0; i < n; i++) {
      var s = zigoto(cfg.melange ? pick(COMPTE_EMOJIS) : emo, taille, i);
      if (cfg.eparpille) {
        var c = i % cols, r = Math.floor(i / cols);
        s.style.left = ((c + 0.5) / cols * 100 + (Math.random() - 0.5) * 40 / cols) + '%';
        s.style.top = ((r + 0.5) / rows * 100 + (Math.random() - 0.5) * 40 / rows) + '%';
      }
      zone.appendChild(s);
    }
  }

  function zigoto(emo, taille, i) {
    var s = el('span', 'zigoto', emo);
    s.style.fontSize = taille + 'vmin';
    s.style.animationDelay = (i * (taille < 8 ? 0.03 : 0.06)) + 's';
    s.style.setProperty('--rot', (Math.random() * 30 - 15) + 'deg');
    return s;
  }

  /* ---------- les réponses proposées ---------- */
  function proposer(cfg) {
    var bon = bonneReponse();
    // des voisins plutôt que du hasard : il faut compter juste, pas à peu près
    var voisins = shuffle([bon - 1, bon + 1, bon - 2, bon + 2, bon - 3, bon + 3])
      .filter(function (v) { return v > 0 && v <= 20; });
    var opts = [bon];
    for (var i = 0; i < voisins.length && opts.length < cfg.choix; i++) {
      if (opts.indexOf(voisins[i]) < 0) opts.push(voisins[i]);
    }
    opts.sort(function (x, y) { return x - y; });   // rangés = frise des nombres

    var box = document.getElementById('c-choices');
    box.innerHTML = '';
    box.className = 'choices num c' + opts.length;
    opts.forEach(function (v) {
      var btn = el('button', 'letter-btn num', String(v));
      btn.style.setProperty('--hue', Math.floor(Math.random() * 360));
      tap(btn, function () { answer(btn, v); });
      box.appendChild(btn);
    });
  }

  /* Pour « la suite », la bonne réponse est n+1 et non n */
  function bonneReponse() { return config(level).type === 'suite' ? n + 1 : n; }

  function consigne() {
    var t = config(level).type;
    if (t === 'lire')  return 'Touche le nombre… ' + CHIFFRE_SAY[n];
    if (t === 'suite') return 'Quel nombre vient après ' + CHIFFRE_SAY[n] + ' ?';
    if (t === 'plus')  return CHIFFRE_SAY[a] + ' plus ' + CHIFFRE_SAY[b] + ', ça fait combien ?';
    if (t === 'moins') return CHIFFRE_SAY[a] + ' moins ' + CHIFFRE_SAY[b] + ', ça fait combien ?';
    return 'Combien y en a-t-il ?';
  }

  function repeat() { Voice.say(consigne(), { rate: 0.85, coupe: true }); }

  function answer(btn, v) {
    if (busy) return;
    if (v !== bonneReponse()) {
      btn.classList.add('ko');
      wiggle(btn);
      Sound.prout(0.25);
      essais++;
      if (!coeurs.perdre()) {
        busy = true;
        return api.perdu('🔢', 'Plus de cœurs ! La réponse était ' +
                               CHIFFRE_SAY[bonneReponse()] + '.');
      }
      Voice.say(pick(ENCOURAGEMENTS), { coupe: true });
      return;
    }
    busy = true;
    // seules les réponses trouvées DU PREMIER COUP comptent : sinon, avec
    // les cœurs, toute partie terminée l'était à 6/6 et le niveau montait
    // systématiquement, quelle que soit la difficulté réelle rencontrée.
    if (!essais) score++;
    btn.classList.add('ok');
    Sound.good();
    // on ne recompte à voix haute que s'il y a quelque chose à compter
    if (root.querySelectorAll('.zigoto:not(.barre)').length) compter(0);
    else conclure();
  }

  /* On recompte à voix haute en faisant sauter chaque zigoto.
     Au-delà de 12, on compte trop vite pour que la voix suive : on garde
     alors le rythme sonore et on n'annonce que le total. */
  function compter(i) {
    if (!api.alive()) return;
    var zigs = root.querySelectorAll('.zigoto:not(.barre)');
    var pas = zigs.length <= 6 ? 620 : (zigs.length <= 12 ? 430 : 300);
    if (i >= zigs.length) return conclure();
    zigs[i].classList.add('counted');
    Sound.note(440 + i * 45, 0, 0.13, 'triangle', 0.22);
    if (pas >= 420) Voice.say(CHIFFRE_SAY[i + 1], { rate: 1 });
    timer = setTimeout(function () { compter(i + 1); }, pas);
  }

  function conclure() {
    if (!api.alive()) return;
    api.confetti(12);
    var t = config(level).type;
    var phrase =
      t === 'plus'  ? CHIFFRE_SAY[a] + ' plus ' + CHIFFRE_SAY[b] + ', ça fait ' + CHIFFRE_SAY[n] :
      t === 'moins' ? CHIFFRE_SAY[a] + ' moins ' + CHIFFRE_SAY[b] + ', ça fait ' + CHIFFRE_SAY[n] :
      t === 'suite' ? 'Après ' + CHIFFRE_SAY[n] + ', c\'est ' + CHIFFRE_SAY[n + 1] :
      t === 'lire'  ? 'Oui, c\'est le ' + CHIFFRE_SAY[n] :
                      'Ça fait ' + CHIFFRE_SAY[n];
    Voice.say(phrase + ' ! ' + pick(BRAVOS), { then: function () { q++; next(); } });
  }

  function finish() {
    if (!api.alive()) return;
    api.dots(TOTAL, TOTAL);
    var stars = score >= 6 ? 3 : (score >= 4 ? 2 : 1);
    api.bumpLevel('compte', score >= 5);
    api.win(stars, '🔢');
  }

  function stop() { clearTimeout(timer); }

  return {
    title: 'Les Nombres', spoken: 'Les nombres',
    emoji: '🔢', color: 'linear-gradient(160deg,#3ec6ff,#0b5ea8)',
    maxLevel: 10,
    start: start, stop: stop, repeat: repeat
  };
})();
