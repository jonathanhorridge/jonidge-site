/* Gust Rally run: fixed-step loop over KCSim, procedural canvas renderer, juice (trail, tail rope, wind streaks,
 * particles, screen shake, hit-stop), local ghost replay, HUD. */
(function (root) {
  'use strict';
  var S = root.KCSim, W = S.W, DT = S.DT;
  var TAU = Math.PI * 2;

  function hash01(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function Game(canvas, opts) {
    this.c = canvas; this.g = canvas.getContext('2d');
    this.opts = opts; this.course = opts.course; this.ghost = opts.ghost || null;
    this.kite = opts.kite || { a: '#FF5D73', b: '#FFD166', tail: '#FF8FA3' };
    this.s = S.newState(); this.rec = new S.Recorder();
    this.hold = false; this.running = false; this.countdown = 3.2; this.acc = 0; this.last = 0;
    this.shake = 0; this.hitStop = 0; this.flash = 0; this.time = 0;
    this.trail = []; this.parts = []; this.streaks = [];
    this.tail = []; for (var i = 0; i < 14; i++) this.tail.push({ x: -10 * i, y: 430, px: -10 * i, py: 430 });
    this.camX = -200; this.camY = 0;
    for (var k = 0; k < 70; k++) this.streaks.push(this._newStreak(true));
    this.reduced = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var noop = { play: function () {}, wind: function () {} };
    this._sfx = opts.silent || !root.Sfx ? noop : root.Sfx;
    this.resize();
  }

  Game.prototype.resize = function () {
    var dpr = Math.min(root.devicePixelRatio || 1, 2), r = this.c.getBoundingClientRect();
    this.c.width = Math.round(r.width * dpr); this.c.height = Math.round(r.height * dpr);
    this.scale = this.c.height / W.H; this.viewW = this.c.width / this.scale;
    this._skyGrad = null;
  };

  Game.prototype._newStreak = function (anywhere) {
    return { x: anywhere ? Math.random() * 1.2 : 1.05 + Math.random() * 0.2, y: Math.random(), len: 20 + Math.random() * 60, sp: 0.6 + Math.random() * 0.8, a: 0.15 + Math.random() * 0.35 };
  };

  Game.prototype.setHold = function (h) { this.hold = h; };

  Game.prototype.start = function () {
    var self = this; this.running = true; this.last = performance.now();
    function frame(now) {
      if (!self.running) return;
      var dt = Math.min(0.1, (now - self.last) / 1000) * (self.opts.timeScale || 1); self.last = now;
      self.update(dt); self.draw();
      self.raf = requestAnimationFrame(frame);
    }
    this.raf = requestAnimationFrame(frame);
  };
  Game.prototype.stop = function () { this.running = false; cancelAnimationFrame(this.raf); this._sfx.wind(0, false); };

  Game.prototype.update = function (dt) {
    this.time += dt;
    var s = this.s;
    if (this.countdown > 0) {
      var before = Math.ceil(this.countdown); this.countdown -= dt; var after = Math.ceil(this.countdown);
      if (after !== before && after > 0) { this.opts.onCount && this.opts.onCount(after); }
      if (this.countdown <= 0) { this.opts.onCount && this.opts.onCount(0); }
    } else if (!s.finished) {
      if (this.hitStop > 0) { this.hitStop -= dt; }
      else {
        this.acc += dt;
        var n = 0;
        while (this.acc >= DT && n < 24) {
          var h = this.opts.autopilot ? S.botHold(s, this.course) : this.hold;
          this.rec.record(s, h); S.step(s, this.course, h); this.acc -= DT; n++;
          this._events();
          if (s.finished) { this._finish(); break; }
        }
      }
    }
    // camera: kite sits ~28% from left, leads with speed
    var lead = 0.26 + (s.vx - 300) / 4000;
    var tx = s.x - this.viewW * lead;
    this.camX = this.countdown > 0 ? tx : lerp(this.camX, tx, 1 - Math.pow(0.0001, dt));
    this.shake = Math.max(0, this.shake - dt * 30);
    this.flash = Math.max(0, this.flash - dt * 3);
    this._updateFx(dt);
    this._sfx.wind(S.clamp((s.vx - 150) / 600, 0, 1), this.countdown <= 0 && !s.finished);
  };

  Game.prototype._events = function () {
    var s = this.s, ev = s.events, self = this;
    for (var i = 0; i < ev.length; i++) {
      var e = ev[i];
      if (e.e === 'ring') { this._burst(e.x, e.y, 14, ['#FFD166', '#FFF3B0', '#FFFFFF'], 260, 0.5); this._sfx.play('ring', 0.7, 1 + (s.rings % 5) * 0.06); }
      else if (e.e === 'hit') {
        this.shake = this.reduced ? 3 : 14; this.hitStop = 0.07; this.flash = e.kind === 'zap' ? 1 : 0.5;
        this._burst(s.x, s.y, e.kind === 'bird' ? 16 : 22, e.kind === 'bird' ? ['#FFFFFF', '#D8E2F0', '#9AA8BC'] : ['#FFF59D', '#FFFFFF', '#B39DDB'], 340, 0.8, e.kind === 'bird' ? 'feather' : 'spark');
        this._sfx.play(e.kind === 'zap' || e.kind === 'storm' ? 'zap' : 'hit', 0.9);
        if (navigator.vibrate) try { navigator.vibrate(40); } catch (er) {}
      }
      else if (e.e === 'gust') this._sfx.play('gust', 0.6);
      else if (e.e === 'head') this._sfx.play('gust', 0.45, 0.7);
      else if (e.e === 'updraft') this._sfx.play('updraft', 0.55);
      else if (e.e === 'skid') { this._sfx.play('skid', 0.5); this.shake = Math.max(this.shake, 4); this._burst(s.x, W.GROUND + 10, 8, ['#7CC77F', '#A8E6A1'], 160, 0.5); }
    }
    ev.length = 0;
  };

  Game.prototype._finish = function () {
    var s = this.s;
    var g = this.rec.finish(this.course, s, { name: 'Your best', kite: this.kite });
    for (var i = 0; i < 60; i++) this._burst(this.course.length + 40, 150 + Math.random() * 600, 1, ['#FF5D73', '#FFD166', '#06D6A0', '#4CC9F0', '#B388FF'], 420, 1.6, 'confetti');
    this._sfx.play('finish', 0.9);
    var self = this;
    setTimeout(function () { self.opts.onFinish && self.opts.onFinish({ time: s.finishT, rings: s.rings, hits: s.hits, ghost: g }); }, 1100);
  };

  Game.prototype._burst = function (x, y, n, cols, sp, life, kind) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * TAU, v = sp * (0.3 + Math.random() * 0.7);
      this.parts.push({ x: x, y: y, vx: Math.cos(a) * v + (kind === 'confetti' ? -100 : 0), vy: Math.sin(a) * v - (kind === 'confetti' ? 200 : 0), life: life * (0.6 + Math.random() * 0.4), max: life, c: cols[i % cols.length], kind: kind || 'dot', r: 3 + Math.random() * 4, rot: Math.random() * TAU });
    }
  };

  Game.prototype._updateFx = function (dt) {
    var s = this.s, i;
    // particles
    for (i = this.parts.length - 1; i >= 0; i--) {
      var p = this.parts[i]; p.life -= dt; if (p.life <= 0) { this.parts.splice(i, 1); continue; }
      var drag = p.kind === 'feather' || p.kind === 'confetti' ? 2.5 : 1.5;
      p.vx -= p.vx * drag * dt; p.vy -= p.vy * drag * dt; p.vy += (p.kind === 'feather' ? 60 : p.kind === 'confetti' ? 180 : 0) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += dt * 6;
    }
    // trail
    if (this.countdown <= 0) { this.trail.push({ x: s.x, y: s.y }); if (this.trail.length > 34) this.trail.shift(); }
    // tail rope (verlet, anchored at kite bottom, blown back by wind)
    var ang = Math.atan2(s.vy, s.vx), ax = s.x - Math.cos(ang) * 20, ay = s.y - Math.sin(ang) * 20 + 14;
    var t0 = this.tail[0]; t0.x = ax; t0.y = ay;
    for (i = 1; i < this.tail.length; i++) {
      var q = this.tail[i], vx = (q.x - q.px) * 0.9, vy = (q.y - q.py) * 0.9;
      q.px = q.x; q.py = q.y; q.x += vx - 30 * dt * 10 * 0.2; q.y += vy + 30 * dt + Math.sin(this.time * 9 + i * 0.8) * 0.6;
    }
    for (var it = 0; it < 3; it++) for (i = 1; i < this.tail.length; i++) {
      var A = this.tail[i - 1], B = this.tail[i], dx = B.x - A.x, dy = B.y - A.y, d = Math.sqrt(dx * dx + dy * dy) || 1, seg = 9, k = (d - seg) / d;
      B.x -= dx * k; B.y -= dy * k;
    }
    // wind streaks (screen space, flow faster than the scenery)
    var speed = (s.vx + 250) / this.viewW;
    for (i = 0; i < this.streaks.length; i++) {
      var st = this.streaks[i]; st.x -= speed * st.sp * dt * (s.inGust > 0 ? 1.8 : 1);
      if (st.x < -0.2) this.streaks[i] = this._newStreak(false);
    }
  };

  // ---------- drawing ----------
  Game.prototype.draw = function () {
    var g = this.g, sc = this.scale, s = this.s, th = this.course.theme, VW = this.viewW;
    g.setTransform(1, 0, 0, 1, 0, 0);
    // sky
    if (!this._skyGrad) { var gr = g.createLinearGradient(0, 0, 0, this.c.height); gr.addColorStop(0, th.sky[0]); gr.addColorStop(0.6, th.sky[1]); gr.addColorStop(1, th.sky[2]); this._skyGrad = gr; }
    g.fillStyle = this._skyGrad; g.fillRect(0, 0, this.c.width, this.c.height);
    var shx = this.shake ? (Math.random() - 0.5) * this.shake : 0, shy = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    g.setTransform(sc, 0, 0, sc, shx * sc, shy * sc);
    var cx = this.camX;
    // sun
    g.fillStyle = th.sun; g.globalAlpha = 0.9; g.beginPath(); g.arc(VW * 0.78, 150, 70, 0, TAU); g.fill();
    g.globalAlpha = 0.25; g.beginPath(); g.arc(VW * 0.78, 150, 110, 0, TAU); g.fill(); g.globalAlpha = 1;
    // far clouds (parallax 0.15)
    this._clouds(cx * 0.15, 0.55, 120, 360, 520, 0.8);
    // hills
    this._hills(cx * 0.25, th.hill[0], 640, 90, 0.0021, 0.5);
    this._clouds(cx * 0.35, 0.9, 200, 420, 700, 0.95);
    this._hills(cx * 0.5, th.hill[1], 720, 60, 0.0034, 1.7);
    this._ground(cx);
    // world layer
    g.save(); g.translate(-cx, 0);
    this._features(cx, VW);
    this._finishLine();
    // ghost
    if (this.ghost && this.countdown <= 0) {
      var gp = S.ghostAt(this.ghost, s.finished ? s.finishT : s.t);
      if (gp.x > cx - 50 && gp.x < cx + VW + 50) {
        g.globalAlpha = 0.45; this._kiteShape(gp.x, gp.y, 0, { a: '#FFFFFF', b: '#E0ECFF' }, 0.95); g.globalAlpha = 1;
        g.fillStyle = 'rgba(40,60,90,0.7)'; g.font = '700 18px Fredoka, system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(this.ghost.meta && this.ghost.meta.name || 'Ghost', gp.x, gp.y - 34);
      }
    }
    // kite string to the flyer far below-left
    var ang = this.countdown > 0 ? -0.15 : Math.atan2(s.vy, s.vx) * 0.6;
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(s.x, s.y + 6); g.quadraticCurveTo(s.x - 160, s.y + 220, s.x - 420, W.H + 40); g.stroke();
    // trail ribbon
    for (var i = 1; i < this.trail.length; i++) {
      var a = this.trail[i - 1], b = this.trail[i], t = i / this.trail.length;
      g.strokeStyle = 'rgba(255,255,255,' + (t * 0.55).toFixed(3) + ')'; g.lineWidth = 2 + t * 9; g.lineCap = 'round';
      g.beginPath(); g.moveTo(a.x - 22, a.y + 6); g.lineTo(b.x - 22, b.y + 6); g.stroke();
    }
    // tail
    g.strokeStyle = this.kite.tail; g.lineWidth = 2.5; g.beginPath(); g.moveTo(this.tail[0].x, this.tail[0].y);
    for (i = 1; i < this.tail.length; i++) g.lineTo(this.tail[i].x, this.tail[i].y); g.stroke();
    for (i = 2; i < this.tail.length; i += 3) this._bow(this.tail[i].x, this.tail[i].y, i % 2 ? this.kite.a : this.kite.b);
    // kite (blink while invulnerable)
    if (!(s.invuln > 0 && Math.floor(this.time * 20) % 2)) this._kiteShape(s.x, s.y, ang, this.kite, 1);
    // particles
    for (i = 0; i < this.parts.length; i++) {
      var p = this.parts[i], al = Math.max(0, p.life / p.max);
      g.globalAlpha = al; g.fillStyle = p.c;
      if (p.kind === 'confetti' || p.kind === 'feather') { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * (p.kind === 'feather' ? 0.6 : 0.9)); g.restore(); }
      else { g.beginPath(); g.arc(p.x, p.y, p.r * al + 1, 0, TAU); g.fill(); }
    }
    g.globalAlpha = 1;
    g.restore();
    // wind streaks (screen space)
    g.strokeStyle = '#FFFFFF'; g.lineCap = 'round';
    var spd = S.clamp((s.vx - 200) / 500, 0, 1);
    for (i = 0; i < this.streaks.length; i++) {
      var st = this.streaks[i]; g.globalAlpha = st.a * (0.4 + spd); g.lineWidth = 2;
      var len = st.len * (0.6 + spd * 1.4) * (s.inGust > 0 ? 1.6 : 1);
      g.beginPath(); g.moveTo(st.x * VW, st.y * W.H); g.lineTo(st.x * VW + len, st.y * W.H); g.stroke();
    }
    g.globalAlpha = 1;
    // flash
    if (this.flash > 0) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(255,255,255,' + (this.flash * 0.45).toFixed(3) + ')'; g.fillRect(0, 0, this.c.width, this.c.height); }
    this._hud();
  };

  Game.prototype._clouds = function (off, scale, y0, y1, spacing, alpha) {
    var g = this.g, VW = this.viewW, k0 = Math.floor(off / spacing) - 1, k1 = Math.ceil((off + VW) / spacing) + 1;
    g.fillStyle = '#FFFFFF';
    for (var k = k0; k <= k1; k++) {
      var x = k * spacing + hash01(k) * spacing * 0.6 - off, y = lerp(y0, y1, hash01(k + 99)), r = (30 + hash01(k + 7) * 30) * scale;
      g.globalAlpha = alpha * (0.6 + 0.4 * hash01(k + 3));
      g.beginPath(); g.arc(x, y, r, 0, TAU); g.arc(x + r * 1.1, y + r * 0.2, r * 0.8, 0, TAU); g.arc(x - r * 1.0, y + r * 0.3, r * 0.7, 0, TAU); g.arc(x + r * 0.3, y - r * 0.5, r * 0.75, 0, TAU); g.fill();
    }
    g.globalAlpha = 1;
  };
  Game.prototype._hills = function (off, col, base, amp, freq, ph) {
    var g = this.g, VW = this.viewW; g.fillStyle = col; g.beginPath(); g.moveTo(0, W.H);
    for (var x = 0; x <= VW + 20; x += 20) { var wx = x + off; g.lineTo(x, base - amp * (0.6 * Math.sin(wx * freq + ph) + 0.4 * Math.sin(wx * freq * 2.3 + ph * 2))); }
    g.lineTo(VW + 20, W.H); g.closePath(); g.fill();
  };
  Game.prototype._ground = function (cx) {
    var g = this.g, VW = this.viewW, th = this.course.theme, gy = W.GROUND + 18;
    g.fillStyle = th.hill[2]; g.fillRect(0, gy, VW, W.H - gy);
    g.strokeStyle = th.hill[1]; g.lineWidth = 3; g.lineCap = 'round';
    var sway = Math.sin(this.time * 3) * 4 + (this.s.vx - 300) / 60;
    for (var k = Math.floor(cx / 26); k < (cx + VW) / 26 + 1; k++) {
      var x = k * 26 - cx + hash01(k) * 12, h = 10 + hash01(k + 5) * 14;
      g.beginPath(); g.moveTo(x, gy + 4); g.quadraticCurveTo(x, gy - h * 0.5, x - sway, gy - h); g.stroke();
      if (hash01(k + 11) > 0.93) { g.fillStyle = hash01(k + 2) > 0.5 ? '#FFFFFF' : '#FFD166'; g.beginPath(); g.arc(x - sway, gy - h, 4, 0, TAU); g.fill(); }
    }
  };

  Game.prototype._features = function (cx, VW) {
    var g = this.g, F = this.course.features, t = this.s.t, s = this.s;
    for (var i = 0; i < F.length; i++) {
      var f = F[i]; if (f.x1 < cx - 100) continue; if (f.x0 > cx + VW + 100) break;
      if (f.type === 'gust') {
        var tail = f.power > 0;
        g.fillStyle = tail ? 'rgba(255,255,255,0.22)' : 'rgba(90,110,140,0.16)';
        roundRect(g, f.x0, f.y0, f.x1 - f.x0, f.y1 - f.y0, 40); g.fill();
        g.strokeStyle = tail ? 'rgba(255,255,255,0.85)' : 'rgba(80,100,130,0.45)'; g.lineWidth = 3; g.lineCap = 'round';
        var dir = tail ? 1 : -1, step = 70;
        for (var gx = f.x0 + 30; gx < f.x1 - 30; gx += step) for (var r = 0; r < 3; r++) {
          var yy = f.y0 + (f.y1 - f.y0) * (0.25 + r * 0.25), ph = ((t * 260 * dir + gx + r * 23) % step + step) % step;
          var x0 = gx + ph - step / 2; if (x0 < f.x0 + 20 || x0 > f.x1 - 50) continue;
          g.beginPath(); g.moveTo(x0, yy); g.lineTo(x0 + 26 * dir, yy); g.lineTo(x0 + 18 * dir, yy - 6); g.moveTo(x0 + 26 * dir, yy); g.lineTo(x0 + 18 * dir, yy + 6); g.stroke();
        }
      } else if (f.type === 'updraft') {
        var gr = g.createLinearGradient(0, f.top, 0, W.GROUND);
        gr.addColorStop(0, 'rgba(255,214,102,0)'); gr.addColorStop(0.4, 'rgba(255,214,102,0.22)'); gr.addColorStop(1, 'rgba(255,170,90,0.35)');
        g.fillStyle = gr; roundRect(g, f.x0, f.top, f.x1 - f.x0, W.GROUND - f.top + 20, 50); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.85)';
        for (var u = 0; u < 14; u++) {
          var ux = f.x0 + 15 + hash01(u + f.id) * (f.x1 - f.x0 - 30), uy = W.GROUND - (((t * (220 + u * 9)) + hash01(u * 3 + f.id) * 900) % (W.GROUND - f.top));
          g.beginPath(); g.arc(ux + Math.sin(t * 3 + u) * 6, uy, 3 + (u % 3), 0, TAU); g.fill();
        }
        g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 4;
        for (var ch = 0; ch < 3; ch++) { var cy = W.GROUND - 120 - ((t * 180 + ch * 140) % 420), mx = (f.x0 + f.x1) / 2; g.beginPath(); g.moveTo(mx - 18, cy + 12); g.lineTo(mx, cy); g.lineTo(mx + 18, cy + 12); g.stroke(); }
      } else if (f.type === 'storm') {
        var st = S.stormStrike(f, t);
        // downdraft rain
        g.strokeStyle = 'rgba(90,110,160,0.35)'; g.lineWidth = 2;
        for (var d = 0; d < 16; d++) { var dx = f.x - f.r * 1.5 + hash01(d + f.id * 5) * f.r * 3, dy = f.y + f.r * 0.6 + ((t * 420 + hash01(d) * 600) % (W.GROUND - f.y)); g.beginPath(); g.moveTo(dx, dy); g.lineTo(dx - 4, dy + 16); g.stroke(); }
        if (st.warn) { g.fillStyle = 'rgba(255,245,157,' + (0.15 + 0.15 * Math.sin(t * 40)).toFixed(3) + ')'; g.fillRect(f.x - 34, f.y, 68, W.GROUND - f.y + 20); }
        if (st.strike) {
          g.strokeStyle = '#FFF59D'; g.lineWidth = 7; g.shadowColor = '#FFFFFF'; g.shadowBlur = 20; g.beginPath(); g.moveTo(f.x, f.y + f.r * 0.5);
          var ly = f.y + f.r * 0.5, lx = f.x, seg = 0; while (ly < W.GROUND + 10) { ly += 50; lx = f.x + (hash01(seg++ + Math.floor(t * 20)) - 0.5) * 50; g.lineTo(lx, ly); }
          g.stroke(); g.shadowBlur = 0; g.lineWidth = 3; g.strokeStyle = '#FFFFFF'; g.stroke();
        }
        var dark = st.warn || st.strike ? '#4A4E7A' : '#5D6491';
        g.fillStyle = '#7A80AA'; cloudBlob(g, f.x, f.y - f.r * 0.15, f.r * 1.05);
        g.fillStyle = dark; cloudBlob(g, f.x, f.y + f.r * 0.05, f.r * 0.85);
        // eyes-free: little angry brow lines to read as hazard
        g.strokeStyle = '#2F3359'; g.lineWidth = 4; g.beginPath(); g.moveTo(f.x - f.r * 0.35, f.y - f.r * 0.05); g.lineTo(f.x - f.r * 0.12, f.y + f.r * 0.08); g.moveTo(f.x + f.r * 0.35, f.y - f.r * 0.05); g.lineTo(f.x + f.r * 0.12, f.y + f.r * 0.08); g.stroke();
      } else if (f.type === 'bird') {
        var b = S.birdPos(f, t), flap = Math.sin(t * 14 + f.ph);
        g.save(); g.translate(b.x, b.y); g.scale(-1, 1);
        g.fillStyle = '#3D4A6B'; g.beginPath(); g.ellipse(0, 0, 20, 11, 0, 0, TAU); g.fill();
        g.beginPath(); g.arc(16, -5, 8, 0, TAU); g.fill();
        g.fillStyle = '#FFB347'; g.beginPath(); g.moveTo(23, -6); g.lineTo(33, -3); g.lineTo(23, 0); g.fill();
        g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(18, -7, 2.6, 0, TAU); g.fill();
        g.fillStyle = '#52608A'; g.beginPath(); g.moveTo(-4, -2); g.quadraticCurveTo(-12, -26 * flap - 6, -26, -30 * flap); g.lineTo(6, -3); g.fill();
        g.restore();
        // off-screen warning arrow handled in HUD
      } else if (f.type === 'ring' && !s.taken[f.id]) {
        var pulse = 1 + Math.sin(t * 5 + f.id) * 0.06;
        g.strokeStyle = '#F4A300'; g.lineWidth = 9; g.beginPath(); g.ellipse(f.x, f.y, f.r * 0.45 * pulse, f.r * pulse, 0, 0, TAU); g.stroke();
        g.strokeStyle = '#FFE066'; g.lineWidth = 4; g.stroke();
      }
    }
  };

  Game.prototype._finishLine = function () {
    var g = this.g, L = this.course.length; if (L < this.camX - 100 || L > this.camX + this.viewW + 200) return;
    g.fillStyle = '#FFFFFF'; g.fillRect(L - 6, W.CEIL - 20, 12, W.GROUND - W.CEIL + 40);
    for (var y = W.CEIL; y < W.GROUND; y += 36) for (var c = 0; c < 2; c++) { g.fillStyle = ((y / 36 | 0) + c) % 2 ? '#2B2D42' : '#FFFFFF'; g.fillRect(L + 6 + c * 18, y, 18, 36); }
    g.fillStyle = '#FF5D73'; roundRect(g, L - 90, W.CEIL - 8, 180, 44, 14); g.fill();
    g.fillStyle = '#FFFFFF'; g.font = '800 26px Fredoka, system-ui, sans-serif'; g.textAlign = 'center'; g.fillText('FINISH', L, W.CEIL + 23);
  };

  Game.prototype._kiteShape = function (x, y, ang, col, sz) {
    var g = this.g, w = 26 * sz, h = 34 * sz;
    g.save(); g.translate(x, y); g.rotate(ang + 0.25);
    g.fillStyle = col.a; g.beginPath(); g.moveTo(0, -h); g.lineTo(w, -h * 0.2); g.lineTo(0, 0); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(0, h); g.lineTo(-w, -h * 0.2); g.lineTo(0, 0); g.closePath(); g.fill();
    g.fillStyle = col.b; g.beginPath(); g.moveTo(0, -h); g.lineTo(-w, -h * 0.2); g.lineTo(0, 0); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(0, h); g.lineTo(w, -h * 0.2); g.lineTo(0, 0); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(60,40,30,0.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -h); g.lineTo(0, h); g.moveTo(-w, -h * 0.2); g.lineTo(w, -h * 0.2); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -h); g.lineTo(w, -h * 0.2); g.lineTo(0, h); g.lineTo(-w, -h * 0.2); g.closePath(); g.stroke();
    g.restore();
  };
  Game.prototype._bow = function (x, y, c) {
    var g = this.g; g.fillStyle = c; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 9, y - 6); g.lineTo(x - 9, y + 6); g.closePath(); g.moveTo(x, y); g.lineTo(x + 9, y - 6); g.lineTo(x + 9, y + 6); g.closePath(); g.fill();
  };

  Game.prototype._hud = function () {
    var g = this.g, s = this.s, d = Math.min(root.devicePixelRatio || 1, 2), Wc = this.c.width, sc = this.scale;
    g.setTransform(d, 0, 0, d, 0, 0);
    var w = Wc / d, top = 14 + (this.opts.safeTop || 0);
    // progress bar
    var bx = 70, bw = w - 140, by = top + 50, p = S.clamp(s.x / this.course.length, 0, 1);
    g.fillStyle = 'rgba(255,255,255,0.55)'; roundRect(g, bx, by, bw, 8, 4); g.fill();
    g.fillStyle = '#FF5D73'; roundRect(g, bx, by, Math.max(8, bw * p), 8, 4); g.fill();
    if (this.ghost) { var gp = S.ghostAt(this.ghost, s.t); g.fillStyle = '#FFFFFF'; g.strokeStyle = '#5D6491'; g.lineWidth = 2; g.beginPath(); g.arc(bx + bw * S.clamp(gp.x / this.course.length, 0, 1), by + 4, 6, 0, TAU); g.fill(); g.stroke(); }
    g.fillStyle = '#FFD166'; g.strokeStyle = '#FF5D73'; g.beginPath(); g.arc(bx + bw * p, by + 4, 7, 0, TAU); g.fill(); g.stroke();
    // timer
    var tt = this.countdown > 0 ? 0 : (s.finished ? s.finishT : s.t);
    g.textAlign = 'center'; g.font = '800 34px Fredoka, system-ui, sans-serif'; g.lineWidth = 6; g.strokeStyle = 'rgba(43,45,66,0.35)';
    g.strokeText(fmt(tt), w / 2, top + 36); g.fillStyle = '#FFFFFF'; g.fillText(fmt(tt), w / 2, top + 36);
    // ghost delta
    if (this.ghost && this.countdown <= 0) {
      var gp2 = S.ghostAt(this.ghost, s.t), dl = (gp2.x - s.x) / Math.max(150, s.vx);
      if (gp2.done) dl = s.t - this.ghost.time + (this.course.length - s.x) / Math.max(150, s.vx);
      g.font = '700 16px Fredoka, system-ui, sans-serif'; g.fillStyle = dl > 0 ? '#FFE3E8' : '#D9FFF1';
      g.fillText((dl > 0 ? '+' : '−') + Math.abs(dl).toFixed(2) + 's vs best', w / 2, top + 84);
    }
    // speed gauge
    var sp = S.clamp((s.vx - 150) / 630, 0, 1);
    g.fillStyle = 'rgba(255,255,255,0.5)'; roundRect(g, 14, top + 12, 10, 90, 5); g.fill();
    g.fillStyle = sp > 0.6 ? '#06D6A0' : '#4CC9F0'; roundRect(g, 14, top + 12 + 90 * (1 - sp), 10, 90 * sp, 5); g.fill();
    // incoming bird warnings at right edge
    var F = this.course.features, edge = this.camX + this.viewW;
    for (var i = s.cursor; i < F.length; i++) {
      var f = F[i]; if (f.x0 > edge + 500) break;
      if ((f.type === 'bird' || f.type === 'storm') && f.x > edge && f.x < edge + 500) {
        var yy = f.type === 'bird' ? S.birdPos(f, s.t).y : f.y, sy = yy * sc / d, a = 1 - (f.x - edge) / 500;
        g.globalAlpha = 0.35 + 0.65 * a; g.fillStyle = f.type === 'bird' ? '#FF5D73' : '#5D6491';
        g.beginPath(); g.moveTo(w - 6, sy); g.lineTo(w - 22, sy - 10); g.lineTo(w - 22, sy + 10); g.closePath(); g.fill(); g.globalAlpha = 1;
      }
    }
    // countdown + hint
    if (this.countdown > 0) {
      var n = Math.ceil(this.countdown), fr = this.countdown - Math.floor(this.countdown);
      g.font = '800 ' + Math.round(90 + 40 * fr) + 'px Fredoka, system-ui, sans-serif'; g.fillStyle = '#FFFFFF'; g.strokeStyle = 'rgba(43,45,66,0.3)'; g.lineWidth = 8;
      g.strokeText(String(n), w / 2, this.c.height / d * 0.42); g.fillText(String(n), w / 2, this.c.height / d * 0.42);
    }
    if (s.t < 4 && !this.opts.autopilot) {
      g.font = '700 18px Fredoka, system-ui, sans-serif'; g.fillStyle = 'rgba(43,45,66,0.75)';
      g.fillText('Hold to rise · release to dive', w / 2, this.c.height / d - 40 - (this.opts.safeBottom || 0));
    }
  };

  function roundRect(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function cloudBlob(g, x, y, r) { g.beginPath(); g.arc(x, y, r * 0.7, 0, TAU); g.arc(x - r * 0.7, y + r * 0.2, r * 0.5, 0, TAU); g.arc(x + r * 0.7, y + r * 0.2, r * 0.55, 0, TAU); g.arc(x - r * 0.3, y - r * 0.4, r * 0.5, 0, TAU); g.arc(x + r * 0.35, y - r * 0.35, r * 0.45, 0, TAU); g.fill(); }
  function fmt(t) { var m = Math.floor(t / 60), sec = t - m * 60; return m + ':' + (sec < 10 ? '0' : '') + sec.toFixed(2); }

  root.KCGame = Game; root.KCfmt = fmt;
})(this);
