/* Cosmetics catalog + procedural drawing (kites, tails, trails). All art is drawn in code, no image assets.
 * Cosmetics are visual only: they never change physics (the sim never sees them). Bought with Breeze (earned in play).
 * Pure drawing helpers take a 2D context, so the race, the ghosts and the locker previews all share them. */
(function (root) {
  'use strict';
  var TAU = Math.PI * 2;
  var KITES = [
    { id: 'classic', name: 'Classic', price: 0, shape: 'diamond', a: '#FF5D73', b: '#FFD166' },
    { id: 'mint', name: 'Mint Fizz', price: 150, shape: 'diamond', a: '#06D6A0', b: '#E0FFF4' },
    { id: 'sunset', name: 'Sunset Delta', price: 250, shape: 'delta', a: '#FF7A59', b: '#FFC857' },
    { id: 'ocean', name: 'Ocean Delta', price: 250, shape: 'delta', a: '#3A86FF', b: '#8ECAE6' },
    { id: 'grape', name: 'Grape Swallow', price: 400, shape: 'swallow', a: '#8E5CF0', b: '#F5C6FF' },
    { id: 'bumble', name: 'Bumble', price: 400, shape: 'swallow', a: '#FFD60A', b: '#2B2D42' },
    { id: 'meadow', name: 'Meadow Leaf', price: 600, shape: 'leaf', a: '#4CAF50', b: '#C5E86C' },
    { id: 'aurora', name: 'Aurora', price: 800, shape: 'hex', a: '#7B2FF7', b: '#00E5FF' }
  ];
  var TAILS = [
    { id: 'bows', name: 'Bows', price: 0 },
    { id: 'ribbon', name: 'Ribbon', price: 100 },
    { id: 'pennants', name: 'Pennants', price: 150 },
    { id: 'pompoms', name: 'Pom-poms', price: 200 },
    { id: 'stars', name: 'Stars', price: 300 },
    { id: 'leaves', name: 'Leaves', price: 400 }
  ];
  var TRAILS = [
    { id: 'ribbon', name: 'Cloud Ribbon', price: 0 },
    { id: 'sparkle', name: 'Sparkle', price: 150 },
    { id: 'rainbow', name: 'Rainbow', price: 250 },
    { id: 'petals', name: 'Petals', price: 300 },
    { id: 'comet', name: 'Comet', price: 400 },
    { id: 'mist', name: 'Mist', price: 500 }
  ];
  var BY = { kite: KITES, tail: TAILS, trail: TRAILS };
  function find(slot, id) { var l = BY[slot]; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return l[0]; }
  function defaults() { return { kite: 'classic', tail: 'bows', trail: 'ribbon' }; }

  function poly(g, pts) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); }
  function star(g, x, y, r, rot) { g.beginPath(); for (var i = 0; i < 10; i++) { var a = rot + i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }

  /** Kite body. Local axes: nose points to -y. ang = flight angle (radians). sz = size multiplier (1 = race size). */
  function drawKite(g, x, y, ang, k, sz, alpha) {
    var w = 26 * 1.7 * sz, h = 34 * 1.7 * sz;
    g.save(); g.translate(x, y); g.rotate(ang + 0.25); if (alpha != null) g.globalAlpha = alpha;
    var line = 'rgba(255,255,255,0.85)', spine = 'rgba(60,40,30,0.5)';
    if (k.shape === 'diamond') {
      g.fillStyle = k.a; poly(g, [[0, -h], [w, -h * 0.2], [0, 0]]); g.fill(); poly(g, [[0, h], [-w, -h * 0.2], [0, 0]]); g.fill();
      g.fillStyle = k.b; poly(g, [[0, -h], [-w, -h * 0.2], [0, 0]]); g.fill(); poly(g, [[0, h], [w, -h * 0.2], [0, 0]]); g.fill();
      g.strokeStyle = spine; g.lineWidth = 3.5; g.beginPath(); g.moveTo(0, -h); g.lineTo(0, h); g.moveTo(-w, -h * 0.2); g.lineTo(w, -h * 0.2); g.stroke();
      g.strokeStyle = line; poly(g, [[0, -h], [w, -h * 0.2], [0, h], [-w, -h * 0.2]]); g.stroke();
    } else if (k.shape === 'delta') {
      var dw = w * 1.35, dy = h * 0.55;
      g.fillStyle = k.a; poly(g, [[0, -h], [dw, dy], [0, h * 0.2]]); g.fill();
      g.fillStyle = k.b; poly(g, [[0, -h], [-dw, dy], [0, h * 0.2]]); g.fill();
      g.strokeStyle = spine; g.lineWidth = 3.5; g.beginPath(); g.moveTo(0, -h); g.lineTo(0, h * 0.6); g.stroke();
      g.strokeStyle = line; poly(g, [[0, -h], [dw, dy], [0, h * 0.2], [-dw, dy]]); g.stroke();
    } else if (k.shape === 'swallow') {
      var sw = w * 1.05;
      g.fillStyle = k.a; poly(g, [[0, -h], [sw, -h * 0.15], [w * 0.55, h], [0, h * 0.45]]); g.fill();
      g.fillStyle = k.b; poly(g, [[0, -h], [-sw, -h * 0.15], [-w * 0.55, h], [0, h * 0.45]]); g.fill();
      g.strokeStyle = spine; g.lineWidth = 3.5; g.beginPath(); g.moveTo(0, -h); g.lineTo(0, h * 0.45); g.stroke();
      g.strokeStyle = line; poly(g, [[0, -h], [sw, -h * 0.15], [w * 0.55, h], [0, h * 0.45], [-w * 0.55, h], [-sw, -h * 0.15]]); g.stroke();
    } else if (k.shape === 'hex') {
      var hx = w * 1.05;
      g.fillStyle = k.a; poly(g, [[0, -h], [hx, -h * 0.5], [hx, h * 0.5], [0, 0]]); g.fill();
      g.fillStyle = k.b; poly(g, [[0, -h], [-hx, -h * 0.5], [-hx, h * 0.5], [0, 0]]); g.fill();
      g.fillStyle = k.a; g.globalAlpha = (alpha == null ? 1 : alpha) * 0.7; poly(g, [[0, h], [-hx, h * 0.5], [0, 0]]); g.fill(); g.globalAlpha = alpha == null ? 1 : alpha;
      g.fillStyle = k.b; poly(g, [[0, h], [hx, h * 0.5], [0, 0]]); g.fill();
      g.strokeStyle = spine; g.lineWidth = 3.5; g.beginPath(); g.moveTo(0, -h); g.lineTo(0, h); g.stroke();
      g.strokeStyle = line; poly(g, [[0, -h], [hx, -h * 0.5], [hx, h * 0.5], [0, h], [-hx, h * 0.5], [-hx, -h * 0.5]]); g.stroke();
    } else { // leaf
      var lw = w * 1.1;
      g.fillStyle = k.a; g.beginPath(); g.moveTo(0, -h); g.quadraticCurveTo(lw * 1.3, -h * 0.1, 0, h); g.closePath(); g.fill();
      g.fillStyle = k.b; g.beginPath(); g.moveTo(0, -h); g.quadraticCurveTo(-lw * 1.3, -h * 0.1, 0, h); g.closePath(); g.fill();
      g.strokeStyle = spine; g.lineWidth = 3.5; g.beginPath(); g.moveTo(0, -h); g.lineTo(0, h); g.stroke();
      g.strokeStyle = 'rgba(60,110,50,0.55)'; g.lineWidth = 2.5; g.beginPath(); for (var v = -0.5; v <= 0.6; v += 0.35) { g.moveTo(0, h * v); g.lineTo(lw * 0.7, h * v - h * 0.25); g.moveTo(0, h * v); g.lineTo(-lw * 0.7, h * v - h * 0.25); } g.stroke();
      g.strokeStyle = line; g.lineWidth = 3.5; g.beginPath(); g.moveTo(0, -h); g.quadraticCurveTo(lw * 1.3, -h * 0.1, 0, h); g.quadraticCurveTo(-lw * 1.3, -h * 0.1, 0, -h); g.stroke();
    }
    g.restore();
  }

  /** Tail along rope points pts[0..n] (pts[0] at the kite). */
  function drawTail(g, pts, tail, k, alpha, time) {
    if (!pts || pts.length < 2) return;
    g.save(); if (alpha != null) g.globalAlpha = alpha;
    var i, p, q, ang, c1 = k.a, c2 = k.b;
    if (tail.id === 'ribbon') {
      g.strokeStyle = c1; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
      for (i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y); g.stroke();
      g.strokeStyle = c2; g.lineWidth = 3; g.beginPath(); g.moveTo(pts[0].x, pts[0].y); for (i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y); g.stroke();
    } else {
      g.strokeStyle = c1; g.lineWidth = 3.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
      for (i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y); g.stroke();
      for (i = 2; i < pts.length; i += 2) {
        p = pts[i]; q = pts[i - 1]; ang = Math.atan2(p.y - q.y, p.x - q.x); var c = (i / 2) % 2 ? c1 : c2;
        g.save(); g.translate(p.x, p.y); g.rotate(ang); g.fillStyle = c;
        if (tail.id === 'bows') { poly(g, [[0, 0], [-9, -8], [-9, 8]]); g.fill(); poly(g, [[0, 0], [9, -8], [9, 8]]); g.fill(); }
        else if (tail.id === 'pennants') { poly(g, [[0, 0], [-4, -3], [-20, 0], [-4, 3]]); g.fill(); g.rotate(1.5); poly(g, [[0, 0], [-4, -3], [-20, 0], [-4, 3]]); g.fill(); }
        else if (tail.id === 'pompoms') { g.beginPath(); g.arc(0, 0, 9 - i * 0.25, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.arc(-2.5, -3, 3, 0, TAU); g.fill(); }
        else if (tail.id === 'stars') { g.fillStyle = i % 4 ? '#FFD166' : '#FFFFFF'; star(g, 0, 0, 11, 0); g.fill(); }
        else if (tail.id === 'leaves') { g.fillStyle = i % 4 ? '#5FBF6A' : '#A8E06C'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-8, -12, -18, 0); g.quadraticCurveTo(-8, 12, 0, 0); g.fill(); }
        g.restore();
      }
    }
    g.restore();
  }

  /** Trail along points (oldest -> newest), offset behind the kite. */
  function drawTrail(g, pts, trail, alpha, time) {
    var n = pts.length; if (n < 2) return; time = time || 0;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; var i, t, a, b;
    var ga = alpha == null ? 1 : alpha;
    if (trail.id === 'ribbon' || trail.id === 'rainbow') {
      var bands = trail.id === 'rainbow' ? ['#FF5D73', '#FFB703', '#FFE066', '#06D6A0', '#4CC9F0', '#9B5DE5'] : ['#FFFFFF'];
      for (var bi = 0; bi < bands.length; bi++) {
        g.strokeStyle = bands[bi];
        for (i = 1; i < n; i++) {
          t = i / n; a = pts[i - 1]; b = pts[i];
          var off = trail.id === 'rainbow' ? (bi - (bands.length - 1) / 2) * 6 * (0.4 + t) : 0;
          g.globalAlpha = ga * t * (trail.id === 'rainbow' ? 0.8 : 0.55);
          g.lineWidth = trail.id === 'rainbow' ? 5 + t * 4 : 3 + t * 14;
          g.beginPath(); g.moveTo(a.x, a.y + off); g.lineTo(b.x, b.y + off); g.stroke();
        }
      }
    } else if (trail.id === 'comet') {
      for (i = 1; i < n; i++) {
        t = i / n; a = pts[i - 1]; b = pts[i];
        g.globalAlpha = ga * t * 0.35; g.strokeStyle = '#FF9F1C'; g.lineWidth = 6 + t * 26; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
        g.globalAlpha = ga * t * 0.8; g.strokeStyle = '#FFF3B0'; g.lineWidth = 2 + t * 9; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      }
    } else if (trail.id === 'mist') {
      for (i = 0; i < n; i += 1) {
        t = i / n; g.globalAlpha = ga * t * 0.28; g.fillStyle = i % 2 ? '#FFFFFF' : '#CFE8FF';
        g.beginPath(); g.arc(pts[i].x, pts[i].y + Math.sin(time * 3 + i) * 3, 8 + (1 - t) * 18, 0, TAU); g.fill();
      }
    } else if (trail.id === 'sparkle') {
      for (i = 0; i < n; i += 1) {
        t = i / n; g.globalAlpha = ga * t; g.fillStyle = i % 3 ? '#FFD166' : '#FFFFFF';
        var tw = 0.6 + 0.4 * Math.sin(time * 9 + i * 1.7); star(g, pts[i].x + Math.sin(i * 2.3) * 7, pts[i].y + Math.cos(i * 1.9) * 7, (4 + t * 8) * tw, i + time); g.fill();
      }
    } else if (trail.id === 'petals') {
      for (i = 0; i < n; i += 1) {
        t = i / n; g.globalAlpha = ga * t; g.fillStyle = i % 2 ? '#FF9FB5' : '#FFD1DC';
        g.save(); g.translate(pts[i].x + Math.sin(i * 1.3 + time * 2) * 10, pts[i].y + Math.cos(i * 1.7) * 10); g.rotate(i * 0.9 + time);
        g.beginPath(); g.ellipse(0, 0, 3 + t * 8, 2 + t * 4, 0, 0, TAU); g.fill(); g.restore();
      }
    }
    g.restore();
  }

  /** Locker preview: draws one item (with the rest of the loadout) into a small canvas. */
  function preview(canvas, slot, id, loadout, time) {
    var g = canvas.getContext('2d'), W = canvas.width, H = canvas.height; g.clearRect(0, 0, W, H);
    var L = { kite: loadout.kite, tail: loadout.tail, trail: loadout.trail }; L[slot] = id;
    var kite = find('kite', L.kite), tail = find('tail', L.tail), trail = find('trail', L.trail);
    var sc = H / 150; g.save(); g.scale(sc, sc); var w = W / sc, kx = w * 0.62, ky = 62;
    var tp = [], rp = [], i;
    for (i = 0; i < 24; i++) rp.push({ x: kx - 26 - (24 - i) * 3.2, y: ky + 8 + Math.sin((24 - i) * 0.35) * 9 + (24 - i) * 0.6 });
    for (i = 0; i < 14; i++) tp.push({ x: kx - 28 - i * 9, y: ky + 26 + i * 3 + Math.sin(i * 0.9 + (time || 0)) * 5 });
    drawTrail(g, rp, trail, 1, time || 0); drawTail(g, tp, tail, kite, 1, time || 0); drawKite(g, kx, ky, -0.1, kite, 1, 1);
    g.restore();
  }

  root.KCCos = { KITES: KITES, TAILS: TAILS, TRAILS: TRAILS, find: find, defaults: defaults, drawKite: drawKite, drawTail: drawTail, drawTrail: drawTrail, preview: preview };
})(typeof self !== 'undefined' ? self : this);
