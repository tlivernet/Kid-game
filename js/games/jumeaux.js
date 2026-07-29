/* ==========================================================================
   Les Jumeaux 👯 — memory : associer la MAJUSCULE et sa minuscule (A ↔ a).
   C'est LE point faible visé : faire le lien entre les deux écritures.
   ========================================================================== */
Games.jumeaux = (function () {
  var root, api, level, cards, first, lock, found, wrong, pairs;

  function nbPairs(lv) { return [4, 5, 6, 8][Math.min(lv, 4) - 1]; }

  function start(_root, _api, lv) {
    root = _root; api = _api; level = lv;
    pairs = nbPairs(lv); found = 0; wrong = 0; first = null; lock = false;

    var pool = Sacs.tirerPlusieurs('jumeaux-n' + lv,
                 noAmbig(LETTER_LEVELS[Math.min(lv, 4) - 1]), pairs);
    cards = [];
    pool.forEach(function (L) {
      cards.push({ L: L, txt: L, kind: 'M' });
      cards.push({ L: L, txt: L.toLowerCase(), kind: 'm' });
    });
    cards = shuffle(cards);

    root.innerHTML = '<div class="mem-grid" id="m-grid"></div>';
    var grid = document.getElementById('m-grid');
    var cols = pairs === 5 ? 5 : 4;
    grid.style.setProperty('--cols', cols);
    grid.style.setProperty('--rows', Math.ceil(cards.length / cols));

    cards.forEach(function (c) {
      var card = el('div', 'mem-card');
      card.innerHTML = '<div class="mc-inner">' +
        '<div class="mc-back">❓</div>' +
        '<div class="mc-face' + (c.kind === 'M' ? ' maj' : ' min') + '">' + c.txt + '</div>' +
        '</div>';
      c.el = card;
      tap(card, function () { flip(c); });
      grid.appendChild(card);
    });

    api.dots(0, pairs);
    Voice.say('Trouve les jumeaux ! La grande lettre et la petite lettre.');
  }

  function flip(c) {
    if (lock || c.done || c === first) return;
    c.el.classList.add('flipped');
    Sound.note(600, 0, 0.12, 'sine', 0.18);
    sayLetter(c.L);

    if (!first) { first = c; return; }

    lock = true;
    if (first.L === c.L) {
      var a = first;
      setTimeout(function () {
        if (!api.alive()) return;
        a.done = c.done = true;
        a.el.classList.add('matched');
        c.el.classList.add('matched');
        Sound.good();
        api.confetti(10);
        found++;
        api.dots(found, pairs);
        var w = LETTER_WORD[c.L];
        Voice.say(LETTER_SAY[c.L] + ' comme ' + w[0] + ' ! ' + pick(BRAVOS));
        first = null; lock = false;
        if (found === pairs) finish();
      }, 380);
    } else {
      var b = first;
      setTimeout(function () {
        if (!api.alive()) return;
        Sound.prout(0.22);
        b.el.classList.remove('flipped');
        c.el.classList.remove('flipped');
        first = null; lock = false;
      }, 950);
      wrong++;
    }
  }

  function finish() {
    setTimeout(function () {
      if (!api.alive()) return;
      var stars = wrong <= pairs ? 3 : (wrong <= pairs * 2 ? 2 : 1);
      api.bumpLevel('jumeaux', wrong <= pairs);
      api.win(stars, '👯');
    }, 500);
  }

  function stop() { cards = null; first = null; }
  function repeat() { Voice.say('Trouve la grande lettre et la petite lettre qui vont ensemble.'); }

  return {
    title: 'Les Jumeaux', spoken: 'Les jumeaux',
    emoji: '👯', color: 'linear-gradient(160deg,#33d6a6,#0e7a63)',
    need: 3,
    start: start, stop: stop, repeat: repeat
  };
})();
