/* ==========================================================================
   Le Tableau Magique ✍️ — tracer la lettre au doigt, avec des paillettes.
   Reprend le principe du tableau blanc de la maison, mais l'écran guide
   l'enfant (point de départ + chemin animé) et récompense tout de suite.
   ========================================================================== */
Games.tableau = (function () {
  var PAR_PARTIE = 4;
  var root, api, level;
  var modelC, inkC, mctx, ictx, wrap;
  var W, H, size, ox, oy;
  var letters, li, strokes, checks, si, ci, drawing, lastPt, doneInk, curInk;
  var raf, guideT, over, resizeH;

  /* ---------- géométrie ---------- */
  function toPx(p) { return [ox + p[0] * size, oy + p[1] * size]; }

  function resample(pts, step) {
    var out = [pts[0].slice()], acc = 0;
    for (var i = 1; i < pts.length; i++) {
      var a = out[out.length - 1], b = pts[i];
      var dx = b[0] - a[0], dy = b[1] - a[1];
      var d = Math.hypot(dx, dy);
      while (d >= step) {
        var t = step / d;
        var np = [a[0] + dx * t, a[1] + dy * t];
        out.push(np);
        a = np; dx = b[0] - a[0]; dy = b[1] - a[1]; d = Math.hypot(dx, dy);
      }
      acc += d;
    }
    var last = pts[pts.length - 1];
    if (Math.hypot(last[0] - out[out.length - 1][0], last[1] - out[out.length - 1][1]) > step * 0.4)
      out.push(last.slice());
    return out;
  }

  /* ---------- cycle de vie ---------- */
  function start(_root, _api, lv) {
    root = _root; api = _api; level = lv; over = false;
    var span = [6, 12, 18, TRACE_ORDER.length][Math.min(lv, 4) - 1];
    letters = Sacs.tirerPlusieurs('tableau-n' + lv,
                TRACE_ORDER.slice(0, span), PAR_PARTIE);
    li = 0;

    root.innerHTML =
      '<div class="tab-wrap" id="t-wrap">' +
        '<div class="tab-target" id="t-target">A</div>' +
        '<canvas id="t-model"></canvas>' +
        '<canvas id="t-ink"></canvas>' +
        '<button class="tab-clear" id="t-clear">🧽</button>' +
      '</div>';
    wrap = document.getElementById('t-wrap');
    modelC = document.getElementById('t-model');
    inkC = document.getElementById('t-ink');
    mctx = modelC.getContext('2d');
    ictx = inkC.getContext('2d');

    tap(document.getElementById('t-clear'), function () { resetLetter(); });

    inkC.addEventListener('pointerdown', onDown);
    inkC.addEventListener('pointermove', onMove);
    inkC.addEventListener('pointerup', onUp);
    inkC.addEventListener('pointercancel', onUp);
    inkC.addEventListener('pointerleave', onUp);

    resizeH = function () { layout(); };
    window.addEventListener('resize', resizeH);

    loadLetter();
    raf = requestAnimationFrame(tick);
  }

  function layout() {
    if (!wrap) return;
    var r = wrap.getBoundingClientRect();
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(80, r.width); H = Math.max(80, r.height);
    [modelC, inkC].forEach(function (c) {
      c.width = W * dpr; c.height = H * dpr;
      c.style.width = W + 'px'; c.style.height = H + 'px';
      c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    size = Math.min(W, H) * 0.72;
    ox = (W - size) / 2; oy = (H - size) / 2;
    rebuild();
    redrawInk();
  }

  function rebuild() {
    var L = letters[li];
    var raw = TRACES[L] || TRACES.I;
    strokes = raw.map(function (s) { return s.map(toPx); });
    checks = strokes.map(function (s) { return resample(s, size * 0.1); });
  }

  function loadLetter() {
    var L = letters[li];
    si = 0; ci = 0; drawing = false; doneInk = []; curInk = []; guideT = 0;
    document.getElementById('t-target').textContent = L;
    api.dots(li, PAR_PARTIE);
    layout();
    var w = LETTER_WORD[L];
    Voice.say('Écris la lettre ' + LETTER_SAY[L] + '… comme ' + w[0], { rate: 0.9 });
  }

  function resetLetter() {
    si = 0; ci = 0; doneInk = []; curInk = []; drawing = false;
    redrawInk();
    Sound.boing();
  }

  /* ---------- rendu ---------- */
  function tick() {
    if (over) return;
    guideT += 0.012;
    if (guideT > 1.35) guideT = 0;
    drawModel();
    raf = requestAnimationFrame(tick);
  }

  function drawModel() {
    if (!mctx) return;
    mctx.clearRect(0, 0, W, H);
    strokes.forEach(function (s, i) {
      mctx.lineCap = 'round'; mctx.lineJoin = 'round';
      mctx.lineWidth = size * 0.14;
      if (i < si) { mctx.strokeStyle = 'rgba(120,255,200,0.55)'; mctx.setLineDash([]); }
      else if (i === si) { mctx.strokeStyle = 'rgba(255,255,255,0.30)'; mctx.setLineDash([size * 0.05, size * 0.05]); }
      else { mctx.strokeStyle = 'rgba(255,255,255,0.10)'; mctx.setLineDash([size * 0.04, size * 0.06]); }
      mctx.beginPath();
      s.forEach(function (p, k) { k ? mctx.lineTo(p[0], p[1]) : mctx.moveTo(p[0], p[1]); });
      mctx.stroke();
    });
    mctx.setLineDash([]);

    if (si < strokes.length) {
      var pts = checks[si];
      // point de départ qui pulse
      var st = pts[Math.min(ci, pts.length - 1)];
      var pulse = 1 + Math.sin(Date.now() / 200) * 0.15;
      mctx.fillStyle = '#7CFFB2';
      mctx.beginPath();
      mctx.arc(st[0], st[1], size * 0.055 * pulse, 0, Math.PI * 2);
      mctx.fill();
      mctx.fillStyle = '#0b0b25';
      mctx.font = 'bold ' + (size * 0.07) + 'px system-ui';
      mctx.textAlign = 'center'; mctx.textBaseline = 'middle';
      mctx.fillText(String(si + 1), st[0], st[1]);

      // lucioles qui montrent le chemin restant
      var g = Math.min(1, guideT) * (pts.length - 1);
      var gi = Math.floor(g), gp = pts[Math.min(gi, pts.length - 1)];
      if (guideT <= 1) {
        mctx.fillStyle = 'rgba(255,235,120,0.95)';
        mctx.beginPath();
        mctx.arc(gp[0], gp[1], size * 0.03, 0, Math.PI * 2);
        mctx.fill();
      }
    }
  }

  function redrawInk() {
    if (!ictx) return;
    ictx.clearRect(0, 0, W, H);
    doneInk.concat([curInk]).forEach(function (line) { strokeInk(line); });
  }

  function strokeInk(line) {
    if (!line || line.length < 2) return;
    ictx.lineCap = 'round'; ictx.lineJoin = 'round';
    ictx.lineWidth = size * 0.09;
    ictx.strokeStyle = '#ffd84d';
    ictx.shadowColor = '#ff9de2'; ictx.shadowBlur = 18;
    ictx.beginPath();
    line.forEach(function (p, k) { k ? ictx.lineTo(p[0], p[1]) : ictx.moveTo(p[0], p[1]); });
    ictx.stroke();
    ictx.shadowBlur = 0;
  }

  /* ---------- doigt ---------- */
  function pos(ev) {
    var r = inkC.getBoundingClientRect();
    return [ev.clientX - r.left, ev.clientY - r.top];
  }

  function onDown(ev) {
    if (over || si >= strokes.length) return;
    ev.preventDefault();
    try { inkC.setPointerCapture(ev.pointerId); } catch (e) {}
    var p = pos(ev);
    var startPt = checks[si][ci];
    // il faut partir du point vert (on apprend le bon sens du tracé)
    if (Math.hypot(p[0] - startPt[0], p[1] - startPt[1]) > size * 0.26) {
      Sound.boing();
      api.flash('👉 Pars du point vert !');
      return;
    }
    drawing = true;
    curInk = [p];
    lastPt = p;
    Sound.note(700, 0, 0.08, 'sine', 0.12);
    check(p);
  }

  function onMove(ev) {
    if (!drawing) return;
    ev.preventDefault();
    var p = pos(ev);
    ictx.lineCap = 'round'; ictx.lineJoin = 'round';
    ictx.lineWidth = size * 0.09;
    ictx.strokeStyle = '#ffd84d';
    ictx.shadowColor = '#ff9de2'; ictx.shadowBlur = 18;
    ictx.beginPath();
    ictx.moveTo(lastPt[0], lastPt[1]);
    ictx.lineTo(p[0], p[1]);
    ictx.stroke();
    ictx.shadowBlur = 0;
    curInk.push(p);
    lastPt = p;
    check(p);
  }

  function check(p) {
    var pts = checks[si];
    var tol = size * 0.19;
    for (var k = ci; k < Math.min(ci + 3, pts.length); k++) {
      if (Math.hypot(p[0] - pts[k][0], p[1] - pts[k][1]) < tol) {
        if (k >= ci) {
          if (k > ci) Sound.note(600 + k * 25, 0, 0.05, 'sine', 0.07);
          ci = k + 1;
        }
      }
    }
    if (ci >= pts.length) strokeDone();
  }

  function strokeDone() {
    drawing = false;
    doneInk.push(curInk);
    curInk = [];
    si++; ci = 0;
    Sound.sparkle();
    if (si >= strokes.length) letterDone();
  }

  function onUp(ev) {
    if (!drawing) return;
    drawing = false;
    // tracé abandonné en route : on efface juste ce trait, sans drame
    curInk = [];
    ci = 0;
    redrawInk();
    Sound.boing();
  }

  function letterDone() {
    var L = letters[li];
    api.confetti(24);
    api.dots(li + 1, PAR_PARTIE);
    api.flash('✨ ' + L + ' ✨', 'big');
    Sound.fanfare();
    Voice.say('Bravo ! Tu as écrit ' + LETTER_SAY[L] + ' !', {
      then: function () {
        if (over || !api.alive()) return;
        li++;
        if (li >= letters.length) {
          api.bumpLevel('tableau', true);
          api.win(3, '✍️');
        } else loadLetter();
      }
    });
  }

  function repeat() {
    if (letters && letters[li]) Voice.say('Écris la lettre ' + LETTER_SAY[letters[li]]);
  }

  function stop() {
    over = true;
    cancelAnimationFrame(raf);
    if (resizeH) window.removeEventListener('resize', resizeH);
    mctx = ictx = null; wrap = null;
  }

  return {
    title: 'Tableau Magique', spoken: 'Le tableau magique',
    emoji: '✍️', color: 'linear-gradient(160deg,#ff8a5c,#b02a6e)',
    need: 20,
    start: start, stop: stop, repeat: repeat
  };
})();
