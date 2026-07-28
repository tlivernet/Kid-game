/* ==========================================================================
   La Boîte à Prouts 💩 — la récréation.
   Chaque étoile gagnée en apprenant débloque un nouveau bruit rigolo.
   Le "défi" caca/pipi devient la récompense : c'est le moteur du jeu.
   ========================================================================== */
Games.prouts = (function () {
  var root, api;

  var BOUTONS = [
    { e: '💩', n: 'Prout',          need: 0,  f: function () { Sound.prout(); } },
    { e: '🎺', n: 'Prout trompette',need: 0,  f: function () { Sound.proutTrompette(); } },
    { e: '🫧', n: 'Petit prout',    need: 3,  f: function () { Sound.petitProut(); } },
    { e: '🐸', n: 'Rot de crapaud', need: 6,  f: function () { Sound.rot(); } },
    { e: '🎈', n: 'Ballon fou',     need: 10, f: function () { Sound.ballon(); } },
    { e: '🥁', n: 'Boing !',        need: 14, f: function () { Sound.boing(); } },
    { e: '✨', n: 'Magie',          need: 18, f: function () { Sound.sparkle(); } },
    { e: '🎉', n: 'Fanfare',        need: 24, f: function () { Sound.fanfare(); } },
    { e: '👨‍👩‍👦', n: 'Chorale de prouts', need: 30, f: function () {
        for (var i = 0; i < 6; i++) setTimeout(function () { Sound.prout(); }, i * 260);
      } },
    { e: '🎵', n: 'Prout musical',  need: 40, f: function () {
        [0.2, 0.2, 0.35, 0.2, 0.55].forEach(function (d, i) {
          setTimeout(function () { Sound.prout(d); }, i * 300);
        });
      } }
  ];

  function start(_root, _api) {
    root = _root; api = _api;
    var stars = App.state().stars;
    api.dots(0, 0);
    root.innerHTML = '<div class="sb-title">La Boîte à Prouts</div>' +
                     '<div class="soundboard" id="sb"></div>';
    var box = document.getElementById('sb');

    BOUTONS.forEach(function (b) {
      var open = stars >= b.need;
      var btn = el('button', 'sb-btn' + (open ? '' : ' locked'));
      btn.innerHTML = '<span class="sb-emoji">' + (open ? b.e : '🔒') + '</span>' +
                      '<span class="sb-name">' + (open ? b.n : '⭐ ' + b.need) + '</span>';
      tap(btn, function () {
        if (!open) {
          Sound.boing();
          Voice.say('Il te faut ' + b.need + ' étoiles ! Va jouer pour les gagner.');
          return;
        }
        btn.classList.remove('pressed'); void btn.offsetWidth; btn.classList.add('pressed');
        b.f();
        if (Math.random() < 0.25) api.confetti(6);
      });
      box.appendChild(btn);
    });

    Voice.say('Appuie sur les boutons rigolos !');
  }

  function stop() {}
  function repeat() { Voice.say('Appuie sur les boutons pour faire des bruits !'); }

  return {
    title: 'Boîte à Prouts', spoken: 'La boîte à prouts',
    emoji: '💩', color: 'linear-gradient(160deg,#a97b52,#5d3a1c)',
    start: start, stop: stop, repeat: repeat
  };
})();
