/* ==========================================================================
   Lis le Mot 📖 — le mot est ÉCRIT, l'enfant touche le dessin qui va avec.

   C'est le seul jeu où il faut vraiment déchiffrer : partout ailleurs la
   voix donne la réponse. La progression est pensée pour qu'il puisse
   d'abord tricher, puis de moins en moins :

     1  le mot est dit tout de suite, 2 images très différentes
        → il réussit sans lire, mais il VOIT le mot pendant qu'il l'entend
     2  3 images, toujours dit
     3  4 images, PLUS DIT du tout : il doit toucher l'oreille pour
        entendre, donc essayer de lire d'abord
     4  4 images qui commencent toutes par la même lettre (CHAT, CHIEN,
        CHEVAL…) : impossible de s'en sortir avec la première lettre, il
        faut lire jusqu'au bout
   ========================================================================== */
Games.lire = (function () {
  var TOTAL = 8;
  var root, api, level, q, score, mot, busy, essais, coeurs;

  function config(lv) {
    if (lv <= 1) return { images: 2, dit: true,  memeDebut: false };
    if (lv === 2) return { images: 3, dit: true,  memeDebut: false };
    if (lv === 3) return { images: 4, dit: false, memeDebut: false };
    return          { images: 4, dit: false, memeDebut: true };
  }

  /* seuls les mots illustrés peuvent servir ici : il faut un dessin */
  function motsImages() {
    return MOTS.filter(function (w) { return w.e && w.m.length >= 3; });
  }

  function start(_root, _api, lv) {
    root = _root; api = _api; level = lv; q = 0; score = 0;
    root.innerHTML =
      '<div class="lire-wrap">' +
        '<div class="coeurs-slot" id="li-coeurs"></div>' +
        '<div class="lire-haut">' +
          '<div class="lire-mot" id="li-mot"></div>' +
          '<button class="lire-oreille" id="li-ear">👂</button>' +
        '</div>' +
        '<div class="lire-images" id="li-images"></div>' +
      '</div>';
    coeurs = Coeurs(3);
    document.getElementById('li-coeurs').appendChild(coeurs.el);
    tap(document.getElementById('li-ear'), function () { repeat(); });
    next();
  }

  function next() {
    if (!api.alive()) return;
    if (q >= TOTAL) return finish();
    busy = false; essais = 0;
    api.dots(q, TOTAL);

    var cfg = config(level);
    var liste = motsImages();

    // Au dernier niveau, le mot doit avoir assez de voisins commençant par
    // la même lettre pour que les leurres tiennent la promesse du niveau.
    // Sans ce filtre, OURS (seul mot illustré en O) donnait des leurres
    // quelconques et il suffisait de regarder la première lettre.
    var candidats = liste;
    if (cfg.memeDebut) {
      var parLettre = {};
      liste.forEach(function (w) {
        (parLettre[w.m[0]] = parLettre[w.m[0]] || []).push(w);
      });
      candidats = liste.filter(function (w) {
        return parLettre[w.m[0]].length >= cfg.images;
      });
      if (!candidats.length) candidats = liste;
    }
    mot = Sacs.tirer('lire-n' + level, candidats, function (w) { return w.m; });

    // les leurres : au dernier niveau ils partagent la première lettre,
    // sinon la première lettre suffirait à répondre sans lire la suite
    var leurres;
    if (cfg.memeDebut) {
      leurres = shuffle(liste.filter(function (w) {
        return w.m !== mot.m && w.m[0] === mot.m[0];
      }));
      if (leurres.length < cfg.images - 1) {           // pas assez de voisins
        leurres = leurres.concat(shuffle(liste.filter(function (w) {
          return w.m !== mot.m && w.m[0] !== mot.m[0];
        })));
      }
    } else {
      leurres = shuffle(liste.filter(function (w) { return w.m !== mot.m; }));
    }
    var choix = shuffle([mot].concat(leurres.slice(0, cfg.images - 1)));

    ecrire();
    var box = document.getElementById('li-images');
    box.innerHTML = '';
    box.className = 'lire-images n' + choix.length;
    choix.forEach(function (w) {
      var c = el('button', 'image-carte', w.e);
      c.dataset.mot = w.m;
      tap(c, function () { answer(c, w); });
      box.appendChild(c);
    });

    // au-delà du niveau 2, on ne donne plus le mot : à lui de le décoder,
    // l'oreille reste là s'il cale
    if (cfg.dit) setTimeout(repeat, 400);
    else Voice.say('Lis le mot, et touche le bon dessin !', { rate: 0.9, coupe: true });
  }

  function ecrire() {
    var box = document.getElementById('li-mot');
    box.innerHTML = '';
    // la largeur disponible doit aussi loger le bouton oreille : sans quoi
    // la dernière lettre des mots longs (ESCARGOT, GRENOUILLE) passait
    // dessous
    var taille = Math.min(8, 54 / mot.m.length);
    mot.m.split('').forEach(function (L, i) {
      var s = el('span', 'li-lettre', L);
      s.style.fontSize = taille + 'vmin';
      s.style.animationDelay = (i * 0.05) + 's';
      box.appendChild(s);
    });
  }

  function repeat() {
    if (!mot || !api.alive()) return;
    Voice.say(mot.d, { rate: 0.8, coupe: true });
  }

  function answer(carte, w) {
    if (busy) return;
    if (w.m === mot.m) {
      busy = true;
      carte.classList.add('ok');
      Sound.good();
      api.confetti(14);
      if (!essais) score++;
      Voice.say(mot.d + ' ! ' + pick(BRAVOS), { then: function () { q++; next(); } });
    } else {
      essais++;
      carte.classList.add('ko');
      wiggle(carte);
      Sound.prout(0.28);
      if (!coeurs.perdre()) {
        busy = true;
        return api.perdu('📖', 'Plus de cœurs ! Le mot était ' + mot.d + '.');
      }
      // on lui donne le mot à entendre : il pourra relire en s'aidant
      Voice.say('Non ! Écoute : ' + mot.d, { coupe: true });
      var toutes = root.querySelectorAll('.image-carte');
      for (var i = 0; i < toutes.length; i++) {
        if (essais >= 2 && toutes[i].dataset.mot === mot.m) toutes[i].classList.add('helped');
      }
    }
  }

  function finish() {
    if (!api.alive()) return;
    api.dots(TOTAL, TOTAL);
    var stars = score >= 7 ? 3 : (score >= 5 ? 2 : 1);
    api.bumpLevel('lire', score >= 7);
    api.win(stars, '📖');
  }

  function stop() { mot = null; }

  return {
    title: 'Lis le Mot', spoken: 'Lis le mot',
    emoji: '📖', color: 'linear-gradient(160deg,#c86bff,#5b1d8f)',
    need: 14,
    start: start, stop: stop, repeat: repeat
  };
})();
