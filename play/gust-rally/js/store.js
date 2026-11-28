/* Save game, quests, streak + freeze, settings, and the ghost adapter.
 * Ghosts: 'local' mode keeps your best per course in localStorage. The online adapter (js/online.js -> Cloudflare Worker
 * gust-rally-api, see server/README.md) stays OFF until KC_CONFIG.backend.mode === 'worker' and .url is set; any network error falls back to local. */
(function (root) {
  'use strict';
  var C = root.KC_CONFIG, KEY = C.storageKey;
  // One-time migration from the pre-rename save (kiteclash:v1). Stats carry over; old ghosts belong to old seeds and are dropped.
  try {
    if (!localStorage.getItem(KEY)) {
      var old = JSON.parse(localStorage.getItem('kiteclash:v1') || 'null');
      if (old) { old.best = {}; old.lastDaily = null; localStorage.setItem(KEY, JSON.stringify(old)); }
    }
  } catch (e) {}
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  var data = {}, Cos = root.KCCos, PF = root.KCPlatform;
  /** (Re)load the save into the single `data` object. Called at start and again once the native Preferences copy is in. */
  function hydrate() {
    var d = load(), k; for (k in data) delete data[k]; for (k in d) data[k] = d[k];
    data.best = data.best || {}; data.breeze = data.breeze || 0; data.streak = data.streak || 0; data.runs = data.runs || 0;
    data.freezes = data.freezes || 0; data.quests = data.quests || { day: null, prog: {}, claimed: {} };
    data.settings = Object.assign({ sfx: true, music: true, haptics: true, reduced: null }, data.settings || {});
    data.owned = data.owned || { kite: ['classic'], tail: ['bows'], trail: ['ribbon'] };
    data.equip = Object.assign(Cos ? Cos.defaults() : {}, data.equip || {});
    data.packs = data.packs || {};
  }
  hydrate();
  function save() { var v = JSON.stringify(data); if (PF) PF.write(KEY, v); else { try { localStorage.setItem(KEY, v); } catch (e) {} } }
  function dayKey(seed) { return seed.replace('gustrally-', ''); }
  function addDays(day, n) { return new Date(Date.parse(day + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10); }
  function utcToday() { return new Date().toISOString().slice(0, 10); }

  // ---------- daily quests (same 3 for everyone, picked from the date) ----------
  var POOL = [
    { id: 'rings', text: 'Collect {n} rings', stat: 'rings', n: [20, 30, 40], reward: 20 },
    { id: 'ups', text: 'Ride {n} updrafts', stat: 'ups', n: [3, 4, 6], reward: 20 },
    { id: 'runs', text: 'Finish {n} runs', stat: 'runs', n: [2, 3, 4], reward: 15 },
    { id: 'clean', text: 'Finish a run with no bird hits', stat: 'clean', n: [1], reward: 25 },
    { id: 'par', text: 'Finish within 8% of par', stat: 'nearPar', n: [1], reward: 30 },
    { id: 'smooth', text: 'Finish with 2 hits or fewer', stat: 'smooth', n: [1], reward: 20 }
  ];
  function questsFor(day) {
    var rnd = root.KCSim.mulberry32(root.KCSim.hashStr('quests-' + day)), idx = POOL.map(function (_, i) { return i; }), out = [];
    for (var m = 0; m < 3; m++) {
      var j = Math.floor(rnd() * idx.length), q = POOL[idx.splice(j, 1)[0]], n = q.n[Math.floor(rnd() * q.n.length)];
      out.push({ id: q.id, stat: q.stat, n: n, text: q.text.replace('{n}', n), reward: q.reward });
    }
    return out;
  }
  function rollQuests() { var d = utcToday(); if (data.quests.day !== d) { data.quests = { day: d, prog: {}, claimed: {} }; save(); } }
  function questState() {
    rollQuests();
    return questsFor(data.quests.day).map(function (q) { var p = Math.min(q.n, data.quests.prog[q.stat] || 0); return Object.assign({ progress: p, done: p >= q.n, claimed: !!data.quests.claimed[q.id] }, q); });
  }
  function bump(stat, n) { data.quests.prog[stat] = (data.quests.prog[stat] || 0) + n; }

  // ---------- streak (+ freeze) ----------
  function applyDaily(today) {
    if (data.lastDaily === today) return { kept: false };
    var y = addDays(today, -1), y2 = addDays(today, -2), used = false;
    if (data.lastDaily === y) data.streak += 1;
    else if (data.lastDaily === y2 && data.freezes > 0) { data.freezes--; data.streak += 1; used = true; }
    else data.streak = 1;
    data.lastDaily = today;
    var gained = false;
    if (data.streak % 7 === 0 && data.freezes < 2) { data.freezes++; gained = true; }
    return { freezeUsed: used, freezeGained: gained };
  }
  /** What the home screen shows: a lapsed streak shows 0 unless a freeze will still save it. */
  function streakShown() {
    var t = utcToday(); if (!data.lastDaily || data.lastDaily === t || data.lastDaily === addDays(t, -1)) return data.streak;
    return data.lastDaily === addDays(t, -2) && data.freezes > 0 ? data.streak : 0;
  }

  // ---------- online adapter (OFF unless configured) ----------
  function onlineOn() { return !!root.KCOnline && root.KCOnline.enabled(); }
  function dailyDay(seed) { var m = /^gustrally-(\d{4}-\d{2}-\d{2})$/.exec(seed); return m ? m[1] : null; }

  var Store = {
    _applyDaily: applyDaily, _questsFor: questsFor, hydrate: hydrate, data: data, save: save, questState: questState, streakShown: streakShown, online: onlineOn,
    best: function (seed) { var b = data.best[seed]; return b && b.ghost && b.ghost.v === root.KCSim.VERSION ? b : null; }, // ghosts from older physics versions are ignored
    set: function (k, v) { data.settings[k] = v; save(); },
    submit: function (seed, run, daily, ctx) {
      ctx = ctx || {};
      data.runs++; rollQuests();
      var prev = Store.best(seed), improved = !prev || run.time < prev.time, info = {};
      if (improved) {
        data.best[seed] = { time: run.time, ghost: run.ghost };
        var keys = Object.keys(data.best); if (keys.length > 8) { keys.sort(); delete data.best[keys[0]]; }
      }
      if (daily) info = applyDaily(dayKey(seed));
      bump('rings', run.rings); bump('ups', run.ups || 0); bump('runs', 1);
      if (!run.birdHits) bump('clean', 1);
      if (run.hits <= 2) bump('smooth', 1);
      if (ctx.par && run.time <= ctx.par * 1.08) bump('nearPar', 1);
      save();
      if (onlineOn() && daily && dailyDay(seed)) root.KCOnline.submitRun(dailyDay(seed), run.ghost).catch(function () {}); // best-effort; queued for retry when offline
      return { improved: improved, prev: prev, freezeUsed: info.freezeUsed, freezeGained: info.freezeGained };
    },
    claimQuest: function (id) {
      var q = questState().filter(function (x) { return x.id === id; })[0];
      if (!q || !q.done || q.claimed) return 0;
      data.quests.claimed[id] = 1; data.breeze += q.reward; save(); return q.reward;
    },
    addBreeze: function (n) { data.breeze += n; save(); },
    /** Rewarded "double Breeze" uses left today (cap from config; resets at 00:00 UTC). */
    adsLeft: function () { var cap = ((C.ads || {}).maxRewardedPerDay) || 3, d = utcToday(); return data.adDay && data.adDay.day === d ? Math.max(0, cap - data.adDay.n) : cap; },
    noteAd: function () { var d = utcToday(); if (!data.adDay || data.adDay.day !== d) data.adDay = { day: d, n: 0 }; data.adDay.n++; save(); },
    // ---- cosmetics (visual only; bought with earned Breeze) ----
    owns: function (slot, id) { return data.owned[slot].indexOf(id) >= 0; },
    loadout: function () { return Object.assign({}, data.equip); },
    equip: function (slot, id) { if (!Store.owns(slot, id)) return false; data.equip[slot] = id; save(); return true; },
    /** Spend Breeze. Returns 'ok' | 'owned' | 'poor'. */
    buy: function (slot, id) {
      var it = Cos.find(slot, id); if (Store.owns(slot, id)) return 'owned';
      if (data.breeze < it.price) return 'poor';
      data.breeze -= it.price; data.owned[slot].push(id); save(); return 'ok';
    },
    /** Grant a cosmetic pack (IAP or test mode): unlocks items directly, no currency involved. */
    grantItems: function (items, packId) {
      items.forEach(function (x) { if (!Store.owns(x[0], x[1])) data.owned[x[0]].push(x[1]); });
      if (packId) data.packs[packId] = 1; save();
    },
    /** Ghost API: [my best, friends, 2 players just above my rank]. Local mode returns only my best. */
    ghostsFor: function (seed) {
      var b = Store.best(seed), mine = b ? [b.ghost] : [];
      if (!onlineOn() || !dailyDay(seed)) return Promise.resolve(mine);
      return root.KCOnline.ghosts(dailyDay(seed)).then(function (remote) { return mine.concat(remote); }).catch(function () { return mine; });
    }
  };
  root.KCStore = Store;
})(this);
