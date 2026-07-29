/* ==========================================================================
   audio.js — moteur de sons 100% synthétisés (aucun fichier à télécharger)
   + voix française (SpeechSynthesis).
   Tout est généré par la Web Audio API : ça marche hors-ligne et depuis
   GitHub Pages sans le moindre .mp3.
   ========================================================================== */
var Sound = (function () {
  var ctx = null, master = null, ready = false;

  function ac() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    }
    return ctx;
  }

  /* Doit être appelé depuis un vrai tap utilisateur (iOS/iPadOS l'exige). */
  function unlock() {
    var c = ac();
    if (c.state === 'suspended') c.resume();
    // petit "silence" pour réveiller la carte son des tablettes
    var g = c.createGain();
    g.gain.value = 0.0001;
    var o = c.createOscillator();
    o.connect(g); g.connect(master);
    o.start(); o.stop(c.currentTime + 0.03);
    ready = true;
    loadSamples();
    Voice.unlock();
  }

  /* Réservé au banc d'essai : rend les sons dans un OfflineAudioContext
     pour pouvoir les écouter et mesurer leur spectre sans tablette. */
  function useContext(c) {
    ctx = c;
    master = c.createGain();
    master.gain.value = 0.9;
    master.connect(c.destination);
    noiseCache = null;
  }

  /* --- bruit blanc partagé (texture "mouillée" des prouts) --- */
  var noiseCache = null;
  function noiseBuffer() {
    var c = ac();
    if (!noiseCache) {
      noiseCache = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      var d = noiseCache.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseCache;
  }

  /* Modulation CHAOTIQUE : du bruit blanc passé dans un filtre très grave
     donne une courbe qui tremblote au hasard. Branchée sur la fréquence
     d'un oscillateur, elle fait un flottement irrégulier — c'est ça qui
     distingue un vrai bruit corporel d'un vibrato de synthétiseur. */
  function chaos(t, dur, cutoff, depth, param) {
    var c = ac();
    var src = c.createBufferSource();
    src.buffer = noiseBuffer();
    src.loop = true;
    src.playbackRate.value = 0.6 + Math.random() * 0.8;   // jamais deux fois pareil
    var lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = cutoff;
    lp.Q.value = 0.7;
    var g = c.createGain();
    g.gain.value = depth;
    src.connect(lp); lp.connect(g); g.connect(param);
    src.start(t); src.stop(t + dur + 0.05);
  }

  /* souffle filtré : ajoute le "grain" sans énergie inaudible dans les graves */
  function breath(t, dur, freq, q, vol, type) {
    var c = ac();
    var src = c.createBufferSource();
    src.buffer = noiseBuffer();
    src.loop = true;
    var f = c.createBiquadFilter();
    f.type = type || 'bandpass';
    f.frequency.setValueAtTime(freq, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(120, freq * 0.55), t + dur);
    f.Q.value = q;
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur + 0.05);
  }

  function env(g, t, peak, attack, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  /* --- une note simple --- */
  function note(freq, start, dur, type, vol) {
    var c = ac(), t = c.currentTime + (start || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    env(g, t, vol || 0.25, 0.012, dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }

  /* ========================================================================
     VRAIS FICHIERS SONORES (optionnels)
     Les fichiers déclarés dans sons/sons.js remplacent les sons
     synthétisés correspondants. Liste vide par défaut : le jeu fabrique
     alors tous ses bruits lui-même. Voir sons/LISEZMOI.md.
     ======================================================================== */
  var samples = {}, samplesTried = false;

  function loadSamples() {
    if (samplesTried || typeof Audio === 'undefined') return;
    samplesTried = true;
    var liste = window.SONS_REELS || {};
    Object.keys(liste).forEach(function (nom) {
      (liste[nom] || []).forEach(function (url) {
        var a = new Audio();
        a.preload = 'auto';
        a.addEventListener('canplaythrough', function () {
          (samples[nom] = samples[nom] || []).push(a);
        }, { once: true });
        a.addEventListener('error', function () { /* fichier absent : on garde la synthèse */ });
        a.src = url;
      });
    });
  }

  /* Coupe en douceur : un arrêt net sur un fichier fait "clac". */
  function estomper(a, sec) {
    setTimeout(function () {
      var v = a.volume, t0 = Date.now();
      var iv = setInterval(function () {
        var k = (Date.now() - t0) / 180;
        if (k >= 1) { clearInterval(iv); try { a.pause(); } catch (e) {} return; }
        a.volume = Math.max(0, v * (1 - k));
      }, 30);
    }, sec * 1000);
  }

  /* Joue un vrai fichier s'il y en a un. Renvoie true si c'est fait.
     « len » = durée souhaitée par l'appelant. Les sons de réaction (mauvaise
     réponse) doivent rester courts, sinon ils couvrent la voix qui encourage
     et le jeu se traîne ; les gros moments, eux, jouent en entier. */
  function sample(nom, len) {
    var list = samples[nom];
    if (!list || !list.length) return false;
    try {
      var src;
      if (len && list.length > 1) {
        // on choisit la variante dont la durée colle le mieux à la demande
        src = list.reduce(function (best, x) {
          var dx = Math.abs((x.duration || 1) - len);
          return dx < Math.abs((best.duration || 1) - len) ? x : best;
        });
      } else {
        src = list[Math.floor(Math.random() * list.length)];
      }
      var a = src.cloneNode();            // clone = on peut superposer les sons
      a.volume = 0.9;
      var p = a.play();
      if (p && p.catch) p.catch(function () {});
      // durée lue sur l'original : le clone n'a pas encore ses métadonnées
      if (len && src.duration > MAX_REACTION) estomper(a, MAX_REACTION);
      return true;
    } catch (e) { return false; }
  }

  /* Au-delà, un bruit de réaction devient pénible à la centième écoute. */
  var MAX_REACTION = 0.9;

  /* --- LE PROUT (la star du jeu) ---
     Tout se joue entre 300 et 2500 Hz : un haut-parleur de tablette ne
     restitue quasiment rien en dessous de 200 Hz. C'est le "flottement"
     (vibrato rapide) et les harmoniques de la dent de scie qui font le
     prout, pas les graves. */
  function prout(len) {
    if (sample('prout', len)) return;
    var c = ac(), t = c.currentTime;
    var dur = len || (0.4 + Math.random() * 0.4);

    var o = c.createOscillator();
    o.type = 'sawtooth';
    var f0 = 175 + Math.random() * 65;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.6, t + dur);

    // le "brrrr" : flottement chaotique + un peu de vibrato régulier
    chaos(t, dur, 26, 70 + Math.random() * 40, o.frequency);
    var lfo = c.createOscillator(), lfoG = c.createGain();
    lfo.type = 'triangle';
    lfo.frequency.setValueAtTime(26 + Math.random() * 12, t);
    lfo.frequency.linearRampToValueAtTime(11 + Math.random() * 5, t + dur);
    lfoG.gain.value = 22;
    lfo.connect(lfoG); lfoG.connect(o.frequency);

    var filt = c.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(2600, t);
    filt.frequency.exponentialRampToValueAtTime(1000, t + dur);
    filt.Q.value = 2;

    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.42, t + 0.02);
    g.gain.setValueAtTime(0.42, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    chaos(t, dur, 18, 0.13, g.gain);   // le volume aussi crachote

    o.connect(filt); filt.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.06);
    lfo.start(t); lfo.stop(t + dur + 0.06);

    breath(t, dur, 950, 0.8, 0.08);
  }

  /* --- petit prout aigu et bref : le "pfffft" --- */
  function petitProut() {
    if (sample('petit-prout')) return;
    var c = ac(), t = c.currentTime, dur = 0.17;
    var o = c.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(520, t);
    o.frequency.exponentialRampToValueAtTime(300, t + dur);
    var lfo = c.createOscillator(), lg = c.createGain();
    lfo.type = 'sine'; lfo.frequency.value = 55; lg.gain.value = 55;
    lfo.connect(lg); lg.connect(o.frequency);
    chaos(t, dur, 60, 90, o.frequency);
    var f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 3600; f.Q.value = 1;
    var g = c.createGain();
    env(g, t, 0.32, 0.008, dur);
    o.connect(f); f.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05); lfo.start(t); lfo.stop(t + dur + 0.05);
    breath(t, dur, 1800, 1.2, 0.09);
  }

  /* --- le prout-trompette : ça monte, ça claironne, ça retombe --- */
  function proutTrompette() {
    if (sample('prout-trompette')) return;
    var c = ac(), t = c.currentTime, dur = 0.85;
    var o = c.createOscillator(), o2 = c.createOscillator();
    o.type = o2.type = 'sawtooth';
    [o, o2].forEach(function (osc, i) {
      var d = i ? 1.012 : 1;   // léger désaccord = son plus épais
      osc.frequency.setValueAtTime(170 * d, t);
      osc.frequency.exponentialRampToValueAtTime(300 * d, t + dur * 0.28);
      osc.frequency.setValueAtTime(300 * d, t + dur * 0.62);
      osc.frequency.exponentialRampToValueAtTime(125 * d, t + dur);
    });
    var lfo = c.createOscillator(), lg = c.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(19, t);
    lfo.frequency.linearRampToValueAtTime(11, t + dur);
    lg.gain.value = 24;
    lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    chaos(t, dur, 14, 26, o.frequency);

    var f = c.createBiquadFilter();     // résonance = timbre cuivré
    f.type = 'lowpass';
    f.frequency.setValueAtTime(3400, t);
    f.frequency.exponentialRampToValueAtTime(1500, t + dur);
    f.Q.value = 7;

    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.24, t + 0.05);
    g.gain.setValueAtTime(0.24, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    o.connect(f); o2.connect(f); f.connect(g); g.connect(master);
    [o, o2, lfo].forEach(function (n) { n.start(t); n.stop(t + dur + 0.06); });
    breath(t, dur, 1400, 1.4, 0.05);
  }

  /* --- bulle / pop --- */
  function pop() {
    var c = ac(), t = c.currentTime;
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(320, t);
    o.frequency.exponentialRampToValueAtTime(1400, t + 0.09);
    env(g, t, 0.3, 0.008, 0.12);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.2);
  }

  /* --- bonne réponse : petit arpège joyeux --- */
  function good() {
    [0, 0.09, 0.18].forEach(function (d, i) {
      note([523, 659, 784][i], d, 0.22, 'triangle', 0.3);
    });
  }

  /* --- réponse ratée : "boing" gentil, jamais méchant --- */
  function oops() {
    var c = ac(), t = c.currentTime;
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(150, t + 0.28);
    var lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = 11; lg.gain.value = 40;
    lfo.connect(lg); lg.connect(o.frequency);
    env(g, t, 0.28, 0.01, 0.32);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.4); lfo.start(t); lfo.stop(t + 0.4);
  }

  /* --- fanfare de victoire --- */
  function fanfare() {
    var mel = [523, 659, 784, 1046, 784, 1046];
    mel.forEach(function (f, i) { note(f, i * 0.13, 0.3, 'square', 0.22); });
    setTimeout(function () { prout(0.5); }, 900);
  }

  /* --- montée "magique" (paillettes) --- */
  function sparkle() {
    for (var i = 0; i < 7; i++) note(880 + i * 220, i * 0.045, 0.16, 'sine', 0.14);
  }

  /* --- tambour de suspense --- */
  function boing() {
    if (sample('boing', 0.5)) return;
    var c = ac(), t = c.currentTime;
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(280, t);
    o.frequency.exponentialRampToValueAtTime(950, t + 0.15);
    o.frequency.exponentialRampToValueAtTime(420, t + 0.3);
    env(g, t, 0.32, 0.01, 0.35);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.45);
  }

  /* --- le rot : plus lent et plus "mouillé" qu'un prout, et le volume
     lui-même tremble (c'est ce tremblement qui fait le "hroooop") --- */
  function rot() {
    if (sample('rot')) return;
    var c = ac(), t = c.currentTime, dur = 0.62;
    var o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(195, t);
    o.frequency.exponentialRampToValueAtTime(132, t + dur);

    // deux vibratos désynchronisés : le tremblement devient irrégulier
    var l1 = c.createOscillator(), g1 = c.createGain();
    l1.type = 'sine'; l1.frequency.value = 15; g1.gain.value = 50;
    l1.connect(g1); g1.connect(o.frequency);
    var l2 = c.createOscillator(), g2 = c.createGain();
    l2.type = 'triangle'; l2.frequency.value = 7.3; g2.gain.value = 22;
    l2.connect(g2); g2.connect(o.frequency);
    chaos(t, dur, 20, 60, o.frequency);

    var f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(1700, t);
    f.frequency.exponentialRampToValueAtTime(750, t + dur);
    f.Q.value = 5;

    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.4, t + 0.06);
    g.gain.setValueAtTime(0.4, t + dur * 0.72);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    // trémolo ajouté au volume
    var tl = c.createOscillator(), tg = c.createGain();
    tl.type = 'sine'; tl.frequency.value = 17; tg.gain.value = 0.13;
    tl.connect(tg); tg.connect(g.gain);

    o.connect(f); f.connect(g); g.connect(master);
    [o, l1, l2, tl].forEach(function (n) { n.start(t); n.stop(t + dur + 0.06); });
    breath(t, dur, 700, 0.8, 0.11);
  }

  /* --- sifflet qui dégonfle --- */
  function ballon() {
    if (sample('ballon')) return;
    var c = ac(), t = c.currentTime, dur = 1.1;
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(900, t);
    o.frequency.exponentialRampToValueAtTime(180, t + dur);
    var lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = 9; lg.gain.value = 120;
    lfo.connect(lg); lg.connect(o.frequency);
    env(g, t, 0.3, 0.03, dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05); lfo.start(t); lfo.stop(t + dur + 0.05);
  }

  return {
    unlock: unlock, isReady: function () { return ready; },
    prout: prout, petitProut: petitProut, proutTrompette: proutTrompette,
    pop: pop, good: good, oops: oops,
    fanfare: fanfare, sparkle: sparkle, boing: boing,
    rot: rot, ballon: ballon, note: note,
    _useContext: useContext
  };
})();


