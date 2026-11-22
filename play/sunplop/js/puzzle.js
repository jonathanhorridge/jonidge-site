/*
 * Sunplop puzzle engine: generator, human-style logic solver, uniqueness checker.
 * Pure JS, no dependencies, deterministic from a string seed. Works in browser and Node.
 *
 * RULES
 *   - Place exactly K suns in every row and every column (K = 2).
 *   - A numbered tile is never a sun; its number = suns touching it (8 neighbours, diagonals count).
 *   - Mechanic "cloud": a cloud tile is never a sun and gives no number.
 *   - Mechanic "plus clue" (green): counts only the 4 side neighbours (no diagonals).
 *
 * Cell types: 0 free, 1 clue (8-neighbour), 2 plus clue (4-neighbour), 3 cloud.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SunplopEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------- deterministic RNG ----------
  function xmur3(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rngFrom(seed) { return mulberry32(xmur3(String(seed))()); }
  function shuffle(a, rng) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ---------- geometry ----------
  var geoCache = {};
  function geometry(n) {
    if (geoCache[n]) return geoCache[n];
    var nb = [], nb4 = [];
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      var list = [];
      for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        var rr = r + dr, cc = c + dc;
        if (rr >= 0 && rr < n && cc >= 0 && cc < n) list.push(rr * n + cc);
      }
      nb.push(list);
      nb4.push(list.filter(function (j) { var rr = Math.floor(j / n), cc = j % n; return rr === r || cc === c; }));
    }
    var lines = [];
    for (var i = 0; i < n; i++) {
      var row = [], col = [];
      for (var j = 0; j < n; j++) { row.push(i * n + j); col.push(j * n + i); }
      lines.push(row, col);
    }
    return (geoCache[n] = { nb: nb, nb4: nb4, lines: lines });
  }

  function combos(n, k) {
    var out = [];
    (function rec(start, acc) {
      if (acc.length === k) { out.push(acc.slice()); return; }
      for (var i = start; i < n; i++) { acc.push(i); rec(i + 1, acc); acc.pop(); }
    })(0, []);
    return out;
  }

  // ---------- random solution ----------
  function randomSolution(n, k, rng) {
    var picks = combos(n, k), colCount = new Array(n).fill(0), rows = [];
    function rec(r) {
      if (r === n) return true;
      var opts = shuffle(picks.slice(), rng);
      for (var o = 0; o < opts.length; o++) {
        var p = opts[o], bad = false;
        for (var i = 0; i < p.length; i++) if (colCount[p[i]] >= k) bad = true;
        if (bad) continue;
        p.forEach(function (c) { colCount[c]++; });
        var rem = n - r - 1, ok = true;
        for (var c = 0; c < n; c++) if (k - colCount[c] > rem) ok = false;
        if (ok) { rows.push(p); if (rec(r + 1)) return true; rows.pop(); }
        p.forEach(function (c) { colCount[c]--; });
      }
      return false;
    }
    rec(0);
    var sol = new Array(n * n).fill(0);
    rows.forEach(function (p, r) { p.forEach(function (c) { sol[r * n + c] = 1; }); });
    return sol;
  }

  // ---------- constraints ----------
  function buildConstraints(n, k, types, vals) {
    var g = geometry(n), cons = [];
    g.lines.forEach(function (l) { cons.push({ cells: l, need: k }); });
    for (var i = 0; i < n * n; i++) {
      if (types[i] === 1) cons.push({ cells: g.nb[i], need: vals[i] });
      else if (types[i] === 2) cons.push({ cells: g.nb4[i], need: vals[i] });
    }
    return cons;
  }
  function initialState(n, types) {
    var s = new Int8Array(n * n).fill(-1); // -1 unknown, 0 empty, 1 sun
    for (var i = 0; i < n * n; i++) if (types[i]) s[i] = 0;
    return s;
  }

  // Basic propagation. Returns false on contradiction. Mutates s.
  function propagate(s, cons) {
    var changed = true;
    while (changed) {
      changed = false;
      for (var ci = 0; ci < cons.length; ci++) {
        var con = cons[ci], cells = con.cells, sun = 0, unk = 0, j;
        for (j = 0; j < cells.length; j++) { var v = s[cells[j]]; if (v === 1) sun++; else if (v === -1) unk++; }
        if (sun > con.need || sun + unk < con.need) return false;
        if (unk === 0) continue;
        if (sun === con.need) { for (j = 0; j < cells.length; j++) if (s[cells[j]] === -1) s[cells[j]] = 0; changed = true; }
        else if (sun + unk === con.need) { for (j = 0; j < cells.length; j++) if (s[cells[j]] === -1) s[cells[j]] = 1; changed = true; }
      }
    }
    return true;
  }
  function isComplete(s) { for (var i = 0; i < s.length; i++) if (s[i] === -1) return false; return true; }

  /**
   * Human-style solve: counting rules, then single-cell "what if" probes (one level deep).
   * probes = number of what-if deductions needed = difficulty. Aborts when probes > maxProbes.
   */
  function logicSolve(n, k, types, vals, maxProbes) {
    if (maxProbes == null) maxProbes = Infinity;
    var cons = buildConstraints(n, k, types, vals), s = initialState(n, types), probes = 0, rounds = 0;
    if (!propagate(s, cons)) return { solved: false, probes: 0, contradiction: true };
    while (!isComplete(s)) {
      rounds++;
      var progress = false;
      for (var i = 0; i < s.length && !progress; i++) {
        if (s[i] !== -1) continue;
        for (var guess = 1; guess >= 0 && !progress; guess--) {
          var t = Int8Array.from(s); t[i] = guess;
          if (!propagate(t, cons)) {
            probes++;
            if (probes > maxProbes) return { solved: false, probes: probes };
            s[i] = 1 - guess;
            if (!propagate(s, cons)) return { solved: false, probes: probes, contradiction: true };
            progress = true;
          }
        }
      }
      if (!progress) return { solved: false, probes: probes, stuck: true };
    }
    return { solved: true, probes: probes, rounds: rounds, state: s };
  }

  // Exhaustive solution counter (independent uniqueness check).
  function countSolutions(n, k, types, vals, limit) {
    limit = limit || 2;
    var cons = buildConstraints(n, k, types, vals), count = 0, first = null;
    function rec(s) {
      if (count >= limit) return;
      if (!propagate(s, cons)) return;
      var idx = -1;
      for (var i = 0; i < s.length; i++) if (s[i] === -1) { idx = i; break; }
      if (idx === -1) { count++; if (!first) first = Array.from(s); return; }
      var a = Int8Array.from(s); a[idx] = 1; rec(a);
      var b = Int8Array.from(s); b[idx] = 0; rec(b);
    }
    rec(initialState(n, types));
    return { count: count, solution: first };
  }

  // ---------- generator ----------
  function clueValue(g, sol, i, type) {
    var v = 0; (type === 2 ? g.nb4[i] : g.nb[i]).forEach(function (j) { v += sol[j]; }); return v;
  }

  /** cfg: { n, k, maxProbes, extra, clouds, plus } */
  function makePuzzle(cfg, rng) {
    var n = cfg.n, k = cfg.k || 2, g = geometry(n);
    var sol = randomSolution(n, k, rng);
    var types = new Array(n * n).fill(0), vals = new Array(n * n).fill(-1);
    var empties = []; for (var i = 0; i < n * n; i++) if (!sol[i]) empties.push(i);
    shuffle(empties, rng);
    var nClouds = Math.min(cfg.clouds || 0, Math.floor(empties.length / 4));
    empties.forEach(function (i, idx) {
      if (idx < nClouds) { types[i] = 3; return; }
      types[i] = (cfg.plus && rng() < cfg.plus) ? 2 : 1;
      vals[i] = clueValue(g, sol, i, types[i]);
    });
    var full = { types: types.slice(), vals: vals.slice() };
    var order = empties.slice(nClouds); shuffle(order, rng);
    var removed = [];
    order.forEach(function (i) {
      var t = types[i], v = vals[i]; types[i] = 0; vals[i] = -1;
      var res = logicSolve(n, k, types, vals, cfg.maxProbes);
      if (!res.solved) { types[i] = t; vals[i] = v; } else removed.push(i);
    });
    // give back some removed clues (gentler puzzles), prefer last-removed (most informative)
    for (var e = 0; e < (cfg.extra || 0) && removed.length; e++) {
      var back = removed.splice(Math.floor(rng() * removed.length), 1)[0];
      types[back] = full.types[back]; vals[back] = full.vals[back];
    }
    var res = logicSolve(n, k, types, vals, cfg.maxProbes);
    var clueCount = 0, plusCount = 0, cloudCount = 0;
    for (var j = 0; j < n * n; j++) { if (types[j] === 1 || types[j] === 2) clueCount++; if (types[j] === 2) plusCount++; if (types[j] === 3) cloudCount++; }
    return { n: n, k: k, types: types, vals: vals, solution: sol, probes: res.probes, solved: res.solved,
      clueCount: clueCount, plusCount: plusCount, cloudCount: cloudCount };
  }

  function generateWith(cfg, seedStr, minProbes) {
    var rng = rngFrom(seedStr), best = null, bestGap = Infinity;
    for (var tries = 0; tries < 30; tries++) {
      var p = makePuzzle(cfg, rng);
      if (!p.solved) continue;
      var gap = p.probes < minProbes ? minProbes - p.probes : p.probes > cfg.maxProbes ? p.probes - cfg.maxProbes : 0;
      if (gap < bestGap) { best = p; bestGap = gap; }
      if (gap === 0) break;
    }
    return best;
  }

  // ---------- daily ----------
  var DAILY = { n: 6, k: 2, minProbes: 1, maxProbes: 4, extra: 0 };
  /** Daily puzzle: same for everyone on a date. */
  function generateDaily(dateKey, salt) {
    var p = generateWith(DAILY, 'sunplop|daily|' + dateKey + (salt ? '|' + salt : ''), DAILY.minProbes);
    p.seed = dateKey; p.kind = 'daily'; p.par = 150;
    return p;
  }

  // ---------- levels ----------
  // Chapter 1 is a short 10-level 4x4 tutorial; every other chapter has 25 levels (2,485 levels, 100 chapters).
  // Level content is defined by its "legacy index" in the original 25-per-chapter layout (set v2), so shortening
  // chapter 1 changed no puzzle: chapter 1 = 10 hand-picked v2 levels, level L>=11 = v2 level L+15.
  var CHAPTER_SIZE = 25, FIRST_CHAPTER_SIZE = 10, TOTAL_LEVELS = 2485, TOTAL_CHAPTERS = 100, LEGACY_CHAPTER_SIZE = 25;
  var CH1_PICK = [4, 5, 7, 11, 14, 15, 19, 21, 22, 23];   // v2 levels kept for chapter 1 (8 -> 3 clues, then the 1-step ones)
  function legacyIndex(L) { return L <= FIRST_CHAPTER_SIZE ? CH1_PICK[L - 1] : L + (LEGACY_CHAPTER_SIZE - FIRST_CHAPTER_SIZE); }
  /** v2 level number -> current level number (null if that v2 level was dropped from chapter 1). For save migration. */
  function fromLegacy(oldL) {
    oldL = +oldL;
    if (oldL > LEGACY_CHAPTER_SIZE) return oldL - (LEGACY_CHAPTER_SIZE - FIRST_CHAPTER_SIZE);
    var j = CH1_PICK.indexOf(oldL); return j < 0 ? null : j + 1;
  }
  // Set v4 (2026-11-21): new puzzles for chapter 3 (5x5 with what-if steps) and chapter 9 (smoother ramp). Every other level is unchanged.
  var V4_CHAPTERS = [3, 9];
  function isV4Level(L) { return V4_CHAPTERS.indexOf(chapterOf(L)) >= 0; }
  function chapterStart(ch) { return ch <= 1 ? 1 : FIRST_CHAPTER_SIZE + 1 + (ch - 2) * CHAPTER_SIZE; }
  function chapterSize(ch) { return ch <= 1 ? FIRST_CHAPTER_SIZE : CHAPTER_SIZE; }
  function chapterEnd(ch) { return Math.min(TOTAL_LEVELS, chapterStart(ch) + chapterSize(ch) - 1); }
  // Hand-tuned first chapters; p = what-if steps [start,end] across the chapter, extra = bonus clues, clouds = cloud tiles
  var CHAPTERS = [
    { n: 4, p: [0, 1], extra: [3, 0], intro: 'basics' },   // gentle 4x4 tutorial chapter
    { n: 5, p: [0, 1], extra: [3, 1], intro: 'size' },
    { n: 5, p: [1, 2], slack: 0, extra: [1, 0], v4: true },   // v4: a real step up: every level needs 1, the last half 2 what-if steps
    { n: 6, p: [0, 2], extra: [2, 0], intro: 'size' },
    { n: 6, p: [0, 3], extra: [1, 0], clouds: [3, 2], intro: 'cloud' },
    { n: 6, p: [1, 4], extra: [0, 0], clouds: [2, 0] },
    { n: 7, p: [0, 4], extra: [2, 0], intro: 'size' },
    { n: 7, p: [1, 6], extra: [1, 0], plus: 0.4, intro: 'plus' },
    { n: 7, p: [4, 6], slack: 1, extra: [0, 0], plus: 0.3, clouds: [2, 0], v4: true },   // v4: was 2->9 (jumped to ~7); now continues from chapter 8's ~4
    { n: 8, p: [1, 6], extra: [2, 0], intro: 'size' },
    { n: 8, p: [3, 10], extra: [0, 0], plus: 0.3, clouds: [3, 0] },
    { n: 8, p: [4, 12], extra: [0, 0], clouds: [2, 0] },
    { n: 9, p: [2, 8], extra: [2, 0], intro: 'size' }
  ];
  var LATE_THEMES = [
    { n: 8, plus: 0.3 }, { n: 9 }, { n: 8, clouds: [3, 1] }, { n: 9, plus: 0.3, clouds: [2, 0] }, { n: 7, plus: 0.5 }, { n: 9, plus: 0.2 }
  ];
  function chapterOf(L) { return L <= FIRST_CHAPTER_SIZE ? 1 : 2 + Math.floor((L - FIRST_CHAPTER_SIZE - 1) / CHAPTER_SIZE); }
  function chapterInfo(ch) {
    if (ch <= CHAPTERS.length) return CHAPTERS[ch - 1];
    var x = ch - CHAPTERS.length - 1, th = LATE_THEMES[x % LATE_THEMES.length];
    var lo = Math.min(4 + Math.floor(x / 4), 9), hi = Math.min(10 + Math.floor(x / 3), 16);
    return { n: th.n, p: [lo, hi], extra: [1, 0], plus: th.plus || 0, clouds: th.clouds || [0, 0] };
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  // difficulty band etc. of a level, taken from its legacy (v2) slot so content and bands are unchanged
  function levelConfig(L) {
    var c = legacyConfig(legacyIndex(L)), ch = chapterOf(L);
    c.chapter = ch; c.index = L - chapterStart(ch) + 1; c.intro = c.index === 1 ? (chapterInfo(ch).intro || null) : null;
    return c;
  }
  function legacyConfig(LL) {
    var ch = Math.ceil(LL / LEGACY_CHAPTER_SIZE), i = (LL - 1) % LEGACY_CHAPTER_SIZE, t = i / (LEGACY_CHAPTER_SIZE - 1), info = chapterInfo(ch);
    var hi = Math.round(lerp(info.p[0], info.p[1], t)), c = info.clouds || [0, 0];
    return { n: info.n, k: 2, maxProbes: hi, minProbes: Math.max(0, hi - (info.slack == null ? 2 : info.slack)),
      extra: Math.round(lerp(info.extra[0], info.extra[1], t)), clouds: Math.round(lerp(c[0], c[1], t)), plus: info.plus || 0,
      chapter: ch, index: i + 1, intro: i === 0 ? (info.intro || null) : null };
  }
  /** Level L (1..TOTAL_LEVELS): deterministic, same for everyone. */
  function generateLevel(L, salt) {
    var cfg = levelConfig(L), seed = isV4Level(L) ? 'sunplop|v4|level|' + L : 'sunplop|level|' + legacyIndex(L);
    var p = generateWith(cfg, seed + (salt ? '|' + salt : ''), cfg.minProbes);
    p.level = L; p.kind = 'level'; p.chapter = cfg.chapter;
    p.par = Math.round(p.n * p.n * 0.9 + p.probes * 10 + 10); // seconds for 3 stars
    return p;
  }


  // ---------- frozen data format ----------
  // "n|cells|sol|probes|par": cells: '.' free, '#' cloud, '0'-'8' clue, 'A'-'E' plus clue 0-4; sol: 2 sun columns per row.
  function encode(p) {
    var cells = '', sol = '';
    for (var i = 0; i < p.n * p.n; i++) cells += p.types[i] === 0 ? '.' : p.types[i] === 3 ? '#' : p.types[i] === 1 ? String(p.vals[i]) : String.fromCharCode(65 + p.vals[i]);
    for (var r = 0; r < p.n; r++) for (var c = 0; c < p.n; c++) if (p.solution[r * p.n + c]) sol += c;
    return [p.n, cells, sol, p.probes, p.par].join('|');
  }
  function decode(str) {
    var a = str.split('|'), n = +a[0], types = [], vals = [], solution = new Array(n * n).fill(0), k = 2, clueCount = 0, plusCount = 0, cloudCount = 0;
    for (var i = 0; i < n * n; i++) {
      var ch = a[1][i];
      if (ch === '.') { types.push(0); vals.push(-1); }
      else if (ch === '#') { types.push(3); vals.push(-1); cloudCount++; }
      else if (ch >= '0' && ch <= '9') { types.push(1); vals.push(+ch); clueCount++; }
      else { types.push(2); vals.push(ch.charCodeAt(0) - 65); clueCount++; plusCount++; }
    }
    for (var r = 0; r < n; r++) for (var j = 0; j < k; j++) solution[r * n + (+a[2][r * k + j])] = 1;
    return { n: n, k: k, types: types, vals: vals, solution: solution, probes: +a[3], par: +a[4], solved: true,
      clueCount: clueCount, plusCount: plusCount, cloudCount: cloudCount };
  }

  /** Full check used by tests: unique, logic-solvable, solution consistent. Returns list of problems ([] = OK). */
  function verifyPuzzle(p) {
    var errs = [], n = p.n, k = p.k, g = geometry(n);
    var cnt = countSolutions(n, k, p.types, p.vals, 2);
    if (cnt.count !== 1) errs.push('brute-force solutions=' + cnt.count);
    var lg = logicSolve(n, k, p.types, p.vals);
    if (!lg.solved) errs.push('logic solver stuck');
    else if (lg.probes !== p.probes) errs.push('probes mismatch ' + lg.probes + ' vs ' + p.probes);
    for (var r = 0; r < n; r++) { var rs = 0, cs = 0; for (var c = 0; c < n; c++) { rs += p.solution[r * n + c]; cs += p.solution[c * n + r]; } if (rs !== k || cs !== k) errs.push('line count ' + r); }
    for (var i = 0; i < n * n; i++) {
      if (p.types[i] && p.solution[i]) errs.push('sun on fixed tile ' + i);
      if (p.types[i] === 1 || p.types[i] === 2) {
        var v = 0; (p.types[i] === 2 ? g.nb4[i] : g.nb[i]).forEach(function (j) { v += p.solution[j]; });
        if (v !== p.vals[i]) errs.push('clue mismatch at ' + i);
      }
    }
    if (cnt.solution && cnt.solution.some(function (v, j) { return v !== p.solution[j]; })) errs.push('stored solution differs from brute force');
    if (lg.state && Array.prototype.some.call(lg.state, function (v, j) { return v !== p.solution[j]; })) errs.push('logic solution differs');
    return errs;
  }

  /** Hint used by the app: fix the first wrong mark, else reveal a missing sun. board: 0 empty, 1 sun, 2 dot. Returns {i, v} or null when solved. */
  function nextHint(p, board, rnd) {
    var wrong = [], missing = [];
    for (var i = 0; i < p.n * p.n; i++) {
      if (p.types[i]) continue;
      var want = p.solution[i] ? 1 : 2;
      if ((board[i] === 1 && want === 2) || (board[i] === 2 && want === 1)) wrong.push(i);
      else if (want === 1 && board[i] !== 1) missing.push(i);
    }
    if (wrong.length) return { i: wrong[0], v: p.solution[wrong[0]] ? 1 : 2 };
    if (!missing.length) return null;
    var pick = missing[Math.floor((rnd == null ? 0 : rnd) * missing.length)];
    return { i: pick, v: 1 };
  }
  function isSolvedBoard(p, board) { for (var i = 0; i < p.n * p.n; i++) if ((board[i] === 1) !== (p.solution[i] === 1)) return false; return true; }

  // ---------- frozen sets (www/js/levels-data.js) ----------
  var FROZEN = (typeof self !== 'undefined' && self.SUNPLOP_DATA) || null;
  if (!FROZEN && typeof require === 'function') { try { FROZEN = require('./levels-data.js'); } catch (e) { FROZEN = null; } }
  function frozenLevelCount() { return FROZEN ? FROZEN.levels.length : 0; }
  function getLevel(L) {
    if (FROZEN && FROZEN.levels[L - 1]) { var p = decode(FROZEN.levels[L - 1]); p.level = L; p.kind = 'level'; p.chapter = chapterOf(L); return p; }
    return generateLevel(L);
  }
  function getDaily(dateKey) {
    if (FROZEN && FROZEN.dailyStart) {
      var a = FROZEN.dailyStart.split('-').map(Number), b = dateKey.split('-').map(Number);
      var idx = Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 864e5);
      if (idx >= 0 && FROZEN.dailies[idx]) { var p = decode(FROZEN.dailies[idx]); p.seed = dateKey; p.kind = 'daily'; return p; }
    }
    return generateDaily(dateKey);
  }

  return {
    getLevel: getLevel, getDaily: getDaily, encode: encode, decode: decode, verifyPuzzle: verifyPuzzle, nextHint: nextHint, isSolvedBoard: isSolvedBoard,
    frozenLevelCount: frozenLevelCount, FROZEN: FROZEN, makePuzzle: makePuzzle, generateWith: generateWith, rngFrom2: rngFrom,
    generateDaily: generateDaily, generateLevel: generateLevel, levelConfig: levelConfig, chapterOf: chapterOf, chapterInfo: chapterInfo,
    logicSolve: logicSolve, countSolutions: countSolutions, geometry: geometry, rngFrom: rngFrom,
    CHAPTER_SIZE: CHAPTER_SIZE, FIRST_CHAPTER_SIZE: FIRST_CHAPTER_SIZE, TOTAL_LEVELS: TOTAL_LEVELS, TOTAL_CHAPTERS: TOTAL_CHAPTERS, DAILY: DAILY,
    chapterStart: chapterStart, chapterEnd: chapterEnd, chapterSize: chapterSize, legacyIndex: legacyIndex, fromLegacy: fromLegacy, CH1_PICK: CH1_PICK,
    isV4Level: isV4Level, V4_CHAPTERS: V4_CHAPTERS
  };
});
