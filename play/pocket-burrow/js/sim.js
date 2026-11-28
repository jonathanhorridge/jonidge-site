/* Pocket Burrow simulation: all rules, no DOM, no timers. Every function takes `now` (ms) so the same code runs the
 * live game, the offline catch-up and the Node tests. State is plain JSON (see docs/GDD.md 13 for the save format). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./data.js'));
  else root.PB_SIM = factory(root.PB_DATA);
})(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';
  var HOUR = D.HOUR, DAY = 24 * HOUR;
  var SAVE_VERSION = 1;

  // ---------- rng (mulberry32 on a stored seed so saves stay deterministic) ----------
  function rand(s) {
    s.rng = (s.rng + 0x6D2B79F5) >>> 0;
    var t = s.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function randInt(s, a, b) { return a + Math.floor(rand(s) * (b - a + 1)); }
  function dayKey(ms) { var d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function localMidnight(ms) { var d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function atHour(ms, h) { var d = new Date(ms); d.setHours(h, 0, 0, 0); return d.getTime(); }
  function key(x, y) { return x + ',' + y; }

  // ---------- state ----------
  function newState(now, seed) {
    var s = {
      v: SAVE_VERSION, createdAt: now, lastSeen: now, rng: (seed == null ? (now & 0x7fffffff) : seed) >>> 0,
      acorns: D.START.acorns, berries: D.START.berries, goods: {},
      cells: {}, digs: [], tut: 0,
      album: {},                       // id -> { met: ts, resident: bool, since: ts|null, visits: n }
      visitors: [],                    // [{ id, critter, good, n, arrivedAt, expiresAt, wanderer, rare }]
      vis: { lastSlot: now, lastRareDay: dayKey(now), uid: 1 },
      daily: { lastDay: null, index: 0 },
      visitDays: 0, lastVisitDay: null,
      season: { key: null, days: 0, claimed: false },
      decor: { owned: {}, placed: {} },
      ads: { day: dayKey(now), watched: 0, doubles: 0, berry: 0, bell: 0 },
      supporter: false, albumClaimed: {},
      settings: { sound: true, music: true, notifications: false, southern: false, reduceMotion: false },
      stats: { collects: 0, acornsEarned: 0, requestsDone: 0 }
    };
    // the entrance hall under the front door is already dug (not counted for dig costs)
    s.cells[key(D.GRID.entranceCol, 0)] = { dug: true, foyer: true };
    return s;
  }

  function cellAt(s, x, y) { return s.cells[key(x, y)] || null; }
  function dugCount(s) {
    var n = 0; for (var k in s.cells) if (s.cells[k].dug && !s.cells[k].foyer) n++;
    return n + s.digs.length;
  }
  function eachRoom(s, fn) {
    for (var k in s.cells) { var c = s.cells[k]; if (c.room) { var p = k.split(','); fn(c.room, +p[0], +p[1], c); } }
  }
  function roomCount(s) { var n = 0; eachRoom(s, function () { n++; }); return n; }
  function hasRoom(s, id) { var f = false; eachRoom(s, function (r) { if (r.id === id) f = true; }); return f; }
  function findRoom(s, id) { var f = null; eachRoom(s, function (r, x, y) { if (r.id === id) f = { room: r, x: x, y: y }; }); return f; }

  // ---------- burrow level ----------
  function cozy(s) {
    var p = 0, C = D.COZY;
    eachRoom(s, function (r) { p += C.perRoom + C.perRoomLevel * (r.lvl - 1); p += C.perResident * r.critters.length; });
    for (var id in s.album) p += C.perMet;
    for (var d in s.decor.owned) if (s.decor.owned[d]) p += C.perDecor;
    return p;
  }
  function level(s) {
    var p = cozy(s), L = 1, T = D.COZY.thresholds;
    for (var i = 0; i < T.length; i++) if (p >= T[i]) L = i + 1;
    return L;
  }
  function levelProgress(s) {
    var p = cozy(s), L = level(s), T = D.COZY.thresholds;
    if (L >= T.length) return { level: L, pct: 1, cur: p, next: null };
    return { level: L, pct: (p - T[L - 1]) / (T[L] - T[L - 1]), cur: p, next: T[L] };
  }

  // ---------- rooms: production ----------
  function roomRate(room) {
    var def = D.ROOM_BY_ID[room.id], bonus = 0;
    room.critters.forEach(function (cid) { bonus += D.RARITY[D.CRITTER_BY_ID[cid].rarity].bonus; });
    return def.rate * D.ROOM_LEVELS.rateMult[room.lvl - 1] * (1 + bonus);
  }
  function roomCap(room) { return roomRate(room) * D.ROOM_LEVELS.capHours[room.lvl - 1]; }
  function roomBeds(room) { return D.ROOM_LEVELS.beds[room.lvl - 1]; }
  function accrue(room, now) {
    var dt = Math.max(0, now - room.at) / HOUR;
    if (dt > 0) room.stock = Math.min(roomCap(room), room.stock + roomRate(room) * dt);
    room.at = Math.max(room.at, now);
  }
  function timeToFull(room, now) {
    var r = roomRate(room), cap = roomCap(room);
    if (room.stock >= cap) return 0;
    return (cap - room.stock) / r * HOUR - Math.max(0, now - room.at);
  }
  /** goods ready in a basket, as the player would see it right now (no mutation). */
  function ready(room, now) {
    var dt = Math.max(0, now - room.at) / HOUR;
    return Math.min(roomCap(room), room.stock + roomRate(room) * dt);
  }

  // ---------- tick: advance the world to `now` (live frames, resume, offline catch-up) ----------
  function tick(s, now) {
    var ev = [];
    var cheat = now < s.lastSeen - 5 * 60000;            // clock moved back: freeze instead of replaying time
    if (cheat) { s.lastSeen = now; return ev; }
    // digs
    s.digs = s.digs.filter(function (d) {
      if (d.end != null && now >= d.end) { s.cells[key(d.x, d.y)] = { dug: true }; ev.push({ t: 'digDone', x: d.x, y: d.y }); return false; }
      return true;
    });
    // rooms (accrue, baskets, gifts)
    eachRoom(s, function (r, x, y) {
      var before = r.stock, wasFull = r.full;
      accrue(r, now);
      var full = r.stock >= roomCap(r) - 1e-6;
      if (full && !wasFull) ev.push({ t: 'basketFull', x: x, y: y });
      r.full = full;
      if (r.critters.length && r.giftAt != null && now >= r.giftAt && !r.giftReady) { r.giftReady = true; ev.push({ t: 'giftReady', x: x, y: y }); }
    });
    spawnVisitors(s, now, ev);
    s.visitors = s.visitors.filter(function (v) { if (now >= v.expiresAt) { ev.push({ t: 'visitorLeft', v: v }); return false; } return true; });
    // visit days / season
    var dk = dayKey(now);
    if (s.lastVisitDay !== dk) {
      s.lastVisitDay = dk; s.visitDays++;
      var sk = D.seasonOf(new Date(now), s.settings.southern) + '-' + new Date(now).getFullYear();
      if (s.season.key !== sk) s.season = { key: sk, days: 0, claimed: false };
      s.season.days++;
      ev.push({ t: 'newDay', day: dk });
    }
    if (s.ads.day !== dk) s.ads = { day: dk, watched: 0, doubles: 0, berry: 0, bell: 0 };
    s.lastSeen = Math.max(s.lastSeen, now);
    return ev;
  }

  // ---------- visitors ----------
  function eligibleCritters(s, rareOnly, now) {
    var L = level(s), out = [];
    D.CRITTERS.forEach(function (c) {
      var a = s.album[c.id];
      if (a && a.resident) return;
      if (s.visitors.some(function (v) { return v.critter === c.id; })) return;
      var rar = c.rarity;
      if (rar === 'legendary' && L < 8) return;
      if (rar === 'rare' && L < 3) return;
      if (rareOnly && rar !== 'rare' && rar !== 'legendary') return;
      if (!rareOnly && (rar === 'rare' || rar === 'legendary')) return;
      var built = hasRoom(s, c.room), roomDef = D.ROOM_BY_ID[c.room];
      var wanderer = !built && roomDef.unlock <= L + 1;      // a friend of a room you haven't built yet
      if (!built && !wanderer) return;
      out.push({ c: c, wanderer: !built });
    });
    return out;
  }
  function pickWeighted(s, list) {
    var tot = 0; list.forEach(function (e) { e.w = D.RARITY[e.c.rarity].weight * (e.wanderer ? D.VISITORS.wandererChance : 1); tot += e.w; });
    if (!tot) return null;
    var r = rand(s) * tot;
    for (var i = 0; i < list.length; i++) { r -= list[i].w; if (r <= 0) return list[i]; }
    return list[list.length - 1];
  }
  function makeRequest(s, c) {
    var L = level(s);
    var good = hasRoom(s, c.room) ? D.ROOM_BY_ID[c.room].good : null;
    if (!good) { var owned = []; eachRoom(s, function (r) { owned.push(D.ROOM_BY_ID[r.id].good); }); good = owned[Math.floor(rand(s) * owned.length)] || 'mushroom'; }
    var mult = { common: 1, uncommon: 1.3, rare: 1.8, legendary: 2.5 }[c.rarity];
    var n = Math.min(40, Math.max(2, Math.round((D.VISITORS.requestBase + L * 0.8 + randInt(s, 0, 2)) * mult)));
    return { good: good, n: n };
  }
  function addVisitor(s, c, wanderer, at, rare) {
    var q = makeRequest(s, c);
    var v = { id: 'v' + (s.vis.uid++), critter: c.id, good: q.good, n: q.n, arrivedAt: at, expiresAt: at + D.VISITORS.staysHours * HOUR, wanderer: !!wanderer, rare: !!rare };
    s.visitors.push(v);
    var a = s.album[c.id]; if (!a) { /* not met until the request is served; seen is tracked separately */ }
    return v;
  }
  function spawnVisitors(s, now, ev) {
    if (s.tut < 5) return;                                     // tutorial visitor is scripted
    var first = Math.max(s.vis.lastSlot, now - 3 * DAY);
    var t0 = localMidnight(first) - DAY;
    for (var day = t0; day <= now + DAY; day += DAY) {
      var hours = D.VISITORS.slotHours.concat([D.VISITORS.nightHour]);
      for (var i = 0; i < hours.length; i++) {
        var t = atHour(day + 12 * HOUR, hours[i]);              // +12h keeps DST edges on the right date
        if (t <= s.vis.lastSlot || t > now) continue;
        var night = hours[i] === D.VISITORS.nightHour, rareSlot = false;
        if (night) {
          var since = Math.round((localMidnight(t) - localMidnight(new Date(s.vis.lastRareDay + 'T12:00:00').getTime())) / DAY);
          rareSlot = rand(s) < D.VISITORS.nightRareChance || since >= D.VISITORS.rarePityDays;
          if (!rareSlot) { s.vis.lastSlot = t; continue; }       // plain nights stay quiet: 3 normal visitors/day
        }
        var list = eligibleCritters(s, rareSlot, t);
        if (rareSlot && !list.length) { list = eligibleCritters(s, false, t); rareSlot = false; }
        var pick = pickWeighted(s, list);
        s.vis.lastSlot = t;
        if (!pick || t + D.VISITORS.staysHours * HOUR <= now) continue;
        if (s.visitors.length >= D.VISITORS.maxWaiting) {
          // oldest common guest quietly heads home to make space
          var idx = -1; s.visitors.forEach(function (v, k) { if (idx < 0 && D.CRITTER_BY_ID[v.critter].rarity === 'common') idx = k; });
          if (idx < 0) continue;
          ev.push({ t: 'visitorLeft', v: s.visitors.splice(idx, 1)[0] });
        }
        var vis = addVisitor(s, pick.c, pick.wanderer, t, rareSlot);
        if (rareSlot) s.vis.lastRareDay = dayKey(t);
        ev.push({ t: 'visitor', v: vis, rare: rareSlot });
      }
    }
    if (s.vis.lastSlot < now - 3 * DAY) s.vis.lastSlot = now - 3 * DAY;
  }
  /** player summoned an extra guest (rewarded bell) */
  function summonVisitor(s, now) {
    var list = eligibleCritters(s, false, now);
    var pick = pickWeighted(s, list);
    if (!pick) return null;
    return addVisitor(s, pick.c, pick.wanderer, now, false);
  }

  function visitorById(s, id) { for (var i = 0; i < s.visitors.length; i++) if (s.visitors[i].id === id) return s.visitors[i]; return null; }
  function fulfillVisitor(s, id, now) {
    var v = visitorById(s, id);
    if (!v) return { ok: false, reason: 'gone' };
    if ((s.goods[v.good] || 0) < v.n) return { ok: false, reason: 'goods', need: v.n, have: s.goods[v.good] || 0 };
    s.goods[v.good] -= v.n;
    var c = D.CRITTER_BY_ID[v.critter], g = D.GOODS[v.good];
    var acorns = Math.ceil(v.n * g.value * D.VISITORS.reward.acornMult);
    var berries = (c.rarity === 'rare' || c.rarity === 'legendary') ? 1 : (rand(s) < D.VISITORS.reward.berryChanceCommon ? 1 : 0);
    s.acorns += acorns; s.berries += berries; s.stats.acornsEarned += acorns; s.stats.requestsDone++;
    s.visitors = s.visitors.filter(function (x) { return x.id !== id; });
    var first = !s.album[c.id];
    var a = s.album[c.id] || (s.album[c.id] = { met: now, resident: false, since: null, visits: 0 });
    a.visits++;
    var moved = moveIn(s, c.id, now);
    return { ok: true, acorns: acorns, berries: berries, critter: c.id, first: first, moved: moved, wanderer: !moved && !hasRoom(s, c.room) };
  }
  function dismissVisitor(s, id) { s.visitors = s.visitors.filter(function (x) { return x.id !== id; }); }

  // ---------- moving in ----------
  function moveIn(s, cid, now) {
    var c = D.CRITTER_BY_ID[cid], f = findRoom(s, c.room);
    if (!f) return false;
    var a = s.album[cid]; if (!a || a.resident) return false;
    if (f.room.critters.length >= roomBeds(f.room)) return false;
    accrue(f.room, now);
    f.room.critters.push(cid); a.resident = true; a.since = now;
    if (f.room.giftAt == null) { f.room.giftAt = now + D.GIFTS.everyHours * HOUR; f.room.giftReady = false; }
    return { x: f.x, y: f.y };
  }
  /** friends who already visited move in as soon as their room (or a bed) exists */
  function settleFriends(s, now) {
    var moved = [];
    D.CRITTERS.forEach(function (c) { var a = s.album[c.id]; if (a && !a.resident) { var m = moveIn(s, c.id, now); if (m) moved.push({ id: c.id, x: m.x, y: m.y }); } });
    return moved;
  }

  // ---------- digging ----------
  function neighbors(x, y) { return [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]; }
  function canDigCell(s, x, y) {
    if (x < 0 || y < 0 || x >= D.GRID.cols || y >= D.GRID.rows) return false;
    if (cellAt(s, x, y) || s.digs.some(function (d) { return d.x === x && d.y === y; })) return false;
    return neighbors(x, y).some(function (p) { var c = cellAt(s, p[0], p[1]); return c && c.dug; });
  }
  function maxDigs(s) { return level(s) >= 6 ? 2 : 1; }
  function digInfo(s, x, y) {
    var n = dugCount(s);
    return { cost: n < D.DIG.freeTapDigs ? 0 : D.digCost(n), seconds: D.digSeconds(n), tap: n < D.DIG.freeTapDigs, stratum: D.stratumForRow(y) };
  }
  function startDig(s, x, y, now) {
    if (!canDigCell(s, x, y)) return { ok: false, reason: 'invalid' };
    var st = D.stratumForRow(y);
    if (level(s) < st.level) return { ok: false, reason: 'level', need: st.level, stratum: st.name };
    if (s.digs.length >= maxDigs(s)) return { ok: false, reason: 'busy' };
    var info = digInfo(s, x, y);
    if (s.acorns < info.cost) return { ok: false, reason: 'acorns', need: info.cost };
    s.acorns -= info.cost;
    s.digs.push({ x: x, y: y, start: now, end: info.tap ? null : now + info.seconds * 1000, taps: 0, total: info.seconds * 1000 });
    return { ok: true, tap: info.tap, cost: info.cost, seconds: info.seconds };
  }
  /** free early digs finish in a few taps. returns done:true when the tunnel opened. */
  function tapDig(s, x, y, now) {
    var d = s.digs.filter(function (q) { return q.x === x && q.y === y; })[0];
    if (!d || d.end != null) return { ok: false };
    d.taps++;
    if (d.taps >= D.DIG.tapsPerFreeDig) {
      s.digs = s.digs.filter(function (q) { return q !== d; });
      s.cells[key(x, y)] = { dug: true };
      return { ok: true, done: true, taps: d.taps };
    }
    return { ok: true, done: false, taps: d.taps };
  }
  function digBerryCost(d, now) { return Math.max(1, Math.ceil((d.end - now) / 60000 / D.DIG.berrySkipMinutesPerBerry)); }
  function skipDigWithBerries(s, x, y, now) {
    var d = s.digs.filter(function (q) { return q.x === x && q.y === y && q.end != null; })[0];
    if (!d) return { ok: false, reason: 'none' };
    var cost = digBerryCost(d, now);
    if (s.berries < cost) return { ok: false, reason: 'berries', need: cost };
    s.berries -= cost; d.end = now;
    return { ok: true, cost: cost, events: tick(s, now) };
  }

  // ---------- building / upgrading ----------
  function buildInfo(s, roomId) {
    var def = D.ROOM_BY_ID[roomId];
    var free = roomId === 'farm' && roomCount(s) === 0;
    return { cost: free ? 0 : def.cost, unlocked: level(s) >= def.unlock, built: hasRoom(s, roomId), def: def };
  }
  function buildRoom(s, x, y, roomId, now) {
    var c = cellAt(s, x, y);
    if (!c || !c.dug || c.foyer || c.room) return { ok: false, reason: 'cell' };
    var bi = buildInfo(s, roomId);
    if (bi.built) return { ok: false, reason: 'built' };
    if (!bi.unlocked) return { ok: false, reason: 'level', need: bi.def.unlock };
    if (s.acorns < bi.cost) return { ok: false, reason: 'acorns', need: bi.cost };
    s.acorns -= bi.cost;
    c.room = { id: roomId, lvl: 1, stock: 0, at: now, critters: [], giftAt: null, giftReady: false, full: false };
    var moved = settleFriends(s, now);
    return { ok: true, cost: bi.cost, moved: moved };
  }
  function upgradeInfo(s, room) {
    if (room.lvl >= D.ROOM_LEVELS.max) return null;
    var def = D.ROOM_BY_ID[room.id], base = def.cost || D.FARM_UPGRADE_BASE;
    return { acorns: Math.round(base * D.ROOM_LEVELS.upgradeCostMult[room.lvl]), goods: D.ROOM_LEVELS.upgradeGoods[room.lvl], good: def.good, toLevel: room.lvl + 1 };
  }
  function upgradeRoom(s, x, y, now) {
    var c = cellAt(s, x, y); if (!c || !c.room) return { ok: false, reason: 'cell' };
    var u = upgradeInfo(s, c.room); if (!u) return { ok: false, reason: 'max' };
    if (s.acorns < u.acorns) return { ok: false, reason: 'acorns', need: u.acorns };
    if ((s.goods[u.good] || 0) < u.goods) return { ok: false, reason: 'goods', need: u.goods, have: s.goods[u.good] || 0, good: u.good };
    accrue(c.room, now);
    s.acorns -= u.acorns; s.goods[u.good] -= u.goods; c.room.lvl++;
    return { ok: true, level: c.room.lvl, moved: settleFriends(s, now) };
  }

  // ---------- collecting ----------
  function collect(s, x, y, now, opts) {
    var c = cellAt(s, x, y); if (!c || !c.room) return { ok: false };
    var r = c.room; accrue(r, now);
    var n = Math.floor(r.stock);
    if (n < 1) return { ok: false, reason: 'empty' };
    var mult = opts && opts.double ? 2 : 1;
    var def = D.ROOM_BY_ID[r.id], g = D.GOODS[def.good];
    r.stock -= n; r.full = false;
    var goods = n * mult, acorns = n * g.value * mult;
    s.goods[def.good] = (s.goods[def.good] || 0) + goods;
    s.acorns += acorns; s.stats.collects++; s.stats.acornsEarned += acorns;
    return { ok: true, good: def.good, goods: goods, acorns: acorns, doubled: mult === 2 };
  }
  function collectAll(s, now) {
    var tot = { goods: {}, acorns: 0, rooms: 0 };
    eachRoom(s, function (r, x, y) { var o = collect(s, x, y, now); if (o.ok) { tot.goods[o.good] = (tot.goods[o.good] || 0) + o.goods; tot.acorns += o.acorns; tot.rooms++; } });
    return tot;
  }
  function heartLevel(hearts) { var n = 0; D.FRIENDSHIP.hearts.forEach(function (h) { if (hearts >= h) n++; }); return n; }
  function storyLine(cid, lvl) { var c = D.CRITTER_BY_ID[cid], arr = D.STORIES[c.room] || []; return (arr[lvl - 1] || '').replace('{n}', c.name); }
  function collectGift(s, x, y, now) {
    var c = cellAt(s, x, y); if (!c || !c.room || !c.room.giftReady) return { ok: false };
    var r = c.room, def = D.ROOM_BY_ID[r.id], best = 'common', order = ['common', 'uncommon', 'rare', 'legendary'];
    r.critters.forEach(function (cid) { var q = D.CRITTER_BY_ID[cid].rarity; if (order.indexOf(q) > order.indexOf(best)) best = q; });
    var acorns = Math.max(5, Math.round(roomRate(r) * D.GOODS[def.good].value * D.GIFTS.acornHours));
    var berries = rand(s) < D.GIFTS.berryChance[best] ? 1 : 0;
    // the resident with the fewest hearts hands it over, so everybody gets to know you
    var who = null, low = 1e9; r.critters.forEach(function (cid) { var h = (s.album[cid] && s.album[cid].hearts) || 0; if (h < low) { low = h; who = cid; } });
    var out = { ok: true, acorns: acorns, berries: berries, critter: who };
    if (who) {
      var a = s.album[who]; var before = heartLevel(a.hearts || 0); a.hearts = (a.hearts || 0) + 1; var lvl = heartLevel(a.hearts);
      out.hearts = a.hearts; out.level = lvl; out.nextAt = D.FRIENDSHIP.hearts[lvl] || null;
      if (lvl > before) {
        var rw = D.FRIENDSHIP.rewards[lvl - 1], ra = Math.round(roomRate(r) * D.GOODS[def.good].value * rw.acornHours);
        acorns += ra; berries += rw.berries || 0; out.acorns = acorns; out.berries = berries;
        out.levelUp = { level: lvl, name: D.FRIENDSHIP.names[lvl], acorns: ra, berries: rw.berries || 0, story: storyLine(who, lvl) };
      }
    }
    s.acorns += acorns; s.berries += berries; s.stats.acornsEarned += acorns;
    r.giftReady = false; r.giftAt = now + D.GIFTS.everyHours * HOUR;
    return out;
  }

  // ---------- daily calendar ----------
  function dailyAvailable(s, now) { return s.daily.lastDay !== dayKey(now); }
  function claimDaily(s, now) {
    if (!dailyAvailable(s, now)) return { ok: false };
    var r = D.DAILY[s.daily.index % D.DAILY.length], out = { ok: true, index: s.daily.index % D.DAILY.length, reward: r };
    if (r.acorns) s.acorns += r.acorns;
    if (r.berries) s.berries += r.berries;
    if (r.goods) { var owned = []; eachRoom(s, function (rm) { owned.push(D.ROOM_BY_ID[rm.id].good); }); var g = owned[owned.length - 1] || 'mushroom'; s.goods[g] = (s.goods[g] || 0) + r.goods; out.good = g; }
    s.daily.lastDay = dayKey(now); s.daily.index++;
    return out;
  }

  // ---------- album milestones ----------
  function albumCount(s) { return Object.keys(s.album).length; }
  function albumMilestones(s) {
    var n = albumCount(s);
    return D.ALBUM_REWARDS.map(function (m) { return { at: m.at, berries: m.berries, acorns: m.acorns || 0, ready: n >= m.at && !s.albumClaimed[m.at], claimed: !!s.albumClaimed[m.at] }; });
  }
  function claimAlbum(s, at) {
    var m = albumMilestones(s).filter(function (q) { return q.at === at; })[0];
    if (!m || !m.ready) return { ok: false };
    s.albumClaimed[at] = true; s.berries += m.berries; s.acorns += m.acorns; return { ok: true, berries: m.berries, acorns: m.acorns };
  }

  // ---------- decor / shop / ads ----------
  function buyDecor(s, id) {
    var d = D.DECOR.filter(function (q) { return q.id === id; })[0];
    if (!d || s.decor.owned[id]) return { ok: false, reason: 'owned' };
    if (d.supporter) return { ok: false, reason: 'supporter' };
    if (s.berries < d.price) return { ok: false, reason: 'berries', need: d.price };
    s.berries -= d.price; s.decor.owned[id] = true; s.decor.placed[id] = true;
    return { ok: true };
  }
  function toggleDecor(s, id) { if (!s.decor.owned[id]) return false; s.decor.placed[id] = !s.decor.placed[id]; return s.decor.placed[id]; }
  function claimSeasonGift(s, now) {
    var season = D.seasonOf(new Date(now), s.settings.southern);
    if (s.season.claimed || s.season.days < 5) return { ok: false };
    var d = D.DECOR.filter(function (q) { return q.season === season && !s.decor.owned[q.id]; })[0];
    if (!d) return { ok: false, reason: 'none' };
    s.decor.owned[d.id] = true; s.decor.placed[d.id] = true; s.season.claimed = true;
    return { ok: true, decor: d.id };
  }
  function grantSupporter(s) {
    if (s.supporter) return { ok: false };
    s.supporter = true; s.berries += 60; s.decor.owned.goldframe = true; s.decor.placed.goldframe = true;
    return { ok: true };
  }
  function adsLeft(s) { return Math.max(0, D.ADS.perDay - s.ads.watched); }
  /** Call after a rewarded ad was completed (or simulated). kind: double | dig | berry | bell */
  function adReward(s, kind, now, arg) {
    if (s.ads.watched >= D.ADS.perDay) return { ok: false, reason: 'limit' };
    if (kind === 'double') {
      if (s.ads.doubles >= D.ADS.doubleHarvest) return { ok: false, reason: 'limit' };
      var o = collect(s, arg.x, arg.y, now, { double: true }); if (!o.ok) return o;
      s.ads.doubles++; s.ads.watched++; return o;
    }
    if (kind === 'dig') {
      var changed = 0;
      s.digs.forEach(function (d) { if (d.end != null && d.end > now) { d.end = now + (d.end - now) / 2; changed++; } });
      if (!changed) return { ok: false, reason: 'none' };
      s.ads.watched++; return { ok: true, changed: changed };
    }
    if (kind === 'berry') {
      if (s.ads.berry >= D.ADS.berryPerDay) return { ok: false, reason: 'limit' };
      s.berries++; s.ads.berry++; s.ads.watched++; return { ok: true };
    }
    if (kind === 'bell') {
      if (s.ads.bell >= 1) return { ok: false, reason: 'limit' };
      var v = summonVisitor(s, now); if (!v) return { ok: false, reason: 'none' };
      s.ads.bell++; s.ads.watched++; return { ok: true, visitor: v };
    }
    return { ok: false };
  }

  // ---------- tutorial (scripted first five minutes) ----------
  // 0 dig first tunnel (taps) -> 1 place Mushroom Farm -> 2 collect first basket -> 3 serve first visitor -> 4 dig second tunnel -> 5 done
  function tutorialAdvance(s, now) {
    var ev = [];
    if (s.tut === 0 && s.digs.length === 0 && dugCount(s) >= 1) s.tut = 1;
    if (s.tut === 1 && hasRoom(s, 'farm')) {
      s.tut = 2;
      var f = findRoom(s, 'farm');
      // Truffle the mole is the very first resident; the first basket starts half full so step 3 is immediate
      s.album.truffle = { met: now, resident: false, since: null, visits: 1 };
      moveIn(s, 'truffle', now);
      f.room.stock = roomCap(f.room) * 0.5; f.room.at = now;
      ev.push({ t: 'tutMoveIn', x: f.x, y: f.y });
    }
    if (s.tut === 2 && s.stats.collects > 0) {
      s.tut = 3;
      var cr = D.CRITTER_BY_ID.crumb;
      s.visitors.push({ id: 'v' + (s.vis.uid++), critter: 'crumb', good: 'mushroom', n: 3, arrivedAt: now, expiresAt: now + 48 * HOUR, wanderer: true, rare: false, tutorial: true });
      ev.push({ t: 'tutVisitor' });
    }
    if (s.tut === 3 && s.album.crumb) { s.tut = 4; }
    if (s.tut === 4 && dugCount(s) >= 2) { s.tut = 5; s.vis.lastSlot = now; ev.push({ t: 'tutDone' }); }
    return ev;
  }

  // ---------- save / load ----------
  function serialize(s) { return JSON.stringify(s); }
  function migrate(o) {
    if (!o || typeof o !== 'object') return null;
    if (!o.v) o.v = 1;
    // future: if (o.v === 1) { ...; o.v = 2; }
    return o;
  }
  function deserialize(str, now) {
    var o; try { o = JSON.parse(str); } catch (e) { return null; }
    o = migrate(o); if (!o || !o.cells || o.v > SAVE_VERSION) return null;
    var base = newState(now, o.rng); // fill any field missing from older saves
    for (var k in base) if (o[k] === undefined) o[k] = base[k];
    ['ads', 'settings', 'stats', 'vis', 'daily', 'season', 'decor', 'albumClaimed'].forEach(function (g) { o[g] = Object.assign({}, base[g], o[g]); });
    if (!isFinite(o.lastSeen)) o.lastSeen = now;
    return o;
  }

  // ---------- retention helpers: "come back at ..." teasers, rare-guest anticipation, album nudge (all pure) ----------
  function quietDays(s, now) { return Math.max(0, Math.round((localMidnight(now) - localMidnight(new Date(s.vis.lastRareDay + 'T12:00:00').getTime())) / DAY)); }
  /** Chance and pity for tonight's late visitor. teaseNow: show the "something sparkly is coming" lantern at the door. */
  function rareHint(s, now) {
    var q = quietDays(s, now), guaranteed = q >= D.VISITORS.rarePityDays, tonight = atHour(now, D.VISITORS.nightHour);
    var pending = now < tonight && s.vis.lastSlot < tonight;
    var h = new Date(now).getHours() + new Date(now).getMinutes() / 60;
    return { chance: D.VISITORS.nightRareChance, quietDays: q, pityDays: D.VISITORS.rarePityDays, guaranteed: guaranteed, nextAt: pending ? tonight : tonight + DAY, tonight: pending,
             teaseNow: !!(guaranteed && pending && h >= 15 && s.tut >= 5), unlocked: level(s) >= 3 };
  }
  function nextVisitorSlot(s, now) {
    var hours = D.VISITORS.slotHours; if (s.tut < 5) return null;
    for (var day = 0; day <= 1; day++) for (var i = 0; i < hours.length; i++) { var t = atHour(now + day * DAY, hours[i]); if (t > now) return { at: t, hour: hours[i], full: s.visitors.length >= D.VISITORS.maxWaiting }; }
    return null;
  }
  function tomorrowGift(s, now) { var idx = s.daily.index % D.DAILY.length; return { today: dailyAvailable(s, now), day: idx + 1, reward: D.DAILY[idx] }; }
  /** Everything the player has a reason to come back for, soonest first. */
  function nextUps(s, now) {
    var out = [], ns = s.tut >= 3;
    var v = nextVisitorSlot(s, now); if (v && !v.full) out.push({ kind: 'visitor', at: v.at, text: 'A friend drops by' });
    var rh = rareHint(s, now); if (s.tut >= 5 && rh.unlocked && (rh.guaranteed || rh.tonight)) out.push({ kind: 'rare', at: rh.nextAt, text: rh.guaranteed ? 'A rare guest is due tonight' : 'A chance of a rare late guest', guaranteed: rh.guaranteed });
    var bf = null; eachRoom(s, function (r) { var tf = timeToFull(r, now); if (tf > 0 && (!bf || tf < bf.tf)) bf = { tf: tf, id: r.id }; });
    if (bf && ns) out.push({ kind: 'basket', at: now + bf.tf, text: 'The ' + D.ROOM_BY_ID[bf.id].name + ' basket is full' });
    var dg = null; s.digs.forEach(function (d) { if (d.end && (!dg || d.end < dg)) dg = d.end; }); if (dg) out.push({ kind: 'dig', at: dg, text: 'Your new tunnel is ready' });
    var gf = null; eachRoom(s, function (r) { if (r.critters.length && r.giftAt != null && !r.giftReady && (!gf || r.giftAt < gf.at)) gf = { at: r.giftAt, id: r.id }; });
    if (gf && ns) out.push({ kind: 'gift', at: gf.at, text: 'A gift from the ' + D.ROOM_BY_ID[gf.id].name });
    if (s.tut >= 5 && !dailyAvailable(s, now)) out.push({ kind: 'daily', at: localMidnight(now) + DAY + 8 * HOUR, text: 'Tomorrow\'s visit gift' });
    out.sort(function (a, b) { return a.at - b.at; });
    return out;
  }
  /** one friendly line for the end of a session */
  function comeBack(s, now) {
    var ups = nextUps(s, now).filter(function (u) { return u.at - now > 20 * 60000 && u.kind !== 'daily'; });
    return ups[0] || null;
  }
  function albumNudge(s) {
    var n = albumCount(s), next = D.ALBUM_REWARDS.filter(function (m) { return !s.albumClaimed[m.at] && m.at > n; })[0] || null;
    var ready = D.ALBUM_REWARDS.filter(function (m) { return n >= m.at && !s.albumClaimed[m.at]; }).length;
    return { count: n, total: D.CRITTERS.length, next: next && { at: next.at, need: next.at - n, berries: next.berries, acorns: next.acorns || 0 }, ready: ready };
  }
  /** unmet critters whose room you already own: the ones most likely to knock next */
  function hopefuls(s) { return D.CRITTERS.filter(function (c) { return !s.album[c.id] && hasRoom(s, c.room); }); }

  /** What waits for the player after being away: used by the welcome-back card. */
  function awaySummary(s, now, events) {
    var goods = 0, acorns = 0, rooms = 0, full = 0, gifts = 0;
    eachRoom(s, function (r) {
      var n = Math.floor(ready(r, now)); if (n > 0) { goods += n; rooms++; acorns += n * D.GOODS[D.ROOM_BY_ID[r.id].good].value; }
      if (r.stock >= roomCap(r) - 1e-6) full++;
      if (r.giftReady) gifts++;
    });
    return {
      awayMs: Math.max(0, now - (s.lastSeenBefore || s.lastSeen)), goods: goods, acorns: acorns, rooms: rooms, full: full, gifts: gifts,
      visitors: s.visitors.length, digsDone: (events || []).filter(function (e) { return e.t === 'digDone'; }).length
    };
  }

  return {
    SAVE_VERSION: SAVE_VERSION, dayKey: dayKey, newState: newState, tick: tick, key: key, cellAt: cellAt, eachRoom: eachRoom, hasRoom: hasRoom, findRoom: findRoom,
    roomRate: roomRate, roomCap: roomCap, roomBeds: roomBeds, ready: ready, timeToFull: timeToFull, accrue: accrue,
    cozy: cozy, level: level, levelProgress: levelProgress, dugCount: dugCount,
    canDigCell: canDigCell, digInfo: digInfo, startDig: startDig, tapDig: tapDig, digBerryCost: digBerryCost, skipDigWithBerries: skipDigWithBerries, maxDigs: maxDigs,
    buildInfo: buildInfo, buildRoom: buildRoom, upgradeInfo: upgradeInfo, upgradeRoom: upgradeRoom,
    collect: collect, collectAll: collectAll, collectGift: collectGift,
    fulfillVisitor: fulfillVisitor, dismissVisitor: dismissVisitor, visitorById: visitorById, summonVisitor: summonVisitor, moveIn: moveIn, settleFriends: settleFriends,
    dailyAvailable: dailyAvailable, claimDaily: claimDaily, buyDecor: buyDecor, toggleDecor: toggleDecor, claimSeasonGift: claimSeasonGift, grantSupporter: grantSupporter,
    albumCount: albumCount, albumMilestones: albumMilestones, claimAlbum: claimAlbum, adReward: adReward, adsLeft: adsLeft, tutorialAdvance: tutorialAdvance,
    serialize: serialize, deserialize: deserialize, awaySummary: awaySummary, heartLevel: heartLevel, storyLine: storyLine, rareHint: rareHint, nextVisitorSlot: nextVisitorSlot, tomorrowGift: tomorrowGift, nextUps: nextUps, comeBack: comeBack, albumNudge: albumNudge, hopefuls: hopefuls, neighbors: neighbors
  };
});
