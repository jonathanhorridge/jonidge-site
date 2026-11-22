/* Clawcastle app: screens, input, animation sequencing, saving. */
(function () {
  'use strict';
  var D = window.CCData, E = window.CCEngine, R = window.Render, Sfx = window.Sfx;
  var $ = function (q) { return document.querySelector(q); }, $$ = function (q) { return Array.prototype.slice.call(document.querySelectorAll(q)); };
  var KEY = 'clawcastle-save-v1';
  var save = load(), s = null, screen = 'title', prevScreen = 'title', busy = false, drag = null, FAST = false, extraUsed = false, idleT = 0;

  function defaults() {
    var up = {}; D.UPGRADES.forEach(function (u) { up[u.id] = u.start; });
    return { v: 1, unlocked: 0, stars: [], sand: 0, pearls: 0, up: up, sound: true, music: true, seen: {} };
  }
  function load() {
    var d = defaults();
    try { var x = JSON.parse(localStorage.getItem(KEY) || 'null'); if (x && x.v === 1) { Object.keys(d).forEach(function (k) { if (x[k] == null) x[k] = d[k]; }); Object.keys(d.up).forEach(function (k) { if (x.up[k] == null) x.up[k] = d.up[k]; }); return x; } } catch (e) {}
    return d;
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, FAST ? 0 : ms); }); }
  function toast(msg, ms) { var t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove('on'); }, ms || 2200); }
  function vibrate(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
  function fmt(n) { n = Math.round(n * 10) / 10; return String(n); }

  // ---------- screens ----------
  function show(name) {
    if (name === 'back') name = prevScreen === 'game' ? 'map' : prevScreen;
    if (name !== screen) prevScreen = screen;
    screen = name;
    ['title', 'map', 'base'].forEach(function (n) { $('#scr-' + n).hidden = n !== name; });
    $('#hud').hidden = name !== 'game';
    if (name !== 'game') $('#coach').hidden = true;
    if (name === 'map') buildMap();
    if (name === 'base') buildBase();
    updateWallet();
  }
  function updateWallet() { $$('.w-sand').forEach(function (e) { e.textContent = save.sand; }); $$('.w-pearls').forEach(function (e) { e.textContent = save.pearls; }); }
  document.addEventListener('click', function (e) {
    var go = e.target.closest('[data-go]'); if (!go) return;
    Sfx.play('click'); show(go.getAttribute('data-go'));
  });
  document.addEventListener('pointerdown', function () { Sfx.unlock(); }, { capture: true });
  function soundLabels() { $('#t-sound').textContent = 'Sound: ' + (save.sound ? 'on' : 'off'); $('#t-music').textContent = 'Music: ' + (save.music ? 'on' : 'off'); }
  $('#t-sound').onclick = function () { save.sound = !save.sound; Sfx.set('sound', save.sound); persist(); soundLabels(); };
  $('#t-music').onclick = function () { save.music = !save.music; Sfx.set('music', save.music); persist(); soundLabels(); };

  // ---------- level map ----------
  function starsHtml(n) { var h = ''; for (var i = 0; i < 3; i++) h += '<span class="' + (i < n ? '' : 'off') + '">\u2605</span>'; return h; }
  function buildMap() {
    var inner = $('#map-inner'), n = D.LEVELS.length, gap = 112, H = n * gap + 140;
    inner.style.height = H + 'px';
    var pts = [], html = '';
    D.LEVELS.forEach(function (L, i) {
      var y = H - 90 - i * gap, x = 50 + Math.sin(i * 1.15) * 28;
      pts.push([x, y]);
      var locked = i > save.unlocked, st = save.stars[i] || 0, cur = i === save.unlocked;
      html += '<button class="node' + (cur ? ' cur' : '') + (i === n - 1 ? ' boss' : '') + '" data-level="' + i + '" style="left:' + x + '%;top:' + y + 'px"' + (locked ? ' disabled' : '') + ' aria-label="Raid ' + (i + 1) + '">' +
        (locked ? '<svg viewBox="0 0 24 24" width="28" height="28"><rect x="5" y="11" width="14" height="10" rx="2" fill="#888"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#888" stroke-width="2.5" fill="none"/></svg>' : (i + 1)) +
        (cur || i === n - 1 ? '<span class="nm">' + L.name + '</span>' : '') +
        (!locked ? '<span class="st">' + starsHtml(st) + '</span>' : '') + '</button>';
    });
    var W = Math.min(window.innerWidth, 480);
    var path = '<svg class="path" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><path d="' + pts.map(function (p, i) { return (i ? 'L' : 'M') + (p[0] / 100 * W) + ' ' + p[1]; }).join(' ') + '" stroke="rgba(255,255,255,.75)" stroke-width="10" stroke-dasharray="2 18" stroke-linecap="round" fill="none"/></svg>';
    // little beach decorations
    var deco = '';
    for (var k = 0; k < n; k++) { var dx = k % 2 ? 8 : 86, dy = H - 140 - k * gap; deco += '<canvas class="map-deco" data-k="' + (k % 5) + '" width="80" height="80" style="position:absolute;left:' + dx + '%;top:' + dy + 'px;width:40px;height:40px;margin-left:-20px;opacity:.85"></canvas>'; }
    inner.innerHTML = path + deco + html;
    $$('.map-deco').forEach(function (c) { var k = +c.getAttribute('data-k'), x = c.getContext('2d'); R.drawTileIcon(x, k, 80); });
    $$('.node').forEach(function (b) { b.onclick = function () { Sfx.play('click'); intro(+b.getAttribute('data-level')); }; });
    var cur = $('.node.cur') || $('.node[data-level="0"]');
    var sc = $('#map-scroll');
    requestAnimationFrame(function () { sc.scrollTop = Math.max(0, parseFloat(cur.style.top) - sc.clientHeight / 2); });
  }

  // ---------- home base ----------
  var baseCv = $('#base-canvas');
  function upCost(u) { var lv = save.up[u.id]; var idx = lv - u.start; return idx < u.cost.length ? u.cost[idx] : null; }
  function buildBase() {
    var html = '';
    D.UPGRADES.forEach(function (u) {
      var lv = save.up[u.id], cost = upCost(u), pips = '';
      for (var i = u.start; i < u.max; i++) pips += '<i class="' + (i < lv ? 'on' : '') + '"></i>';
      var can = cost != null && save[u.cur] >= cost;
      html += '<div class="card" data-up="' + u.id + '"><div class="row"><canvas width="96" height="96" data-icon="' + u.id + '"></canvas><div><h3>' + u.name + '</h3><div class="pips">' + pips + '</div></div></div><p>' + u.desc + (D.TROOPS[u.id] ? '. ' + D.TROOPS[u.id].desc : '') + '</p>' +
        (cost == null ? '<button class="btn small ghost" disabled>Maxed out</button>' : '<button class="btn small ' + (u.cur === 'pearls' ? 'blue' : 'green') + '" data-buy="' + u.id + '"' + (can ? '' : ' disabled') + '>Upgrade &middot; ' + cost + ' ' + (u.cur === 'pearls' ? 'Pearls' : 'Sand') + '</button>') + '</div>';
    });
    $('#upgrades').innerHTML = html;
    $$('[data-icon]').forEach(function (c) {
      var id = c.getAttribute('data-icon'), x = c.getContext('2d');
      if (D.TROOPS[id]) R.drawTroop(x, id, 48, 54, 70, 0.3, { brute: save.up[id] >= 4 });
      else if (id === 'harbour') { x.fillStyle = '#2EC4E6'; R.rr(x, 4, 50, 88, 40, 12); x.fill(); x.fillStyle = '#8D5524'; x.beginPath(); x.moveTo(18, 60); x.lineTo(78, 60); x.lineTo(68, 76); x.lineTo(28, 76); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.moveTo(48, 58); x.lineTo(48, 14); x.lineTo(74, 54); x.fill(); }
      else if (id === 'shrine') R.drawTileIcon(x, 4, 96);
      else R.drawBuilding(x, 'flag', 48, 62, 70, 50, 0);
    });
    $$('[data-buy]').forEach(function (b) { b.onclick = function () { buy(b.getAttribute('data-buy')); }; });
    $('#shop').innerHTML = window.IAP.products.map(function (p) { return '<div class="card"><h3>' + p.name + '</h3><p>' + p.desc + '</p><button class="btn small ghost" disabled>' + p.price + ' &middot; coming soon</button></div>'; }).join('');
    updateWallet();
  }
  function buy(id) {
    var u = D.UPGRADES.filter(function (x) { return x.id === id; })[0], cost = upCost(u);
    if (cost == null || save[u.cur] < cost) return;
    save[u.cur] -= cost; save.up[id]++; persist();
    Sfx.play('coin'); toast(u.name + ' upgraded to level ' + save.up[id] + '!');
    buildBase();
  }

  // ---------- level intro ----------
  var NEWS = { pearl: ['Puffer', 'Pearls send Puffers that pop for a big blast.'], bomb: ['Pearl Bomb', 'Match in an L or T shape: a bomb hits three lanes.'], riptide: ['Riptide', 'Match 5 in a row: hits every lane and washes sand away.'] };
  function modal(html, cls) { $('#modal').className = 'modal ' + (cls || ''); $('#modal').innerHTML = html; $('#modal-root').hidden = false; }
  function closeModal() { $('#modal-root').hidden = true; }
  function legendHtml(L) {
    var codes = {}; L.lanes.forEach(function (l) { (l || '').split(/\s+/).forEach(function (t) { if (t) codes[t[0]] = 1; }); });
    return Object.keys(codes).sort(function (a, b) { return 'FWCKGT'.indexOf(a) - 'FWCKGT'.indexOf(b); }).map(function (c) {
      return '<div class="it' + (L.isNew === c ? ' new' : '') + '"><canvas width="108" height="108" data-b="' + D.BUILD[c].k + '"></canvas>' + D.BUILD[c].name + '</div>';
    }).join('');
  }
  function drawLegend() { $$('[data-b]').forEach(function (c) { var x = c.getContext('2d'); R.drawBuilding(x, c.getAttribute('data-b'), 54, c.getAttribute('data-b') === 'flag' ? 66 : 56, 84, 76, 0.5); }); }
  function intro(i) {
    var L = D.LEVELS[i], mv = L.moves + (save.up.harbour || 0), nw = NEWS[L.isNew];
    modal('<h2>Raid ' + (i + 1) + '</h2><p><b>' + L.name + '</b> &middot; ' + mv + ' moves</p>' +
      '<div class="legend">' + legendHtml(L) + '</div>' +
      (nw ? '<p class="tip"><b>New: ' + nw[0] + '!</b> ' + nw[1] + '</p>' : '') +
      '<p class="tip">' + L.tip + '</p>' +
      '<div class="btns"><button class="btn big orange" id="m-go">Raid!</button><button class="btn small ghost" id="m-close">Not now</button></div>');
    drawLegend();
    $('#m-go').onclick = function () { Sfx.play('click'); closeModal(); start(i); };
    $('#m-close').onclick = closeModal;
  }

  // ---------- game ----------
  function start(i, seed) {
    s = E.newState(i, save.up, seed == null ? (Date.now() & 0xffffff) : seed);
    R.reset(); busy = false; extraUsed = false; idleT = 0;
    show('game');
    hud();
    R.showBanner('Raid ' + (i + 1), D.LEVELS[i].name);
    if (!save.seen['tip' + i] && (i < 4 || D.LEVELS[i].isNew)) coach(D.LEVELS[i].tip, i);
    else $('#coach').hidden = true;
  }
  function coach(text, i) {
    var c = $('#coach'); c.style.top = Math.round(R.view.bfTop + 4) + 'px'; c.style.bottom = 'auto'; c.innerHTML = '<span>' + text + '</span><button class="btn small blue">Got it</button>'; c.hidden = false;
    c.querySelector('button').onclick = function () { c.hidden = true; save.seen['tip' + i] = 1; persist(); };
  }
  function hud() {
    if (!s) return;
    $('#h-level').textContent = 'Raid ' + (s.level + 1);
    $('#h-name').textContent = D.LEVELS[s.level].name;
    $('#h-moves').textContent = s.moves;
    $('#h-moves-chip').classList.toggle('low', s.moves <= 3 && s.status === 'play');
  }
  $('#h-pause').onclick = function () {
    if (!s) return; Sfx.play('click');
    modal('<h2>Paused</h2><div class="info"><p><b>How it works</b></p><p>Match 3 to send a troop up <b>that column</b>. Match 4 for a Brute. L/T shapes drop a Pearl Bomb, 5 in a row makes a Riptide.</p><p>Each troop strikes 3 times, then heads home. Numbers on enemy towers show how many turns until they fire.</p><p>Tap an enemy building to learn what it does.</p></div>' +
      '<div class="btns"><button class="btn green" id="p-resume">Resume</button><div class="row"><button class="btn small ghost" id="p-snd">Sound: ' + (save.sound ? 'on' : 'off') + '</button><button class="btn small ghost" id="p-mus">Music: ' + (save.music ? 'on' : 'off') + '</button></div><div class="row"><button class="btn small blue" id="p-restart">Restart</button><button class="btn small orange" id="p-map">Leave raid</button></div></div>');
    $('#p-resume').onclick = closeModal;
    $('#p-snd').onclick = function () { save.sound = !save.sound; Sfx.set('sound', save.sound); persist(); this.textContent = 'Sound: ' + (save.sound ? 'on' : 'off'); soundLabels(); };
    $('#p-mus').onclick = function () { save.music = !save.music; Sfx.set('music', save.music); persist(); this.textContent = 'Music: ' + (save.music ? 'on' : 'off'); soundLabels(); };
    $('#p-restart').onclick = function () { closeModal(); start(s.level); };
    $('#p-map').onclick = function () { closeModal(); s = null; show('map'); };
  };

  // input
  var cv = $('#game');
  function pt(e) { return { x: e.clientX, y: e.clientY }; }
  cv.addEventListener('pointerdown', function (e) {
    if (screen !== 'game' || !s || s.status !== 'play') return;
    var p = pt(e), cell = R.cellAt(p.x, p.y); idleT = 0; R.hint = null;
    if (!cell) {
      var st = R.structAt(s, p.x, p.y);
      if (st) { var d = D.BUILD[st.b.code]; toast(d.name + ' (' + Math.ceil(st.b.hp) + ' HP): ' + d.desc + (st.b.cd ? ' Fires in ' + st.b.t + '.' : ''), 3600); }
      R.sel = null; R.lane = -1; return;
    }
    if (busy) return;
    if (R.sel && Math.abs(R.sel[0] - cell[0]) + Math.abs(R.sel[1] - cell[1]) === 1) { var a = R.sel; R.sel = null; attempt(a, cell); return; }
    R.sel = cell; R.lane = cell[1]; drag = { cell: cell, x: p.x, y: p.y };
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
  });
  cv.addEventListener('pointermove', function (e) {
    if (!drag || busy) return;
    var p = pt(e), dx = p.x - drag.x, dy = p.y - drag.y, th = R.view.ts * 0.32;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < th) return;
    var b = Math.abs(dx) > Math.abs(dy) ? [drag.cell[0], drag.cell[1] + (dx > 0 ? 1 : -1)] : [drag.cell[0] + (dy > 0 ? 1 : -1), drag.cell[1]];
    var a = drag.cell; drag = null; R.sel = null;
    if (b[0] < 0 || b[1] < 0 || b[0] >= D.ROWS || b[1] >= D.COLS) { R.lane = -1; return; }
    attempt(a, b);
  });
  cv.addEventListener('pointerup', function () { drag = null; if (!R.sel) R.lane = -1; });
  cv.addEventListener('pointercancel', function () { drag = null; });

  function attempt(a, b) {
    if (busy || !s || s.status !== 'play') return;
    if (!E.validSwap(s, a, b)) {
      var why = !E.swappable(s, a) || !E.swappable(s, b);
      Sfx.play('bad'); R.lane = -1;
      if (why) { var x = s.grid[a[0]][a[1]], y = s.grid[b[0]][b[1]]; toast((x.lock || y.lock) ? 'Barnacles! Include that tile in a match to break it free.' : 'Sand clumps can\'t be moved. Match next to them to clear them.'); return; }
      busy = true; E.swap(s, a, b);
      wait(150).then(function () { E.swap(s, a, b); return wait(150); }).then(function () { busy = false; });
      return;
    }
    runMove(a, b);
  }

  function structPos(id, lane) {
    var vs = R.svis[id];
    if (vs) return { x: R.laneX(vs.lane), y: vs.y };
    return { x: R.laneX(lane || 0), y: R.slotY(0) };
  }
  function troopPos(id) { var vt = R.tvis[id]; return vt ? { x: vt.x, y: vt.y } : null; }
  function fire(kind, from, to, dur, cb) { if (FAST) { cb(); return; } R.shoot(kind, from.x, from.y, to.x, to.y, dur, cb); }
  function waitProj() { return new Promise(function (res) { (function chk() { if (FAST || !R.proj.length) res(); else setTimeout(chk, 40); })(); }); }

  function hitFx(e) {
    var p = structPos(e.id, e.lane), vs = R.svis[e.id];
    if (vs) vs.flash = 0.25;
    R.float(p.x, p.y - 10, '-' + fmt(e.dmg), '#FFE36E', 20);
    Sfx.play('hit');
    if (e.killed) {
      if (vs) vs.dead = true;
      R.burst(p.x, p.y, '#F2D497', 22, 1.3); R.burst(p.x, p.y, '#A67A3A', 8, 1);
      R.shake = Math.max(R.shake, e.k === 'flag' ? 18 : 9); Sfx.play('crumble'); vibrate(30);
      if (e.loot) { R.float(p.x, p.y - 30, '+' + e.loot + ' Sand', '#FFF3B0', 22); Sfx.play('coin'); }
      if (e.k === 'flag') { Sfx.play('flag'); R.flash = 0.6; }
    }
  }
  function spellFx(e) {
    if (e.type === 'spell' && e.k === 'bomb') {
      var p = { x: R.laneX(e.col), y: R.slotY(0) };
      R.ring(p.x, p.y, '#FFFFFF', 260); R.ring(p.x, p.y, '#B9A6FF', 180); R.burst(p.x, p.y, '#E4DBFF', 26, 1.5);
      R.shake = 14; Sfx.play('bomb'); R.showBanner('PEARL BOMB!', null, '#E4DBFF'); vibrate(40);
    } else if (e.type === 'spell' && e.k === 'riptide') {
      R.flash = 0.35; Sfx.play('riptide'); R.showBanner('RIPTIDE!', 'Every lane takes a hit', '#7FE7FF');
      for (var c = 0; c < D.COLS; c++) R.burst(R.laneX(c), R.view.bfTop, '#7FE7FF', 10, 1.2);
    } else if (e.type === 'wash') {
      e.cells.forEach(function (q) { var pp = R.cellXY(q.r, q.c); R.burst(pp.x, pp.y, '#9BE8FF', 6, 0.8); R.ghosts.push({ r: q.r, c: q.c, t: -1, life: 0.35, max: 0.35 }); });
    } else if (e.type === 'hit') hitFx(e);
  }

  async function runMove(a, b) {
    busy = true; R.sel = null; R.lane = -1; R.hint = null; $('#coach').hidden = true;
    E.swap(s, a, b); s.moves--; hud(); Sfx.play('swap');
    await wait(180);
    var combo = 0, hint = b;
    for (;;) {
      var st = E.resolveStep(s, hint, combo);
      if (!st) break;
      st.cleared.forEach(function (q) { var p = R.cellXY(q.r, q.c); R.ghosts.push({ r: q.r, c: q.c, t: q.t, life: 0.25, max: 0.25 }); R.burst(p.x, p.y, D.TILES[q.t].col, 6, 0.8); });
      st.sand.forEach(function (q) { var p = R.cellXY(q.r, q.c); R.ghosts.push({ r: q.r, c: q.c, t: -1, life: 0.3, max: 0.3 }); R.burst(p.x, p.y, '#D9AE66', 8, 0.9); });
      st.unlocked.forEach(function (q) { var p = R.cellXY(q.r, q.c); R.burst(p.x, p.y, '#B0BEC5', 10, 0.9); });
      Sfx.play('pop', combo);
      st.deploy.forEach(function (d) {
        var p = R.cellXY(d.fromRow, d.troop.lane);
        R.tvis[d.troop.id] = { x: p.x, y: p.y, hp: d.troop.hp, a: 1, seed: d.troop.id * 1.7, tr: d.troop, gone: 0 };
        if (d.troop.brute) R.float(p.x, p.y - 16, 'BRUTE ' + D.TROOPS[d.troop.k].name + '!', '#FFD23F', 20);
        Sfx.play(d.troop.brute ? 'brute' : 'deploy');
      });
      st.events.forEach(spellFx);
      if (combo >= 1) { var cp = R.cellXY(3, 3); R.float(cp.x, cp.y, 'Combo x' + (combo + 1) + '!', '#FF8A2B', 26 + combo * 3); }
      await wait(260);
      E.gravity(s);
      await wait(270);
      hint = null; combo++;
      if (combo > 40) break;
    }
    s.stats.best = Math.max(s.stats.best, combo);
    if (s.status === 'play') await enemy(E.enemyTurn(s));
    while (s.status === 'play' && s.moves <= 0 && s.charge < E.FINAL_TICKS) {
      if (s.charge === 0) { R.showBanner('Final charge!', 'Your troops make a last push', '#FF8A2B'); await wait(900); }
      s.charge++; await enemy(E.enemyTurn(s));
    }
    if (s.status === 'play' && s.moves <= 0) s.status = 'lost';
    if (s.status === 'play' && !E.findMove(s)) { E.shuffle(s); R.vis = {}; toast('No moves left, reshuffling the beach!'); }
    hud();
    busy = false;
    if (s.status !== 'play') { await wait(s.status === 'won' ? 900 : 500); result(); }
  }

  async function enemy(ev) {
    var marched = false;
    for (var i = 0; i < ev.length; i++) {
      var e = ev[i];
      if (e.type === 'move' || e.type === 'scuttle') { if (!marched) { Sfx.play('march'); marched = true; } }
    }
    if (marched) await wait(330);
    for (i = 0; i < ev.length; i++) {
      e = ev[i];
      if (e.type === 'attack') { var vt = R.tvis[e.id]; if (vt) vt.lunge = 1; await wait(90); }
      else if (e.type === 'hit') hitFx(e);
      else if (e.type === 'pop') { var p = troopPos(e.id); if (p) { R.burst(p.x, p.y, '#FFD23F', 18, 1.2); R.ring(p.x, p.y, '#FFF3A6', 140); } Sfx.play('puff'); if (R.tvis[e.id]) R.tvis[e.id].dying = 'fade'; }
      else if (e.type === 'home') { if (R.tvis[e.id]) R.tvis[e.id].dying = 'home'; var ph = troopPos(e.id); if (ph) R.float(ph.x, ph.y - 20, 'Home!', '#BFF0FF', 13); }
    }
    if (s.status === 'won') return;
    var shots = ev.filter(function (x) { return ['shoot', 'lob', 'gull', 'glue'].indexOf(x.type) >= 0; });
    if (shots.length) await wait(200);
    for (i = 0; i < shots.length; i++) {
      (function (e) {
        var from = structPos(e.from, e.lane);
        if (e.type === 'shoot') {
          var ids = e.all || [e.to];
          var to = troopPos(ids[0]) || { x: R.laneX(e.lane), y: R.posY(1) };
          Sfx.play('cannon');
          fire(e.k === 'cat' ? 'coco' : 'ball', from, to, 0.42, function () {
            ids.forEach(function (id) {
              var vt = R.tvis[id], p = troopPos(id);
              if (vt) { vt.hurt = 0.4; var alive = s.troops.filter(function (t) { return t.id === id; })[0]; if (!alive) { vt.hp = 0; vt.dying = 'fade'; } }
              if (p) { R.float(p.x, p.y - 14, '-' + fmt(e.dmg), '#FF6B6B', 18); R.burst(p.x, p.y, e.k === 'cat' ? '#8D6E63' : '#455A64', 8, 0.8); }
            });
            Sfx.play('hit'); R.shake = Math.max(R.shake, 5);
          });
        } else if (e.type === 'lob' || e.type === 'gull') {
          if (e.type === 'gull') Sfx.play('click'); else Sfx.play('cannon');
          e.drops.forEach(function (d) {
            R.held[d.id] = 1; R.keep[d.old] = 1;
            var to = R.cellXY(d.r, d.c);
            fire(e.type === 'gull' ? 'gull' : 'sand', from, to, e.type === 'gull' ? 0.6 : 0.5, function () {
              delete R.held[d.id]; delete R.keep[d.old];
              R.vis[d.id] = { x: d.c, y: d.r, vy: 0, sc: 0.3 };
              R.burst(to.x, to.y, '#D9AE66', 10, 0.9); Sfx.play('splat');
            });
          });
        } else if (e.type === 'glue') {
          Sfx.play('cannon');
          e.locks.forEach(function (d) {
            R.heldLock[d.id] = 1;
            var to = R.cellXY(d.r, d.c);
            fire('barn', from, to, 0.5, function () { delete R.heldLock[d.id]; R.burst(to.x, to.y, '#B0BEC5', 10, 0.9); Sfx.play('splat'); });
          });
        }
      })(shots[i]);
      await wait(170);
    }
    await waitProj();
    await wait(120);
  }

  function result() {
    var L = D.LEVELS[s.level], i = s.level;
    if (s.status === 'won') {
      var stars = E.stars(s), prev = save.stars[i] || 0, first = i >= save.unlocked && !prev;
      var sand = Math.round((30 + 10 * i + 10 * stars + s.loot) * (1 + 0.1 * ((save.up.castle || 1) - 1)));
      var pearls = Math.max(0, stars - prev) + (first ? 1 : 0);
      save.sand += sand; save.pearls += pearls; save.stars[i] = Math.max(prev, stars);
      save.unlocked = Math.min(D.LEVELS.length - 1, Math.max(save.unlocked, i + 1));
      if (i === D.LEVELS.length - 1) save.beaten = true;
      persist(); Sfx.play('win');
      var st = ''; for (var k = 0; k < 3; k++) st += '<span class="' + (k < stars ? 'on' : '') + '">\u2605</span>';
      var next = i + 1 < D.LEVELS.length;
      modal('<h2>Castle toppled!</h2><div class="stars">' + st + '</div><p>' + (s.charge ? 'Won in the final charge!' : s.moves + ' moves to spare') + ' &middot; ' + s.stats.troops + ' troops sent</p>' +
        '<div class="rewards"><span class="chip"><i class="ico-sand"></i>+' + sand + '</span>' + (pearls ? '<span class="chip"><i class="ico-pearl"></i>+' + pearls + '</span>' : '') + '</div>' +
        (i === D.LEVELS.length - 1 ? '<p class="tip">You beat the great Clawcastle! Replay raids for 3 stars and max out your beach.</p>' : '') +
        '<div class="btns">' + (next ? '<button class="btn big orange" id="r-next">Next raid</button>' : '') + '<div class="row"><button class="btn small blue" id="r-base">Home Beach</button><button class="btn small green" id="r-again">Replay</button></div><button class="btn small ghost" id="r-map">Map</button></div>', 'win');
      if (next) $('#r-next').onclick = function () { closeModal(); intro(i + 1); };
    } else {
      Sfx.play('lose');
      var f = E.flag(s);
      modal('<h2 class="lose">The tide turned...</h2><p>The Flag Tower held with <b>' + (f ? Math.ceil(f.hp) : 0) + ' HP</b> left.</p>' +
        '<p class="tip">Tip: send troops up the flag\'s column, take out cannons that cover it, and upgrade your crew at Home Beach.</p>' +
        '<div class="btns">' + (extraUsed ? '' : '<button class="btn green" id="r-extra">+3 moves (free while ads are off)</button>') + '<div class="row"><button class="btn small orange" id="r-again">Try again</button><button class="btn small blue" id="r-base">Home Beach</button></div><button class="btn small ghost" id="r-map">Map</button></div>', 'lose');
      if (!extraUsed) $('#r-extra').onclick = function () {
        window.Ads.showRewarded('extra_moves').then(function () { extraUsed = true; closeModal(); s.status = 'play'; s.moves += 3; s.charge = 0; hud(); toast('+3 moves! (A rewarded ad will go here in the app.)'); });
      };
    }
    $('#r-again').onclick = function () { closeModal(); start(i); };
    $('#r-base').onclick = function () { closeModal(); s = null; show('base'); };
    $('#r-map').onclick = function () { closeModal(); s = null; show('map'); };
  }

  // ---------- loop ----------
  var last = performance.now(), T = 0, bctx = baseCv.getContext('2d');
  function loop(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
    if (screen === 'game' && s) {
      R.frame(s, T, dt);
      idleT += dt;
      if (idleT > 6 && !busy && s.status === 'play' && !R.hint) { R.hint = E.findMove(s); }
    } else {
      var ctx = cv.getContext('2d'), v = R.view, dpr = cv.width / v.W;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R.drawScene(ctx, v.W, v.H, T, save.up, screen === 'title' ? { seaY: 0.12, castleY: 0.1, scale: 0.16 } : { seaY: 0.22, castleY: 0.17, scale: 0.1 });
      if (screen === 'base') {
        var bw = baseCv.clientWidth, bh = baseCv.clientHeight, d2 = Math.min(2, window.devicePixelRatio || 1);
        if (baseCv.width !== Math.round(bw * d2)) { baseCv.width = Math.round(bw * d2); baseCv.height = Math.round(bh * d2); }
        bctx.setTransform(d2, 0, 0, d2, 0, 0);
        R.drawScene(bctx, bw, bh, T, save.up, { seaY: 0.12, castleY: 0.3, scale: 0.17 });
      }
    }
    requestAnimationFrame(loop);
  }
  window.addEventListener('resize', function () { R.resize(); R.vis = {}; });

  // ---------- boot ----------
  R.init(cv);
  Sfx.set('sound', save.sound); Sfx.set('music', save.music); soundLabels();
  show('title');
  requestAnimationFrame(loop);
  if (document.fonts && document.fonts.load) document.fonts.load('20px "Lilita One"');

  // test / debug hooks
  window.__cc = {
    get state() { return s; }, get screen() { return screen; }, get busy() { return busy; }, get save() { return save; },
    set fast(v) { FAST = !!v; }, E: E, start: start, show: show, intro: intro,
    botMove: function () { if (!s || busy || s.status !== 'play') return false; var m = E.botMove(s); if (!m) return false; runMove(m[0], m[1]); return true; },
    attempt: attempt,
    reset: function () { save = defaults(); persist(); }
  };
})();
