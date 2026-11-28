/* Pocket Burrow art: everything is drawn in code (canvas 2D), no image files, no third-party art.
 * Soft storybook look: warm palette, rounded shapes, darker-tint outlines, gentle gradients, lots of idle motion.
 * Functions draw in local coordinates (cell origin = top-left of a 90x88 cell, critter origin = feet centre). */
(function (root) {
  'use strict';
  var TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos, PI = Math.PI;

  // ---------- colour helpers ----------
  var _c = {};
  function hex(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mixc(a, b, t) { var A = hex(a), B = hex(b); return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')'; }
  function shade(h, amt) { var k = h + amt; if (_c[k]) return _c[k]; return (_c[k] = amt < 0 ? mixc(h, '#2a1a14', -amt) : mixc(h, '#fff6e0', amt)); }
  function alpha(h, a) { var c = hex(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  // ---------- primitives ----------
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); }
  function fillStroke(c, fill, stroke, lw) { c.fillStyle = fill; c.fill(); if (stroke) { c.lineWidth = lw || 1.2; c.strokeStyle = stroke; c.stroke(); } }
  function glow(c, x, y, r, col, a) { var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, alpha(col, a)); g.addColorStop(1, alpha(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
  function hash(n) { var x = sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function star(c, x, y, r, pts, inner) { c.beginPath(); for (var i = 0; i < pts * 2; i++) { var a = -PI / 2 + i * PI / pts, rad = i % 2 ? r * (inner || .45) : r; c.lineTo(x + cos(a) * rad, y + sin(a) * rad); } c.closePath(); }
  function heart(c, x, y, s) { c.beginPath(); c.moveTo(x, y + s * .35); c.bezierCurveTo(x - s, y - s * .25, x - s * .55, y - s, x, y - s * .45); c.bezierCurveTo(x + s * .55, y - s, x + s, y - s * .25, x, y + s * .35); c.closePath(); }

  // =====================================================================================================
  //  CRITTERS
  // =====================================================================================================
  /** st: { t:seconds, dir:+1/-1, walk:0..1, seed:number, happy:0..1, hop:px } ; origin = feet centre. */
  function drawCritter(c, look, st) {
    var t = st.t, seed = st.seed || 0, dir = st.dir || 1, walk = st.walk || 0, hop = st.hop || 0;
    var sc = (look.big || 1) * (st.scale || 1);
    var slp = !!st.sleep;
    var bob = sin(t * (walk ? 11 : slp ? 1.1 : 2.2) + seed) * (walk ? 1.4 : slp ? .5 : .9);
    var squash = 1 + sin(t * (slp ? 1.1 : 2.2) + seed) * (slp ? .04 : .025);
    c.save(); c.translate(st.x || 0, (st.y || 0) - hop); c.scale(dir * sc, sc);
    // soft shadow
    c.fillStyle = 'rgba(40,20,10,.22)'; ell(c, 0, 0, 12 * (1 - hop / 40), 3); c.fill();
    var blink = slp || (t * .8 + seed * 1.7) % 4.6 > 4.45;
    var fn = ARCH[look.arch] || ARCH.furry;
    fn(c, look, t, seed, walk, bob, squash, blink, st);
    c.restore();
  }
  function eyes(c, x, y, blink, s) {
    s = s || 1;
    c.fillStyle = '#2b1d1a';
    [[x, y], [x + 6.2 * s, y + .4]].forEach(function (p, i) {
      if (blink) { c.lineWidth = 1.3; c.strokeStyle = '#2b1d1a'; c.beginPath(); c.moveTo(p[0] - 1.8, p[1]); c.quadraticCurveTo(p[0], p[1] + 1.4, p[0] + 1.8, p[1]); c.stroke(); }
      else { ell(c, p[0], p[1], 1.9 * s, 2.5 * s); c.fill(); c.fillStyle = '#fff'; ell(c, p[0] + .6, p[1] - .9, .75 * s, .85 * s); c.fill(); c.fillStyle = '#2b1d1a'; }
    });
  }
  function blush(c, x, y) { c.fillStyle = 'rgba(244,130,130,.35)'; ell(c, x, y, 2.6, 1.7); c.fill(); }

  function accessory(c, look, hx, hy, t, kind) {
    var a = look.acc, col = look.accColor || '#d9534f';
    if (!a || a === 'none') return;
    if (a === 'glasses') { c.lineWidth = 1.1; c.strokeStyle = col; c.beginPath(); c.arc(hx, hy, 3.6, 0, TAU); c.stroke(); c.beginPath(); c.arc(hx + 6.2, hy + .4, 3.6, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(hx + 3.6, hy); c.lineTo(hx + 2.6, hy + .3); c.stroke(); c.fillStyle = 'rgba(190,230,255,.25)'; c.beginPath(); c.arc(hx, hy, 3.4, 0, TAU); c.arc(hx + 6.2, hy + .4, 3.4, 0, TAU); c.fill(); }
    else if (a === 'hat') { rr(c, hx - 5, hy - 15.5, 15, 8, 3); fillStroke(c, col, shade(col, -.35)); rr(c, hx - 7, hy - 9.5, 19, 3.2, 1.5); fillStroke(c, shade(col, .15), shade(col, -.35)); }
    else if (a === 'bow') { var bx = hx - 3, by = hy - 12; c.fillStyle = col; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - 5, by - 3); c.lineTo(bx - 5, by + 3); c.closePath(); c.fill(); c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + 5, by - 3); c.lineTo(bx + 5, by + 3); c.closePath(); c.fill(); c.fillStyle = shade(col, -.3); c.beginPath(); c.arc(bx, by, 1.6, 0, TAU); c.fill(); }
    else if (a === 'flower') { var fx = hx + 5, fy = hy - 11; for (var i = 0; i < 5; i++) { c.fillStyle = col; ell(c, fx + cos(i * TAU / 5) * 2.4, fy + sin(i * TAU / 5) * 2.4, 1.8, 1.8); c.fill(); } c.fillStyle = '#fff2a8'; ell(c, fx, fy, 1.5, 1.5); c.fill(); }
    else if (a === 'crown') { c.fillStyle = col; c.beginPath(); var cx = hx + 3; c.moveTo(cx - 5, hy - 9); c.lineTo(cx - 5, hy - 14); c.lineTo(cx - 2.5, hy - 11); c.lineTo(cx, hy - 15); c.lineTo(cx + 2.5, hy - 11); c.lineTo(cx + 5, hy - 14); c.lineTo(cx + 5, hy - 9); c.closePath(); c.fill(); c.strokeStyle = shade(col, -.4); c.lineWidth = .9; c.stroke(); }
    else if (a === 'towel') { rr(c, hx - 4, hy - 13, 15, 6, 3); fillStroke(c, col, shade(col, -.25)); }
  }

  var ARCH = {};
  ARCH.furry = function (c, L, t, seed, walk, bob, sq, blink) {
    var body = L.body, belly = L.belly, out = shade(body, -.38);
    var legs = walk ? sin(t * 14 + seed) * 2 : 0;
    // tail
    var wag = sin(t * 3 + seed) * (L.tail === 'bushy' ? 5 : 8);
    if (L.tail === 'bushy') { c.save(); c.translate(-9, -11); c.rotate((-.6 + wag * .02)); ell(c, -3, -7, 5, 10, -.2); fillStroke(c, body, out); if (L.tip) { c.save(); ell(c, -3.6, -14, 3.2, 3.6, -.2); c.fillStyle = L.tip; c.fill(); c.restore(); } c.restore(); }
    else if (L.tail === 'puff') { ell(c, -11, -11 + wag * .1, 4.2, 4.2); fillStroke(c, '#fff', out); }
    else if (L.tail === 'thin') { c.lineWidth = 2; c.strokeStyle = shade(L.nose || body, .1); c.lineCap = 'round'; c.beginPath(); c.moveTo(-9, -6); c.quadraticCurveTo(-17, -4 + wag * .3, -16, -13 + wag * .4); c.stroke(); }
    // spikes (hedgehog)
    if (L.spikes) { c.fillStyle = L.spikes; c.strokeStyle = shade(L.spikes, -.35); c.lineWidth = .8; for (var i = 0; i < 11; i++) { var a = PI * .92 + i * (PI * .98 / 10) + sin(t * 2 + i) * .03; var bx = -1 + cos(a) * 11.5, by = -14 + sin(a) * 12.5; c.beginPath(); c.moveTo(bx - 2.6, by + 2); c.lineTo(bx + cos(a) * 6.4, by + sin(a) * 6.8); c.lineTo(bx + 2.6, by + 2); c.closePath(); c.fill(); c.stroke(); } }
    // feet
    c.fillStyle = shade(body, -.2); ell(c, -4 + legs, -1.4, 3.4, 2.2); c.fill(); ell(c, 5 - legs, -1.4, 3.4, 2.2); c.fill();
    // body
    c.save(); c.translate(0, bob * .4); c.scale(1 / sq, sq);
    ell(c, 0, -10.5, 11, 10.5); fillStroke(c, body, out);
    ell(c, 2, -8.5, 7, 7.5); c.fillStyle = belly; c.fill();
    if (L.gem) { c.fillStyle = L.gem; c.beginPath(); c.moveTo(-6, -17); c.lineTo(-3, -23); c.lineTo(0, -17); c.closePath(); c.fill(); c.beginPath(); c.moveTo(-1, -16); c.lineTo(2, -22); c.lineTo(5, -16); c.closePath(); c.fillStyle = shade(L.gem, .3); c.fill(); }
    // head
    var hx = 3, hy = -22;
    // ears (behind head)
    var ew = sin(t * 1.3 + seed * 2) * (((t + seed) % 7 > 6.6) ? .35 : .04);
    c.save(); c.translate(hx, hy);
    if (L.ears === 'long') { [[-3.5, -7, -.12 + ew], [3.5, -8, .18 + ew]].forEach(function (e) { c.save(); c.translate(e[0], e[1]); c.rotate(e[2]); ell(c, 0, -7, 3.2, 8.5); fillStroke(c, body, out); ell(c, 0, -7, 1.6, 6); c.fillStyle = shade(L.nose, .35); c.fill(); c.restore(); }); }
    else if (L.ears === 'point') { [[-5.5, -6, -.2 + ew], [4.5, -7, .15 + ew]].forEach(function (e) { c.save(); c.translate(e[0], e[1]); c.rotate(e[2]); c.beginPath(); c.moveTo(-3.8, 1); c.lineTo(0, -8.5); c.lineTo(3.8, 1); c.closePath(); fillStroke(c, body, out); c.fillStyle = shade(L.nose, .3); c.beginPath(); c.moveTo(-1.8, 0); c.lineTo(0, -5); c.lineTo(1.8, 0); c.closePath(); c.fill(); c.restore(); }); }
    else if (L.ears === 'tiny') { ell(c, -4.5, -8, 2.6, 2.6); fillStroke(c, body, out); ell(c, 5.5, -8.4, 2.6, 2.6); fillStroke(c, body, out); }
    else { ell(c, -5.2, -8, 4.4, 4.6); fillStroke(c, body, out); ell(c, -5.2, -8, 2.5, 2.7); c.fillStyle = shade(L.nose, .3); c.fill(); ell(c, 6, -8.4, 4.4, 4.6); fillStroke(c, body, out); ell(c, 6, -8.4, 2.5, 2.7); c.fillStyle = shade(L.nose, .3); c.fill(); }
    c.restore();
    ell(c, hx, hy, 10.5, 9.4); fillStroke(c, body, out);
    if (L.stripe) { c.save(); ell(c, hx, hy, 10.5, 9.4); c.clip(); c.fillStyle = L.stripe; rr(c, hx + 1, hy - 11, 4.5, 22, 2); c.fill(); rr(c, hx - 8, hy - 11, 4, 22, 2); c.fill(); c.restore(); ell(c, hx, hy, 10.5, 9.4); c.lineWidth = 1.2; c.strokeStyle = out; c.stroke(); }
    // muzzle + nose
    ell(c, hx + 6, hy + 3.4, 4.6, 3.4); c.fillStyle = belly; c.fill();
    ell(c, hx + 9.2, hy + 2, 1.7, 1.3); c.fillStyle = L.nose === body ? '#e58b8b' : L.nose; c.fill();
    c.lineWidth = .8; c.strokeStyle = shade(out, .1); c.beginPath(); c.moveTo(hx + 9, hy + 3); c.quadraticCurveTo(hx + 7.8, hy + 5.4, hx + 5.8, hy + 4.5); c.stroke();
    eyes(c, hx + .5, hy - 1.4, blink); blush(c, hx - 2.2, hy + 3.2);
    accessory(c, L, hx - .5, hy - 1.4, t);
    if (L.acc === 'scarf') { c.fillStyle = L.accColor; rr(c, hx - 8, hy + 6.5, 16, 4.4, 2.2); c.fill(); rr(c, hx - 8, hy + 8, 4.2, 8, 2); c.fill(); }
    c.restore();
  };

  ARCH.snail = function (c, L, t, seed, walk, bob, sq, blink) {
    var cr = sin(t * 1.5 + seed) * 1.2;
    // body slug
    c.beginPath(); c.moveTo(-14, -1); c.quadraticCurveTo(-15, -9, -6, -8); c.lineTo(8, -8); c.quadraticCurveTo(15, -8 - cr, 14, -17 - cr); c.quadraticCurveTo(12, -19, 10, -17); c.lineTo(11, -9); c.quadraticCurveTo(15, -1, 12, 0); c.closePath();
    fillStroke(c, L.body, shade(L.body, -.4));
    // eyestalks
    c.lineWidth = 1.4; c.strokeStyle = shade(L.body, -.25); c.beginPath(); c.moveTo(9, -16 - cr); c.lineTo(8 + sin(t * 2) * 1.2, -24 - cr); c.moveTo(13, -16 - cr); c.lineTo(15 + sin(t * 2 + 1) * 1.2, -24 - cr); c.stroke();
    c.fillStyle = '#2b1d1a'; if (!blink) { ell(c, 8 + sin(t * 2) * 1.2, -25 - cr, 1.7, 1.9); c.fill(); ell(c, 15 + sin(t * 2 + 1) * 1.2, -25 - cr, 1.7, 1.9); c.fill(); }
    blush(c, 11, -11);
    // shell
    c.save(); c.translate(-3, -15); c.rotate(sin(t * 1.5 + seed) * .03); ell(c, 0, 0, 13, 12.5); fillStroke(c, L.shell, shade(L.shell, -.4), 1.4);
    c.lineWidth = 2; c.strokeStyle = L.swirl; c.beginPath(); for (var i = 0; i < 40; i++) { var a = i * .35, r = 1 + i * .26; c.lineTo(cos(a) * r, sin(a) * r * .95); } c.stroke();
    c.fillStyle = 'rgba(255,255,255,.28)'; ell(c, -5, -6, 3, 1.8, -.6); c.fill(); c.restore();
    if (L.acc === 'flower') accessory(c, { acc: 'flower', accColor: L.accColor }, 6, -17, t);
  };

  ARCH.frog = function (c, L, t, seed, walk, bob, sq, blink) {
    var br = sin(t * 2.4 + seed) * .06;
    c.fillStyle = shade(L.body, -.2); ell(c, -8, -1.5, 5, 2.4); c.fill(); ell(c, 9, -1.5, 5, 2.4); c.fill();
    c.save(); c.translate(0, bob * .3); c.scale(1 + br, 1 - br);
    ell(c, 0, -10, 13.5, 10.5); fillStroke(c, L.body, shade(L.body, -.4));
    ell(c, 2, -7, 9, 6.5); c.fillStyle = L.belly; c.fill();
    // spots
    c.fillStyle = L.spot; [[-8, -14, 2.2], [-3, -17, 1.6], [-10, -9, 1.5]].forEach(function (s) { ell(c, s[0], s[1], s[2], s[2] * .8); c.fill(); });
    // eye bumps
    [[-1, -19], [9, -19]].forEach(function (p) { ell(c, p[0], p[1], 4.6, 4.6); fillStroke(c, L.body, shade(L.body, -.4)); if (blink) { c.strokeStyle = '#2b1d1a'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(p[0] - 2.4, p[1]); c.lineTo(p[0] + 2.4, p[1]); c.stroke(); } else { ell(c, p[0] + .6, p[1], 2.6, 3); c.fillStyle = '#fff'; c.fill(); ell(c, p[0] + 1, p[1] + .2, 1.5, 2); c.fillStyle = '#2b1d1a'; c.fill(); } });
    // smile + cheeks
    c.lineWidth = 1.1; c.strokeStyle = shade(L.body, -.5); c.beginPath(); c.moveTo(4, -8); c.quadraticCurveTo(10, -4.5, 15, -9); c.stroke(); blush(c, 3.5, -9.5); blush(c, 13.5, -10.5);
    if (L.acc && L.acc !== 'none') { var o = L.acc; if (o === 'towel') { rr(c, -3, -25.5, 16, 5.5, 2.8); fillStroke(c, '#fff', '#ccd8e0'); } else if (o === 'hat') { rr(c, -2, -31, 14, 7, 3); fillStroke(c, L.accColor, shade(L.accColor, -.35)); rr(c, -5, -25, 20, 3, 1.5); fillStroke(c, shade(L.accColor, .15), shade(L.accColor, -.35)); } else if (o === 'bow') { accessory(c, L, 6, -12, t); } }
    c.restore();
  };

  ARCH.beetle = function (c, L, t, seed, walk, bob, sq, blink) {
    var lg = sin(t * (walk ? 16 : 3) + seed) * 1.4;
    if (L.glow) { glow(c, 0, -10, 24 + sin(t * 2.2 + seed) * 3, L.glow, .45 + .2 * sin(t * 2.2 + seed)); }
    c.strokeStyle = shade(L.body, -.45); c.lineWidth = 1.6; c.lineCap = 'round';
    [-7, 0, 7].forEach(function (x, i) { var s = (i % 2 ? -1 : 1) * lg; c.beginPath(); c.moveTo(x, -5); c.lineTo(x + s - 2, -1); c.stroke(); });
    c.save(); c.translate(0, bob * .3);
    // head
    ell(c, 11, -11, 6.4, 6); fillStroke(c, shade(L.body, -.2), shade(L.body, -.5));
    // antennae
    c.beginPath(); c.moveTo(14, -16); c.quadraticCurveTo(18, -23 + sin(t * 3) * 1.4, 22, -21); c.moveTo(11, -16); c.quadraticCurveTo(12, -24, 17, -24 + sin(t * 3 + 1)); c.stroke();
    // dome shell
    c.beginPath(); c.moveTo(-15, -4); c.bezierCurveTo(-15, -26, 8, -26, 8, -4); c.closePath(); fillStroke(c, L.body, shade(L.body, -.45), 1.4);
    c.strokeStyle = shade(L.body, -.35); c.lineWidth = 1; c.beginPath(); c.moveTo(-3.5, -23); c.lineTo(-3.5, -4); c.stroke();
    c.fillStyle = L.spots; [[-9, -12, 2.4], [1, -13, 2.4], [-8, -19, 1.8], [-1, -20, 1.6]].forEach(function (s) { ell(c, s[0], s[1], s[2], s[2]); c.fill(); });
    c.fillStyle = 'rgba(255,255,255,.3)'; ell(c, -10, -20, 3, 1.5, -.7); c.fill();
    // face
    eyes(c, 9.2, -12.5, blink, .8); blush(c, 8, -9);
    if (L.acc === 'flower') accessory(c, { acc: 'flower', accColor: L.accColor }, 5, -9, t);
    c.restore();
  };

  ARCH.bee = function (c, L, t, seed, walk, bob, sq, blink) {
    var hov = sin(t * 2.6 + seed) * 2.5 - 8;
    c.save(); c.translate(0, hov);
    var fl = sin(t * 60 + seed) * .5 + .5;
    c.fillStyle = alpha(L.wing, .78); c.strokeStyle = 'rgba(120,150,190,.6)'; c.lineWidth = .8;
    [[-4, -13, -.5 - fl * .35], [3, -14, .1 + fl * .25]].forEach(function (w) { c.save(); c.translate(w[0], w[1]); c.rotate(w[2]); ell(c, 0, -7, 4.6, 8); c.fill(); c.stroke(); c.restore(); });
    // stinger
    c.fillStyle = '#3b2f2a'; c.beginPath(); c.moveTo(-12, -9); c.lineTo(-16, -8); c.lineTo(-12, -7); c.fill();
    // body
    ell(c, 0, -9, 12, 9); fillStroke(c, L.body, shade(L.body, -.5));
    c.save(); ell(c, 0, -9, 12, 9); c.clip(); c.fillStyle = L.stripe; rr(c, -7, -20, 4.2, 22, 1); c.fill(); rr(c, 0, -20, 4.2, 22, 1); c.fill(); c.restore();
    ell(c, 0, -9, 12, 9); c.lineWidth = 1.3; c.strokeStyle = shade(L.body, -.5); c.stroke();
    // head-ish face on the front
    ell(c, 8, -10.5, 5.4, 5.2); fillStroke(c, shade(L.body, .05), shade(L.body, -.5));
    c.lineWidth = 1.2; c.strokeStyle = '#3b2f2a'; c.beginPath(); c.moveTo(9, -16); c.quadraticCurveTo(10, -21, 14, -21 + sin(t * 4)); c.moveTo(6, -16); c.quadraticCurveTo(5, -21, 8, -22); c.stroke();
    eyes(c, 6.2, -11.5, blink, .72); blush(c, 5, -8);
    if (L.acc === 'crown') accessory(c, L, 3, -9, t); else if (L.acc === 'flower') accessory(c, L, 4, -9, t);
    c.restore();
    c.fillStyle = 'rgba(40,20,10,.12)'; ell(c, 0, 0, 8 - hov * .15, 2); c.fill();
  };

  ARCH.winged = function (c, L, t, seed, walk, bob, sq, blink) {
    var k = L.kind, out = shade(L.body, -.4);
    if (k === 'owl') {
      var wob = sin(t * 1.4 + seed) * .03;
      c.save(); c.translate(0, bob * .3); c.rotate(wob);
      ell(c, 0, -13, 11, 13.5); fillStroke(c, L.body, out);
      ell(c, 1, -10, 7, 9.5); c.fillStyle = L.belly; c.fill();
      // belly feather scallops
      c.strokeStyle = shade(L.belly, -.2); c.lineWidth = .8; for (var r = 0; r < 3; r++) for (var q = 0; q < 3; q++) { c.beginPath(); c.arc(-2 + q * 3.5 + (r % 2) * 1.7, -11 + r * 3.4, 1.7, 0, PI); c.stroke(); }
      // ear tufts
      c.fillStyle = L.body; c.beginPath(); c.moveTo(-8, -23); c.lineTo(-6, -31); c.lineTo(-2, -25); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(8, -23); c.lineTo(6, -31); c.lineTo(2, -25); c.closePath(); c.fill(); c.stroke();
      // wings
      ell(c, -9.5, -12, 3.8, 8.5, .2); fillStroke(c, L.wing, out); ell(c, 10.5, -12, 3.8, 8.5, -.2); fillStroke(c, L.wing, out);
      // eyes
      [[-4.2, -17.5], [4.8, -17.5]].forEach(function (p) { ell(c, p[0], p[1], 4.6, 4.6); fillStroke(c, '#fff6e8', out, 1); if (blink) { c.strokeStyle = '#2b1d1a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(p[0] - 2.4, p[1]); c.lineTo(p[0] + 2.4, p[1]); c.stroke(); } else { ell(c, p[0] + .7, p[1], 2.5, 2.9); c.fillStyle = '#2b1d1a'; c.fill(); ell(c, p[0] + 1.4, p[1] - 1, .9, 1); c.fillStyle = '#fff'; c.fill(); } });
      c.fillStyle = '#e8a43a'; c.beginPath(); c.moveTo(.2, -15.5); c.lineTo(5, -13.6); c.lineTo(.2, -11.4); c.closePath(); c.fill();
      if (L.acc === 'glasses') { c.strokeStyle = L.accColor; c.lineWidth = 1.2; c.beginPath(); c.arc(-4.2, -17.5, 5.6, 0, TAU); c.stroke(); c.beginPath(); c.arc(4.8, -17.5, 5.6, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(1.4, -17.5); c.lineTo(-.8, -17.5); c.stroke(); }
      if (L.acc === 'crown') { c.fillStyle = L.accColor; c.beginPath(); c.moveTo(-6, -26); c.lineTo(-6, -32); c.lineTo(-3, -28.5); c.lineTo(0, -33.5); c.lineTo(3, -28.5); c.lineTo(6, -32); c.lineTo(6, -26); c.closePath(); c.fill(); c.strokeStyle = shade(L.accColor, -.4); c.stroke(); glow(c, 0, -30, 12, '#ffffff', .25 + .15 * sin(t * 3)); }
      c.restore();
      c.fillStyle = '#e8a43a'; ell(c, -3.5, -1, 2.6, 1.6); c.fill(); ell(c, 4.5, -1, 2.6, 1.6); c.fill();
      return;
    }
    var flap = sin(t * (k === 'bat' ? 9 : 5) + seed), hov = k === 'bat' ? -10 : -12;
    c.save(); c.translate(0, hov + sin(t * 2 + seed) * 2.5);
    if (k === 'bat') {
      [-1, 1].forEach(function (d) { c.save(); c.translate(d * 4, -6); c.rotate(d * (.15 + flap * .5)); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(d * 10, -14, d * 22, -6); c.lineTo(d * 18, -3); c.lineTo(d * 15, -5); c.lineTo(d * 11, -1); c.lineTo(d * 7, -3); c.closePath(); fillStroke(c, L.wing, out); c.restore(); });
      ell(c, 0, -7, 7.6, 8.5); fillStroke(c, L.body, out); ell(c, 1, -5, 4.5, 5.5); c.fillStyle = L.belly; c.fill();
      c.fillStyle = L.body; c.beginPath(); c.moveTo(-5, -13); c.lineTo(-4, -20); c.lineTo(-1, -14); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(5, -13); c.lineTo(4, -20); c.lineTo(1, -14); c.closePath(); c.fill(); c.stroke();
      eyes(c, -2.4, -9.6, blink, .8); blush(c, -4, -6);
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-1, -3.6); c.lineTo(0, -1.5); c.lineTo(1, -3.6); c.fill();
    } else { // moth
      [-1, 1].forEach(function (d) { c.save(); c.translate(d * 3, -9); c.rotate(d * (.1 + flap * .32)); ell(c, d * 11, -5, 12, 9.5, d * -.3); fillStroke(c, alpha(L.wing, .92), shade(L.wing, -.35)); ell(c, d * 9, 3.5, 8, 6.5, d * .3); fillStroke(c, alpha(shade(L.wing, .12), .9), shade(L.wing, -.35)); c.fillStyle = 'rgba(255,255,255,.55)'; ell(c, d * 12, -6, 3.2, 3.2); c.fill(); ell(c, d * 9, 3, 2, 2); c.fill(); c.restore(); });
      ell(c, 0, -8, 5, 9); fillStroke(c, L.body, shade(L.body, -.4)); ell(c, 0, -3, 3.4, 5); c.fillStyle = L.belly; c.fill();
      ell(c, 1.5, -18, 5.2, 4.8); fillStroke(c, L.body, shade(L.body, -.4));
      c.strokeStyle = shade(L.body, -.45); c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, -22); c.quadraticCurveTo(-4, -28 + sin(t * 3), -8, -27); c.moveTo(4, -22); c.quadraticCurveTo(7, -29, 12, -27 + sin(t * 3 + 1)); c.stroke();
      eyes(c, -.4, -18.2, blink, .7); blush(c, 0, -15);
    }
    c.restore();
    c.fillStyle = 'rgba(40,20,10,.1)'; ell(c, 0, 0, 7, 1.8); c.fill();
  };

  // =====================================================================================================
  //  ROOMS (cell local coords: 90 x 88) ------------------------------------------------------------------
  // =====================================================================================================
  var CW = 90, CH = 88;
  var ROOM_THEME = {
    farm:    { wall: '#6b5a4a', wall2: '#5a4a3c', floor: '#4d3a2c', accent: '#d9534f' },
    bakery:  { wall: '#d9a870', wall2: '#c8935a', floor: '#8a5a38', accent: '#f4c97a' },
    library: { wall: '#6e4f3a', wall2: '#5d4130', floor: '#4a3226', accent: '#e8c06a' },
    spring:  { wall: '#5f6f78', wall2: '#516069', floor: '#44505a', accent: '#8fd3e8' },
    tea:     { wall: '#c8a39a', wall2: '#b58d85', floor: '#7a5a50', accent: '#f0d9a6' },
    honey:   { wall: '#c98f2c', wall2: '#b87d20', floor: '#7a5018', accent: '#ffd45a' },
    yarn:    { wall: '#b78aa8', wall2: '#a47895', floor: '#6e4a62', accent: '#ff9aa8' },
    glow:    { wall: '#2f3a5c', wall2: '#262f4d', floor: '#1d243f', accent: '#8ff0ff' },
    music:   { wall: '#8a5a6e', wall2: '#774a5c', floor: '#4e2f3c', accent: '#ffd0a0' },
    loft:    { wall: '#232a52', wall2: '#1b2142', floor: '#151a35', accent: '#fff3a8' }
  };
  function wallBase(c, th, w, h, pattern, t) {
    var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, th.wall); g.addColorStop(1, th.wall2); c.fillStyle = g; c.fillRect(0, 0, w, h);
    if (pattern === 'stripes') { c.fillStyle = 'rgba(255,255,255,.07)'; for (var x = 4; x < w; x += 12) c.fillRect(x, 0, 5, h); }
    else if (pattern === 'dots') { c.fillStyle = 'rgba(255,255,255,.08)'; for (var y = 8; y < h; y += 14) for (var x2 = 6 + ((y / 14) % 2) * 7; x2 < w; x2 += 14) { c.beginPath(); c.arc(x2, y, 1.8, 0, TAU); c.fill(); } }
    else if (pattern === 'bricks') { c.strokeStyle = 'rgba(80,40,20,.18)'; c.lineWidth = 1; for (var by = 0; by < h; by += 9) { c.beginPath(); c.moveTo(0, by); c.lineTo(w, by); c.stroke(); for (var bx = (by / 9 % 2) * 8; bx < w; bx += 16) { c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by + 9); c.stroke(); } } }
    // floor
    c.fillStyle = th.floor; c.fillRect(0, h - 12, w, 12); c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(0, h - 12, w, 1.5);
  }
  var ROOMART = {};
  ROOMART.farm = function (c, t, w, h) {
    var th = ROOM_THEME.farm; wallBase(c, th, w, h, 'dots');
    // hanging root + lamp
    c.strokeStyle = '#3d2c20'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(18, 0); c.quadraticCurveTo(21, 8, 17, 14); c.stroke(); c.beginPath(); c.moveTo(70, 0); c.quadraticCurveTo(66, 10, 71, 17); c.stroke();
    function shroom(x, y, s, col, ph) { var b = 1 + sin(t * 1.6 + ph) * .04; c.save(); c.translate(x, y); c.scale(s * b, s * b); rr(c, -2.4, -9, 4.8, 9, 2); fillStroke(c, '#f5ead8', '#b9a98c', .8); c.beginPath(); c.ellipse(0, -9, 8, 6.6, 0, PI, 0); c.closePath(); fillStroke(c, col, shade(col, -.4), .9); c.fillStyle = 'rgba(255,255,255,.85)'; [[-3.5, -11, 1.3], [2.5, -12.5, 1.1], [0, -9.6, .9]].forEach(function (p) { ell(c, p[0], p[1], p[2], p[2]); c.fill(); }); c.restore(); }
    shroom(20, h - 12, 1.15, '#d9534f', 0); shroom(34, h - 12, .8, '#e8934a', 1.1); shroom(64, h - 12, 1.3, '#c9575f', 2.2); shroom(77, h - 12, .75, '#d9a04a', .6); shroom(48, h - 12, .6, '#e06a7a', 1.6);
    // glow caps on wall
    c.fillStyle = 'rgba(255,255,200,.55)'; for (var i = 0; i < 5; i++) { var a = .45 + .35 * sin(t * 1.2 + i * 1.7); glow(c, 12 + i * 17, 14 + (i % 2) * 8, 9, '#fff3a0', a * .45); c.fillStyle = 'rgba(255,248,190,' + (.4 + a * .5) + ')'; ell(c, 12 + i * 17, 14 + (i % 2) * 8, 1.6, 1.6); c.fill(); }
    // spores
    c.fillStyle = 'rgba(255,255,230,.55)'; for (var j = 0; j < 7; j++) { var ph = (t * .12 + hash(j) * 3) % 1; ell(c, 8 + hash(j + 4) * (w - 16) + sin(t + j) * 3, h - 14 - ph * (h - 28), 1, 1); c.fill(); }
  };
  ROOMART.bakery = function (c, t, w, h) {
    var th = ROOM_THEME.bakery; wallBase(c, th, w, h, 'bricks');
    // oven
    rr(c, 54, h - 46, 30, 34, 6); fillStroke(c, '#8d4f35', '#5a2f20'); c.beginPath(); c.arc(69, h - 28, 9, PI, 0); c.lineTo(78, h - 12); c.lineTo(60, h - 12); c.closePath(); c.fillStyle = '#2b1710'; c.fill();
    var fl = .55 + .25 * sin(t * 9) + .1 * sin(t * 15); glow(c, 69, h - 22, 20, '#ff9a3a', fl * .85); c.fillStyle = '#ffb347'; c.beginPath(); c.moveTo(63, h - 12); c.quadraticCurveTo(66, h - 24 - fl * 4, 69, h - 14); c.quadraticCurveTo(72, h - 26 - fl * 3, 75, h - 12); c.closePath(); c.fill();
    c.fillStyle = '#c0553a'; rr(c, 52, h - 49, 34, 5, 2); c.fill(); rr(c, 74, h - 62, 7, 15, 2); fillStroke(c, '#8d4f35', '#5a2f20');
    // smoke
    for (var s = 0; s < 3; s++) { var p = (t * .22 + s / 3) % 1; c.fillStyle = 'rgba(255,255,255,' + (.35 * (1 - p)) + ')'; ell(c, 77 + sin(p * 6 + s) * 3, h - 64 - p * 22, 3 + p * 4, 3 + p * 4); c.fill(); }
    // shelf with loaves
    c.fillStyle = '#6a4326'; rr(c, 6, 30, 38, 3.5, 1); c.fill();
    [[10, '#e0a35a'], [21, '#d99445'], [32, '#e8b56a']].forEach(function (b, i) { var bb = 1 + sin(t * 1.5 + i) * .015; c.save(); c.translate(b[0] + 5, 30); c.scale(bb, bb); ell(c, 0, -4.5, 6.4, 4.6); fillStroke(c, b[1], shade(b[1], -.35), .9); c.strokeStyle = shade(b[1], -.3); c.lineWidth = .8; for (var k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(k * 2.6 - 1, -7); c.lineTo(k * 2.6 + 1, -2.5); c.stroke(); } c.restore(); });
    // table + rolling pin + flour
    c.fillStyle = '#7a4d2a'; rr(c, 6, h - 27, 40, 5, 2); c.fill(); c.fillRect(10, h - 22, 4, 10); c.fillRect(38, h - 22, 4, 10);
    c.fillStyle = '#f4ead4'; ell(c, 20, h - 28, 8, 3); c.fill(); rr(c, 28, h - 31, 14, 4.5, 2.2); fillStroke(c, '#d9b27c', '#8a5a30', .8);
    c.fillStyle = '#fff'; for (var f = 0; f < 4; f++) { var q = (t * .3 + f * .25) % 1; c.globalAlpha = (1 - q) * .8; ell(c, 14 + f * 6, h - 30 + q * 14, .9, .9); c.fill(); } c.globalAlpha = 1;
  };
  ROOMART.library = function (c, t, w, h) {
    var th = ROOM_THEME.library; wallBase(c, th, w, h, 'stripes');
    // shelves
    var cols = ['#c0504d', '#4f81bd', '#e8b84a', '#6aa86a', '#9b6fb5', '#d98a4a', '#5aa5b0'];
    for (var r = 0; r < 3; r++) { var y = 16 + r * 20; c.fillStyle = '#3d2a1c'; rr(c, 4, y + 14, 82, 3.5, 1); c.fill(); var x = 7; for (var i = 0; i < 12; i++) { var bw = 4 + hash(i + r * 9) * 3, bh = 10 + hash(i * 3 + r) * 4; c.fillStyle = cols[(i + r * 3) % cols.length]; rr(c, x, y + 14 - bh, bw, bh, 1); c.fill(); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x + 1, y + 14 - bh + 2, bw - 2, 1); x += bw + 1; if (x > 80) break; } }
    // lamp
    var fl = .85 + sin(t * 3) * .05; glow(c, 70, h - 36, 26, '#ffd98a', .5 * fl); c.fillStyle = '#4d3a2a'; c.fillRect(69, h - 30, 2, 18); ell(c, 70, h - 33, 7, 4); fillStroke(c, '#e8b84a', '#7a5a18', .9);
    // reading armchair
    rr(c, 8, h - 30, 22, 18, 5); fillStroke(c, '#9a4b4b', '#5c2a2a'); rr(c, 4, h - 25, 8, 13, 4); fillStroke(c, '#aa5a5a', '#5c2a2a');
    // floating motes + page flutter
    c.fillStyle = 'rgba(255,240,200,.6)'; for (var m = 0; m < 6; m++) { var p = (t * .08 + hash(m) * 2) % 1; ell(c, 20 + hash(m + 2) * 55 + sin(t * .7 + m) * 4, 20 + p * 50, .9, .9); c.fill(); }
  };
  ROOMART.spring = function (c, t, w, h) {
    var th = ROOM_THEME.spring; wallBase(c, th, w, h, 'dots');
    // pool
    var pg = c.createLinearGradient(0, h - 30, 0, h - 8); pg.addColorStop(0, '#9fe6f0'); pg.addColorStop(1, '#4fb0cc');
    rr(c, 8, h - 28, 74, 18, 9); fillStroke(c, pg, '#37707f', 1.2);
    c.save(); rr(c, 8, h - 28, 74, 18, 9); c.clip(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1; for (var i = 0; i < 4; i++) { var y = h - 24 + i * 4; c.beginPath(); for (var x = 8; x <= 82; x += 4) c.lineTo(x, y + sin(x * .25 + t * 2 + i) * 1.2); c.stroke(); } c.restore();
    // rocks
    [[10, h - 14, 8, 7, '#7d8a90'], [76, h - 14, 9, 8, '#6e7b82'], [22, h - 11, 6, 4, '#8a979d'], [64, h - 11, 6, 4, '#7d8a90']].forEach(function (r) { ell(c, r[0], r[1], r[2], r[3]); fillStroke(c, r[4], shade(r[4], -.4), .9); });
    // steam
    for (var s = 0; s < 5; s++) { var p = (t * .18 + s / 5) % 1; c.fillStyle = 'rgba(255,255,255,' + (.4 * (1 - p)) + ')'; ell(c, 18 + s * 14 + sin(p * 5 + s * 2) * 4, h - 30 - p * 40, 4 + p * 5, 5 + p * 5); c.fill(); }
    // little lantern + bamboo ladle
    c.strokeStyle = '#8a6a3a'; c.lineWidth = 2; c.beginPath(); c.moveTo(80, h - 38); c.lineTo(72, h - 56); c.stroke(); ell(c, 71, h - 57, 3.5, 2.4); fillStroke(c, '#c9a05a', '#7a5a2a', .8);
    glow(c, 14, 18, 14, '#ffd98a', .5); rr(c, 10, 12, 8, 10, 3); fillStroke(c, '#f4c870', '#8a5a20', .8);
  };
  ROOMART.tea = function (c, t, w, h) {
    var th = ROOM_THEME.tea; wallBase(c, th, w, h, 'stripes');
    // window w/ moon
    rr(c, 54, 10, 26, 26, 13); fillStroke(c, '#26305c', '#5a3a30', 2); c.fillStyle = '#f7efc0'; c.beginPath(); c.arc(68, 24, 5, 0, TAU); c.fill(); c.fillStyle = '#26305c'; c.beginPath(); c.arc(70, 22, 4.4, 0, TAU); c.fill(); c.fillStyle = '#fff'; [[60, 17], [74, 29], [62, 30]].forEach(function (s, i) { c.globalAlpha = .5 + .5 * sin(t * 2 + i); c.fillRect(s[0], s[1], 1.4, 1.4); }); c.globalAlpha = 1;
    // round lantern
    var sw = sin(t * 1.2) * 1.5; c.strokeStyle = '#5a3a2a'; c.lineWidth = 1; c.beginPath(); c.moveTo(24, 0); c.lineTo(24 + sw * .3, 12); c.stroke(); glow(c, 24 + sw * .3, 18, 17, '#ffb070', .55); ell(c, 24 + sw * .3, 18, 7, 7.5); fillStroke(c, '#f0805a', '#8a3a28', 1);
    // low table, tea pot, cups
    rr(c, 14, h - 25, 44, 5, 2); fillStroke(c, '#6a4326', '#3d2616', .8); c.fillStyle = '#4d311c'; c.fillRect(20, h - 21, 4, 9); c.fillRect(48, h - 21, 4, 9);
    ell(c, 30, h - 31, 8, 6.5); fillStroke(c, '#7fb6a8', '#3f7a6a', 1); rr(c, 35, h - 34, 7, 2.5, 1.2); c.fillStyle = '#7fb6a8'; c.fill(); rr(c, 26, h - 40, 8, 3, 1.5); fillStroke(c, '#5f9a8c', '#3f7a6a', .8);
    [[46, '#f4e8d0'], [52, '#e8b0b0']].forEach(function (cu) { rr(c, cu[0] - 3, h - 30, 6, 5, 2); fillStroke(c, cu[1], shade(cu[1], -.4), .8); });
    for (var s = 0; s < 3; s++) { var p = (t * .3 + s / 3) % 1; c.fillStyle = 'rgba(255,255,255,' + (.5 * (1 - p)) + ')'; ell(c, 38 + sin(p * 7 + s) * 3, h - 42 - p * 18, 2 + p * 3, 2 + p * 3.4); c.fill(); }
    // cushions
    ell(c, 10, h - 14, 8, 4); fillStroke(c, '#c9575f', '#7a2f35', .8); ell(c, 66, h - 14, 8, 4); fillStroke(c, '#5f8fc9', '#2f527a', .8);
  };
  ROOMART.honey = function (c, t, w, h) {
    var th = ROOM_THEME.honey; wallBase(c, th, w, h);
    // hex comb pattern
    c.strokeStyle = 'rgba(120,60,0,.25)'; c.lineWidth = 1.2; for (var y = -4; y < h; y += 10) for (var x = (Math.round(y / 10) % 2) * 9 - 9; x < w + 9; x += 18) { c.beginPath(); for (var k = 0; k < 6; k++) { var a = k * PI / 3 + PI / 6; c.lineTo(x + cos(a) * 6.2, y + sin(a) * 6.2); } c.closePath(); c.stroke(); }
    // honey drip from top
    c.fillStyle = '#ffc93a'; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0); c.lineTo(w, 6); for (var d = w; d > 0; d -= 14) { c.quadraticCurveTo(d - 3, 6 + 5 * hash(d), d - 7, 6); c.quadraticCurveTo(d - 10, 14 + 6 * hash(d + 3) + sin(t + d) * 1.4, d - 12, 6); } c.lineTo(0, 6); c.closePath(); c.fill();
    var dp = (t * .5) % 1; c.fillStyle = '#ffc93a'; ell(c, 38, 12 + dp * (h - 36), 1.5, 2.2 + dp); c.fill();
    // jars shelf
    c.fillStyle = '#5a3a10'; rr(c, 4, h - 40, 52, 3.5, 1); c.fill();
    [8, 22, 36].forEach(function (x, i) { rr(c, x, h - 56, 11, 16, 4); fillStroke(c, '#ffb81c', '#8a5a00', .9); c.fillStyle = 'rgba(255,255,255,.35)'; rr(c, x + 2, h - 53, 2, 9, 1); c.fill(); rr(c, x + 1.5, h - 58, 8, 3, 1.5); fillStroke(c, '#c9a05a', '#7a5a2a', .7); if ((t * .7 + i) % 3 < .6) { c.fillStyle = '#fff6c0'; star(c, x + 8, h - 49, 2, 4, .3); c.fill(); } });
    // big barrel
    ell(c, 70, h - 22, 13, 10); fillStroke(c, '#b9792a', '#6a3a10'); c.strokeStyle = '#6a3a10'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(58, h - 24); c.quadraticCurveTo(70, h - 20, 82, h - 24); c.moveTo(58, h - 18); c.quadraticCurveTo(70, h - 14, 82, h - 18); c.stroke(); c.fillStyle = '#ffc93a'; ell(c, 70, h - 32, 8, 2.4); c.fill();
  };
  ROOMART.yarn = function (c, t, w, h) {
    var th = ROOM_THEME.yarn; wallBase(c, th, w, h, 'dots');
    // bunting of knitted flags
    c.strokeStyle = '#6e4a62'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 8); c.quadraticCurveTo(45, 24, 90, 8); c.stroke();
    ['#ff7a8a', '#ffd45a', '#7fd0a8', '#7aa8f0', '#c58ae0'].forEach(function (col, i) { var x = 10 + i * 17, y = 8 + sin(i / 4 * PI) * 10, s = sin(t * 1.6 + i) * 1.2; c.fillStyle = col; c.beginPath(); c.moveTo(x - 5, y); c.lineTo(x + 5, y); c.lineTo(x + s, y + 11); c.closePath(); c.fill(); });
    // yarn balls on the floor, one rolling slightly
    [[16, '#ff7a8a', 8], [34, '#7fd0a8', 6.5], [74, '#ffd45a', 7.5], [60, '#7aa8f0', 5.5]].forEach(function (b, i) { var rx = b[0] + (i === 1 ? sin(t * .8) * 4 : 0); c.save(); c.translate(rx, h - 12 - b[2] * .6); c.rotate(i === 1 ? sin(t * .8) * .8 : 0); ell(c, 0, 0, b[2], b[2]); fillStroke(c, b[1], shade(b[1], -.35), 1); c.strokeStyle = shade(b[1], -.25); c.lineWidth = .9; for (var k = -1; k <= 1; k++) { c.beginPath(); c.arc(0, 0, b[2] * (.55 + k * .22), -.5 + k * .3, 1.8 + k * .3); c.stroke(); } c.restore(); });
    // rocking chair
    c.save(); c.translate(48, h - 12); c.rotate(sin(t * 1.3) * .05); c.strokeStyle = '#7a4d2a'; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(-12, 0); c.quadraticCurveTo(0, 5, 12, 0); c.moveTo(-8, -1); c.lineTo(-8, -14); c.moveTo(-9, -26); c.lineTo(-8, -14); c.lineTo(8, -14); c.lineTo(9, -1); c.stroke(); c.fillStyle = '#e8a0b0'; rr(c, -9, -16, 18, 4, 2); c.fill(); rr(c, -12, -28, 6, 12, 3); c.fill(); c.restore();
    // hanging skein
    c.strokeStyle = '#6e4a62'; c.beginPath(); c.moveTo(80, 0); c.lineTo(80, 16); c.stroke(); ell(c, 80, 22, 5, 7); fillStroke(c, '#ff9a5a', '#a0502a', .9);
  };
  ROOMART.glow = function (c, t, w, h) {
    var th = ROOM_THEME.glow; wallBase(c, th, w, h);
    function crystal(x, y, s, col, ph, rot) { var p = .55 + .45 * sin(t * 1.8 + ph); glow(c, x, y - s * 9, s * 22, col, .35 * p + .1); c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(s, s); c.beginPath(); c.moveTo(-5, 0); c.lineTo(-4, -16); c.lineTo(0, -24); c.lineTo(4, -16); c.lineTo(5, 0); c.closePath(); fillStroke(c, mixc(col, '#ffffff', .15 + .25 * p), shade(col, -.4), 1 / s); c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.moveTo(-2.5, -3); c.lineTo(-2, -15); c.lineTo(0, -19); c.lineTo(-.5, -3); c.fill(); c.restore(); }
    crystal(18, h - 11, 1.2, '#7ef0ff', 0, -.15); crystal(30, h - 11, .8, '#ff8ae0', 1.2, .2); crystal(72, h - 11, 1.35, '#a0ffb0', 2.1, .1); crystal(60, h - 11, .75, '#7ef0ff', .7, -.2); crystal(46, h - 11, .55, '#ffd48a', 3);
    // ceiling stalactites
    c.fillStyle = '#3a4670'; for (var i = 0; i < 6; i++) { var x = 6 + i * 15; c.beginPath(); c.moveTo(x - 4, 0); c.lineTo(x, 8 + hash(i) * 10); c.lineTo(x + 4, 0); c.fill(); }
    // twinkles
    for (var s = 0; s < 8; s++) { var a = (sin(t * 2 + s * 2.3) + 1) / 2; c.fillStyle = 'rgba(200,255,255,' + a * .9 + ')'; star(c, 8 + hash(s) * 74, 12 + hash(s + 9) * 50, 1.8 * a + .4, 4, .3); c.fill(); }
  };
  ROOMART.music = function (c, t, w, h) {
    var th = ROOM_THEME.music; wallBase(c, th, w, h, 'stripes');
    // stage
    rr(c, 4, h - 20, 82, 8, 2); fillStroke(c, '#a06a3a', '#5a3a1a', .9);
    // curtains
    [0, 1].forEach(function (d) { var x = d ? 66 : 0; c.fillStyle = '#c9575f'; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 24, 0); c.quadraticCurveTo(x + (d ? 6 : 18), 30, x + (d ? 12 : 24), h - 20); c.lineTo(x, h - 20); c.closePath(); c.fill(); c.strokeStyle = 'rgba(80,0,0,.25)'; c.lineWidth = 1; for (var k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x + k * 6, 0); c.quadraticCurveTo(x + k * 6 + 2, 30, x + k * 6, h - 20); c.stroke(); } });
    c.fillStyle = '#e8b84a'; rr(c, 0, 0, w, 5, 2); c.fill();
    // piano
    rr(c, 30, h - 40, 30, 18, 3); fillStroke(c, '#3d2a38', '#1d121a'); c.fillStyle = '#f7f0e0'; rr(c, 31, h - 30, 28, 7, 1); c.fill(); c.fillStyle = '#2a1a22'; for (var k = 0; k < 6; k++) c.fillRect(34 + k * 4.3, h - 30, 2.4, 4);
    var key = Math.floor(t * 3) % 6; c.fillStyle = '#ffd0a0'; c.fillRect(33 + key * 4.3, h - 29, 3.4, 6);
    // floating notes
    for (var n = 0; n < 4; n++) { var p = (t * .22 + n / 4) % 1; c.globalAlpha = 1 - p; c.fillStyle = ['#ffd0a0', '#ff9aa8', '#9fe0ff', '#c8f0a0'][n]; var nx = 34 + n * 8 + sin(p * 5 + n) * 5, ny = h - 44 - p * 30; ell(c, nx, ny, 2.4, 1.8, -.4); c.fill(); c.fillRect(nx + 1.7, ny - 8, 1, 8); c.beginPath(); c.moveTo(nx + 2.5, ny - 8); c.quadraticCurveTo(nx + 6, ny - 6, nx + 4.5, ny - 3); c.lineWidth = 1; c.strokeStyle = c.fillStyle; c.stroke(); } c.globalAlpha = 1;
  };
  ROOMART.loft = function (c, t, w, h) {
    var th = ROOM_THEME.loft; var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0d1230'); g.addColorStop(1, '#2a2f64'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    // skylight stars
    for (var i = 0; i < 26; i++) { var a = (sin(t * (1 + hash(i)) + i * 3) + 1) / 2; c.fillStyle = 'rgba(255,248,200,' + (.25 + .75 * a) + ')'; var s = .6 + hash(i + 5) * 1.3; c.fillRect(4 + hash(i) * 82, 3 + hash(i + 1) * 46, s, s); }
    // crescent moon
    c.fillStyle = '#fff3c8'; c.beginPath(); c.arc(68, 20, 8, 0, TAU); c.fill(); c.fillStyle = '#16204a'; c.beginPath(); c.arc(72, 17, 7.4, 0, TAU); c.fill(); glow(c, 68, 20, 22, '#fff3c8', .22);
    // shooting star
    var p = (t * .15) % 1; if (p < .25) { var q = p / .25; c.strokeStyle = 'rgba(255,255,255,' + (1 - q) + ')'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(10 + q * 40, 6 + q * 18); c.lineTo(2 + q * 40, 2 + q * 18); c.stroke(); }
    // telescope
    c.strokeStyle = '#8a6a3a'; c.lineWidth = 2; c.beginPath(); c.moveTo(24, h - 12); c.lineTo(30, h - 28); c.moveTo(36, h - 12); c.lineTo(30, h - 28); c.stroke(); c.save(); c.translate(30, h - 28); c.rotate(-.7); rr(c, -4, -24, 8, 28, 3); fillStroke(c, '#c9a05a', '#6a4a1a', .9); rr(c, -5.5, -28, 11, 6, 2); fillStroke(c, '#e8c070', '#6a4a1a', .9); c.restore();
    // floor + beanbag
    c.fillStyle = th.floor; c.fillRect(0, h - 12, w, 12); c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(0, h - 12, w, 1.5);
    ell(c, 62, h - 17, 13, 8); fillStroke(c, '#7a6ac9', '#3f357a'); ell(c, 64, h - 19, 8, 4); c.fillStyle = 'rgba(255,255,255,.14)'; c.fill();
  };

  // empty dug room: a cosy tunnel chamber
  function drawEmptyCell(c, t, w, h, pulse) {
    var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#6a4a3a'); g.addColorStop(1, '#4a3228'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#3a2820'; c.fillRect(0, h - 10, w, 10); c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(0, h - 10, w, 1.4);
    c.strokeStyle = 'rgba(60,35,20,.5)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(14, 0); c.quadraticCurveTo(18, 8, 13, 15); c.moveTo(72, 0); c.quadraticCurveTo(68, 9, 74, 18); c.stroke();
    // tiny lamp
    var f = .8 + sin(t * 4 + 1) * .08; glow(c, 45, 14, 20, '#ffd48a', .38 * f); ell(c, 45, 12, 3, 3.6); fillStroke(c, '#ffe9a8', '#a07a2a', .8);
    if (pulse) { c.globalAlpha = .55 + .35 * sin(t * 3); c.fillStyle = '#fff6d8'; c.font = '700 11px Fredoka,sans-serif'; c.textAlign = 'center'; c.fillText('+ build', w / 2, h / 2 + 6); c.globalAlpha = 1; }
  }
  function drawFoyer(c, t, w, h) {
    drawEmptyCell(c, t, w, h, false);
    // welcome mat + coat hooks + hearth
    ell(c, 45, h - 10, 20, 3.4); fillStroke(c, '#c9575f', '#7a2f35', .8); c.fillStyle = '#e8d5a0'; c.fillRect(30, h - 11, 30, 1.4);
    rr(c, 62, h - 44, 20, 34, 4); fillStroke(c, '#7a7a82', '#44444c'); c.fillStyle = '#1e1410'; rr(c, 65, h - 30, 14, 20, 6); c.fill(); var f = .6 + .2 * sin(t * 8); glow(c, 72, h - 18, 14, '#ff9a3a', f); c.fillStyle = '#ffb347'; c.beginPath(); c.moveTo(68, h - 10); c.quadraticCurveTo(70, h - 22 - f * 4, 72, h - 13); c.quadraticCurveTo(74, h - 20 - f * 3, 76, h - 10); c.fill();
    c.strokeStyle = '#5a3a2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(10, 22); c.lineTo(10, 40); c.stroke(); c.fillStyle = '#d9534f'; c.beginPath(); c.arc(10, 42, 4, 0, TAU); c.fill();
  }
  function drawRoom(c, roomId, t, w, h) { c.save(); rr(c, 0, 0, w, h, 0); c.clip(); (ROOMART[roomId] || drawEmptyCell)(c, t, w, h); c.restore(); }

  // =====================================================================================================
  //  SURFACE
  // =====================================================================================================
  var SKY = [ // hour, top, bottom
    [0, '#14183f', '#2a3170'], [5, '#2a3170', '#7a5f9a'], [7, '#8ac7ee', '#fde3c0'], [12, '#7ec8f0', '#e6f6ff'], [17, '#8ac4ee', '#fdeccc'],
    [19, '#d97a6a', '#fbc07a'], [21, '#3a3a82', '#8a5f9a'], [24, '#14183f', '#2a3170']
  ];
  function skyColors(h) {
    for (var i = 0; i < SKY.length - 1; i++) if (h >= SKY[i][0] && h <= SKY[i + 1][0]) { var a = SKY[i], b = SKY[i + 1], k = (h - a[0]) / (b[0] - a[0]); return [mixc(a[1], b[1], k), mixc(a[2], b[2], k)]; }
    return [SKY[0][1], SKY[0][2]];
  }
  function nightness(h) { if (h < 5 || h > 21) return 1; if (h < 7) return 1 - (h - 5) / 2; if (h > 19) return (h - 19) / 2; return 0; }
  function mixRaw(a, b, t) { return mixc(a, b, t); }

  var SEASON = {
    spring: { grass: '#8fcf6a', grass2: '#74b857', leaf: '#f4b6c8', leaf2: '#f8cfd9', hill: '#9ad875' },
    summer: { grass: '#78c456', grass2: '#5fae42', leaf: '#4fa84a', leaf2: '#64bf5a', hill: '#85cf62' },
    autumn: { grass: '#c2b04a', grass2: '#a89a3a', leaf: '#e0803a', leaf2: '#e8a64a', hill: '#c9b857' },
    winter: { grass: '#e8f1f7', grass2: '#cfe0ec', leaf: null, leaf2: null, hill: '#f4f8fb' }
  };

  /** Draws sky + hills + tree + door area in world coords 0..W x 0..GROUND. Returns nothing. */
  function drawSurface(c, W, GROUND, st) {
    var t = st.t, hour = st.hour, S = SEASON[st.season] || SEASON.autumn, night = nightness(hour);
    var sk = skyColors(hour), g = c.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, sk[0]); g.addColorStop(1, sk[1]); c.fillStyle = g; c.fillRect(0, -200, W, GROUND + 200);
    // stars
    if (night > .02) { for (var i = 0; i < 40; i++) { var a = (sin(t * (.8 + hash(i)) + i) + 1) / 2; c.fillStyle = 'rgba(255,250,220,' + night * (.3 + .7 * a) + ')'; var s = .8 + hash(i + 7) * 1.4; c.fillRect(hash(i) * W, hash(i + 3) * GROUND * .7, s, s); } }
    // sun / moon
    var sunA = (hour - 6) / 12 * PI; if (hour > 5.5 && hour < 18.5) { var sx = W * .1 + (W * .8) * ((hour - 6) / 12), sy = GROUND * .62 - sin(sunA) * GROUND * .5; glow(c, sx, sy, 60, '#fff3b0', .55); c.fillStyle = '#fff1a0'; c.beginPath(); c.arc(sx, sy, 17, 0, TAU); c.fill(); c.fillStyle = '#ffe070'; c.beginPath(); c.arc(sx, sy, 13, 0, TAU); c.fill(); }
    if (night > .1) { var mx = W * .78, my = 52; c.globalAlpha = Math.min(1, night * 1.4); glow(c, mx, my, 56, '#e8f0ff', .35); c.fillStyle = '#fff6d8'; c.beginPath(); c.arc(mx, my, 16, 0, TAU); c.fill(); c.fillStyle = 'rgba(200,190,160,.5)'; [[-5, -4, 3], [4, 3, 2.4], [-2, 7, 1.8]].forEach(function (k) { c.beginPath(); c.arc(mx + k[0], my + k[1], k[2], 0, TAU); c.fill(); }); c.globalAlpha = 1; }
    // clouds
    for (var k = 0; k < 4; k++) { var cx = ((t * (4 + k * 1.3) + k * 140) % (W + 140)) - 70, cy = 34 + k * 26 + hash(k) * 8, cs = 1 + hash(k + 2) * .6; c.fillStyle = night > .5 ? 'rgba(120,130,190,.35)' : 'rgba(255,255,255,.85)'; [[0, 0, 15], [14, -5, 12], [-14, 2, 11], [26, 3, 9]].forEach(function (b) { c.beginPath(); c.arc(cx + b[0] * cs, cy + b[1] * cs, b[2] * cs, 0, TAU); c.fill(); }); }
    // far hills
    var fh = night > .5 ? '#3b4a7a' : mixc(S.hill, '#9fc6e8', .45); c.fillStyle = fh; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(0, GROUND - 62); c.bezierCurveTo(60, GROUND - 100, 120, GROUND - 50, 190, GROUND - 78); c.bezierCurveTo(250, GROUND - 100, 320, GROUND - 56, W, GROUND - 82); c.lineTo(W, GROUND); c.fill();
    var mh = night > .5 ? '#34456f' : mixc(S.hill, '#7fb0c8', .25); c.fillStyle = mh; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(0, GROUND - 34); c.bezierCurveTo(70, GROUND - 60, 150, GROUND - 24, 230, GROUND - 46); c.bezierCurveTo(300, GROUND - 66, 350, GROUND - 40, W, GROUND - 52); c.lineTo(W, GROUND); c.fill();
    // front hill with door
    var fg = c.createLinearGradient(0, GROUND - 40, 0, GROUND); fg.addColorStop(0, night > .5 ? '#3d6a5a' : S.grass); fg.addColorStop(1, night > .5 ? '#2c4f46' : S.grass2);
    c.fillStyle = fg; c.beginPath(); c.moveTo(0, GROUND + 2); c.lineTo(0, GROUND - 16); c.bezierCurveTo(60, GROUND - 30, 100, GROUND - 22, 150, GROUND - 24); c.bezierCurveTo(200, GROUND - 26, 250, GROUND - 22, 320, GROUND - 30); c.quadraticCurveTo(360, GROUND - 28, W, GROUND - 18); c.lineTo(W, GROUND + 2); c.closePath(); c.fill();
    // grass tufts
    c.strokeStyle = shade(S.grass2, -.25); c.lineWidth = 1.4; c.lineCap = 'round'; for (var tf = 0; tf < 22; tf++) { var gx = tf * (W / 22) + hash(tf) * 12, gy = GROUND - 14 + hash(tf + 1) * 8 - (tf % 3) * 2; var sw = sin(t * 1.8 + tf) * 1.6; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + sw - 2, gy - 6); c.moveTo(gx, gy); c.lineTo(gx + sw + 2, gy - 5); c.stroke(); }
    // flowers (not in winter)
    if (st.season !== 'winter') { var fc = st.season === 'autumn' ? ['#e8a43a', '#d9534f', '#f2d36a'] : ['#ff9ab0', '#fff', '#ffd45a', '#b48be0']; for (var f = 0; f < 12; f++) { var fx = 14 + f * 31 + hash(f) * 10, fy = GROUND - 8 + hash(f + 4) * 5, sw2 = sin(t * 1.6 + f) * 1.2; if (fx > 100 && fx < 200) continue; c.strokeStyle = '#4f9a42'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + sw2, fy - 7); c.stroke(); c.fillStyle = fc[f % fc.length]; for (var p = 0; p < 5; p++) { c.beginPath(); c.arc(fx + sw2 + cos(p * TAU / 5) * 2.2, fy - 8 + sin(p * TAU / 5) * 2.2, 1.7, 0, TAU); c.fill(); } c.fillStyle = '#ffe58a'; c.beginPath(); c.arc(fx + sw2, fy - 8, 1.2, 0, TAU); c.fill(); } }
    else { c.fillStyle = 'rgba(255,255,255,.9)'; for (var sn = 0; sn < 10; sn++) { ell(c, 20 + sn * 40, GROUND - 16 + hash(sn) * 4, 14, 3.2); c.fill(); } }
    // tree (right)
    drawTree(c, 322, GROUND - 22, t, S, st.season, night);
    // signpost (left)
    c.fillStyle = '#7a5230'; c.fillRect(35, GROUND - 40, 4, 30); rr(c, 14, GROUND - 52, 48, 17, 4); fillStroke(c, '#d9a860', '#7a5230', 1.2); c.fillStyle = '#5a3a1a'; c.font = '600 9px Fredoka, sans-serif'; c.textAlign = 'center'; c.fillText('BURROW', 38, GROUND - 40); c.textAlign = 'left';
    // door in the hill
    var dx = st.doorX, dy = GROUND - 22;
    c.fillStyle = shade(S.grass2, -.15); ell(c, dx, dy + 8, 38, 10); c.fill();
    ell(c, dx, dy - 10, 26, 30); fillStroke(c, '#5a3a2a', '#2c1a10', 1.5);
    c.fillStyle = '#7a4a2e'; c.beginPath(); c.arc(dx, dy - 10, 20, PI, 0); c.lineTo(dx + 20, dy + 8); c.lineTo(dx - 20, dy + 8); c.closePath(); c.fill(); c.strokeStyle = '#3d2616'; c.lineWidth = 1.2; c.stroke();
    c.strokeStyle = 'rgba(40,20,10,.35)'; c.lineWidth = 1; for (var pl = -10; pl <= 10; pl += 10) { c.beginPath(); c.moveTo(dx + pl, dy - 28); c.lineTo(dx + pl, dy + 8); c.stroke(); }
    c.fillStyle = '#f2c14e'; c.beginPath(); c.arc(dx + 11, dy - 2, 2.2, 0, TAU); c.fill();
    // round window + lantern glow
    var lg = night * .8 + .25; glow(c, dx, dy - 18, 36, '#ffd070', lg * .55); ell(c, dx, dy - 20, 6, 6); fillStroke(c, '#ffe9a0', '#7a5a20', 1.2);
    // lantern
    c.strokeStyle = '#3d2a1a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(dx + 27, dy - 32); c.lineTo(dx + 27, dy - 24); c.stroke(); glow(c, dx + 27, dy - 18, 20, '#ffcf70', lg * .8); rr(c, dx + 23, dy - 24, 8, 10, 3); fillStroke(c, '#ffe08a', '#7a5a20', 1);
    if (st.supporter) { star(c, dx, dy - 36, 5, 5, .5); c.fillStyle = '#ffd84a'; c.fill(); c.strokeStyle = '#a07a10'; c.lineWidth = .8; c.stroke(); }
    // seasonal particles
    drawSeasonParticles(c, W, GROUND, t, st.season, night);
    drawSkyLife(c, W, GROUND, t, hour, st.season, night);
    if (st.rareTease) drawRareTease(c, st.doorX, GROUND, t);
    // night tint
    if (night > .02) { c.fillStyle = 'rgba(14,18,60,' + night * .28 + ')'; c.fillRect(0, -200, W, GROUND + 200); }
  }
  function drawTree(c, x, y, t, S, season, night) {
    c.fillStyle = '#7a5230'; c.beginPath(); c.moveTo(x - 7, y); c.quadraticCurveTo(x - 4, y - 30, x - 3, y - 54); c.lineTo(x + 5, y - 54); c.quadraticCurveTo(x + 6, y - 30, x + 9, y); c.closePath(); c.fill(); c.strokeStyle = '#4a3018'; c.lineWidth = 1.4; c.stroke();
    var sw = sin(t * .9) * 2;
    if (season === 'winter') { c.strokeStyle = '#6a4a28'; c.lineWidth = 3; c.lineCap = 'round'; [[0, -54, -22, -84], [1, -54, 22, -80], [1, -62, -8, -98], [1, -66, 16, -100]].forEach(function (b) { c.beginPath(); c.moveTo(x + b[0], y + b[1]); c.quadraticCurveTo(x + b[0] + b[2] * .4 + sw, y + b[1] - 14, x + b[2] + sw, y + b[3]); c.stroke(); }); c.fillStyle = 'rgba(255,255,255,.95)'; [[-22, -84], [22, -80], [-8, -98], [16, -100]].forEach(function (b) { ell(c, x + b[0] + sw, y + b[1] + 1, 7, 3); c.fill(); }); return; }
    [[-18, -66, 24, S.leaf], [16, -70, 24, S.leaf], [0, -88, 28, S.leaf2], [-2, -64, 26, S.leaf2], [-24, -80, 16, S.leaf]].forEach(function (b, i) { c.fillStyle = b[3]; c.beginPath(); c.arc(x + b[0] + sw * (1 + i * .1), y + b[1], b[2], 0, TAU); c.fill(); });
    c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(x - 8 + sw, y - 94, 12, 0, TAU); c.fill();
    if (season === 'spring') { c.fillStyle = '#fff'; for (var i = 0; i < 12; i++) { c.beginPath(); c.arc(x + (hash(i) - .5) * 70 + sw, y - 66 + (hash(i + 3) - .5) * 60, 1.6, 0, TAU); c.fill(); } }
    if (season === 'autumn') { c.fillStyle = '#d9534f'; for (var j = 0; j < 8; j++) { c.beginPath(); c.arc(x + (hash(j + 8) - .5) * 64 + sw, y - 70 + (hash(j + 12) - .5) * 50, 2.4, 0, TAU); c.fill(); } }
  }
  /** little birds by day (fewer in winter), an occasional shooting star at night: ambient life, nothing to tap */
  function drawSkyLife(c, W, G, t, hour, season, night) {
    if (night < .35 && hour > 6 && hour < 19) {
      var flocks = season === 'winter' ? 1 : 2;
      for (var f = 0; f < flocks; f++) {
        var per = 38 + f * 17, ph = ((t + f * 19) % per) / per, bx = -30 + ph * (W + 60), by = 34 + f * 26 + sin(ph * 9) * 6;
        for (var k = 0; k < 3; k++) {
          var x = bx - k * 13, y = by + (k % 2) * 7 + k * 2, fl = sin(t * 9 + k * 1.7 + f) * 3.2;
          c.strokeStyle = 'rgba(70,50,40,.55)'; c.lineWidth = 1.3; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - 5, y - fl * .6); c.quadraticCurveTo(x - 2, y - fl - 1, x, y); c.quadraticCurveTo(x + 2, y - fl - 1, x + 5, y - fl * .6); c.stroke();
        }
      }
    }
    if (night > .6) {
      var per2 = 23, ph2 = (t % per2) / per2;
      if (ph2 < .06) { var q = ph2 / .06, sx = W * .15 + q * W * .35, sy = 14 + q * 52; c.strokeStyle = 'rgba(255,248,210,' + (1 - q) * .9 + ')'; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx - 22, sy - 14); c.stroke(); glow(c, sx, sy, 6, '#fff6d0', (1 - q) * .8); }
    }
  }
  /** a lantern glowing by the burrow door with a small "?" shadow: a rare guest is due tonight */
  function drawRareTease(c, doorX, G, t) {
    var x = doorX + 96, y = G - 30 + sin(t * 1.6) * 2;
    glow(c, x, y, 34, '#ffe9a0', .45 + .15 * sin(t * 3));
    c.strokeStyle = '#5a3a2a'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y - 20); c.lineTo(x, y - 10); c.stroke();
    rr(c, x - 5, y - 10, 10, 13, 4); fillStroke(c, '#ffd36a', '#a3601a', 1.2);
    c.fillStyle = 'rgba(255,255,255,.7)'; ell(c, x - 1.5, y - 5, 1.4, 2.4); c.fill();
    c.font = '700 13px Fredoka,sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(255,240,190,' + (.55 + .35 * sin(t * 2.4)) + ')'; c.fillText('?', x + 14, y - 14 + sin(t * 2) * 2);
    for (var i = 0; i < 3; i++) { var a = (t * .5 + i / 3) % 1; c.fillStyle = 'rgba(255,246,190,' + (1 - a) * .8 + ')'; c.beginPath(); c.arc(x + sin(a * 6 + i * 2) * 10, y - 8 - a * 26, 1.3, 0, TAU); c.fill(); }
  }
  function drawSeasonParticles(c, W, G, t, season, night) {
    if (season === 'autumn') { for (var i = 0; i < 14; i++) { var p = (t * (.05 + hash(i) * .05) + hash(i + 2)) % 1, x = (hash(i + 5) * W + sin(t * .8 + i) * 22 + p * 30) % W, y = p * (G - 20); c.save(); c.translate(x, y); c.rotate(t + i); c.fillStyle = ['#e0803a', '#d9534f', '#e8b84a', '#c9702a'][i % 4]; ell(c, 0, 0, 4, 2.4); c.fill(); c.restore(); } }
    else if (season === 'winter') { c.fillStyle = 'rgba(255,255,255,.9)'; for (var s = 0; s < 36; s++) { var q = (t * (.04 + hash(s) * .05) + hash(s + 2)) % 1, sx = (hash(s + 5) * W + sin(t * .7 + s) * 10) % W, sy = q * (G - 6); c.beginPath(); c.arc(sx, sy, 1.1 + hash(s + 9) * 1.2, 0, TAU); c.fill(); } }
    else if (season === 'spring') { for (var k = 0; k < 12; k++) { var r = (t * (.04 + hash(k) * .04) + hash(k + 2)) % 1, px = (hash(k + 5) * W + sin(t + k) * 20 + r * 40) % W, py = r * (G - 20); c.save(); c.translate(px, py); c.rotate(t * 1.2 + k); c.fillStyle = '#ffb6c9'; ell(c, 0, 0, 3.2, 1.8); c.fill(); c.restore(); } }
    else { // summer: fireflies at dusk, butterflies by day
      if (night > .15) { for (var f = 0; f < 10; f++) { var fx = hash(f) * W + sin(t * .6 + f * 2) * 18, fy = G - 70 + hash(f + 3) * 60 + cos(t * .5 + f) * 10, a = (sin(t * 2 + f * 3) + 1) / 2; glow(c, fx, fy, 9, '#f6ff80', .85 * a * night); c.fillStyle = 'rgba(255,255,170,' + a + ')'; c.beginPath(); c.arc(fx, fy, 1.4, 0, TAU); c.fill(); } }
      else { for (var b = 0; b < 3; b++) { var bx = ((t * (14 + b * 5) + b * 130) % (W + 40)) - 20, by = G - 60 - b * 20 + sin(t * 2 + b) * 8, fl = Math.abs(sin(t * 12 + b)); c.fillStyle = ['#ffb347', '#ff8ab0', '#8ac4f0'][b]; ell(c, bx - 2, by, 3 * fl + .4, 3); c.fill(); ell(c, bx + 2, by, 3 * fl + .4, 3); c.fill(); } }
    }
  }

  // seasonal decor on the surface; positions are fixed slots so they never overlap the door
  function drawDecor(c, id, t, G, doorX) {
    var d = doorX;
    switch (id) {
      case 'pumpkins': [[-52, 11, 1], [-40, 8, .75], [-64, 9, .6]].forEach(function (p) { c.save(); c.translate(d + p[0], G - 14 + p[1] * .3); c.scale(p[2], p[2]); ell(c, 0, -6, 9, 7.4); fillStroke(c, '#f08a2a', '#a04a0a', 1.1); c.strokeStyle = '#c86a14'; c.lineWidth = 1; c.beginPath(); c.arc(0, -6, 4, -1.2, 1.2); c.moveTo(0, -13); c.lineTo(0, 1); c.stroke(); c.fillStyle = '#5a8a3a'; rr(c, -1.4, -15, 3, 4, 1); c.fill(); c.restore(); }); break;
      case 'lanterns': c.strokeStyle = '#5a3a2a'; c.lineWidth = 1; c.beginPath(); c.moveTo(d - 70, G - 74); c.quadraticCurveTo(d, G - 58, d + 70, G - 74); c.stroke(); [-52, -26, 0, 26, 52].forEach(function (x, i) { var y = G - 62 - (1 - Math.pow(x / 70, 2)) * -0 + 8 * (1 - (x / 70) * (x / 70)) * .6; var sw = sin(t * 1.4 + i) * 1.2; glow(c, d + x + sw, y + 10, 14, '#ff9a5a', .55); ell(c, d + x + sw, y + 8, 5, 6.2); fillStroke(c, ['#f0803a', '#e8b84a', '#d9534f'][i % 3], '#7a3a18', .9); }); break;
      case 'snowman': c.save(); c.translate(d - 62, G - 12); ell(c, 0, -5, 9, 8); fillStroke(c, '#fff', '#b7c9d6'); ell(c, 0, -19, 6.6, 6.2); fillStroke(c, '#fff', '#b7c9d6'); c.fillStyle = '#2b1d1a'; c.fillRect(-2.6, -21, 1.5, 1.5); c.fillRect(1.4, -21, 1.5, 1.5); c.fillStyle = '#f08a2a'; c.beginPath(); c.moveTo(0, -18); c.lineTo(6, -17); c.lineTo(0, -16); c.fill(); c.fillStyle = '#d9534f'; rr(c, -6, -14.5, 12, 3, 1.5); c.fill(); rr(c, 2, -14, 3, 8, 1.2); c.fill(); c.fillStyle = '#3a3a4a'; rr(c, -4.6, -30, 9, 6, 1); c.fill(); rr(c, -6.5, -25, 13, 2, 1); c.fill(); c.restore(); break;
      case 'fairy': c.strokeStyle = '#3d4a3a'; c.lineWidth = 1; c.beginPath(); c.moveTo(d - 74, G - 70); c.quadraticCurveTo(d, G - 50, d + 74, G - 70); c.stroke(); for (var i = -7; i <= 7; i++) { var x = i * 10, y = G - 63 + (1 - Math.pow(x / 74, 2)) * 12 * .9, a = (sin(t * 3 + i * 1.7) + 1) / 2; var col = ['#ff9ab0', '#ffe58a', '#9fe0ff', '#b8f0a0'][(i + 7) % 4]; glow(c, d + x, y, 9, col, .5 + .4 * a); c.fillStyle = col; c.beginPath(); c.arc(d + x, y, 2, 0, TAU); c.fill(); } break;
      case 'blossom': c.strokeStyle = '#6a4a28'; c.lineWidth = 2; c.beginPath(); c.moveTo(d + 45, G - 76); c.quadraticCurveTo(d + 10, G - 80, d - 30, G - 62); c.stroke(); for (var b = 0; b < 12; b++) { var bx = d + 45 - b * 6.5, by = G - 76 + sin(b * .5) * 5 + b * 1.2 + sin(t * 1.5 + b) * .8; c.fillStyle = b % 2 ? '#ffb6c9' : '#fff0f4'; for (var p = 0; p < 5; p++) { c.beginPath(); c.arc(bx + cos(p * TAU / 5) * 2.2, by + sin(p * TAU / 5) * 2.2, 1.7, 0, TAU); c.fill(); } } break;
      case 'tulips': [-70, -58, -46, 46, 58, 70].forEach(function (x, i) { var sw = sin(t * 1.6 + i) * 1.2; c.strokeStyle = '#4f9a42'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(d + x, G - 8); c.lineTo(d + x + sw, G - 20); c.stroke(); c.fillStyle = ['#ff6a8a', '#ffd45a', '#c58ae0'][i % 3]; c.beginPath(); c.moveTo(d + x + sw - 3.4, G - 20); c.lineTo(d + x + sw - 3.4, G - 25); c.lineTo(d + x + sw - 1.6, G - 22.5); c.lineTo(d + x + sw, G - 26); c.lineTo(d + x + sw + 1.6, G - 22.5); c.lineTo(d + x + sw + 3.4, G - 25); c.lineTo(d + x + sw + 3.4, G - 20); c.closePath(); c.fill(); }); break;
      case 'sunflower': [-76, -62, 62, 76].forEach(function (x, i) { var sw = sin(t * 1.2 + i) * 1.4, h = 34 + i % 2 * 8; c.strokeStyle = '#4f9a42'; c.lineWidth = 2; c.beginPath(); c.moveTo(d + x, G - 8); c.quadraticCurveTo(d + x + sw, G - h * .5, d + x + sw * 1.5, G - h); c.stroke(); for (var p = 0; p < 10; p++) { c.fillStyle = '#ffd13a'; ell(c, d + x + sw * 1.5 + cos(p * TAU / 10) * 6, G - h + sin(p * TAU / 10) * 6, 3, 1.6, p * TAU / 10); c.fill(); } c.fillStyle = '#6a4318'; c.beginPath(); c.arc(d + x + sw * 1.5, G - h, 3.8, 0, TAU); c.fill(); }); break;
      case 'jar': c.save(); c.translate(d + 52, G - 12); rr(c, -6, -16, 12, 16, 4); fillStroke(c, 'rgba(220,240,255,.35)', '#8aa8c0', 1); c.fillStyle = '#8a6a3a'; rr(c, -5, -18, 10, 3, 1); c.fill(); for (var j = 0; j < 4; j++) { var a = (sin(t * 2.4 + j * 2) + 1) / 2; glow(c, sin(t + j * 2) * 2.4, -9 + cos(t * .8 + j) * 3, 8, '#f6ff80', a * .9); c.fillStyle = 'rgba(255,255,170,' + (.4 + a * .6) + ')'; c.beginPath(); c.arc(sin(t + j * 2) * 2.4, -9 + cos(t * .8 + j) * 3, 1.1, 0, TAU); c.fill(); } c.restore(); break;
      case 'chimes': c.save(); c.translate(d - 36, G - 66); c.strokeStyle = '#6a4a28'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-8, 0); c.lineTo(8, 0); c.stroke(); [-6, -2, 2, 6].forEach(function (x, i) { var sw = sin(t * 2 + i * 1.3) * .08; c.save(); c.translate(x, 0); c.rotate(sw); c.strokeStyle = '#c8d4dc'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 10 + i % 2 * 4); c.stroke(); c.restore(); }); c.restore(); break;
      case 'goldframe': c.save(); c.translate(d + 62, G - 14); c.fillStyle = '#7a5230'; c.fillRect(-1.5, -22, 3, 22); rr(c, -14, -34, 28, 14, 4); fillStroke(c, '#ffd84a', '#a07a10', 1.2); c.fillStyle = '#a07a10'; ell(c, 0, -26, 4.2, 4.8); c.fill(); c.fillStyle = '#ffe98a'; ell(c, -.8, -27, 2, 2.6); c.fill(); rr(c, -1, -34, 2, 3, 1); c.fill(); c.restore(); break;
    }
  }

  // ---------- soil background (cached by the app) ----------
  function drawSoilTexture(c, W, H, y0, strata) {
    var g = c.createLinearGradient(0, y0, 0, H);
    g.addColorStop(0, '#8a6244'); g.addColorStop(.38, '#79503a'); g.addColorStop(.55, '#a0623a'); g.addColorStop(.72, '#8a5430'); g.addColorStop(.78, '#5a4a52'); g.addColorStop(1, '#3d3440');
    c.fillStyle = g; c.fillRect(0, y0, W, H - y0);
    for (var i = 0; i < 520; i++) { var x = hash(i) * W, y = y0 + hash(i + 77) * (H - y0), r = .8 + hash(i + 3) * 2.8; var f = (y - y0) / (H - y0); c.fillStyle = hash(i + 9) > .5 ? 'rgba(255,230,190,' + (.05 + hash(i + 4) * .08) + ')' : 'rgba(30,15,5,' + (.1 + hash(i + 4) * .14) + ')'; ell(c, x, y, r * 1.4, r, hash(i) * 3); c.fill(); }
    // pebbles
    for (var p = 0; p < 70; p++) { var px = hash(p + 200) * W, py = y0 + hash(p + 300) * (H - y0), pr = 2 + hash(p + 400) * 4; var base = (py - y0) / (H - y0) > .7 ? '#7a7a88' : '#b79a7a'; ell(c, px, py, pr * 1.2, pr); fillStroke(c, base, shade(base, -.4), .8); c.fillStyle = 'rgba(255,255,255,.25)'; ell(c, px - pr * .3, py - pr * .3, pr * .4, pr * .3); c.fill(); }
    // roots & worms
    c.lineCap = 'round'; for (var r = 0; r < 10; r++) { c.strokeStyle = 'rgba(70,40,20,' + (.25 + hash(r) * .2) + ')'; c.lineWidth = 1 + hash(r + 5) * 1.6; var rx = hash(r + 40) * W, ry = y0 + hash(r + 50) * 200; c.beginPath(); c.moveTo(rx, ry); c.bezierCurveTo(rx + 20, ry + 30, rx - 20, ry + 50, rx + 10 + hash(r) * 20, ry + 90); c.stroke(); }
    // grass lip along the top
    c.fillStyle = '#5a8a3a'; c.fillRect(0, y0 - 2, W, 5);
  }

  // ---------- icons (DOM) ----------
  var ICON = {
    acorn: '<svg viewBox="0 0 24 24" class="ic"><path d="M12 2.2c.6 0 1 .5 1 1v1.2c4 .6 6.5 3 6.5 5.6H4.5c0-2.6 2.5-5 6.5-5.6V3.2c0-.5.4-1 1-1z" fill="#8a5a2a" stroke="#5a3418" stroke-width="1.2"/><path d="M4.4 10.2h15.2c0 5.4-3.2 10.6-7.6 11.6C7.6 20.8 4.4 15.600 4.4 10.200z" fill="#e8a649" stroke="#8a5a2a" stroke-width="1.3"/><ellipse cx="9" cy="13.5" rx="1.8" ry="3.2" fill="#fff" opacity=".35"/></svg>',
    berry: '<svg viewBox="0 0 24 24" class="ic"><path d="M12 5c1-2 2.600-2.800 4.400-2.600-.2 1.800-1.400 3.200-3.400 3.600" fill="#5aa84a" stroke="#2f6a2a" stroke-width="1"/><circle cx="12" cy="14.500" r="7.500" fill="#7ee8ff" stroke="#2f8aa8" stroke-width="1.400"/><circle cx="9.500" cy="12" r="2" fill="#fff" opacity=".6"/><path d="M12 7l.8 1.600 1.700.2-1.200 1.200.3 1.700L12 10.900l-1.600.8.300-1.700-1.200-1.200 1.700-.2z" fill="#fff" opacity=".8" transform="translate(0 6) scale(.7) translate(5 0)"/></svg>',
    basket: '<svg viewBox="0 0 24 24" class="ic"><path d="M4 11h16l-1.800 9H5.800z" fill="#c98a4a" stroke="#7a4a1a" stroke-width="1.300"/><path d="M7 11c0-5 2.200-7.500 5-7.500S17 6 17 11" fill="none" stroke="#7a4a1a" stroke-width="1.600"/><path d="M6 14h12M6.600 17h10.800" stroke="#7a4a1a" stroke-width="1" opacity=".6"/></svg>',
    heart: '<svg viewBox="0 0 24 24" class="ic"><path d="M12 21C5 15.500 3 12 3 8.800 3 6 5 4.300 7.300 4.300c1.800 0 3.600 1 4.700 2.800 1.100-1.800 2.900-2.800 4.700-2.800C19 4.300 21 6 21 8.800 21 12 19 15.500 12 21z" fill="#f4758a" stroke="#a83a50" stroke-width="1.300"/></svg>',
    shovel: '<svg viewBox="0 0 24 24" class="ic"><path d="M14 3l7 7-2 2-2-.8-5 5-1.200-1.200 5-5L15 8z" fill="#9aa4ad" stroke="#4a545d" stroke-width="1.100"/><path d="M4.500 19.500l6-6 2 2-6 6c-1 .6-2.500-.6-2-2z" fill="#c98a4a" stroke="#7a4a1a" stroke-width="1.100"/></svg>',
    door: '<svg viewBox="0 0 24 24" class="ic"><path d="M5 21V10a7 7 0 0114 0v11z" fill="#8a5a38" stroke="#4a2a14" stroke-width="1.300"/><circle cx="15.500" cy="14" r="1.200" fill="#f2c14e"/></svg>',
    book: '<svg viewBox="0 0 24 24" class="ic"><path d="M4 5c3-1 6-.8 8 1 2-1.800 5-2 8-1v13c-3-1-6-.8-8 1-2-1.800-5-2-8-1z" fill="#f4e6c8" stroke="#7a5a2a" stroke-width="1.300"/><path d="M12 6v13" stroke="#7a5a2a" stroke-width="1.100"/></svg>',
    gift: '<svg viewBox="0 0 24 24" class="ic"><rect x="4" y="10" width="16" height="10" rx="2" fill="#f4758a" stroke="#a83a50" stroke-width="1.200"/><rect x="3" y="7" width="18" height="4" rx="1.500" fill="#ff9aa8" stroke="#a83a50" stroke-width="1.200"/><path d="M12 7v13" stroke="#fff3c8" stroke-width="2"/><path d="M12 7c-2-4-6-3-5 0zM12 7c2-4 6-3 5 0z" fill="#ffd45a" stroke="#a07a10" stroke-width="1"/></svg>',
    cart: '<svg viewBox="0 0 24 24" class="ic"><path d="M3 5h3l2.200 10h9.600L20 8H7" fill="#e8f4ff" stroke="#3a6a8a" stroke-width="1.400" stroke-linejoin="round"/><circle cx="9.500" cy="19" r="1.600" fill="#3a6a8a"/><circle cx="16.500" cy="19" r="1.600" fill="#3a6a8a"/></svg>',
    gear: '<svg viewBox="0 0 24 24" class="ic"><circle cx="12" cy="12" r="3.200" fill="none" stroke="#6a5040" stroke-width="2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M5.600 18.400l2.100-2.100M16.300 7.700l2.100-2.100" stroke="#6a5040" stroke-width="2.200" stroke-linecap="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" class="ic"><rect x="5" y="10.500" width="14" height="10" rx="2.500" fill="#b9a58a" stroke="#6a5a40" stroke-width="1.300"/><path d="M8 10.500V8a4 4 0 018 0v2.500" fill="none" stroke="#6a5a40" stroke-width="1.600"/></svg>'
  };

  root.PB_ART = {
    drawCritter: drawCritter, drawRoom: drawRoom, drawEmptyCell: drawEmptyCell, drawFoyer: drawFoyer, drawSurface: drawSurface, drawDecor: drawDecor, drawSoilTexture: drawSoilTexture,
    ROOM_THEME: ROOM_THEME, SEASON: SEASON, ICON: ICON, CW: CW, CH: CH, rr: rr, ell: ell, glow: glow, star: star, heart: heart, shade: shade, alpha: alpha, hash: hash, nightness: nightness, mixc: mixc, fillStroke: fillStroke
  };
})(typeof self !== 'undefined' ? self : this);
