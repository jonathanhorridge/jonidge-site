/* Gust Rally deterministic core: seeded RNG, course generator, fixed-step kite physics, ghost record.
 * Pure logic, no DOM. Runs in the browser (window.KCSim) and in node (require) for tests / server re-sim. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KCSim = factory();
})(this, function () {
  'use strict';
  var VERSION = 1;
  var DT = 1 / 60;
  var W = { H: 900, CEIL: 40, GROUND: 820, KITE_R: 18 };
  var P = {
    G: 980, LIFT: 2600, VDRAG: 2.2, K: 0.42, CRUISE: 300, RELAX: 0.35,
    VMIN: 150, VMAX: 780, VYMAX: 720, SKID: 300, RING_BOOST: 22, HIT_KEEP: 0.6, INVULN: 1.0
  };

  // ---------- RNG ----------
  function hashStr(s) {
    var h = 1779033703 ^ s.length;
    for (var i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function dailySeed(date) {
    var d = date || new Date();
    var s = d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
    return 'gustrally-' + s;
  }

  var THEMES = [
    { id: 'morning', name: 'Breezy Morning', sky: ['#7EC8FF', '#CDEBFF', '#FFF4DA'], hill: ['#9BE29B', '#6CC98A', '#4FB07A'], sun: '#FFE58A', w: { storm: 1, bird: 1 } },
    { id: 'golden', name: 'Golden Hour', sky: ['#FF9E7A', '#FFC98B', '#FFF1C9'], hill: ['#E9C46A', '#C9A26B', '#9C7C5B'], sun: '#FFF3B0', w: { storm: 0.8, bird: 1.1 } },
    { id: 'squall', name: 'Squall Day', sky: ['#8DB4EA', '#C6DBF5', '#F1F6FC'], hill: ['#86C7A5', '#5FAE8E', '#3F8F78'], sun: '#F2F6FF', w: { storm: 1.9, bird: 0.7 } },
    { id: 'migration', name: 'Migration Day', sky: ['#8FD3F4', '#D4F1F9', '#FFFBEA'], hill: ['#B5E48C', '#76C893', '#52B69A'], sun: '#FFEFA1', w: { storm: 0.6, bird: 1.9 } }
  ];

  // ---------- course generator ----------
  function generate(seed, opts) {
    opts = opts || {};
    var rnd = mulberry32(hashStr(String(seed)));
    var R = function (a, b) { return a + (b - a) * rnd(); };
    var pick = function (arr) { return arr[Math.floor(rnd() * arr.length)]; };
    var L = opts.length || Math.round(R(26000, 30000));
    var theme = THEMES[Math.floor(rnd() * THEMES.length)];
    var F = [];
    var top = W.CEIL, bot = W.GROUND, span = bot - top;
    var x = 1400;
    var weights = { rings: 1.2, gust: 1.0, head: 0.7, updraft: 0.9, flock: 1.1 * theme.w.bird, storm: 0.9 * theme.w.storm, combo: 0.8 };
    function choose() {
      var tot = 0, k; for (k in weights) tot += weights[k];
      var r = rnd() * tot; for (k in weights) { r -= weights[k]; if (r <= 0) return k; } return 'rings';
    }
    function rings(x0, yc, n, amp) {
      var ph = R(0, 6.28);
      for (var i = 0; i < n; i++) F.push({ type: 'ring', x: x0 + i * 120, y: clamp(yc + Math.sin(ph + i * 0.7) * amp, top + 70, bot - 70), r: 34 });
      return n * 120;
    }
    function bird(bx, by, d) {
      F.push({ type: 'bird', x: bx, y: by, ax: R(10, 40), ay: R(40, 90 + 90 * d), f: R(1.2, 2.2 + d), ph: R(0, 6.28), r: 24 });
    }
    var last = '';
    while (x < L - 1800) {
      var p = x / L, d = 0.25 + 0.75 * p;
      var kind = choose(); if (kind === last && rnd() < 0.6) kind = choose(); last = kind;
      var len = 0;
      if (kind === 'rings') {
        len = rings(x, R(top + 160, bot - 160), 5 + Math.floor(rnd() * 3), R(60, 180));
      } else if (kind === 'gust') {
        var gy = R(top + 60, bot - 220), gl = R(900, 1600);
        F.push({ type: 'gust', x0: x, x1: x + gl, y0: gy, y1: gy + 150, power: 360 });
        if (rnd() < 0.7) rings(x + 200, gy + 75, 4, 20);
        len = gl;
      } else if (kind === 'head') {
        var high = rnd() < 0.5, hl = R(600, 1100), hh = span * R(0.4, 0.55);
        F.push({ type: 'gust', x0: x, x1: x + hl, y0: high ? top : bot - hh, y1: high ? top + hh : bot, power: -300 });
        len = hl;
      } else if (kind === 'updraft') {
        var uw = R(130, 180);
        F.push({ type: 'updraft', x0: x, x1: x + uw, top: R(top + 40, top + 220), power: R(1500, 1900) });
        rings(x + uw + 160, R(top + 90, top + 200), 3, 30);
        len = uw + 520;
      } else if (kind === 'flock') {
        var n = 1 + Math.floor(rnd() * (1 + d * 2.5));
        var gapC = R(top + 160, bot - 160);
        for (var i = 0; i < n; i++) {
          var by; do { by = R(top + 60, bot - 60); } while (Math.abs(by - gapC) < span * 0.2);
          bird(x + i * R(90, 200), by, d);
        }
        len = n * 180 + 200;
      } else if (kind === 'storm') {
        var sr = R(70, 95 + 30 * d), sy = R(top + 60 + sr * 0.5, top + 260);
        F.push({ type: 'storm', x: x + sr, y: sy, r: sr, period: R(2.2, 3.4 - d), phase: R(0, 3) });
        len = sr * 2 + 300;
      } else if (kind === 'combo') {
        var cw = 150;
        F.push({ type: 'updraft', x0: x, x1: x + cw, top: top + 60, power: 1700 });
        var csr = R(70, 90);
        F.push({ type: 'storm', x: x + cw + 420, y: R(top + 300, top + 420), r: csr, period: R(2.4, 3.2), phase: R(0, 3) });
        rings(x + cw + 250, top + 130, 4, 15);
        len = cw + 700;
      }
      x += len + R(140, 340) * (1.2 - d * 0.5);
    }
    rings(L - 1300, R(300, 600), 6, 120);
    F.forEach(function (f) { if (f.x0 == null) { f.x0 = f.x - (f.r || 0) - 150; f.x1 = f.x + (f.r || 0) + 150; } });
    F.sort(function (a, b) { return a.x0 - b.x0; });
    F.forEach(function (f, i) { f.id = i; });
    return { seed: String(seed), version: VERSION, length: L, theme: theme, features: F };
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // ---------- physics ----------
  function newState() {
    return { tick: 0, t: 0, x: 0, y: 430, vx: P.CRUISE, vy: 0, hold: false, invuln: 0, finished: false, finishT: 0,
      taken: {}, hits: 0, rings: 0, inGust: 0, inUp: false, events: [], cursor: 0 };
  }

  function stormStrike(f, t) {
    // lightning: 0.7 s warning then 0.3 s strike, every period
    var c = ((t + f.phase) % f.period);
    return { warn: c > f.period - 1.0 && c <= f.period - 0.3, strike: c > f.period - 0.3 };
  }
  function birdPos(f, t) {
    return { x: f.x + Math.sin(t * f.f * 0.5 + f.ph) * f.ax, y: f.y + Math.sin(t * f.f + f.ph) * f.ay };
  }

  function hit(s, kind) {
    if (s.invuln > 0) return;
    s.vx = Math.max(P.VMIN, s.vx * P.HIT_KEEP); s.vy = kind === 'zap' ? 260 : -120;
    s.invuln = P.INVULN; s.hits++;
    s.events.push({ e: 'hit', kind: kind });
  }

  function step(s, course, hold) {
    if (s.finished) return s;
    var dt = DT;
    if (hold !== s.hold) { s.hold = hold; }
    var lift = hold ? P.LIFT * clamp(s.vx / 380, 0.55, 1.3) : 0;
    var ay = P.G - lift;
    var ax = (P.CRUISE - s.vx) * P.RELAX;
    // wind features
    var F = course.features, kx = s.x, ky = s.y, gust = 0, up = false;
    while (s.cursor < F.length && F[s.cursor].x1 < kx - 400) s.cursor++;
    for (var i = s.cursor; i < F.length; i++) {
      var f = F[i];
      if (f.x0 > kx + 400) break;
      if (f.type === 'gust') {
        if (kx >= f.x0 && kx <= f.x1 && ky >= f.y0 && ky <= f.y1) { ax += f.power; gust = f.power > 0 ? 1 : -1; }
      } else if (f.type === 'updraft') {
        if (kx >= f.x0 && kx <= f.x1 && ky >= f.top) { ay -= f.power; up = true; }
      } else if (f.type === 'storm') {
        var dx = kx - f.x, dy = ky - f.y;
        if (Math.abs(dx) < f.r * 1.6 && dy > 0) ay += 650;
        if (dx * dx + dy * dy < (f.r * 0.8 + W.KITE_R) * (f.r * 0.8 + W.KITE_R)) hit(s, 'storm');
        else if (Math.abs(dx) < 34 && dy > 0 && stormStrike(f, s.t).strike) hit(s, 'zap');
      } else if (f.type === 'bird') {
        var b = birdPos(f, s.t), bx = kx - b.x, by = ky - b.y, rr = f.r + W.KITE_R - 6;
        if (bx * bx + by * by < rr * rr) hit(s, 'bird');
      } else if (f.type === 'ring' && !s.taken[f.id]) {
        var rx = kx - f.x, ry = ky - f.y;
        if (rx * rx + ry * ry < (f.r + 6) * (f.r + 6)) { s.taken[f.id] = 1; s.rings++; s.vx += P.RING_BOOST; s.events.push({ e: 'ring', x: f.x, y: f.y }); }
      }
    }
    if (gust !== s.inGust) { if (gust) s.events.push({ e: gust > 0 ? 'gust' : 'head' }); s.inGust = gust; }
    if (up && !s.inUp) s.events.push({ e: 'updraft' });
    s.inUp = up;
    // integrate
    s.vy += ay * dt; s.vy -= s.vy * P.VDRAG * dt; s.vy = clamp(s.vy, -P.VYMAX, P.VYMAX);
    s.vx += (ax + s.vy * P.K) * dt;
    s.y += s.vy * dt;
    if (s.y >= W.GROUND) { s.y = W.GROUND; if (s.vy > 200) s.events.push({ e: 'skid' }); s.vy = Math.min(s.vy, 0); s.vx -= P.SKID * dt; s.ground = true; } else s.ground = false;
    if (s.y <= W.CEIL) { s.y = W.CEIL; s.vy = Math.max(s.vy, 0); }
    s.vx = clamp(s.vx, P.VMIN, P.VMAX);
    s.x += s.vx * dt;
    if (s.invuln > 0) s.invuln -= dt;
    s.tick++; s.t = s.tick * DT;
    if (s.x >= course.length) { s.finished = true; s.finishT = s.t - (s.x - course.length) / s.vx; s.events.push({ e: 'finish' }); }
    return s;
  }

  // ---------- ghost recorder / replay ----------
  var SAMPLE_EVERY = 4;
  function Recorder() { this.toggles = []; this.samples = []; this.last = false; }
  Recorder.prototype.record = function (s, hold) {
    if (hold !== this.last) { this.toggles.push(s.tick); this.last = hold; }
    if (s.tick % SAMPLE_EVERY === 0) this.samples.push(Math.round(s.x * 10) / 10, Math.round(s.y * 10) / 10);
  };
  Recorder.prototype.finish = function (course, s, meta) {
    this.samples.push(Math.round(s.x * 10) / 10, Math.round(s.y * 10) / 10);
    return { v: VERSION, seed: course.seed, time: s.finishT, toggles: this.toggles, samples: this.samples, every: SAMPLE_EVERY, meta: meta || {} };
  };
  function ghostAt(g, t) {
    var fi = t / DT / g.every, i = Math.floor(fi), n = g.samples.length / 2;
    if (i >= n - 1) return { x: g.samples[2 * (n - 1)], y: g.samples[2 * (n - 1) + 1], done: true };
    var a = fi - i;
    return { x: g.samples[2 * i] + (g.samples[2 * i + 2] - g.samples[2 * i]) * a, y: g.samples[2 * i + 1] + (g.samples[2 * i + 3] - g.samples[2 * i + 1]) * a, done: false };
  }
  /** Re-simulate a ghost from its input toggles (server-side validation / anti-cheat). Returns finish time. */
  function verify(course, g, maxTicks) {
    var s = newState(), ti = 0, hold = false; maxTicks = maxTicks || 60 * 240;
    while (!s.finished && s.tick < maxTicks) {
      while (ti < g.toggles.length && g.toggles[ti] === s.tick) { hold = !hold; ti++; }
      step(s, course, hold); s.events.length = 0;
    }
    return s.finished ? s.finishT : null;
  }

  // ---------- simple bot (par time, tests) ----------
  function botHold(s, course) {
    // Aim for the next ring / avoid hazards ahead; pump around the target height.
    var target = 430, F = course.features;
    for (var i = s.cursor; i < F.length; i++) {
      var f = F[i]; if (f.x0 > s.x + 700) break;
      if (f.type === 'ring' && !s.taken[f.id] && f.x > s.x + 20) { target = f.y; break; }
      if (f.type === 'gust' && f.power > 0 && f.x1 > s.x) { target = (f.y0 + f.y1) / 2; break; }
      if (f.type === 'gust' && f.power < 0 && f.x1 > s.x) { target = f.y0 <= W.CEIL + 1 ? f.y1 + 80 : f.y0 - 80; break; }
      if (f.type === 'storm' && f.x > s.x) { target = f.y + f.r + 140 < W.GROUND - 40 ? f.y + f.r * 2 + 120 : f.y - f.r - 90; if (Math.abs(f.x - s.x) < 200) target = Math.min(target, W.GROUND - 40); break; }
      if (f.type === 'bird' && f.x > s.x) { target = f.y > 430 ? f.y - 170 : f.y + 170; break; }
    }
    var lead = s.y + s.vy * 0.28;
    return lead > target;
  }
  function botRun(course, maxTicks) {
    var s = newState(); maxTicks = maxTicks || 60 * 240;
    var rec = new Recorder();
    while (!s.finished && s.tick < maxTicks) { var h = botHold(s, course); rec.record(s, h); step(s, course, h); s.events.length = 0; }
    return { state: s, ghost: rec.finish(course, s, { name: 'Bot' }) };
  }

  return { VERSION: VERSION, DT: DT, W: W, P: P, THEMES: THEMES, hashStr: hashStr, mulberry32: mulberry32, dailySeed: dailySeed,
    generate: generate, newState: newState, step: step, stormStrike: stormStrike, birdPos: birdPos,
    Recorder: Recorder, ghostAt: ghostAt, verify: verify, botHold: botHold, botRun: botRun, clamp: clamp };
});
