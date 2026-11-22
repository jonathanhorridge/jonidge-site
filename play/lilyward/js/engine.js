/* Lilyward - simulation engine. Pure logic, no DOM. Units: tiles, seconds. */
(function (root) {
  'use strict';
  var D = root.GameData || (typeof require !== 'undefined' ? require('./data.js') : null);
  var COLS = D.COLS, ROWS = D.ROWS;

  function buildPath(pts) {
    var p = pts.map(function (a) { return { x: a[0] + 0.5, y: a[1] + 0.5 }; });
    var segs = [], total = 0;
    for (var i = 0; i < p.length - 1; i++) {
      var dx = p[i + 1].x - p[i].x, dy = p[i + 1].y - p[i].y, len = Math.sqrt(dx * dx + dy * dy);
      segs.push({ a: p[i], b: p[i + 1], len: len, start: total, dx: dx / len, dy: dy / len });
      total += len;
    }
    return { pts: p, segs: segs, length: total };
  }
  function pathPos(path, d) {
    var s = path.segs;
    if (d <= 0) return { x: s[0].a.x + s[0].dx * d, y: s[0].a.y + s[0].dy * d, dx: s[0].dx, dy: s[0].dy };
    for (var i = 0; i < s.length; i++) {
      if (d <= s[i].start + s[i].len || i === s.length - 1) {
        var t = d - s[i].start;
        return { x: s[i].a.x + s[i].dx * t, y: s[i].a.y + s[i].dy * t, dx: s[i].dx, dy: s[i].dy };
      }
    }
  }
  function pathTiles(pts) {
    var set = {};
    for (var i = 0; i < pts.length - 1; i++) {
      var x = pts[i][0], y = pts[i][1], x2 = pts[i + 1][0], y2 = pts[i + 1][1];
      var sx = Math.sign(x2 - x), sy = Math.sign(y2 - y);
      while (true) { set[x + ',' + y] = 1; if (x === x2 && y === y2) break; x += sx; y += sy; }
    }
    return set;
  }
  function computePads(pts) {
    var pt = pathTiles(pts), cand = [], chosen = {}, pads = [];
    for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) {
      if (pt[x + ',' + y]) continue;
      var near = false;
      for (var oy = -1; oy <= 1 && !near; oy++) for (var ox = -1; ox <= 1; ox++) if (pt[(x + ox) + ',' + (y + oy)]) { near = true; break; }
      if (near) cand.push([x, y]);
    }
    cand.forEach(function (c) {
      var x = c[0], y = c[1];
      if (chosen[(x - 1) + ',' + y] || chosen[x + ',' + (y - 1)] || chosen[(x + 1) + ',' + y] || chosen[x + ',' + (y + 1)]) return;
      chosen[x + ',' + y] = 1; pads.push({ x: x + 0.5, y: y + 0.5, tx: x, ty: y, tower: null });
    });
    return { pads: pads, pathSet: pt };
  }
  function parseWave(str) {
    var out = [], t = 0;
    str.split(',').forEach(function (g, gi) {
      var m = /^(\w+)\*(\d+)@([\d.]+)$/.exec(g.trim());
      if (!m) throw new Error('bad wave ' + g);
      if (gi > 0) t += 1.5;
      for (var i = 0; i < +m[2]; i++) { out.push({ type: m[1], t: t }); t += +m[3]; }
    });
    return out;
  }

  function create(levelIndex, meta) {
    meta = meta || {};
    var L = D.LEVELS[levelIndex], pads = computePads(L.path);
    var s = {
      level: levelIndex, L: L, path: buildPath(L.path), pads: pads.pads, pathSet: pads.pathSet,
      coins: 140 + levelIndex * 20 + (meta.coins || 0) * 15,
      lives: 20 + (meta.lives || 0) * 2, maxLives: 20 + (meta.lives || 0) * 2,
      dmgMul: 1 + (meta.power || 0) * 0.06, chorusMul: 1 + (meta.chorus || 0) * 0.2,
      hpMul: (1 + levelIndex * 0.11) * (L.hp || 1),
      waves: L.waves.map(parseWave), wave: 0, spawns: [], time: 0,
      enemies: [], towers: [], projectiles: [], fx: [], events: [],
      rng: (function (seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; })(levelIndex * 7919 + 17),
      status: 'ready', breakT: 0, chorus: 0, chorusStun: 0, nextId: 1, kills: 0, leaked: 0, revived: false, earned: 0
    };
    return s;
  }

  function ev(s, e) { s.events.push(e); }

  function canSendWave(s) { return s.status === 'play' || s.status === 'ready' ? s.wave < s.waves.length && s.spawns.length === 0 : false; }
  function sendWave(s) {
    if (!canSendWave(s)) return false;
    var bonus = 0;
    if (s.status === 'play' && s.enemies.length > 0) bonus = 6 + s.level * 2;
    else if (s.breakT > 0) bonus = Math.ceil(s.breakT);
    s.coins += bonus; s.breakT = 0;
    var w = s.waves[s.wave], wm = 1 + s.wave * 0.06;
    w.forEach(function (sp) { s.spawns.push({ type: sp.type, at: s.time + sp.t, hpm: wm }); });
    s.wave++; s.status = 'play';
    ev(s, { t: 'wave', n: s.wave, bonus: bonus, boss: w.some(function (x) { return D.ENEMIES[x.type].boss; }) });
    return true;
  }

  function spawn(s, sp) {
    var E = D.ENEMIES[sp.type], hp = Math.round(E.hp * s.hpMul * sp.hpm);
    s.enemies.push({ id: s.nextId++, type: sp.type, E: E, hp: hp, maxHp: hp, d: -0.4 - s.rng() * 0.2, slow: 0, slowT: 0, poison: 0, poisonT: 0, stun: 0, stompT: E.stomp ? E.stomp.every * 0.6 : 0, x: 0, y: 0, wob: s.rng() * 6, hitT: 0, lane: (s.rng() - 0.5) * 0.3 });
  }

  function placeEnemy(s, e) { var p = pathPos(s.path, e.d); e.x = p.x - p.dy * e.lane; e.y = p.y + p.dx * e.lane; e.dirx = p.dx; e.diry = p.dy; }

  function damage(s, e, amt, opts) {
    if (e.hp <= 0) return;
    opts = opts || {};
    var a = opts.pierce ? 0 : (e.E.armor || 0);
    var dmg = Math.max(1, (amt - a) * (opts.raw ? 1 : s.dmgMul));
    e.hp -= dmg; e.hitT = 0.12;
    if (e.hp <= 0) {
      s.coins += e.E.reward; s.earned += e.E.reward; s.kills++;
      s.chorus = Math.min(1, s.chorus + (e.E.boss ? 0.5 : 0.022) * s.chorusMul);
      ev(s, { t: 'kill', x: e.x, y: e.y, type: e.type, reward: e.E.reward, boss: !!e.E.boss });
    }
  }

  function inRange(t, e, r) { var dx = e.x - t.x, dy = e.y - t.y; return dx * dx + dy * dy <= r * r; }
  function target(s, t, st) {
    var best = null;
    for (var i = 0; i < s.enemies.length; i++) {
      var e = s.enemies[i];
      if (e.hp <= 0 || e.d < 0) continue;
      if (e.E.air && !D.TOWERS[t.type].air) continue;
      if (!inRange(t, e, st.range)) continue;
      if (!best || e.d > best.d) best = e;
    }
    return best;
  }
  function splash(s, x, y, r, dmg, opts, air) {
    for (var i = 0; i < s.enemies.length; i++) {
      var e = s.enemies[i];
      if (e.hp <= 0 || (e.E.air && !air)) continue;
      var dx = e.x - x, dy = e.y - y;
      if (dx * dx + dy * dy <= r * r) {
        damage(s, e, dmg, opts);
        if (opts.slow) { e.slow = Math.max(e.slow, opts.slow); e.slowT = Math.max(e.slowT, opts.slowT); }
      }
    }
  }

  function towerStats(t) { return D.TOWERS[t.type].lv[t.lvl]; }
  // Crowding: each copy of the same frog already on the pond makes the next one 15% (of base) pricier,
  // so spamming one frog type gets expensive and mixed defenses stay the efficient choice.
  var CROWD = 0.15;
  function countType(s, type) { var n = 0; for (var i = 0; i < s.towers.length; i++) if (s.towers[i].type === type) n++; return n; }
  function buildCost(s, type) {
    var base = D.TOWERS[type].cost, n = countType(s, type);
    return n ? Math.round(base * (1 + CROWD * n) / 5) * 5 : base;
  }
  function build(s, padIdx, type) {
    var pad = s.pads[padIdx], cost = buildCost(s, type);
    if (!pad || pad.tower || s.coins < cost) return null;
    var t = { id: s.nextId++, type: type, lvl: 0, x: pad.x, y: pad.y, pad: padIdx, cd: 0.2, spent: cost, aim: Math.PI / 2, anim: 0, stun: 0, eco: 0 };
    s.coins -= cost; pad.tower = t; s.towers.push(t);
    ev(s, { t: 'build', x: t.x, y: t.y, type: type });
    return t;
  }
  function upgradeCost(t) { var n = D.TOWERS[t.type].lv[t.lvl + 1]; return n ? n.cost : null; }
  function upgrade(s, t) {
    var c = upgradeCost(t);
    if (c == null || s.coins < c) return false;
    s.coins -= c; t.spent += c; t.lvl++;
    ev(s, { t: 'upgrade', x: t.x, y: t.y, lvl: t.lvl });
    return true;
  }
  function sellValue(t) { return Math.floor(t.spent * 0.7); }
  function sell(s, t) {
    s.coins += sellValue(t); s.pads[t.pad].tower = null;
    s.towers = s.towers.filter(function (x) { return x !== t; });
    ev(s, { t: 'sell', x: t.x, y: t.y, value: sellValue(t) });
  }
  function chorus(s) {
    if (s.chorus < 1 || s.status !== 'play') return false;
    s.chorus = 0; s.chorusStun = 2.5;
    var dmg = 25 * s.hpMul;
    s.enemies.forEach(function (e) { e.stun = Math.max(e.stun, e.E.boss ? 1.2 : 2.5); damage(s, e, dmg, { pierce: true }); });
    ev(s, { t: 'chorus' });
    return true;
  }
  function tap(s, x, y) {
    var best = null, bd = 0.7 * 0.7;
    s.enemies.forEach(function (e) { var dx = e.x - x, dy = e.y - y, dd = dx * dx + dy * dy; if (e.hp > 0 && dd < bd) { bd = dd; best = e; } });
    if (!best) return false;
    damage(s, best, 6 * s.hpMul, { pierce: true, raw: true });
    ev(s, { t: 'swat', x: best.x, y: best.y });
    return true;
  }
  function revive(s) {
    if (s.status !== 'dead' || s.revived) return false;
    s.revived = true; s.lives = 5; s.status = 'play';
    s.enemies.forEach(function (e) { e.stun = 3; e.d = Math.max(0, e.d - 3); });
    ev(s, { t: 'revive' });
    return true;
  }

  function stepTower(s, t, dt) {
    var T = D.TOWERS[t.type], st = towerStats(t);
    t.anim = Math.max(0, t.anim - dt);
    if (t.stun > 0) { t.stun -= dt; return; }
    if (T.eco) {
      if (s.enemies.length || s.spawns.length) {
        t.eco += dt;
        if (t.eco >= st.every) { t.eco = 0; s.coins += st.coins; s.earned += st.coins; t.anim = 0.4; ev(s, { t: 'coin', x: t.x, y: t.y, n: st.coins }); }
      }
      return;
    }
    t.cd -= dt;
    if (t.cd > 0) return;
    var e = target(s, t, st);
    if (!e) return;
    t.cd = st.rate; t.anim = 0.18;
    t.aim = Math.atan2(e.y - t.y, e.x - t.x);
    ev(s, { t: 'shoot', type: t.type });
    if (t.type === 'tongue') {
      damage(s, e, st.dmg);
      s.fx.push({ k: 'tongue', x1: t.x, y1: t.y, x2: e.x, y2: e.y, life: 0.12, max: 0.12 });
    } else if (t.type === 'newt') {
      var hit = [e], cur = e;
      for (var j = 1; j < st.chain; j++) {
        var nx = null, nd = 1.6 * 1.6;
        for (var k = 0; k < s.enemies.length; k++) {
          var o = s.enemies[k];
          if (o.hp <= 0 || hit.indexOf(o) >= 0) continue;
          var dx = o.x - cur.x, dy = o.y - cur.y, dd = dx * dx + dy * dy;
          if (dd < nd) { nd = dd; nx = o; }
        }
        if (!nx) break; hit.push(nx); cur = nx;
      }
      var pts = [{ x: t.x, y: t.y - 0.1 }];
      hit.forEach(function (h, i) { damage(s, h, st.dmg * Math.pow(0.8, i)); pts.push({ x: h.x, y: h.y }); });
      s.fx.push({ k: 'zap', pts: pts, life: 0.18, max: 0.18 });
    } else {
      s.projectiles.push({ type: t.type, x: t.x, y: t.y, sx: t.x, sy: t.y, tx: e.x, ty: e.y, target: e, st: st,
        spd: t.type === 'toad' ? 3.6 : t.type === 'dart' ? 11 : 6, t: 0,
        dur: t.type === 'toad' ? Math.max(0.35, Math.hypot(e.x - t.x, e.y - t.y) / 3.6) : 0 });
    }
  }

  function stepProjectile(s, p, dt) {
    if (p.type === 'toad') {
      p.t += dt;
      var k = Math.min(1, p.t / p.dur);
      p.x = p.sx + (p.tx - p.sx) * k; p.y = p.sy + (p.ty - p.sy) * k; p.h = Math.sin(k * Math.PI) * 1.2;
      if (k >= 1) { splash(s, p.tx, p.ty, p.st.splash, p.st.dmg, {}, false); ev(s, { t: 'boom', x: p.tx, y: p.ty, r: p.st.splash }); return false; }
      return true;
    }
    var e = p.target;
    if (e && e.hp > 0) { p.tx = e.x; p.ty = e.y; }
    var dx = p.tx - p.x, dy = p.ty - p.y, d = Math.sqrt(dx * dx + dy * dy), mv = p.spd * dt;
    if (d <= mv + 0.05) {
      if (p.type === 'bubble') { splash(s, p.tx, p.ty, p.st.splash, p.st.dmg, { slow: p.st.slow, slowT: p.st.slowT }, true); ev(s, { t: 'pop', x: p.tx, y: p.ty }); }
      else if (p.type === 'dart' && e && e.hp > 0) { damage(s, e, p.st.dmg, { pierce: true }); e.poison = p.st.poison; e.poisonT = p.st.poisonT; ev(s, { t: 'dart', x: p.tx, y: p.ty }); }
      return false;
    }
    p.x += dx / d * mv; p.y += dy / d * mv;
    return true;
  }

  function step(s, dt) {
    if (s.status !== 'play') return;
    s.time += dt;
    for (var i = s.spawns.length - 1; i >= 0; i--) if (s.spawns[i].at <= s.time) { spawn(s, s.spawns[i]); s.spawns.splice(i, 1); }
    s.chorusStun = Math.max(0, s.chorusStun - dt);
    for (i = 0; i < s.enemies.length; i++) {
      var e = s.enemies[i];
      e.hitT = Math.max(0, e.hitT - dt);
      if (e.poisonT > 0) { e.poisonT -= dt; damage(s, e, e.poison * dt, { pierce: true, raw: true }); }
      if (e.hp <= 0) continue;
      if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slow = 0; }
      if (e.stun > 0) { e.stun -= dt; placeEnemy(s, e); continue; }
      var sp = e.E.spd * (1 - (e.E.boss ? e.slow * 0.4 : e.slow));
      e.d += sp * dt; e.wob += dt * sp * 9;
      placeEnemy(s, e);
      if (e.E.stomp) {
        e.stompT -= dt;
        if (e.stompT <= 0) {
          e.stompT = e.E.stomp.every;
          s.towers.forEach(function (t) { if (inRange(t, e, e.E.stomp.radius)) { t.stun = e.E.stomp.stun; } });
          ev(s, { t: 'stomp', x: e.x, y: e.y, r: e.E.stomp.radius });
        }
      }
      if (e.d >= s.path.length) {
        e.hp = 0; e.leaked = true; s.lives = Math.max(0, s.lives - e.E.lives); s.leaked += e.E.lives;
        ev(s, { t: 'leak', x: e.x, y: e.y, n: e.E.lives });
      }
    }
    s.towers.forEach(function (t) { stepTower(s, t, dt); });
    s.projectiles = s.projectiles.filter(function (p) { return stepProjectile(s, p, dt); });
    s.enemies = s.enemies.filter(function (e) { return e.hp > 0; });
    s.fx = s.fx.filter(function (f) { f.life -= dt; return f.life > 0; });
    if (s.wave > 0 && s.wave < s.waves.length && !s.spawns.length && !s.enemies.length) {
      if (!s.breakT) s.breakT = 8;
      s.breakT -= dt;
      if (s.breakT <= 0) { s.breakT = 0; sendWave(s); }
    }
    if (s.lives <= 0) { s.status = 'dead'; ev(s, { t: 'dead' }); return; }
    if (s.wave >= s.waves.length && !s.spawns.length && !s.enemies.length) {
      s.status = 'won';
      s.stars = s.lives >= s.maxLives * 0.9 ? 3 : s.lives >= s.maxLives * 0.5 ? 2 : 1;
      ev(s, { t: 'won', stars: s.stars });
    }
  }

  var Engine = { create: create, step: step, build: build, buildCost: buildCost, upgrade: upgrade, upgradeCost: upgradeCost, sell: sell, sellValue: sellValue,
    sendWave: sendWave, canSendWave: canSendWave, chorus: chorus, tap: tap, revive: revive, towerStats: towerStats, pathPos: pathPos };
  root.Engine = Engine;
  if (typeof module !== 'undefined') module.exports = Engine;
})(typeof self !== 'undefined' ? self : this);
