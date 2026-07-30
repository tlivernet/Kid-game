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
  var state = { stars: 0, proutons: 0, best: {}, level: {}, stickers: [],
                boss: 0, faibles: {}, parties: {}, missions: [], achats: [] };
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
        state.faibles = s.faibles || {};    // parties faibles d'affilée, par jeu
        state.parties = s.parties || {};    // nombre de parties jouées, par jeu
        state.missions = s.missions || [];
        state.achats = s.achats || [];      // sons achetés en boutique
      }
    } catch (e) {}
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function reset() {
    state = { stars: 0, proutons: 0, best: {}, level: {}, stickers: [],
              boss: 0, faibles: {}, parties: {}, missions: [], achats: [] };
    save(); refreshScore();
  }

  /* Niveau atteint par jeu : la difficulté monte toute seule.
     La descente demande DEUX parties faibles d'affilée — une seule partie
     ratée (l'enfant se déconcentre, quelqu'un l'appelle) ne doit pas
     défaire ce qu'il a acquis, sinon il a l'impression de repartir à zéro. */
  function levelOf(id) { return state.level[id] || 1; }
  function maxLevel(id) { return (Games[id] && Games[id].maxLevel) || 4; }

  function bumpLevel(id, ok) {
    var lv = levelOf(id), max = maxLevel(id), avant = lv;
    if (ok) {
      state.faibles[id] = 0;
      if (lv < max) state.level[id] = lv + 1;
    } else {
      state.faibles[id] = (state.faibles[id] || 0) + 1;
      if (state.faibles[id] >= 2 && lv > 1) {
        state.level[id] = lv - 1;
        state.faibles[id] = 0;
      }
    }
    save();
    dernierNiveau = { jeu: id, apres: levelOf(id), max: max,
                      monte: levelOf(id) > avant };
    return dernierNiveau;
  }
  var dernierNiveau = null;

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

  /* Le rang ne s'arrête jamais de monter : quand les autocollants et les
     sons sont tous obtenus, il reste toujours un palier devant soi. */
  function majRang() {
    var box = document.getElementById('rang');
    if (!box) return;
    var r = rangDe(state.stars), suiv = rangSuivant(state.stars);
    var pct = 100, reste = 0;
    if (suiv) {
      reste = suiv[0] - state.stars;
      pct = Math.round((state.stars - r[0]) / (suiv[0] - r[0]) * 100);
    }
    box.innerHTML =
      '<span class="rang-emoji">' + r[1] + '</span>' +
      '<span class="rang-txt"><span class="rang-nom">' + r[2] + '</span>' +
      '<span class="rang-barre"><i style="width:' + pct + '%"></i></span></span>' +
      (suiv ? '<span class="rang-reste">' + reste + '⭐</span>' : '');
  }

  function refreshScore() {
    var s = document.getElementById('score-stars');
    var p = document.getElementById('score-proutons');
    if (s) s.textContent = state.stars;
    if (p) p.textContent = state.proutons;
    majRang();
    majBadgeMissions();
  }

  /* ==========================================================================
     MISSIONS — trois objectifs en cours, toujours sur des jeux DIFFÉRENTS et
     en priorité les moins joués. C'est la réponse au « il ne joue qu'à trois
     jeux » : on ne l'oblige à rien, on lui donne une raison d'aller voir
     ailleurs, payée en proutons.
     ========================================================================== */
  function nouvelleMission() {
    var pris = state.missions.map(function (m) { return m.jeu; });
    var candidats = Object.keys(Games).filter(function (id) {
      return unlocked(id) && !Games[id].boss && !Games[id].salon &&
             pris.indexOf(id) < 0;
    });
    if (!candidats.length) return null;
    candidats.sort(function (a, b) {
      return (state.parties[a] || 0) - (state.parties[b] || 0);
    });
    var jeu = candidats[Math.floor(Math.random() * Math.min(3, candidats.length))];
    return { jeu: jeu, cible: 3 + Math.floor(Math.random() * 3), fait: 0, prix: 10 };
  }

  function majMissions() {
    while (state.missions.length < 3) {
      var m = nouvelleMission();
      if (!m) break;
      state.missions.push(m);
    }
    save();
  }

  /* Appelé en fin de partie : fait avancer la mission du jeu concerné. */
  function avancerMissions(id, etoiles) {
    var finies = [];
    state.missions.forEach(function (m) {
      if (m.jeu !== id || m.fini) return;
      m.fait += etoiles;
      if (m.fait >= m.cible) { m.fini = true; finies.push(m); }
    });
    if (!finies.length) { save(); return; }
    finies.forEach(function (m) {
      state.proutons += m.prix;
      state.missions.splice(state.missions.indexOf(m), 1);
    });
    majMissions();
    save(); refreshScore();
    var total = finies.reduce(function (a, m) { return a + m.prix; }, 0);
    setTimeout(function () {
      flash('🎯 Mission réussie ! +' + total + ' 💩', 'big');
      Sound.sparkle();
      Voice.say('Mission réussie ! Tu gagnes ' + total + ' proutons !');
    }, 1400);
  }

  function majBadgeMissions() {
    var b = document.getElementById('btn-missions');
    if (!b) return;
    var proches = state.missions.filter(function (m) { return m.fait > 0; }).length;
    b.dataset.n = proches ? String(proches) : '';
  }

  function openMissions() {
    majMissions();
    var ov = el('div', 'gate');
    var box = el('div', 'gate-box album-box');
    box.appendChild(el('div', 'gate-title', '🎯 Mes missions'));
    box.appendChild(el('div', 'gate-sub', 'Termine-les pour gagner des proutons 💩'));
    state.missions.forEach(function (m) {
      var g = Games[m.jeu];
      if (!g) return;
      var ligne = el('div', 'mission');
      var pct = Math.min(100, Math.round(m.fait / m.cible * 100));
      ligne.innerHTML =
        '<span class="mi-emoji">' + g.emoji + '</span>' +
        '<span class="mi-txt"><b>' + g.title + '</b><br>' +
          'Gagne ' + m.cible + ' ⭐ · ' + m.fait + '/' + m.cible +
          '<span class="mi-barre"><i style="width:' + pct + '%"></i></span></span>' +
        '<span class="mi-prix">+' + m.prix + '💩</span>';
      tap(ligne, function () {
        if (ov.parentNode) ov.parentNode.removeChild(ov);
        play(m.jeu);
      });
      box.appendChild(ligne);
    });
    var fermer = el('button', 'gate-cancel', '👍 Fermer');
    tap(fermer, function () { Sound.pop(); if (ov.parentNode) ov.parentNode.removeChild(ov); });
    box.appendChild(fermer);
    ov.appendChild(box);
    tap(ov, function (e) { if (e.target === ov && ov.parentNode) ov.parentNode.removeChild(ov); });
    document.body.appendChild(ov);
    Voice.say('Voici tes missions ! Touche celle que tu veux faire.');
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
    document.body.classList.remove('sans-prout');
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

    // Certains jeux se pilotent au doigt sur TOUTE la surface : le bouton 💩,
    // fixé en bas à droite, y masquait le kart et rendait ce coin insensible
    // (il recouvrait même le bouton éponge du Tableau Magique). On l'efface
    // le temps de la partie ; il revient au menu.
    document.body.classList.toggle('sans-prout', !!g.pleinEcran);

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
    var jeu = currentId;
    state.parties[jeu] = (state.parties[jeu] || 0) + 1;
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

    // ---- montée de niveau : c'est LE signal de progression, il doit se voir
    var niv = document.getElementById('win-level');
    niv.className = 'win-level';
    if (dernierNiveau && dernierNiveau.jeu === jeu) {
      if (dernierNiveau.monte) {
        niv.className = 'win-level on monte';
        niv.innerHTML = '⬆️ NIVEAU ' + dernierNiveau.apres + ' !';
        Voice.say('Et tu passes au niveau ' + dernierNiveau.apres + ' !');
      } else {
        niv.className = 'win-level on';
        niv.innerHTML = 'Niveau ' + dernierNiveau.apres + ' / ' + dernierNiveau.max;
      }
    }
    dernierNiveau = null;

    avancerMissions(jeu, stars);
    annoncerDeblocage();
  }

  /* ==========================================================================
     DÉFAITE — on peut vraiment rater une partie (plus de cœurs). On ne
     retire JAMAIS ce qui est déjà gagné : à cet âge, voir son trésor
     diminuer fait abandonner. L'enjeu, c'est de repartir les mains vides.
     ========================================================================== */
  function perdu(emoji, phrase) {
    var jeu = currentId;
    state.parties[jeu] = (state.parties[jeu] || 0) + 1;
    // une partie perdue est une partie faible : deux d'affilée et le jeu
    // redescend d'un niveau, pour qu'il ne reste pas bloqué trop haut
    bumpLevel(jeu, false);
    save();
    document.getElementById('win-emoji').textContent = emoji || '😵';
    var box = document.getElementById('win-stars');
    box.innerHTML = '';
    for (var i = 0; i < 3; i++) {
      var s2 = document.createElement('span');
      s2.className = 'wstar';
      s2.textContent = '⭐';
      box.appendChild(s2);
    }
    document.getElementById('win-text').textContent = 'Raté !';
    document.getElementById('win-sticker').innerHTML = '';
    document.getElementById('win-sticker').classList.remove('on');
    var niv = document.getElementById('win-level');
    niv.className = 'win-level on';
    niv.innerHTML = '0 ⭐ cette fois… réessaye !';
    dernierNiveau = null;
    show('screen-win');
    Sound.prout(0.8);
    Voice.say(phrase || 'Oh non, tu n\'as plus de cœurs ! Réessaye, tu vas y arriver !',
              { coupe: true });
    refreshScore();
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
    perdu: perdu,
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
      var enMission = state.missions.some(function (m) { return m.jeu === id; });
      // « 🔥🔥🔥 » ne disait rien à personne : on écrit le niveau en clair,
      // avec une jauge de progression jusqu'au niveau maximum du jeu.
      var lv = levelOf(id), mx = maxLevel(id);
      card.innerHTML = ouvert
        ? (enMission ? '<div class="card-mission">🎯</div>' : '') +
          '<div class="card-emoji">' + g.emoji + '</div>' +
          '<div class="card-title">' + g.title + '</div>' +
          (g.salon ? '<div class="card-lvl"></div>'
                   : '<div class="card-lvl">Niveau ' + lv +
                     '<span class="lvl-barre"><i style="width:' +
                     Math.round(lv / mx * 100) + '%"></i></span></div>')
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

  /* ---------- boutique : les proutons deviennent une monnaie ---------- */
  function achete(ref) { return state.achats.indexOf(ref) >= 0; }

  function depenser(prix, ref) {
    if (state.proutons < prix) return false;
    state.proutons -= prix;
    if (ref && state.achats.indexOf(ref) < 0) state.achats.push(ref);
    save(); refreshScore();
    return true;
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
    openMissions: openMissions, majMissions: majMissions,
    depenser: depenser, achete: achete,
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

/* ==========================================================================
   Cœurs — trois erreurs et la partie est perdue. C'est ce qui manquait :
   sans enjeu, réussir ne voulait plus rien dire. On ne retire rien de ce
   qui est déjà gagné, on repart simplement les mains vides.
   ========================================================================== */
function Coeurs(total) {
  total = total || 3;
  var restants = total;
  var box = el('div', 'coeurs');
  function maj() {
    box.innerHTML = '';
    for (var i = 0; i < total; i++) {
      box.appendChild(el('span', 'coeur' + (i < restants ? '' : ' vide'),
                         i < restants ? '❤️' : '🖤'));
    }
  }
  maj();
  return {
    el: box,
    reste: function () { return restants; },
    perdre: function () {
      restants--;
      maj();
      wiggle(box);
      return restants > 0;      // false => partie perdue
    }
  };
}

function wiggle(node) {
  node.classList.remove('wiggle');
  void node.offsetWidth;
  node.classList.add('wiggle');
}
