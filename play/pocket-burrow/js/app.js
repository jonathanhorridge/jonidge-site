/* Pocket Burrow: scene, input and UI. Rules live in sim.js; this file only draws, listens and talks to the player. */
(function (root) {
  'use strict';
  var D = root.PB_DATA, S = root.PB_SIM, A = root.PB_ART, AU = root.PB_AUDIO, P = root.PB_PLATFORM, CFG = root.PB_CONFIG, ADS = root.PB_ADS, IAP = root.PB_IAP, REM = root.PB_REMIND;
  var doc = document, $ = function (id) { return doc.getElementById(id); };

  // ---------- test / debug URL params (like Sunplop's ?date=) ----------
  var params = new URLSearchParams(location.search);
  var timeOffset = params.get('now') ? Date.parse(params.get('now')) - Date.now() : 0;
  var forceHour = params.get('hour') != null ? parseFloat(params.get('hour')) : null;
  var forceSeason = params.get('season');
  function now() { return Date.now() + timeOffset; }

  // ---------- layout ----------
  var WW = 390, GROUND = 190, CW = A.CW, CH = A.CH, X0 = (WW - D.GRID.cols * CW) / 2, ROWS = D.GRID.rows, COLS = D.GRID.cols;
  var WORLD_H = GROUND + ROWS * CH + 70;
  var DOOR_X = X0 + D.GRID.entranceCol * CW + CW / 2;
  function podSeed(x, y) { return x * 7 + y * 13 + 1; }
  function cellX(x) { return X0 + x * CW; } function cellY(y) { return GROUND + y * CH; }

  // ---------- state ----------
  var st = null, dirty = false, lastSave = 0;
  var view = { w: 390, h: 800, scale: 1, dpr: 1, cam: 0, vel: 0 };
  var canvas = $('scene'), ctx = canvas.getContext('2d'), soil = null;
  var actors = {}, particles = [], hits = [], portraits = [], sheet = null, tutArrow = null, seasonNow = 'autumn', hourNow = 12;
  var rareTeaseOn = false, clock = 0, shownAcorns = null, bounce = {}, shake = 0, lastGreet = 0;
  function calm() { return !!(st && st.settings.reduceMotion); }
  function isSleeping(look) { if (hourNow >= 6 && hourNow < 22.5) return false; var night = (look.arch === 'winged' && (look.kind === 'owl' || look.kind === 'bat' || look.kind === 'moth')) || /glow/.test(look.arch || ''); return !night; }
  function bump(cx, cy) { bounce[cx + ',' + cy] = clock; }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmtN(n) { n = Math.floor(n); if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M'; if (n >= 1e4) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + 'k'; return String(n); }
  function fmtDur(ms) { ms = Math.max(0, ms); var s = Math.ceil(ms / 1000); if (s < 60) return s + 's'; var m = Math.floor(s / 60); if (m < 60) return m + 'm ' + (s % 60 ? (s % 60) + 's' : ''); var h = Math.floor(m / 60); return h + 'h ' + (m % 60) + 'm'; }
  function ic(n) { return A.ICON[n] || ''; }
  var UP_ICON = { visitor: '🚪', rare: '✨', basket: '🧺', dig: '⛏', gift: '🎁', daily: '🎀' };
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function clockLabel(at) { var d = new Date(at); return d.getHours() + ':' + pad2(d.getMinutes()); }
  /** "in 25 min", "at 14:00", "tomorrow 9:00" (all local time) */
  function whenLabel(at, t) {
    var diff = at - t; if (diff < 45 * 60000) return 'in ' + Math.max(1, Math.round(diff / 60000)) + ' min';
    var d0 = new Date(t); d0.setHours(0, 0, 0, 0); var days = Math.floor((at - d0.getTime()) / 864e5);
    return days <= 0 ? 'at ' + clockLabel(at) : days === 1 ? 'tomorrow ' + clockLabel(at) : 'on ' + new Date(at).toLocaleDateString(undefined, { weekday: 'long' }) + ' ' + clockLabel(at);
  }
  function upText(u, t) { return (UP_ICON[u.kind] || '') + ' ' + u.text + ' <b>' + whenLabel(u.at, t) + '</b>'; }
  function teaserLine(t) { var c = S.comeBack(st, t); return c ? upText(c, t) : ''; }
  var G = D.GOODS;
  function dirtyUp() { dirty = true; }
  function toast(html) { var d = doc.createElement('div'); d.className = 'toast'; d.innerHTML = html; $('toasts').appendChild(d); setTimeout(function () { d.remove(); }, 3300); }
  function snd(n, o) { AU.play(n, o); }

  // ---------- particles ----------
  function fx(type, x, y, o) {
    o = o || {};
    if (type === 'burst') { for (var i = 0; i < (o.n || 10); i++) { var a = Math.random() * 6.28, sp = 20 + Math.random() * 50; particles.push({ k: 'spark', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, life: .7 + Math.random() * .5, age: 0, col: o.col || '#ffe58a', r: 1.5 + Math.random() * 2 }); } }
    else if (type === 'text') particles.push({ k: 'text', x: x, y: y, vx: 0, vy: -26, life: 1.6, age: 0, text: o.text, col: o.col || '#fff' });
    else if (type === 'heart') for (var h = 0; h < (o.n || 3); h++) particles.push({ k: 'heart', x: x + (Math.random() - .5) * 14, y: y - h * 4, vx: (Math.random() - .5) * 14, vy: -22 - Math.random() * 14, life: 1.3, age: 0 });
    else if (type === 'fly') { for (var q = 0; q < (o.n || 5); q++) particles.push({ k: 'fly', sx: x + (Math.random() - .5) * 16, sy: y + (Math.random() - .5) * 10, x: x, y: y, vx: 0, vy: 0, life: .75 + Math.random() * .2, age: -q * .07, kind: o.kind || 'acorn' }); }
    else if (type === 'float') particles.push({ k: 'float', x: x, y: y, vx: 0, vy: -(o.vy || 11), life: o.life || 2.2, age: 0, ch: o.ch, col: o.col || '#fff', size: o.size || 12, ph: Math.random() * 6 });
    else if (type === 'dirt') for (var d = 0; d < 7; d++) particles.push({ k: 'dirt', x: x + (Math.random() - .5) * 30, y: y, vx: (Math.random() - .5) * 60, vy: -40 - Math.random() * 40, life: .6, age: 0, col: ['#8a5a38', '#a9764a', '#5a3a28'][d % 3], r: 2 + Math.random() * 2 });
  }
  function stepParticles(dt) { for (var i = particles.length - 1; i >= 0; i--) { var p = particles[i]; p.age += dt; if (p.age > p.life) { if (p.k === 'fly') hudBump(p.kind); particles.splice(i, 1); continue; } if (p.k === 'fly') { if (p.age >= 0) { var u = p.age / p.life, e = u * u * (3 - 2 * u), tx = (p.kind === 'berry' ? 124 : 52) / view.scale, ty = 28 / view.scale + view.cam; p.x = p.sx + (tx - p.sx) * e; p.y = p.sy + (ty - p.sy) * e - Math.sin(u * 3.14) * 26; } continue; } if (p.k === 'float') { p.x += Math.sin(p.age * 2 + p.ph) * 6 * dt; p.y += p.vy * dt; continue; } p.x += p.vx * dt; p.y += p.vy * dt; if (p.k === 'dirt' || p.k === 'spark') p.vy += 120 * dt; else if (p.k === 'heart') p.vx += Math.sin(p.age * 6) * 20 * dt; } }
  function hudBump(kind) { var el = $(kind === 'berry' ? 'chip-berry' : 'chip-acorn'); if (!el) return; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  function drawParticles(c) {
    particles.forEach(function (p) {
      if (p.age < 0) return; var a = 1 - p.age / p.life; if (p.k === 'float') a = Math.min(1, p.age * 2.5) * Math.min(1, (p.life - p.age) * 1.4); c.globalAlpha = Math.max(0, Math.min(1, a * 1.4));
      if (p.k === 'fly') { c.globalAlpha = 1; if (p.kind === 'berry') { c.fillStyle = '#7fe0ff'; c.beginPath(); c.arc(p.x, p.y, 4, 0, 6.28); c.fill(); } else drawAcorn(c, p.x, p.y, .8); }
      else if (p.k === 'float') { c.font = '700 ' + p.size + 'px Fredoka,sans-serif'; c.textAlign = 'center'; c.fillStyle = p.col; c.fillText(p.ch, p.x, p.y); }
      else if (p.k === 'text') { c.font = '700 14px Fredoka,sans-serif'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(60,35,15,.8)'; c.strokeText(p.text, p.x, p.y); c.fillStyle = p.col; c.fillText(p.text, p.x, p.y); }
      else if (p.k === 'heart') { A.heart(c, p.x, p.y, 4.4); c.fillStyle = '#f4758a'; c.fill(); }
      else if (p.k === 'spark') { A.star(c, p.x, p.y, p.r * 1.6, 4, .35); c.fillStyle = p.col; c.fill(); }
      else { c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.28); c.fill(); }
    });
    c.globalAlpha = 1;
  }

  // ---------- canvas sizing ----------
  function resize() {
    var app = $('app'), w = app.clientWidth, h = app.clientHeight; view.dpr = Math.min(root.devicePixelRatio || 1, 2.5);
    view.w = w; view.h = h; view.scale = w / WW; canvas.width = Math.round(w * view.dpr); canvas.height = Math.round(h * view.dpr);
    var sh = Math.ceil((WORLD_H - GROUND) * view.scale * view.dpr), sw = Math.ceil(WW * view.scale * view.dpr);
    soil = doc.createElement('canvas'); soil.width = sw; soil.height = sh; var c = soil.getContext('2d'); c.scale(view.scale * view.dpr, view.scale * view.dpr); c.translate(0, -GROUND);
    A.drawSoilTexture(c, WW, WORLD_H, GROUND, D.GRID.strata.map(function (q) { return q.fromRow; }), CH);
    clampCam();
  }
  function maxCam() { return Math.max(0, WORLD_H - view.h / view.scale); }
  function clampCam() { view.cam = Math.max(0, Math.min(maxCam(), view.cam)); }
  function scrollTo(wy, instant) { view.target = Math.max(0, Math.min(maxCam(), wy - (view.h / view.scale) * .4)); if (instant) view.cam = view.target; }
  function totalReady() { var goods = 0, acorns = 0, gifts = 0, n = 0, t = now(); S.eachRoom(st, function (r) { var f = Math.floor(S.ready(r, t)); if (f > 0) { goods += f; acorns += f * G[D.ROOM_BY_ID[r.id].good].value; n++; } if (r.giftReady) gifts++; }); return { goods: goods, acorns: acorns, gifts: gifts, rooms: n }; }

  // ---------- actors (critters walking inside their rooms) ----------
  function syncActors(dt) {
    var seen = {};
    S.eachRoom(st, function (room, cx, cy) {
      room.critters.forEach(function (id, i) {
        seen[id] = 1; var a = actors[id];
        if (!a) { a = actors[id] = { id: id, x: 20 + Math.random() * 50, tx: null, dir: 1, wait: Math.random() * 2, born: clock, seed: Math.random() * 20, hop: 0, vh: 0 }; }
        a.cx = cx; a.cy = cy; a.slot = i;
        var look = D.CRITTER_BY_ID[id].look, still = look.arch === 'winged' && look.kind === 'owl';
        a.walk = 0; a.sleep = isSleeping(look) && !(a.awake > clock);
        if (a.sleep) { a.tx = null; a.wait = 3; if (a.hop <= 0 && !calm() && Math.random() < .004) fx('float', cellX(cx) + a.x + 8, cellY(cy) + CH - 40, { ch: 'z', col: '#dfe9ff', size: 11, vy: 9, life: 2.4 }); }
        if (a.hop > 0 || a.vh) { a.vh -= 260 * dt; a.hop = Math.max(0, a.hop + a.vh * dt); if (a.hop === 0) a.vh = 0; }
        if (a.tx != null) { var sp = (look.arch === 'snail' ? 5 : 14) * dt, dx = a.tx - a.x; if (Math.abs(dx) < sp) { a.x = a.tx; a.tx = null; a.wait = 1.5 + Math.random() * 4; } else { a.x += Math.sign(dx) * sp; a.dir = Math.sign(dx); a.walk = 1; } }
        else { a.wait -= dt; if (a.wait <= 0) { a.tx = 18 + Math.random() * 54; if (still || Math.abs(a.tx - a.x) < 8) { a.tx = null; a.wait = 3 + Math.random() * 4; } } }
      });
    });
    for (var k in actors) if (!seen[k]) delete actors[k];
  }

  function drawLabel(c, text, x, y, size, col, align) { c.font = '700 ' + (size || 10) + 'px Fredoka,sans-serif'; c.textAlign = align || 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(40,22,10,.85)'; c.lineJoin = 'round'; c.strokeText(text, x, y); c.fillStyle = col || '#fff6e4'; c.fillText(text, x, y); }
  function drawAcorn(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = '#8a5a2a'; A.rr(c, -5, -7, 10, 4, 2); c.fill(); c.beginPath(); c.moveTo(-5, -4); c.quadraticCurveTo(-5, 6, 0, 7); c.quadraticCurveTo(5, 6, 5, -4); c.closePath(); c.fillStyle = '#e8a649'; c.fill(); c.strokeStyle = '#8a5a2a'; c.lineWidth = 1; c.stroke(); c.restore(); }

  function drawScene() {
    var c = ctx, s = view.scale * view.dpr, t = clock;
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = A.PAPER.bg; c.fillRect(0, 0, canvas.width, canvas.height);
    var shx = 0, shy = 0; if (shake > 0 && !calm()) { shx = (Math.random() - .5) * shake * 6 * s; shy = (Math.random() - .5) * shake * 6 * s; shake = Math.max(0, shake - .04); }
    c.setTransform(s, 0, 0, s, shx, -view.cam * s + shy);
    hits = [];
    var visTop = view.cam, visBot = view.cam + view.h / view.scale;
    if (visTop < GROUND + 20) A.drawSurface(c, WW, GROUND, { t: t, hour: hourNow, season: seasonNow, doorX: DOOR_X, supporter: st.supporter, rareTease: rareTeaseOn });
    c.drawImage(soil, 0, 0, soil.width, soil.height, 0, GROUND, WW, WORLD_H - GROUND);
    for (var id in st.decor.placed) if (st.decor.placed[id]) A.drawDecor(c, id, t, GROUND, DOOR_X);
    D.GRID.strata.forEach(function (sr, i) { if (i === 0) return; var y = cellY(sr.fromRow); c.font = '600 8.5px Fredoka,sans-serif'; c.textAlign = 'right'; c.fillStyle = 'rgba(246,231,203,.45)'; c.fillText(sr.name.toUpperCase() + ' · Lv ' + sr.level, WW - 5, y + 2); });
    var dugMap = {}; for (var k in st.cells) if (st.cells[k].dug) dugMap[k] = true;
    function isDug(x, y) { return !!dugMap[x + ',' + y]; }
    // paper-cut shell: every chamber pod and tunnel gets a cast shadow, then a cream paper rim, then the tunnel interiors
    var pieces = [];
    for (var py = 0; py < ROWS; py++) { var Y0 = cellY(py); if (Y0 > visBot + 20 || Y0 + CH < visTop - CH) continue; for (var px = 0; px < COLS; px++) { if (!isDug(px, py)) continue;
      pieces.push({ pod: true, x: px, y: py, seed: podSeed(px, py) });
      if (isDug(px + 1, py)) pieces.push({ kind: 'h', x: px, y: py });
      if (isDug(px, py + 1)) pieces.push({ kind: 'v', x: px, y: py }); } }
    ['shadow', 'rim', 'fill'].forEach(function (pass) { pieces.forEach(function (pc) { if (pass === 'fill' && pc.pod) return; c.save(); c.translate(cellX(pc.x), cellY(pc.y)); A.shellPiece(c, pass, pc, CW, CH); c.restore(); }); });
    for (var cy = 0; cy < ROWS; cy++) {
      var y0 = cellY(cy); if (y0 > visBot + 10 || y0 + CH < visTop - 10) continue;
      for (var cx = 0; cx < COLS; cx++) {
        var x0 = cellX(cx), cell = S.cellAt(st, cx, cy), dg = st.digs.filter(function (d) { return d.x === cx && d.y === cy; })[0];
        c.save(); c.translate(x0, y0);
        var bt = clock - (bounce[cx + ',' + cy] || -9); if (bt < .5 && !calm()) { var bk = Math.sin(bt / .5 * 3.14 * 2.2) * (1 - bt / .5) * .05; c.translate(CW / 2, CH); c.scale(1 + bk, 1 - bk); c.translate(-CW / 2, -CH); }
        if (cell && cell.dug) { c.save(); A.podPath(c, CW, CH, podSeed(cx, cy)); c.clip(); if (cell.foyer) A.drawFoyer(c, t, CW, CH); else if (cell.room) A.drawRoom(c, cell.room.id, t, CW, CH); else A.drawEmptyCell(c, t, CW, CH, true); A.podVignette(c, CW, CH); c.restore(); }
        else if (dg) drawDigging(c, dg, t);
        else if (S.canDigCell(st, cx, cy)) drawDiggable(c, cx, cy, t);
        c.restore();
      }
    }
    var tt = now();
    S.eachRoom(st, function (room, cx, cy) {
      var x0 = cellX(cx), y0 = cellY(cy); if (y0 > visBot + 10 || y0 + CH < visTop - 10) return;
      var def = D.ROOM_BY_ID[room.id];
      A.roomTag(c, def.name, x0 + CW / 2, y0 + CH - 2, room.lvl, D.ROOM_LEVELS.max, podSeed(cx, cy));
      if (!calm() && particles.length < 160) {
        var rn = Math.random();
        if (room.id === 'music' && rn < .012) fx('float', x0 + 30 + Math.random() * 30, y0 + 50, { ch: Math.random() < .5 ? '♪' : '♫', col: ['#ffd9a0', '#ffb6c9', '#bfe3ff'][Math.floor(Math.random() * 3)], size: 13, vy: 14 });
        else if (room.id === 'library' && rn < .02) fx('float', x0 + 14 + Math.random() * 60, y0 + 56, { ch: '•', col: 'rgba(255,240,200,.7)', size: 6, vy: 5, life: 3 });
        else if (room.id === 'farm' && rn < .015) fx('float', x0 + 12 + Math.random() * 60, y0 + CH - 28, { ch: '·', col: '#f6f0c8', size: 14, vy: 8, life: 2.6 });
        else if (room.id === 'glow' && rn < .02) fx('float', x0 + 10 + Math.random() * 66, y0 + CH - 20, { ch: '✦', col: '#9ff0ff', size: 8, vy: 6, life: 2.8 });
        else if (room.id === 'honey' && rn < .008) fx('float', x0 + 20 + Math.random() * 50, y0 + 40, { ch: '•', col: '#ffc233', size: 7, vy: -16, life: 1.3 });
        else if (room.id === 'loft' && rn < .01) fx('float', x0 + 10 + Math.random() * 66, y0 + 30, { ch: '✦', col: '#fff3b0', size: 9, vy: 3, life: 3 });
        else if (room.id === 'tea' && rn < .008) fx('float', x0 + 40 + Math.random() * 14, y0 + CH - 36, { ch: '~', col: 'rgba(255,255,255,.7)', size: 12, vy: 10, life: 2 });
        else if (room.id === 'spring' && rn < .012) fx('float', x0 + 24 + Math.random() * 40, y0 + CH - 30, { ch: '○', col: 'rgba(255,255,255,.6)', size: 8, vy: 12, life: 2.2 });
      }
      var list = room.critters.map(function (id) { return actors[id]; }).filter(Boolean).sort(function (a, b) { return a.slot - b.slot; });
      list.forEach(function (a) {
        var cr = D.CRITTER_BY_ID[a.id], pop = Math.min(1, (clock - a.born) / .5), sc = pop < 1 ? (.2 + pop * .9 + Math.sin(pop * 3.14) * .25) : 1;
        c.save(); c.translate(x0, y0); A.drawCritter(c, cr.look, { t: clock, x: a.x, y: CH - 11 - (a.slot % 2) * 2, dir: a.dir, walk: a.walk, seed: a.seed, hop: a.hop, scale: sc, sleep: a.sleep }); c.restore();
        if (clock - a.born < 1.2 && Math.random() < .3) fx('burst', x0 + a.x, y0 + CH - 24, { n: 1 });
        hits.push({ kind: 'critter', id: a.id, x: x0 + a.x - 14, y: y0 + CH - 46, w: 28, h: 40 });
      });
      var rd = S.ready(room, tt), full = rd >= S.roomCap(room) - .01, n = Math.floor(rd);
      if (n >= 1) {
        var bob = Math.sin(clock * 3 + cx + cy) * 2, bx = x0 + CW - 38, by = y0 + 12 + bob; c.save(); c.translate(bx, by);
        A.rr(c, 0, -2, 36, 20, 9); A.fillStroke(c, full ? '#ffe28a' : '#fff8ea', full ? '#d9962a' : '#e3cfae', 1.6); c.font = '700 10px Fredoka,sans-serif'; c.textAlign = 'center'; c.fillStyle = '#4a3426'; c.fillText(G[def.good].icon, 9, 12); c.fillText(fmtN(n), 25, 12); c.restore();
        hits.push({ kind: 'basket', x: x0 + CW - 42, y: y0 + 6, w: 44, h: 30, cx: cx, cy: cy });
      }
      if (room.giftReady) { var gb = Math.sin(clock * 4 + cx) * 2; c.save(); c.translate(x0 + 5, y0 + 14 + gb); A.rr(c, 0, 0, 22, 22, 8); A.fillStroke(c, '#fff0f4', '#f4758a', 1.6); c.font = '13px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText('🎁', 11, 16); c.restore(); hits.push({ kind: 'gift', x: x0 + 2, y: y0 + 10, w: 28, h: 30, cx: cx, cy: cy }); }
      hits.push({ kind: 'room', x: x0, y: y0, w: CW, h: CH, cx: cx, cy: cy });
    });
    drawVisitors(c, t);
    hits.push({ kind: 'door', x: DOOR_X - 44, y: GROUND - 64, w: 130, h: 70 });
    for (var hy = 0; hy < ROWS; hy++) for (var hx2 = 0; hx2 < COLS; hx2++) { var cc = S.cellAt(st, hx2, hy); var dgg = st.digs.some(function (d) { return d.x === hx2 && d.y === hy; }); if ((cc && cc.dug && !cc.room && !cc.foyer) || dgg || (!cc && S.canDigCell(st, hx2, hy))) hits.push({ kind: 'cell', x: cellX(hx2), y: cellY(hy), w: CW, h: CH, cx: hx2, cy: hy }); }
    drawParticles(c);
    if (tutArrow) { var ay = tutArrow.y + Math.sin(clock * 5) * 4; c.save(); c.translate(tutArrow.x, ay); c.fillStyle = '#fff3b0'; c.strokeStyle = '#d9962a'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(-11, -16); c.lineTo(-4, -16); c.lineTo(-4, -28); c.lineTo(4, -28); c.lineTo(4, -16); c.lineTo(11, -16); c.closePath(); c.fill(); c.stroke(); c.restore(); }
  }

  function drawDiggable(c, cx, cy, t) {
    var sr = D.stratumForRow(cy), locked = S.level(st) < sr.level, info = S.digInfo(st, cx, cy);
    A.podSketch(c, CW, CH, podSeed(cx, cy), t, locked);
    if (locked) { c.font = '15px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText('🔒', CW / 2, CH / 2 - 2); drawLabel(c, 'Burrow Lv ' + sr.level, CW / 2, CH / 2 + 16, 10); }
    else {
      var bob = Math.sin(t * 3 + cx * 2) * 2; c.save(); c.translate(CW / 2, CH / 2 - 8 + bob); c.rotate(-.5); c.fillStyle = '#c9a05a'; c.fillRect(-1.6, -4, 3.2, 15); c.fillStyle = '#c3ccd4'; c.strokeStyle = '#6a747c'; c.lineWidth = 1; c.beginPath(); c.moveTo(-5.5, -4); c.lineTo(5.5, -4); c.lineTo(4, -12); c.quadraticCurveTo(0, -17, -4, -12); c.closePath(); c.fill(); c.stroke(); c.restore();
      if (info.tap) drawLabel(c, 'tap to dig!', CW / 2, CH / 2 + 22, 10, '#fff3b0'); else { drawAcorn(c, CW / 2 - 15, CH / 2 + 19, .9); drawLabel(c, fmtN(info.cost), CW / 2 + 5, CH / 2 + 23, 11, st.acorns >= info.cost ? '#fff6e4' : '#ffb0a0'); }
    }
  }
  function drawDigging(c, d, t) {
    var prog = d.end == null ? d.taps / D.DIG.tapsPerFreeDig : Math.min(1, 1 - (d.end - now()) / d.total);
    var sd = podSeed(d.x, d.y); A.podSketch(c, CW, CH, sd, t, false);
    c.save(); A.podPath(c, CW, CH, sd, 7); c.clip(); c.beginPath(); c.rect(0, CH * (1 - prog), CW, CH); c.clip(); A.drawEmptyCell(c, t, CW, CH, false); A.podVignette(c, CW, CH); c.restore();
    c.save(); c.translate(CW / 2 - 6, CH - 14); A.drawCritter(c, D.CRITTER_BY_ID.truffle.look, { t: t, x: 0, y: 0, dir: 1, walk: 1, seed: 3, scale: .95 }); c.restore();
    if (Math.random() < .12) fx('dirt', cellX(d.x) + CW / 2 + 8, cellY(d.y) + CH - 24);
    c.fillStyle = 'rgba(0,0,0,.4)'; A.rr(c, 10, 8, CW - 20, 16, 8); c.fill();
    drawLabel(c, d.end == null ? 'tap! ' + d.taps + '/' + D.DIG.tapsPerFreeDig : fmtDur(d.end - now()), CW / 2, 20, 11, '#fff3b0');
  }
  function drawVisitors(c, t) {
    var vs = st.visitors; if (!vs.length) return;
    vs.slice(0, 5).forEach(function (v, i) {
      var cr = D.CRITTER_BY_ID[v.critter], x = DOOR_X + 46 + i * 25, y = GROUND - 12 + (i % 2) * 3;
      c.save(); c.translate(x, y); A.drawCritter(c, cr.look, { t: t, x: 0, y: 0, dir: -1, walk: 0, seed: i * 3, scale: .8 }); c.restore();
      var bubY = y - 40 + Math.sin(t * 4 + i) * 2; c.save(); c.translate(x, bubY); A.rr(c, -8, -8, 16, 16, 8); A.fillStroke(c, v.rare ? '#ffe28a' : '#fff8ea', v.rare ? '#d9962a' : '#e3cfae', 1.4); c.font = '700 11px Fredoka'; c.textAlign = 'center'; c.fillStyle = v.rare ? '#b36a00' : '#e0554a'; c.fillText('!', 0, 4); c.restore();
      if (v.rare && Math.random() < .12) fx('burst', x, y - 14, { n: 1, col: '#fff3b0' });
    });
    if (vs.length > 5) drawLabel(c, '+' + (vs.length - 5), DOOR_X + 46 + 5 * 25, GROUND - 10, 11);
  }

  // ---------- main loop ----------
  var lastFrame = 0, lastSecond = 0;
  function frame(ts) {
    var dt = Math.min(.05, (ts - lastFrame) / 1000 || .016); lastFrame = ts; clock += dt;
    if (!doc.hidden && st) {
      var d = new Date(now()); hourNow = forceHour != null ? forceHour : d.getHours() + d.getMinutes() / 60; seasonNow = forceSeason || D.seasonOf(d, st.settings.southern);
      if (clock - lastSecond >= 1) { lastSecond = clock; secondly(); }
      if (view.target != null) { view.cam += (view.target - view.cam) * Math.min(1, dt * 6); if (Math.abs(view.target - view.cam) < .5) view.target = null; }
      if (Math.abs(view.vel) > .02) { view.cam += view.vel * dt * 60; view.vel *= .94; clampCam(); }
      if (shownAcorns != null && Math.floor(shownAcorns) !== Math.floor(st.acorns)) { var gap = st.acorns - shownAcorns; shownAcorns += Math.abs(gap) < 1 ? gap : (gap > 0 ? Math.max(1, gap * Math.min(1, dt * 7)) : gap * Math.min(1, dt * 12)); if (Math.abs(st.acorns - shownAcorns) < 1) shownAcorns = st.acorns; refreshHud(); }
      updateTutorialArrow(); syncActors(dt); stepParticles(dt); drawScene();
      if (sheet && sheet.anim) sheet.anim();
    }
    root.requestAnimationFrame(frame);
  }
  function secondly() {
    var ev = S.tick(st, now());
    if (ev.length) handleEvents(ev);
    var tev = S.tutorialAdvance(st, now()); if (tev.length) handleEvents(tev);
    checkLevel();
    refreshHud(); if (sheet && sheet.render && sheet.live) renderSheet();
    AU.setNight(A.nightness(hourNow)); var rh0 = S.rareHint(st, now()); rareTeaseOn = !!(rh0.guaranteed && rh0.tonight && rh0.unlocked && st.tut >= 5 && hourNow >= 15 && hourNow < 21);
    if (dirty && clock - lastSave > 3) save();
  }
  function handleEvents(ev) {
    ev.forEach(function (e) {
      if (e.t === 'digDone') { snd('dig-done'); fx('burst', cellX(e.x) + CW / 2, cellY(e.y) + CH / 2, { n: 14 }); toast('Your new tunnel is finished!'); dirtyUp(); }
      else if (e.t === 'visitor') { snd(e.rare ? 'chime' : 'knock'); var cr = D.CRITTER_BY_ID[e.v.critter]; toast(e.rare ? '✨ A rare guest is at the door: <b>' + esc(cr.name) + '</b>' : '🚪 <b>' + esc(cr.name) + '</b> is at the door'); dirtyUp(); }
      else if (e.t === 'giftReady' || e.t === 'basketFull' || e.t === 'newDay') dirtyUp();
      else if (e.t === 'tutVisitor') { snd('knock'); toast('🚪 Someone is knocking!'); dirtyUp(); }
      else if (e.t === 'tutMoveIn') { var f = S.findRoom(st, 'farm'); if (f) { fx('burst', cellX(f.x) + 45, cellY(f.y) + 50, { n: 16 }); fx('heart', cellX(f.x) + 45, cellY(f.y) + 40, { n: 4 }); } snd('arrive'); toast('🐾 <b>Truffle</b> the mole moved in!'); dirtyUp(); }
      else if (e.t === 'tutDone') { dirtyUp(); setTimeout(tutorialFinale, 700); }
    });
  }

  // ---------- HUD ----------
  var lastHud = '';
  function refreshHud() {
    var lp = S.levelProgress(st);
    if (shownAcorns == null || calm()) shownAcorns = st.acorns; var a = '<span>' + ic('acorn') + '</span><b>' + fmtN(shownAcorns) + '</b>', b = ic('berry') + '<b>' + fmtN(st.berries) + '</b>';
    var l = 'Lv ' + lp.level + '<span class="lvl-bar"><i style="width:' + Math.round(lp.pct * 100) + '%"></i></span>';
    var key = a + b + l; if (key !== lastHud) {
      var ac = $('chip-acorn'), bc = $('chip-berry'); ac.dataset.v = Math.floor(shownAcorns); ac.innerHTML = a; bc.innerHTML = b; $('chip-level').innerHTML = l; lastHud = key;
    }
    var tr = totalReady(), fab = $('btn-collect');
    if ((tr.goods >= 1 || tr.gifts) && !sheet && st.tut >= 3) { fab.classList.remove('hidden'); fab.innerHTML = ic('basket') + ' Collect all <small>+' + fmtN(tr.acorns) + '</small>'; } else fab.classList.add('hidden');
    var door = $('tab-door'); if (door) { var nb = door.querySelector('.badge'), n = st.visitors.length + (S.dailyAvailable(st, now()) && st.tut >= 5 ? 1 : 0); if (n && !nb) door.insertAdjacentHTML('beforeend', '<span class="badge">' + n + '</span>'); else if (n && nb) nb.textContent = n; else if (nb) nb.remove(); }
    var alb = $('tab-album'); if (alb) { var ab = alb.querySelector('.badge'), rn = S.albumMilestones(st).filter(function (m) { return m.ready; }).length; if (rn && !ab) alb.insertAdjacentHTML('beforeend', '<span class="badge">' + rn + '</span>'); else if (!rn && ab) ab.remove(); }
    updateHint();
  }
  function buildTabs() {
    var tabs = [['burrow', 'shovel', 'Burrow'], ['door', 'door', 'Door'], ['album', 'book', 'Album'], ['nook', 'cart', 'Nook'], ['settings', 'gear', 'More']];
    $('tabbar').innerHTML = tabs.map(function (t) { return '<button class="tab' + (t[0] === 'burrow' ? ' on' : '') + '" id="tab-' + t[0] + '" data-tab="' + t[0] + '">' + ic(t[1]) + t[2] + '</button>'; }).join('');
  }
  function setTab(name) { [].forEach.call(doc.querySelectorAll('.tab'), function (b) { b.classList.toggle('on', b.dataset.tab === name); }); }

  // ---------- tutorial ----------
  var HINTS = {
    0: 'Tap the glowing soil to dig your first tunnel.',
    1: 'Lovely! Tap the empty chamber to build your first room: a Mushroom Farm.',
    2: 'Truffle moved in! Tap the basket to collect your first mushrooms.',
    3: 'Someone is knocking. Tap the door and give them what they ask for.',
    4: 'Dig one more tunnel to make room for new friends.'
  };
  function introOpen() { return !$('intro').classList.contains('hidden'); }
  function updateHint() {
    var h = $('hint');
    if (st.tut < 5 && !sheet && !introOpen()) { h.classList.remove('hidden', 'soft'); h.removeAttribute('data-act'); if (h.textContent !== HINTS[st.tut]) h.textContent = HINTS[st.tut]; }
    else if (st.tut >= 5 && !sheet && !introOpen()) { var tl = teaserLine(now()); if (tl) { h.classList.remove('hidden'); h.classList.add('soft'); h.setAttribute('data-act', 'open-door'); if (h.dataset.html !== tl) { h.dataset.html = tl; h.innerHTML = tl; } } else h.classList.add('hidden'); }
    else h.classList.add('hidden');
  }
  function updateTutorialArrow() {
    tutArrow = null; if (st.tut >= 5 || sheet || introOpen()) return;
    var tx, ty;
    if (st.tut === 0 || st.tut === 4) {
      var pend = st.digs[0]; if (pend) { tx = cellX(pend.x) + CW / 2; ty = cellY(pend.y) + 34; }
      else { var best = null; for (var y = 0; y < ROWS && !best; y++) for (var x = 0; x < COLS; x++) if (S.canDigCell(st, x, y) && D.stratumForRow(y).level <= S.level(st)) { best = [x, y]; break; } if (best) { tx = cellX(best[0]) + CW / 2; ty = cellY(best[1]) + 34; } }
    } else if (st.tut === 1) { var e = null; for (var k in st.cells) { var cc = st.cells[k]; if (cc.dug && !cc.foyer && !cc.room) { var p = k.split(','); e = [+p[0], +p[1]]; } } if (e) { tx = cellX(e[0]) + CW / 2; ty = cellY(e[1]) + 40; } }
    else if (st.tut === 2) { var f = S.findRoom(st, 'farm'); if (f) { tx = cellX(f.x) + CW - 24; ty = cellY(f.y) + 30; } }
    else if (st.tut === 3) { tx = DOOR_X + 40; ty = GROUND - 62; }
    if (tx != null) { tutArrow = { x: tx, y: ty }; var key = st.tut + ':' + ty; if (view.followed !== key) { view.followed = key; scrollTo(ty - 40); } }
  }
  function tutorialFinale() {
    openSheet({ title: 'See you soon! 🌙', html: '<p>Your burrow keeps working while you are away. Baskets fill up (they hold a few hours) and friends knock at the door a few times a day.</p>' + (function () { var t = now(), ups = S.nextUps(st, t).filter(function (u) { return u.kind !== 'gift'; }).slice(0, 3); return ups.length ? '<div class="card col"><b>Come back around:</b>' + ups.map(function (u) { return '<div class="row sp up"><span>' + (UP_ICON[u.kind] || '') + ' ' + esc(u.text) + '</span><b>' + whenLabel(u.at, t) + '</b></div>'; }).join('') + '</div>' : ''; })() + '<p class="mut">Crumb is waiting for a Bakery, and tomorrow brings a visit gift. There is never a rush: nothing is lost if you take a day off.</p>' + (P.Notify.supported ? '<div class="row"><button class="btn gold" data-act="notif-on">Remind me gently</button><button class="btn plain" data-act="close">Not now</button></div>' : '<button class="btn" data-act="close">Cosy!</button>'), kind: 'finale' });
  }
  function levelUp(L) {
    snd('levelup'); dirtyUp(); var unlocked = D.ROOMS.filter(function (r) { return r.unlock === L; }); var strata = D.GRID.strata.filter(function (s) { return s.level === L; });
    var line = (unlocked.length ? '<p>New room: <b>' + esc(unlocked[0].name) + '</b>. ' + esc(unlocked[0].blurb) + '</p>' : '') + (strata.length ? '<p>You can now dig into <b>' + esc(strata[0].name) + '</b>.</p>' : '');
    if (st.tut >= 5 && !sheet) openSheet({ title: 'Burrow Level ' + L + '!', html: '<div style="text-align:center;font-size:46px">🎉</div>' + line + '<button class="btn" data-act="close">Wonderful</button>', kind: 'levelup' });
    else toast('Burrow Level <b>' + L + '</b>!' + (unlocked.length ? ' New room: ' + esc(unlocked[0].name) : ''));
  }

  // ---------- sheets ----------
  function openSheet(o) {
    closeSheet(true);
    $('sheet-root').innerHTML = '<div class="scrim" data-act="close"></div><div class="sheet' + (o.full ? ' full' : '') + '"><div class="sheet-head"><h2></h2><button class="x" data-act="close" aria-label="Close">✕</button></div><div class="sheet-body"></div></div>';
    sheet = o; renderSheet(); $('hint').classList.add('hidden'); $('btn-collect').classList.add('hidden');
  }
  function renderSheet() {
    if (!sheet) return; var el = $('sheet-root').querySelector('.sheet-body'); if (!el) return;
    var scroll = el.scrollTop; var html = sheet.render ? sheet.render() : sheet.html;
    $('sheet-root').querySelector('h2').innerHTML = esc(sheet.title);
    el.innerHTML = html; el.scrollTop = scroll; portraits = []; [].forEach.call(el.querySelectorAll('canvas[data-critter]'), function (cv) { portrait(cv); });
  }
  function closeSheet(quiet) { if (!sheet) return; $('sheet-root').innerHTML = ''; sheet = null; portraits = []; if (!quiet) { setTab('burrow'); refreshHud(); } }
  function portrait(cv) {
    var cr = D.CRITTER_BY_ID[cv.dataset.critter], sil = cv.dataset.sil === '1', sz = cv.clientWidth || 84, px = Math.round(sz * 2); cv.width = px; cv.height = px;
    var c = cv.getContext('2d'); c.clearRect(0, 0, px, px);
    var draw = function (cc) { cc.save(); var sc = px / 56; cc.scale(sc, sc); A.drawCritter(cc, cr.look, { t: 0.4, x: 28, y: 47, dir: 1, walk: 0, seed: 1 }); cc.restore(); };
    if (sil) { var tmp = doc.createElement('canvas'); tmp.width = px; tmp.height = px; var tc = tmp.getContext('2d'); draw(tc); tc.globalCompositeOperation = 'source-in'; tc.fillStyle = '#6e5a48'; tc.fillRect(0, 0, px, px); c.globalAlpha = .55; c.drawImage(tmp, 0, 0); c.globalAlpha = 1; }
    else { if (cv.dataset.anim === '1') portraits.push(cv); draw(c); }
  }
  function animatePortraits() { portraits.forEach(function (cv) { if (!cv.isConnected) return; var cr = D.CRITTER_BY_ID[cv.dataset.critter], px = cv.width, c = cv.getContext('2d'); c.clearRect(0, 0, px, px); c.save(); var sc = px / 56; c.scale(sc, sc); A.drawCritter(c, cr.look, { t: clock, x: 28, y: 47, dir: 1, walk: 0, seed: 1 }); c.restore(); }); }

  function critterPill(c) { var r = D.RARITY[c.rarity]; return '<span class="pill" style="background:' + r.color + '">' + r.name + '</span>'; }
  function roomSheet(cx, cy) {
    return { title: D.ROOM_BY_ID[S.cellAt(st, cx, cy).room.id].name, kind: 'room', live: true, anim: animatePortraits, render: function () {
      var cell = S.cellAt(st, cx, cy), r = cell.room, def = D.ROOM_BY_ID[r.id], t = now(), rd = S.ready(r, t), cap = S.roomCap(r), rate = S.roomRate(r), g = G[def.good], n = Math.floor(rd);
      var u = S.upgradeInfo(st, r), beds = S.roomBeds(r), html = '<p class="mut" style="margin:0 0 6px">' + esc(def.blurb) + '</p>';
      html += '<div class="card col"><div class="row sp"><b>' + g.icon + ' ' + g.name + ' basket</b><span class="mut">' + n + ' / ' + Math.floor(cap) + '</span></div><div class="bar"><i style="width:' + Math.min(100, rd / cap * 100) + '%"></i></div><div class="row sp mut"><span>' + fmtN(rate) + ' per hour · holds ' + D.ROOM_LEVELS.capHours[r.lvl - 1] + 'h</span><span>' + (rd >= cap - .01 ? 'Full' : 'Full in ' + fmtDur(S.timeToFull(r, t))) + '</span></div>';
      html += '<div class="row"><button class="btn ' + (n < 1 ? 'off' : '') + '" data-act="collect" data-x="' + cx + '" data-y="' + cy + '">' + ic('basket') + ' Collect ' + (n ? '+' + fmtN(n * g.value) + ' 🌰' : '') + '</button>';
      if (ADS.available()) html += '<button class="btn sky small ' + (n < 5 || S.adsLeft(st) < 1 || st.ads.doubles >= D.ADS.doubleHarvest ? 'off' : '') + '" data-act="ad-double" data-x="' + cx + '" data-y="' + cy + '">▶ Double it</button>';
      html += '</div>';
      if (ADS.available()) html += '<div class="mut" style="font-size:12px">Optional: a short sunny break doubles one basket (' + (D.ADS.doubleHarvest - st.ads.doubles) + ' left today).</div></div>';
      if (r.giftReady) html += '<div class="card"><div class="grow"><h3>🎁 A gift is waiting</h3><p>Your residents left something for you.</p></div><button class="btn gold small" data-act="gift" data-x="' + cx + '" data-y="' + cy + '">Open</button></div>';
      else if (r.critters.length) html += '<p class="mut">Next gift in ' + fmtDur(r.giftAt - t) + '</p>';
      html += '<div class="sec">Residents · ' + r.critters.length + ' / ' + beds + ' beds</div>';
      if (!r.critters.length) html += '<p class="mut">Nobody lives here yet. Friends who like the ' + esc(def.name) + ' will drop by the door.</p>';
      r.critters.forEach(function (id) { var cr = D.CRITTER_BY_ID[id]; html += '<div class="card" data-act="critter" data-id="' + id + '"><canvas class="cv sm" data-critter="' + id + '" data-anim="1"></canvas><div class="grow"><h3>' + esc(cr.name) + ' ' + critterPill(cr) + '</h3><p>' + esc(cr.trait) + ' · +' + Math.round(D.RARITY[cr.rarity].bonus * 100) + '% ' + g.name + '</p></div></div>'; });
      var hope = D.CRITTERS.filter(function (c) { return c.room === r.id && !(st.album[c.id] && st.album[c.id].resident); }).length; if (hope && r.critters.length < beds) html += '<p class="mut">' + hope + ' more friends like this room.</p>';
      if (u) { var okA = st.acorns >= u.acorns, okG = (st.goods[u.good] || 0) >= u.goods; html += '<div class="sec">Upgrade to level ' + u.toLevel + '</div><div class="card col"><div class="row sp"><span>' + ic('acorn') + ' <span class="' + (okA ? '' : 'need') + '">' + fmtN(u.acorns) + '</span></span><span>' + g.icon + ' <span class="' + (okG ? '' : 'need') + '">' + (st.goods[u.good] || 0) + ' / ' + u.goods + '</span></span></div><p class="mut" style="margin:0">+60% output, bigger basket (' + D.ROOM_LEVELS.capHours[r.lvl] + 'h)' + (D.ROOM_LEVELS.beds[r.lvl] > beds ? ', one more bed' : '') + '.</p><button class="btn gold ' + (okA && okG ? '' : 'off') + '" data-act="upgrade" data-x="' + cx + '" data-y="' + cy + '">Upgrade</button></div>'; }
      else html += '<p class="mut">Fully furnished. Lovely.</p>';
      return html;
    } };
  }
  function buildSheet(cx, cy) {
    return { title: 'Build a room', kind: 'build', live: true, render: function () {
      var html = '<p class="mut" style="margin:0">Each room attracts its own kind of critter and makes its own goods.</p>';
      D.ROOMS.forEach(function (def) {
        var bi = S.buildInfo(st, def.id); if (bi.built) return; var ok = bi.unlocked && st.acorns >= bi.cost, g = G[def.good], theme = A.ROOM_THEME[def.id];
        var friends = D.CRITTERS.filter(function (c) { return c.room === def.id; });
        html += '<div class="card"><div class="cv sm" style="background:linear-gradient(' + theme.wall + ',' + theme.wall2 + ');display:flex;align-items:center;justify-content:center;font-size:26px">' + g.icon + '</div><div class="grow"><h3>' + esc(def.name) + '</h3><p>' + (bi.unlocked ? esc(def.blurb) + ' Makes ' + g.name + '. ' + friends.length + ' friends to meet.' : '🔒 Unlocks at Burrow Level ' + def.unlock) + '</p></div>' +
          (bi.unlocked ? '<button class="btn ' + (ok ? 'gold' : 'off') + ' small" data-act="build" data-room="' + def.id + '" data-x="' + cx + '" data-y="' + cy + '">' + (bi.cost ? ic('acorn') + ' ' + fmtN(bi.cost) : 'Free') + '</button>' : '') + '</div>';
      });
      return html;
    } };
  }
  function digSheet(cx, cy) {
    return { title: 'Dig a tunnel', kind: 'dig', live: true, render: function () {
      var pend = st.digs.filter(function (d) { return d.x === cx && d.y === cy; })[0], t = now();
      if (pend) {
        var left = pend.end - t, bc = S.digBerryCost(pend, t), html = '<div class="card col"><div class="row sp"><b>⛏ Digging…</b><span>' + fmtDur(left) + '</span></div><div class="bar green"><i style="width:' + Math.min(100, (1 - left / pend.total) * 100) + '%"></i></div><p class="mut" style="margin:0">Your moles are on it. You can close this and come back, it finishes by itself.</p></div>';
        html += '<div class="row">' + (ADS.available() ? '<button class="btn sky ' + (S.adsLeft(st) < 1 ? 'off' : '') + '" data-act="ad-dig">▶ Half the time</button>' : '') + '<button class="btn gold ' + (st.berries >= bc ? '' : 'off') + '" data-act="skip-dig" data-x="' + cx + '" data-y="' + cy + '">' + ic('berry') + ' Finish now · ' + bc + '</button></div><div class="mut" style="font-size:12px;margin-top:6px">Both are optional. Waiting is free.</div>';
        return html;
      }
      var info = S.digInfo(st, cx, cy), sr = info.stratum, lock = S.level(st) < sr.level, busy = st.digs.length >= S.maxDigs(st);
      var h2 = '<div class="card col"><div class="row sp"><b>' + sr.name + '</b><span class="mut">Row ' + (cy + 1) + '</span></div><div class="row sp"><span>' + ic('acorn') + ' <span class="' + (st.acorns >= info.cost ? '' : 'need') + '">' + fmtN(info.cost) + '</span></span><span>⏱ ' + (info.seconds ? fmtDur(info.seconds * 1000) : 'a few taps') + '</span></div>';
      if (lock) h2 += '<p class="need" style="margin:0">🔒 Reach Burrow Level ' + sr.level + ' to dig into ' + sr.name + '.</p>';
      else if (busy) h2 += '<p class="mut" style="margin:0">One tunnel at a time for now. Burrow Level 6 lets you dig two.</p>';
      h2 += '<button class="btn gold ' + (lock || busy || st.acorns < info.cost ? 'off' : '') + '" data-act="dig" data-x="' + cx + '" data-y="' + cy + '">⛏ Dig</button></div>';
      return h2;
    } };
  }
  function doorSheet() {
    return { title: 'At the door', kind: 'door', live: true, anim: animatePortraits, render: function () {
      var t = now(), html = '';
      if (S.dailyAvailable(st, t)) {
        var idx = st.daily.index % 7; html += '<div class="card col"><div class="row sp"><b>' + ic('gift') + ' Daily visit gift</b><span class="mut">Visit day ' + st.visitDays + '</span></div><div class="cal">' + D.DAILY.map(function (d, i) { var lab = d.acorns ? d.acorns + '🌰' : d.berries ? d.berries + '🫐' : '📦'; return '<div class="day ' + (i < idx ? 'done' : i === idx ? 'today' : '') + '"><b>' + (i + 1) + '</b>' + lab + '</div>'; }).join('') + '</div><button class="btn gold" data-act="daily">Claim today\'s gift</button><p class="mut" style="margin:0">Skipped days never reset your calendar.</p></div>';
      } else { var tg = S.tomorrowGift(st, t), tl = tg.reward.acorns ? tg.reward.acorns + ' 🌰' : tg.reward.berries ? tg.reward.berries + ' 🫐' : tg.reward.goods + ' goods 📦'; html += '<p class="mut" style="margin:0 0 4px">' + ic('gift') + ' Today\'s gift is claimed. <b>Tomorrow, day ' + tg.day + ': ' + tl + '</b>' + (tg.reward.label ? ' (' + esc(tg.reward.label) + ')' : '') + '</p>'; }
      html += '<div class="sec">Waiting friends · ' + st.visitors.length + '</div>';
      if (!st.visitors.length) html += '<p class="mut">Nobody at the door right now. Friends drop by around 9:00, 14:00 and 19:00, and sometimes late in the evening.</p>';
      st.visitors.forEach(function (v) {
        var cr = D.CRITTER_BY_ID[v.critter], have = st.goods[v.good] || 0, ok = have >= v.n, g = G[v.good], a = st.album[v.critter];
        html += '<div class="card"><canvas class="cv" data-critter="' + v.critter + '" data-anim="1"></canvas><div class="grow"><h3>' + esc(cr.name) + ' ' + critterPill(cr) + (v.rare ? ' ✨' : '') + '</h3><p>"' + esc(a ? cr.quote : 'Hello! May I trouble you for some ' + g.name.toLowerCase() + '?') + '"</p><p><b>Wants ' + g.icon + ' ' + v.n + '</b> <span class="' + (ok ? 'mut' : 'need') + '">(you have ' + have + ')</span></p>' + (!S.hasRoom(st, cr.room) ? '<p class="mut">Would love a ' + esc(D.ROOM_BY_ID[cr.room].name) + '.</p>' : '') + '</div><button class="btn ' + (ok ? 'gold' : 'off') + ' small" data-act="give" data-id="' + v.id + '">Give</button></div>';
      });
      var ups = S.nextUps(st, t).slice(0, 4);
      if (ups.length) html += '<div class="sec">Coming up</div><div class="card col">' + ups.map(function (u) { return '<div class="row sp up' + (u.guaranteed ? ' rare' : '') + '"><span>' + (UP_ICON[u.kind] || '') + ' ' + esc(u.text) + '</span><b>' + whenLabel(u.at, t) + '</b></div>'; }).join('') + '</div>';
      var rh = S.rareHint(st, t);
      if (rh.unlocked && st.tut >= 5) html += '<div class="card col"><div class="row sp"><b>✨ Late-night guest</b><span class="mut">21:00</span></div><p style="margin:0">' + (rh.guaranteed ? 'A rare guest is due tonight. Leave the lantern on!' : 'Each evening there is a ' + Math.round(rh.chance * 100) + '% chance that someone rare drops by. Quiet nights make it likelier.') + '</p><div class="bar"><i style="width:' + Math.min(100, rh.quietDays / rh.pityDays * 100) + '%;background:linear-gradient(#e0c5ff,#b48be0)"></i></div><div class="mut" style="font-size:12px">' + (rh.guaranteed ? 'Guaranteed tonight' : rh.quietDays + ' / ' + rh.pityDays + ' quiet days until a guaranteed visit') + '</div></div>';
      html += '<div class="sec">Season</div>'; var sd = st.season.days, seasonName = seasonNow[0].toUpperCase() + seasonNow.slice(1);
      html += '<div class="card col"><div class="row sp"><b>' + seasonName + ' visit gift</b><span class="mut">' + Math.min(5, sd) + ' / 5 days</span></div><div class="bar green"><i style="width:' + Math.min(100, sd / 5 * 100) + '%"></i></div>' + (sd >= 5 && !st.season.claimed ? '<button class="btn gold" data-act="season-gift">Claim a free ' + seasonName.toLowerCase() + ' decoration</button>' : '<p class="mut" style="margin:0">Visit on 5 different days this season for a free decoration. No streak needed.</p>') + '</div>';
      if (ADS.available()) html += '<div class="card"><div class="grow"><h3>🔔 Wanderer\'s bell</h3><p>Ring it to invite one extra guest today (optional, once a day).</p></div><button class="btn sky small ' + (S.adsLeft(st) < 1 || st.ads.bell >= 1 || st.visitors.length >= D.VISITORS.maxWaiting ? 'off' : '') + '" data-act="ad-bell">▶ Ring</button></div>';
      return html;
    } };
  }
  var album = { filter: 'all' };
  function albumSheet() {
    return { title: 'Critter album', kind: 'album', full: true, render: function () {
      var met = S.albumCount(st), res = Object.keys(st.album).filter(function (k) { return st.album[k].resident; }).length;
      var html = '<div class="card col"><div class="row sp"><b>' + met + ' / ' + D.CRITTERS.length + ' met</b><span class="mut">' + res + ' living here</span></div><div class="bar green"><i style="width:' + (met / D.CRITTERS.length * 100) + '%"></i></div>' + (function () { var n = S.albumNudge(st); return n.next ? '<p class="mut" style="margin:0">' + n.next.need + ' more friend' + (n.next.need > 1 ? 's' : '') + ' → <b>🫐' + n.next.berries + (n.next.acorns ? ' +' + fmtN(n.next.acorns) + '🌰' : '') + '</b></p>' : '<p class="mut" style="margin:0">Every friend is in your album. 💛</p>'; })() + '<div class="row" style="flex-wrap:wrap;gap:6px">' + S.albumMilestones(st).map(function (m) { return '<button class="btn small ' + (m.ready ? 'gold' : 'plain off') + '" data-act="album-claim" data-at="' + m.at + '">' + (m.claimed ? '✓ ' : '') + m.at + ' → ' + m.berries + '🫐' + (m.acorns ? ' +' + fmtN(m.acorns) + '🌰' : '') + '</button>'; }).join('') + '</div></div>';
      var filters = [['all', 'All'], ['met', 'Met'], ['home', 'Living here']].concat(Object.keys(D.RARITY).map(function (r) { return [r, D.RARITY[r].name]; }));
      html += '<div class="chips2">' + filters.map(function (f) { return '<button class="chip2 ' + (album.filter === f[0] ? 'on' : '') + '" data-act="album-filter" data-f="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div><div class="grid3">';
      D.CRITTERS.filter(function (c) { var a = st.album[c.id]; if (album.filter === 'met') return !!a; if (album.filter === 'home') return a && a.resident; if (D.RARITY[album.filter]) return c.rarity === album.filter; return true; }).forEach(function (c) {
        var a = st.album[c.id], r = D.RARITY[c.rarity];
        html += '<div class="acard ' + (a ? '' : 'un') + '" data-act="critter" data-id="' + c.id + '"><span class="dot" style="background:' + r.color + '"></span>' + (a && a.resident ? '<span class="home">🏠</span>' : '') + '<canvas data-critter="' + c.id + '" data-sil="' + (a ? 0 : 1) + '"></canvas><div class="nm">' + (a ? esc(c.name) : '???') + '</div>' + (!a ? '<div class="sub">' + (S.hasRoom(st, c.room) ? '⏳ may knock soon' : esc(D.ROOM_BY_ID[c.room].name)) + '</div>' : '') + '</div>';
      });
      return html + '</div>';
    } };
  }
  function critterSheet(id) {
    return { title: (st.album[id] ? D.CRITTER_BY_ID[id].name : 'Mystery friend'), kind: 'critter', live: false, anim: animatePortraits, render: function () {
      var c = D.CRITTER_BY_ID[id], a = st.album[id], room = D.ROOM_BY_ID[c.room];
      var html = '<div style="text-align:center"><canvas class="cv" style="width:150px;height:150px" data-critter="' + id + '" data-sil="' + (a ? 0 : 1) + '" data-anim="' + (a ? 1 : 0) + '"></canvas></div>';
      if (!a) return html + '<p style="text-align:center">' + critterPill(c) + '</p><p class="mut" style="text-align:center">Not met yet. They like the <b>' + esc(room.name) + '</b>' + (S.hasRoom(st, c.room) ? '. Keep an eye on the door!' : ', which you haven\'t built yet.') + '</p>';
      return html + '<p style="text-align:center;margin:4px 0">' + esc(c.species) + ' · ' + critterPill(c) + '</p><div class="card col"><p style="margin:0"><b>' + esc(c.trait) + '</b></p><p style="margin:0">"' + esc(c.quote) + '"</p></div><div class="card"><div class="grow"><h3>Loves the ' + esc(room.name) + '</h3><p>Boosts ' + G[room.good].name + ' by ' + Math.round(D.RARITY[c.rarity].bonus * 100) + '% when living there.</p></div></div>' + (function () {
        if (!a.resident && !(a.hearts > 0)) return ''; var h = a.hearts || 0, lv = S.heartLevel(h), nx = D.FRIENDSHIP.hearts[lv], out = '<div class="card col"><div class="row sp"><b>' + heartsRow(lv, 3) + ' ' + D.FRIENDSHIP.names[lv] + '</b><span class="mut">' + (nx ? h + ' / ' + nx + ' gifts' : 'maxed') + '</span></div>';
        for (var i = 1; i <= 3; i++) out += i <= lv ? '<p style="margin:0">' + heartsRow(i, i) + ' ' + esc(S.storyLine(id, i)) + '</p>' : '<p class="mut" style="margin:0;opacity:.7">🔒 Story ' + i + ': keep collecting their gifts (' + D.FRIENDSHIP.hearts[i - 1] + ')</p>';
        return out + '</div>';
      })() + '<p class="mut" style="text-align:center">' + (a.resident ? '🏠 Living in your ' + esc(room.name) : 'Waiting for a free bed in the ' + esc(room.name)) + ' · met ' + a.visits + ' time' + (a.visits === 1 ? '' : 's') + '</p>';
    } };
  }
  function nookSheet() {
    return { title: 'The Nook', kind: 'nook', live: true, render: function () {
      var html = '<div class="row sp"><span class="mut">' + ic('berry') + ' Glowberries are for cosy extras. Nothing here is needed to progress.</span></div>';
      if (ADS.available()) html += '<div class="sec">Sunny breaks (optional)</div>' + '<div class="card"><div class="grow"><h3>' + ic('berry') + ' A free Glowberry</h3><p>Watch a short break · ' + (D.ADS.berryPerDay - st.ads.berry) + ' left today</p></div><button class="btn sky small ' + (st.ads.berry >= D.ADS.berryPerDay || S.adsLeft(st) < 1 ? 'off' : '') + '" data-act="ad-berry">▶ Watch</button></div>';
      html += '<div class="sec">Decorations</div><p class="mut" style="margin:0 0 4px">Purely cosmetic. They show up above ground and add a little cosiness.</p>';
      D.DECOR.forEach(function (d) { var own = st.decor.owned[d.id], placed = st.decor.placed[d.id], cur = d.season === seasonNow; html += '<div class="card"><div class="cv sm" style="display:flex;align-items:center;justify-content:center;font-size:26px">' + d.icon + '</div><div class="grow"><h3>' + esc(d.name) + (cur ? ' <span class="pill" style="background:#e08a3a">in season</span>' : '') + '</h3><p>' + (d.season === 'any' ? 'Any time' : d.season[0].toUpperCase() + d.season.slice(1)) + (d.supporter ? ' · Supporter gift' : '') + '</p></div>' + (own ? '<button class="btn plain small" data-act="decor-toggle" data-id="' + d.id + '">' + (placed ? 'Hide' : 'Show') + '</button>' : d.supporter ? '<span class="mut">🔒</span>' : '<button class="btn gold small ' + (st.berries >= d.price ? '' : 'off') + '" data-act="decor-buy" data-id="' + d.id + '">' + ic('berry') + ' ' + d.price + '</button>') + '</div>'; });
      if (!IAP.shopVisible()) return html;
      html += '<div class="sec">Glowberry baskets' + (IAP.simulated ? ' <span class="test-badge">Test mode: no real payment</span>' : '') + '</div>';
      if (IAP.mode === 'unavailable' || (IAP.mode === 'store' && !IAP.ready)) return html + '<p class="mut">The shop isn\'t available right now. Your burrow works the same without it.</p>';
      D.PRODUCTS.forEach(function (p) { var owned = p.oneTime && st.supporter, price = IAP.price(p); if (!price && !owned) return; html += '<div class="card"><div class="cv sm" style="display:flex;align-items:center;justify-content:center">' + ic(p.kind === 'supporter' ? 'heart' : 'berry') + '</div><div class="grow"><h3>' + esc(p.name) + '</h3><p>' + (p.desc || p.berries + ' Glowberries') + '</p></div><button class="btn gold small ' + (owned ? 'off' : '') + '" data-act="buy" data-sku="' + p.sku + '">' + (owned ? 'Owned' : esc(price)) + '</button></div>'; });
      html += '<p class="mut" style="font-size:12px">' + (IAP.mode === 'store' ? 'Prices include tax and are set by your app store.' : 'Test prices in USD; the stores show local prices.') + ' Purchases never speed up your burrow beyond what waiting does, and there are no loot boxes or timers designed to pressure you.</p>';
      return html;
    } };
  }
  function settingsSheet() {
    return { title: 'More', kind: 'settings', live: false, render: function () {
      var s = st.settings;
      function sw(label, key, act) { return '<div class="switch"><span>' + label + '</span><button class="tog ' + (s[key] ? 'on' : '') + '" data-act="' + act + '" aria-label="' + label + '"></button></div>'; }
      var html = sw('Sound effects', 'sound', 'set-sound') + sw('Music', 'music', 'set-music') + sw('Southern hemisphere seasons', 'southern', 'set-south') + sw('Gentle reminders' + (P.Notify.supported ? '' : ' (in the app)'), 'notifications', 'set-notif') + sw('Reduce motion', 'reduceMotion', 'set-motion');
      html += '<div class="sec">Your burrow</div><div class="row"><button class="btn plain small" data-act="export">Back-up code</button><button class="btn plain small" data-act="import">Restore</button><button class="btn plain small" data-act="reset">Start over</button></div><div id="codebox"></div>';
      html += '<div class="sec">Privacy and help</div><div class="row wrap">' + (ADS.privacyRequired ? '<button class="btn plain small" data-act="privacy-choices">Privacy choices</button>' : '') + (IAP.mode === 'store' ? '<button class="btn plain small" data-act="restore">Restore purchases</button>' : '') + '<button class="btn plain small" data-act="legal" data-page="privacy">Privacy</button><button class="btn plain small" data-act="legal" data-page="terms">Terms</button><button class="btn plain small" data-act="legal" data-page="support">Support</button><button class="btn plain small" data-act="legal" data-page="data-deletion">Delete my data</button></div>';
      html += '<div class="sec">About</div><p class="mut" style="margin:0">Pocket Burrow ' + CFG.version + ' · a Jonidge game<br>Contact: <b>' + CFG.supportEmail + '</b><br>Art and music made for this game. Fonts: Fredoka and Lilita One (SIL OFL).<br>Your game is saved on this device only.</p>';
      html += '<p class="mut" style="font-size:12px">' + (ADS.simulated ? 'Web test build: ads and purchases are simulated.' : ADS.mode === 'live' && ADS.testing() ? 'Test ads (Google test units).' : '') + '</p>';
      return html;
    } };
  }

  // ---------- actions ----------
  var actions = {
    'privacy-choices': function () { snd('tap'); ADS.showPrivacyOptions().then(function () { if (sheet) renderSheet(); }); },
    'restore': function () { snd('tap'); IAP.restore().then(function (info) { if (IAP.ownsSupporter(info) && !st.supporter) grantPurchase(D.PRODUCTS.filter(function (q) { return q.kind === 'supporter'; })[0], 'restore-supporter'); else toast(info ? 'Everything is restored.' : 'Nothing to restore.'); }); },
    'legal': function (el) { snd('tap'); openSheet(legalSheet(el.dataset.page)); },
    'open-door': function () { snd('tap'); setTab('door'); openSheet(doorSheet()); },
    close: function () { snd('tap'); closeSheet(); },
    collect: function (el) { doCollect(+el.dataset.x, +el.dataset.y); },
    gift: function (el) {
      var x = +el.dataset.x, y = +el.dataset.y, r = S.collectGift(st, x, y, now()); if (!r.ok) return;
      snd('gift'); bump(x, y); var wx = cellX(x) + 20, wy = cellY(y) + 20; fx('burst', wx, wy, { n: 14, col: '#ffb6c9' }); fx('heart', wx, wy, { n: 3 });
      if (!calm()) fx('fly', wx, wy, { n: 4 }); fx('text', wx, wy - 6, { text: '+' + fmtN(r.acorns) + ' 🌰', col: '#ffe58a' });
      if (r.berries && !r.levelUp) { fx('fly', wx, wy, { n: 2, kind: 'berry' }); toast('A Glowberry! ' + ic('berry')); }
      var cr = r.critter && D.CRITTER_BY_ID[r.critter];
      if (r.levelUp) setTimeout(function () { friendCard(r.critter, r.levelUp); }, 450);
      else if (cr) toast('♥ <b>' + esc(cr.name) + '</b> left you a gift' + (r.nextAt ? ' <span style="opacity:.8">(' + r.hearts + ' / ' + r.nextAt + ' to the next story)</span>' : ''));
      dirtyUp(); refreshHud(); if (sheet && sheet.live) renderSheet();
    },
    upgrade: function (el) { var r = S.upgradeRoom(st, +el.dataset.x, +el.dataset.y, now()); if (!r.ok) { snd('error'); return; } snd('build'); bump(+el.dataset.x, +el.dataset.y); fx('burst', cellX(+el.dataset.x) + 45, cellY(+el.dataset.y) + 40, { n: 20 }); toast('Level ' + r.level + '! Cosier already.'); afterMoves(r.moved); dirtyUp(); checkLevel(); renderSheet(); },
    build: function (el) { var x = +el.dataset.x, y = +el.dataset.y, r = S.buildRoom(st, x, y, el.dataset.room, now()); if (!r.ok) { snd('error'); return; } snd('build'); bump(x, y); shake = .8; fx('burst', cellX(x) + 45, cellY(y) + 44, { n: 22 }); closeSheet(); afterMoves(r.moved); dirtyUp(); handleEvents(S.tutorialAdvance(st, now())); checkLevel(); save(); },
    dig: function (el) { var r = S.startDig(st, +el.dataset.x, +el.dataset.y, now()); if (!r.ok) { snd('error'); return; } snd('dig'); closeSheet(); toast('⛏ Digging started. It finishes by itself.'); dirtyUp(); save(); },
    'skip-dig': function (el) { var r = S.skipDigWithBerries(st, +el.dataset.x, +el.dataset.y, now()); if (!r.ok) { snd('error'); return; } handleEvents(r.events); dirtyUp(); closeSheet(); },
    'ad-dig': function () { watchAd('dig', function () { var r = S.adReward(st, 'dig', now()); if (r.ok) { toast('Half the time left.'); dirtyUp(); } renderSheet(); }); },
    'ad-double': function (el) { var x = +el.dataset.x, y = +el.dataset.y; watchAd('double', function () { var r = S.adReward(st, 'double', now(), { x: x, y: y }); if (r.ok) collectFx(x, y, r); dirtyUp(); renderSheet(); }); },
    'ad-berry': function () { watchAd('berry', function () { var r = S.adReward(st, 'berry', now()); if (r.ok) { snd('gift'); toast('+1 ' + ic('berry') + ' Glowberry'); dirtyUp(); } renderSheet(); }); },
    'ad-bell': function () { watchAd('bell', function () { var r = S.adReward(st, 'bell', now()); if (r.ok) { snd('knock'); toast('🔔 <b>' + esc(D.CRITTER_BY_ID[r.visitor.critter].name) + '</b> heard the bell!'); dirtyUp(); } renderSheet(); }); },
    give: function (el) {
      var r = S.fulfillVisitor(st, el.dataset.id, now()); if (!r.ok) { snd('error'); return; } var cr = D.CRITTER_BY_ID[r.critter]; snd(r.moved ? 'arrive' : 'collect'); fx('burst', DOOR_X + 50, GROUND - 40, { n: 14 }); fx('heart', DOOR_X + 50, GROUND - 40, { n: 4 }); fx('text', DOOR_X + 50, GROUND - 58, { text: '+' + fmtN(r.acorns) + ' 🌰', col: '#ffe58a' });
      if (!calm()) { fx('fly', DOOR_X + 50, GROUND - 40, { n: 5 }); if (r.berries) fx('fly', DOOR_X + 50, GROUND - 40, { n: 1, kind: 'berry' }); }
      if (r.moved) { bump(r.moved.x, r.moved.y); }
      var rare = cr.rarity === 'rare' || cr.rarity === 'legendary';
      var nudge = S.albumNudge(st), msg = '<b>' + esc(cr.name) + '</b> is delighted! +' + fmtN(r.acorns) + ' 🌰' + (r.berries ? ' +' + r.berries + ' 🫐' : '');
      if (r.moved) msg += ' And they moved into your ' + D.ROOM_BY_ID[cr.room].name + '! 🏠'; else if (!S.hasRoom(st, cr.room)) msg += ' They\'d love a ' + D.ROOM_BY_ID[cr.room].name + '.'; else msg += ' No free bed yet: upgrade the ' + D.ROOM_BY_ID[cr.room].name + '.';
      if (r.first && !rare && nudge.next) msg += '<br><span style="opacity:.85">📖 Album ' + nudge.count + ' / ' + nudge.total + ': ' + nudge.next.need + ' more for 🫐' + nudge.next.berries + '</span>';
      toast(msg); dirtyUp(); handleEvents(S.tutorialAdvance(st, now())); checkLevel();
      if (r.first && rare) setTimeout(function () { meetCard(r.critter, r); }, 500); else renderSheet();
    },
    daily: function () { var r = S.claimDaily(st, now()); if (!r.ok) return; snd('gift'); var rw = r.reward; toast('🎁 ' + (rw.acorns ? '+' + rw.acorns + ' 🌰' : rw.berries ? '+' + rw.berries + ' 🫐' : '+' + rw.goods + ' ' + G[r.good].icon)); fx('burst', DOOR_X, GROUND - 40, { n: 16 }); dirtyUp(); renderSheet(); },
    'season-gift': function () { var r = S.claimSeasonGift(st, now()); if (r.ok) { snd('gift'); toast('🎀 A new decoration is up above ground!'); dirtyUp(); renderSheet(); } },
    critter: function (el) { snd('tap'); openSheet(critterSheet(el.dataset.id)); },
    'album-filter': function (el) { album.filter = el.dataset.f; renderSheet(); },
    'album-claim': function (el) { var r = S.claimAlbum(st, +el.dataset.at); if (r.ok) { snd('gift'); toast('Album reward: +' + r.berries + ' 🫐' + (r.acorns ? ' +' + fmtN(r.acorns) + ' 🌰' : '')); dirtyUp(); renderSheet(); } },
    'decor-buy': function (el) { var r = S.buyDecor(st, el.dataset.id); if (r.ok) { snd('build'); toast('Placed above ground.'); dirtyUp(); renderSheet(); } else snd('error'); },
    'decor-toggle': function (el) { S.toggleDecor(st, el.dataset.id); snd('tap'); dirtyUp(); renderSheet(); },
    buy: function (el) { buy(el.dataset.sku); },
    'set-sound': function () { st.settings.sound = !st.settings.sound; AU.setSfx(st.settings.sound); dirtyUp(); renderSheet(); },
    'set-music': function () { st.settings.music = !st.settings.music; AU.setMusic(st.settings.music); dirtyUp(); renderSheet(); },
    'set-south': function () { st.settings.southern = !st.settings.southern; dirtyUp(); renderSheet(); },
    'set-motion': function () { st.settings.reduceMotion = !st.settings.reduceMotion; dirtyUp(); renderSheet(); },
    'set-notif': function () { if (st.settings.notifications) { st.settings.notifications = false; P.Notify.schedule([]); dirtyUp(); renderSheet(); } else if (!P.Notify.supported) { toast('Reminders work in the phone app.'); } else P.Notify.request().then(function (ok) { st.settings.notifications = ok; dirtyUp(); renderSheet(); }); },
    'notif-on': function () { P.Notify.request().then(function (ok) { st.settings.notifications = ok; dirtyUp(); closeSheet(); toast(ok ? 'Reminders are on, gently.' : 'No problem.'); }); },
    export: function () { $('codebox').innerHTML = '<textarea class="code" readonly>' + esc(btoa(unescape(encodeURIComponent(S.serialize(st))))) + '</textarea><p class="mut" style="font-size:12px">Copy this code somewhere safe.</p>'; },
    import: function () { $('codebox').innerHTML = '<textarea class="code" id="code-in" placeholder="Paste your code"></textarea><button class="btn small" data-act="import-go">Restore</button>'; },
    'import-go': function () { try { var s = S.deserialize(decodeURIComponent(escape(atob($('code-in').value.trim()))), now()); if (!s) throw 0; st = s; save(); location.reload(); } catch (e) { toast('That code did not work.'); } },
    reset: function () { $('codebox').innerHTML = '<p class="need">This erases your burrow on this device.</p><button class="btn small" style="background:#d9534f;box-shadow:0 4px 0 #8a2a24" data-act="reset-go">Erase everything</button>'; },
    'reset-go': function () { P.Store.clear(); location.search = ''; }
  };
  function afterMoves(moved) { (moved || []).forEach(function (m) { var cr = D.CRITTER_BY_ID[m.id]; toast('🏠 <b>' + esc(cr.name) + '</b> moved into the ' + D.ROOM_BY_ID[cr.room].name + '!'); fx('heart', cellX(m.x) + 45, cellY(m.y) + 40, { n: 4 }); fx('burst', cellX(m.x) + 45, cellY(m.y) + 50, { n: 12 }); }); }
  function checkLevel() { var L = S.level(st); if (L > (checkLevel.last || 1)) { checkLevel.last = L; levelUp(L); } }
  function collectFx(x, y, r) {
    var wx = cellX(x) + CW - 20, wy = cellY(y) + 20; snd('collect'); bump(x, y);
    fx('text', wx, wy, { text: '+' + fmtN(r.goods) + ' ' + G[r.good].icon, col: '#fff' }); fx('burst', wx, wy, { n: 8 });
    if (!calm()) fx('fly', wx, wy + 8, { n: Math.min(8, 2 + Math.floor(r.acorns / 60)) }); else fx('text', wx, wy + 14, { text: '+' + fmtN(r.acorns) + ' 🌰', col: '#ffe58a' });
  }
  function doCollect(x, y) { var r = S.collect(st, x, y, now()); if (!r.ok) return false; collectFx(x, y, r); dirtyUp(); handleEvents(S.tutorialAdvance(st, now())); refreshHud(); if (sheet) renderSheet(); return true; }
  function collectAllNow() {
    var any = false, tr = totalReady(), lvl = null; S.eachRoom(st, function (r, x, y) { if (S.collect(st, x, y, now()).ok) { any = true; bump(x, y); } });
    var gifts = 0; S.eachRoom(st, function (r, x, y) { if (r.giftReady) { var g = S.collectGift(st, x, y, now()); if (g.ok) { gifts++; bump(x, y); fx('burst', cellX(x) + 20, cellY(y) + 20, { n: 8, col: '#ffb6c9' }); if (g.levelUp && !lvl) lvl = g; } } });
    if (any || gifts) {
      snd('collect'); var cy0 = view.cam + view.h / view.scale * .5; fx('text', 195, cy0, { text: '+' + fmtN(tr.acorns) + ' 🌰', col: '#ffe58a' }); if (!calm()) fx('fly', 195, cy0 + 10, { n: 8 });
      handleEvents(S.tutorialAdvance(st, now())); dirtyUp(); refreshHud();
      if (lvl) setTimeout(function () { friendCard(lvl.critter, lvl.levelUp); }, 500);
      else if (st.tut >= 5) { var tl = teaserLine(now()); if (tl) setTimeout(function () { toast('See you soon!<br>' + tl); }, 900); }
    }
  }

  // ---------- celebration cards ----------
  function heartsRow(n, max) { var h = ''; for (var i = 0; i < max; i++) h += '<span style="opacity:' + (i < n ? 1 : .25) + '">♥</span>'; return '<span style="color:#e8566e;letter-spacing:2px">' + h + '</span>'; }
  function friendCard(id, lu) {
    var cr = D.CRITTER_BY_ID[id]; snd('levelup'); fx('heart', DOOR_X, GROUND - 30, { n: 6 });
    openSheet({ title: esc(cr.name) + ' trusts you more', kind: 'friend', live: false, anim: animatePortraits, render: function () {
      return '<div style="text-align:center"><canvas class="cv" style="width:130px;height:130px" data-critter="' + id + '" data-anim="1"></canvas><div style="font-size:22px">' + heartsRow(lu.level, 3) + '</div><p style="margin:2px 0"><b>' + D.FRIENDSHIP.names[lu.level] + '</b></p></div>'
        + '<div class="card col"><p style="margin:0">' + esc(lu.story) + '</p></div><p style="text-align:center;margin:4px 0">Thank-you: +' + fmtN(lu.acorns) + ' 🌰' + (lu.berries ? ' +' + lu.berries + ' 🫐' : '') + '</p><button class="btn" data-act="close">Lovely</button>';
    } });
  }
  function meetCard(id, r) {
    var cr = D.CRITTER_BY_ID[id], nudge = S.albumNudge(st), rar = D.RARITY[cr.rarity]; snd('chime'); fx('burst', DOOR_X + 40, GROUND - 40, { n: 24, col: rar.color });
    openSheet({ title: (cr.rarity === 'legendary' ? '✨ A legendary friend!' : '✨ A rare friend!'), kind: 'meet', live: false, anim: animatePortraits, render: function () {
      return '<div style="text-align:center"><canvas class="cv" style="width:150px;height:150px" data-critter="' + id + '" data-anim="1"></canvas><h3 style="margin:0">' + esc(cr.name) + ' ' + critterPill(cr) + '</h3><p class="mut" style="margin:2px 0">' + esc(cr.species) + ' · ' + esc(cr.trait) + '</p></div>'
        + '<div class="card col"><p style="margin:0">"' + esc(cr.quote) + '"</p></div><p style="text-align:center;margin:4px 0">+' + fmtN(r.acorns) + ' 🌰' + (r.berries ? ' +' + r.berries + ' 🫐' : '') + ' · ' + (r.moved ? '🏠 moved into your ' + esc(D.ROOM_BY_ID[cr.room].name) : 'would love a ' + esc(D.ROOM_BY_ID[cr.room].name)) + '</p>'
        + '<p class="mut" style="text-align:center;margin:2px 0">📖 Album ' + nudge.count + ' / ' + nudge.total + (nudge.next ? ' · ' + nudge.next.need + ' more for 🫐' + nudge.next.berries : '') + '</p><button class="btn gold" data-act="close">Wonderful</button>';
    } });
  }
  /** residents wave when you come back after a while (skipped for sleepers and in calm mode) */
  function greetAll() {
    if (calm() || clock - lastGreet < 20) return; lastGreet = clock; var i = 0;
    for (var id in actors) (function (a, delay) { setTimeout(function () { if (a.sleep) return; a.vh = 120; a.hop = .01; if (a.cx != null) fx('heart', cellX(a.cx) + a.x, cellY(a.cy) + CH - 40, { n: 1 }); }, delay); })(actors[id], 250 + (i++) * 140);
  }

  function watchAd(kind, done) {
    if (S.adsLeft(st) < 1) { toast('That is enough sunshine for today. Come back tomorrow.'); return; }
    ADS.showRewarded(kind, function (resolve) {
      var o = doc.createElement('div'); o.className = 'adscreen'; o.innerHTML = '<div style="font-size:48px">☀️</div><h2 style="margin:0">Sunny break</h2><div style="color:#d9c7a8">Test ad (simulated in the web build)</div><div class="bar"><i id="adbar" style="width:0%"></i></div><button class="btn plain small" id="adx">Skip (no reward)</button>';
      $('app').appendChild(o); var t0 = Date.now(), fin = false, iv = setInterval(function () { var p = Math.min(1, (Date.now() - t0) / (params.get('fastad') ? 100 : 2500)); $('adbar').style.width = p * 100 + '%'; if (p >= 1 && !fin) { fin = true; clearInterval(iv); o.remove(); resolve(true); } }, 50);
      $('adx').onclick = function () { if (fin) return; fin = true; clearInterval(iv); o.remove(); resolve(false); };
    }, function (why) {
      if (why === 'att') return attExplainer(function () { watchAd(kind, done); });
      toast(why === 'consent' ? 'Sunny breaks need your privacy choice first (More > Privacy choices).' : 'No sunny break is ready right now. Try again in a moment.');
    }).then(function (ok) { if (ok) done(); else if (ok === false && ADS.simulated) toast('No reward this time. That is fine!'); });
  }
  /** iOS only: a short, honest explainer before Apple's tracking question (App Tracking Transparency). */
  function attExplainer(then) {
    var o = doc.createElement('div'); o.className = 'adscreen'; o.innerHTML = '<div style="font-size:44px">🌻</div><h2 style="margin:0">One quick question</h2><p style="max-width:290px">Sunny breaks are short ads that keep Pocket Burrow free. Next, your iPhone asks whether ads may use your activity from other apps. Either answer is fine: you get the same rewards.</p><button class="btn gold" id="attok">Continue</button>';
    $('app').appendChild(o); $('attok').onclick = function () { o.remove(); ADS.requestTracking().then(function () { then(); }); };
  }
  function buy(sku) {
    var p = D.PRODUCTS.filter(function (q) { return q.sku === sku; })[0]; if (!p) return;
    if (p.oneTime && st.supporter) return;
    function go() {
      IAP.purchase(p, function (resolve) { var o = doc.createElement('div'); o.className = 'adscreen'; o.innerHTML = '<h2 style="margin:0">Test purchase</h2><p style="max-width:280px">No real payment is made. Simulate buying <b>' + esc(p.name) + '</b>?</p><div class="row"><button class="btn gold" id="pok">Simulate</button><button class="btn plain" id="pno">Cancel</button></div>'; $('app').appendChild(o); $('pok').onclick = function () { o.remove(); resolve(true); }; $('pno').onclick = function () { o.remove(); resolve(false); }; }).then(function (r) {
        if (r.ok) return grantPurchase(p, r.transactionId);
        if (r.alreadyOwned && p.oneTime) return grantPurchase(p, 'owned-' + p.sku);
        if (r.pending) toast('Your purchase is waiting for approval. It arrives as soon as the store confirms it.');
        else if (!r.cancelled && !r.mock) toast('The purchase did not go through. Nothing was charged.');
      });
    }
    if (IAP.mode === 'store' && IAP.needsWaiver()) {
      var o = doc.createElement('div'); o.className = 'adscreen'; o.innerHTML = '<h2 style="margin:0">Before you buy</h2><p style="max-width:290px"><b>' + esc(p.name) + '</b> arrives in your burrow straight away. By continuing you agree to immediate delivery and understand that your 14-day right of withdrawal ends once it has been delivered.</p><div class="row"><button class="btn gold" id="wok">Continue</button><button class="btn plain" id="wno">Cancel</button></div>';
      $('app').appendChild(o); $('wok').onclick = function () { o.remove(); go(); }; $('wno').onclick = function () { o.remove(); };
    } else go();
  }
  /** Grant a purchase exactly once per store transaction. */
  function grantPurchase(p, tx) {
    if (tx && st.iap.tx.indexOf(tx) >= 0) return;
    if (tx) { st.iap.tx.push(tx); if (st.iap.tx.length > 200) st.iap.tx = st.iap.tx.slice(-200); }
    if (p.kind === 'supporter') { if (S.grantSupporter(st).ok) toast('💛 Thank you! Golden Acorn Sign and 60 Glowberries.'); }
    else { st.berries += p.berries; toast('+' + p.berries + ' ' + ic('berry')); }
    snd('gift'); dirtyUp(); save(); if (sheet) renderSheet();
  }
  function legalSheet(page) {
    var titles = { privacy: 'Privacy', terms: 'Terms', support: 'Support', 'data-deletion': 'Delete my data' };
    return { title: titles[page] || 'Legal', kind: 'legal', live: false, render: function () { return '<iframe class="legal" src="' + (CFG.legalBase || 'legal/') + page + '.html" title="' + esc(titles[page] || page) + '"></iframe>'; } };
  }

  // ---------- input ----------
  var ptr = null;
  function toWorld(ev) { var r = canvas.getBoundingClientRect(); return { x: (ev.clientX - r.left) / view.scale, y: (ev.clientY - r.top) / view.scale + view.cam }; }
  canvas.addEventListener('pointerdown', function (e) { AU.unlock(); canvas.setPointerCapture(e.pointerId); ptr = { sy: e.clientY, ly: e.clientY, moved: false }; view.vel = 0; view.target = null; });
  canvas.addEventListener('pointermove', function (e) { if (!ptr) return; var dy = e.clientY - ptr.ly; if (Math.abs(e.clientY - ptr.sy) > 8) ptr.moved = true; if (ptr.moved) { view.cam -= dy / view.scale; clampCam(); view.vel = -dy / view.scale / 4 * .6 + view.vel * .4; } ptr.ly = e.clientY; });
  canvas.addEventListener('pointerup', function (e) { if (!ptr) return; var p = ptr; ptr = null; if (!p.moved) tap(toWorld(e)); });
  canvas.addEventListener('pointercancel', function () { ptr = null; });
  canvas.addEventListener('wheel', function (e) { view.cam += e.deltaY / view.scale; clampCam(); e.preventDefault(); }, { passive: false });

  function tap(w) {
    var order = ['basket', 'gift', 'critter', 'door', 'cell', 'room'], found = null;
    for (var o = 0; o < order.length && !found; o++) for (var i = hits.length - 1; i >= 0; i--) { var h = hits[i]; if (h.kind === order[o] && w.x >= h.x && w.x <= h.x + h.w && w.y >= h.y && w.y <= h.y + h.h) { found = h; break; } }
    if (!found) return;
    if (found.kind === 'basket') doCollect(found.cx, found.cy);
    else if (found.kind === 'gift') actions.gift({ dataset: { x: found.cx, y: found.cy } });
    else if (found.kind === 'critter') { var a = actors[found.id]; if (a) { a.vh = 120; a.hop = .01; a.awake = clock + 4; if (a.sleep) fx('float', found.x + 14, found.y, { ch: '?', col: '#fff', size: 12, vy: 14, life: 1.2 }); } snd('critter' + (1 + Math.floor(Math.random() * 3)), { rate: .9 + Math.random() * .3 }); fx('heart', found.x + 14, found.y + 6, { n: 2 }); var cr = D.CRITTER_BY_ID[found.id]; if (Math.random() < .5) toast('<b>' + esc(cr.name) + '</b>: ' + esc(cr.quote)); }
    else if (found.kind === 'door') { if (st.tut < 3) { toast('Not yet! Finish the first steps.'); return; } snd('tap'); setTab('door'); openSheet(doorSheet()); }
    else if (found.kind === 'cell') cellTap(found.cx, found.cy);
    else if (found.kind === 'room') { snd('tap'); setTab('burrow'); openSheet(roomSheet(found.cx, found.cy)); }
  }
  function cellTap(cx, cy) {
    var cell = S.cellAt(st, cx, cy), pend = st.digs.filter(function (d) { return d.x === cx && d.y === cy; })[0];
    if (pend) { if (pend.end == null) { var r = S.tapDig(st, cx, cy, now()); snd('dig'); fx('dirt', cellX(cx) + 45, cellY(cy) + 70); shake = .5; if (r.done) { snd('dig-done'); fx('burst', cellX(cx) + 45, cellY(cy) + 44, { n: 18 }); dirtyUp(); handleEvents(S.tutorialAdvance(st, now())); save(); } } else openSheet(digSheet(cx, cy)); return; }
    if (cell && cell.dug && !cell.room) { if (st.tut === 0) return; snd('tap'); openSheet(buildSheet(cx, cy)); return; }
    if (!cell && S.canDigCell(st, cx, cy)) {
      var info = S.digInfo(st, cx, cy), sr = info.stratum;
      if (info.tap && S.level(st) >= sr.level && st.digs.length < S.maxDigs(st)) { var r2 = S.startDig(st, cx, cy, now()); if (r2.ok) { S.tapDig(st, cx, cy, now()); shake = .5; snd('dig'); fx('dirt', cellX(cx) + 45, cellY(cy) + 70); dirtyUp(); } return; }
      snd('tap'); openSheet(digSheet(cx, cy));
    }
  }
  doc.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act],[data-tab]'); if (!t) return;
    if (t.dataset.tab) { snd('tap'); var n = t.dataset.tab; setTab(n); if (n === 'burrow') closeSheet(); else if (n === 'door') openSheet(doorSheet()); else if (n === 'album') openSheet(albumSheet()); else if (n === 'nook') openSheet(nookSheet()); else openSheet(settingsSheet()); return; }
    var act = t.dataset.act; if (actions[act]) { AU.unlock(); actions[act](t); }
  });
  $('btn-collect').addEventListener('click', function () { AU.unlock(); collectAllNow(); });
  $('chip-level').addEventListener('click', function () { var lp = S.levelProgress(st); toast('Burrow Level <b>' + lp.level + '</b> · cosiness ' + lp.cur + (lp.next ? ' / ' + lp.next : '') + '. Rooms, residents, friends and decorations all add cosiness.'); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });

  // ---------- save / lifecycle ----------
  function save() { if (!st) return; st.lastSeen = Math.max(st.lastSeen, now()); P.Store.write(S.serialize(st)); dirty = false; lastSave = clock; if (st.settings.notifications && P.Notify.supported) P.Notify.schedule(REM.plan(st, now())); }
  doc.addEventListener('visibilitychange', function () {
    if (doc.hidden) { save(); AU.pause(); }
    else { AU.resume(); if (st) { var before = st.lastSeen; var ev = S.tick(st, now()); handleEvents(ev); maybeWelcome(before); if (now() - before > 10 * 60000) setTimeout(greetAll, 700); } }
  });
  root.addEventListener('pagehide', save);

  function maybeWelcome(before) {
    var gap = now() - before; if (gap < 10 * 60000 || st.tut < 5) return;
    var sum = S.awaySummary(st, now(), []); if (!sum.goods && !sum.visitors && !sum.gifts) return;
    openSheet({ title: 'Welcome back!', kind: 'welcome', live: false, render: function () {
      var tr = totalReady(), html = '<p style="margin:0 0 6px">You were away for <b>' + fmtDur(gap) + '</b>. Your burrow kept busy:</p>';
      html += '<div class="card col">' + (tr.goods ? '<div class="row sp"><span>' + ic('basket') + ' Baskets waiting</span><b>' + fmtN(tr.goods) + ' goods · ' + fmtN(tr.acorns) + ' 🌰</b></div>' : '') + (st.visitors.length ? '<div class="row sp"><span>🚪 Friends at the door</span><b>' + st.visitors.length + '</b></div>' : '') + (tr.gifts ? '<div class="row sp"><span>🎁 Gifts</span><b>' + tr.gifts + '</b></div>' : '') + (sum.full ? '<p class="mut" style="margin:0">' + sum.full + ' basket' + (sum.full > 1 ? 's are' : ' is') + ' full: that is all they hold.</p>' : '') + '</div>';
      var tl = teaserLine(now()); if (tl) html += '<p class="mut" style="margin:6px 0 0">Next: ' + tl + '</p>';
      html += '<div class="row"><button class="btn gold" data-act="welcome-collect">' + ic('basket') + ' Collect all</button>' + (st.visitors.length ? '<button class="btn plain" data-act="welcome-door">Open the door</button>' : '') + '</div>';
      return html;
    } });
  }
  actions['welcome-collect'] = function () { collectAllNow(); closeSheet(); if (S.dailyAvailable(st, now())) { setTab('door'); openSheet(doorSheet()); } };
  actions['welcome-door'] = function () { collectAllNow(); setTab('door'); openSheet(doorSheet()); };

  // ---------- boot ----------
  function boot() {
    buildTabs();
    P.Store.whenReady(function () {
      var raw = params.get('reset') ? null : P.Store.read();
      if (params.get('reset')) P.Store.clear();
      st = raw ? S.deserialize(raw, now()) : null; var fresh = !st;
      if (!st) st = S.newState(now());
      var before = st.lastSeen;
      AU.setSfx(st.settings.sound); AU.setMusic(st.settings.music);
      resize(); root.addEventListener('resize', resize);
      var ev = S.tick(st, now()); S.tutorialAdvance(st, now()); checkLevel.last = S.level(st);
      handleEvents(ev.filter(function (e) { return e.t !== 'visitor' && e.t !== 'digDone'; }));
      var d = new Date(now()); hourNow = forceHour != null ? forceHour : d.getHours() + d.getMinutes() / 60; seasonNow = forceSeason || D.seasonOf(d, st.settings.southern);
      view.cam = 0; refreshHud();
      ADS.start();
      IAP.onChange = function (info) { if (IAP.ownsSupporter(info) && !st.supporter) grantPurchase(D.PRODUCTS.filter(function (q) { return q.kind === 'supporter'; })[0], 'entitlement-supporter'); };
      IAP.init(D.PRODUCTS).then(function () { if (sheet && sheet.kind === 'nook') renderSheet(); });
      $('intro-test').innerHTML = ADS.simulated ? '<span class="test-badge">web test build</span>' : '';
      var needIntro = (fresh || (!st.settings.introSeen && st.tut === 0)) && !params.get('skipintro');
      if (needIntro) { $('intro').classList.remove('hidden'); introArt(); } else st.settings.introSeen = true;
      $('intro-go').onclick = function () { AU.unlock(); snd('chime'); $('intro').classList.add('hidden'); st.settings.introSeen = true; dirtyUp(); save(); };
      if (!needIntro) root.addEventListener('pointerdown', function once() { AU.unlock(); root.removeEventListener('pointerdown', once); });
      if (!fresh) setTimeout(function () { greetAll(); if (!sheet && !introOpen()) { maybeWelcome(before); if (!sheet && st.tut >= 5 && S.dailyAvailable(st, now())) { setTab('door'); openSheet(doorSheet()); } } }, 500);
      (doc.fonts && doc.fonts.load ? Promise.all([doc.fonts.load('600 12px Fredoka'), doc.fonts.load('400 20px "Lilita One"')]) : Promise.resolve()).catch(function () {}).then(function () { root.requestAnimationFrame(frame); });
      setInterval(function () { if (dirty) save(); }, 10000);
      root.PB = { state: function () { return st; }, S: S, D: D, now: now, advance: function (ms) { timeOffset += ms; var e2 = S.tick(st, now()); handleEvents(e2); refreshHud(); return e2; }, save: save, tap: tap, hits: function () { return hits; }, cellTap: cellTap, openSheet: openSheet, actions: actions, sheet: function () { return sheet; }, collectAll: collectAllNow, view: view, cellCenter: function (x, y) { return { x: cellX(x) + CW / 2, y: cellY(y) + CH / 2 }; }, friendCard: friendCard, meetCard: meetCard, greetAll: greetAll, whenLabel: whenLabel, doorSheet: doorSheet, albumSheet: albumSheet, nookSheet: nookSheet, settingsSheet: settingsSheet, legalSheet: legalSheet, ads: ADS, iap: IAP, roomSheet: roomSheet, buildSheet: buildSheet, scrollTo: scrollTo, ready: true };
    });
  }
  function introArt() {
    var cv = $('intro-art'), c = cv.getContext('2d');
    function d(ts) { if (!introOpen()) return; var t0 = ts / 1000; c.clearRect(0, 0, 240, 150); c.save();
      var g = c.createLinearGradient(0, 0, 0, 150); g.addColorStop(0, '#fff3d0'); g.addColorStop(1, '#f1c98a'); c.fillStyle = g; A.rr(c, 0, 0, 240, 150, 24); c.fill();
      c.save(); A.rr(c, 0, 0, 240, 150, 24); c.clip(); c.fillStyle = '#a9d96a'; c.beginPath(); c.ellipse(120, 175, 190, 80, 0, 0, 6.28); c.fill(); c.fillStyle = '#7a4a2e'; c.beginPath(); c.arc(120, 112, 20, Math.PI, 0); c.lineTo(140, 124); c.lineTo(100, 124); c.fill(); c.fillStyle = '#ffd070'; c.beginPath(); c.arc(120, 106, 6, 0, 6.28); c.fill(); c.restore();
      [['crumb', 56, 124, 1], ['truffle', 186, 124, -1], ['bumble', 150, 70, -1], ['quill', 36, 112, 1]].forEach(function (k, i) { A.drawCritter(c, D.CRITTER_BY_ID[k[0]].look, { t: t0, x: k[1], y: k[2], dir: k[3], seed: i * 3, scale: 1.5 }); });
      c.restore(); root.requestAnimationFrame(d); }
    root.requestAnimationFrame(d);
  }
  boot();
})(typeof self !== 'undefined' ? self : this);
