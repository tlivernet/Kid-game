/* ==========================================================================
   core.js — état, sauvegarde, navigation entre écrans, effets communs
   ========================================================================== */
var Games = {};   // les jeux s'enregistrent eux-mêmes ici

/* Instant du dernier changement d'écran : sert à ignorer les "touches
   fantômes" du geste qui vient justement de changer d'écran.
   Court exprès : le vrai rempart, c'est l'avalage du 'click' dans tap().
   Un garde-temps long avalerait aussi les appuis volontaires — un enfant
   qui tape « Encore ! » dès l'apparition de l'écran doit être entendu. */
var screenAt = 0;
var GHOST_MS = 150;

var App = (function () {
  var KEY = 'planete-prouts-v1';
  var state = { stars: 0, proutons: 0, best: {}, level: {}, stickers: [], boss: 0 };
  var current = null;      // jeu en cours
  var currentId = null;
  var seq = 0;             // jeton de session : invalide les callbacks en retard

  /* ---------- sauvegarde ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var s = JSON.parse(raw);
        state.stars = s.stars || 0;
        state.proutons = s.proutons || 0;
        state.best = s.best || {};
        state.level = s.level || {};
        state.stickers = s.stickers || [];
        state.boss = s.boss || 0;
      }
    } catch (e) {}
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function reset() {
    state = { stars: 0, proutons: 0, best: {}, level: {}, stickers: [], boss: 0 };
    save(); refreshScore();
  }

  /* Niveau atteint par jeu (1 à 4) : la difficulté monte toute seule */
  function levelOf(id) { return state.level[id] || 1; }
  function bumpLevel(id, ok) {
    var lv = levelOf(id);
    var max = (Games[id] && Games[id].maxLevel) || 4;
    if (ok && lv < max) state.level[id] = lv + 1;
    else if (!ok && lv > 1) state.level[id] = lv - 1;
    save();
  }

  /* ---------- déblocage des jeux ---------- */
  function unlocked(id) {
    var g = Games[id];
    return !g || !g.need || state.stars >= g.need;
  }

  /* ---------- autocollants ---------- */
  function giveSticker() {
    var libres = [];
    for (var i = 0; i < AUTOCOLLANTS.length; i++) {
      if (state.stickers.indexOf(i) < 0) libres.push(i);
    }
    if (!libres.length) return null;
    var idx = pick(libres);
    state.stickers.push(idx);
    save();
    return AUTOCOLLANTS[idx];
  }

  function addStars(n) {
    state.stars += n;
    state.proutons += n;   // 1 étoile = 1 prouton à dépenser en bruits rigolos
    save(); refreshScore();
  }

  function refreshScore() {
    var s = document.getElementById('score-stars');
    var p = document.getElementById('score-proutons');
    if (s) s.textContent = state.stars;
    if (p) p.textContent = state.proutons;
  }

  /* ---------- navigation ---------- */
  function show(id) {
    // Le doigt qui appuie sur 🏠 se lève APRÈS l'apparition du menu : le
    // navigateur envoie alors un click sur la carte qui se trouve dessous,
    // et un jeu se lançait tout seul. On ignore donc toute touche pendant
    // un court instant après un changement d'écran (cf. tap()).
    screenAt = Date.now();
    var all = document.querySelectorAll('.screen');
    for (var i = 0; i < all.length; i++) all[i].classList.remove('active');
    document.getElementById(id).classList.add('active');
  }

  function goMenu() {
    stopGame();
    Voice.stop();
    refreshScore();
    // On RECONSTRUIT le menu à chaque retour : les étoiles viennent de
    // changer, donc les cadenas et les 🔥 de niveau aussi. Sans ça, les
    // cartes gardaient l'état qu'elles avaient au démarrage du jeu.
    buildMenu();
    show('screen-menu');
  }

  function stopGame() {
    seq++;   // tout ce que l'ancien jeu avait programmé devient caduc
    if (current && current.stop) { try { current.stop(); } catch (e) {} }
    current = null; currentId = null;
    var root = document.getElementById('game-root');
    if (root) { root.innerHTML = ''; root.className = 'game-root'; }
    setDots(0, 0);
  }

  function play(id) {
    stopGame();
    var g = Games[id];
    if (!g) return;
    current = g; currentId = id;
    show('screen-game');
    var root = document.getElementById('game-root');
    root.className = 'game-root theme-' + id;

    // chaque partie reçoit son propre "api" avec un alive() : les retours
    // de la synthèse vocale arrivent parfois après un changement d'écran.
    var token = seq;
    var gapi = Object.create(api);
    gapi.alive = function () { return token === seq; };
    g.start(root, gapi, levelOf(id));
  }

  function replay() { if (currentId) play(currentId); }

  /* ---------- barre de progression (pastilles) ---------- */
  function setDots(done, total) {
    var box = document.getElementById('progress-dots');
    if (!box) return;
    box.innerHTML = '';
    for (var i = 0; i < total; i++) {
      var d = document.createElement('span');
      d.className = 'dot' + (i < done ? ' on' : '');
      box.appendChild(d);
    }
  }

  /* ---------- écran de victoire ---------- */
  function win(stars, emoji) {
    addStars(stars);
    document.getElementById('win-emoji').textContent = emoji || pick(['🏆', '🎉', '🥇', '🚀', '🦸']);
    var box = document.getElementById('win-stars');
    box.innerHTML = '';
    for (var i = 0; i < 3; i++) {
      var s = document.createElement('span');
      s.className = 'wstar' + (i < stars ? ' on' : '');
      s.textContent = '⭐';
      s.style.animationDelay = (i * 0.25) + 's';
      box.appendChild(s);
    }
    document.getElementById('win-text').textContent = pick(BRAVOS);

    // 3 étoiles = un autocollant neuf pour la collection
    var boite = document.getElementById('win-sticker');
    boite.innerHTML = '';
    boite.classList.remove('on');
    var neuf = stars >= 3 ? giveSticker() : null;

    show('screen-win');
    Sound.fanfare();
    confetti(60);

    if (neuf) {
      boite.innerHTML = '<div class="ws-label">Nouvel autocollant !</div>' +
                        '<div class="ws-emoji">' + neuf[0] + '</div>' +
                        '<div class="ws-name">' + neuf[1] + '</div>';
      boite.classList.add('on');
      setTimeout(function () { Sound.sparkle(); confetti(20); }, 900);
      Voice.say('Bravo ! Tu gagnes un autocollant : ' + neuf[1] + ' !', { pitch: 1.3 });
    } else {
      Voice.say(pick(BRAVOS_DROLES), { pitch: 1.3 });
    }

    annoncerDeblocage();
  }

  /* Un jeu vient-il de s'ouvrir grâce aux étoiles gagnées ? On le dit fort :
     c'est le moment le plus motivant de toute la boucle de jeu. */
  var dejaVus = null;
  function annoncerDeblocage() {
    var ouverts = Object.keys(Games).filter(unlocked);
    if (!dejaVus) { dejaVus = ouverts; return; }
    var neufs = ouverts.filter(function (id) { return dejaVus.indexOf(id) < 0; });
    dejaVus = ouverts;
    if (!neufs.length) return;
    var g = Games[neufs[0]];
    setTimeout(function () {
      flash('🔓 ' + g.emoji + ' ' + g.title, 'big');
      Sound.sparkle();
      Voice.say('Nouveau jeu débloqué : ' + (g.spoken || g.title) + ' !');
    }, 2600);
  }

  /* ---------- confettis ---------- */
  var CONF = ['💩', '⭐', '🎉', '🌈', '🍬', '💥', '🎈', '🦄'];
  function confetti(n) {
    var layer = document.getElementById('confetti-layer');
    if (!layer) return;
    for (var i = 0; i < n; i++) {
      (function (i) {
        var el = document.createElement('div');
        el.className = 'confetti';
        el.textContent = pick(CONF);
        el.style.left = (Math.random() * 100) + '%';
        el.style.fontSize = (18 + Math.random() * 30) + 'px';
        el.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
        el.style.animationDelay = (Math.random() * 0.5) + 's';
        layer.appendChild(el);
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 4000);
      })(i);
    }
  }

  /* ---------- petit "toast" au milieu de l'écran ---------- */
  function flash(txt, cls) {
    var el = document.createElement('div');
    el.className = 'flash ' + (cls || '');
    el.textContent = txt;
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1200);
  }

  /* ---------- API passée aux jeux ---------- */
  var api = {
    dots: setDots,
    win: win,
    confetti: confetti,
    flash: flash,
    addStars: addStars,
    level: levelOf,
    bumpLevel: bumpLevel,
    menu: goMenu,
    sticker: giveSticker,
    alive: function () { return true; }
  };

  /* ---------- construction du menu ---------- */
  function buildMenu() {
    var grid = document.getElementById('menu-grid');
    grid.innerHTML = '';
    dejaVus = Object.keys(Games).filter(unlocked);
    Object.keys(Games).forEach(function (id) {
      var g = Games[id];
      var ouvert = unlocked(id);
      var card = document.createElement('button');
      card.className = 'game-card' + (ouvert ? '' : ' locked') + (g.boss ? ' boss' : '');
      card.style.background = g.color;
      card.innerHTML = ouvert
        ? '<div class="card-emoji">' + g.emoji + '</div>' +
          '<div class="card-title">' + g.title + '</div>' +
          '<div class="card-lvl">' + '🔥'.repeat(levelOf(id)) + '</div>'
        : '<div class="card-emoji">🔒</div>' +
          '<div class="card-title">' + g.title + '</div>' +
          '<div class="card-lvl">⭐ ' + g.need + '</div>';
      tap(card, function () {
        if (!ouvert) {
          // filet de sécurité : si les étoiles suffisent malgré le cadenas,
          // c'est l'affichage qui est en retard — on ouvre au lieu de dire
          // à l'enfant qu'il lui manque « 0 » étoile.
          if (unlocked(id)) { buildMenu(); Sound.sparkle(); play(id); return; }
          Sound.boing();
          var reste = g.need - state.stars;
          flash('🔒 Encore ' + reste + ' ⭐');
          Voice.say('Il te manque ' + reste +
                    (reste > 1 ? ' étoiles' : ' étoile') + ' pour ce jeu !');
          return;
        }
        Sound.pop();
        Voice.say(g.spoken || g.title);
        play(id);
      });
      grid.appendChild(card);
    });
  }

  /* ---------- album d'autocollants ---------- */
  function openAlbum() {
    var ov = el('div', 'gate');
    var box = el('div', 'gate-box album-box');
    box.appendChild(el('div', 'gate-title', '🏅 Mes autocollants'));
    box.appendChild(el('div', 'gate-sub',
      state.stickers.length + ' sur ' + AUTOCOLLANTS.length));
    var grille = el('div', 'album');
    AUTOCOLLANTS.forEach(function (a, i) {
      var pris = state.stickers.indexOf(i) >= 0;
      var c = el('div', 'sticker' + (pris ? '' : ' vide'));
      c.innerHTML = '<span class="st-emoji">' + (pris ? a[0] : '❔') + '</span>' +
                    '<span class="st-name">' + (pris ? a[1] : '') + '</span>';
      if (pris) tap(c, function () { Sound.pop(); Voice.say(a[1]); wiggle(c); });
      grille.appendChild(c);
    });
    box.appendChild(grille);
    var fermer = el('button', 'gate-cancel', '👍 Fermer');
    tap(fermer, function () { Sound.pop(); if (ov.parentNode) ov.parentNode.removeChild(ov); });
    box.appendChild(fermer);
    ov.appendChild(box);
    tap(ov, function (e) { if (e.target === ov && ov.parentNode) ov.parentNode.removeChild(ov); });
    document.body.appendChild(ov);
    Voice.say(state.stickers.length
      ? 'Tu as ' + state.stickers.length + ' autocollants !'
      : 'Gagne trois étoiles pour ton premier autocollant !');
  }

  return {
    load: load, save: save, reset: reset,
    unlocked: unlocked, openAlbum: openAlbum, giveSticker: giveSticker,
    goMenu: goMenu, play: play, replay: replay,
    buildMenu: buildMenu, refreshScore: refreshScore,
    confetti: confetti, flash: flash,
    state: function () { return state; },
    currentGame: function () { return current; }
  };
})();


