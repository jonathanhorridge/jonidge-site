/* Ferry Jam rules engine + BFS solver. Works in the browser and in Node. */
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

  function occupancy(level, cars) {
    var grid = {};
    function mark(r, c, val) { grid[r + ',' + c] = val; }
    (level.obstacles || []).forEach(function (o) { mark(o.r, o.c, '#'); });
    cars.forEach(function (car) {
      cellsOf(car).forEach(function (p) { mark(p.r, p.c, car.id); });
    });
    return grid;
  }

  function canExit(level, car, grid) {
    var d = DIR[car.dir];
    var r = car.r, c = car.c;
    for (;;) {
      r += d.dr; c += d.dc;
      if (!inBounds(level, r, c)) return true;
      if (grid[r + ',' + c]) return false;
    }
  }

  function validateLevel(level) {
    var seen = {};
    var grid = {};
    var issues = [];
    (level.obstacles || []).forEach(function (o) {
      if (!inBounds(level, o.r, o.c)) issues.push('obstacle out of bounds');
      grid[o.r + ',' + o.c] = '#';
    });
    level.cars.forEach(function (car) {
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
    return issues;
  }

  function init(level) {
    var ferries = (level.ferries || []).map(function (f, i) {
      return { color: f.color, capacity: f.capacity, loaded: 0, id: 'f' + i, cargo: [] };
    });
    var berths = level.berths || 1;
    return {
      levelId: level.id,
      rows: level.rows,
      cols: level.cols,
      berths: berths,
      holdSlots: level.holdSlots || 0,
      extraSlots: 0,
      cars: clone(level.cars),
      docked: ferries.slice(0, berths),
      queue: ferries.slice(berths),
      hold: [],
      sailed: [],
      status: 'playing',
      moves: 0,
      usedHint: false,
      usedExtraSlot: false,
      last: null
    };
  }

  function holdCap(state) { return state.holdSlots + (state.extraSlots || 0); }

  function findFerry(state, color) {
    for (var i = 0; i < state.docked.length; i++) {
      var f = state.docked[i];
      if (f.color === color && f.loaded < f.capacity) return i;
    }
    return -1;
  }

  function sail(state, index) {
    var f = state.docked[index];
    state.docked.splice(index, 1);
    state.sailed.push({ color: f.color, capacity: f.capacity, id: f.id, cargo: f.cargo || [] });
    if (state.queue.length) {
      state.docked.push(state.queue.shift());
    }
  }

  function drainHold(state) {
    var changed = true;
    while (changed && state.status === 'playing') {
      changed = false;
      for (var i = 0; i < state.hold.length; i++) {
        var idx = findFerry(state, state.hold[i].color);
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

  function board(state, car) {
    var idx = findFerry(state, car.color);
    if (idx !== -1) {
      var f = state.docked[idx];
      f.cargo = f.cargo || [];
      f.cargo.push({ id: car.id, color: car.color, len: car.len });
      f.loaded += 1;
      var sailed = f.loaded >= f.capacity;
      if (sailed) sail(state, idx);
      drainHold(state);
      return { ok: true, how: 'ferry', sailed: sailed, ferryColor: car.color };
    }
    if (state.hold.length < holdCap(state)) {
      state.hold.push({ id: car.id, color: car.color, len: car.len });
      return { ok: true, how: 'hold' };
    }
    state.status = 'lost';
    return { ok: false, how: 'jammed' };
  }

  function checkEnd(state, level) {
    if (state.status !== 'playing') return;
    if (state.cars.length === 0 && state.hold.length === 0) {
      state.status = 'won';
      return;
    }
    if (state.cars.length === 0 && state.hold.length > 0) {
      drainHold(state);
      if (state.hold.length === 0) { state.status = 'won'; return; }
      // Lot empty, hold still occupied, no matching ferry and no more arrivals → lost
      var canLater = state.queue.some(function (f) {
        return state.hold.some(function (h) { return h.color === f.color; });
      }) || state.hold.some(function (h) { return findFerry(state, h.color) !== -1; });
      if (!canLater) state.status = 'lost';
      return;
    }
    var grid = occupancy(level, state.cars);
    var any = state.cars.some(function (c) { return canExit(level, c, grid); });
    if (!any) state.status = 'lost';
  }

  function legalMoves(level, state) {
    if (state.status !== 'playing') return [];
    var grid = occupancy(level, state.cars);
    return state.cars.filter(function (c) { return canExit(level, c, grid); }).map(function (c) { return c.id; });
  }

  function apply(level, state, carId) {
    var next = clone(state);
    if (next.status !== 'playing') return { state: next, result: { ok: false, how: 'ended' } };
    var idx = -1;
    for (var i = 0; i < next.cars.length; i++) if (next.cars[i].id === carId) { idx = i; break; }
    if (idx === -1) return { state: next, result: { ok: false, how: 'missing' } };
    var car = next.cars[idx];
    var grid = occupancy(level, next.cars);
    if (!canExit(level, car, grid)) return { state: next, result: { ok: false, how: 'blocked' } };
    next.cars.splice(idx, 1);
    next.moves += 1;
    var result = board(next, car);
    result.car = { id: car.id, color: car.color, len: car.len, r: car.r, c: car.c, dir: car.dir };
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
    var dock = state.docked.map(function (f) { return f.id + ':' + f.loaded; }).join(',');
    var q = state.queue.map(function (f) { return f.id; }).join(',');
    var h = state.hold.map(function (c) { return c.id; }).join(',');
    return cars + '|' + dock + '|' + q + '|' + h + '|' + state.status + '|' + (state.extraSlots || 0);
  }

  /**
   * Shortest-win BFS. Returns { ok, moves: [carId...], length } or { ok:false }.
   */
  function solve(level, start) {
    var origin = start ? clone(start) : init(level);
    if (origin.status === 'won') return { ok: true, moves: [], length: 0 };
    if (origin.status === 'lost') return { ok: false, reason: 'already-lost' };
    var q = [{ state: origin, path: [] }];
    var seen = {};
    seen[hash(origin)] = true;
    var guard = 0, cap = 20000;
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

  return {
    DIR: DIR,
    cellsOf: cellsOf,
    occupancy: occupancy,
    canExit: canExit,
    validateLevel: validateLevel,
    init: init,
    holdCap: holdCap,
    legalMoves: legalMoves,
    apply: apply,
    addExtraSlot: addExtraSlot,
    solve: solve,
    hint: hint,
    hash: hash,
    clone: clone
  };
});
