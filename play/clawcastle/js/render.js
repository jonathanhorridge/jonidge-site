/* Clawcastle renderer: everything is drawn in code (no image assets needed). */
(function (root) {
  'use strict';
  var D = root.CCData, COLS = D.COLS, ROWS = D.ROWS;
  var R = { view: {}, vis: {}, tvis: {}, svis: {}, parts: [], ghosts: [], floats: [], proj: [], held: {}, heldLock: {}, keep: {}, shake: 0, sel: null, lane: -1, banner: null, flash: 0 };
  var cv, ctx, dpr = 1, sprites = {}, spriteTs = 0;
  var FONT = '"Lilita One", "Fredoka", system-ui, sans-serif';

  R.init = function (canvas) { cv = canvas; ctx = cv.getContext('2d'); R.resize(); };
  R.resize = function () {
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    var W = window.innerWidth, H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    var top = 56, bottom = 8, band = 46;
    var ts = Math.floor(Math.min((W - 12) / COLS, (H - top - bottom - band) / 11.7, 74));
    var used = band + ts * 11.55, extra = Math.max(0, (H - top - bottom - used) / 2);
    var v = R.view;
    v.W = W; v.H = H; v.ts = ts;
    v.ox = Math.round((W - ts * COLS) / 2);
    v.bandY = top + extra * 0.35;
    v.bandH = band;
    v.castleTop = v.bandY + band + 4;
    v.sh = ts * 0.82;
    v.bfTop = v.castleTop + v.sh * 3 + 16;
    v.rh = ts * 0.62;
    v.by = Math.round(v.bfTop + v.rh * 3 + ts * 0.22);
    if (spriteTs !== ts * dpr) buildSprites(ts);
  };
  R.hpBar = function (c, x, y, w, h, frac, ghost, color, label, mon) {
    frac = Math.max(0, Math.min(1, frac));
    ghost = Math.max(frac, Math.min(1, ghost == null ? frac : ghost));
    c.save();
    c.fillStyle = 'rgba(30,18,8,.72)'; rr(c, x - 1.5, y - 1.5, w + 3, h + 3, (h + 3) / 2); c.fill();
    c.fillStyle = '#3A2412'; rr(c, x, y, w, h, h / 2); c.fill();
    if (ghost > frac + 0.01) { c.fillStyle = 'rgba(255,230,120,.85)'; rr(c, x, y, w * ghost, h, h / 2); c.fill(); }
    if (frac > 0) { c.fillStyle = color; rr(c, x, y, Math.max(h, w * frac), h, h / 2); c.fill(); }
    if (label != null) {
      c.font = 'bold ' + Math.max(10, Math.round(h * 1.05)) + 'px ' + FONT;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 3; c.strokeStyle = 'rgba(30,18,8,.85)'; c.strokeText(label, x + w / 2, y + h / 2 + 0.5);
      c.fillStyle = '#fff'; c.fillText(label, x + w / 2, y + h / 2 + 0.5);
    }
    c.restore();
  };
  R.hpColor = function (frac, flag) {
    if (flag) return '#FFD23F';
    return frac > 0.55 ? '#4CDA6A' : frac > 0.3 ? '#FFC24D' : '#FF4E4E';
  };
  R.laneX = function (c) { return R.view.ox + (c + 0.5) * R.view.ts; };
  R.cellXY = function (r, c) { var v = R.view; return { x: v.ox + (c + 0.5) * v.ts, y: v.by + (r + 0.5) * v.ts }; };
  R.slotY = function (i) { var v = R.view; return v.castleTop + v.sh * (2.2 - i); };
  R.posY = function (p) { var v = R.view; return v.bfTop + 10 + v.rh * (2.35 - p); };
  R.cellAt = function (x, y) {
    var v = R.view, c = Math.floor((x - v.ox) / v.ts), r = Math.floor((y - v.by) / v.ts);
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return null;
    return [r, c];
  };
  R.structAt = function (s, x, y) {
    var v = R.view, c = Math.floor((x - v.ox) / v.ts);
    if (c < 0 || c >= COLS || y < v.castleTop - v.sh || y > v.bfTop) return null;
    var lane = s.lanes[c]; if (!lane.length) return null;
    var i = Math.max(0, Math.min(lane.length - 1, Math.floor((v.bfTop - y) / v.sh)));
    return { lane: c, b: lane[i] };
  };

  // ---------- sprite drawing helpers ----------
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  R.rr = rr;
  function off(size) { var o = document.createElement('canvas'); o.width = o.height = Math.ceil(size); return o; }
  function drawShell(c, S) {
    var cx = S / 2, cy = S * 0.56, r = S * 0.36;
    c.save(); c.shadowColor = 'rgba(80,20,40,.35)'; c.shadowBlur = S * 0.06; c.shadowOffsetY = S * 0.04;
    var g = c.createLinearGradient(0, cy - r, 0, cy + r * 0.6); g.addColorStop(0, '#FFC2D6'); g.addColorStop(1, '#FF5C8D');
    c.beginPath(); c.moveTo(cx - r * 0.25, cy + r * 0.55);
    for (var i = 0; i <= 6; i++) { var a = Math.PI * (1.05 + i * 0.15); var a2 = Math.PI * (1.05 + (i + 0.5) * 0.15); c.quadraticCurveTo(cx + Math.cos(a2 - 0.07) * r * 1.18, cy + Math.sin(a2 - 0.07) * r * 1.18, cx + Math.cos(a + 0.15) * r, cy + Math.sin(a + 0.15) * r); }
    c.lineTo(cx + r * 0.25, cy + r * 0.55); c.closePath();
    c.fillStyle = g; c.fill(); c.restore();
    c.strokeStyle = '#C2185B'; c.lineWidth = S * 0.035; c.stroke();
    c.strokeStyle = 'rgba(194,24,91,.55)'; c.lineWidth = S * 0.025;
    for (i = 0; i < 5; i++) { var a3 = Math.PI * (1.18 + i * 0.16); c.beginPath(); c.moveTo(cx, cy + r * 0.5); c.lineTo(cx + Math.cos(a3) * r * 0.92, cy + Math.sin(a3) * r * 0.92); c.stroke(); }
    c.fillStyle = '#FF8FB1'; rr(c, cx - r * 0.33, cy + r * 0.42, r * 0.66, r * 0.3, r * 0.1); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(cx - r * 0.35, cy - r * 0.45, r * 0.18, r * 0.09, -0.6, 0, 7); c.fill();
  }
  function drawPebble(c, S) {
    var cx = S / 2, cy = S / 2;
    c.save(); c.shadowColor = 'rgba(20,30,60,.35)'; c.shadowBlur = S * 0.06; c.shadowOffsetY = S * 0.04;
    var g = c.createRadialGradient(cx - S * 0.12, cy - S * 0.14, S * 0.05, cx, cy, S * 0.42); g.addColorStop(0, '#E3ECFA'); g.addColorStop(0.6, '#93A7CC'); g.addColorStop(1, '#5D6F97');
    c.beginPath(); c.ellipse(cx, cy + S * 0.02, S * 0.38, S * 0.3, -0.25, 0, 7); c.fillStyle = g; c.fill(); c.restore();
    c.strokeStyle = '#46557A'; c.lineWidth = S * 0.035; c.stroke();
    c.fillStyle = 'rgba(60,75,110,.45)';
    [[0.14, 0.08, 0.03], [-0.1, 0.12, 0.022], [0.04, -0.1, 0.018], [0.2, -0.04, 0.02]].forEach(function (d) { c.beginPath(); c.arc(cx + d[0] * S, cy + d[1] * S, d[2] * S, 0, 7); c.fill(); });
    c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(cx - S * 0.16, cy - S * 0.1, S * 0.09, S * 0.045, -0.5, 0, 7); c.fill();
  }
  function drawKelp(c, S) {
    var cx = S / 2;
    c.save(); c.shadowColor = 'rgba(10,60,30,.35)'; c.shadowBlur = S * 0.06; c.shadowOffsetY = S * 0.04;
    var g = c.createLinearGradient(S * 0.2, 0, S * 0.8, S); g.addColorStop(0, '#9BF0A8'); g.addColorStop(1, '#22A35A');
    c.beginPath(); c.moveTo(cx - S * 0.02, S * 0.88);
    c.bezierCurveTo(cx - S * 0.42, S * 0.62, cx - S * 0.3, S * 0.25, cx + S * 0.05, S * 0.1);
    c.bezierCurveTo(cx + S * 0.38, S * 0.3, cx + S * 0.35, S * 0.62, cx - S * 0.02, S * 0.88);
    c.fillStyle = g; c.fill(); c.restore();
    c.strokeStyle = '#137A3E'; c.lineWidth = S * 0.035; c.stroke();
    c.beginPath(); c.moveTo(cx - S * 0.02, S * 0.86); c.quadraticCurveTo(cx - S * 0.06, S * 0.45, cx + S * 0.05, S * 0.14); c.lineWidth = S * 0.028; c.stroke();
    c.lineWidth = S * 0.02; c.strokeStyle = 'rgba(19,122,62,.7)';
    for (var i = 0; i < 3; i++) { var y = S * (0.35 + i * 0.15); c.beginPath(); c.moveTo(cx - S * 0.03, y + S * 0.04); c.lineTo(cx - S * 0.17, y - S * 0.02); c.moveTo(cx - S * 0.02, y + S * 0.04); c.lineTo(cx + S * 0.13, y - S * 0.03); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.65)'; c.beginPath(); c.ellipse(cx - S * 0.13, S * 0.38, S * 0.04, S * 0.09, 0.4, 0, 7); c.fill();
  }
  function starPath(c, cx, cy, ro, ri, n, rot) {
    c.beginPath();
    for (var i = 0; i < n * 2; i++) { var a = rot + i * Math.PI / n, rad = i % 2 ? ri : ro; c.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
    c.closePath();
  }
  function drawStar(c, S) {
    var cx = S / 2, cy = S * 0.53;
    c.save(); c.shadowColor = 'rgba(120,50,0,.35)'; c.shadowBlur = S * 0.06; c.shadowOffsetY = S * 0.04;
    var g = c.createRadialGradient(cx, cy - S * 0.05, S * 0.04, cx, cy, S * 0.42); g.addColorStop(0, '#FFE08A'); g.addColorStop(1, '#FF7A1A');
    c.lineJoin = 'round'; starPath(c, cx, cy, S * 0.42, S * 0.19, 5, -Math.PI / 2); c.fillStyle = g; c.fill(); c.restore();
    c.lineJoin = 'round'; c.strokeStyle = '#C24E00'; c.lineWidth = S * 0.035; c.stroke();
    c.fillStyle = 'rgba(194,78,0,.55)';
    for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + i * 2 * Math.PI / 5; for (var k = 1; k <= 2; k++) { c.beginPath(); c.arc(cx + Math.cos(a) * S * 0.12 * k, cy + Math.sin(a) * S * 0.12 * k, S * 0.022, 0, 7); c.fill(); } }
    c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(cx - S * 0.1, cy - S * 0.15, S * 0.05, S * 0.03, -0.6, 0, 7); c.fill();
  }
  function drawPearl(c, S) {
    var cx = S / 2, cy = S / 2;
    c.save(); c.shadowColor = 'rgba(60,40,120,.4)'; c.shadowBlur = S * 0.07; c.shadowOffsetY = S * 0.04;
    var g = c.createRadialGradient(cx - S * 0.1, cy - S * 0.12, S * 0.03, cx, cy, S * 0.34); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.45, '#E4DBFF'); g.addColorStop(1, '#9B84F2');
    c.beginPath(); c.arc(cx, cy, S * 0.32, 0, 7); c.fillStyle = g; c.fill(); c.restore();
    c.strokeStyle = '#6A4FD0'; c.lineWidth = S * 0.035; c.stroke();
    var g2 = c.createLinearGradient(cx - S * 0.3, cy, cx + S * 0.3, cy); g2.addColorStop(0, 'rgba(255,170,220,.0)'); g2.addColorStop(0.5, 'rgba(140,230,255,.45)'); g2.addColorStop(1, 'rgba(255,170,220,.0)');
    c.fillStyle = g2; c.beginPath(); c.ellipse(cx, cy + S * 0.08, S * 0.27, S * 0.1, 0, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(cx - S * 0.11, cy - S * 0.12, S * 0.08, S * 0.05, -0.6, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.9)'; starPath(c, cx + S * 0.16, cy - S * 0.2, S * 0.07, S * 0.02, 4, 0); c.fill();
  }
  function drawSand(c, S) {
    var cx = S / 2, cy = S * 0.55;
    c.save(); c.shadowColor = 'rgba(90,60,20,.4)'; c.shadowBlur = S * 0.05; c.shadowOffsetY = S * 0.04;
    var g = c.createRadialGradient(cx - S * 0.1, cy - S * 0.15, S * 0.05, cx, cy, S * 0.45); g.addColorStop(0, '#F3D9A4'); g.addColorStop(1, '#C3924E');
    c.beginPath();
    var n = 9; for (var i = 0; i <= n; i++) { var a = i / n * Math.PI * 2, rad = S * (0.33 + 0.05 * Math.sin(i * 2.7)); c.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.85); }
    c.closePath(); c.fillStyle = g; c.fill(); c.restore();
    c.strokeStyle = '#8E6430'; c.lineWidth = S * 0.03; c.stroke();
    c.fillStyle = 'rgba(120,80,30,.45)';
    for (i = 0; i < 9; i++) { c.beginPath(); c.arc(cx + Math.cos(i * 2.3) * S * 0.2 * ((i % 3) / 3 + 0.4), cy + Math.sin(i * 2.3) * S * 0.16 * ((i % 3) / 3 + 0.4), S * 0.018, 0, 7); c.fill(); }
    c.fillStyle = '#FF9EC0'; c.beginPath(); c.arc(cx + S * 0.12, cy - S * 0.12, S * 0.05, 0, 7); c.fill();
  }
  function drawBarnacles(c, S) {
    c.fillStyle = 'rgba(70,80,90,.25)'; rr(c, S * 0.08, S * 0.08, S * 0.84, S * 0.84, S * 0.18); c.fill();
    [[0.27, 0.3, 0.13], [0.7, 0.36, 0.11], [0.45, 0.72, 0.14], [0.76, 0.75, 0.09]].forEach(function (b) {
      var x = b[0] * S, y = b[1] * S, r = b[2] * S;
      var g = c.createLinearGradient(x, y - r, x, y + r); g.addColorStop(0, '#E9EEF1'); g.addColorStop(1, '#8796A3');
      c.beginPath(); c.moveTo(x - r, y + r * 0.7); c.lineTo(x - r * 0.45, y - r * 0.7); c.lineTo(x + r * 0.45, y - r * 0.7); c.lineTo(x + r, y + r * 0.7); c.closePath();
      c.fillStyle = g; c.fill(); c.strokeStyle = '#4E5B66'; c.lineWidth = S * 0.025; c.stroke();
      c.fillStyle = '#3A444D'; c.beginPath(); c.ellipse(x, y - r * 0.62, r * 0.38, r * 0.16, 0, 0, 7); c.fill();
    });
  }
  var TILE_FN = [drawShell, drawPebble, drawKelp, drawStar, drawPearl];
  R.drawTileIcon = function (c, t, S) { (t < 0 ? drawSand : TILE_FN[t])(c, S); };
  function buildSprites(ts) {
    spriteTs = ts * dpr; var S = ts * dpr;
    sprites.tiles = TILE_FN.map(function (fn) { var o = off(S); fn(o.getContext('2d'), S); return o; });
    var o = off(S); drawSand(o.getContext('2d'), S); sprites.sand = o;
    o = off(S); drawBarnacles(o.getContext('2d'), S); sprites.barn = o;
  }

  // ---------- troops ----------
  function eyes(c, x, y, s, look) {
    [-1, 1].forEach(function (k) {
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x + k * s * 0.5, y, s * 0.42, 0, 7); c.fill(); c.strokeStyle = '#2B1B12'; c.lineWidth = s * 0.12; c.stroke();
      c.fillStyle = '#1F1410'; c.beginPath(); c.arc(x + k * s * 0.5 + (look || 0) * s * 0.1, y - s * 0.05, s * 0.2, 0, 7); c.fill();
    });
  }
  R.drawTroop = function (c, k, x, y, S, t, opt) {
    opt = opt || {};
    var bob = Math.sin(t * 9 + (opt.seed || 0)) * S * 0.04;
    c.save(); c.translate(x, y + bob);
    if (opt.brute) c.scale(1.32, 1.32);
    // shadow
    c.fillStyle = 'rgba(80,50,10,.25)'; c.beginPath(); c.ellipse(0, S * 0.32 - bob, S * 0.36, S * 0.09, 0, 0, 7); c.fill();
    c.lineWidth = S * 0.06; c.lineJoin = 'round'; c.lineCap = 'round';
    if (k === 'shieldcrab' || k === 'lobster') {
      var body = k === 'shieldcrab' ? ['#FF7043', '#C63F17'] : ['#7E6BFF', '#4430B8'];
      var leg = Math.sin(t * 18 + (opt.seed || 0)) * S * 0.04;
      c.strokeStyle = body[1];
      for (var i = 0; i < 3; i++) { [-1, 1].forEach(function (d) { c.beginPath(); c.moveTo(d * S * 0.18, S * (0.05 + i * 0.07)); c.lineTo(d * S * 0.38, S * (0.12 + i * 0.08) + (i % 2 ? leg : -leg)); c.stroke(); }); }
      var g = c.createRadialGradient(-S * 0.08, -S * 0.08, S * 0.03, 0, 0, S * 0.32); g.addColorStop(0, k === 'shieldcrab' ? '#FFAB91' : '#B9AEFF'); g.addColorStop(1, body[0]);
      c.fillStyle = g; c.beginPath();
      if (k === 'lobster') c.ellipse(0, S * 0.04, S * 0.2, S * 0.28, 0, 0, 7); else c.ellipse(0, S * 0.06, S * 0.3, S * 0.21, 0, 0, 7);
      c.fill(); c.strokeStyle = body[1]; c.stroke();
      // claws
      var cl = k === 'lobster' ? 1.3 : 1, snap = Math.sin(t * 6 + (opt.seed || 0)) > 0.6 ? 0.25 : 0;
      [-1, 1].forEach(function (d) {
        c.beginPath(); c.moveTo(d * S * 0.2, -S * 0.02); c.lineTo(d * S * 0.32, -S * 0.18); c.stroke();
        c.fillStyle = body[0]; c.beginPath(); c.arc(d * S * 0.34, -S * 0.26, S * 0.11 * cl, Math.PI * (0.15 + snap) , Math.PI * (1.85 - snap) + Math.PI * 2 * 0); c.lineTo(d * S * 0.34, -S * 0.26); c.closePath(); c.fill(); c.stroke();
      });
      c.strokeStyle = body[1]; c.beginPath(); c.moveTo(-S * 0.08, -S * 0.12); c.lineTo(-S * 0.1, -S * 0.22); c.moveTo(S * 0.08, -S * 0.12); c.lineTo(S * 0.1, -S * 0.22); c.stroke();
      eyes(c, 0, -S * 0.25, S * 0.18, 0);
      if (k === 'shieldcrab') { c.save(); c.translate(-S * 0.06, S * 0.0); c.scale(0.5, 0.5); c.translate(-S * 0.5, -S * 0.45); drawShell(c, S); c.restore(); }
      else { c.fillStyle = '#3A2A9A'; c.beginPath(); c.arc(0, S * 0.08, S * 0.04, 0, 7); c.fill(); }
    } else if (k === 'eel') {
      c.strokeStyle = '#147A45'; c.lineWidth = S * 0.2;
      c.beginPath(); for (var j = 0; j <= 10; j++) { var py = S * (0.3 - j * 0.055), px = Math.sin(j * 0.8 - t * 10) * S * 0.14; if (j) c.lineTo(px, py); else c.moveTo(px, py); } c.stroke();
      c.strokeStyle = '#48D17E'; c.lineWidth = S * 0.13; c.stroke();
      c.fillStyle = '#48D17E'; c.beginPath(); c.ellipse(Math.sin(10 * 0.8 - t * 10) * S * 0.14, -S * 0.28, S * 0.15, S * 0.13, 0, 0, 7); c.fill(); c.strokeStyle = '#147A45'; c.lineWidth = S * 0.05; c.stroke();
      eyes(c, Math.sin(10 * 0.8 - t * 10) * S * 0.14, -S * 0.32, S * 0.13, 0);
    } else if (k === 'spinner') {
      c.save(); c.rotate(t * 4); c.translate(-S * 0.5, -S * 0.53); drawStar(c, S); c.restore();
      eyes(c, 0, -S * 0.02, S * 0.13, 0);
    } else if (k === 'puffer') {
      var pf = 1 + Math.sin(t * 7) * 0.05;
      c.save(); c.scale(pf, pf);
      c.fillStyle = '#F2B705'; for (var q = 0; q < 12; q++) { var a = q / 12 * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(a - 0.15) * S * 0.25, Math.sin(a - 0.15) * S * 0.25); c.lineTo(Math.cos(a) * S * 0.38, Math.sin(a) * S * 0.38); c.lineTo(Math.cos(a + 0.15) * S * 0.25, Math.sin(a + 0.15) * S * 0.25); c.fill(); }
      var gp = c.createRadialGradient(-S * 0.08, -S * 0.1, S * 0.03, 0, 0, S * 0.3); gp.addColorStop(0, '#FFF3A6'); gp.addColorStop(1, '#FFC929');
      c.fillStyle = gp; c.beginPath(); c.arc(0, 0, S * 0.27, 0, 7); c.fill(); c.strokeStyle = '#B07D00'; c.lineWidth = S * 0.05; c.stroke();
      c.fillStyle = '#FF8FA3'; c.beginPath(); c.arc(-S * 0.15, S * 0.06, S * 0.05, 0, 7); c.arc(S * 0.15, S * 0.06, S * 0.05, 0, 7); c.fill();
      c.restore();
      eyes(c, 0, -S * 0.07, S * 0.14, 0);
      c.strokeStyle = '#7A4E00'; c.lineWidth = S * 0.04; c.beginPath(); c.arc(0, S * 0.08, S * 0.05, 0, Math.PI); c.stroke();
    }
    if (opt.brute) { c.fillStyle = '#FFD23F'; c.strokeStyle = '#A06A00'; c.lineWidth = S * 0.035; c.beginPath(); c.moveTo(-S * 0.14, -S * 0.42); c.lineTo(-S * 0.14, -S * 0.52); c.lineTo(-S * 0.07, -S * 0.46); c.lineTo(0, -S * 0.55); c.lineTo(S * 0.07, -S * 0.46); c.lineTo(S * 0.14, -S * 0.52); c.lineTo(S * 0.14, -S * 0.42); c.closePath(); c.fill(); c.stroke(); }
    c.restore();
  };

  // ---------- castle buildings ----------
  function sandBlock(c, x, y, w, h, tone) {
    var g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, tone ? '#F6DDA8' : '#F2D497'); g.addColorStop(1, '#D9AE66');
    c.fillStyle = g; rr(c, x, y, w, h, w * 0.08); c.fill(); c.strokeStyle = '#A67A3A'; c.lineWidth = Math.max(1.5, w * 0.035); c.stroke();
    c.fillStyle = 'rgba(166,122,58,.35)'; for (var i = 0; i < 5; i++) { c.beginPath(); c.arc(x + w * (0.2 + ((i * 37) % 60) / 100), y + h * (0.3 + ((i * 53) % 50) / 100), w * 0.025, 0, 7); c.fill(); }
  }
  function crenel(c, x, y, w, n, h) {
    var bw = w / (n * 2 - 1);
    for (var i = 0; i < n; i++) sandBlock(c, x + i * 2 * bw, y - h, bw, h + 2, 1);
  }
  R.drawBuilding = function (c, k, x, y, w, h, t, opt) {
    opt = opt || {};
    var L = x - w / 2, T = y - h / 2;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    c.fillStyle = 'rgba(120,80,20,.22)'; c.beginPath(); c.ellipse(x, y + h * 0.42, w * 0.48, h * 0.1, 0, 0, 7); c.fill();
    if (k === 'wall') {
      sandBlock(c, L + w * 0.04, T + h * 0.3, w * 0.92, h * 0.6);
      crenel(c, L + w * 0.04, T + h * 0.32, w * 0.92, 3, h * 0.16);
      c.fillStyle = '#9C6B3C'; c.strokeStyle = '#6B4423'; c.lineWidth = w * 0.03;
      rr(c, L + w * 0.1, T + h * 0.52, w * 0.8, h * 0.12, h * 0.04); c.fill(); c.stroke();
      rr(c, L + w * 0.16, T + h * 0.7, w * 0.7, h * 0.11, h * 0.04); c.fill(); c.stroke();
    } else if (k === 'cannon' || k === 'gull') {
      var top = T + h * 0.12, bot = T + h * 0.9;
      var g = c.createLinearGradient(L, 0, L + w, 0);
      if (k === 'cannon') { g.addColorStop(0, '#E53935'); g.addColorStop(0.5, '#FF7961'); g.addColorStop(1, '#C62828'); } else { g.addColorStop(0, '#1E88E5'); g.addColorStop(0.5, '#6AB7FF'); g.addColorStop(1, '#1565C0'); }
      c.beginPath(); c.moveTo(L + w * 0.16, top); c.lineTo(L + w * 0.84, top); c.lineTo(L + w * 0.74, bot); c.lineTo(L + w * 0.26, bot); c.closePath();
      c.fillStyle = g; c.fill(); c.strokeStyle = k === 'cannon' ? '#8E1B1B' : '#0D47A1'; c.lineWidth = w * 0.04; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(L + w * 0.2, top + h * 0.2, w * 0.6, h * 0.08);
      c.strokeStyle = '#555'; c.lineWidth = w * 0.03; c.beginPath(); c.arc(x, top + h * 0.05, w * 0.3, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
      if (k === 'cannon') {
        c.fillStyle = '#37474F'; rr(c, x - w * 0.1, bot - h * 0.32, w * 0.2, h * 0.38, w * 0.06); c.fill();
        c.fillStyle = '#263238'; c.beginPath(); c.ellipse(x, bot + h * 0.06, w * 0.12, h * 0.05, 0, 0, 7); c.fill();
      } else {
        c.fillStyle = '#8D6E63'; c.beginPath(); c.ellipse(x, top, w * 0.34, h * 0.1, 0, 0, 7); c.fill();
        var bobg = Math.sin(t * 3) * h * 0.03;
        c.fillStyle = '#fff'; c.strokeStyle = '#78909C'; c.lineWidth = w * 0.03;
        c.beginPath(); c.ellipse(x, top - h * 0.1 + bobg, w * 0.2, h * 0.14, 0, 0, 7); c.fill(); c.stroke();
        c.beginPath(); c.arc(x + w * 0.12, top - h * 0.24 + bobg, w * 0.1, 0, 7); c.fill(); c.stroke();
        c.fillStyle = '#FFB300'; c.beginPath(); c.moveTo(x + w * 0.2, top - h * 0.25 + bobg); c.lineTo(x + w * 0.33, top - h * 0.21 + bobg); c.lineTo(x + w * 0.2, top - h * 0.18 + bobg); c.fill();
        c.fillStyle = '#222'; c.beginPath(); c.arc(x + w * 0.14, top - h * 0.27 + bobg, w * 0.022, 0, 7); c.fill();
      }
    } else if (k === 'cat') {
      c.strokeStyle = '#5D3A1A'; c.lineWidth = w * 0.08;
      c.beginPath(); c.moveTo(L + w * 0.18, T + h * 0.88); c.lineTo(x, T + h * 0.45); c.lineTo(L + w * 0.82, T + h * 0.88); c.stroke();
      c.fillStyle = '#8D5A2B'; rr(c, L + w * 0.1, T + h * 0.8, w * 0.8, h * 0.12, h * 0.04); c.fill();
      var sw = Math.sin(t * 2) * 0.08;
      c.save(); c.translate(x, T + h * 0.48); c.rotate(-0.5 + sw);
      c.strokeStyle = '#A0703C'; c.lineWidth = w * 0.07; c.beginPath(); c.moveTo(-w * 0.32, 0); c.lineTo(w * 0.22, 0); c.stroke();
      c.fillStyle = '#6D4C41'; c.beginPath(); c.arc(-w * 0.34, -h * 0.08, w * 0.14, 0, 7); c.fill(); c.strokeStyle = '#3E2723'; c.lineWidth = w * 0.03; c.stroke();
      c.fillStyle = '#3E2723'; [[-0.04, -0.03], [0.03, -0.05], [0, 0.02]].forEach(function (p) { c.beginPath(); c.arc(-w * 0.34 + p[0] * w, -h * 0.08 + p[1] * w, w * 0.02, 0, 7); c.fill(); });
      c.restore();
    } else if (k === 'chest') {
      var cy = T + h * 0.45;
      c.fillStyle = '#8D5524'; rr(c, L + w * 0.16, cy, w * 0.68, h * 0.42, w * 0.05); c.fill(); c.strokeStyle = '#5A3412'; c.lineWidth = w * 0.035; c.stroke();
      c.fillStyle = '#A86A32'; c.beginPath(); c.moveTo(L + w * 0.16, cy + 2); c.quadraticCurveTo(x, cy - h * 0.28, L + w * 0.84, cy + 2); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#FFC93C'; c.fillRect(x - w * 0.05, cy - h * 0.05, w * 0.1, h * 0.2); c.strokeRect(x - w * 0.05, cy - h * 0.05, w * 0.1, h * 0.2);
      c.fillStyle = 'rgba(255,230,120,' + (0.5 + 0.5 * Math.sin(t * 5)) + ')'; starPath(c, L + w * 0.75, cy - h * 0.12, w * 0.06, w * 0.02, 4, t); c.fill();
    } else if (k === 'flag') {
      sandBlock(c, L + w * 0.12, T - h * 0.1, w * 0.76, h * 1.0);
      crenel(c, L + w * 0.08, T - h * 0.08, w * 0.84, 3, h * 0.2);
      c.fillStyle = '#5D3A1A'; rr(c, x - w * 0.12, T + h * 0.5, w * 0.24, h * 0.4, w * 0.12); c.fill();
      c.fillStyle = '#3E2723'; rr(c, x - w * 0.07, T + h * 0.15, w * 0.14, h * 0.18, w * 0.07); c.fill();
      c.strokeStyle = '#6D4C41'; c.lineWidth = w * 0.04; c.beginPath(); c.moveTo(x, T - h * 0.3); c.lineTo(x, T - h * 0.95); c.stroke();
      c.fillStyle = '#E53935'; c.strokeStyle = '#8E1B1B'; c.lineWidth = w * 0.025;
      c.beginPath(); c.moveTo(x, T - h * 0.95);
      for (var f = 0; f <= 6; f++) c.lineTo(x + f * w * 0.075, T - h * 0.95 + Math.sin(t * 6 - f * 0.9) * h * 0.04);
      for (f = 6; f >= 0; f--) c.lineTo(x + f * w * 0.075, T - h * 0.62 + Math.sin(t * 6 - f * 0.9) * h * 0.04);
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#FFD23F'; c.beginPath(); c.arc(x + w * 0.22, T - h * 0.78 + Math.sin(t * 6 - 2.7) * h * 0.04, w * 0.06, 0, 7); c.fill();
    }
    if (opt.flash > 0) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(255,255,255,' + Math.min(0.85, opt.flash * 3) + ')'; c.fillRect(L - w, T - h * 1.2, w * 3, h * 3); }
    c.restore();
  };

  // ---------- background ----------
  function drawBackdrop(c, v, t) {
    c.fillStyle = '#F6D99A'; c.fillRect(-20, -20, v.W + 40, v.H + 40);
    var seaH = v.bandY + 8;
    var sea = c.createLinearGradient(0, 0, 0, seaH + 40); sea.addColorStop(0, '#2EC4E6'); sea.addColorStop(1, '#1FA2D6');
    c.fillStyle = sea; c.fillRect(-20, -20, v.W + 40, seaH + 50);
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2;
    for (var k = 0; k < 3; k++) { var yy = 18 + k * 14; c.beginPath(); for (var x = -20; x <= v.W + 20; x += 10) c.lineTo(x, yy + Math.sin(x / 26 + t * 1.5 + k) * 3); c.stroke(); }
    var sand = c.createLinearGradient(0, v.castleTop - 8, 0, v.H); sand.addColorStop(0, '#FBE7B5'); sand.addColorStop(0.45, '#F6D99A'); sand.addColorStop(1, '#EFC983');
    c.fillStyle = sand; c.fillRect(-20, v.castleTop - 10, v.W + 40, v.H);
    // lane gutters from castle through battlefield down to the board
    for (var col = 0; col < COLS; col++) {
      var lx = v.ox + col * v.ts;
      c.fillStyle = col % 2 ? 'rgba(255,255,255,.16)' : 'rgba(196,150,80,.16)';
      rr(c, lx + 3, v.castleTop - 2, v.ts - 6, (v.by - 8) - (v.castleTop - 2), 10); c.fill();
      // lane number just above the board
      c.font = 'bold ' + Math.round(v.ts * 0.22) + 'px ' + FONT;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = 'rgba(90,50,10,.45)';
      c.fillText(String(col + 1), lx + v.ts / 2, v.by - 8);
    }
    // moat
    c.fillStyle = 'rgba(46,170,220,.6)'; rr(c, v.ox - 4, v.bfTop - 6, v.ts * COLS + 8, 8, 4); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)'; for (x = v.ox; x < v.ox + v.ts * COLS; x += 18) c.fillRect(x + (t * 20 % 18), v.bfTop - 4, 6, 2);
    // "YOUR CRABS" / "THEIR CASTLE" labels
    c.font = 'bold 11px "Fredoka",sans-serif'; c.textAlign = 'left'; c.fillStyle = 'rgba(90,50,10,.55)';
    c.fillText('THEIR CASTLE', v.ox, v.castleTop - 2);
    c.fillText('YOUR CRABS', v.ox, v.bfTop + 18);
  }

  // ---------- main draw ----------
  R.frame = function (s, t, dt) {
    var v = R.view; if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var sh = R.shake > 0 ? R.shake : 0; R.shake = Math.max(0, R.shake - dt * 30);
    ctx.save();
    if (sh) ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
    drawBackdrop(ctx, v, t);
    if (s) {
      drawHpBanner(s, t, dt);
      drawCastle(s, t, dt);
      drawBoard(s, t, dt);
      drawTroops(s, t, dt);
      drawProj(t, dt);
      drawSpotlight(s, t);
    }
    drawParts(dt);
    drawFloats(dt);
    ctx.restore();
    if (R.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + R.flash + ')'; ctx.fillRect(0, 0, v.W, v.H); R.flash = Math.max(0, R.flash - dt * 2.5); }
    if (R.banner) drawBanner(t, dt);
  };

  function drawHpBanner(s, t, dt) {
    var v = R.view, hp = (root.CCEngine && root.CCEngine.castleHp) ? root.CCEngine.castleHp(s) : { flag: 0, flagMax: 1, def: 0, defMax: 1 };
    if (!R._hp) R._hp = { flag: hp.flag, def: hp.def, pulse: 0, defGhost: hp.def, flagGhost: hp.flag };
    var H = R._hp;
    if (hp.flag < H.flag - 0.05) H.pulse = 1;
    H.flag += (hp.flag - H.flag) * Math.min(1, dt * 8);
    H.def += (hp.def - H.def) * Math.min(1, dt * 8);
    H.flagGhost += (H.flag - H.flagGhost) * Math.min(1, dt * 1.6);
    H.defGhost += (H.def - H.defGhost) * Math.min(1, dt * 1.6);
    H.pulse = Math.max(0, H.pulse - dt * 2);
    var x = v.ox, w = v.ts * COLS, y = v.bandY, pad = 6;
    ctx.save();
    ctx.fillStyle = H.pulse > 0 ? 'rgba(180,40,20,' + (0.55 + H.pulse * 0.4) + ')' : 'rgba(40,25,12,.72)';
    rr(ctx, x - 4, y, w + 8, v.bandH - 2, 14); ctx.fill();
    ctx.strokeStyle = hp.flag / hp.flagMax < 0.3 ? '#FFD23F' : 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = 'bold 12px "Fredoka",sans-serif'; ctx.fillStyle = '#FFE9A0'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('FLAG TOWER', x + pad, y + 13);
    var label = Math.max(0, Math.ceil(H.flag)) + ' / ' + Math.ceil(hp.flagMax);
    R.hpBar(ctx, x + pad, y + 22, w - pad * 2, 14, H.flag / hp.flagMax, H.flagGhost / hp.flagMax, R.hpColor(H.flag / hp.flagMax, true), label);
    ctx.restore();
  }
  function drawSpotlight(s, t) {
    var sp = R.spotlight; if (!sp) return;
    var v = R.view, x, y, w, h;
    if (sp === 'board') { x = v.ox - 6; y = v.by - 6; w = v.ts * COLS + 12; h = v.ts * ROWS + 12; }
    else if (sp === 'flagbar') { x = v.ox - 6; y = v.bandY - 4; w = v.ts * COLS + 12; h = v.bandH + 4; }
    else if (sp === 'castle') { x = v.ox - 6; y = v.castleTop - 4; w = v.ts * COLS + 12; h = v.bfTop - v.castleTop + 4; }
    else if (sp === 'lanes') { x = v.ox - 6; y = v.bfTop - 4; w = v.ts * COLS + 12; h = v.by - v.bfTop; }
    else if (typeof sp === 'number') { x = v.ox + sp * v.ts; y = v.castleTop - 4; w = v.ts; h = v.by - v.castleTop; }
    else return;
    ctx.save();
    ctx.fillStyle = 'rgba(10,20,40,.45)';
    ctx.fillRect(0, 0, v.W, v.H);
    ctx.globalCompositeOperation = 'destination-out';
    rr(ctx, x - 6, y - 6, w + 12, h + 12, 16); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(255,230,120,' + (0.7 + 0.3 * Math.sin(t * 6)) + ')';
    ctx.lineWidth = 3; rr(ctx, x - 6, y - 6, w + 12, h + 12, 16); ctx.stroke();
    ctx.restore();
  }
  function drawCastle(s, t, dt) {
    var v = R.view, w = v.ts * 0.86, h = v.sh * 0.78, seen = {};
    for (var c = 0; c < COLS; c++) {
      s.lanes[c].forEach(function (b, i) {
        seen[b.id] = 1;
        var vs = R.svis[b.id];
        if (!vs) vs = R.svis[b.id] = { lane: c, slot: i, y: R.slotY(i), hp: b.hp, ghost: b.hp, flash: 0, k: b.k, max: b.max };
        vs.lane = c; vs.slot = i; vs.k = b.k; vs.max = b.max; vs.b = b; vs.gone = 0;
      });
    }
    var list = Object.keys(R.svis).map(function (id) { var vs = R.svis[id]; vs.id = +id; return vs; });
    list.forEach(function (vs) {
      if (!seen[vs.id]) { vs.gone = (vs.gone || 0) + dt; if (vs.gone > 1.5) delete R.svis[vs.id]; }
    });
    list.sort(function (a, b) { return b.slot - a.slot; });
    list.forEach(function (vs) {
      if (!R.svis[vs.id] || vs.dead) return;
      var ty = R.slotY(vs.slot); vs.y += (ty - vs.y) * Math.min(1, dt * 8);
      var x = R.laneX(vs.lane);
      var target = vs.b ? vs.b.hp : 0;
      if (target < vs.hp - 0.05) vs.flash = 0.35;
      vs.hp += (target - vs.hp) * Math.min(1, dt * 7);
      vs.ghost += (vs.hp - (vs.ghost || vs.hp)) * Math.min(1, dt * 1.5);
      vs.flash = Math.max(0, (vs.flash || 0) - dt);
      var wob = vs.flash > 0 ? Math.sin(vs.flash * 60) * 3 : 0;
      if (vs.k === 'flag') {
        ctx.save(); ctx.strokeStyle = 'rgba(255,210,60,' + (0.55 + 0.25 * Math.sin(t * 4)) + ')'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, vs.y, w * 0.62, 0, 7); ctx.stroke(); ctx.restore();
      }
      R.drawBuilding(ctx, vs.k, x + wob, vs.y - 4, w, h, t + vs.id, { flash: vs.flash });
      var bw = w * 0.9, bh = 11, bx = x - bw / 2, byy = vs.y + h * 0.42;
      var f = vs.hp / vs.max, g = (vs.ghost || vs.hp) / vs.max;
      R.hpBar(ctx, bx, byy, bw, bh, f, g, R.hpColor(f, vs.k === 'flag'), Math.max(0, Math.ceil(vs.hp)));
      if (vs.k === 'flag') {
        ctx.font = 'bold 10px "Fredoka",sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#8A5A00';
        ctx.fillText('GOAL', x, vs.y - h * 0.58);
      }
      if (vs.b && vs.b.cd) {
        var urgent = vs.b.t <= 1, rad = 9;
        var bx2 = x + w * 0.4, by2 = vs.y - h * 0.42;
        ctx.beginPath(); ctx.arc(bx2, by2, rad * (urgent ? 1 + 0.1 * Math.sin(t * 10) : 1), 0, 7);
        ctx.fillStyle = urgent ? '#FF3D3D' : '#2E3A42'; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(vs.b.t, bx2, by2 + 0.5);
      }
    });
  }

  function drawBoard(s, t, dt) {
    var v = R.view, ts = v.ts, S = ts * dpr;
    var bx = v.ox - 6, byy = v.by - 6, bw = ts * COLS + 12, bh = ts * ROWS + 12;
    ctx.save();
    ctx.shadowColor = 'rgba(90,60,20,.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
    ctx.fillStyle = '#C9965A'; rr(ctx, bx - 4, byy - 4, bw + 8, bh + 8, 20); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#E8C48A'; rr(ctx, bx, byy, bw, bh, 16); ctx.fill();
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) { ctx.fillStyle = (r + c) % 2 ? 'rgba(255,255,255,.16)' : 'rgba(160,110,50,.12)'; rr(ctx, v.ox + c * ts + 1.5, v.by + r * ts + 1.5, ts - 3, ts - 3, 8); ctx.fill(); }
    if (R.lane >= 0) {
      ctx.fillStyle = 'rgba(255,255,255,.28)'; rr(ctx, v.ox + R.lane * ts + 2, v.bfTop - 2, ts - 4, v.by - v.bfTop - 6, 10); ctx.fill();
      ctx.fillStyle = 'rgba(255,120,60,.85)'; var ax = R.laneX(R.lane), ay = v.bfTop + v.rh * 1.5 + Math.sin(t * 8) * 4;
      ctx.beginPath(); ctx.moveTo(ax, ay - ts * 0.3); ctx.lineTo(ax + ts * 0.22, ay); ctx.lineTo(ax + ts * 0.08, ay); ctx.lineTo(ax + ts * 0.08, ay + ts * 0.25); ctx.lineTo(ax - ts * 0.08, ay + ts * 0.25); ctx.lineTo(ax - ts * 0.08, ay); ctx.lineTo(ax - ts * 0.22, ay); ctx.closePath(); ctx.fill();
    }
    ctx.save(); rr(ctx, bx, byy, bw, bh, 16); ctx.clip();
    var newInCol = [0, 0, 0, 0, 0, 0, 0], seen = {};
    for (c = 0; c < COLS; c++) for (r = 0; r < ROWS; r++) { var x0 = s.grid[r][c]; if (x0 && !R.vis[x0.id] && !R.held[x0.id]) newInCol[c]++; }
    for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) {
      var x = s.grid[r][c]; if (!x) continue; seen[x.id] = 1;
      if (R.held[x.id]) continue;
      var vv = R.vis[x.id];
      if (!vv) vv = R.vis[x.id] = { x: c, y: r - newInCol[c] - 0.3, vy: 0, sc: 1 };
      // falling
      if (vv.y < r) { vv.vy += dt * 40; vv.y = Math.min(r, vv.y + vv.vy * dt); if (vv.y >= r) { vv.vy = 0; vv.sq = 0.18; } } else vv.y += (r - vv.y) * Math.min(1, dt * 14);
      vv.x += (c - vv.x) * Math.min(1, dt * 16);
      if (vv.sc < 1) vv.sc = Math.min(1, vv.sc + dt * 4);
      vv.sq = Math.max(0, (vv.sq || 0) - dt);
      var px = v.ox + vv.x * ts, py = v.by + vv.y * ts;
      var scl = vv.sc * (R.sel && R.sel[0] === r && R.sel[1] === c ? 1.1 + Math.sin(t * 10) * 0.03 : 1);
      var sqx = 1 + (vv.sq || 0) * 0.6, sqy = 1 - (vv.sq || 0) * 0.6;
      var img = x.t < 0 ? sprites.sand : sprites.tiles[x.t];
      ctx.save(); ctx.translate(px + ts / 2, py + ts * 0.9); ctx.scale(scl * sqx, scl * sqy); ctx.drawImage(img, -ts / 2, -ts * 0.9 + (x.t >= 0 && R.hint && R.hint.some(function (p) { return p[0] === r && p[1] === c; }) ? Math.sin(t * 12) * 3 : 0), ts, ts); ctx.restore();
      if (x.lock && !R.heldLock[x.id]) ctx.drawImage(sprites.barn, px, py, ts, ts);
    }
    Object.keys(R.vis).forEach(function (id) { if (!seen[id] && !R.keep[id]) delete R.vis[id]; });
    // popping ghosts
    R.ghosts = R.ghosts.filter(function (g) {
      g.life -= dt; if (g.life <= 0) return false;
      var k = g.life / g.max, p = R.cellXY(g.r, g.c);
      ctx.save(); ctx.globalAlpha = k; ctx.translate(p.x, p.y); var sc = 1 + (1 - k) * 0.5; ctx.scale(sc, sc);
      ctx.drawImage(g.t < 0 ? sprites.sand : sprites.tiles[g.t], -ts / 2, -ts / 2, ts, ts); ctx.restore();
      return true;
    });
    ctx.restore();
    if (R.sel) { var sp = R.cellXY(R.sel[0], R.sel[1]); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; rr(ctx, sp.x - ts / 2 + 2, sp.y - ts / 2 + 2, ts - 4, ts - 4, 10); ctx.stroke(); }
  }

  function drawTroops(s, t, dt) {
    var v = R.view, S = v.ts * 0.62, seen = {};
    var stacks = {};
    s.troops.forEach(function (tr) {
      seen[tr.id] = 1;
      var vt = R.tvis[tr.id];
      if (!vt) { vt = R.tvis[tr.id] = { x: R.laneX(tr.lane), y: R.posY(tr.pos), hp: tr.hp, a: 1, seed: tr.id * 1.7 }; }
      vt.tr = tr; vt.gone = 0;
    });
    var list = Object.keys(R.tvis).map(function (id) { return R.tvis[id]; });
    list.forEach(function (vt) {
      var tr = vt.tr;
      if (!seen[tr.id] && !vt.dying) { vt.gone += dt; if (vt.gone > 1.4) vt.dying = 'fade'; }
      var key = tr.lane + ':' + tr.pos; var n = stacks[key] = (stacks[key] || 0) + 1;
      var tx = R.laneX(tr.lane) + ((n - 1) % 3 - 1) * v.ts * 0.22 * (n > 1 ? 1 : 0), ty = R.posY(tr.pos) + Math.floor((n - 1) / 3) * v.rh * 0.25;
      if (vt.dying === 'home') { ty = v.by + v.ts * 0.2; }
      var sp = vt.dying ? 3 : 6;
      vt.x += (tx - vt.x) * Math.min(1, dt * sp); vt.y += (ty - vt.y) * Math.min(1, dt * sp);
      if (vt.lunge > 0) vt.lunge = Math.max(0, vt.lunge - dt * 4);
      if (vt.hurt > 0) vt.hurt = Math.max(0, vt.hurt - dt * 3);
      if (vt.dying) { vt.a -= dt * (vt.dying === 'home' ? 1.2 : 3); if (vt.a <= 0) { delete R.tvis[tr.id]; return; } }
      vt.hp += ((seen[tr.id] ? tr.hp : vt.hp) - vt.hp) * Math.min(1, dt * 6);
    });
    list.sort(function (a, b) { return a.y - b.y; });
    list.forEach(function (vt) {
      if (!R.tvis[vt.tr.id]) return;
      var tr = vt.tr, ly = Math.sin((vt.lunge || 0) * Math.PI) * v.ts * 0.3;
      ctx.save(); ctx.globalAlpha = Math.max(0, vt.a);
      R.drawTroop(ctx, tr.k, vt.x + (vt.hurt ? Math.sin(vt.hurt * 50) * 3 : 0), vt.y - ly, S, t, { brute: tr.brute, seed: vt.seed });
      if (vt.hurt > 0) { ctx.globalCompositeOperation = 'source-atop'; }
      ctx.restore();
      if (!vt.dying) {
        var bw = S * 0.95, bh = 9, byy = vt.y - S * (tr.brute ? 0.86 : 0.66);
        var f = Math.max(0, vt.hp / tr.max);
        vt.ghost = (vt.ghost == null) ? vt.hp : vt.ghost + (vt.hp - vt.ghost) * Math.min(1, dt * 1.6);
        R.hpBar(ctx, vt.x - bw / 2, byy, bw, bh, f, vt.ghost / tr.max, R.hpColor(f, false), Math.max(0, Math.ceil(vt.hp)));
        if (tr.st > 0 && tr.k !== 'puffer') for (var i = 0; i < tr.st; i++) { ctx.fillStyle = '#FFE36E'; ctx.strokeStyle = '#7A5A00'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(vt.x - (tr.st - 1) * 4 + i * 8, vt.y + S * 0.46, 2.6, 0, 7); ctx.fill(); ctx.stroke(); }
      }
    });
  }

  // ---------- effects ----------
  R.burst = function (x, y, color, n, power) {
    n = n || 10; power = power || 1;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = (60 + Math.random() * 180) * power;
      R.parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60 * power, r: 2 + Math.random() * 4 * power, life: 0.5 + Math.random() * 0.4, max: 0.9, col: color, star: Math.random() < 0.25 });
    }
  };
  R.ring = function (x, y, color, size) { R.parts.push({ ring: true, x: x, y: y, r: 4, grow: size || 160, life: 0.45, max: 0.45, col: color }); };
  function drawParts(dt) {
    R.parts = R.parts.filter(function (p) {
      p.life -= dt; if (p.life <= 0) return false;
      var k = p.life / p.max;
      if (p.ring) { p.r += p.grow * dt; ctx.strokeStyle = p.col; ctx.globalAlpha = k; ctx.lineWidth = 4 * k + 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; return true; }
      p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      ctx.globalAlpha = Math.min(1, k * 1.5); ctx.fillStyle = p.col;
      if (p.star) { starPath(ctx, p.x, p.y, p.r * 1.6, p.r * 0.6, 4, p.life * 6); ctx.fill(); } else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1; return true;
    });
  }
  R.float = function (x, y, text, color, size) { R.floats.push({ x: x, y: y, text: text, col: color || '#fff', size: size || 20, life: 1, max: 1 }); };
  function drawFloats(dt) {
    R.floats = R.floats.filter(function (f) {
      f.life -= dt; if (f.life <= 0) return false;
      var k = f.life / f.max, pop = k > 0.85 ? 1 + (k - 0.85) * 3 : 1;
      f.y -= dt * 40;
      ctx.save(); ctx.globalAlpha = Math.min(1, k * 2); ctx.font = Math.round(f.size * pop) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(60,30,10,.75)'; ctx.strokeText(f.text, f.x, f.y); ctx.fillStyle = f.col; ctx.fillText(f.text, f.x, f.y); ctx.restore();
      return true;
    });
  }
  R.shoot = function (kind, x0, y0, x1, y1, dur, onArrive) { R.proj.push({ k: kind, x0: x0, y0: y0, x1: x1, y1: y1, t: 0, dur: dur || 0.45, cb: onArrive }); };
  function drawProj(t, dt) {
    var ts = R.view.ts;
    R.proj = R.proj.filter(function (p) {
      p.t += dt; var k = Math.min(1, p.t / p.dur);
      var x = p.x0 + (p.x1 - p.x0) * k, y = p.y0 + (p.y1 - p.y0) * k - Math.sin(k * Math.PI) * ts * (p.k === 'gull' ? 0.4 : 1.2);
      if (p.k === 'ball') { ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.arc(x, y, ts * 0.11, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(x - 2, y - 2, ts * 0.04, 0, 7); ctx.fill(); }
      else if (p.k === 'coco') { ctx.fillStyle = '#6D4C41'; ctx.beginPath(); ctx.arc(x, y, ts * 0.14, 0, 7); ctx.fill(); ctx.strokeStyle = '#3E2723'; ctx.lineWidth = 2; ctx.stroke(); }
      else if (p.k === 'sand') { ctx.save(); ctx.translate(x - ts * 0.3, y - ts * 0.3); ctx.drawImage(sprites.sand, 0, 0, ts * 0.6, ts * 0.6); ctx.restore(); }
      else if (p.k === 'barn') { ctx.drawImage(sprites.barn, x - ts * 0.25, y - ts * 0.25, ts * 0.5, ts * 0.5); }
      else if (p.k === 'gull') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; var fl = Math.sin(t * 20) * 6; ctx.beginPath(); ctx.moveTo(x - 12, y - fl); ctx.quadraticCurveTo(x - 5, y - 6, x, y); ctx.quadraticCurveTo(x + 5, y - 6, x + 12, y - fl); ctx.stroke(); }
      else if (p.k === 'pearl') { ctx.fillStyle = '#fff'; ctx.shadowColor = '#B9A6FF'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(x, y, ts * 0.16, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
      if (k >= 1) { if (p.cb) p.cb(); return false; }
      return true;
    });
  }
  R.showBanner = function (text, sub, color) { R.banner = { text: text, sub: sub, col: color || '#FFD23F', life: 1.4, max: 1.4 }; };
  function drawBanner(t, dt) {
    var b = R.banner, v = R.view; b.life -= dt; if (b.life <= 0) { R.banner = null; return; }
    var k = b.life / b.max, inn = Math.min(1, (1 - k) * 6), out = Math.min(1, k * 4), a = Math.min(inn, out);
    ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = a;
    var y = v.bfTop + v.rh * 1.5;
    ctx.fillStyle = 'rgba(30,60,90,.55)'; ctx.fillRect(0, y - 34, v.W, 68);
    ctx.font = '38px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var sc = 0.6 + 0.4 * inn; ctx.translate(v.W / 2, y - (b.sub ? 6 : 0)); ctx.scale(sc, sc);
    ctx.lineWidth = 7; ctx.strokeStyle = '#5A2A00'; ctx.strokeText(b.text, 0, 0); ctx.fillStyle = b.col; ctx.fillText(b.text, 0, 0);
    if (b.sub) { ctx.font = '17px ' + FONT; ctx.lineWidth = 4; ctx.strokeText(b.sub, 0, 26); ctx.fillStyle = '#fff'; ctx.fillText(b.sub, 0, 26); }
    ctx.restore();
  }
  R.spotlight = null; R._hp = null;
  R.reset = function () { R.vis = {}; R.spotlight = null; R._hp = null;  R.tvis = {}; R.svis = {}; R.parts = []; R.ghosts = []; R.floats = []; R.proj = []; R.held = {}; R.heldLock = {}; R.keep = {}; R.sel = null; R.lane = -1; R.banner = null; R.hint = null; };

  // ---------- home beach scene (title + base screens) ----------
  R.drawScene = function (c, W, H, t, lvl, opt) {
    opt = opt || {};
    lvl = lvl || {};
    var sky = c.createLinearGradient(0, 0, 0, H * 0.45); sky.addColorStop(0, '#7FDBFF'); sky.addColorStop(1, '#BFF0FF');
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    c.fillStyle = '#FFF4B8'; c.beginPath(); c.arc(W * 0.82, H * 0.1, Math.min(W, H) * 0.08, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.9)'; [[0.2, 0.08, 1], [0.55, 0.15, 0.8]].forEach(function (cl) { var x = ((cl[0] * W + t * 8 * cl[2]) % (W + 120)) - 60, y = cl[1] * H, r = 18 * cl[2]; c.beginPath(); c.arc(x, y, r, 0, 7); c.arc(x + r, y - r * 0.5, r * 1.1, 0, 7); c.arc(x + r * 2.1, y, r * 0.9, 0, 7); c.fill(); });
    var seaY = H * (opt.seaY || 0.3);
    var sea = c.createLinearGradient(0, seaY, 0, seaY + H * 0.2); sea.addColorStop(0, '#22B8E0'); sea.addColorStop(1, '#4FD3F0');
    c.fillStyle = sea; c.fillRect(0, seaY, W, H * 0.2);
    var shore = seaY + H * 0.14;
    c.fillStyle = '#F6D99A'; c.beginPath(); c.moveTo(0, shore); for (var x = 0; x <= W + 10; x += 10) c.lineTo(x, shore + Math.sin(x / 50 + t) * 5); c.lineTo(W + 10, H); c.lineTo(0, H); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); for (x = 0; x <= W; x += 10) c.lineTo(x, shore + Math.sin(x / 50 + t) * 5); c.stroke();
    // harbour boats
    for (var b = 0; b < (lvl.harbour || 0) + 1; b++) {
      var bx = W * (0.12 + b * 0.12) + Math.sin(t + b) * 4, by = seaY + H * 0.07 + Math.sin(t * 2 + b) * 2;
      c.fillStyle = '#8D5524'; c.beginPath(); c.moveTo(bx - 16, by); c.lineTo(bx + 16, by); c.lineTo(bx + 10, by + 8); c.lineTo(bx - 10, by + 8); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(bx, by - 2); c.lineTo(bx, by - 24); c.lineTo(bx + 13, by - 4); c.fill();
    }
    // sandcastle grows with castle level
    var cl = lvl.castle || 1, cx = W * 0.5, cy = shore + H * (opt.castleY || 0.2), u = Math.min(W, H) * (opt.scale || 0.11);
    var towers = [[0, 1.5]]; if (cl >= 2) towers.push([-1.3, 1.0]); if (cl >= 3) towers.push([1.3, 1.0]); if (cl >= 4) towers.push([-2.4, 0.7], [2.4, 0.7]); if (cl >= 5) towers.push([0, 2.3]);
    c.fillStyle = 'rgba(120,80,20,.2)'; c.beginPath(); c.ellipse(cx, cy + u * 0.55, u * 3.2, u * 0.5, 0, 0, 7); c.fill();
    sandBlock(c, cx - u * 2, cy - u * 0.4, u * 4, u * 1.0);
    crenel(c, cx - u * 2, cy - u * 0.38, u * 4, 7, u * 0.25);
    towers.sort(function (a, b2) { return b2[1] - a[1]; }).forEach(function (tw) {
      var tx = cx + tw[0] * u, th = tw[1] * u * 1.3;
      sandBlock(c, tx - u * 0.45, cy - th, u * 0.9, th + u * 0.5);
      crenel(c, tx - u * 0.5, cy - th, u, 3, u * 0.22);
      c.strokeStyle = '#6D4C41'; c.lineWidth = 3; c.beginPath(); c.moveTo(tx, cy - th - u * 0.2); c.lineTo(tx, cy - th - u * 0.9); c.stroke();
      c.fillStyle = '#E53935'; c.beginPath(); c.moveTo(tx, cy - th - u * 0.9); for (var f = 0; f <= 4; f++) c.lineTo(tx + f * u * 0.12, cy - th - u * 0.9 + Math.sin(t * 5 - f) * 3); for (f = 4; f >= 0; f--) c.lineTo(tx + f * u * 0.12, cy - th - u * 0.6 + Math.sin(t * 5 - f) * 3); c.fill();
    });
    c.fillStyle = '#5D3A1A'; rr(c, cx - u * 0.3, cy + u * 0.05, u * 0.6, u * 0.55, u * 0.3); c.fill();
    // marching crew
    if (opt.crew !== false) {
      var crew = ['shieldcrab', 'lobster', 'eel', 'spinner', 'puffer'];
      for (var i = 0; i < 5; i++) {
        var px = ((i * W * 0.22 + t * 40) % (W + 80)) - 40, py = cy + u * (1.3 + (i % 2) * 0.35);
        R.drawTroop(c, crew[i], px, py, u * 0.75, t, { seed: i, brute: lvl[crew[i]] >= 4 });
      }
    }
  };


  // ---------- village (7x4 plots, front row at the bottom) ----------
  R.drawDeco = function (c, id, x, y, S) {
    c.save(); c.translate(x, y);
    if (id === 'palm') {
      c.fillStyle = '#8D5524'; c.fillRect(-3, -S * 0.05, 6, S * 0.45);
      c.fillStyle = '#2E9B4A';
      for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + (i - 2) * 0.45; c.beginPath(); c.ellipse(Math.cos(a) * S * 0.22, -S * 0.15 + Math.sin(a) * S * 0.1, S * 0.2, S * 0.08, a, 0, 7); c.fill(); }
    } else if (id === 'umbrella') {
      c.strokeStyle = '#C62828'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, S * 0.35); c.lineTo(0, -S * 0.05); c.stroke();
      c.fillStyle = '#FF6B6B'; c.beginPath(); c.moveTo(0, -S * 0.08); c.quadraticCurveTo(-S * 0.35, S * 0.05, -S * 0.32, S * 0.12); c.lineTo(S * 0.32, S * 0.12); c.quadraticCurveTo(S * 0.35, S * 0.05, 0, -S * 0.08); c.fill();
    } else if (id === 'statue') {
      c.translate(-S * 0.4, -S * 0.5); R.drawTileIcon(c, 3, S * 0.8); c.translate(S * 0.4, S * 0.5);
    } else if (id === 'bucket') {
      c.fillStyle = '#F4A236'; rr(c, -S * 0.16, S * 0.05, S * 0.32, S * 0.25, 4); c.fill(); c.strokeStyle = '#C67A10'; c.stroke();
      c.fillStyle = '#E0A64F'; c.fillRect(S * 0.1, -S * 0.05, 4, S * 0.2);
    } else {
      c.fillStyle = '#FFF3A6'; c.beginPath(); c.arc(0, 0, S * 0.16, 0, 7); c.fill();
      c.strokeStyle = '#E0C060'; c.stroke();
    }
    c.restore();
  };
  R.villageCellAt = function (x, y, view) {
    var v = view || R.vview; if (!v) return null;
    var c = Math.floor((x - v.ox) / v.tw), rFront = Math.floor((y - v.oy) / v.th);
    // displayed with front (row 0) at the bottom
    var r = (D.VROWS - 1) - rFront;
    if (c < 0 || r < 0 || c >= D.VCOLS || r >= D.VROWS) return null;
    return { r: r, c: c };
  };
  R.drawVillage = function (c, grid, opt) {
    opt = opt || {};
    var W = opt.W, H = opt.H, t = opt.t || 0, sel = opt.sel, skin = opt.skin || 'default';
    var VROWS = D.VROWS, VCOLS = D.VCOLS;
    var skyTop = 0.14;
    var sky = c.createLinearGradient(0, 0, 0, H * skyTop + 20);
    if (skin === 'sunset') { sky.addColorStop(0, '#FF8A5B'); sky.addColorStop(1, '#FFD19A'); }
    else if (skin === 'royal') { sky.addColorStop(0, '#3A4FB8'); sky.addColorStop(1, '#9BB6FF'); }
    else { sky.addColorStop(0, '#7FDBFF'); sky.addColorStop(1, '#BFF0FF'); }
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    c.fillStyle = skin === 'sunset' ? '#FFCF70' : '#FFF4B8'; c.beginPath(); c.arc(W * 0.82, H * 0.07, 22, 0, 7); c.fill();
    var seaY = H * skyTop;
    c.fillStyle = '#22B8E0'; c.fillRect(0, seaY, W, H * 0.12);
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2;
    c.beginPath(); for (var x = 0; x <= W; x += 10) c.lineTo(x, seaY + 8 + Math.sin(x / 30 + t) * 3); c.stroke();
    var pad = 10, top = seaY + H * 0.13, bot = H - 8;
    var tw = Math.floor((W - pad * 2) / VCOLS), th = Math.floor((bot - top) / VROWS);
    var ox = Math.round((W - tw * VCOLS) / 2), oy = top;
    R.vview = { ox: ox, oy: oy, tw: tw, th: th, W: W, H: H };
    // sand plots, front at the bottom
    for (var rr = 0; rr < VROWS; rr++) {
      var r = (VROWS - 1) - rr; // data row
      for (var col = 0; col < VCOLS; col++) {
        var px = ox + col * tw, py = oy + rr * th;
        var even = (rr + col) % 2 === 0;
        c.fillStyle = even ? '#F3D7A0' : '#E8C684';
        rr_fn(c, px + 3, py + 3, tw - 6, th - 6, 10); c.fill();
        c.strokeStyle = 'rgba(160,110,50,.35)'; c.lineWidth = 1; c.stroke();
        if (sel && sel.r === r && sel.c === col) {
          c.strokeStyle = '#FF8A2B'; c.lineWidth = 3; c.stroke();
        }
        var cell = grid[r] && grid[r][col];
        var cx = px + tw / 2, cy = py + th * 0.55;
        if (cell && cell.deco) R.drawDeco(c, cell.id, cx, cy, Math.min(tw, th) * 0.85);
        else if (cell) {
          var bw = tw * 0.72, bh = th * 0.62;
          R.drawBuilding(c, D.BUILD[cell.code].k, cx, cy - 4, bw, bh, t + col, {});
          if (cell.lv > 1) {
            c.font = 'bold 11px ' + FONT; c.fillStyle = '#8A5A00'; c.textAlign = 'center';
            c.fillText('Lv ' + cell.lv, cx, py + th - 8);
          }
        }
      }
    }
    // front label
    c.font = 'bold 11px "Fredoka",sans-serif'; c.fillStyle = 'rgba(90,50,10,.6)'; c.textAlign = 'left';
    c.fillText('FRONT  (raiders attack from here)', ox + 4, oy + VROWS * th - 2);
    c.textAlign = 'center'; c.fillText('KEEP', ox + 3.5 * tw, oy + 12);
  };
  function rr_fn(c, x, y, w, h, r) { rr(c, x, y, w, h, r); }

  root.Render = R;
})(window);
