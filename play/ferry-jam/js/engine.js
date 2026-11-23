/* Ferry Jam rules engine + BFS solver + seeded generator. Browser + Node. */
(function (root, factory) {
  var Engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = Engine;
  else root.Engine = Engine;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DIR = {
    N: { dr: -1, dc: 0, backR:  1, backC:  0 },
    E: { dr:  0, dc: 1, backR:  0, backC: -1 },
    S: { dr:  1, dc: 0, backR: -1, backC:  0 },
    W: { dr:  0, dc: -1, backR:  0, backC:  1 }
  };
  var COLOR_LIST = ['red', 'blue', 'yellow', 'green', 'orange'];

  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  function cellsOf(car) {
    var d = DIR[car.dir];
    var out = [{ r: car.r, c: car.c }];
    for (var i = 1; i < car.len; i++) {
      out.push({ r: car.r + d.backR * i, c: car.c + d.backC * i });
    }
    return out;
  }

  function inBounds(level, r, c) {
    return r >= 0 && c >= 0 && r < level.rows && c < level.cols;
  }

  function activeBarriers(level, state) {
    var open = (state && state.openGates) || [];
    return (level.barriers || []).filter(function (b) { return open.indexOf(b.id) === -1; });
  }

  function occupancy(level, stateOrCars) {
    var cars, barriers;
    if (stateOrCars && stateOrCars.cars) {
      cars = stateOrCars.cars;
      barriers = activeBarriers(level, stateOrCars);
    } else {
      cars = stateOrCars || [];
      barriers = level.barriers || [];
    }
    var grid = {};
    function mark(r, c, val) { grid[r + ',' + c] = val; }
    (level.obstacles || []).forEach(function (o) { mark(o.r, o.c, '#'); });
    barriers.forEach(function (b) { mark(b.r, b.c, 'gate:' + b.id); });
    cars.forEach(function (car) {
      cellsOf(car).forEach(function (p) { mark(p.r, p.c, car.id); });
    });
    return grid;
  }

  function isLocked(car, state) {
    if (!car.locked) return false;
    return ((state && state.keysCollected) || []).indexOf(car.locked) === -1;
  }

  function canExit(level, car, grid, state) {
    if (state && isLocked(car, state)) return false;
    var d = DIR[car.dir];
    var r = car.r, c = car.c;
    for (;;) {
      r += d.dr; c += d.dc;
      if (!inBounds(level, r, c)) return true;
      if (grid[r + ',' + c]) return false;
    }
  }

  function exitEdge(car) {
    var d = DIR[car.dir];
    if (d.dr < 0) return 'N';
    if (d.dr > 0) return 'S';
    if (d.dc < 0) return 'W';
    return 'E';
  }

  function validateLevel(level) {
    var seen = {}, grid = {}, issues = [];
    (level.obstacles || []).forEach(function (o) {
      if (!inBounds(level, o.r, o.c)) issues.push('obstacle out of bounds');
      grid[o.r + ',' + o.c] = '#';
    });
    (level.barriers || []).forEach(function (b) {
      if (!inBounds(level, b.r, b.c)) issues.push('barrier out of bounds');
      var k = b.r + ',' + b.c;
      if (grid[k]) issues.push('barrier overlaps ' + grid[k]);
      grid[k] = 'gate:' + b.id;
    });
    (level.cars || []).forEach(function (car) {
      if (seen[car.id]) issues.push('duplicate id ' + car.id);
      seen[car.id] = true;
      if (!DIR[car.dir]) issues.push(car.id + ' bad dir');
      cellsOf(car).forEach(function (p) {
        if (!inBounds(level, p.r, p.c)) issues.push(car.id + ' out of bounds');
        var k = p.r + ',' + p.c;
        if (grid[k]) issues.push(car.id + ' overlaps ' + grid[k] + ' at ' + k);
        grid[k] = car.id;
      });
    });
    if (!level.ferries || !level.ferries.length) issues.push('no ferries');
    return issues;
  }

  function mkFerry(f, i) {
    var t = f.timeLimit || 0;
    return {
      color: f.color, capacity: f.capacity, loaded: 0, id: 'f' + i, cargo: [],
      maxLen: f.maxLen || 0, timeLimit: t, timeLeft: t || null,
      special: f.special || (f.maxLen ? 'small' : (t ? 'timed' : null))
    };
  }

  function init(level) {
    var ferries = (level.ferries || []).map(mkFerry);
    var berths = level.berths || 1;
    return {
      levelId: level.id, rows: level.rows, cols: level.cols, berths: berths,
      holdSlots: level.holdSlots || 0, extraSlots: 0,
      cars: clone(level.cars),
      docked: ferries.slice(0, berths),
      queue: ferries.slice(berths),
      hold: [], sailed: [],
      keysCollected: [], openGates: [],
      status: 'playing', moves: 0,
      usedHint: false, usedExtraSlot: false, usedUndo: false,
      ferriesFilled: 0, combo: 0, maxCombo: 0, last: null
    };
  }

  function holdCap(state) { return state.holdSlots + (state.extraSlots || 0); }

  function ferryAccepts(f, car) {
    if (f.color !== car.color) return false;
    if (f.loaded >= f.capacity) return false;
    if (f.maxLen && (car.len || 1) > f.maxLen) return false;
    return true;
  }

  function findFerry(state, carOrColor) {
    var car = typeof carOrColor === 'string' ? { color: carOrColor, len: 1 } : carOrColor;
    for (var i = 0; i < state.docked.length; i++) {
      if (ferryAccepts(state.docked[i], car)) return i;
    }
    return -1;
  }

  function willAcceptLater(state, car) {
    var list = state.docked.concat(state.queue);
    for (var i = 0; i < list.length; i++) {
      var f = list[i];
      var used = f.loaded || 0;
      if (f.color === car.color && used < f.capacity && (!f.maxLen || (car.len || 1) <= f.maxLen)) return true;
    }
    return false;
  }

  function sail(state, index) {
    var f = state.docked[index];
    if (f.loaded >= f.capacity) state.ferriesFilled = (state.ferriesFilled || 0) + 1;
    state.docked.splice(index, 1);
    state.sailed.push({
      color: f.color, capacity: f.capacity, id: f.id, cargo: f.cargo || [],
      maxLen: f.maxLen, timeLimit: f.timeLimit, special: f.special
    });
    if (state.queue.length) {
      var nxt = state.queue.shift();
      if (nxt.timeLimit) nxt.timeLeft = nxt.timeLimit;
      state.docked.push(nxt);
    }
  }

  function drainHold(state) {
    var changed = true;
    while (changed && state.status === 'playing') {
      changed = false;
      for (var i = 0; i < state.hold.length; i++) {
        var idx = findFerry(state, state.hold[i]);
        if (idx === -1) continue;
        var car = state.hold.splice(i, 1)[0];
        var f = state.docked[idx];
        f.cargo = f.cargo || [];
        f.cargo.push({ id: car.id, color: car.color, len: car.len });
        f.loaded += 1;
        state.last = { type: 'hold-board', car: car, ferryId: f.id };
        if (f.loaded >= f.capacity) sail(state, idx);
        changed = true;
        break;
      }
    }
  }

  function tickTimers(state) {
    for (var i = state.docked.length - 1; i >= 0; i--) {
      var f = state.docked[i];
      if (!f.timeLimit) continue;
      if (f.timeLeft == null) f.timeLeft = f.timeLimit;
      f.timeLeft -= 1;
      if (f.timeLeft <= 0) sail(state, i);
    }
  }

  function board(state, car) {
    var idx = findFerry(state, car);
    if (idx !== -1) {
      var f = state.docked[idx];
      f.cargo = f.cargo || [];
      f.cargo.push({ id: car.id, color: car.color, len: car.len });
      f.loaded += 1;
      state.combo = (state.combo || 0) + 1;
      if (state.combo > (state.maxCombo || 0)) state.maxCombo = state.combo;
      var sailed = f.loaded >= f.capacity;
      var fid = f.id;
      if (sailed) sail(state, idx);
      drainHold(state);
      return { ok: true, how: 'ferry', sailed: sailed, ferryColor: car.color, ferryId: fid, combo: state.combo };
    }
    state.combo = 0;
    if (state.hold.length < holdCap(state)) {
      state.hold.push({ id: car.id, color: car.color, len: car.len, locked: car.locked, opens: car.opens, isKey: car.isKey, unlocks: car.unlocks });
      return { ok: true, how: 'hold' };
    }
    state.status = 'lost';
    return { ok: false, how: 'jammed' };
  }

  function collectOnExit(state, car) {
    if (car.isKey && car.unlocks && state.keysCollected.indexOf(car.unlocks) === -1) {
      state.keysCollected.push(car.unlocks);
    }
    if (car.opens) {
      var ids = Array.isArray(car.opens) ? car.opens : [car.opens];
      ids.forEach(function (id) {
        if (state.openGates.indexOf(id) === -1) state.openGates.push(id);
      });
    }
  }

  function checkEnd(state, level) {
    if (state.status !== 'playing') return;
    if (state.cars.length === 0 && state.hold.length === 0) { state.status = 'won'; return; }
    if (state.cars.length === 0 && state.hold.length > 0) {
      drainHold(state);
      if (state.hold.length === 0) { state.status = 'won'; return; }
      var canLater = state.hold.some(function (h) {
        return willAcceptLater(state, h) || findFerry(state, h) !== -1;
      });
      if (!canLater) state.status = 'lost';
      return;
    }
    var grid = occupancy(level, state);
    if (!state.cars.some(function (c) { return canExit(level, c, grid, state); })) state.status = 'lost';
  }

  function legalMoves(level, state) {
    if (state.status !== 'playing') return [];
    var grid = occupancy(level, state);
    return state.cars.filter(function (c) { return canExit(level, c, grid, state); }).map(function (c) { return c.id; });
  }

  function apply(level, state, carId) {
    var next = clone(state);
    if (next.status !== 'playing') return { state: next, result: { ok: false, how: 'ended' } };
    var idx = -1, i;
    for (i = 0; i < next.cars.length; i++) if (next.cars[i].id === carId) { idx = i; break; }
    if (idx === -1) return { state: next, result: { ok: false, how: 'missing' } };
    var car = next.cars[idx];
    var grid = occupancy(level, next);
    if (isLocked(car, next)) return { state: next, result: { ok: false, how: 'locked' } };
    if (!canExit(level, car, grid, next)) return { state: next, result: { ok: false, how: 'blocked' } };
    next.cars.splice(idx, 1);
    next.moves += 1;
    collectOnExit(next, car);
    var result = board(next, car);
    result.car = { id: car.id, color: car.color, len: car.len, r: car.r, c: car.c, dir: car.dir, isKey: !!car.isKey, unlocks: car.unlocks, opens: car.opens, locked: car.locked };
    result.edge = exitEdge(car);
    tickTimers(next);
    drainHold(next);
    if (next.status === 'playing') checkEnd(next, level);
    return { state: next, result: result };
  }

  function addExtraSlot(state) {
    var next = clone(state);
    next.extraSlots = (next.extraSlots || 0) + 1;
    next.usedExtraSlot = true;
    return next;
  }

  function hash(state) {
    var cars = state.cars.map(function (c) { return c.id; }).sort().join(',');
    var dock = state.docked.map(function (f) { return f.id + ':' + f.loaded + ':' + (f.timeLeft == null ? '' : f.timeLeft); }).join(',');
    var q = state.queue.map(function (f) { return f.id; }).join(',');
    var h = state.hold.map(function (c) { return c.id; }).join(',');
    var k = (state.keysCollected || []).slice().sort().join(',');
    var g = (state.openGates || []).slice().sort().join(',');
    return cars + '|' + dock + '|' + q + '|' + h + '|' + k + '|' + g + '|' + state.status + '|' + (state.extraSlots || 0);
  }

  function solve(level, start) {
    var origin = start ? clone(start) : init(level);
    if (origin.status === 'won') return { ok: true, moves: [], length: 0 };
    if (origin.status === 'lost') return { ok: false, reason: 'already-lost' };
    var q = [{ state: origin, path: [] }];
    var seen = {};
    seen[hash(origin)] = true;
    var guard = 0, cap = 40000;
    while (q.length && guard++ < cap) {
      var cur = q.shift();
      var ids = legalMoves(level, cur.state);
      for (var i = 0; i < ids.length; i++) {
        var step = apply(level, cur.state, ids[i]);
        if (!step.result.ok && step.state.status !== 'lost' && step.state.status !== 'won') continue;
        var ns = step.state;
        var path = cur.path.concat([ids[i]]);
        if (ns.status === 'won') return { ok: true, moves: path, length: path.length };
        if (ns.status === 'lost') continue;
        var h = hash(ns);
        if (seen[h]) continue;
        seen[h] = true;
        q.push({ state: ns, path: path });
      }
    }
    return { ok: false, reason: guard >= cap ? 'cap' : 'unsolvable', visited: Object.keys(seen).length };
  }

  function hint(level, state) {
    var res = solve(level, state);
    if (!res.ok || !res.moves.length) return null;
    return res.moves[0];
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hashSeed(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function generateLevel(seed, opts) {
    opts = opts || {};
    var rng = mulberry32(typeof seed === 'number' ? seed : hashSeed(String(seed)));
    var difficulty = opts.difficulty || 1;
    var rows = opts.rows || (difficulty < 2 ? 5 : difficulty < 4 ? 6 : 7);
    var cols = opts.cols || (difficulty < 2 ? 5 : 6);
    var nColors = Math.min(COLOR_LIST.length, opts.colors || (2 + Math.min(3, difficulty)));
    var holdSlots = opts.holdSlots != null ? opts.holdSlots : 1;
    var berths = opts.berths != null ? opts.berths : (difficulty >= 3 ? 2 : 1);
    var wantKey = !!opts.withKey || (difficulty >= 3 && rng() > 0.55);
    var wantSmall = !!opts.withSmall || (difficulty >= 3 && rng() > 0.6);
    var wantTimed = !!opts.withTimed || (difficulty >= 4 && rng() > 0.65);
    var wantGate = !!opts.withGate || (difficulty >= 3 && rng() > 0.7);

    function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }
    function shuffle(a) {
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    }

    var maxTries = opts.tries || 80;
    for (var attempt = 0; attempt < maxTries; attempt++) {
      var grid = {}, cars = [], obstacles = [], barriers = [];
      function free(r, c) { return inBounds({ rows: rows, cols: cols }, r, c) && !grid[r + ',' + c]; }
      function occupy(car) { cellsOf(car).forEach(function (p) { grid[p.r + ',' + p.c] = car.id; }); }

      var nCars = opts.nCars || (3 + Math.min(5, difficulty + Math.floor(rng() * 2)));
      var pal = COLOR_LIST.slice(0, nColors);
      var dirs = ['E', 'S', 'W', 'N'];
      var idn = 0, placed = 0, guard = 0;
      while (placed < nCars && guard++ < 200) {
        var dir = pick(dirs);
        var len = (rng() > 0.72 && difficulty > 0) ? 2 : 1;
        var r = Math.floor(rng() * rows), c = Math.floor(rng() * cols);
        var car = { id: 'c' + (idn++), color: pick(pal), len: len, r: r, c: c, dir: dir };
        var ok = true;
        cellsOf(car).forEach(function (p) { if (!free(p.r, p.c)) ok = false; });
        if (!ok) continue;
        occupy(car); cars.push(car); placed++;
      }
      if (cars.length < 3) continue;

      if (wantKey && cars.length >= 3 && cars[0].id !== cars[cars.length - 1].id) {
        cars[0].isKey = true; cars[0].unlocks = 'L1';
        cars[cars.length - 1].locked = 'L1';
      }
      if (wantGate && cars.length >= 2) {
        var victim = cars[cars.length - 1], d = DIR[victim.dir];
        var br = victim.r + d.dr, bc = victim.c + d.dc;
        if (free(br, bc)) {
          barriers.push({ id: 'G1', r: br, c: bc });
          grid[br + ',' + bc] = 'gate:G1';
          cars[0].opens = 'G1';
        }
      }
      if (rng() > 0.4 && free(0, 0)) { obstacles.push({ r: 0, c: 0 }); grid['0,0'] = '#'; }
      if (rng() > 0.5 && free(0, cols - 1)) { obstacles.push({ r: 0, c: cols - 1 }); grid['0,' + (cols - 1)] = '#'; }

      var counts = {};
      cars.forEach(function (c) { counts[c.color] = (counts[c.color] || 0) + 1; });
      var ferries = [];
      pal.forEach(function (col) {
        var left = counts[col] || 0;
        while (left > 0) {
          var cap = left === 1 ? 1 : (rng() > 0.5 && left >= 2 ? 2 : 1);
          if (cap > left) cap = left;
          ferries.push({ color: col, capacity: cap });
          left -= cap;
        }
      });
      shuffle(ferries);
      if (wantSmall) {
        var bus = cars.filter(function (c) { return (c.len || 1) >= 2; })[0];
        if (bus) {
          ferries.forEach(function (f) {
            if (f.color !== bus.color && f.capacity === 1 && !f.maxLen) f.maxLen = 1;
          });
        }
      }
      if (wantTimed && ferries.length > 1) {
        ferries[Math.min(1, ferries.length - 1)].timeLimit = 4 + Math.floor(rng() * 3);
      }

      var level = {
        id: opts.id || 0, name: opts.name || 'Harbor',
        rows: rows, cols: cols, berths: berths, holdSlots: holdSlots,
        cars: cars, obstacles: obstacles, barriers: barriers, ferries: ferries,
        blurb: opts.blurb || '', chapter: opts.chapter || 1, parMoves: 0,
        generated: true, seed: String(seed)
      };
      if (validateLevel(level).length) continue;
      var solved = solve(level);
      if (!solved.ok) continue;
      level.parMoves = solved.length;
      if (solved.length < 3 && difficulty > 0) continue;
      if (solved.length > 16) continue;
      return level;
    }
    return null;
  }

  function dailySeed(dateStr) { return 'ferryjam-daily-' + dateStr; }

  function generateDaily(dateStr, difficulty) {
    var seed = dailySeed(dateStr);
    var d = difficulty != null ? difficulty : 2;
    var level = generateLevel(seed, {
      id: 'daily', name: 'Daily Harbor', difficulty: d, withKey: d >= 3, tries: 120,
      blurb: "Today's puzzle. Same for everyone.", chapter: 0
    });
    if (!level) {
      level = generateLevel(seed + '-easy', {
        id: 'daily', name: 'Daily Harbor', difficulty: 1, tries: 160, chapter: 0,
        blurb: "Today's puzzle. Same for everyone."
      });
    }
    return level;
  }

  return {
    DIR: DIR, COLOR_LIST: COLOR_LIST,
    cellsOf: cellsOf, occupancy: occupancy, canExit: canExit, exitEdge: exitEdge,
    isLocked: isLocked, activeBarriers: activeBarriers, validateLevel: validateLevel, init: init, holdCap: holdCap,
    findFerry: findFerry, ferryAccepts: ferryAccepts, legalMoves: legalMoves,
    apply: apply, addExtraSlot: addExtraSlot, solve: solve, hint: hint,
    hash: hash, clone: clone, mulberry32: mulberry32, hashSeed: hashSeed,
    generateLevel: generateLevel, generateDaily: generateDaily, dailySeed: dailySeed
  };
});
