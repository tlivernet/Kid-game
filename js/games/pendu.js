/* ==========================================================================
   Le Prout-du 🎩 — le pendu, version rigolote et non-anxiogène.
   À chaque erreur le bonhomme gonfle… et à la fin, il pète. Personne
   n'est "pendu" : rater est drôle, donc l'enfant ose essayer.
   ========================================================================== */
Games.pendu = (function () {
  var MAX = 6;
  var FACES = ['🙂', '😯', '😮', '😳', '😰', '🤢', '💥'];
  var root, api, level, mot, dit, emoji, trouvees, erreurs, over;

  function motsFor(lv) {
    var max = [4, 5, 6, 99][Math.min(lv, 4) - 1];
    var list = MOTS.filter(function (w) { return w.m.length <= max; });
    return list.length ? list : MOTS;
  }
  function nbTouches(lv) { return [9, 11, 13, 15][Math.min(lv, 4) - 1]; }

  function start(_root, _api, lv) {
    root = _root; api = _api; level = lv;
    var w = pick(motsFor(lv));
    mot = w.m; dit = w.d || w.m.toLowerCase(); emoji = w.e;
    trouvees = {}; erreurs = 0; over = false;

    root.innerHTML =
      '<div class="pendu-top">' +
        '<div class="pendu-guy" id="p-guy">🙂</div>' +
        '<div class="pendu-img" id="p-img">❓</div>' +
      '</div>' +
      '<div class="pendu-word" id="p-word"></div>' +
      '<div class="pendu-keys" id="p-keys"></div>';

    drawWord();
    drawKeys();
    api.dots(0, MAX);
    setTimeout(repeat, 300);
  }

  function drawWord() {
    var box = document.getElementById('p-word');
    box.innerHTML = '';
    mot.split('').forEach(function (L) {
      var s = el('span', 'slot' + (trouvees[L] ? ' found' : ''), trouvees[L] ? L : '');
      box.appendChild(s);
    });
  }

  function drawKeys() {
    var uniq = [];
    mot.split('').forEach(function (L) { if (uniq.indexOf(L) < 0) uniq.push(L); });
    var others = shuffle(ALPHABET.filter(function (L) { return uniq.indexOf(L) < 0; }));
    var keys = shuffle(uniq.concat(others.slice(0, Math.max(0, nbTouches(level) - uniq.length))));

    var box = document.getElementById('p-keys');
    box.innerHTML = '';
    keys.forEach(function (L) {
      var b = el('button', 'key', L);
      b.dataset.letter = L;
      tap(b, function () { guess(b, L); });
      box.appendChild(b);
    });
  }

  function guess(btn, L) {
    if (over || btn.disabled) return;
    btn.disabled = true;
    if (mot.indexOf(L) >= 0) {
      trouvees[L] = true;
      btn.classList.add('ok');
      Sound.good();
      drawWord();
      api.confetti(8);
      var complete = mot.split('').every(function (c) { return trouvees[c]; });
      if (complete) return gagne();
      sayLetter(L, { then: function () { Voice.say('Oui !'); } });
    } else {
      erreurs++;
      btn.classList.add('ko');
      Sound.prout(0.2 + erreurs * 0.05);
      document.getElementById('p-guy').textContent = FACES[Math.min(erreurs, 6)];
      wiggle(document.getElementById('p-guy'));
      document.getElementById('p-guy').style.fontSize =
        (14 + erreurs * 2.2) + 'vmin';
      api.dots(erreurs, MAX);
      if (erreurs >= MAX) return perdu();
      sayLetter(L, { then: function () { Voice.say('Non, pas de ' + LETTER_SAY[L]); } });
    }
  }

  function gagne() {
    over = true;
    document.getElementById('p-img').textContent = emoji;
    document.getElementById('p-guy').textContent = '🥳';
    var stars = erreurs <= 1 ? 3 : (erreurs <= 3 ? 2 : 1);
    Voice.say('Le mot était… ' + dit + ' !', {
      then: function () {
        if (!api.alive()) return;
        api.bumpLevel('pendu', erreurs <= 2);
        api.win(stars, emoji);
      }
    });
  }

  function perdu() {
    over = true;
    document.getElementById('p-guy').textContent = '💨';
    document.getElementById('p-img').textContent = emoji;
    Sound.prout(0.9);
    api.flash('PROUT !!! 💨', 'big');
    // on révèle tout : l'enfant repart avec le mot en tête
    mot.split('').forEach(function (L) { trouvees[L] = true; });
    drawWord();
    Voice.say('Ooooh il a pété ! Le mot était ' + dit + '.', {
      then: function () {
        if (!api.alive()) return;
        api.bumpLevel('pendu', false); api.win(1, '💨');
      }
    });
  }

  function repeat() {
    if (!mot) return;
    Voice.say('Trouve les lettres du mot… ' + dit, { rate: 0.85 });
  }

  function stop() { mot = null; over = true; }

  return {
    title: 'Le Prout-du', spoken: 'Le prout-du',
    emoji: '🎩', color: 'linear-gradient(160deg,#ffb02e,#d1640a)',
    start: start, stop: stop, repeat: repeat
  };
})();
