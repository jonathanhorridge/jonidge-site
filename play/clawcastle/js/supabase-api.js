/* Clawcastle online raid adapter. Anonymous Supabase auth when available;
   otherwise CCMeta.RaidAPI stays in local/bot mode. */
(function (root) {
  'use strict';
  var URL = 'https://dizmieczdqdutmsbwfpf.supabase.co';
  var KEY = 'sb_publishable_yZMGhYURil1S0L2nsczzRA_BWC-1T_R';
  var CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
  var M = root.CCMeta;
  if (!M) return;

  var sb = null, ready = false, syncT = 0, syncTimer = 0, connecting = null;
  var lastReason = 'Not connected yet.';

  function offlineFlag() {
    try {
      if (typeof location !== 'undefined' && /(?:^|[?&])offline=1(?:&|$)/.test(location.search)) return true;
      if (typeof localStorage !== 'undefined' && localStorage.getItem('clawcastle-offline') === '1') return true;
    } catch (e) {}
    return false;
  }

  function villagePower(grid) {
    var n = 1;
    if (!grid) return n;
    for (var r = 0; r < grid.length; r++) {
      var row = grid[r] || [];
      for (var c = 0; c < row.length; c++) if (row[c] && !row[c].deco) n++;
    }
    return n;
  }

  function padBots(save, list, want) {
    list = (list || []).slice();
    want = want || 8;
    var bots = M.listOpponents(save) || [];
    var seen = {};
    list.forEach(function (o) { seen[String(o.id)] = 1; });
    for (var i = 0; i < bots.length && list.length < want; i++) {
      if (seen[String(bots[i].id)]) continue;
      list.push(bots[i]);
    }
    var cups = save.trophies || 0;
    list.sort(function (a, b) { return Math.abs((a.trophies || 0) - cups) - Math.abs((b.trophies || 0) - cups); });
    return list.slice(0, want);
  }

  function mapRow(row) {
    return {
      id: row.id,
      name: row.display_name || 'Captain',
      trophies: row.trophies || 0,
      grid: row.grid,
      power: row.power || 1,
      bot: false
    };
  }

  function isBot(opp) {
    if (!opp) return true;
    if (opp.bot) return true;
    var id = String(opp.id || '');
    return !id || id.indexOf('bot-') === 0;
  }

  var api = {
    mode: 'local',
    playerId: null,
    status: function () {
      return { mode: api.mode, online: api.mode === 'online', reason: lastReason, playerId: api.playerId };
    },
    connect: function (save) {
      if (connecting) return connecting;
      if (offlineFlag()) {
        lastReason = 'Offline mode.';
        api.mode = 'local';
        return Promise.resolve(api.status());
      }
      if (typeof fetch === 'undefined') {
        lastReason = 'No network in this environment.';
        return Promise.resolve(api.status());
      }
      connecting = Promise.resolve()
        .then(function () { return import(CDN); })
        .then(function (mod) {
          var create = mod.createClient || (mod.default && mod.default.createClient);
          if (!create) throw new Error('supabase-js has no createClient');
          sb = create(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
          return sb.auth.getSession();
        })
        .then(function (sess) {
          if (sess && sess.data && sess.data.session) return sess;
          return sb.auth.signInAnonymously();
        })
        .then(function (res) {
          if (res && res.error) throw res.error;
          var session = res.data && (res.data.session || res.data);
          var user = (session && session.user) || (res.data && res.data.user);
          if (!user || !user.id) throw new Error('Anonymous sign-in returned no user');
          api.playerId = user.id;
          if (save) save.playerId = user.id;
          api.mode = 'online';
          ready = true;
          lastReason = 'Signed in.';
          return api.pullProfile(save).then(function () { return api.pullInbox(save); });
        })
        .then(function (ev) {
          return api.syncVillage(save, true).then(function () { return { status: api.status(), inbox: ev || [] }; });
        })
        .catch(function (err) {
          api.mode = 'local';
          ready = false;
          lastReason = (err && (err.message || String(err))) || 'Could not reach the shores.';
          connecting = null;
          return { status: api.status(), inbox: [] };
        });
      return connecting;
    },
    pullProfile: function (save) {
      if (!ready || !sb || !save) return Promise.resolve();
      return sb.rpc('my_profile')
        .then(function (res) {
          if (res && res.error) throw res.error;
          var row = Array.isArray(res.data) ? res.data[0] : res.data;
          if (!row) return;
          if (typeof row.trophies === 'number') { save.trophies = row.trophies; save.cupsSynced = true; }
          if (!save.name && row.display_name && row.display_name !== 'Captain') save.name = row.display_name;
        })
        .catch(function () { /* RPC may not be applied yet */ });
    },
    pullInbox: function (save) {
      if (!ready || !sb || !save) return Promise.resolve([]);
      function merge(rows) {
        var ev = M.mergeInbox(save, rows || []);
        if (rows) save.onlineInbox = true;
        return ev;
      }
      return sb.rpc('my_defence_log', { p_limit: 20 })
        .then(function (res) {
          if (res && res.error) throw res.error;
          return merge(res.data || []);
        })
        .catch(function () {
          return sb.from('raids').select('*').eq('defender_id', api.playerId).order('created_at', { ascending: false }).limit(20)
            .then(function (res) {
              if (res && res.error) throw res.error;
              return merge(res.data || []);
            })
            .catch(function () { return []; });
        });
    },
    syncVillage: function (save, force) {
      if (!ready || !sb || !save) return Promise.resolve();
      var now = Date.now();
      if (!force && now - syncT < 8000) {
        clearTimeout(syncTimer);
        syncTimer = setTimeout(function () { api.syncVillage(save, true); }, 8000 - (now - syncT));
        return Promise.resolve();
      }
      syncT = now;
      var shield = save.shieldUntil && save.shieldUntil > now
        ? new Date(save.shieldUntil).toISOString() : null;
      return sb.rpc('upsert_my_village', {
        p_name: save.name || 'Captain',
        p_trophies: save.trophies || 0,
        p_grid: (save.village && save.village.grid) || [],
        p_power: villagePower(save.village && save.village.grid),
        p_shield_until: shield
      }).then(function (res) {
        if (res && res.error) throw res.error;
      }).catch(function (err) {
        lastReason = 'Village sync failed: ' + (err.message || err);
      });
    },
    opponents: function (save) {
      if (!ready || !sb) return Promise.resolve(M.listOpponents(save));
      return sb.rpc('match_opponents', { p_trophies: save.trophies || 0, p_limit: 5 })
        .then(function (res) {
          if (res && res.error) throw res.error;
          var rows = (res.data || []).map(mapRow).filter(function (o) { return o.grid; });
          return padBots(save, rows, 8);
        })
        .catch(function () { return M.listOpponents(save); });
    },
    village: function (opp) { return Promise.resolve(opp); },
    fetchVillage: function (id) {
      if (!ready || !sb || !id || String(id).indexOf('bot-') === 0) return Promise.resolve(null);
      return sb.rpc('get_village', { p_id: id })
        .then(function (res) {
          if (res && res.error) throw res.error;
          var row = Array.isArray(res.data) ? res.data[0] : res.data;
          if (!row) return null;
          return { id: row.id, name: row.display_name, trophies: row.trophies, grid: row.grid, power: row.power, bot: false };
        })
        .catch(function () {
          return sb.from('villages').select('player_id, grid, trophies, power, players!inner(display_name)')
            .eq('player_id', id).maybeSingle()
            .then(function (res) {
              var row = res && res.data;
              if (!row) return null;
              var name = (row.players && row.players.display_name) || 'Captain';
              return { id: row.player_id, name: name, trophies: row.trophies, grid: row.grid, power: row.power, bot: false };
            })
            .catch(function () { return null; });
        });
    },
    submitRaid: function (save, opp, state, rew) {
      if (!ready || !sb || isBot(opp)) return Promise.resolve();
      return sb.rpc('report_raid', {
        p_defender: opp.id,
        p_win: !!(rew && rew.win),
        p_stolen: (rew && rew.sand) || 0,
        p_seed: state && state.seed,
        p_moves: (state && state.moveLog) || [],
        p_snap: opp.grid,
        p_trophy_delta: (rew && rew.trophies) || 0
      }).then(function (res) {
        if (res && res.error) throw res.error;
        return api.pullProfile(save).then(function () { return api.syncVillage(save, true); });
      }).catch(function (err) {
        lastReason = 'Raid report failed: ' + (err.message || err);
      });
    },
    inbox: function (save) { return api.pullInbox(save || {}); },
    deleteMyData: function () {
      if (!ready || !sb) return Promise.resolve({ ok: false, reason: 'offline' });
      return sb.rpc('delete_my_data').then(function (res) {
        if (res && res.error) throw res.error;
        return { ok: true };
      }).catch(function (err) { return { ok: false, reason: err.message || String(err) }; });
    },
    isBot: isBot
  };

  M.RaidAPI = api;
})(typeof window !== 'undefined' ? window : globalThis);
