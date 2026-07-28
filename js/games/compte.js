/* ==========================================================================
   Compte les Zigotos 🔢 — combien y en a-t-il ? On touche le bon chiffre.
   Bonus : à chaque réussite, on recompte à voix haute avec l'enfant.
   ========================================================================== */
Games.compte = (function () {
  var TOTAL = 6;
  var root, api, level, q, score, n, busy, timer;

  function config(lv) {
    if (lv <= 1) return { max: 5, choices: 3 };
    if (lv === 2) return { max: 6, choices: 4 };
    if (lv === 3) return { max: 9, choices: 4 };
    return { max: 10, choices: 5 };
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
    n = 1 + Math.floor(Math.random() * cfg.max);
    var emo = pick(COMPTE_EMOJIS);

    var zone = document.getElementById('c-zone');
    zone.innerHTML = '';
    for (var i = 0; i < n; i++) {
      var s = el('span', 'zigoto', emo);
      s.style.animationDelay = (i * 0.08) + 's';
      s.style.setProperty('--rot', (Math.random() * 24 - 12) + 'deg');
      zone.appendChild(s);
    }

    var opts = [n];
    while (opts.length < cfg.choices) {
      var c = 1 + Math.floor(Math.random() * cfg.max);
      if (opts.indexOf(c) < 0) opts.push(c);
    }
    opts = shuffle(opts);

    var box = document.getElementById('c-choices');
    box.innerHTML = '';
    box.className = 'choices num c' + opts.length;
    opts.forEach(function (v) {
      var b = el('button', 'letter-btn num', String(v));
      b.style.setProperty('--hue', Math.floor(Math.random() * 360));
      tap(b, function () { answer(b, v); });
      box.appendChild(b);
    });

    setTimeout(repeat, 300);
  }

  function repeat() { Voice.say('Combien y en a-t-il ?', { rate: 0.9 }); }

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

  /* On recompte à voix haute en faisant sauter chaque personnage */
  function compter(i) {
    if (!api.alive()) return;
    var zigs = root.querySelectorAll('.zigoto');
    if (i >= zigs.length) {
      api.confetti(12);
      Voice.say('Ça fait ' + CHIFFRE_SAY[n] + ' ! ' + pick(BRAVOS), {
        then: function () { q++; next(); }
      });
      return;
    }
    zigs[i].classList.add('counted');
    Sound.note(480 + i * 70, 0, 0.14, 'triangle', 0.22);
    Voice.say(CHIFFRE_SAY[i + 1], { rate: 1 });
    timer = setTimeout(function () { compter(i + 1); }, 620);
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
    start: start, stop: stop, repeat: repeat
  };
})();
