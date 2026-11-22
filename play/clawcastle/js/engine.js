/* Clawcastle engine: pure, deterministic game rules (no DOM). Works in the browser and in node tests.
 * Grid row 0 is the top of the board (next to the battlefield); troops march "up" out of the board. */
(function (root) {
  'use strict';
  var D = root.CCData || (typeof require !== 'undefined' ? require('./data.js') : null);
  var COLS = D.COLS, ROWS = D.ROWS, FRONT = D.FRONT;
  var E = {};

  function rnd(s) { // mulberry32, state kept in s.seed so the whole state is plain JSON
    var t = (s.seed = (s.seed + 0x6D2B79F5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function ri(s, n) { return Math.floor(rnd(s) * n); }
  E.rnd = rnd;

  function parseLane(str, hpx) {
    if (!str) return [];
    return str.trim().split(/\s+/).map(function (tok) {
      var def = D.BUILD[tok[0]];
      var hp = Math.round((tok.length > 1 ? parseFloat(tok.slice(1)) : def.hp) * (hpx || D.HPX));
      return { k: def.k, code: tok[0], hp: hp, max: hp, cd: def.cd || 0, t: def.cd || 0 };
    });
  }
  E.parseLane = parseLane;

  function newTile(s, avoid) {
    var t, tries = 0;
    do { t = ri(s, s.colors); tries++; } while (avoid && avoid.indexOf(t) >= 0 && tries < 20);
    return { id: s.nextId++, t: t, lock: 0 };
  }

  E.newState = function (levelIdx, up, seed) {
    var L = D.LEVELS[levelIdx];
    up = up || {};
    var s = {
      level: levelIdx, seed: (seed == null ? (levelIdx + 1) * 7919 : seed) | 0, nextId: 1,
      colors: L.colors, moves: L.moves + (up.harbour || 0), movesMax: L.moves + (up.harbour || 0),
      grid: [], lanes: [], troops: [], status: 'play', turn: 0, charge: 0,
      up: { shieldcrab: up.shieldcrab || 1, lobster: up.lobster || 1, eel: up.eel || 1, spinner: up.spinner || 1, puffer: up.puffer || 1, shrine: up.shrine || 0 },
      loot: 0, stats: { troops: 0, cleared: 0, dmg: 0, bombs: 0, riptides: 0, brutes: 0, best: 0 }
    };
    for (var c = 0; c < COLS; c++) {
      s.lanes.push(parseLane(L.lanes[c], L.hpx).map(function (b) { b.id = s.nextId++; return b; }));
    }
    for (var r = 0; r < ROWS; r++) {
      s.grid.push([]);
      for (c = 0; c < COLS; c++) {
        var avoid = [];
        if (c >= 2 && s.grid[r][c - 1].t === s.grid[r][c - 2].t) avoid.push(s.grid[r][c - 1].t);
        if (r >= 2 && s.grid[r - 1][c].t === s.grid[r - 2][c].t) avoid.push(s.grid[r - 1][c].t);
        s.grid[r].push(newTile(s, avoid));
      }
    }
    if (!E.findMove(s)) E.shuffle(s);
    return s;
  };

  E.flagLane = function (s) {
    for (var c = 0; c < COLS; c++) for (var i = 0; i < s.lanes[c].length; i++) if (s.lanes[c][i].k === 'flag') return c;
    return -1;
  };
  E.flag = function (s) { var c = E.flagLane(s); if (c < 0) return null; return s.lanes[c].filter(function (b) { return b.k === 'flag'; })[0]; };

  // ---------- matching ----------
  function normal(x) { return x && x.t >= 0; }
  E.findGroups = function (s) {
    var g = s.grid, runs = [], r, c, k;
    for (r = 0; r < ROWS; r++) {
      c = 0;
      while (c < COLS) {
        k = c + 1;
        if (normal(g[r][c])) { while (k < COLS && normal(g[r][k]) && g[r][k].t === g[r][c].t) k++; if (k - c >= 3) { var cells = []; for (var x = c; x < k; x++) cells.push([r, x]); runs.push({ h: true, cells: cells, t: g[r][c].t }); } }
        c = k;
      }
    }
    for (c = 0; c < COLS; c++) {
      r = 0;
      while (r < ROWS) {
        k = r + 1;
        if (normal(g[r][c])) { while (k < ROWS && normal(g[k][c]) && g[k][c].t === g[r][c].t) k++; if (k - r >= 3) { var cl = []; for (var y = r; y < k; y++) cl.push([y, c]); runs.push({ h: false, cells: cl, t: g[r][c].t }); } }
        r = k;
      }
    }
    // merge runs that share a cell
    var parent = runs.map(function (_, i) { return i; });
    function find(i) { while (parent[i] !== i) i = parent[i] = parent[parent[i]]; return i; }
    var owner = {};
    runs.forEach(function (run, i) {
      run.cells.forEach(function (p) { var key = p[0] * 10 + p[1]; if (owner[key] != null) parent[find(i)] = find(owner[key]); else owner[key] = i; });
    });
    var groups = {};
    runs.forEach(function (run, i) {
      var root_ = find(i);
      var G = groups[root_] || (groups[root_] = { t: run.t, cells: [], keys: {}, h: false, v: false, maxRun: 0, cross: null, runs: [] });
      G.runs.push(run);
      if (run.h) G.h = true; else G.v = true;
      G.maxRun = Math.max(G.maxRun, run.cells.length);
      run.cells.forEach(function (p) { var key = p[0] * 10 + p[1]; if (!G.keys[key]) { G.keys[key] = 1; G.cells.push(p); } });
    });
    var out = Object.keys(groups).map(function (k2) { return groups[k2]; });
    out.forEach(function (G) {
      if (G.h && G.v) {
        G.runs.forEach(function (a) { if (!a.h) return; G.runs.forEach(function (b) { if (b.h) return; a.cells.forEach(function (p) { b.cells.forEach(function (q) { if (p[0] === q[0] && p[1] === q[1]) G.cross = p; }); }); }); });
      }
      delete G.keys; delete G.runs;
    });
    return out;
  };

  function adjacent(a, b) { return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1; }
  E.swappable = function (s, p) { var x = s.grid[p[0]] && s.grid[p[0]][p[1]]; return !!(x && x.t >= 0 && !x.lock); };
  E.swap = function (s, a, b) { var t = s.grid[a[0]][a[1]]; s.grid[a[0]][a[1]] = s.grid[b[0]][b[1]]; s.grid[b[0]][b[1]] = t; };
  // Would swapping a and b make a match? (does not change state)
  E.validSwap = function (s, a, b) {
    if (!adjacent(a, b) || !E.swappable(s, a) || !E.swappable(s, b)) return false;
    E.swap(s, a, b);
    var ok = lineAt(s, a) || lineAt(s, b);
    E.swap(s, a, b);
    return ok;
  };
  function lineAt(s, p) {
    var g = s.grid, t = g[p[0]][p[1]].t, r = p[0], c = p[1], n, i;
    n = 1; for (i = c - 1; i >= 0 && normal(g[r][i]) && g[r][i].t === t; i--) n++; for (i = c + 1; i < COLS && normal(g[r][i]) && g[r][i].t === t; i++) n++;
    if (n >= 3) return true;
    n = 1; for (i = r - 1; i >= 0 && normal(g[i][c]) && g[i][c].t === t; i--) n++; for (i = r + 1; i < ROWS && normal(g[i][c]) && g[i][c].t === t; i++) n++;
    return n >= 3;
  }
  E.allMoves = function (s) {
    var out = [];
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      if (c + 1 < COLS && E.validSwap(s, [r, c], [r, c + 1])) out.push([[r, c], [r, c + 1]]);
      if (r + 1 < ROWS && E.validSwap(s, [r, c], [r + 1, c])) out.push([[r, c], [r + 1, c]]);
    }
    return out;
  };
  E.findMove = function (s) { var m = E.allMoves(s); return m.length ? m[0] : null; };

  E.shuffle = function (s) {
    var cells = [];
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) if (s.grid[r][c] && s.grid[r][c].t >= 0) cells.push(s.grid[r][c]);
    for (var tries = 0; tries < 200; tries++) {
      cells.forEach(function (x) { x.t = ri(s, s.colors); });
      if (!E.findGroups(s).length && E.findMove(s)) return true;
    }
    // last resort: wash away all sand and try again
    for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) { var x = s.grid[r][c]; if (x.t < 0) s.grid[r][c] = newTile(s); x.lock = 0; }
    for (tries = 0; tries < 200; tries++) {
      for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) s.grid[r][c].t = ri(s, s.colors);
      if (!E.findGroups(s).length && E.findMove(s)) return true;
    }
    return false;
  };

  // ---------- troops and damage ----------
  function mult(lvl) { return 1 + 0.2 * ((lvl || 1) - 1); }
  E.makeTroop = function (s, type, lane, brute) {
    var def = D.TROOPS[type], m = mult(s.up[type]) * (brute ? 2 : 1);
    var hp = Math.round(def.hp * m * 10) / 10;
    var tr = { id: s.nextId++, k: type, lane: lane, pos: 0, hp: hp, max: hp, dmg: def.dmg * m, brute: !!brute, st: def.st || E.STAMINA };
    s.troops.push(tr); s.stats.troops++; if (brute) s.stats.brutes++;
    return tr;
  };
  E.STAMINA = +(typeof process !== 'undefined' && process.env && process.env.ST || 3);
  function hit(s, lane, idx, dmg, ev, src) {
    var b = s.lanes[lane][idx];
    if (!b || dmg <= 0) return;
    b.hp = Math.max(0, Math.round((b.hp - dmg) * 100) / 100);
    s.stats.dmg += dmg;
    var e = { type: 'hit', lane: lane, id: b.id, k: b.k, dmg: dmg, src: src, killed: b.hp <= 0 };
    ev.push(e);
    if (b.hp <= 0) {
      s.lanes[lane].splice(idx, 1);
      if (b.k === 'chest') { s.loot += D.BUILD.T.loot; e.loot = D.BUILD.T.loot; }
      if (b.k === 'flag') s.status = 'won';
    }
  }
  E.spellPower = function (s) { return 1 + 0.25 * (s.up.shrine || 0); };
  function bomb(s, col, ev) {
    var p = 4 * E.spellPower(s);
    ev.push({ type: 'spell', k: 'bomb', col: col });
    s.stats.bombs++;
    for (var c = col - 1; c <= col + 1; c++) if (c >= 0 && c < COLS && s.lanes[c].length) hit(s, c, 0, p, ev, 'bomb');
  }
  function riptide(s, ev) {
    var p = 2 * E.spellPower(s), washed = [];
    ev.push({ type: 'spell', k: 'riptide' });
    s.stats.riptides++;
    for (var c = 0; c < COLS; c++) if (s.lanes[c].length) hit(s, c, 0, p, ev, 'riptide');
    for (var r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) { var x = s.grid[r][c]; if (x && x.t < 0) { washed.push({ r: r, c: c, id: x.id }); s.grid[r][c] = null; } else if (x && x.lock) x.lock = 0; }
    ev.push({ type: 'wash', cells: washed });
  }

  // Clear every match on the board once. Returns null when there is nothing to clear.
  E.resolveStep = function (s, hint, combo) {
    var groups = E.findGroups(s);
    if (!groups.length) return null;
    var ev = { cleared: [], unlocked: [], sand: [], deploy: [], events: [], groups: groups.length };
    var kill = {};
    groups.forEach(function (G) {
      var lane;
      if (G.cross) lane = G.cross[1];
      else if (!G.h) lane = G.cells[0][1];
      else {
        var inHint = hint && G.cells.some(function (p) { return p[0] === hint[0] && p[1] === hint[1]; });
        if (inHint) lane = hint[1];
        else { var cs = G.cells.map(function (p) { return p[1]; }).sort(function (a, b) { return a - b; }); lane = cs[Math.floor(cs.length / 2)]; }
      }
      var brute = G.maxRun >= 4 || G.cells.length >= 6;
      var tr = E.makeTroop(s, D.TILES[G.t].troop, lane, brute);
      var rowTop = Math.min.apply(null, G.cells.filter(function (p) { return p[1] === lane; }).map(function (p) { return p[0]; }).concat([ROWS]));
      ev.deploy.push({ troop: tr, fromRow: rowTop === ROWS ? 0 : rowTop, t: G.t, size: G.cells.length, combo: combo || 0 });
      G.cells.forEach(function (p) { kill[p[0] * 10 + p[1]] = p; });
      if (G.cross) bomb(s, G.cross[1], ev.events);
      if (G.maxRun >= 5) riptide(s, ev.events);
    });
    Object.keys(kill).forEach(function (key) {
      var p = kill[key], x = s.grid[p[0]][p[1]];
      if (!x) return;
      if (x.lock) { x.lock = 0; ev.unlocked.push({ r: p[0], c: p[1], id: x.id }); return; }
      ev.cleared.push({ r: p[0], c: p[1], t: x.t, id: x.id });
      s.grid[p[0]][p[1]] = null;
      s.stats.cleared++;
    });
    // sand next to a cleared cell crumbles
    ev.cleared.forEach(function (q) {
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
        var r = q.r + d[0], c = q.c + d[1];
        if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return;
        var x = s.grid[r][c];
        if (x && x.t < 0) { ev.sand.push({ r: r, c: c, id: x.id }); s.grid[r][c] = null; }
      });
    });
    return ev;
  };

  E.gravity = function (s) {
    var falls = [], spawns = [];
    for (var c = 0; c < COLS; c++) {
      var w = ROWS - 1;
      for (var r = ROWS - 1; r >= 0; r--) {
        var x = s.grid[r][c];
        if (x) { if (w !== r) { s.grid[w][c] = x; s.grid[r][c] = null; falls.push({ id: x.id, c: c, from: r, to: w }); } w--; }
      }
      var n = w + 1;
      for (var k = w; k >= 0; k--) { var t = newTile(s); s.grid[k][c] = t; spawns.push({ id: t.id, c: c, r: k, from: k - n }); }
    }
    return { falls: falls, spawns: spawns };
  };

  // ---------- enemy turn ----------
  function frontTarget(s, tr) {
    var lane = s.lanes[tr.lane];
    if (!lane.length) return -1;
    if (D.TROOPS[tr.k].sneak) { for (var i = 0; i < lane.length; i++) if (lane[i].k !== 'wall') return i; }
    return 0;
  }
  E.dropSand = function (s, col) {
    for (var r = 0; r < ROWS; r++) {
      var x = s.grid[r][col];
      if (x && x.t >= 0) { var sand = { id: s.nextId++, t: -1, lock: 0 }; s.grid[r][col] = sand; return { r: r, c: col, id: sand.id, old: x.id }; }
    }
    return null;
  };
  E.lockTiles = function (s, col, n) {
    var cand = [];
    for (var r = 0; r < ROWS; r++) { var x = s.grid[r][col]; if (x && x.t >= 0 && !x.lock) cand.push(r); }
    var out = [];
    while (n-- > 0 && cand.length) { var i = ri(s, cand.length); var r2 = cand.splice(i, 1)[0]; s.grid[r2][col].lock = 1; out.push({ r: r2, c: col, id: s.grid[r2][col].id }); }
    return out;
  };

  E.enemyTurn = function (s) {
    var ev = [], fl = E.flagLane(s);
    s.turn++;
    // 1. troops advance / attack
    s.troops.slice().forEach(function (tr) {
      if (tr.hp <= 0 || s.status === 'won') return;
      var def = D.TROOPS[tr.k];
      if (!s.lanes[tr.lane].length) {
        var dir = fl > tr.lane ? 1 : -1;
        if (fl < 0) return;
        tr.lane += dir; ev.push({ type: 'scuttle', id: tr.id, lane: tr.lane });
        if (tr.pos < FRONT) tr.pos = Math.min(FRONT, tr.pos + 1);
        return;
      }
      if (tr.pos + def.spd < FRONT + 1 && tr.pos < FRONT) {
        tr.pos = Math.min(FRONT, tr.pos + def.spd);
        ev.push({ type: 'move', id: tr.id, pos: tr.pos });
        if (tr.pos < FRONT) return;
      } else if (tr.pos < FRONT) { tr.pos = FRONT; ev.push({ type: 'move', id: tr.id, pos: tr.pos }); }
      var idx = frontTarget(s, tr);
      if (idx < 0) return;
      var b = s.lanes[tr.lane][idx];
      var dmg = tr.dmg * (def.wallx && b.k === 'wall' ? def.wallx : 1);
      ev.push({ type: 'attack', id: tr.id, lane: tr.lane, target: b.id, k: tr.k });
      hit(s, tr.lane, idx, dmg, ev, tr.k);
      if (def.splash) { [tr.lane - 1, tr.lane + 1].forEach(function (c) { if (c >= 0 && c < COLS && s.lanes[c].length) hit(s, c, 0, tr.dmg, ev, 'splash'); }); }
      if (def.boom) { tr.hp = 0; ev.push({ type: 'pop', id: tr.id, lane: tr.lane }); }
      else if (--tr.st <= 0) { tr.hp = 0; ev.push({ type: 'home', id: tr.id, lane: tr.lane }); }
    });
    if (s.status === 'won') { cleanup(s); return ev; }
    // 2. enemy buildings fire
    for (var c = 0; c < COLS; c++) {
      s.lanes[c].slice().forEach(function (b) {
        if (!b.cd || b.hp <= 0) return;
        b.t--;
        if (b.t > 0) return;
        b.t = b.cd;
        var def = D.BUILD[b.code];
        if (b.k === 'gull') {
          var other = ri(s, COLS - 1); if (other >= c) other++;
          var drops = [E.dropSand(s, c), E.dropSand(s, other)].filter(Boolean);
          ev.push({ type: 'gull', lane: c, from: b.id, drops: drops });
          return;
        }
        var targets = s.troops.filter(function (t) { return t.hp > 0 && Math.abs(t.lane - c) <= def.range; });
        if (targets.length) {
          if (b.k === 'cannon' || b.k === 'flag') {
            targets.sort(function (x, y) { return (D.TROOPS[y.k].taunt ? 1 : 0) - (D.TROOPS[x.k].taunt ? 1 : 0) || y.pos - x.pos || Math.abs(x.lane - c) - Math.abs(y.lane - c) || x.id - y.id; });
            var t0 = targets[0];
            t0.hp = Math.max(0, t0.hp - def.dmg);
            ev.push({ type: 'shoot', k: b.k, lane: c, from: b.id, to: t0.id, dmg: def.dmg, killed: t0.hp <= 0 });
          } else {
            var hitIds = targets.map(function (t) { t.hp = Math.max(0, t.hp - def.dmg); return t.id; });
            ev.push({ type: 'shoot', k: 'cat', lane: c, from: b.id, to: hitIds[0], all: hitIds, dmg: def.dmg });
          }
        } else if (b.k === 'cannon' || b.k === 'flag') {
          var d = E.dropSand(s, c);
          ev.push({ type: 'lob', lane: c, from: b.id, drops: d ? [d] : [] });
        } else {
          ev.push({ type: 'glue', lane: c, from: b.id, locks: E.lockTiles(s, c, 2) });
        }
      });
    }
    cleanup(s);
    return ev;
  };
  function cleanup(s) { s.troops = s.troops.filter(function (t) { return t.hp > 0; }); }

  E.afterMove = function (s) {
    if (s.status !== 'play') return;
    if (!E.findMove(s)) E.shuffle(s);
  };
  // Called once moves hit 0: troops get a few last turns to finish the job.
  E.FINAL_TICKS = 3;
  E.stars = function (s) {
    if (s.status !== 'won') return 0;
    if (s.charge > 0) return 1;
    var f = s.moves / s.movesMax;
    return f >= 0.3 ? 3 : f >= 0.1 ? 2 : 1;
  };

  // Full synchronous move (tests, bot, quick replays). Returns a summary or null if the swap is not valid.
  E.playMove = function (s, a, b) {
    if (s.status !== 'play' || s.moves <= 0 || !E.validSwap(s, a, b)) return null;
    E.swap(s, a, b);
    s.moves--;
    var combo = 0, hint = b, out = { steps: [], enemy: [] };
    for (;;) {
      var st = E.resolveStep(s, hint, combo);
      if (!st) break;
      out.steps.push(st);
      E.gravity(s);
      hint = null; combo++;
      if (combo > 40) break;
    }
    s.stats.best = Math.max(s.stats.best, combo);
    if (s.status === 'play') out.enemy.push(E.enemyTurn(s));
    while (s.status === 'play' && s.moves <= 0 && s.charge < E.FINAL_TICKS) { s.charge++; out.enemy.push(E.enemyTurn(s)); }
    if (s.status === 'play' && s.moves <= 0) s.status = 'lost';
    E.afterMove(s);
    return out;
  };

  E.clone = function (s) { return JSON.parse(JSON.stringify(s)); };

  // A simple lane-aware greedy player (for tests and the demo autoplay).
  E.botMove = function (s, mode) {
    var moves = E.allMoves(s);
    if (!moves.length) return null;
    if (mode === 'random') return moves[ri({ seed: s.seed + s.turn * 31 }, moves.length)];
    var best = null, bestScore = -1e9;
    moves.forEach(function (m) {
      var c = E.clone(s), f0 = E.flag(c), fhp0 = f0 ? f0.hp : 0, tot0 = totalHp(c);
      var res = E.playMove(c, m[0], m[1]);
      if (!res) return;
      var f1 = E.flag(c);
      var score = (c.status === 'won' ? 1000 : 0) + (fhp0 - (f1 ? f1.hp : 0)) * 6 + (tot0 - totalHp(c)) * 2;
      var fl = E.flagLane(c);
      c.troops.forEach(function (t) { score += (t.hp + t.dmg * 2) * (1 - 0.12 * Math.abs(t.lane - fl)); });
      var sand = 0; c.grid.forEach(function (row) { row.forEach(function (x) { if (x.t < 0 || x.lock) sand++; }); });
      score -= sand * 0.5;
      if (score > bestScore) { bestScore = score; best = m; }
    });
    return best;
  };
  function totalHp(s) { var t = 0; s.lanes.forEach(function (l) { l.forEach(function (b) { t += b.hp; }); }); return t; }

  root.CCEngine = E;
  if (typeof module !== 'undefined') module.exports = E;
})(typeof window !== 'undefined' ? window : globalThis);
