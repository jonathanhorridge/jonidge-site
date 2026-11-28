/* Lilyward - canvas renderer: original procedural art (frogs, bugs, pond), particles, screen shake. */
(function (root) {
  'use strict';
  var D = root.GameData, TAU = Math.PI * 2;
  var R = { particles: [], texts: [], shake: 0, flash: 0, rings: [], bg: null, bgKey: '', view: { ox: 0, oy: 0, ts: 40 }, t: 0, hat: 'none', imgs: {} };

  // background paintings (generated original art), loaded once
  ['pond-day', 'pond-dusk', 'pond-night'].forEach(function (k) {
    if (typeof Image === 'undefined') return;
    var im = new Image(); im.onload = function () { R.bgKey = ''; }; im.src = 'assets/img/' + k + '.jpg'; R.imgs[k] = im;
  });

  function rnd(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  function circle(c, x, y, r, fill) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = fill; c.fill(); }
  function ell(c, x, y, rx, ry, fill, rot) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); c.fillStyle = fill; c.fill(); }
  function hex(h) { if (h.indexOf('rgb') === 0) return h.match(/[\d.]+/g).slice(0, 3).map(Number); h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(function (x) { return x + x; }).join(''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function shade(h, a) { var c = hex(h); return 'rgb(' + c.map(function (v) { return Math.round(a > 0 ? v + (255 - v) * a : v * (1 + a)); }).join(',') + ')'; }
  /** shaded, outlined ellipse: light from top-left */
  function blob(c, x, y, rx, ry, col, opts) {
    opts = opts || {};
    var g = c.createRadialGradient(x - rx * 0.35, y - ry * 0.45, Math.max(1, Math.min(rx, ry) * 0.1), x, y, Math.max(rx, ry) * 1.05);
    g.addColorStop(0, shade(col, 0.35)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, -0.28));
    c.beginPath(); c.ellipse(x, y, rx, ry, opts.rot || 0, 0, TAU); c.fillStyle = g; c.fill();
    if (opts.line !== false) { c.lineWidth = opts.lw || Math.max(1.2, Math.min(rx, ry) * 0.09); c.strokeStyle = opts.line || shade(col, -0.55); c.stroke(); }
  }
  function star(c, x, y, r, col) { c.beginPath(); for (var i = 0; i < 10; i++) { var rr = i % 2 ? r * 0.45 : r, an = i / 10 * TAU - Math.PI / 2; c.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } c.closePath(); c.fillStyle = col; c.fill(); }

  R.layout = function (W, H, top, bottom) {
    var cols = D.COLS, rows = D.ROWS, availH = H - top - bottom;
    var ts = Math.floor(Math.min(W / cols, availH / rows));
    R.view = { ts: ts, ox: Math.round((W - ts * cols) / 2), oy: Math.round(top + (availH - ts * rows) / 2), W: W, H: H };
    R.bgKey = '';
    return R.view;
  };
  R.toTile = function (px, py) { var v = R.view; return { x: (px - v.ox) / v.ts, y: (py - v.oy) / v.ts }; };
  function themeOf(s) {
    if (s && s.L && s.L.theme) return s.L.theme;
    var w = s && s.L && s.L.world, W = D.WORLDS && D.WORLDS[w];
    return (W && W.theme) || 'day';
  }
  function dusk(s) { var th = themeOf(s); return th === 'dusk' || th === 'night'; }

  function buildBg(s, dpr) {
    var v = R.view, W = v.W, H = v.H, cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    var c = cv.getContext('2d'); c.scale(dpr, dpr);
    var ts = v.ts, rand = rnd(1234 + s.level * 977), night = dusk(s);
    var g = c.createLinearGradient(0, 0, 0, H);
    if (night) { g.addColorStop(0, '#1C3F66'); g.addColorStop(1, '#0F2C45'); } else { g.addColorStop(0, '#1F9E95'); g.addColorStop(1, '#13707E'); }
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    var im = R.imgs[themeOf(s) === 'night' ? 'pond-night' : (dusk(s) ? 'pond-dusk' : 'pond-day')];
    if (im && im.complete && im.naturalWidth) {
      // cover + zoom so the painted banks sit just outside the board
      var sc = Math.max(W / im.naturalWidth, H / im.naturalHeight) * 1.28, iw = im.naturalWidth * sc, ih = im.naturalHeight * sc;
      c.drawImage(im, (W - iw) / 2, (H - ih) / 2, iw, ih);
      c.fillStyle = night ? 'rgba(10,20,50,0.12)' : 'rgba(0,60,70,0.10)'; c.fillRect(0, 0, W, H);
    }
    var X = function (tx) { return v.ox + tx * ts; }, Y = function (ty) { return v.oy + ty * ts; };
    // decor: small floating lilies, blossoms, reeds on free tiles
    for (var ty = -1; ty <= D.ROWS; ty++) for (var tx = -1; tx <= D.COLS; tx++) {
      if (s.pathSet[tx + ',' + ty]) continue;
      if (s.pads.some(function (p) { return p.tx === tx && p.ty === ty; })) continue;
      var q = rand(), cx = X(tx + 0.5) + (rand() - 0.5) * ts * 0.5, cy = Y(ty + 0.5) + (rand() - 0.5) * ts * 0.5;
      if (q < 0.16) { lily(c, cx, cy, ts * (0.15 + rand() * 0.12), rand() * TAU, 0.8); if (rand() < 0.35) flower(c, cx + ts * 0.05, cy - ts * 0.04, ts * 0.11, rand() < 0.5 ? '#FFB3D9' : '#FFF4C2'); }
      else if (q < 0.24 && (tx <= 0 || tx >= D.COLS - 1)) reeds(c, cx, cy, ts, rand);
    }
    // path: soft shadow, dark rim, mud body, sun-dried center, then texture
    var pts = s.path.pts;
    function trace(off) { c.beginPath(); c.moveTo(X(pts[0].x), Y(pts[0].y) + (off || 0)); for (var k = 1; k < pts.length; k++) c.lineTo(X(pts[k].x), Y(pts[k].y) + (off || 0)); }
    function stroke(w, col, off) { trace(off); c.lineWidth = w; c.strokeStyle = col; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
    stroke(ts * 1.12, 'rgba(0,25,30,0.35)', ts * 0.14);
    stroke(ts * 1.04, '#4E7A2E');            // mossy bank
    stroke(ts * 0.92, '#5B3E1E');            // wet rim
    stroke(ts * 0.8, '#8A6234');
    stroke(ts * 0.6, '#A57A47');
    stroke(ts * 0.34, '#B88D57');
    c.save(); c.setLineDash([2, ts * 0.21]); stroke(ts * 0.07, 'rgba(70,45,20,0.45)', -ts * 0.18); stroke(ts * 0.07, 'rgba(70,45,20,0.45)', ts * 0.18); c.restore(); // footprints
    for (var d = 0; d < s.path.length; d += 0.14) {
      var p = root.Engine.pathPos(s.path, d), sd = rand() < 0.5 ? -1 : 1, o = rand() * 0.36;
      var px = X(p.x - p.dy * o * sd), py = Y(p.y + p.dx * o * sd);
      if (rand() < 0.5) circle(c, px, py, ts * (0.02 + rand() * 0.035), rand() < 0.5 ? 'rgba(220,190,140,0.7)' : 'rgba(90,60,30,0.6)');
      // grass tufts on the bank
      if (rand() < 0.5) {
        var ex = X(p.x - p.dy * 0.5 * sd), ey = Y(p.y + p.dx * 0.5 * sd);
        c.strokeStyle = rand() < 0.5 ? '#7CC04A' : '#5E9E36'; c.lineWidth = 1.6; c.lineCap = 'round';
        for (var b = 0; b < 3; b++) { c.beginPath(); c.moveTo(ex + (b - 1) * 2.5, ey); c.lineTo(ex + (b - 1) * 3.5 + (rand() - 0.5) * 3, ey - ts * (0.08 + rand() * 0.08)); c.stroke(); }
      }
    }
    // spawn burrow (hollow log mouth)
    var a = pts[0], bpt = pts[1], len = Math.hypot(bpt.x - a.x, bpt.y - a.y), sx = X(a.x + (bpt.x - a.x) / len * 0.9), sy = Y(a.y + (bpt.y - a.y) / len * 0.9);
    blob(c, sx, sy, ts * 0.55, ts * 0.42, '#6B4423'); ell(c, sx, sy + 2, ts * 0.38, ts * 0.26, '#1A0F06');
    ell(c, sx - ts * 0.12, sy - ts * 0.02, ts * 0.06, ts * 0.04, 'rgba(255,60,60,0.7)'); ell(c, sx + ts * 0.1, sy - ts * 0.02, ts * 0.06, ts * 0.04, 'rgba(255,60,60,0.7)');
    // vignette
    var vg = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, night ? 'rgba(0,0,20,0.45)' : 'rgba(0,30,40,0.35)');
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
    R.bg = cv; R.bgKey = s.level + ':' + W + 'x' + H + ':' + (im && im.complete ? 1 : 0);
  }
  function lily(c, x, y, r, rot, alpha) {
    c.save(); c.globalAlpha = alpha || 1; c.translate(x, y); c.rotate(rot);
    var g = c.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
    g.addColorStop(0, '#8BD45F'); g.addColorStop(1, '#3F8F2E');
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r, 0.35, TAU - 0.15); c.closePath(); c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(30,90,30,0.7)'; c.lineWidth = Math.max(1, r * 0.07);
    for (var i = 0; i < 5; i++) { var an = 0.6 + i * 1.1; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(an) * r * 0.8, Math.sin(an) * r * 0.8); c.stroke(); }
    c.restore();
  }
  function flower(c, x, y, r, col) {
    for (var i = 0; i < 7; i++) { var an = i / 7 * TAU; ell(c, x + Math.cos(an) * r * 0.6, y + Math.sin(an) * r * 0.6, r * 0.55, r * 0.28, col, an); }
    circle(c, x, y, r * 0.35, '#FFD23F');
  }
  function reeds(c, x, y, ts, rand) {
    c.lineCap = 'round';
    for (var i = 0; i < 4; i++) {
      var bx = x + (rand() - 0.5) * ts * 0.5, h = ts * (0.5 + rand() * 0.4);
      c.strokeStyle = '#2F7A3A'; c.lineWidth = 3; c.beginPath(); c.moveTo(bx, y); c.quadraticCurveTo(bx + 4, y - h * 0.5, bx + (rand() - 0.5) * 10, y - h); c.stroke();
      if (rand() < 0.5) ell(c, bx + 2, y - h * 0.7, 3, 8, '#7A4A22');
    }
  }

  function drawPad(c, x, y, ts, sel, empty, pulse, tier) {
    ell(c, x, y + ts * 0.09, ts * 0.47, ts * 0.4, 'rgba(0,30,35,0.32)');
    c.save(); c.translate(x, y);
    var g = c.createRadialGradient(-ts * 0.15, -ts * 0.15, 2, 0, 0, ts * 0.48);
    g.addColorStop(0, sel ? '#C8F59A' : '#86CF5A'); g.addColorStop(1, sel ? '#7BC94F' : '#3F922E');
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, ts * 0.45, -1.1, TAU - 1.45); c.closePath();
    c.fillStyle = g; c.fill();
    c.lineWidth = 2; c.strokeStyle = sel ? '#FFF6B0' : '#2E6E22'; c.stroke();
    c.strokeStyle = 'rgba(40,100,30,0.5)'; c.lineWidth = 1.3;
    for (var i = 0; i < 6; i++) { var an = -0.6 + i * 1.0; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(an) * ts * 0.36, Math.sin(an) * ts * 0.36); c.stroke(); }
    c.beginPath(); c.arc(0, 0, ts * 0.38, 3.6, 4.4); c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2; c.stroke();
    if (tier >= 1) { c.beginPath(); c.arc(0, 0, ts * 0.45, 0, TAU); c.lineWidth = 3; c.strokeStyle = tier === 2 ? '#FFD23F' : '#D9E6EE'; c.stroke(); }
    if (empty) {
      c.globalAlpha = 0.5 + 0.4 * pulse; c.strokeStyle = '#F4FFE6'; c.lineWidth = 3; c.lineCap = 'round';
      var k = ts * 0.11; c.beginPath(); c.moveTo(-k, 0); c.lineTo(k, 0); c.moveTo(0, -k); c.lineTo(0, k); c.stroke(); c.globalAlpha = 1;
    }
    c.restore();
  }

  function drawHat(c, x, y, r, hat) {
    if (!hat || hat === 'none') return;
    c.save(); c.translate(x, y - r * 0.95);
    if (hat === 'crown') { // woven reed crown
      c.fillStyle = '#E8C15A'; c.strokeStyle = '#8A6420'; c.lineWidth = 1.3;
      for (var i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(i * r * 0.17, -r * 0.18 - (2 - Math.abs(i)) * r * 0.06, r * 0.07, r * 0.2, i * 0.15, 0, TAU); c.fill(); c.stroke(); }
      c.fillStyle = '#C99A2E'; c.fillRect(-r * 0.42, -r * 0.06, r * 0.84, r * 0.12); circle(c, 0, 0, r * 0.06, '#4FC3F7');
    } else if (hat === 'party') { // lily blossom
      for (i = 0; i < 6; i++) { var an = i / 6 * TAU; ell(c, Math.cos(an) * r * 0.2, -r * 0.15 + Math.sin(an) * r * 0.1, r * 0.2, r * 0.1, i % 2 ? '#FF8FC8' : '#FFC2E2', an); }
      circle(c, 0, -r * 0.15, r * 0.08, '#FFD23F');
    } else if (hat === 'leaf') {
      ell(c, 0, -r * 0.12, r * 0.45, r * 0.2, '#3E9B2F', -0.25); c.strokeStyle = '#2A6B20'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-r * 0.4, 0); c.lineTo(r * 0.4, -r * 0.24); c.stroke();
    } else if (hat === 'viking') { // acorn cap
      c.beginPath(); c.arc(0, 0, r * 0.42, Math.PI, TAU); c.fillStyle = '#8D5A2B'; c.fill(); c.strokeStyle = '#5A3415'; c.lineWidth = 1.5; c.stroke();
      c.strokeStyle = 'rgba(60,30,10,0.6)'; for (i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * r * 0.15, -r * 0.05); c.lineTo(i * r * 0.1, -r * 0.32); c.stroke(); }
      c.fillStyle = '#5A3415'; c.fillRect(-r * 0.04, -r * 0.6, r * 0.08, r * 0.2);
    }
    c.restore();
  }

  // ---- frog defenders (all original designs) ----
  function eyes(c, x, y, r, col, ax, ay, blink) {
    [-1, 1].forEach(function (sd) {
      var ex = x + sd * r * 0.47, ey = y - r * 0.66;
      blob(c, ex, ey, r * 0.34, r * 0.32, col);
      if (blink) { c.strokeStyle = shade(col, -0.55); c.lineWidth = Math.max(1.5, r * 0.08); c.beginPath(); c.arc(ex, ey - r * 0.02, r * 0.2, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); return; }
      circle(c, ex, ey, r * 0.25, '#FFFFFF');
      circle(c, ex + ax * r * 0.08, ey + ay * r * 0.08, r * 0.14, '#13202B');
      circle(c, ex + ax * r * 0.08 - r * 0.05, ey + ay * r * 0.08 - r * 0.05, r * 0.05, '#FFFFFF');
    });
  }
  function bandana(c, x, y, r, col, now) { // neck scarf with fluttering tails
    var yy = y + r * 0.12, w = Math.sin(now * 6) * r * 0.08;
    c.fillStyle = col; c.strokeStyle = shade(col, -0.5); c.lineWidth = 1.2;
    c.beginPath(); c.ellipse(x, yy, r * 0.72, r * 0.16, 0, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x + r * 0.35, yy + r * 0.05); c.lineTo(x + r * 0.62, yy + r * 0.5 + w); c.lineTo(x + r * 0.3, yy + r * 0.42 + w); c.closePath(); c.fill(); c.stroke();
    circle(c, x + r * 0.33, yy + r * 0.04, r * 0.09, shade(col, -0.2));
  }
  function drawTower(c, t, ts, now) {
    var T = D.TOWERS[t.type], v = R.view, x = v.ox + t.x * ts, y = v.oy + t.y * ts, L = t.lvl, r = ts * (0.31 + L * 0.04);
    var bounce = t.anim > 0 ? Math.sin(t.anim / 0.18 * Math.PI) * ts * 0.06 : 0, breathe = Math.sin(now * 2.2 + t.id) * ts * 0.012;
    var blink = ((now + t.id * 1.37) % 4.2) < 0.13 && !t.icon;
    y -= bounce;
    if (L === 2 && !t.icon) { // legendary aura
      c.save(); c.globalAlpha = 0.28 + 0.12 * Math.sin(now * 3); circle(c, x, y + ts * 0.05, r * 1.4, '#FFE680'); c.restore();
      for (var sp = 0; sp < 3; sp++) { var sa = now * 1.5 + sp * TAU / 3; star(c, x + Math.cos(sa) * r * 1.25, y + Math.sin(sa) * r * 0.9, ts * 0.04, '#FFF6B0'); }
    }
    var ax = Math.cos(t.aim), ay = Math.sin(t.aim), col = T.color, dark = T.dark;
    ell(c, x, y + r * 0.62, r * 1.0, r * 0.28, 'rgba(0,0,0,0.25)');
    if (t.type === 'glow') {
      // Glow Keeper: plump frog holding a firefly lantern on a reed pole
      ell(c, x - r * 0.8, y + r * 0.45, r * 0.3, r * 0.17, dark, 0.4); ell(c, x + r * 0.8, y + r * 0.45, r * 0.3, r * 0.17, dark, -0.4);
      blob(c, x, y, r * 0.95, r * 0.88 + breathe, col);
      blob(c, x, y + r * 0.3, r * 0.58, r * 0.42, T.belly, { line: false });
      eyes(c, x, y, r, col, 0.3, 0.4, blink);
      c.strokeStyle = dark; c.lineWidth = Math.max(1.5, r * 0.08); c.beginPath(); c.arc(x, y - r * 0.05, r * 0.38, 0.25 * Math.PI, 0.75 * Math.PI); c.stroke();
      var lx = x + r * 0.95, ly = y - r * 0.55 - (t.anim > 0 ? r * 0.15 : 0), lr = r * (0.3 + L * 0.06), pulse = 0.6 + 0.4 * Math.sin(now * 4 + t.id);
      c.strokeStyle = '#7A5230'; c.lineWidth = r * 0.1; c.beginPath(); c.moveTo(x + r * 0.55, y + r * 0.2); c.lineTo(lx, ly - lr * 1.2); c.stroke();
      c.save(); c.globalAlpha = 0.35 * pulse; circle(c, lx, ly, lr * 2.2, '#FFE680'); c.restore();
      c.fillStyle = 'rgba(255,245,200,0.85)'; c.strokeStyle = L === 2 ? '#D4A017' : '#6B4A26'; c.lineWidth = 1.6;
      c.beginPath(); c.ellipse(lx, ly, lr * 0.8, lr, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = L === 2 ? '#FFD23F' : '#8A6234'; c.fillRect(lx - lr * 0.6, ly - lr * 1.15, lr * 1.2, lr * 0.25);
      for (var f = 0; f < 2 + L; f++) { var fa = now * 3 + f * 2.1; circle(c, lx + Math.cos(fa) * lr * 0.4, ly + Math.sin(fa * 1.3) * lr * 0.5, lr * 0.16, '#FFF35C'); }
      if (L >= 1) bandana(c, x, y, r, L === 2 ? '#FFD23F' : '#4FC3F7', now);
      drawHat(c, x, y - r * 0.35, r, R.hat);
    } else {
      var bw = r * (t.type === 'toad' ? 1.15 : t.type === 'newt' ? 0.85 : 1), bh = r * (t.type === 'newt' ? 0.95 : 0.88) + breathe;
      if (t.type === 'newt') { // curling tail + crest
        c.strokeStyle = dark; c.lineWidth = r * 0.36; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + r * 0.45, y + r * 0.45); c.quadraticCurveTo(x + r * 1.25, y + r * 0.6 + Math.sin(now * 5 + t.id) * 3, x + r * 1.1, y - r * 0.25); c.stroke();
        c.strokeStyle = col; c.lineWidth = r * 0.22; c.stroke();
      }
      if (t.type === 'dart') { // thorns on the back, more per tier
        var n = 3 + L * 2;
        for (var k = 0; k < n; k++) {
          var ta = Math.PI + 0.25 + k / (n - 1) * (Math.PI - 0.5), tx0 = x + Math.cos(ta) * bw * 0.85, ty0 = y + Math.sin(ta) * bh * 0.85;
          c.beginPath(); c.moveTo(tx0 + Math.cos(ta + 1.57) * r * 0.1, ty0 + Math.sin(ta + 1.57) * r * 0.1); c.lineTo(x + Math.cos(ta) * bw * 1.22, y + Math.sin(ta) * bh * 1.22); c.lineTo(tx0 - Math.cos(ta + 1.57) * r * 0.1, ty0 - Math.sin(ta + 1.57) * r * 0.1); c.closePath();
          c.fillStyle = L === 2 ? '#FFD23F' : '#2A1548'; c.fill();
        }
      }
      ell(c, x - bw * 0.8, y + r * 0.45, r * 0.32, r * 0.18, dark, 0.4); ell(c, x + bw * 0.8, y + r * 0.45, r * 0.32, r * 0.18, dark, -0.4);
      blob(c, x, y, bw, bh, col);
      blob(c, x, y + r * 0.3, bw * 0.6, bh * 0.48, T.belly, { line: false });
      if (t.type === 'toad') { [[-0.5, -0.3], [0.45, -0.2], [-0.2, -0.5], [0.62, 0.18], [-0.72, 0.1], [0.2, -0.05]].forEach(function (w) { blob(c, x + w[0] * r, y + w[1] * r, r * 0.09, r * 0.08, dark, { line: false }); }); }
      if (t.type === 'dart') { [[-0.55, -0.1], [0.5, -0.25], [0.05, -0.45], [0.62, 0.22], [-0.6, 0.32]].forEach(function (w) { circle(c, x + w[0] * r, y + w[1] * r, r * 0.11, '#1B1036'); }); }
      if (t.type === 'newt') { [[-0.35, -0.35], [0.35, -0.35], [0, -0.55], [-0.5, 0.05], [0.5, 0.05]].forEach(function (w) { circle(c, x + w[0] * r, y + w[1] * r, r * 0.08, '#FF8A00'); }); }
      if (t.type === 'bubble') { // vocal sac inflates when firing
        var sac = r * (0.28 + (t.anim > 0 ? 0.18 * (t.anim / 0.18) : 0.04 * Math.sin(now * 3 + t.id)));
        ell(c, x, y + r * 0.42, sac * 1.2, sac, 'rgba(200,240,255,0.92)'); circle(c, x - sac * 0.4, y + r * 0.35, sac * 0.25, '#FFFFFF');
      }
      eyes(c, x, y, r, col, ax, ay, blink);
      c.strokeStyle = dark; c.lineWidth = Math.max(1.5, r * 0.08); c.lineCap = 'round';
      c.beginPath(); c.arc(x, y - r * 0.05, r * 0.4, 0.25 * Math.PI, 0.75 * Math.PI); c.stroke();
      circle(c, x - r * 0.56, y - r * 0.05, r * 0.1, 'rgba(255,120,150,0.45)'); circle(c, x + r * 0.56, y - r * 0.05, r * 0.1, 'rgba(255,120,150,0.45)');
      // tier gear
      if (L >= 1) {
        if (t.type === 'tongue') bandana(c, x, y, r, L === 2 ? '#FFD23F' : '#E53935', now);
        else if (t.type === 'bubble') { // diving goggles pushed up
          c.strokeStyle = '#37474F'; c.lineWidth = r * 0.08; c.beginPath(); c.moveTo(x - r * 0.85, y - r * 0.5); c.lineTo(x + r * 0.85, y - r * 0.5); c.stroke();
          [-1, 1].forEach(function (sd) { circle(c, x + sd * r * 0.3, y - r * 0.98, r * 0.17, L === 2 ? '#FFD23F' : '#90A4AE'); circle(c, x + sd * r * 0.3, y - r * 0.98, r * 0.11, 'rgba(160,230,255,0.9)'); });
        } else if (t.type === 'toad') { // bark helmet, gold-banded at max
          c.beginPath(); c.ellipse(x, y - r * 0.55, bw * 0.75, r * 0.38, 0, Math.PI, TAU); c.fillStyle = '#6D4C2F'; c.fill(); c.strokeStyle = '#3E2A18'; c.lineWidth = 1.5; c.stroke();
          c.fillStyle = L === 2 ? '#FFD23F' : '#A1887F'; c.fillRect(x - bw * 0.75, y - r * 0.6, bw * 1.5, r * 0.1);
        } else if (t.type === 'newt') { // copper coil antenna(s)
          var coils = L === 2 ? [-0.3, 0.3] : [0];
          coils.forEach(function (o) {
            var cx0 = x + o * r, top = y - r * 1.35;
            c.strokeStyle = L === 2 ? '#FFD23F' : '#C77B30'; c.lineWidth = r * 0.07; c.beginPath(); c.moveTo(cx0, y - r * 0.8);
            for (var q = 0; q < 6; q++) c.lineTo(cx0 + (q % 2 ? 1 : -1) * r * 0.1, y - r * 0.8 - (q + 1) * (r * 0.09)); c.stroke();
            circle(c, cx0, top, r * 0.1, '#FFF59D');
            if (Math.sin(now * 9 + t.id + o * 5) > 0.6) { c.strokeStyle = '#FFF59D'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx0, top); c.lineTo(cx0 + r * 0.25, top - r * 0.15); c.lineTo(cx0 + r * 0.1, top - r * 0.3); c.stroke(); }
          });
        } else if (t.type === 'dart') { // hood
          c.beginPath(); c.ellipse(x, y - r * 0.4, bw * 0.9, r * 0.5, 0, Math.PI * 1.05, Math.PI * 1.95); c.strokeStyle = L === 2 ? '#FFD23F' : '#3B1E6B'; c.lineWidth = r * 0.14; c.stroke();
        }
      }
      if (L === 2 && t.type !== 'toad' && t.type !== 'newt') { // gold shoulder leaves
        [-1, 1].forEach(function (sd) { ell(c, x + sd * bw * 0.85, y + r * 0.05, r * 0.24, r * 0.12, '#FFD23F', sd * 0.6); });
      }
      drawHat(c, x, y - r * 0.35 - (L >= 1 && (t.type === 'bubble' || t.type === 'newt') ? r * 0.25 : 0), r, R.hat);
    }
    if (!t.icon) for (var p = 0; p <= L; p++) circle(c, x + (p - L / 2) * ts * 0.15, y + ts * 0.38, ts * 0.05, L === 2 ? '#FFD23F' : L === 1 ? '#D9E6EE' : '#FFFFFF');
    if (t.stun > 0) {
      for (var s2 = 0; s2 < 3; s2++) { var a2 = now * 4 + s2 * TAU / 3; star(c, x + Math.cos(a2) * r * 0.8, y - r * 1.1 + Math.sin(a2) * r * 0.25, ts * 0.07, '#FFE14D'); }
    }
  }

  // ---- bugs ----
  function drawEnemy(c, e, ts, now) {
    var v = R.view, x = v.ox + e.x * ts, y = v.oy + e.y * ts, r = e.E.size * ts, ang = Math.atan2(e.diry || 1, e.dirx || 0);
    var flash = e.hitT > 0, squash = 1 + Math.sin(e.wob * 2) * 0.05;
    c.save();
    if (e.E.air) { ell(c, x + ts * 0.15, y + ts * 0.35, r * 0.9, r * 0.4, 'rgba(0,30,30,0.25)'); y -= ts * 0.18 + Math.sin(now * 6 + e.id) * 2; }
    if (e.hopT > 0) y -= ts * 0.35 * Math.sin((e.hopT / 0.28) * Math.PI);
    else ell(c, x, y + r * 0.35, r * 0.95, r * 0.45, 'rgba(0,0,0,0.25)');
    c.translate(x, y); c.rotate(ang); c.scale(squash, 2 - squash);
    var leg = Math.sin(e.wob) * r * 0.25;
    var tint = function (col) { return flash ? shade(col, 0.55) : col; };
    function legs(n, spread, len, col, lw) {
      c.strokeStyle = tint(col); c.lineWidth = lw; c.lineCap = 'round';
      for (var i = 0; i < n; i++) {
        var lx = (i - (n - 1) / 2) * spread, ph = (i % 2 ? 1 : -1) * leg;
        c.beginPath(); c.moveTo(lx, 0); c.quadraticCurveTo(lx + ph, -len * 0.6, lx + ph * 1.3, -len); c.moveTo(lx, 0); c.quadraticCurveTo(lx - ph, len * 0.6, lx - ph * 1.3, len); c.stroke();
      }
    }
    function bugEyes(ex, er) { circle(c, ex, -er * 1.1, er, '#FFF'); circle(c, ex, er * 1.1, er, '#FFF'); circle(c, ex + er * 0.35, -er * 1.1, er * 0.55, '#111'); circle(c, ex + er * 0.35, er * 1.1, er * 0.55, '#111'); }
    if (e.type === 'ant') {
      legs(3, r * 0.35, r * 0.8, '#3A1A0E', Math.max(1, r * 0.11));
      blob(c, -r * 0.6, 0, r * 0.45, r * 0.38, tint('#8A3B1E')); blob(c, 0, 0, r * 0.28, r * 0.24, tint('#7A321A')); blob(c, r * 0.5, 0, r * 0.34, r * 0.32, tint('#9C4524'));
      c.strokeStyle = tint('#3A1A0E'); c.lineWidth = 1.2; c.beginPath(); c.moveTo(r * 0.75, -r * 0.15); c.quadraticCurveTo(r * 1.0, -r * 0.4, r * 1.1, -r * 0.3); c.moveTo(r * 0.75, r * 0.15); c.quadraticCurveTo(r * 1.0, r * 0.4, r * 1.1, r * 0.3); c.stroke();
      bugEyes(r * 0.62, r * 0.11);
    } else if (e.type === 'gnat') {
      c.globalAlpha = 0.7; var wf = Math.sin(now * 50 + e.id) * 0.3;
      ell(c, -r * 0.1, -r * 0.65, r * 0.6, r * 0.26, '#E3F6FF', 0.4 + wf); ell(c, -r * 0.1, r * 0.65, r * 0.6, r * 0.26, '#E3F6FF', -0.4 - wf); c.globalAlpha = 1;
      legs(3, r * 0.3, r * 0.6, '#222', 1);
      blob(c, -r * 0.35, 0, r * 0.5, r * 0.32, tint('#4A4E5A')); blob(c, r * 0.35, 0, r * 0.3, r * 0.3, tint('#5C6170'));
      circle(c, r * 0.48, -r * 0.14, r * 0.13, '#E53935'); circle(c, r * 0.48, r * 0.14, r * 0.13, '#E53935');
    } else if (e.type === 'beetle') {
      legs(3, r * 0.4, r * 0.95, '#1B2B1F', Math.max(1, r * 0.1));
      blob(c, r * 0.72, 0, r * 0.3, r * 0.28, tint('#1F3326'));
      blob(c, -r * 0.05, 0, r * 0.82, r * 0.7, tint('#2E8B62'));
      c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(r * 0.6, 0); c.lineTo(-r * 0.85, 0); c.stroke();
      ell(c, r * 0.1, -r * 0.32, r * 0.32, r * 0.11, 'rgba(255,255,255,0.5)', -0.2);
      circle(c, -r * 0.35, -r * 0.35, r * 0.08, 'rgba(255,255,255,0.3)'); circle(c, -r * 0.35, r * 0.35, r * 0.08, 'rgba(0,0,0,0.25)');
      c.strokeStyle = tint('#1F3326'); c.lineWidth = r * 0.12; c.beginPath(); c.moveTo(r * 0.95, -r * 0.1); c.lineTo(r * 1.2, -r * 0.25); c.moveTo(r * 0.95, r * 0.1); c.lineTo(r * 1.2, r * 0.25); c.stroke();
      bugEyes(r * 0.8, r * 0.08);
    } else if (e.type === 'fly') {
      var fl = Math.sin(now * 40 + e.id) * 0.4;
      c.globalAlpha = 0.6;
      ell(c, r * 0.1, -r * 0.7, r * 0.78, r * 0.2, '#CFF6FF', -0.5 + fl); ell(c, r * 0.1, r * 0.7, r * 0.78, r * 0.2, '#CFF6FF', 0.5 - fl);
      ell(c, -r * 0.25, -r * 0.6, r * 0.62, r * 0.17, '#CFF6FF', 0.4 - fl); ell(c, -r * 0.25, r * 0.6, r * 0.62, r * 0.17, '#CFF6FF', -0.4 + fl);
      c.globalAlpha = 1;
      blob(c, -r * 0.45, 0, r * 0.8, r * 0.13, tint('#2B6CD6'));
      for (var sg = 0; sg < 4; sg++) { c.fillStyle = 'rgba(0,0,40,0.35)'; c.fillRect(-r * 1.0 + sg * r * 0.25, -r * 0.12, r * 0.04, r * 0.24); }
      blob(c, r * 0.3, 0, r * 0.24, r * 0.2, tint('#1D4FA8'));
      circle(c, r * 0.48, -r * 0.13, r * 0.13, tint('#7CF0C5')); circle(c, r * 0.48, r * 0.13, r * 0.13, tint('#7CF0C5'));
    } else if (e.type === 'snail') {
      blob(c, r * 0.1, 0, r * 1.05, r * 0.42, tint('#D2C394'));
      c.strokeStyle = tint('#B5A878'); c.lineWidth = r * 0.1; c.beginPath(); c.moveTo(r * 0.95, -r * 0.15); c.lineTo(r * 1.3, -r * 0.38); c.moveTo(r * 0.95, r * 0.15); c.lineTo(r * 1.3, r * 0.38); c.stroke();
      circle(c, r * 1.32, -r * 0.4, r * 0.08, '#333'); circle(c, r * 1.32, r * 0.4, r * 0.08, '#333');
      blob(c, -r * 0.15, 0, r * 0.72, r * 0.72, tint('#B5532E'));
      c.strokeStyle = tint('#F2A65A'); c.lineWidth = r * 0.12; c.beginPath();
      for (var k2 = 0; k2 < 30; k2++) { var a3 = k2 * 0.42, rr = r * 0.6 * (1 - k2 / 32); c.lineTo(-r * 0.15 + Math.cos(a3) * rr, Math.sin(a3) * rr); } c.stroke();
      ell(c, -r * 0.35, -r * 0.35, r * 0.18, r * 0.08, 'rgba(255,255,255,0.4)', -0.5);
    } else if (e.type === 'heron') {
      var stride = Math.sin(e.wob * 0.5);
      c.strokeStyle = '#E3A32C'; c.lineWidth = r * 0.07; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, -r * 0.2); c.lineTo(r * 0.45 * stride, -r * 0.55); c.moveTo(0, r * 0.2); c.lineTo(-r * 0.45 * stride, r * 0.55); c.stroke();
      blob(c, -r * 0.15, 0, r * 0.78, r * 0.52, tint('#CFD8E2'));
      blob(c, -r * 0.4, -r * 0.36, r * 0.58, r * 0.22, tint('#7F8FA3'), { rot: 0.3 }); blob(c, -r * 0.4, r * 0.36, r * 0.58, r * 0.22, tint('#7F8FA3'), { rot: -0.3 });
      ell(c, -r * 0.9, 0, r * 0.25, r * 0.18, tint('#4E5B6B'));
      c.strokeStyle = tint('#EEF3F7'); c.lineWidth = r * 0.17; c.beginPath(); c.moveTo(r * 0.4, 0); c.quadraticCurveTo(r * 0.72, -r * 0.28, r * 0.88, 0); c.stroke();
      blob(c, r * 0.9, 0, r * 0.18, r * 0.17, tint('#FFFFFF'));
      c.fillStyle = '#F2B233'; c.beginPath(); c.moveTo(r * 1.02, -r * 0.07); c.lineTo(r * 1.55, 0); c.lineTo(r * 1.02, r * 0.07); c.fill();
      circle(c, r * 0.94, -r * 0.09, r * 0.045, '#C62828'); circle(c, r * 0.94, r * 0.09, r * 0.045, '#C62828');
      c.strokeStyle = '#1C2530'; c.lineWidth = r * 0.06; c.beginPath(); c.moveTo(r * 0.82, -r * 0.05); c.lineTo(r * 0.45, -r * 0.3); c.moveTo(r * 0.82, r * 0.05); c.lineTo(r * 0.45, r * 0.3); c.stroke();
    } else if (e.type === 'skip') {
      // Reed Skipper: long-legged water strider, olive-brown, skates on six thin legs
      var sk = Math.sin(e.wob * 2) * r * 0.35;
      c.strokeStyle = tint('#2A2418'); c.lineWidth = Math.max(1, r * 0.08); c.lineCap = 'round';
      for (var si = 0; si < 3; si++) {
        var sx = (si - 1) * r * 0.45, outward = (si === 1 ? 1.15 : 1) * r * 1.15;
        c.beginPath(); c.moveTo(sx, 0); c.lineTo(sx + sk, -outward); c.moveTo(sx, 0); c.lineTo(sx - sk, outward); c.stroke();
        circle(c, sx + sk, -outward, r * 0.07, tint('#3A3222')); circle(c, sx - sk, outward, r * 0.07, tint('#3A3222'));
      }
      blob(c, -r * 0.15, 0, r * 0.7, r * 0.18, tint('#6B5A32'));
      blob(c, r * 0.45, 0, r * 0.28, r * 0.2, tint('#5A4A28'));
      circle(c, r * 0.58, -r * 0.08, r * 0.07, '#111'); circle(c, r * 0.58, r * 0.08, r * 0.07, '#111');
    } else if (e.type === 'pinch') {
      // Pinchclaw: rust-red crayfish with big claws and a segmented tail
      c.strokeStyle = tint('#6A2A1A'); c.lineWidth = Math.max(1, r * 0.1);
      for (var pi = 0; pi < 4; pi++) { var px = -r * 0.1 + pi * r * 0.22, ph = (pi % 2 ? 1 : -1) * leg; c.beginPath(); c.moveTo(px, -r * 0.15); c.lineTo(px + ph, -r * 0.85); c.moveTo(px, r * 0.15); c.lineTo(px - ph, r * 0.85); c.stroke(); }
      blob(c, -r * 0.55, 0, r * 0.55, r * 0.32, tint('#C45A32'));
      for (var sg = 0; sg < 3; sg++) blob(c, -r * 0.15 - sg * r * 0.22, 0, r * 0.22, r * 0.28 - sg * 0.03, tint(sg % 2 ? '#A84828' : '#C45A32'));
      blob(c, r * 0.35, 0, r * 0.32, r * 0.28, tint('#D4683A'));
      // claws
      c.fillStyle = tint('#E07A48');
      c.beginPath(); c.ellipse(r * 0.85, -r * 0.45, r * 0.38, r * 0.18, -0.4, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(r * 0.85, r * 0.45, r * 0.38, r * 0.18, 0.4, 0, Math.PI * 2); c.fill();
      c.strokeStyle = tint('#7A3018'); c.lineWidth = r * 0.07;
      c.beginPath(); c.moveTo(r * 0.55, -r * 0.35); c.lineTo(r * 1.15, -r * 0.7); c.moveTo(r * 0.55, r * 0.35); c.lineTo(r * 1.15, r * 0.7); c.stroke();
      bugEyes(r * 0.45, r * 0.09);
    } else if (e.type === 'moth') {
      var mf = Math.sin(now * 28 + e.id) * 0.35;
      c.globalAlpha = 0.75;
      ell(c, 0, -r * 0.7, r * 0.85, r * 0.42, tint('#E8D5A0'), -0.2 + mf);
      ell(c, 0, r * 0.7, r * 0.85, r * 0.42, tint('#E8D5A0'), 0.2 - mf);
      ell(c, -r * 0.15, -r * 0.55, r * 0.45, r * 0.22, tint('#C9B07A'), 0.3 - mf);
      ell(c, -r * 0.15, r * 0.55, r * 0.45, r * 0.22, tint('#C9B07A'), -0.3 + mf);
      c.globalAlpha = 1;
      circle(c, -r * 0.25, -r * 0.55, r * 0.1, 'rgba(80,50,20,0.35)'); circle(c, -r * 0.25, r * 0.55, r * 0.1, 'rgba(80,50,20,0.35)');
      blob(c, -r * 0.1, 0, r * 0.7, r * 0.22, tint('#5C4A32'));
      blob(c, r * 0.45, 0, r * 0.28, r * 0.22, tint('#3E3224'));
      c.strokeStyle = tint('#D8C48A'); c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(r * 0.6, -r * 0.08); c.quadraticCurveTo(r * 1.05, -r * 0.45, r * 1.15, -r * 0.2);
      c.moveTo(r * 0.6, r * 0.08); c.quadraticCurveTo(r * 1.05, r * 0.45, r * 1.15, r * 0.2); c.stroke();
      circle(c, r * 0.6, -r * 0.1, r * 0.08, '#F6E7A0'); circle(c, r * 0.6, r * 0.1, r * 0.08, '#F6E7A0');
    } else if (e.type === 'snap') {
      // Old Snapjaw: mossy snapping turtle, hooked beak, heavy shell
      var stride = Math.sin(e.wob * 0.45);
      c.strokeStyle = tint('#3A4A28'); c.lineWidth = r * 0.1; c.lineCap = 'round';
      c.beginPath(); c.moveTo(r * 0.1, -r * 0.35); c.lineTo(r * 0.55 + stride * r * 0.2, -r * 0.75);
      c.moveTo(r * 0.1, r * 0.35); c.lineTo(r * 0.55 - stride * r * 0.2, r * 0.75);
      c.moveTo(-r * 0.2, -r * 0.4); c.lineTo(-r * 0.6, -r * 0.7); c.moveTo(-r * 0.2, r * 0.4); c.lineTo(-r * 0.6, r * 0.7); c.stroke();
      blob(c, -r * 0.05, 0, r * 0.95, r * 0.78, tint('#4A6A38'));
      c.strokeStyle = tint('#2E4A24'); c.lineWidth = r * 0.06;
      for (var sc = 0; sc < 6; sc++) { var a = sc * 1.05, rr = r * 0.55; c.beginPath(); c.arc(-r * 0.05 + Math.cos(a) * r * 0.15, Math.sin(a) * r * 0.15, r * 0.22, 0, Math.PI * 2); c.stroke(); }
      ell(c, -r * 0.35, -r * 0.3, r * 0.2, r * 0.08, 'rgba(180,220,120,0.35)', -0.4);
      blob(c, r * 0.75, 0, r * 0.42, r * 0.32, tint('#6B7A40'));
      c.fillStyle = tint('#C9B45A'); c.beginPath(); c.moveTo(r * 1.05, -r * 0.12); c.lineTo(r * 1.55, 0); c.lineTo(r * 1.05, r * 0.12); c.fill();
      c.fillStyle = tint('#8A6A28'); c.beginPath(); c.moveTo(r * 1.05, -r * 0.04); c.lineTo(r * 1.35, 0); c.lineTo(r * 1.05, r * 0.04); c.fill();
      circle(c, r * 0.88, -r * 0.12, r * 0.06, '#1A200C'); circle(c, r * 0.88, r * 0.12, r * 0.06, '#1A200C');
    } else if (e.type === 'bittern') {
      // Pale Bittern: silvery-buff skulking heron, streaked, dagger beak — distinct from grey Stiltbeak
      var stride = Math.sin(e.wob * 0.5);
      c.strokeStyle = tint('#C9B07A'); c.lineWidth = r * 0.07; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, -r * 0.2); c.lineTo(r * 0.4 * stride, -r * 0.58); c.moveTo(0, r * 0.2); c.lineTo(-r * 0.4 * stride, r * 0.58); c.stroke();
      blob(c, -r * 0.1, 0, r * 0.72, r * 0.42, tint('#E8D9B0'));
      c.strokeStyle = 'rgba(80,60,30,0.45)'; c.lineWidth = r * 0.07;
      for (var st = -2; st <= 2; st++) { c.beginPath(); c.moveTo(-r * 0.6, st * r * 0.12); c.lineTo(r * 0.35, st * r * 0.08); c.stroke(); }
      blob(c, -r * 0.45, -r * 0.28, r * 0.5, r * 0.18, tint('#D4C08C')); blob(c, -r * 0.45, r * 0.28, r * 0.5, r * 0.18, tint('#D4C08C'));
      blob(c, r * 0.55, 0, r * 0.28, r * 0.24, tint('#F3E6C4'));
      c.fillStyle = tint('#2A2014'); c.beginPath(); c.moveTo(r * 0.75, -r * 0.07); c.lineTo(r * 1.5, 0); c.lineTo(r * 0.75, r * 0.07); c.fill();
      circle(c, r * 0.7, -r * 0.09, r * 0.055, '#6B1C1C'); circle(c, r * 0.7, r * 0.09, r * 0.055, '#6B1C1C');
      // small ear tufts
      c.strokeStyle = tint('#5A4A28'); c.lineWidth = r * 0.06;
      c.beginPath(); c.moveTo(r * 0.45, -r * 0.18); c.lineTo(r * 0.3, -r * 0.38); c.moveTo(r * 0.45, r * 0.18); c.lineTo(r * 0.3, r * 0.38); c.stroke();
    }
    c.restore();
    if (e.stun > 0) { star(c, x, y - r - 6, ts * 0.06, '#FFE14D'); }
    if (e.slow > 0) { c.strokeStyle = 'rgba(166,232,255,0.8)'; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, r * 1.1, 0, TAU); c.stroke(); circle(c, x - r * 0.8, y + r * 0.5, ts * 0.05, 'rgba(200,245,255,0.9)'); }
    if (e.poisonT > 0) { circle(c, x + r * 0.5, y - r * 0.6, ts * 0.05, '#B66DFF'); }
    if (e.hp < e.maxHp) {
      var w = e.E.boss ? ts * 1.6 : ts * 0.6, hy = y - r - (e.E.boss ? 12 : 7);
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(x - w / 2 - 1, hy - 1, w + 2, 6);
      var fr = Math.max(0, e.hp / e.maxHp); c.fillStyle = fr > 0.5 ? '#7BE34B' : fr > 0.25 ? '#FFC93C' : '#FF5A4E'; c.fillRect(x - w / 2, hy, w * fr, 4);
    }
  }

  function drawGoal(c, s, ts, now) {
    var v = R.view, end = s.path.pts[s.path.pts.length - 1], x = v.ox + end.x * ts, y = v.oy + Math.min(end.y, D.ROWS - 0.45) * ts;
    ell(c, x, y + ts * 0.12, ts * 0.78, ts * 0.42, 'rgba(0,30,30,0.35)');
    lily(c, x, y, ts * 0.72, 2.2, 1);
    c.save(); c.globalAlpha = 0.25 + 0.1 * Math.sin(now * 2); circle(c, x, y, ts * 0.6, '#E8FFF4'); c.restore();
    var n = Math.max(3, Math.min(12, Math.ceil(s.lives / s.maxLives * 12)));
    for (var i = 0; i < n; i++) {
      var an = i * 2.4, rr = ts * 0.12 * Math.sqrt(i + 1), ex = x + Math.cos(an) * rr, ey = y + Math.sin(an) * rr * 0.7, pulse = 1 + Math.sin(now * 3 + i) * 0.06;
      var g = c.createRadialGradient(ex - 2, ey - 2, 1, ex, ey, ts * 0.12 * pulse);
      g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, 'rgba(190,240,220,0.85)');
      c.beginPath(); c.arc(ex, ey, ts * 0.11 * pulse, 0, TAU); c.fillStyle = g; c.fill(); circle(c, ex + 1, ey + 1, ts * 0.045, '#20303A');
    }
  }

  R.spawnParticles = function (x, y, n, col, spd, size, opts) {
    opts = opts || {};
    for (var i = 0; i < n; i++) {
      var a = Math.random() * TAU, s = spd * (0.4 + Math.random() * 0.8);
      R.particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (opts.up || 0), life: 0.4 + Math.random() * 0.4, max: 0.8, col: col, size: size * (0.6 + Math.random() * 0.6), g: opts.g || 0 });
    }
  };
  R.text = function (x, y, str, col, big) { R.texts.push({ x: x, y: y, str: str, col: col, life: 1, big: !!big }); };
  R.ring = function (x, y, r, col) { R.rings.push({ x: x, y: y, r: r, col: col, life: 0.5 }); };

  /** Convert engine events into juice. Returns nothing; also triggers sounds. */
  R.consume = function (s) {
    var ts = R.view.ts, v = R.view, S = root.Sfx;
    s.events.forEach(function (e) {
      var px = e.x != null ? v.ox + e.x * ts : 0, py = e.y != null ? v.oy + e.y * ts : 0;
      switch (e.t) {
        case 'shoot': S.play(e.type); break;
        case 'kill':
          var col = { ant: '#8A3B1E', gnat: '#4A4E5A', beetle: '#2E7D5B', fly: '#2B6CD6', snail: '#B5532E', skip: '#6B5A32', pinch: '#C45A32', moth: '#E8D5A0', heron: '#C9D3DD', snap: '#4A6A38', bittern: '#E8D9B0' }[e.type];
          R.spawnParticles(px, py, e.boss ? 60 : 9, col, ts * (e.boss ? 6 : 3), ts * 0.09);
          R.spawnParticles(px, py, 3, '#FFE14D', ts * 2, ts * 0.06, { up: ts * 2, g: ts * 6 });
          R.text(px, py - 8, '+' + e.reward, '#FFE14D'); S.play('kill');
          if (e.boss) { R.shake = 18; R.flash = 0.6; S.play('win'); }
          break;
        case 'coin': R.text(px, py - 10, '+' + e.n, '#FFE14D'); R.spawnParticles(px, py, 6, '#FFD23F', ts * 2, ts * 0.07, { up: ts * 2, g: ts * 5 }); S.play('coin'); break;
        case 'build': R.spawnParticles(px, py, 14, '#BFFFA0', ts * 3, ts * 0.08); R.spawnParticles(px, py, 8, '#FFFFFF', ts * 2.5, ts * 0.06); R.ring(px, py, ts * 0.8, '#E9FFD0'); S.play('build'); break;
        case 'upgrade': R.spawnParticles(px, py, 18, '#FFE14D', ts * 3, ts * 0.08, { up: ts }); R.ring(px, py, ts, '#FFE680'); R.text(px, py - ts * 0.5, 'LEVEL ' + (e.lvl + 1) + '!', '#FFF6B0', true); S.play('upgrade'); break;
        case 'sell': R.text(px, py, '+' + e.value, '#FFE14D'); R.spawnParticles(px, py, 10, '#9C7444', ts * 2, ts * 0.08); S.play('sell'); break;
        case 'boom': R.spawnParticles(px, py, 16, '#7A4E1A', ts * 3.5, ts * 0.1); R.spawnParticles(px, py, 8, '#C9A877', ts * 2, ts * 0.12); R.ring(px, py, e.r * ts, 'rgba(255,220,160,0.9)'); R.shake = Math.max(R.shake, 3); S.play('boom'); break;
        case 'pop': R.spawnParticles(px, py, 7, '#BDEBFF', ts * 2, ts * 0.07); S.play('pop'); break;
        case 'dart': R.spawnParticles(px, py, 5, '#B66DFF', ts * 1.5, ts * 0.06); break;
        case 'leak': R.shake = Math.max(R.shake, 8); R.flash = Math.max(R.flash, 0.35); R.text(px, py - 10, '-' + e.n + ' \u2665', '#FF6B6B', true); S.play('leak'); if (navigator.vibrate) try { navigator.vibrate(40); } catch (x) {} break;
        case 'stomp': R.shake = 14; R.ring(px, py, e.r * ts, 'rgba(255,255,255,0.9)'); R.spawnParticles(px, py, 30, '#9C7444', ts * 4, ts * 0.1); S.play('stomp'); break;
        case 'hop': R.spawnParticles(px, py, 5, '#8FBFB0', ts * 1.6, ts * 0.05); S.play('pop'); break;
        case 'pinch': R.shake = Math.max(R.shake, 7); R.ring(px, py, e.r * ts, 'rgba(255,160,100,0.9)'); R.spawnParticles(px, py, 14, '#C45A32', ts * 3, ts * 0.08); S.play('stomp'); break;
        case 'screech': R.shake = 16; R.flash = Math.max(R.flash, 0.45); R.ring(px, py, ts * 4, 'rgba(240,220,160,0.9)'); S.play('boss'); break;
        case 'chorus': R.shake = 12; R.ring(v.W / 2, v.H / 2, v.H, 'rgba(180,255,140,0.9)'); R.ring(v.W / 2, v.H / 2, v.H * 0.6, 'rgba(255,255,200,0.9)'); S.play('croak'); break;
        case 'swat': R.spawnParticles(px, py, 6, '#FFFFFF', ts * 2, ts * 0.06); R.ring(px, py, ts * 0.4, '#FFFFFF'); S.play('swat'); break;
        case 'wave': S.play(e.boss ? 'boss' : 'wave'); if (e.bonus) R.text(v.W / 2, v.oy + ts * 2, 'Early bonus +' + e.bonus, '#FFE14D', true); break;
      }
    });
    s.events.length = 0;
  };

  R.draw = function (c, s, dt, sel, dpr) {
    var v = R.view, ts = v.ts, now = (R.t += dt);
    var im = R.imgs[themeOf(s) === 'night' ? 'pond-night' : (dusk(s) ? 'pond-dusk' : 'pond-day')];
    if (R.bgKey !== s.level + ':' + v.W + 'x' + v.H + ':' + (im && im.complete ? 1 : 0)) buildBg(s, dpr);
    c.save();
    if (R.shake > 0) { c.translate((Math.random() - 0.5) * R.shake, (Math.random() - 0.5) * R.shake); R.shake = Math.max(0, R.shake - dt * 40); }
    c.drawImage(R.bg, 0, 0, v.W, v.H);
    // moving sparkles on water
    c.fillStyle = 'rgba(255,255,255,0.12)';
    for (var i = 0; i < 14; i++) { var sx = ((i * 97 + now * 8) % (v.W + 40)) - 20, sy = (i * 61 % v.H) + Math.sin(now + i) * 6; c.fillRect(sx, sy, 10, 2); }
    var pulse = (Math.sin(now * 3) + 1) / 2;
    s.pads.forEach(function (p, i) { drawPad(c, v.ox + p.x * ts, v.oy + p.y * ts, ts, sel && sel.pad === i, !p.tower, pulse, p.tower ? p.tower.lvl : 0); });
    drawGoal(c, s, ts, now);
    // range preview
    if (sel && sel.range) {
      var cx = v.ox + sel.x * ts, cy = v.oy + sel.y * ts;
      c.beginPath(); c.arc(cx, cy, sel.range * ts, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.12)'; c.fill();
      c.setLineDash([6, 6]); c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.75)'; c.stroke(); c.setLineDash([]);
    }
    var ents = s.enemies.slice().sort(function (a, b) { return (a.E.air ? 1 : 0) - (b.E.air ? 1 : 0) || a.y - b.y; });
    ents.filter(function (e) { return !e.E.air; }).forEach(function (e) { drawEnemy(c, e, ts, now); });
    s.towers.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (t) { drawTower(c, t, ts, now); });
    ents.filter(function (e) { return e.E.air; }).forEach(function (e) { drawEnemy(c, e, ts, now); });
    // projectiles
    s.projectiles.forEach(function (p) {
      var px = v.ox + p.x * ts, py = v.oy + p.y * ts;
      if (p.type === 'bubble') { circle(c, px, py, ts * 0.13, 'rgba(190,240,255,0.85)'); circle(c, px - ts * 0.04, py - ts * 0.04, ts * 0.04, '#FFFFFF'); }
      else if (p.type === 'toad') { ell(c, px, py + ts * 0.05, ts * 0.12, ts * 0.06, 'rgba(0,0,0,0.25)'); circle(c, px, py - p.h * ts, ts * 0.14, '#6B4A26'); circle(c, px - 2, py - p.h * ts - 2, ts * 0.05, '#9C7444'); }
      else if (p.type === 'dart') { c.strokeStyle = '#E6D1FF'; c.lineWidth = 3; c.beginPath(); c.moveTo(px, py); c.lineTo(px - (p.tx - p.x) * 2, py - (p.ty - p.y) * 2); c.stroke(); circle(c, px, py, ts * 0.06, '#A35CF0'); }
    });
    // fx
    s.fx.forEach(function (f) {
      var a = f.life / f.max;
      if (f.k === 'tongue') {
        c.strokeStyle = '#FF6F91'; c.lineCap = 'round'; c.lineWidth = ts * 0.09;
        var x1 = v.ox + f.x1 * ts, y1 = v.oy + f.y1 * ts - ts * 0.05, x2 = v.ox + f.x2 * ts, y2 = v.oy + f.y2 * ts, k = Math.sin(a * Math.PI);
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k); c.stroke();
        circle(c, x1 + (x2 - x1) * k, y1 + (y2 - y1) * k, ts * 0.08, '#FF8FA8');
      } else if (f.k === 'zap') {
        c.strokeStyle = 'rgba(255,240,120,' + a + ')'; c.lineWidth = 3; c.beginPath();
        f.pts.forEach(function (p, i) { var px = v.ox + p.x * ts, py = v.oy + p.y * ts; if (!i) c.moveTo(px, py); else { c.lineTo(px + (Math.random() - 0.5) * 10, py + (Math.random() - 0.5) * 10); c.lineTo(px, py); } });
        c.stroke(); c.strokeStyle = 'rgba(255,255,255,' + a + ')'; c.lineWidth = 1; c.stroke();
      }
    });
    // rings
    R.rings = R.rings.filter(function (r) {
      r.life -= dt; var k = 1 - r.life / 0.5;
      c.globalAlpha = Math.max(0, r.life / 0.5); c.strokeStyle = r.col; c.lineWidth = 4;
      c.beginPath(); c.arc(r.x, r.y, r.r * (0.3 + 0.7 * k), 0, TAU); c.stroke(); c.globalAlpha = 1;
      return r.life > 0;
    });
    // particles
    R.particles = R.particles.filter(function (p) {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= 0.96; p.vy *= p.g ? 1 : 0.96;
      c.globalAlpha = Math.max(0, Math.min(1, p.life / 0.4)); circle(c, p.x, p.y, p.size, p.col); c.globalAlpha = 1;
      return p.life > 0;
    });
    if (R.particles.length > 600) R.particles.splice(0, R.particles.length - 600);
    // floating text
    c.textAlign = 'center'; c.textBaseline = 'middle';
    R.texts = R.texts.filter(function (t) {
      t.life -= dt; t.y -= dt * 30;
      c.globalAlpha = Math.min(1, t.life * 2);
      c.font = (t.big ? '22px' : '16px') + ' "Lilita One", "Fredoka", sans-serif';
      c.lineWidth = 4; c.strokeStyle = 'rgba(20,40,40,0.8)'; c.strokeText(t.str, t.x, t.y); c.fillStyle = t.col; c.fillText(t.str, t.x, t.y);
      c.globalAlpha = 1; return t.life > 0;
    });
    c.restore();
    if (s.chorusStun > 0) { c.fillStyle = 'rgba(170,255,140,' + (s.chorusStun / 2.5 * 0.15) + ')'; c.fillRect(0, 0, v.W, v.H); }
    if (R.flash > 0) { c.fillStyle = 'rgba(255,70,70,' + R.flash * 0.35 + ')'; c.fillRect(0, 0, v.W, v.H); R.flash = Math.max(0, R.flash - dt * 1.5); }
  };
  R.reset = function () { R.particles = []; R.texts = []; R.rings = []; R.shake = 0; R.flash = 0; R.bgKey = ''; };
  R.drawFrogIcon = function (cv, type, hat) {
    var c = cv.getContext('2d'), dpr = cv.width / cv.clientWidth || 2, ts = cv.width / dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, ts, ts);
    var save = R.view, oh = R.hat; R.view = { ox: 0, oy: 0, ts: ts }; R.hat = hat || 'none';
    drawTower(c, { icon: true, type: type, lvl: 0, x: 0.5, y: 0.56, anim: 0, aim: Math.PI / 2, id: 1, stun: 0 }, ts, 0);
    R.view = save; R.hat = oh;
  };
  root.Render = R;
})(typeof self !== 'undefined' ? self : this);
