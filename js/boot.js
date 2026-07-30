/* ==========================================================================
   boot.js — démarrage, câblage des boutons globaux
   ========================================================================== */
(function () {
  App.load();
  App.majMissions();
  App.refreshScore();
  App.buildMenu();

  /* --- écran de démarrage : le tap débloque le son sur tablette --- */
  tap(document.getElementById('btn-go'), function () {
    Sound.unlock();
    setTimeout(function () {
      Sound.prout(0.45);
      Voice.say('Salut ! Choisis un jeu !', { pitch: 1.4 });
    }, 120);
    App.goMenu();
  });

  /* --- barre du haut pendant un jeu --- */
  tap(document.getElementById('btn-home'), function () { Sound.pop(); App.goMenu(); });
  tap(document.getElementById('btn-repeat'), function () {
    var g = App.currentGame();
    if (g && g.repeat) g.repeat();
  });

  /* --- écran de victoire --- */
  tap(document.getElementById('btn-again'), function () { Sound.pop(); App.replay(); });
  tap(document.getElementById('btn-win-home'), function () { Sound.pop(); App.goMenu(); });

  /* --- le bouton prout universel : toujours là, toujours drôle --- */
  var proutBtn = document.getElementById('btn-prout');
  tap(proutBtn, function () {
    Sound.unlock();
    Sound.prout();
    proutBtn.classList.remove('boom'); void proutBtn.offsetWidth;
    proutBtn.classList.add('boom');
    if (Math.random() < 0.2) App.confetti(8);
  });

  tap(document.getElementById('btn-album'), function () { Sound.pop(); App.openAlbum(); });
  tap(document.getElementById('btn-missions'), function () { Sound.pop(); App.openMissions(); });

  /* --- remise à zéro : une multiplication barre la route aux enfants ---
     (l'appui long ne marchait pas : sur tablette il déclenche le menu
     contextuel du navigateur, qui envoie un pointercancel.) */
  tap(document.getElementById('btn-reset'), function () {
    Sound.pop();
    App.porteParentale('🧹 Tout effacer ?',
      'Étoiles, prouts et niveaux repartent à zéro.',
      function () {
        App.reset(); App.buildMenu();
        Sound.ballon();
        App.flash('Tout est effacé 🧹');
      });
  });

  /* --- mode test : essayer les jeux sans toucher aux scores de l'enfant --- */
  tap(document.getElementById('btn-test'), function () {
    Sound.pop();
    App.porteParentale('🧪 Mode test',
      'Pour essayer les jeux sans rien enregistrer. Tous les jeux sont ouverts et on choisit son niveau.',
      function () {
        App.setTest(true);
        Sound.sparkle();
        App.flash('🧪 Mode test activé', 'big');
        Voice.say('Mode test ! Rien ne sera enregistré.', { coupe: true });
      });
  });

  tap(document.getElementById('btn-quitter-test'), function () {
    Sound.pop();
    App.setTest(false);
    App.flash('Mode test terminé ✅');
    Voice.say('Retour au jeu normal.', { coupe: true });
  });

  /* --- évite le zoom/scroll parasite avec les doigts --- */
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); });

  /* --- installation sur la tablette + fonctionnement hors ligne ---
     (ignoré si la page est ouverte en double-clic : file:// interdit
     les service workers, le jeu marche quand même, sans le cache) */
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  /* --- on coupe la voix si la tablette part en veille --- */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) Voice.stop();
  });
})();
