/* Gust Rally online client + compact input-log codec (UMD: browser global KCOnline, node/worker module).
 * Talks to the gust-rally-api Cloudflare Worker (server/). Anonymous: the only data sent is a random player id/token,
 * a display name, the day and your input log. Every call fails soft: callers get a rejected promise and fall back to local play.
 * Active only when KC_CONFIG.backend.mode === 'worker' and backend.url is set (see config.js). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else root.KCOnline = factory(root);
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';
  var TIMEOUT_MS = 6000, PKEY = 'gustrally:player';

  // ---------- codec: input toggles (strictly increasing ticks) <-> delta varint base64url ----------
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  function encodeToggles(t) {
    var bytes = [], prev = 0, i, d;
    for (i = 0; i < t.length; i++) {
      d = t[i] - prev; prev = t[i];
      while (d >= 128) { bytes.push((d & 127) | 128); d = Math.floor(d / 128); }
      bytes.push(d);
    }
    var s = '';
    for (i = 0; i < bytes.length; i += 3) {
      var a = bytes[i], b = i + 1 < bytes.length ? bytes[i + 1] : 0, c = i + 2 < bytes.length ? bytes[i + 2] : 0, n = (a << 16) | (b << 8) | c;
      s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < bytes.length ? B64[(n >> 6) & 63] : '') + (i + 2 < bytes.length ? B64[n & 63] : '');
    }
    return s;
  }
  /** Returns the toggle array, or null when the string is malformed. */
  function decodeToggles(s) {
    if (typeof s !== 'string' || /[^A-Za-z0-9_-]/.test(s) || s.length % 4 === 1) return null;
    var bytes = [], i, v = [];
    for (i = 0; i < s.length; i++) v.push(B64.indexOf(s[i]));
    for (i = 0; i < v.length; i += 4) {
      var n = (v[i] << 18) | (v[i + 1] << 12) | ((i + 2 < v.length ? v[i + 2] : 0) << 6) | (i + 3 < v.length ? v[i + 3] : 0);
      bytes.push((n >> 16) & 255); if (i + 2 < v.length) bytes.push((n >> 8) & 255); if (i + 3 < v.length) bytes.push(n & 255);
    }
    var out = [], prev = 0, cur = 0, mul = 1;
    for (i = 0; i < bytes.length; i++) {
      cur += (bytes[i] & 127) * mul;
      if (bytes[i] & 128) { mul *= 128; if (mul > 1e9) return null; } else { prev += cur; out.push(prev); cur = 0; mul = 1; }
    }
    if (mul !== 1) return null; // dangling continuation byte
    return out;
  }

  // ---------- client ----------
  function cfg() { var c = root.KC_CONFIG; return (c && c.backend) || {}; }
  function enabled() { var b = cfg(); return b.mode === 'worker' && !!b.url && typeof fetch === 'function'; }
  function lsGet(k) { try { return JSON.parse(root.localStorage.getItem(k)); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v == null) root.localStorage.removeItem(k); else root.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function http(method, path, body, token) {
    var ctl = typeof AbortController === 'function' ? new AbortController() : null, timer = ctl && setTimeout(function () { ctl.abort(); }, TIMEOUT_MS);
    var headers = {}; if (body) headers['Content-Type'] = 'application/json'; if (token) headers.Authorization = 'Bearer ' + token;
    return fetch(cfg().url.replace(/\/$/, '') + path, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined, signal: ctl ? ctl.signal : undefined })
      .then(function (r) { clearTimeout(timer); return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || 'http ' + r.status); e.status = r.status; e.body = j; throw e; } return j; }); },
        function (e) { clearTimeout(timer); throw e; });
  }

  var creating = null;
  function player() {
    var p = lsGet(PKEY); if (p && p.token) return Promise.resolve(p);
    if (!creating) creating = http('POST', '/v1/players', {}).then(function (j) { var q = { id: j.id, token: j.token, name: j.name, friendCode: j.friendCode }; lsSet(PKEY, q); creating = null; return q; }, function (e) { creating = null; throw e; });
    return creating;
  }
  /** Authenticated call; if the server no longer knows us (401) forget the identity and retry once with a fresh one. */
  function authed(method, path, body) {
    function go() { return player().then(function (p) { return http(method, path, body, p.token); }); }
    return go().catch(function (e) { if (e && e.status === 401) { lsSet(PKEY, null); return go(); } throw e; });
  }

  // Offline retry: one pending run (the best one for the day), only valid on the same UTC day.
  var QKEY = 'gustrally:pending';
  function keepPending(body) { var q = lsGet(QKEY); if (!q || q.day !== body.day || body.timeMs < q.timeMs) lsSet(QKEY, body); }
  function flushPending() {
    var q = lsGet(QKEY); if (!q) return Promise.resolve();
    if (q.day !== new Date().toISOString().slice(0, 10)) { lsSet(QKEY, null); return Promise.resolve(); }
    return authed('POST', '/v1/runs', q).then(function () { lsSet(QKEY, null); }, function (e) { if (e && e.status) lsSet(QKEY, null); /* server answered (rejected): drop it; no status = still offline: keep */ });
  }
  var courseCache = {}, simRef = null;
  /** Turn a server ghost record into the {toggles, samples, every, time, meta} shape game.js replays, by re-simulating locally. */
  function ghostFromRemote(seed, r) {
    var S = simRef || root.KCSim; if (!S) return null;
    var toggles = decodeToggles(r.toggles); if (!toggles) return null;
    var course = courseCache[seed] || (courseCache[seed] = S.generate(seed));
    var s = S.newState(), rec = new S.Recorder(), ti = 0, hold = false;
    while (!s.finished && s.tick < 14400) {
      while (ti < toggles.length && toggles[ti] === s.tick) { hold = !hold; ti++; }
      rec.record(s, hold); S.step(s, course, hold); s.events.length = 0;
    }
    if (!s.finished) return null;
    var g = rec.finish(course, s, { name: r.name, kind: r.kind, rank: r.rank, code: r.code });
    g.time = r.timeMs / 1000; // official (server) time
    return g;
  }

  return {
    useSim: function (s) { simRef = s; }, // tests / non-browser hosts
    encodeToggles: encodeToggles, decodeToggles: decodeToggles, enabled: enabled, ghostFromRemote: ghostFromRemote,
    ensurePlayer: player,
    me: function () { return authed('GET', '/v1/me'); },
    setName: function (name) { return authed('PUT', '/v1/me', { name: name }).then(function (j) { var p = lsGet(PKEY); if (p) { p.name = j.name; lsSet(PKEY, p); } return j; }); },
    deleteAccount: function () { return authed('DELETE', '/v1/me').then(function (j) { lsSet(PKEY, null); return j; }); },
    /** Submit a finished daily run. On a network failure (offline) the run is kept and retried by the next ghosts()/submitRun() call that same UTC day. */
    submitRun: function (day, ghost) {
      var body = { day: day, toggles: ghost.toggles, timeMs: Math.round(ghost.time * 1000) };
      return flushPending().then(function () { return authed('POST', '/v1/runs', body); }).catch(function (e) { if (!e || !e.status) keepPending(body); throw e; });
    },
    leaderboard: function (day, limit) { var p = lsGet(PKEY); return http('GET', '/v1/leaderboard?day=' + encodeURIComponent(day) + (limit ? '&limit=' + limit : ''), null, p && p.token); },
    /** Ghost list for a day, already converted to replayable ghosts: top, players just ahead of you, friends. */
    ghosts: function (day) {
      var seed = 'gustrally-' + day;
      return flushPending().then(function () { return authed('GET', '/v1/ghosts?day=' + encodeURIComponent(day)).then(function (j) { return (j.ghosts || []).map(function (r) { return ghostFromRemote(seed, r); }).filter(Boolean); }); });
    },
    friends: function (day) { return authed('GET', '/v1/friends' + (day ? '?day=' + encodeURIComponent(day) : '')); },
    addFriend: function (code) { return authed('POST', '/v1/friends', { code: code }); },
    removeFriend: function (code) { return authed('DELETE', '/v1/friends/' + encodeURIComponent(code)); }
  };
});
