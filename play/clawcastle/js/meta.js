/* Clawcastle meta: saves, village, dailies, chests, shop stubs, local async-raid (bots).
 * RaidAPI is a small adapter: mode 'local' now; swap in a network backend later without changing the UI. */
(function (root) {
  'use strict';
  var D = root.CCData || (typeof require !== 'undefined' ? require('./data.js') : null);
  var E = root.CCEngine || (typeof require !== 'undefined' ? require('./engine.js') : null);
  var KEY = 'clawcastle-save-v1';
  var M = {};

  function dayKey(ts) {
    var d = new Date(ts || Date.now());
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function emptyGrid() {
    var g = [];
    for (var r = 0; r < D.VROWS; r++) { var row = []; for (var c = 0; c < D.VCOLS; c++) row.push(null); g.push(row); }
    g[D.VROWS - 1][3] = { code: 'F', lv: 1 };
    g[0][2] = { code: 'W', lv: 1 };
    g[0][4] = { code: 'W', lv: 1 };
    return g;
  }
  function defaultUp() { var up = {}; D.UPGRADES.forEach(function (u) { up[u.id] = u.start; }); return up; }
  function defaultCards(up) {
    var c = {};
    ['shieldcrab', 'lobster', 'eel', 'spinner', 'puffer'].forEach(function (k) { c[k] = { lv: (up && up[k]) || 1, copies: 0 }; });
    return c;
  }
  M.defaults = function () {
    var up = defaultUp();
    return {
      v: 2, unlocked: 0, stars: [], sand: 0, pearls: 0, gems: 0, up: up,
      sound: true, music: true, seen: {},
      xp: 0, level: 1,
      cards: defaultCards(up),
      village: { grid: emptyGrid(), skin: 'default' },
      name: '', playerId: '', seenInbox: [],
      trophies: 0, shieldUntil: 0,
      dailies: { lastLogin: '', streak: 0, claimed: false, quests: [], chestAt: 0, lastQuests: '' },
      pass: { season: 1, xp: 0, premium: false, freeClaim: [], premClaim: [] },
      raidLog: [], attacks: [],
      cosmetics: { owned: [], hat: null, skin: 'default' },
      adsRemoved: false,
      stats: { wins: 0, pvpWins: 0, chests: 0, dmg: 0, cleared: 0, brutes: 0, upgrades: 0, places: 0 },
      inbox: [] // unopened chests waiting to be opened {type, src}
    };
  };
  function merge(d, x) {
    Object.keys(d).forEach(function (k) { if (x[k] == null) x[k] = d[k]; });
    if (!x.up) x.up = d.up;
    Object.keys(d.up).forEach(function (k) { if (x.up[k] == null) x.up[k] = d.up[k]; });
    return x;
  }
  M.migrate = function (raw) {
    var d = M.defaults();
    if (!raw) return d;
    var x = merge(d, raw);
    if (raw.v === 1) {
      x.v = 2;
      x.cards = defaultCards(x.up);
      // old final was index 17; if they beat it, keep it unlocked and open the next world
      if ((x.stars[17] || 0) >= 1 && x.unlocked < 18) x.unlocked = 18;
    }
    x.v = 2;
    if (!x.village || !x.village.grid || !x.village.grid.length) x.village = d.village;
    if (!x.cards) x.cards = defaultCards(x.up);
    // keep troop levels in sync
    Object.keys(x.cards).forEach(function (k) { if (x.up[k] > x.cards[k].lv) x.cards[k].lv = x.up[k]; x.up[k] = x.cards[k].lv; });
    return x;
  };
  M.load = function () {
    try { return M.migrate(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch (e) { return M.defaults(); }
  };
  M.save = function (s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
  M.xpFor = function (lv) { return D.XP_LEVELS[Math.min(lv, D.XP_LEVELS.length - 1)] || D.XP_LEVELS[D.XP_LEVELS.length - 1] + (lv - D.XP_LEVELS.length + 1) * 600; };
  M.levelFromXp = function (xp) { var lv = 1; while (lv < 99 && xp >= M.xpFor(lv)) lv++; return lv; };

  M.LEAGUES = [
    { min: 0, id: 'driftwood', name: 'Driftwood League' },
    { min: 100, id: 'pebble', name: 'Pebble League' },
    { min: 250, id: 'shell', name: 'Shell League' },
    { min: 450, id: 'coral', name: 'Coral League' },
    { min: 700, id: 'pearl', name: 'Pearl League' },
    { min: 1000, id: 'tide', name: 'Tide League' }
  ];
  M.league = function (trophies) {
    var t = trophies || 0, cur = M.LEAGUES[0];
    for (var i = 0; i < M.LEAGUES.length; i++) if (t >= M.LEAGUES[i].min) cur = M.LEAGUES[i];
    return cur;
  };
  M.NAME_SUGGESTIONS = ['Sandy Sam', 'Pearl Pete', 'Tide Tessa', 'Captain Shuck', 'Nacre Nina', 'Kelp Karen', 'Claw Clive', 'Foam Fiona', 'Riptide Ray', 'Shell Shocked'];
  M.cleanName = function (raw) {
    var s = String(raw || '').replace(/\s+/g, ' ').trim();
    if (s.length < 2) return { err: 'Too short — at least 2 letters.' };
    if (s.length > 18) return { err: 'Keep it to 18 characters.' };
    if (!/^[A-Za-z][A-Za-z0-9 '\-]*$/.test(s)) return { err: 'Use letters, numbers, spaces or hyphens.' };
    return { name: s };
  };
  M.setName = function (save, raw) {
    var c = M.cleanName(raw);
    if (c.err) return c.err;
    save.name = c.name;
    return null;
  };
  M.mergeInbox = function (save, rows) {
    save.seenInbox = save.seenInbox || [];
    save.raidLog = save.raidLog || [];
    var ev = [];
    (rows || []).forEach(function (row) {
      var id = row.id;
      if (!id) return;
      if (save.seenInbox.indexOf(id) >= 0) return;
      if (save.raidLog.some(function (r) { return r.id === id; })) { save.seenInbox.push(id); return; }
      var rec = {
        id: id,
        t: row.created_at ? Date.parse(row.created_at) : Date.now(),
        name: row.attacker_name || 'A captain',
        botId: row.attacker_id,
        playerId: row.attacker_id,
        trophies: 0,
        win: !!row.win,
        stolen: row.stolen || 0,
        delta: -(row.trophy_delta || 0),
        seed: row.seed,
        moves: row.moves || [],
        snap: row.snap,
        online: true
      };
      save.sand = Math.max(0, (save.sand || 0) - rec.stolen);
      if (!save.cupsSynced) save.trophies = Math.max(0, (save.trophies || 0) + rec.delta);
      save.raidLog.unshift(rec);
      save.seenInbox.push(id);
      ev.push(rec);
    });
    if (save.raidLog.length > 20) save.raidLog = save.raidLog.slice(0, 20);
    if (ev.some(function (r) { return r.win; })) save.shieldUntil = Math.max(save.shieldUntil || 0, Date.now() + (D.SHIELD_MS || 0));
    return ev;
  };

  // ---------- daily clock ----------
  M.rollQuests = function (save, seed) {
    var pool = D.QUEST_POOL.slice(), out = [], rnd = seed || (Date.now() & 0xffff);
    function take() { rnd = (rnd * 1664525 + 1013904223) >>> 0; var i = rnd % pool.length; return pool.splice(i, 1)[0]; }
    while (out.length < 3 && pool.length) {
      var q = take();
      out.push({ id: q.id, title: q.title, kind: q.kind, target: q.target, progress: 0, reward: q.reward, done: false, claimed: false });
    }
    return out;
  };
  M.tickDailies = function (save, now) {
    now = now || Date.now();
    var ev = { login: false, streak: 0, incoming: [], levelUps: [] };
    var today = dayKey(now), last = save.dailies.lastLogin;
    if (last !== today) {
      var yest = dayKey(now - 24 * 60 * 60 * 1000);
      save.dailies.streak = last === yest ? (save.dailies.streak || 0) + 1 : 1;
      if (save.dailies.streak > 7) save.dailies.streak = 1; // weekly cycle after a full week, keep going 1-7
      save.dailies.lastLogin = today;
      save.dailies.claimed = false;
      ev.login = true; ev.streak = save.dailies.streak;
    }
    if (save.dailies.lastQuests !== today || !save.dailies.quests || !save.dailies.quests.length) {
      save.dailies.quests = M.rollQuests(save, today.split('-').join('') | 0);
      save.dailies.lastQuests = today;
    }
    if (!save.dailies.chestAt) save.dailies.chestAt = now + D.FREE_CHEST_MS;
    ev.incoming = M.simulateIncoming(save, now);
    return ev;
  };
  M.claimStreak = function (save) {
    if (save.dailies.claimed) return null;
    var i = Math.max(0, (save.dailies.streak || 1) - 1) % D.STREAK.length;
    save.dailies.claimed = true;
    return M.grant(save, D.STREAK[i], 'streak');
  };
  M.chestReady = function (save, now) { return (now || Date.now()) >= (save.dailies.chestAt || 0); };
  M.collectFreeChest = function (save, now) {
    now = now || Date.now();
    if (!M.chestReady(save, now)) return null;
    save.dailies.chestAt = now + D.FREE_CHEST_MS;
    return M.giveChest(save, 'bronze', 'daily');
  };

  // ---------- grants, chests, xp ----------
  function ri(a, b, seed) { if (b == null) return a; var t = Math.abs((seed || Date.now()) * 999983) % 10000 / 10000; return a + Math.floor(t * (b - a + 1)); }
  M.grant = function (save, rew, src) {
    rew = rew || {};
    var got = { src: src, sand: 0, pearls: 0, gems: 0, copies: [], chests: [], cosmetics: [], xp: 0 };
    if (rew.sand) { save.sand += rew.sand; got.sand = rew.sand; }
    if (rew.pearls) { save.pearls += rew.pearls; got.pearls = rew.pearls; }
    if (rew.gems) { save.gems += rew.gems; got.gems = rew.gems; }
    if (rew.xp) { got.xp = rew.xp; got.levelUps = M.addXp(save, rew.xp); }
    if (rew.chest) { got.chests.push(M.giveChest(save, rew.chest, src)); }
    if (rew.deco && save.cosmetics.owned.indexOf('deco-' + rew.deco) < 0) { save.cosmetics.owned.push('deco-' + rew.deco); got.cosmetics.push(rew.deco); }
    if (rew.skin && save.cosmetics.owned.indexOf(rew.skin) < 0) { save.cosmetics.owned.push(rew.skin); got.cosmetics.push(rew.skin); }
    if (rew.hat && save.cosmetics.owned.indexOf(rew.hat) < 0) { save.cosmetics.owned.push(rew.hat); got.cosmetics.push(rew.hat); }
    return got;
  };
  M.addXp = function (save, amt) {
    save.xp += amt;
    var ups = [];
    for (;;) {
      var need = M.xpFor(save.level);
      if (save.xp < need) break;
      save.level++;
      var bonus = { gems: 3 + Math.floor(save.level / 3), sand: 40 + save.level * 8, pearls: save.level % 2 ? 1 : 0 };
      M.grant(save, bonus, 'levelup');
      ups.push({ level: save.level, bonus: bonus });
    }
    return ups;
  };
  M.addPassXp = function (save, amt) { save.pass.xp += amt; };
  M.giveChest = function (save, type, src) {
    var c = { id: 'c' + Date.now().toString(36) + Math.floor(Math.random() * 999), type: type || 'wood', src: src || '', opened: false };
    save.inbox = save.inbox || [];
    save.inbox.push(c);
    return c;
  };
  M.openChest = function (save, id) {
    var c = (save.inbox || []).filter(function (x) { return x.id === id && !x.opened; })[0];
    if (!c) return null;
    c.opened = true;
    var def = D.CHESTS[c.type] || D.CHESTS.wood;
    var seed = (id || '').length + save.sand;
    var rew = {
      sand: ri(def.sand[0], def.sand[1], seed),
      pearls: ri(def.pearls[0], def.pearls[1], seed + 1),
      gems: ri(def.gems[0], def.gems[1], seed + 2)
    };
    var got = M.grant(save, rew, 'chest');
    var copies = def.copies || 0, kinds = ['shieldcrab', 'lobster', 'eel', 'spinner', 'puffer'];
    for (var i = 0; i < copies; i++) {
      var k = kinds[(seed + i * 7) % kinds.length];
      save.cards[k].copies++;
      got.copies.push(k);
    }
    save.stats.chests++;
    M.quest(save, 'chests', 1);
    got.chest = c;
    return got;
  };

  // ---------- quests ----------
  M.quest = function (save, kind, n) {
    n = n || 1;
    (save.dailies.quests || []).forEach(function (q) {
      if (q.kind !== kind || q.done) return;
      q.progress = Math.min(q.target, (q.progress || 0) + n);
      if (q.progress >= q.target) q.done = true;
    });
  };
  M.claimQuest = function (save, id) {
    var q = (save.dailies.quests || []).filter(function (x) { return x.id === id; })[0];
    if (!q || !q.done || q.claimed) return null;
    q.claimed = true;
    return M.grant(save, q.reward, 'quest');
  };

  // ---------- cards / upgrades ----------
  M.cardUpgradeCost = function (save, id) {
    var c = save.cards[id]; if (!c || c.lv >= 5) return null;
    return { copies: D.CARD_COPY_NEED[c.lv], sand: D.CARD_SAND_NEED[c.lv] };
  };
  M.upgradeCard = function (save, id) {
    var cost = M.cardUpgradeCost(save, id), c = save.cards[id];
    if (!cost || c.copies < cost.copies || save.sand < cost.sand) return false;
    c.copies -= cost.copies; save.sand -= cost.sand; c.lv++; save.up[id] = c.lv;
    save.stats.upgrades++; M.quest(save, 'upgrade', 1);
    return true;
  };
  // harbour / shrine / castle still use the old UPGRADES table
  M.upgradeMeta = function (save, id) {
    var u = D.UPGRADES.filter(function (x) { return x.id === id; })[0];
    if (!u || D.TROOPS[id]) return false;
    var lv = save.up[id] || u.start, idx = lv - u.start, cost = u.cost[idx];
    if (cost == null || save[u.cur] < cost) return false;
    save[u.cur] -= cost; save.up[id] = lv + 1;
    save.stats.upgrades++; M.quest(save, 'upgrade', 1);
    return true;
  };

  // ---------- village ----------
  M.vGet = function (save, r, c) { return save.village.grid[r] && save.village.grid[r][c]; };
  M.vDef = function (code) { return D.VBUILD.filter(function (b) { return b.code === code; })[0]; };
  M.canPlace = function (save, r, c, code) {
    if (r < 0 || c < 0 || r >= D.VROWS || c >= D.VCOLS) return 'That plot is off the beach.';
    if (M.vGet(save, r, c)) return 'That plot is taken.';
    var def = M.vDef(code);
    if (!def) {
      var deco = D.DECOS.filter(function (d) { return d.id === code; })[0];
      if (!deco) return 'Unknown building.';
      if (save[deco.cur] < deco.cost) return 'Not enough ' + deco.cur + '.';
      return null;
    }
    if (save.unlocked < def.unlock) return 'Unlocks after raid ' + (def.unlock + 1) + '.';
    if (def.unique && save.village.grid.some(function (row) { return row.some(function (x) { return x && x.code === code; }); })) return 'You already have one ' + def.name + '.';
    if (def.cost && save[def.cur] < def.cost) return 'Not enough ' + def.cur + '.';
    return null;
  };
  M.place = function (save, r, c, code) {
    var err = M.canPlace(save, r, c, code); if (err) return err;
    var def = M.vDef(code);
    if (def) { if (def.cost) save[def.cur] -= def.cost; save.village.grid[r][c] = { code: code, lv: 1 }; }
    else {
      var deco = D.DECOS.filter(function (d) { return d.id === code; })[0];
      save[deco.cur] -= deco.cost;
      save.village.grid[r][c] = { deco: true, id: code };
    }
    save.stats.places++; M.quest(save, 'place', 1);
    return null;
  };
  M.upgradeBuilding = function (save, r, c) {
    var cell = M.vGet(save, r, c); if (!cell || cell.deco) return 'Nothing to upgrade.';
    var def = M.vDef(cell.code); if (!def) return 'Cannot upgrade that.';
    if (cell.lv >= def.max) return 'Already at max level.';
    var cost = def.upCost[cell.lv - 1];
    if (save[def.cur] < cost) return 'Not enough ' + def.cur + '.';
    save[def.cur] -= cost; cell.lv++;
    save.stats.upgrades++; M.quest(save, 'upgrade', 1);
    return null;
  };
  M.sell = function (save, r, c) {
    var cell = M.vGet(save, r, c); if (!cell) return 'Empty plot.';
    if (cell.code === 'F') return 'You cannot sell your Flag Tower.';
    var def = cell.deco ? D.DECOS.filter(function (d) { return d.id === cell.id; })[0] : M.vDef(cell.code);
    var refund = def ? Math.floor((def.cost || 0) * 0.5) : 0;
    if (refund && def.cur) save[def.cur] += refund;
    save.village.grid[r][c] = null;
    return null;
  };
  M.move = function (save, r, c, r2, c2) {
    var cell = M.vGet(save, r, c); if (!cell) return 'Nothing to move.';
    if (M.vGet(save, r2, c2)) return 'That plot is taken.';
    if (r2 < 0 || c2 < 0 || r2 >= D.VROWS || c2 >= D.VCOLS) return 'Off the beach.';
    save.village.grid[r2][c2] = cell; save.village.grid[r][c] = null;
    M.quest(save, 'place', 1);
    return null;
  };
  M.snapshot = function (save) { return JSON.parse(JSON.stringify(save.village.grid)); };

  // ---------- raid results (campaign or pvp) ----------
  M.campaignReward = function (save, state, stars) {
    var i = state.level, first = !save.stars[i], prev = save.stars[i] || 0;
    var sand = Math.round((30 + 12 * i + 14 * stars + (state.loot || 0)) * (1 + 0.1 * ((save.up.castle || 1) - 1)));
    var pearls = Math.max(0, stars - prev) + (first ? 1 : 0);
    var xp = 16 + 8 * stars + Math.floor(i / 2);
    save.sand += sand; save.pearls += pearls;
    save.stars[i] = Math.max(prev, stars);
    save.unlocked = Math.min(D.LEVELS.length - 1, Math.max(save.unlocked, i + 1));
    if (i === D.LEVELS.length - 1) save.beaten = true;
    save.stats.wins++; save.stats.dmg += state.stats.dmg; save.stats.cleared += state.stats.cleared; save.stats.brutes += state.stats.brutes;
    M.quest(save, 'win_raids', 1);
    if (stars >= 3) M.quest(save, 'three_star', 1);
    M.quest(save, 'dmg', Math.round(state.stats.dmg));
    M.quest(save, 'cleared', state.stats.cleared);
    M.quest(save, 'brutes', state.stats.brutes);
    var ups = M.addXp(save, xp);
    M.addPassXp(save, 8 + stars * 4);
    var chestType = stars >= 3 ? (first ? 'silver' : 'bronze') : stars === 2 ? 'wood' : null;
    var chest = chestType ? M.giveChest(save, chestType, 'raid') : null;
    // a couple of card copies
    var kinds = ['shieldcrab', 'lobster', 'eel', 'spinner', 'puffer'];
    var copies = [];
    for (var k = 0; k < (stars >= 3 ? 2 : 1); k++) { var id = kinds[(i + k + stars) % 5]; save.cards[id].copies++; copies.push(id); }
    return { sand: sand, pearls: pearls, xp: xp, levelUps: ups, chest: chest, copies: copies, first: first, stars: stars };
  };
  M.pvpReward = function (save, state, stars, opp) {
    var win = state.status === 'won';
    var sand = win ? Math.round(40 + (opp.trophies || 0) * 0.08 + (state.loot || 0) + 15 * stars) : Math.round(8 + (state.loot || 0) * 0.25);
    var pearls = win && stars >= 2 ? 1 : 0;
    var dt = win ? (20 + Math.max(0, Math.floor(((opp.trophies || 0) - save.trophies) / 40))) : -Math.min(12, 6 + Math.floor(save.trophies / 80));
    if (save.trophies + dt < 0) dt = -save.trophies;
    save.sand += sand; save.pearls += pearls; save.trophies += dt;
    if (win) { save.stats.pvpWins++; M.quest(save, 'pvp', 1); M.quest(save, 'win_raids', 1); if (stars >= 3) M.quest(save, 'three_star', 1); }
    M.quest(save, 'dmg', Math.round(state.stats.dmg || 0));
    M.quest(save, 'cleared', state.stats.cleared || 0);
    var xp = win ? 20 + 6 * stars : 8;
    var ups = M.addXp(save, xp); M.addPassXp(save, win ? 10 : 3);
    var chest = win && stars >= 3 ? M.giveChest(save, 'bronze', 'pvp') : null;
    return { sand: sand, pearls: pearls, trophies: dt, xp: xp, levelUps: ups, chest: chest, win: win, stars: stars };
  };

  // ---------- bot villages & incoming raids ----------
  function mulberry(seed) { return function () { var t = (seed = (seed + 0x6D2B79F5) | 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  M.genBot = function (seed, trophies) {
    var rnd = mulberry(seed | 0), power = Math.max(1, Math.min(6, Math.round((trophies || 0) / 180) + 1));
    var grid = emptyGrid();
    // bump flag
    grid[D.VROWS - 1][3] = { code: 'F', lv: Math.min(3, 1 + Math.floor(power / 3)) };
    var spots = [];
    for (var r = 0; r < D.VROWS; r++) for (var c = 0; c < D.VCOLS; c++) if (!grid[r][c]) spots.push([r, c]);
    function put(code, lv, preferFront) {
      if (!spots.length) return;
      var pick = 0, best = -1;
      spots.forEach(function (s, i) { var sc = (preferFront ? (D.VROWS - 1 - s[0]) : s[0]) + rnd(); if (sc > best) { best = sc; pick = i; } });
      var s = spots.splice(pick, 1)[0];
      grid[s[0]][s[1]] = { code: code, lv: lv };
    }
    var walls = 2 + power, guns = power, cats = Math.max(0, power - 2), gulls = Math.max(0, power - 1), chests = power >= 2 ? 1 : 0;
    while (walls--) put('W', 1 + (power > 3 && rnd() > 0.6 ? 1 : 0), true);
    while (guns--) put('C', 1 + (power > 3 ? 1 : 0), true);
    while (cats--) put('K', 1, false);
    while (gulls--) put('G', 1, false);
    while (chests--) put('T', 1, false);
    // a couple of decorations
    var decoIds = D.DECOS.map(function (d) { return d.id; });
    if (rnd() > 0.4 && spots.length) {
      var s = spots.splice(Math.floor(rnd() * spots.length), 1)[0];
      grid[s[0]][s[1]] = { deco: true, id: decoIds[Math.floor(rnd() * decoIds.length)] };
    }
    var name = D.BOT_NAMES[Math.floor(rnd() * D.BOT_NAMES.length)];
    var cups = Math.max(0, Math.round((trophies || 0) + (rnd() - 0.5) * 80));
    return { id: 'bot-' + (seed >>> 0).toString(36), name: name, trophies: cups, grid: grid, bot: true, power: power };
  };
  M.listOpponents = function (save, now) {
    var today = dayKey(now || Date.now());
    if (!save.botCache || save.botCache.day !== today || !save.botCache.list || save.botCache.list.length < 8) {
      var list = [], base = (today.split('-').join('') | 0) + (save.trophies || 0) * 13;
      for (var i = 0; i < 8; i++) list.push(M.genBot(base + i * 977, Math.max(0, (save.trophies || 0) + (i - 3) * 40)));
      save.botCache = { day: today, list: list };
    }
    return save.botCache.list;
  };
  M.refreshOpponents = function (save, now) {
    save.botCache = null;
    return M.listOpponents(save, now);
  };
  function playRaid(grid, up, seed, moves) {
    if (!E) return { status: 'lost', stars: 0, loot: 0, stats: { dmg: 0, cleared: 0, brutes: 0, troops: 0 }, moves: [] };
    var lanes = E.villageToLanes(grid);
    var st = E.newStateSpec({ lanes: lanes, moves: moves || 22, up: up, seed: seed, mode: 'pvp' });
    var log = [], guard = 0;
    while (st.status === 'play' && guard++ < 80) {
      var m = E.botMove(st, 'greedy');
      if (!m) break;
      E.playMove(st, m[0], m[1]);
      log.push(m);
    }
    return { status: st.status, stars: E.stars(st), loot: st.loot, stats: st.stats, moves: log, seed: seed, hpLeft: (E.flag(st) || { hp: 0 }).hp };
  }
  M.simulateIncoming = function (save, now) {
    now = now || Date.now();
    var ev = [];
    if (save.onlineInbox) return ev;
    if ((save.shieldUntil || 0) > now) return ev;
    // at most one wave per calendar day, 0-2 raids, skipped the first day a village exists
    save.raidTick = save.raidTick || {};
    var today = dayKey(now);
    if (save.raidTick.day === today) return ev;
    // don't raid brand-new players with nothing to steal
    if ((save.stats.wins || 0) < 3 && (save.trophies || 0) < 20) { save.raidTick.day = today; return ev; }
    var n = (save.trophies > 80 ? 2 : 1);
    // deterministic-ish from the date
    var seed = (today.split('-').join('') | 0) + (save.trophies || 0);
    var rnd = mulberry(seed);
    if (rnd() < 0.25) n = 0; // some days are quiet
    if (n === 2 && rnd() < 0.4) n = 1;
    for (var i = 0; i < n; i++) {
      var bot = M.genBot(seed + 5000 + i * 31, save.trophies || 0);
      var snap = M.snapshot(save);
      var res = playRaid(snap, { shieldcrab: 2, lobster: 2, eel: 2, spinner: 2, puffer: 2, harbour: 1, shrine: 0 }, seed + 900 + i, 22);
      var win = res.status === 'won'; // bot won = they raided you successfully
      var stolen = win ? Math.min(save.sand, Math.round(20 + save.sand * 0.06 + (res.loot || 0))) : Math.min(save.sand, 8);
      var dt = win ? -Math.min(save.trophies, 10 + Math.floor((save.trophies || 0) / 80)) : 4;
      save.sand = Math.max(0, save.sand - stolen);
      save.trophies = Math.max(0, save.trophies + dt);
      var rec = {
        id: 'def-' + today + '-' + i, t: now - Math.floor(rnd() * 12 * 60 * 60 * 1000),
        name: bot.name, botId: bot.id, trophies: bot.trophies,
        win: win, stolen: stolen, delta: dt, seed: res.seed, moves: res.moves, snap: snap, hpLeft: res.hpLeft
      };
      save.raidLog.unshift(rec);
      ev.push(rec);
    }
    if (save.raidLog.length > 20) save.raidLog = save.raidLog.slice(0, 20);
    save.raidTick.day = today;
    if (ev.some(function (r) { return r.win; })) save.shieldUntil = now + D.SHIELD_MS;
    return ev;
  };
  M.recordAttack = function (save, opp, state, reward) {
    save.attacks.unshift({
      id: 'atk-' + Date.now(), t: Date.now(), name: opp.name, botId: opp.id,
      win: state.status === 'won', stars: reward.stars, trophies: reward.trophies, sand: reward.sand
    });
    if (save.attacks.length > 20) save.attacks = save.attacks.slice(0, 20);
    // remove that opponent until tomorrow (already raided)
    if (save.botCache && save.botCache.list) save.botCache.list = save.botCache.list.filter(function (b) { return b.id !== opp.id; });
  };

  // ---------- tide pass ----------
  M.passTier = function (save) {
    var xp = save.pass.xp || 0, n = 0, acc = 0;
    for (var i = 0; i < D.PASS.length; i++) { acc += D.PASS[i].xp; if (xp >= acc) n = i + 1; else break; }
    return n;
  };
  M.claimPass = function (save, i, track) {
    if (i >= M.passTier(save)) return { err: 'Keep earning Tide Pass points in raids.' };
    if (track === 'prem' && !save.pass.premium) return { err: 'The premium track is a preview (not charged yet).' };
    var arr = track === 'prem' ? save.pass.premClaim : save.pass.freeClaim;
    if (arr.indexOf(i) >= 0) return { err: 'Already claimed.' };
    arr.push(i);
    var rew = track === 'prem' ? D.PASS[i].prem : D.PASS[i].free;
    return { got: M.grant(save, rew, 'pass') };
  };

  // ---------- shop (all simulated; nothing is charged) ----------
  M.SHOP = [
    { sku: 'remove_ads', name: 'Remove Ads', price: 'CHF 3.00', gems: 0, desc: 'Hides the optional ad buttons. Bonus videos stay optional.', type: 'iap' },
    { sku: 'starter_pack', name: 'Starter Chest Pack', price: 'CHF 3.00', desc: '300 Sand, 10 Pearls, 40 Gems and Pirate Hats. One time. Preview only.', type: 'iap', once: true, grant: { sand: 300, pearls: 10, gems: 40, hat: 'pirate' } },
    { sku: 'tide_pass', name: 'Tide Pass (season)', price: 'CHF 5.00', desc: 'Unlocks the premium reward track. The free track stays generous. Preview only.', type: 'iap' },
    { sku: 'gems_small', name: 'Pouch of Gems', price: 'CHF 1.00', desc: '40 Tide Gems. Preview only — nothing is charged.', type: 'iap', grant: { gems: 40 } },
    { sku: 'gems_med', name: 'Bucket of Gems', price: 'CHF 3.00', desc: '130 Tide Gems. Preview only — nothing is charged.', type: 'iap', grant: { gems: 130 } },
    { sku: 'gems_big', name: 'Treasure of Gems', price: 'CHF 6.00', desc: '300 Tide Gems (best value). Preview only.', type: 'iap', grant: { gems: 300 } },
    { sku: 'skin_sunset', name: 'Sunset Castle', price: '80 Gems', gems: 80, desc: 'Warm evening colours for your keep. Cosmetic only.', type: 'gem', grant: { skin: 'sunset' } },
    { sku: 'skin_royal', name: 'Royal Castle', price: '80 Gems', gems: 80, desc: 'A regal gold-and-blue keep. Cosmetic only.', type: 'gem', grant: { skin: 'royal' } },
    { sku: 'hat_pirate', name: 'Pirate Hats', price: '50 Gems', gems: 50, desc: 'Tiny pirate hats for your crew. Cosmetic only.', type: 'gem', grant: { hat: 'pirate' } },
    { sku: 'hat_crown', name: 'Shell Crowns', price: '50 Gems', gems: 50, desc: 'A shiny crown for every crab. Cosmetic only.', type: 'gem', grant: { hat: 'crown' } }
  ];
  M.buy = function (save, sku, simulated) {
    var p = M.SHOP.filter(function (x) { return x.sku === sku; })[0];
    if (!p) return { err: 'Unknown item.' };
    if (p.once && (save.bought || {})[sku]) return { err: 'You already have this pack.' };
    if (p.type === 'gem') {
      if (save.gems < p.gems) return { err: 'Not enough Gems.' };
      save.gems -= p.gems;
    } else {
      // IAP placeholders: only complete if the caller said the preview was confirmed
      if (!simulated) return { err: 'coming_soon', preview: true };
    }
    if (p.sku === 'remove_ads') save.adsRemoved = true;
    if (p.sku === 'tide_pass') save.pass.premium = true;
    if (p.grant) M.grant(save, p.grant, 'shop');
    if (p.grant && p.grant.skin) save.cosmetics.skin = p.grant.skin;
    if (p.grant && p.grant.hat) save.cosmetics.hat = p.grant.hat;
    save.bought = save.bought || {}; save.bought[sku] = true;
    return { ok: true, item: p };
  };

  // Adapter the UI talks to. Local mode is complete; online is a stub that reports what is needed.
  var RaidAPI = {
    mode: 'local',
    status: function () { return { mode: 'local', online: false, reason: 'No backend account is set up on this machine (no wrangler, Supabase or Firebase login).' }; },
    opponents: function (save) { return Promise.resolve(M.listOpponents(save)); },
    village: function (opp) { return Promise.resolve(opp); }
  };

  M.RaidAPI = RaidAPI;
  M.dayKey = dayKey;
  M.emptyGrid = emptyGrid;
  M.playRaid = playRaid;
  root.CCMeta = M;
  if (typeof module !== 'undefined') module.exports = M;
})(typeof window !== 'undefined' ? window : globalThis);
