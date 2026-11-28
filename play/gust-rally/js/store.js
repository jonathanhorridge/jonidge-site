/* Save game + ghost adapter. 'local' mode keeps your best ghost per course in localStorage.
 * An online adapter (Supabase free plan, docs/DESIGN.md §11) will expose the same calls. */
(function (root) {
  'use strict';
  var KEY = root.KC_CONFIG.storageKey;
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  var data = load();
  data.best = data.best || {}; data.breeze = data.breeze || 0; data.streak = data.streak || 0; data.runs = data.runs || 0;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }
  function dayKey(seed) { return seed.replace('gustrally-', ''); }
  var Store = {
    data: data, save: save,
    best: function (seed) { return data.best[seed] || null; },
    submit: function (seed, run, daily) {
      data.runs++;
      var prev = data.best[seed], improved = !prev || run.time < prev.time;
      // keep only a handful of ghosts so storage stays small
      if (improved) {
        data.best[seed] = { time: run.time, ghost: run.ghost };
        var keys = Object.keys(data.best); if (keys.length > 8) { keys.sort(); delete data.best[keys[0]]; }
      }
      if (daily) {
        var today = dayKey(seed);
        if (data.lastDaily !== today) {
          var y = new Date(Date.parse(today + 'T00:00:00Z') - 864e5).toISOString().slice(0, 10);
          data.streak = data.lastDaily === y ? data.streak + 1 : 1; data.lastDaily = today;
        }
      }
      save();
      return { improved: improved, prev: prev };
    },
    addBreeze: function (n) { data.breeze += n; save(); },
    // Ghost API (local adapter). Online: ghostsFor(seed) -> [my best, friends, 2 above my rank]
    ghostsFor: function (seed) { var b = data.best[seed]; return Promise.resolve(b ? [b.ghost] : []); }
  };
  root.KCStore = Store;
})(this);
