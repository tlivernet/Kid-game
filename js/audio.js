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
    Voice.unlock();
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

  /* --- LE PROUT (la star du jeu) --- */
  function prout(len) {
    var c = ac(), t = c.currentTime;
    var dur = len || (0.35 + Math.random() * 0.45);

    var o = c.createOscillator();
    o.type = Math.random() < 0.5 ? 'sawtooth' : 'square';
    var f0 = 130 + Math.random() * 130;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(38 + Math.random() * 30, t + dur);

    // vibrato "flatulent"
    var lfo = c.createOscillator(), lfoG = c.createGain();
    lfo.type = 'square';
    lfo.frequency.setValueAtTime(14 + Math.random() * 26, t);
    lfo.frequency.linearRampToValueAtTime(6 + Math.random() * 10, t + dur);
    lfoG.gain.value = 30 + Math.random() * 45;
    lfo.connect(lfoG); lfoG.connect(o.frequency);

    var filt = c.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(1100, t);
    filt.frequency.exponentialRampToValueAtTime(260, t + dur);
    filt.Q.value = 6;

    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.55, t + 0.03);
    g.gain.setValueAtTime(0.55, t + dur * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    o.connect(filt); filt.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.06);
    lfo.start(t); lfo.stop(t + dur + 0.06);
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
    var c = ac(), t = c.currentTime;
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(600, t + 0.15);
    o.frequency.exponentialRampToValueAtTime(200, t + 0.3);
    env(g, t, 0.3, 0.01, 0.35);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.45);
  }

  /* --- "rot" (variante rigolote) --- */
  function rot() {
    var c = ac(), t = c.currentTime, dur = 0.5;
    var o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(85, t);
    o.frequency.linearRampToValueAtTime(60, t + dur);
    var lfo = c.createOscillator(), lg = c.createGain();
    lfo.type = 'sawtooth'; lfo.frequency.value = 30; lg.gain.value = 22;
    lfo.connect(lg); lg.connect(o.frequency);
    f.type = 'bandpass'; f.frequency.value = 400; f.Q.value = 2;
    env(g, t, 0.45, 0.04, dur);
    o.connect(f); f.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05); lfo.start(t); lfo.stop(t + dur + 0.05);
  }

  /* --- sifflet qui dégonfle --- */
  function ballon() {
    var c = ac(), t = c.currentTime, dur = 1.1;
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(900, t);
    o.frequency.exponentialRampToValueAtTime(180, t + dur);
    var lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = 9; lg.gain.value = 120;
    lfo.connect(lg); lg.connect(o.frequency);
    env(g, t, 0.22, 0.03, dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05); lfo.start(t); lfo.stop(t + dur + 0.05);
  }

  return {
    unlock: unlock, isReady: function () { return ready; },
    prout: prout, pop: pop, good: good, oops: oops,
    fanfare: fanfare, sparkle: sparkle, boing: boing,
    rot: rot, ballon: ballon, note: note
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
  function say(text, opts) {
    opts = opts || {};
    if (!enabled) { if (opts.then) setTimeout(opts.then, 400); return; }
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      if (!voice) pick();
      if (voice) u.voice = voice;
      u.lang = (voice && voice.lang) || 'fr-FR';
      u.rate = opts.rate || 0.92;
      u.pitch = opts.pitch === undefined ? 1.15 : opts.pitch;
      u.volume = 1;
      if (opts.then) {
        var done = false;
        u.onend = function () { if (!done) { done = true; opts.then(); } };
        // filet de sécurité : certaines tablettes n'émettent jamais onend
        setTimeout(function () { if (!done) { done = true; opts.then(); } },
                   700 + text.length * 90);
      }
      window.speechSynthesis.speak(u);
    } catch (e) { if (opts.then) setTimeout(opts.then, 400); }
  }

  function stop() {
    if (enabled) { try { window.speechSynthesis.cancel(); } catch (e) {} }
  }

  return { say: say, stop: stop, unlock: unlock };
})();
