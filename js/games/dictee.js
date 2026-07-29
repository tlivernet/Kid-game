/* ==========================================================================
   Dictée Magique 🪄 — la voix dit une lettre, l'enfant la touche.
   C'est le cœur du jeu : reconnaissance MAJUSCULES puis minuscules.
   ========================================================================== */
Games.dictee = (function () {
  var TOTAL = 8;
  var root, api, level, q, score, target, tries, busy;

  function config(lv) {
    if (lv <= 1) return { pool: LETTER_LEVELS[0], choices: 3, casing: 'upper' };
    if (lv === 2) return { pool: LETTER_LEVELS[1], choices: 4, casing: 'upper' };
    if (lv === 3) return { pool: LETTER_LEVELS[2], choices: 4, casing: 'lower' };
    return { pool: LETTER_LEVELS[3], choices: 6, casing: 'mix' };
  }

  function display(L, casing) {
    if (casing === 'upper') return L;
    if (casing === 'lower') return L.toLowerCase();
    return Math.random() < 0.5 ? L : L.toLowerCase();
  }

  function start(_root, _api, lv) {
    root = _root; api = _api; level = lv;
    q = 0; score = 0;
    root.innerHTML =
      '<div class="dictee-wrap">' +
        '<div class="ear-box"><button class="ear" id="d-ear">👂</button></div>' +
        '<div class="hint" id="d-hint"></div>' +
        '<div class="choices" id="d-choices"></div>' +
      '</div>';
    tap(document.getElementById('d-ear'), function () { repeat(); });
    next();
  }

  function next() {
    if (!api.alive()) return;
    if (q >= TOTAL) return finish();
    busy = false; tries = 0;
    api.dots(q, TOTAL);

    var cfg = config(level);
    // liste stable pour le sac ; le mélange ne sert qu'à placer les boutons
    var base = cfg.casing === 'upper' ? cfg.pool : noAmbig(cfg.pool);
    // sac sans remise : toutes les lettres passent avant qu'une revienne
    target = Sacs.tirer('dictee-n' + level, base);
    var others = shuffle(base.filter(function (l) { return l !== target; }))
                   .slice(0, cfg.choices - 1);
    var all = shuffle([target].concat(others));

    document.getElementById('d-hint').textContent = '';
    var box = document.getElementById('d-choices');
    box.innerHTML = '';
    box.className = 'choices c' + all.length;

    all.forEach(function (L) {
      var b = el('button', 'letter-btn', display(L, cfg.casing));
      b.dataset.letter = L;
      b.style.setProperty('--hue', Math.floor(Math.random() * 360));
      tap(b, function () { answer(b, L); });
      box.appendChild(b);
    });

    setTimeout(repeat, 350);
  }

  function repeat() {
    if (!target || !api.alive()) return;
    Voice.say('Touche la lettre… ' + LETTER_SAY[target], { rate: 0.85 });
  }

  function answer(btn, L) {
    if (busy) return;
    if (L === target) {
      busy = true;
      btn.classList.add('ok');
      Sound.good();
      api.confetti(14);
      if (tries === 0) score++;
      var w = LETTER_WORD[target];
      document.getElementById('d-hint').textContent = target + ' comme ' + w[0] + ' ' + w[1];
      Voice.say(pick(BRAVOS) + ' ' + LETTER_SAY[target] + ' comme ' + w[0], {
        then: function () { q++; next(); }
      });
    } else {
      tries++;
      btn.classList.add('ko');
      wiggle(btn);
      Sound.prout(0.3);
      if (tries >= 2) {
        // coup de pouce : la bonne lettre se met à sautiller
        var all = root.querySelectorAll('.letter-btn');
        for (var i = 0; i < all.length; i++) {
          if (all[i].dataset.letter === target) all[i].classList.add('helped');
        }
        Voice.say('Elle est là ! La lettre ' + LETTER_SAY[target]);
      } else {
        Voice.say(pick(ENCOURAGEMENTS));
      }
    }
  }

  function finish() {
    if (!api.alive()) return;
    api.dots(TOTAL, TOTAL);
    var stars = score >= 7 ? 3 : (score >= 5 ? 2 : 1);
    api.bumpLevel('dictee', score >= 7);
    api.win(stars, '🪄');
  }

  function stop() { target = null; }

  return {
    title: 'Dictée Magique', spoken: 'La dictée magique',
    emoji: '🪄', color: 'linear-gradient(160deg,#7b5cff,#3f2b96)',
    start: start, stop: stop, repeat: repeat
  };
})();