/* ==========================================================================
   Petits utilitaires DOM partagés par les jeux
   ========================================================================== */
function el(tag, cls, txt) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined && txt !== null) e.textContent = txt;
  return e;
}

/* tap() : réagit au doigt SANS le délai de 300 ms des tablettes.
   Tous les boutons du jeu passent par ici — jamais 'click' — sinon on
   mélange deux temporalités : 'pointerdown' se déclenche quand le doigt
   se pose, 'click' quand il se lève, donc sur un autre écran. */
function tap(node, fn) {
  var fired = false;
  node.addEventListener('pointerdown', function (ev) {
    if (fired) return;
    if (Date.now() - screenAt < GHOST_MS) return;   // touche fantôme
    fired = true;
    setTimeout(function () { fired = false; }, 350);
    ev.preventDefault();
    fn(ev);
  });
  // ceinture et bretelles : on avale aussi le click de compatibilité
  node.addEventListener('click', function (ev) {
    ev.preventDefault(); ev.stopPropagation();
  });
  return node;
}

/* Prononce une lettre avec son vrai nom ("B" → "bé") */
function sayLetter(L, opts) {
  Voice.say(LETTER_SAY[L.toUpperCase()] || L, opts);
}

function wiggle(node) {
  node.classList.remove('wiggle');
  void node.offsetWidth;
  node.classList.add('wiggle');
}
