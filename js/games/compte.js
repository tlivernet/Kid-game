/* ==========================================================================
   Compte les Zigotos 🔢 — combien y en a-t-il ? On touche le bon chiffre.
   Bonus : à chaque réussite, on recompte à voix haute avec l'enfant.
   8 niveaux : de 5 zigotos bien alignés jusqu'à 20 éparpillés, puis
   deux niveaux de calcul (3 + 2 = ?) avec les objets sous les yeux.
   ========================================================================== */
Games.compte = (function () {
  var TOTAL = 6;
  var root, api, level, q, score, n, a, b, busy, timer;

  /* eparpille : aligné, c'est un coup d'œil ; éparpillé, il faut vraiment
     organiser son comptage — c'est là que la difficulté monte. */
  function config(lv) {
    // min : sans plancher, un niveau 6 pouvait tomber sur « 2 zigotos »
    return [
      { min: 1, max: 5,  choices: 3, eparpille: false, melange: false },
      { min: 2, max: 8,  choices: 4, eparpille: false, melange: false },
      { min: 3, max: 10, choices: 4, eparpille: false, melange: false },
      { min: 5, max: 12, choices: 5, eparpille: true,  melange: false },
      { min: 7, max: 16, choices: 5, eparpille: true,  melange: true  },
      { min: 9, max: 20, choices: 6, eparpille: true,  melange: true  },
      { min: 3, max: 6,  choices: 4, eparpille: false, melange: false, calcul: true },
      { min: 5, max: 10, choices: 5, eparpille: false, melange: false, calcul: true }
    ][Math.min(Math.max(lv, 1), 8) - 1];
  }

  function start(_root, _api, lv) {
    root = _root; api = _api; level = lv; q = 0; score = 0;
    root.innerHTML =
      '<div class="compte-zone" id="c-zone"></div>' +
      '<div class="choices num" id="c-choices"></div>';
    next();
  }

  function next() {
    if (!api.alive()) return;
    if (q >= TOTAL) return finish();
    busy = false;
    api.dots(q, TOTAL);
    var cfg = config(level);
    var possibles = [];
    for (var v = cfg.min; v <= cfg.max; v++) possibles.push(v);
    n = Number(Sacs.tirer('compte-n' + level, possibles));
    if (cfg.calcul) {
      // on coupe le total en deux paquets : jamais de zéro, c'est abstrait
      a = 1 + Math.floor(Math.random() * (n - 1));
      b = n - a;
    }

    poser(cfg);
    proposer(cfg);
    setTimeout(repeat, 300);
  }

  /* --- les zigotos --- */
  function poser(cfg) {
    var zone = document.getElementById('c-zone');
    zone.innerHTML = '';
    zone.className = 'compte-zone' + (cfg.eparpille ? ' eparpille' : '') +
                     (cfg.calcul ? ' calcul' : '');
    var emo = pick(COMPTE_EMOJIS);
    var taille = n <= 6 ? 11 : (n <= 12 ? 8 : 6.2);

    // mode calcul : deux paquets séparés par un +, et on les voit
    if (cfg.calcul) {
      var g1 = el('div', 'paquet'), g2 = el('div', 'paquet');
      for (var k = 0; k < n; k++) {
        var z = el('span', 'zigoto', emo);
        z.style.fontSize = taille + 'vmin';
        z.style.animationDelay = (k * 0.06) + 's';
        z.style.setProperty('--rot', (Math.random() * 30 - 15) + 'deg');
        (k < a ? g1 : g2).appendChild(z);
      }
      zone.appendChild(g1);
      zone.appendChild(el('div', 'signe', '+'));
      zone.appendChild(g2);
      return;
    }

    // une grille invisible + du désordre : éparpillé mais jamais superposé
    var cols = Math.max(1, Math.ceil(Math.sqrt(n * 1.6)));
    var rows = Math.ceil(n / cols);

    for (var i = 0; i < n; i++) {
      var s = el('span', 'zigoto', cfg.melange ? pick(COMPTE_EMOJIS) : emo);
      s.style.fontSize = taille + 'vmin';
      s.style.animationDelay = (i * (n > 10 ? 0.03 : 0.06)) + 's';
      s.style.setProperty('--rot', (Math.random() * 30 - 15) + 'deg');
      if (cfg.eparpille) {
        var c = i % cols, r = Math.floor(i / cols);
        s.style.left = ((c + 0.5) / cols * 100 + (Math.random() - 0.5) * 40 / cols) + '%';
        s.style.top = ((r + 0.5) / rows * 100 + (Math.random() - 0.5) * 40 / rows) + '%';
      }
      zone.appendChild(s);
    }
  }

  /* --- les chiffres proposés --- */
  function proposer(cfg) {
    // des voisins plutôt que du hasard : il faut compter juste, pas à peu près
    var voisins = shuffle([n - 1, n + 1, n - 2, n + 2, n - 3, n + 3])
      .filter(function (v) { return v > 0 && v <= cfg.max + 3; });
    var opts = [n];
    for (var i = 0; i < voisins.length && opts.length < cfg.choices; i++) {
      if (opts.indexOf(voisins[i]) < 0) opts.push(voisins[i]);
    }
    // rangés dans l'ordre : l'enfant se construit une frise des nombres
    opts.sort(function (a, b) { return a - b; });

    var box = document.getElementById('c-choices');
    box.innerHTML = '';
    box.className = 'choices num c' + opts.length;
    opts.forEach(function (v) {
      var b = el('button', 'letter-btn num', String(v));
      b.style.setProperty('--hue', Math.floor(Math.random() * 360));
      tap(b, function () { answer(b, v); });
      box.appendChild(b);
    });
  }

  function repeat() {
    if (config(level).calcul) {
      Voice.say(CHIFFRE_SAY[a] + ' plus ' + CHIFFRE_SAY[b] + ', ça fait combien ?',
                { rate: 0.85 });
    } else {
      Voice.say('Combien y en a-t-il ?', { rate: 0.9 });
    }
  }

  function answer(btn, v) {
    if (busy) return;
    if (v !== n) {
      btn.classList.add('ko');
      wiggle(btn);
      Sound.prout(0.25);
      Voice.say(pick(ENCOURAGEMENTS));
      return;
    }
    busy = true;
    score++;
    btn.classList.add('ok');
    Sound.good();
    compter(0);
  }

  /* On recompte à voix haute en faisant sauter chaque zigoto.
     Au-delà de 12, on compte trop vite pour que la voix suive : on garde
     alors le rythme sonore et on n'annonce que le total. */
  function compter(i) {
    if (!api.alive()) return;
    var zigs = root.querySelectorAll('.zigoto');
    var pas = n <= 6 ? 620 : (n <= 12 ? 430 : 300);

    if (i >= zigs.length) {
      api.confetti(12);
      Voice.say((config(level).calcul
                  ? CHIFFRE_SAY[a] + ' plus ' + CHIFFRE_SAY[b] + ', ça fait '
                  : 'Ça fait ') + CHIFFRE_SAY[n] + ' ! ' + pick(BRAVOS), {
        then: function () { q++; next(); }
      });
      return;
    }
    zigs[i].classList.add('counted');
    Sound.note(440 + i * 45, 0, 0.13, 'triangle', 0.22);
    if (pas >= 420) Voice.say(CHIFFRE_SAY[i + 1], { rate: 1 });
    timer = setTimeout(function () { compter(i + 1); }, pas);
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
    title: 'Compte les Zigotos', spoken: 'Compte les zigotos',
    emoji: '🔢', color: 'linear-gradient(160deg,#3ec6ff,#0b5ea8)',
    maxLevel: 8,
    start: start, stop: stop, repeat: repeat
  };
})();
