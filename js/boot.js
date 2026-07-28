/* ==========================================================================
   boot.js — démarrage, câblage des boutons globaux
   ========================================================================== */
(function () {
  App.load();
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

  /* --- remise à zéro (appui long de 1,5 s : hors de portée d'un enfant) --- */
  var rst = document.getElementById('btn-reset'), holdT = null;
  function armReset() {
    rst.classList.add('holding');
    holdT = setTimeout(function () {
      App.reset(); App.buildMenu(); Sound.ballon();
      App.flash('Tout est effacé 🧹');
      rst.classList.remove('holding');
    }, 1500);
  }
  function cancelReset() { clearTimeout(holdT); rst.classList.remove('holding'); }
  rst.addEventListener('pointerdown', armReset);
  rst.addEventListener('pointerup', cancelReset);
  rst.addEventListener('pointerleave', cancelReset);
  rst.addEventListener('pointercancel', cancelReset);

  /* --- évite le zoom/scroll parasite avec les doigts --- */
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); });

  /* --- on coupe la voix si la tablette part en veille --- */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) Voice.stop();
  });
})();
