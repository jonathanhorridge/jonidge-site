/* Hexglen engine: hex board, daily seed, tile bag, scoring, requests, share string.
   Pure functions, no DOM. Works in the browser (window.HH) and in Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HH = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var GAME_NAME = 'Hexglen';           // final name; formerly "Hexhaven", renamed because that name was taken (see docs/design.md section 1)
  var SEED_VERSION = 'v1';              // bump ONLY to deliberately change every future day
  var RADIUS = 2;                       // 19 cells
  var TILES_PER_DAY = 15;
  var TYPES = ['forest', 'field', 'river', 'house', 'windmill', 'market'];
  var LABEL = { forest: 'Forest', field: 'Field', river: 'River', house: 'House', windmill: 'Windmill', market: 'Market' };
  var EMOJI = { forest: '🌲', field: '🌾', river: '🌊', house: '🏠', windmill: '🌀', market: '🧺' };
  var DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

  /* ---------- board ---------- */
  function key(q, r) { return q + ',' + r; }
  function dist(a, b) {
    var dq = a[0] - b[0], dr = a[1] - b[1];
    return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
  }
  var CELLS = (function () {
    var out = [];
    for (var r = -RADIUS; r <= RADIUS; r++)
      for (var q = -RADIUS; q <= RADIUS; q++)
        if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= RADIUS) out.push([q, r]);
    return out; // row-major, top row first
  })();
  var CELL_SET = {}; CELLS.forEach(function (c) { CELL_SET[key(c[0], c[1])] = true; });
  function inBoard(q, r) { return !!CELL_SET[key(q, r)]; }
  function neighbors(q, r) {
    var out = [];
    for (var i = 0; i < 6; i++) { var nq = q + DIRS[i][0], nr = r + DIRS[i][1]; if (inBoard(nq, nr)) out.push([nq, nr]); }
    return out;
  }

  /* ---------- seeded RNG (xmur3 -> sfc32), identical in every language ---------- */
  function xmur3(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16; return h >>> 0;
    };
  }
  function sfc32(a, b, c, d) {
    return function () {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
      var t = (a + b) | 0; a = b ^ (b >>> 9); b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11); d = (d + 1) | 0; t = (t + d) | 0; c = (c + t) | 0;
      return (t >>> 0) / 4294967296;
    };
  }
  function makeRng(seedStr) {
    var s = xmur3(seedStr), g = sfc32(s(), s(), s(), s());
    for (var i = 0; i < 12; i++) g(); // warm-up
    return g;
  }
  function randInt(rng, n) { return Math.floor(rng() * n); }

  /* ---------- date handling ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function utcDateKey(d) { d = d || new Date(); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
  function validDateKey(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
    var d = new Date(s + 'T00:00:00Z');
    return !isNaN(d) && utcDateKey(d) === s;
  }
  function dayNumber(dateKey) { return Math.floor(new Date(dateKey + 'T00:00:00Z').getTime() / 86400000); }
  function puzzleNumber(dateKey) { return dayNumber(dateKey) - dayNumber('2026-11-01') + 1; } // #1 = 2026-11-01 (placeholder epoch)

  /* ---------- weather & requests ---------- */
  var WEATHER = [
    { id: 'clear', icon: '☀️', name: 'Clear Skies', text: 'Windmills score 3 per field instead of 2.' },
    { id: 'rain', icon: '🌧️', name: 'Rainy Day', text: 'Every river tile scores +1 extra.' },
    { id: 'harvest', icon: '🌕', name: 'Harvest Moon', text: 'Each field cluster scores +1 per tile extra.' },
    { id: 'leaves', icon: '🍂', name: 'Golden Leaves', text: 'Each forest cluster scores +1 per tile extra.' }
  ];

  // request templates: check(stats) -> boolean. stats come from analyse().
  var REQUESTS = {
    easy: [
      { id: 'grove3', text: 'Grow a forest grove of 3 or more', ok: function (s) { return s.maxForest >= 3; } },
      { id: 'pasture3', text: 'Grow a field pasture of 3 or more', ok: function (s) { return s.maxField >= 3; } },
      { id: 'river3', text: 'Run a river that spans 3 hexes end to end', ok: function (s) { return s.maxRiverSpan >= 3; } },
      { id: 'snug1', text: 'Build one Snug house (4+ different neighbours)', ok: function (s) { return s.snug >= 1; } },
      { id: 'watermill1', text: 'Build a Watermill (windmill by a river and a field)', ok: function (s) { return s.watermills >= 1; } }
    ],
    hard: [
      { id: 'grove5', text: 'Grow a forest grove of 5 or more', ok: function (s) { return s.maxForest >= 5; } },
      { id: 'pasture5', text: 'Grow a field pasture of 5 or more', ok: function (s) { return s.maxField >= 5; } },
      { id: 'river5', text: 'Run a river that crosses the whole board (span 4)', ok: function (s) { return s.maxRiverSpan >= 4; } },
      { id: 'snug2', text: 'Build two Snug houses', ok: function (s) { return s.snug >= 2; } },
      { id: 'mill3', text: 'Give one windmill 3 neighbouring fields', ok: function (s) { return s.maxMillFields >= 3; } },
      { id: 'square3', text: 'Surround a market with 3 or more houses', ok: function (s) { return s.maxMarketHouses >= 3; } }
    ]
  };
  var REQUEST_POINTS = { easy: 6, hard: 12 };

  /* ---------- daily puzzle (the seed algorithm; see docs/design.md section 4) ---------- */
  var EXTRA_WEIGHTS = ['forest', 'forest', 'field', 'field', 'river', 'river', 'house', 'house', 'windmill', 'market'];
  function seedString(dateKey) { return 'hexglen|' + SEED_VERSION + '|' + dateKey; }
  function generateDaily(dateKey) {
    var rng = makeRng(seedString(dateKey));
    var bag = [];
    TYPES.forEach(function (t) { bag.push(t, t); });              // 12 = two of every type
    var counts = {}; bag.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; });
    while (bag.length < TILES_PER_DAY) {                           // 3 seeded extras, max 4 of a type
      var t = EXTRA_WEIGHTS[randInt(rng, EXTRA_WEIGHTS.length)];
      if (counts[t] >= 4) continue;
      counts[t]++; bag.push(t);
    }
    for (var i = bag.length - 1; i > 0; i--) {                     // Fisher-Yates
      var j = randInt(rng, i + 1), tmp = bag[i]; bag[i] = bag[j]; bag[j] = tmp;
    }
    var weather = WEATHER[randInt(rng, WEATHER.length)];
    var e = REQUESTS.easy[randInt(rng, REQUESTS.easy.length)];
    var h = REQUESTS.hard[randInt(rng, REQUESTS.hard.length)];
    return {
      date: dateKey, number: puzzleNumber(dateKey), seed: seedString(dateKey),
      tiles: bag, weather: weather.id,
      requests: [{ tier: 'easy', id: e.id }, { tier: 'hard', id: h.id }]
    };
  }
  function weatherById(id) { return WEATHER.filter(function (w) { return w.id === id; })[0]; }
  function requestDef(tier, id) { return REQUESTS[tier].filter(function (r) { return r.id === id; })[0]; }

  /* ---------- scoring: a pure function of the finished (or partial) board ---------- */
  function tri(n) { return n * (n + 1) / 2; }
  function components(board, type) { // connected clusters of one type; returns arrays of [q,r]
    var seen = {}, out = [];
    CELLS.forEach(function (c) {
      var k = key(c[0], c[1]);
      if (board[k] !== type || seen[k]) return;
      var stack = [c], comp = []; seen[k] = true;
      while (stack.length) {
        var cur = stack.pop(); comp.push(cur);
        neighbors(cur[0], cur[1]).forEach(function (n) {
          var nk = key(n[0], n[1]);
          if (board[nk] === type && !seen[nk]) { seen[nk] = true; stack.push(n); }
        });
      }
      out.push(comp);
    });
    return out;
  }
  function span(comp) {
    var m = 0;
    for (var i = 0; i < comp.length; i++) for (var j = i + 1; j < comp.length; j++) m = Math.max(m, dist(comp[i], comp[j]));
    return m;
  }
  var RIVER_SPAN_BONUS = [0, 0, 2, 5, 9];
  function neighborTypes(board, q, r) {
    return neighbors(q, r).map(function (n) { return board[key(n[0], n[1])]; }).filter(Boolean);
  }
  function analyse(board) {
    var s = { maxForest: 0, maxField: 0, maxRiverSpan: 0, snug: 0, watermills: 0, maxMillFields: 0, maxMarketHouses: 0 };
    components(board, 'forest').forEach(function (c) { s.maxForest = Math.max(s.maxForest, c.length); });
    components(board, 'field').forEach(function (c) { s.maxField = Math.max(s.maxField, c.length); });
    components(board, 'river').forEach(function (c) { s.maxRiverSpan = Math.max(s.maxRiverSpan, span(c)); });
    CELLS.forEach(function (c) {
      var t = board[key(c[0], c[1])], nt = neighborTypes(board, c[0], c[1]);
      if (t === 'house') {
        var distinct = {}; nt.forEach(function (x) { if (x !== 'house') distinct[x] = 1; });
        if (Object.keys(distinct).length >= 4) s.snug++;
      } else if (t === 'windmill') {
        var f = nt.filter(function (x) { return x === 'field'; }).length;
        s.maxMillFields = Math.max(s.maxMillFields, f);
        if (f >= 1 && nt.indexOf('river') >= 0) s.watermills++;
      } else if (t === 'market') {
        s.maxMarketHouses = Math.max(s.maxMarketHouses, nt.filter(function (x) { return x === 'house'; }).length);
      }
    });
    return s;
  }
  /* score(board, opts) -> { total, parts: {grove, pasture, river, windmill, house, market, request}, requestsDone:[bool,bool], notes:[...] }
     opts.weather = weather id, opts.requests = [{tier,id},...] */
  function score(board, opts) {
    opts = opts || {};
    var w = opts.weather, P = { grove: 0, pasture: 0, river: 0, windmill: 0, house: 0, market: 0, request: 0 };
    var notes = [];
    components(board, 'forest').forEach(function (c) {
      var n = c.length, p = tri(n) + (w === 'leaves' ? n : 0); P.grove += p; if (n >= 2) notes.push({ rule: 'grove', n: n, points: p });
    });
    components(board, 'field').forEach(function (c) {
      var n = c.length, p = tri(n) + (w === 'harvest' ? n : 0); P.pasture += p; if (n >= 2) notes.push({ rule: 'pasture', n: n, points: p });
    });
    components(board, 'river').forEach(function (c) {
      var n = c.length, sp = span(c), p = n + (w === 'rain' ? n : 0) + RIVER_SPAN_BONUS[Math.min(sp, 4)];
      P.river += p; if (n >= 2) notes.push({ rule: 'river', n: n, span: sp, points: p });
    });
    var perField = w === 'clear' ? 3 : 2;
    CELLS.forEach(function (c) {
      var t = board[key(c[0], c[1])]; if (!t) return;
      var nt = neighborTypes(board, c[0], c[1]);
      if (t === 'windmill') {
        var f = nt.filter(function (x) { return x === 'field'; }).length;
        var mult = nt.indexOf('river') >= 0 ? 2 : 1;
        var p = f * perField * mult; P.windmill += p;
        if (p) notes.push({ rule: 'windmill', fields: f, water: mult === 2, points: p });
      } else if (t === 'house') {
        var distinct = {}; nt.forEach(function (x) { if (x !== 'house') distinct[x] = 1; });
        var d = Object.keys(distinct).length, p2 = d + (d >= 4 ? 3 : 0); P.house += p2;
        if (p2) notes.push({ rule: 'house', distinct: d, snug: d >= 4, points: p2 });
      } else if (t === 'market') {
        var h = nt.filter(function (x) { return x === 'house'; }).length, p3 = 2 * h; P.market += p3;
        if (p3) notes.push({ rule: 'market', houses: h, points: p3 });
      }
    });
    var stats = analyse(board), done = [];
    (opts.requests || []).forEach(function (rq) {
      var def = requestDef(rq.tier, rq.id), ok = !!(def && def.ok(stats));
      done.push(ok); if (ok) P.request += REQUEST_POINTS[rq.tier];
    });
    var total = 0; Object.keys(P).forEach(function (k) { total += P[k]; });
    return { total: total, parts: P, requestsDone: done, notes: notes, stats: stats };
  }
  var PART_LABEL = { grove: 'Groves', pasture: 'Pastures', river: 'Rivers', windmill: 'Windmills', house: 'Cosy houses', market: 'Markets', request: 'Villager requests' };
  function diffParts(before, after) {
    var out = [];
    Object.keys(PART_LABEL).forEach(function (k) {
      var d = after.parts[k] - before.parts[k]; if (d !== 0) out.push({ key: k, label: PART_LABEL[k], delta: d });
    });
    return out;
  }

  /* ---------- game state ---------- */
  // state: { daily, board:{k:type}, queue:[types] (remaining incl. current), stash:null|type, history:[], undosLeft, stashUsed }
  function newGame(daily) {
    return { daily: daily, board: {}, queue: daily.tiles.slice(), stash: null, history: [], undosLeft: 1, placed: 0 };
  }
  function current(g) { return g.queue.length ? g.queue[0] : (g.stash || null); }
  function isOver(g) { return g.queue.length === 0 && g.stash === null; }
  function place(g, q, r) {
    if (!inBoard(q, r) || g.board[key(q, r)] || isOver(g)) return false;
    var snapshot = { board: Object.assign({}, g.board), queue: g.queue.slice(), stash: g.stash, placed: g.placed };
    var t;
    if (g.queue.length) t = g.queue.shift(); else { t = g.stash; g.stash = null; }
    g.board[key(q, r)] = t; g.placed++; g.history.push(snapshot);
    return t;
  }
  function stash(g) { // swap the current tile with the stash (or park it if the stash is empty)
    if (isOver(g)) return false;
    if (g.stash === null) { if (g.queue.length < 2) return false; g.stash = g.queue.shift(); return true; }
    if (!g.queue.length) return false;
    var t = g.queue[0]; g.queue[0] = g.stash; g.stash = t; return true;
  }
  function undo(g) {
    if (!g.history.length || g.undosLeft <= 0) return false;
    var s = g.history.pop(); g.board = s.board; g.queue = s.queue; g.stash = s.stash; g.placed = s.placed; g.undosLeft--; return true;
  }
  function gameScore(g) { return score(g.board, { weather: g.daily.weather, requests: g.daily.requests }); }

  /* ---------- ranks, village rewards, share string ---------- */
  var STAR_THRESHOLDS = [45, 58, 68];            // calibrated by tools/calibrate.js (see docs)
  function stars(total) { return STAR_THRESHOLDS.filter(function (t) { return total >= t; }).length; }
  var RANKS = [[0, 'Seedling'], [25, 'Wanderer'], [35, 'Neighbour'], [45, 'Gardener'], [52, 'Villager'], [58, 'Harvester'], [64, 'Mayor'], [72, 'Hearthkeeper'], [82, 'Legend of the Glen']];
  function rank(total) { var r = RANKS[0][1]; RANKS.forEach(function (x) { if (total >= x[0]) r = x[1]; }); return r; }

  // Score -> village reward: always one building; tiers add decoration; completed requests add decorations.
  var BUILDINGS = ['cottage', 'cottage', 'well', 'barn', 'bakery', 'cottage', 'chapel', 'bridge', 'mill', 'inn'];
  var DECOS = ['flowers', 'bench', 'lantern', 'scarecrow', 'fountain'];
  function villageReward(daily, total, requestsDone) {
    var rng = makeRng('hexglen|village|' + daily.date), items = [];
    items.push({ kind: 'building', type: BUILDINGS[randInt(rng, BUILDINGS.length)] });
    var st = stars(total);
    for (var i = 0; i < st; i++) items.push({ kind: 'deco', type: DECOS[randInt(rng, DECOS.length)] });
    requestsDone.forEach(function (ok) { if (ok) items.push({ kind: 'deco', type: DECOS[randInt(rng, DECOS.length)] }); });
    return items;
  }

  function shareString(daily, board, total, extras) {
    extras = extras || {};
    var rows = [], idx = 0, line, i;
    var rowLens = [3, 4, 5, 4, 3];
    for (var ri = 0; ri < CELLS.length; ) {
      var len = rowLens[rows.length], cells = CELLS.slice(ri, ri + len);
      line = cells.map(function (c) { var t = board[key(c[0], c[1])]; return t ? EMOJI[t] : '⬜'; }).join('');
      var indent = (5 - len); // en-space per half emoji
      var pre = ''; for (i = 0; i < indent; i++) pre += '\u2002';
      rows.push(pre + line); ri += len;
    }
    var w = weatherById(daily.weather);
    var head = GAME_NAME + ' #' + daily.number + ' · ' + daily.date;
    var st = stars(total), starStr = ''; for (i = 0; i < 3; i++) starStr += i < st ? '⭐' : '▫️';
    var reqs = (extras.requestsDone || []).map(function (ok) { return ok ? '✅' : '▫️'; }).join('');
    var lines = [head, starStr + ' ' + total + ' pts · ' + rank(total), w.icon + ' ' + w.name + '  ' + reqs];
    return lines.concat(rows).concat(extras.streak ? ['🔥 ' + extras.streak + '-day streak'] : []).join('\n');
  }

  /* ---------- streak with gentle freeze (pure) ---------- */
  // st: { last:'YYYY-MM-DD'|null, streak:n, freezes:n, best:n, sinceFreeze:n }
  function emptyStreak() { return { last: null, streak: 0, freezes: 1, best: 0, sinceFreeze: 0 }; }
  function streakOnComplete(st, dateKey) {
    st = Object.assign({}, st);
    if (st.last === dateKey) return st;
    var gap = st.last ? dayNumber(dateKey) - dayNumber(st.last) : null;
    if (gap === null || gap > 1 + st.freezes || gap < 1) {
      // gap<1 means a back-dated date; treat as no change. gap beyond freezes resets.
      if (gap !== null && gap < 1) return st;
      st.streak = 1;
      st.sinceFreeze = 1;
    } else {
      st.freezes -= (gap - 1); // each missed day burns one freeze
      st.streak += 1;
      st.sinceFreeze = (st.sinceFreeze || 0) + 1;
    }
    if (st.sinceFreeze >= 7 && st.freezes < 2) { st.freezes++; st.sinceFreeze = 0; } // earn one per 7 played days, max 2
    st.last = dateKey; st.best = Math.max(st.best, st.streak);
    return st;
  }
  // Streak shown on the home screen: still alive if the gap can be covered by freezes.
  function streakAlive(st, todayKey) {
    if (!st.last) return false;
    var gap = dayNumber(todayKey) - dayNumber(st.last);
    return gap <= 1 + st.freezes;
  }

  return {
    GAME_NAME: GAME_NAME, SEED_VERSION: SEED_VERSION, RADIUS: RADIUS, TILES_PER_DAY: TILES_PER_DAY,
    TYPES: TYPES, LABEL: LABEL, EMOJI: EMOJI, CELLS: CELLS, DIRS: DIRS, WEATHER: WEATHER, REQUESTS: REQUESTS, REQUEST_POINTS: REQUEST_POINTS,
    PART_LABEL: PART_LABEL, STAR_THRESHOLDS: STAR_THRESHOLDS, RIVER_SPAN_BONUS: RIVER_SPAN_BONUS,
    key: key, dist: dist, inBoard: inBoard, neighbors: neighbors, makeRng: makeRng, randInt: randInt,
    utcDateKey: utcDateKey, validDateKey: validDateKey, dayNumber: dayNumber, puzzleNumber: puzzleNumber,
    seedString: seedString, generateDaily: generateDaily, weatherById: weatherById, requestDef: requestDef,
    components: components, analyse: analyse, score: score, diffParts: diffParts,
    newGame: newGame, current: current, isOver: isOver, place: place, stash: stash, undo: undo, gameScore: gameScore,
    stars: stars, rank: rank, villageReward: villageReward, shareString: shareString,
    emptyStreak: emptyStreak, streakOnComplete: streakOnComplete, streakAlive: streakAlive
  };
});
