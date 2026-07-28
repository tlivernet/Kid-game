/* ==========================================================================
   Attrape-Ballons 🎈 — les ballons montent, il faut éclater la bonne lettre.
   Jeu d'action : idéal quand l'enfant n'a pas envie de "travailler".
   ========================================================================== */
Games.ballons = (function () {
  var GOAL = 10;
  var root, api, level, zone, hud, CFG;
  var balloons, raf, spawner, last, score, miss, target, running;

  function config(lv) {
    if (lv <= 1) return { pool: LETTER_LEVELS[0], speed: 58, every: 950, casing: 'upper' };
    if (lv === 2) return { pool: LETTER_LEVELS[1], speed: 72, every: 850, casing: 'upper' };
    if (lv === 3) return { pool: LETTER_LEVELS[2], speed: 88, every: 750, casing: 'lower' };
    return { pool: LETTER_LEVELS[3], speed: 105, every: 650, casing: 'mix' };
  }

  function start(_root, _api, lv) {
    root = _root; api = _api; level = lv;
    balloons = []; score = 0; miss = 0; running = true;
    CFG = config(lv);
    // pool figé pour toute la partie (cf. noAmbig : « l » vs « I »)
    CFG.pool = CFG.casing === 'upper' ? CFG.pool : noAmbig(CFG.pool);
    root.innerHTML =
      '<div class="ball-hud" id="b-hud"></div>' +
      '<div class="ball-zone" id="b-zone"></div>';
    zone = document.getElementById('b-zone');
    hud = document.getElementById('b-hud');
    newTarget();
    api.dots(0, GOAL);
    last = performance.now();
    raf = requestAnimationFrame(loop);
    spawner = setInterval(function () { spawn(); }, CFG.every);
    // quelques ballons déjà en vol : l'écran n'est jamais vide au démarrage
    for (var i = 0; i < 3; i++) spawn(zone.clientHeight * (0.45 + i * 0.2));
  }

  function newTarget() {
    var cfg = CFG;
    var t;
    do { t = pick(cfg.pool); } while (t === target && cfg.pool.length > 1);
    target = t;
    hud.innerHTML = '<span class="hud-lbl">Éclate&nbsp;:</span>' +
                    '<span class="hud-letter">' + target + '</span>' +
                    '<span class="hud-letter small">' + target.toLowerCase() + '</span>';
    Voice.say('Éclate les ' + LETTER_SAY[target], { rate: 0.9 });
  }

  function spawn(startY) {
    if (!running) return;
    var cfg = CFG;
    var isTarget = Math.random() < 0.45;
    var L = isTarget ? target : pick(cfg.pool.filter(function (x) { return x !== target; }));
    if (!L) L = target;

    var b = el('div', 'balloon');
    var shown = cfg.casing === 'upper' ? L :
                cfg.casing === 'lower' ? L.toLowerCase() :
                (Math.random() < 0.5 ? L : L.toLowerCase());
    b.innerHTML = '<span class="bl">' + shown + '</span>';
    b.style.setProperty('--hue', Math.floor(Math.random() * 360));
    var W = zone.clientWidth, H = zone.clientHeight;
    var size = Math.max(78, Math.min(130, W * 0.15));
    b.style.width = size + 'px';
    b.style.height = (size * 1.2) + 'px';
    var obj = {
      el: b, letter: L,
      x: 10 + Math.random() * Math.max(10, W - size - 20),
      y: (typeof startY === 'number' ? startY : H + 20),
      sp: cfg.speed * (0.8 + Math.random() * 0.5),
      drift: (Math.random() - 0.5) * 26,
      t: Math.random() * 6,
      size: size, dead: false
    };
    b.style.transform = 'translate(' + obj.x + 'px,' + obj.y + 'px)';
    tap(b, function () { hit(obj); });
    zone.appendChild(b);
    balloons.push(obj);
  }

  function loop(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    var W = zone.clientWidth;
    for (var i = balloons.length - 1; i >= 0; i--) {
      var b = balloons[i];
      b.t += dt;
      b.y -= b.sp * dt;
      var x = b.x + Math.sin(b.t * 1.6) * b.drift;
      x = Math.max(0, Math.min(W - b.size, x));
      b.el.style.transform = 'translate(' + x + 'px,' + b.y + 'px)';
      if (b.y < -b.size * 1.4) { remove(i); }
    }
    raf = requestAnimationFrame(loop);
  }

  function remove(i) {
    var b = balloons[i];
    if (b.el.parentNode) b.el.parentNode.removeChild(b.el);
    balloons.splice(i, 1);
  }

  function hit(obj) {
    if (!running || obj.dead) return;
    obj.dead = true;
    var idx = balloons.indexOf(obj);
    if (obj.letter === target) {
      Sound.pop();
      burst(obj, '💥');
      score++;
      api.dots(score, GOAL);
      if (idx >= 0) remove(idx);
      if (score % 3 === 0 && score < GOAL) newTarget();
      if (score >= GOAL) finish();
    } else {
      miss++;
      Sound.prout(0.25);
      burst(obj, '💩');
      obj.el.classList.add('wrong');
      if (idx >= 0) remove(idx);
    }
  }

  function burst(obj, emoji) {
    var p = el('div', 'burst', emoji);
    p.style.left = obj.x + obj.size / 2 + 'px';
    p.style.top = obj.y + obj.size / 2 + 'px';
    zone.appendChild(p);
    setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 700);
  }

  function finish() {
    running = false;
    clearInterval(spawner);
    cancelAnimationFrame(raf);
    var stars = miss <= 1 ? 3 : (miss <= 4 ? 2 : 1);
    api.bumpLevel('ballons', miss <= 2);
    api.win(stars, '🎈');
  }

  function stop() {
    running = false;
    clearInterval(spawner);
    cancelAnimationFrame(raf);
    balloons = [];
  }

  function repeat() { if (target) Voice.say('Éclate les ' + LETTER_SAY[target]); }

  return {
    title: 'Attrape-Ballons', spoken: 'Attrape les ballons',
    emoji: '🎈', color: 'linear-gradient(160deg,#ff6ea9,#c81d6b)',
    need: 8,
    start: start, stop: stop, repeat: repeat
  };
})();
