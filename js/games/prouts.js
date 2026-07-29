/* ==========================================================================
   La Boutique à Prouts 💩 — les proutons servent enfin à quelque chose.
   Avant, les bruits se débloquaient tout seuls avec les étoiles : une fois
   les 40 étoiles passées, tout était acquis et il ne restait rien à viser.
   Maintenant on ACHÈTE, donc on choisit, donc on économise — et on peut
   aussi acheter un autocollant surprise quand la collection stagne.
   ========================================================================== */
Games.prouts = (function () {
  var root, api;

  var RAYON = [
    { ref: 'prout',    e: '💩', n: 'Prout',            prix: 0,  f: function () { Sound.prout(); } },
    { ref: 'trompe',   e: '🎺', n: 'Prout trompette',  prix: 0,  f: function () { Sound.proutTrompette(); } },
    { ref: 'petit',    e: '🫧', n: 'Petit prout',      prix: 5,  f: function () { Sound.petitProut(); } },
    { ref: 'rot',      e: '🐸', n: 'Rot de crapaud',   prix: 10, f: function () { Sound.rot(); } },
    { ref: 'ballon',   e: '🎈', n: 'Ballon fou',       prix: 15, f: function () { Sound.ballon(); } },
    { ref: 'boing',    e: '🥁', n: 'Boing !',          prix: 20, f: function () { Sound.boing(); } },
    { ref: 'magie',    e: '✨', n: 'Magie',            prix: 25, f: function () { Sound.sparkle(); } },
    { ref: 'fanfare',  e: '🎉', n: 'Fanfare',          prix: 30, f: function () { Sound.fanfare(); } },
    { ref: 'chorale',  e: '👨‍👩‍👦', n: 'Chorale de prouts', prix: 40, f: function () {
        for (var i = 0; i < 6; i++) setTimeout(function () { Sound.prout(); }, i * 260);
      } },
    { ref: 'musical',  e: '🎵', n: 'Prout musical',    prix: 60, f: function () {
        [0.2, 0.2, 0.35, 0.2, 0.55].forEach(function (d, i) {
          setTimeout(function () { Sound.prout(d); }, i * 300);
        });
      } }
  ];

  var PRIX_AUTOCOLLANT = 25;

  function start(_root, _api) {
    root = _root; api = _api;
    api.dots(0, 0);
    dessiner();
  }

  function dessiner() {
    root.innerHTML =
      '<div class="sb-title">La Boutique à Prouts ' +
        '<span class="sb-solde">' + App.state().proutons + ' 💩</span></div>' +
      '<div class="soundboard" id="sb"></div>';
    var box = document.getElementById('sb');

    RAYON.forEach(function (b) {
      var possede = b.prix === 0 || App.achete(b.ref);
      var btn = el('button', 'sb-btn' + (possede ? '' : ' locked'));
      btn.innerHTML = '<span class="sb-emoji">' + b.e + '</span>' +
                      '<span class="sb-name">' + b.n + '</span>' +
                      (possede ? '' : '<span class="sb-prix">' + b.prix + ' 💩</span>');
      tap(btn, function () {
        if (possede) {
          btn.classList.remove('pressed'); void btn.offsetWidth; btn.classList.add('pressed');
          b.f();
          if (Math.random() < 0.25) api.confetti(6);
          return;
        }
        if (!App.depenser(b.prix, b.ref)) {
          Sound.boing();
          var reste = b.prix - App.state().proutons;
          api.flash('Il te manque ' + reste + ' 💩');
          Voice.say('Il te manque ' + reste + ' proutons ! Joue encore pour en gagner.',
                    { coupe: true });
          return;
        }
        Sound.sparkle();
        api.confetti(20);
        api.flash('Acheté ! ' + b.e, 'big');
        Voice.say('Bravo, tu as acheté : ' + b.n + ' !');
        b.f();
        dessiner();
      });
      box.appendChild(btn);
    });

    /* Autocollant surprise : de quoi continuer la collection quand elle
       n'avance plus toute seule. */
    var s = App.state();
    var complet = s.stickers.length >= AUTOCOLLANTS.length;
    var carte = el('button', 'sb-btn achat-sticker' + (complet ? ' locked' : ''));
    carte.innerHTML = '<span class="sb-emoji">🎁</span>' +
                      '<span class="sb-name">Autocollant surprise</span>' +
                      '<span class="sb-prix">' +
                      (complet ? 'Collection pleine !' : PRIX_AUTOCOLLANT + ' 💩') + '</span>';
    tap(carte, function () {
      if (complet) { Sound.boing(); Voice.say('Tu as déjà TOUS les autocollants ! Bravo !'); return; }
      if (!App.depenser(PRIX_AUTOCOLLANT)) {
        Sound.boing();
        api.flash('Il te manque ' + (PRIX_AUTOCOLLANT - App.state().proutons) + ' 💩');
        Voice.say('Pas assez de proutons ! Joue encore un peu.', { coupe: true });
        return;
      }
      var neuf = App.giveSticker();
      Sound.fanfare();
      api.confetti(40);
      api.flash(neuf[0] + ' ' + neuf[1], 'big');
      Voice.say('Tu gagnes un nouvel autocollant : ' + neuf[1] + ' !');
      dessiner();
    });
    box.appendChild(carte);
  }

  function stop() {}
  function repeat() {
    Voice.say('Achète des bruits rigolos avec tes proutons !', { coupe: true });
  }

  return {
    title: 'Boutique', spoken: 'La boutique à prouts',
    emoji: '💩', color: 'linear-gradient(160deg,#a97b52,#5d3a1c)',
    salon: true,
    start: start, stop: stop, repeat: repeat
  };
})();
