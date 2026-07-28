/* ==========================================================================
   Le Détective des Lettres 🕵️ — « Par quelle lettre commence PIZZA ? »
   C'est LA compétence du CP : entendre le début d'un mot et le relier à
   une lettre. Les autres jeux montrent des lettres isolées ; ici la lettre
   sert enfin à quelque chose.
   ========================================================================== */
Games.detective = (function () {
  var TOTAL = 8;
  var root, api, level, q, score, mot, cible, tries, busy;

  function config(lv) {
    if (lv <= 1) return { choices: 3, casing: 'upper', fin: false };
    if (lv === 2) return { choices: 4, casing: 'upper', fin: false };
    if (lv === 3) return { choices: 4, casing: 'lower', fin: false };
    return { choices: 4, casing: 'upper', fin: true };   // début OU fin du mot
  }

  /* On écarte les mots dont la première lettre ne s'entend pas (HIBOU) */
  function motsOk() {
    return MOTS.filter(function (w) { return !w.h && w.m.length >= 3; });
  }

  function start(_root, _api, lv) {
    root = _root; api = _api; level = lv; q = 0; score = 0;
    root.innerHTML =
      '<div class="det-wrap">' +
        '<div class="det-loupe" id="d-img">🔍</div>' +
        '<div class="det-question" id="d-q"></div>' +
        '<div class="choices" id="d-choices"></div>' +
      '</div>';
    tap(document.getElementById('d-img'), function () { repeat(); });
    next();
  }

  function next() {
    if (!api.alive()) return;
    if (q >= TOTAL) return finish();
    busy = false; tries = 0;
    api.dots(q, TOTAL);

    var cfg = config(level);
    var liste = motsOk();
    mot = pick(liste);
    // au niveau 4, on demande parfois la DERNIÈRE lettre
    var chercheFin = cfg.fin && Math.random() < 0.4;
    cible = chercheFin ? mot.m[mot.m.length - 1] : mot.m[0];

    var autres = shuffle(ALPHABET.filter(function (L) { return L !== cible; }));
    if (cfg.casing !== 'upper') autres = noAmbig(autres.concat([cible]))
      .filter(function (L) { return L !== cible; });
    var opts = shuffle([cible].concat(autres.slice(0, cfg.choices - 1)));

    document.getElementById('d-img').textContent = mot.e;
    document.getElementById('d-q').textContent =
      (chercheFin ? 'Ça finit par…' : 'Ça commence par…');
    mot.fin = chercheFin;

    var box = document.getElementById('d-choices');
    box.innerHTML = '';
    box.className = 'choices c' + opts.length;
    opts.forEach(function (L) {
      var b = el('button', 'letter-btn',
                 cfg.casing === 'lower' ? L.toLowerCase() : L);
      b.dataset.letter = L;
      b.style.setProperty('--hue', Math.floor(Math.random() * 360));
      tap(b, function () { answer(b, L); });
      box.appendChild(b);
    });

    setTimeout(repeat, 350);
  }

  function repeat() {
    if (!mot || !api.alive()) return;
    // on fige la question : la voix répond après coup, le mot peut avoir changé
    var fin = mot.fin;
    Voice.say(mot.d, {
      rate: 0.8,
      then: function () {
        if (!api.alive()) return;
        Voice.say(fin ? 'Par quelle lettre ça finit ?'
                      : 'Par quelle lettre ça commence ?', { rate: 0.9 });
      }
    });
  }

  function answer(btn, L) {
    if (busy) return;
    if (L === cible) {
      busy = true;
      btn.classList.add('ok');
      Sound.good();
      api.confetti(14);
      if (tries === 0) score++;
      Voice.say(mot.d + ' ! ' + LETTER_SAY[cible] + ' ! ' + pick(BRAVOS), {
        then: function () { q++; next(); }
      });
    } else {
      tries++;
      btn.classList.add('ko');
      wiggle(btn);
      Sound.prout(0.28);
      if (tries >= 2) {
        var all = root.querySelectorAll('.letter-btn');
        for (var i = 0; i < all.length; i++) {
          if (all[i].dataset.letter === cible) all[i].classList.add('helped');
        }
        Voice.say('Écoute bien : ' + mot.d + '… ' + LETTER_SAY[cible] + ' !');
      } else {
        Voice.say(pick(ENCOURAGEMENTS));
      }
    }
  }

  function finish() {
    if (!api.alive()) return;
    api.dots(TOTAL, TOTAL);
    var stars = score >= 7 ? 3 : (score >= 5 ? 2 : 1);
    api.bumpLevel('detective', score >= 7);
    api.win(stars, '🕵️');
  }

  function stop() { mot = null; }

  return {
    title: 'Le Détective', spoken: 'Le détective des lettres',
    emoji: '🕵️', color: 'linear-gradient(160deg,#5f7cff,#22307e)',
    need: 12,
    start: start, stop: stop, repeat: repeat
  };
})();
