/* Hexglen meta layer: weekly themes, village milestones/levels, villagers, deterministic village layout, streak events,
   calendar strip, countdown, skins. Pure functions (no DOM). The puzzle itself (seed + scoring) lives in engine.js and is
   NOT touched here: themes are overlay goals with cosmetic rewards, so every daily puzzle and score stays identical. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.HHMeta = factory(root.HH);
})(typeof self !== 'undefined' ? self : this, function (H) {
  'use strict';
  var DAY = 86400000;

  /* ---------- weeks and weekly themes ---------- */
  function addDays(dateKey, n) { return H.utcDateKey(new Date(new Date(dateKey + 'T00:00:00Z').getTime() + n * DAY)); }
  function weekStart(dateKey) { // Monday (UTC) of the week containing dateKey
    var dow = new Date(dateKey + 'T00:00:00Z').getUTCDay(); // 0 = Sunday
    return addDays(dateKey, -((dow + 6) % 7));
  }
  var THEMES = [
    { id: 'harvest', icon: '🌾', name: 'Harvest Festival', blurb: 'Bunting is going up and the mill is busy.', stat: 'maxMillFields', n: [2, 3], text: 'Give one windmill {n} neighbouring fields', reward: 'bunting', rewardName: 'Festival bunting', color: '#f2c14e' },
    { id: 'snow', icon: '❄️', name: 'Snowfall Week', blurb: 'Warm windows, cold air, cosy houses.', stat: 'snug', n: [1, 2], text: 'Build {n} Snug house{s}', reward: 'snowman', rewardName: 'Snowman', color: '#9ec9e2' },
    { id: 'blossom', icon: '🌸', name: 'Blossom Week', blurb: 'The glen is in bloom.', stat: 'maxForest', n: [4, 5], text: 'Grow a forest grove of {n} or more', reward: 'blossomtree', rewardName: 'Blossom tree', color: '#f0a6c4' },
    { id: 'riverfest', icon: '🛶', name: 'Riverfest', blurb: 'Kites over the water.', stat: 'maxRiverSpan', n: [3, 4], text: 'Run a river that spans {n} hexes', reward: 'kite', rewardName: 'River kite', color: '#7cc3df' },
    { id: 'market', icon: '🧺', name: 'Market Week', blurb: 'Balloons over the stalls.', stat: 'maxMarketHouses', n: [2, 3], text: 'Surround a market with {n} houses', reward: 'balloons', rewardName: 'Market balloons', color: '#ef8354' },
    { id: 'lantern', icon: '🏮', name: 'Lantern Night', blurb: 'Paper lanterns along the lanes.', stat: 'watermills', n: [1, 2], text: 'Build {n} Watermill{s}', reward: 'paperlanterns', rewardName: 'Paper lanterns', color: '#e0614a' }
  ];
  var THEME_ORDER = [2, 0, 4, 1, 5, 3];            // fixed shuffle so neighbouring weeks never repeat
  var EVENT_DAYS_NEEDED = 3;
  function weekNumber(dateKey) { return Math.floor((H.dayNumber(weekStart(dateKey)) + 3) / 7); } // weeks since 1970 (Monday based)
  function weeklyTheme(dateKey) {
    var wk = weekStart(dateKey), wn = weekNumber(dateKey);
    var base = THEMES[THEME_ORDER[((wn % 6) + 6) % 6]], rng = H.makeRng('hexglen|week|' + wk);
    var level = H.randInt(rng, 2), n = base.n[level];
    return {
      weekKey: wk, endsOn: addDays(wk, 6), id: base.id, icon: base.icon, name: base.name, blurb: base.blurb, color: base.color,
      stat: base.stat, n: n, level: level, daysNeeded: EVENT_DAYS_NEEDED,
      text: base.text.replace('{n}', n).replace('{s}', n > 1 ? 's' : ''),
      reward: { kind: 'deco', type: base.reward, name: base.rewardName }
    };
  }
  function eventGoalMet(theme, stats) { return (stats[theme.stat] || 0) >= theme.n; }
  /* ev: saved {weekKey: {days:[dateKey...], claimed:bool}}; returns {state, goalMet, newDay, claimedNow} */
  function eventOnComplete(ev, theme, dateKey, stats) {
    ev = JSON.parse(JSON.stringify(ev || {}));
    var w = ev[theme.weekKey] = ev[theme.weekKey] || { days: [], claimed: false };
    var met = eventGoalMet(theme, stats), newDay = false, claimedNow = false;
    if (met && w.days.indexOf(dateKey) < 0) { w.days.push(dateKey); newDay = true; }
    if (!w.claimed && w.days.length >= theme.daysNeeded) { w.claimed = true; claimedNow = true; }
    return { state: ev, goalMet: met, newDay: newDay, claimedNow: claimedNow, progress: w.days.length };
  }

  /* ---------- milestones, village levels, skins ---------- */
  var MILESTONES = [
    { days: 1, level: 1, name: 'Hamlet', text: 'Your first cottage.', pool: ['cottage', 'cottage', 'well', 'barn'] },
    { days: 3, level: 2, name: 'Village', text: 'A bakery opens and Autumn tiles unlock.', pool: ['bakery'], landmark: 'bakery', skin: 'autumn' },
    { days: 7, level: 3, name: 'Greenfold', text: 'A chapel and a mill join; Blossom tiles unlock.', pool: ['chapel', 'mill'], landmark: 'mill', skin: 'blossom' },
    { days: 14, level: 4, name: 'Market Town', text: 'An inn and a bridge; Snowfall tiles unlock.', pool: ['inn', 'bridge'], landmark: 'inn', skin: 'snow' },
    { days: 30, level: 5, name: 'Grand Glen', text: 'A Town Hall crowns the glen; Candy tiles unlock.', pool: [], landmark: 'townhall', skin: 'candy' }
  ];
  var SKIN_UNLOCK = { meadow: 0, autumn: 3, blossom: 7, snow: 14, candy: 30 };
  function levelFor(days) { var m = null; MILESTONES.forEach(function (x) { if (days >= x.days) m = x; }); return m; }
  function nextMilestone(days) { for (var i = 0; i < MILESTONES.length; i++) if (days < MILESTONES[i].days) return MILESTONES[i]; return null; }
  function milestonesCrossed(prevDays, newDays) { return MILESTONES.filter(function (m) { return prevDays < m.days && newDays >= m.days; }); }
  function unlockedSkins(days) { return Object.keys(SKIN_UNLOCK).filter(function (k) { return days >= SKIN_UNLOCK[k]; }); }
  function buildingPool(days) {
    var pool = []; MILESTONES.forEach(function (m) { if (days >= m.days) pool = pool.concat(m.pool); });
    return pool;
  }
  var DECOS = ['flowers', 'bench', 'lantern', 'scarecrow', 'fountain'];

  /* New village reward for a finished daily. daysPlayed = AFTER counting today. Always 1 building (+ landmark when a milestone
     is crossed) + 1 decoration per star + 1 per completed request. Deterministic per date. */
  function villageReward(daily, total, requestsDone, daysPlayed) {
    var rng = H.makeRng('hexglen|village2|' + daily.date), pool = buildingPool(daysPlayed), items = [];
    items.push({ kind: 'building', type: pool[H.randInt(rng, pool.length)] });
    var st = H.stars(total), i;
    for (i = 0; i < st; i++) items.push({ kind: 'deco', type: DECOS[H.randInt(rng, DECOS.length)] });
    requestsDone.forEach(function (ok) { if (ok) items.push({ kind: 'deco', type: DECOS[H.randInt(rng, DECOS.length)] }); });
    milestonesCrossed(daysPlayed - 1, daysPlayed).forEach(function (m) { if (m.landmark) items.push({ kind: 'building', type: m.landmark, landmark: true }); });
    return items;
  }

  /* ---------- villagers ---------- */
  var VILLAGERS = {
    fern:  { id: 'fern', name: 'Fern', role: 'forester', gift: 'logpile', giftName: 'Log pile', line: 'The trees feel taller already!' },
    orla:  { id: 'orla', name: 'Orla', role: 'farmer', gift: 'haystack', giftName: 'Haystack', line: 'Such tidy fields, neighbour.' },
    pip:   { id: 'pip', name: 'Pip', role: 'boatwright', gift: 'rowboat', giftName: 'Rowboat', line: 'Now the river goes somewhere!' },
    mabel: { id: 'mabel', name: 'Mabel', role: 'baker', gift: 'oven', giftName: 'Stone oven', line: 'Those homes look so snug.' },
    orin:  { id: 'orin', name: 'Orin', role: 'miller', gift: 'sacks', giftName: 'Flour sacks', line: 'The sails are turning nicely.' },
    bram:  { id: 'bram', name: 'Bram', role: 'trader', gift: 'cart', giftName: 'Market cart', line: 'Business is booming!' }
  };
  var REQ_VILLAGER = { grove3: 'fern', grove5: 'fern', pasture3: 'orla', pasture5: 'orla', river3: 'pip', river5: 'pip', snug1: 'mabel', snug2: 'mabel', watermill1: 'orin', mill3: 'orin', square3: 'bram' };
  var FRIEND_STEPS = 3; // completed requests for a villager's gift
  function villagerFor(requestId) { return VILLAGERS[REQ_VILLAGER[requestId]]; }
  /* vs: saved {id:{done:n}}; returns {state, events:[{type:'moved-in'|'friend'|'gift', villager, item?}]} */
  function villagersOnComplete(vs, daily, requestsDone) {
    vs = JSON.parse(JSON.stringify(vs || {})); var events = [];
    daily.requests.forEach(function (r, i) {
      if (!requestsDone[i]) return;
      var v = villagerFor(r.id); if (!v) return;
      var s = vs[v.id] = vs[v.id] || { done: 0 };
      s.done++;
      if (s.done === 1) events.push({ type: 'moved-in', villager: v.id, item: { kind: 'villager', type: v.id } });
      else if (s.done % FRIEND_STEPS === 0) events.push({ type: 'gift', villager: v.id, item: { kind: 'deco', type: v.gift } });
      else events.push({ type: 'friend', villager: v.id });
    });
    return { state: vs, events: events };
  }

  /* ---------- village layout: hex spiral, prefix-stable (adding items never moves earlier ones) ---------- */
  var LAYOUT_RADIUS = 14;
  function ringCells(rad) {
    if (rad === 0) return [[0, 0]];
    var out = [], q = -rad, r = rad, dirs = [[1, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1]];
    // start at the south-west-ish corner and walk the ring
    q = 0 - rad; r = rad;
    var walk = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
    for (var d = 0; d < 6; d++) for (var i = 0; i < rad; i++) { out.push([q, r]); q += walk[d][0]; r += walk[d][1]; }
    return out;
  }
  var SPIRAL = null;
  function spiral() {
    if (SPIRAL) return SPIRAL;
    var rng = H.makeRng('hexglen|layout|v1'); SPIRAL = [];
    for (var rad = 0; rad <= LAYOUT_RADIUS; rad++) {
      var ring = ringCells(rad);
      for (var i = ring.length - 1; i > 0; i--) { var j = H.randInt(rng, i + 1), t = ring[i]; ring[i] = ring[j]; ring[j] = t; }
      SPIRAL = SPIRAL.concat(ring);
    }
    return SPIRAL;
  }
  var NB = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  /* items: [{kind,type,date}] in award order -> [{item, q, r, i}] */
  function layoutVillage(items) {
    var sp = spiral(), occ = {}, placed = [], nextFree = 0, rng = H.makeRng('hexglen|layout|pick');
    function k(q, r) { return q + ',' + r; }
    function takeSpiral() { while (occ[k(sp[nextFree][0], sp[nextFree][1])]) nextFree++; return sp[nextFree]; }
    items.forEach(function (it, i) {
      var cell = null;
      // draw the RNG the same number of times for every item so earlier items never depend on later ones
      var pickA = rng(), pickB = rng();
      if (it.kind !== 'building' && placed.length) {
        // decorations and villagers settle beside an existing building (or earlier item) when there is room
        var anchors = placed.filter(function (p) { return p.item.kind === 'building'; });
        if (!anchors.length) anchors = placed;
        var a = anchors[Math.floor(pickA * anchors.length)], opts = [];
        NB.forEach(function (d) { var q = a.q + d[0], r = a.r + d[1]; if (!occ[k(q, r)]) opts.push([q, r]); });
        if (opts.length) cell = opts[Math.floor(pickB * opts.length)];
      }
      if (!cell) cell = takeSpiral();
      occ[k(cell[0], cell[1])] = true; placed.push({ item: it, q: cell[0], r: cell[1], i: i });
    });
    return placed;
  }
  function hashCell(q, r) { var h = (q * 73856093) ^ (r * 19349663); h = (h ^ (h >>> 13)) >>> 0; return (h % 1000) / 1000; }

  /* ---------- streak events, calendar, countdown ---------- */
  var STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];
  /* wraps engine.streakOnComplete and reports what happened, for the "freeze earned / used" moments */
  function applyCompletion(st, dateKey) {
    var before = Object.assign({}, st), after = H.streakOnComplete(st, dateKey), events = [], covered = [];
    if (before.last === dateKey) return { state: after, events: events, covered: covered };
    if (before.last) {
      var gap = H.dayNumber(dateKey) - H.dayNumber(before.last);
      if (gap > 1 && gap <= 1 + before.freezes) { for (var d = 1; d < gap; d++) covered.push(addDays(before.last, d)); events.push({ type: 'freeze-used', dates: covered.slice() }); }
      else if (gap > 1 + before.freezes && before.streak >= 2) events.push({ type: 'streak-reset', was: before.streak });
    }
    if (after.freezes > before.freezes - covered.length) events.push({ type: 'freeze-earned', freezes: after.freezes });
    if (STREAK_MILESTONES.indexOf(after.streak) >= 0 && after.streak > before.streak) events.push({ type: 'streak-milestone', n: after.streak });
    return { state: after, events: events, covered: covered };
  }
  function calendarStrip(todayKey, played, covered, n) {
    n = n || 7; var out = [], dn = { 0: 'S', 1: 'M', 2: 'T', 3: 'W', 4: 'T', 5: 'F', 6: 'S' };
    for (var i = n - 1; i >= 0; i--) {
      var d = addDays(todayKey, -i), st = played[d] ? 'played' : (covered.indexOf(d) >= 0 ? 'frozen' : (d === todayKey ? 'today' : 'missed'));
      out.push({ date: d, dow: dn[new Date(d + 'T00:00:00Z').getUTCDay()], day: +d.slice(8), status: st, isToday: d === todayKey });
    }
    return out;
  }
  function msUntilNextPuzzle(nowMs) { var d = new Date(nowMs); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - nowMs; }
  function fmtHMS(ms) {
    var s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x;
  }

  return {
    THEMES: THEMES, EVENT_DAYS_NEEDED: EVENT_DAYS_NEEDED, MILESTONES: MILESTONES, SKIN_UNLOCK: SKIN_UNLOCK, VILLAGERS: VILLAGERS, REQ_VILLAGER: REQ_VILLAGER,
    FRIEND_STEPS: FRIEND_STEPS, DECOS: DECOS, STREAK_MILESTONES: STREAK_MILESTONES,
    addDays: addDays, weekStart: weekStart, weeklyTheme: weeklyTheme, eventGoalMet: eventGoalMet, eventOnComplete: eventOnComplete,
    levelFor: levelFor, nextMilestone: nextMilestone, milestonesCrossed: milestonesCrossed, unlockedSkins: unlockedSkins, buildingPool: buildingPool,
    villageReward: villageReward, villagerFor: villagerFor, villagersOnComplete: villagersOnComplete,
    layoutVillage: layoutVillage, hashCell: hashCell, applyCompletion: applyCompletion, calendarStrip: calendarStrip,
    msUntilNextPuzzle: msUntilNextPuzzle, fmtHMS: fmtHMS
  };
});