/* ==========================================================================
   Voice — la voix française qui guide l'enfant (il n'a pas besoin de lire !)
   ========================================================================== */
var Voice = (function () {
  var voice = null, enabled = ('speechSynthesis' in window), picked = false;

  function pick() {
    if (!enabled) return null;
    var vs = window.speechSynthesis.getVoices() || [];
    if (!vs.length) return null;
    // on privilégie une voix fr-FR, puis n'importe quel français
    voice = vs.filter(function (v) { return /fr[-_]FR/i.test(v.lang); })[0] ||
            vs.filter(function (v) { return /^fr/i.test(v.lang); })[0] || null;
    picked = true;
    return voice;
  }

  if (enabled) {
    pick();
    window.speechSynthesis.onvoiceschanged = pick;
  }

  function unlock() {
    if (!enabled) return;
    if (!picked || !voice) pick();
    try { window.speechSynthesis.resume(); } catch (e) {}
  }

  /* say("Touche la lettre Bé", {rate:0.9, then:fn}) */
  /* ------------------------------------------------------------------
     FILE D'ATTENTE. Avant, chaque say() commençait par cancel() : la
     phrase en cours était coupée net par la suivante, et en fin de partie
     le « bravo » se faisait tronquer par l'annonce de déblocage.
     Maintenant les phrases s'enchaînent. Pour couper volontairement (le
     joueur vient d'agir, la consigne précédente n'a plus d'intérêt), on
     passe { coupe: true }.
     ------------------------------------------------------------------ */
  var file = [], enCours = false;

  function say(text, opts) {
    opts = opts || {};
    if (!enabled) {
      if (opts.coupe) file.length = 0;
      if (opts.then) setTimeout(opts.then, 350);
      return;
    }
    if (opts.coupe) {
      file.length = 0;
      try { window.speechSynthesis.cancel(); } catch (e) {}
      enCours = false;
    }
    file.push({ text: text, opts: opts });
    if (file.length > 4) file.splice(0, file.length - 4);   // jamais de bouchon
    if (!enCours) suivant();
  }

  function suivant() {
    if (!file.length) { enCours = false; return; }
    enCours = true;
    var item = file.shift();
    var fini = false;
    function apres() {
      if (fini) return;
      fini = true;
      if (item.opts.then) { try { item.opts.then(); } catch (e) {} }
      suivant();
    }
    try {
      var u = new SpeechSynthesisUtterance(item.text);
      if (!voice) pick();
      if (voice) u.voice = voice;
      u.lang = (voice && voice.lang) || 'fr-FR';
      u.rate = item.opts.rate || 0.92;
      u.pitch = item.opts.pitch === undefined ? 1.15 : item.opts.pitch;
      u.volume = 1;
      u.onend = apres;
      u.onerror = apres;
      // filet de sécurité : certaines tablettes n'émettent jamais onend.
      // Large exprès — mieux vaut un blanc qu'une phrase coupée.
      setTimeout(apres, 1200 + item.text.length * 120);
      window.speechSynthesis.speak(u);
    } catch (e) { setTimeout(apres, 350); }
  }

  function stop() {
    file.length = 0;
    enCours = false;
    if (enabled) { try { window.speechSynthesis.cancel(); } catch (e) {} }
  }

  return { say: say, stop: stop, unlock: unlock };
})();
