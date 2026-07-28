/* ==========================================================================
   core.js — état, sauvegarde, navigation entre écrans, effets communs
   ========================================================================== */
var Games = {};   // les jeux s'enregistrent eux-mêmes ici

var App = (function () {
  var KEY = 'planete-prouts-v1';
  var state = { stars: 0, proutons: 0, best: {}, level: {} };
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
      }
    } catch (e) {}
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function reset() {
    state = { stars: 0, proutons: 0, best: {}, level: {} };
    save(); refreshScore();
  }

  /* Niveau atteint par jeu (1 à 4) : la difficulté monte toute seule */
  function levelOf(id) { return state.level[id] || 1; }
  function bumpLevel(id, ok) {
    var lv = levelOf(id);
    if (ok && lv < 4) state.level[id] = lv + 1;
    else if (!ok && lv > 1) state.level[id] = lv - 1;
    save();
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
    var all = document.querySelectorAll('.screen');
    for (var i = 0; i < all.length; i++) all[i].classList.remove('active');
    document.getElementById(id).classList.add('active');
  }

  function goMenu() {
    stopGame();
    Voice.stop();
    refreshScore();
    show('screen-menu');
  }

  function stopGame() {
    seq++;   // tout ce que l'ancien jeu avait programmé devient caduc
    if (current && current.stop) { try { current.stop(); } catch (e) {} }
    current = null; currentId = null;
    var root = document.getElementById('game-root');
    if (root) root.innerHTML = '';
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
    show('screen-win');
    Sound.fanfare();
    confetti(60);
    Voice.say(pick(BRAVOS_DROLES), { pitch: 1.3 });
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
    alive: function () { return true; }
  };

  /* ---------- construction du menu ---------- */
  function buildMenu() {
    var grid = document.getElementById('menu-grid');
    grid.innerHTML = '';
    Object.keys(Games).forEach(function (id) {
      var g = Games[id];
      var card = document.createElement('button');
      card.className = 'game-card';
      card.style.background = g.color;
      card.innerHTML =
        '<div class="card-emoji">' + g.emoji + '</div>' +
        '<div class="card-title">' + g.title + '</div>' +
        '<div class="card-lvl">' + '🔥'.repeat(levelOf(id)) + '</div>';
      card.addEventListener('click', function () {
        Sound.pop();
        Voice.say(g.spoken || g.title);
        play(id);
      });
      grid.appendChild(card);
    });
  }

  return {
    load: load, save: save, reset: reset,
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

/* tap() : réagit au doigt SANS le délai de 300 ms des tablettes */
function tap(node, fn) {
  var fired = false;
  node.addEventListener('pointerdown', function (ev) {
    if (fired) return;
    fired = true;
    setTimeout(function () { fired = false; }, 350);
    ev.preventDefault();
    fn(ev);
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
