/* Hexglen UI. Plain JS, no build step (webDir = www for Capacitor). */
(function () {
  'use strict';
  var H = window.HH, M = window.HHMeta, A = window.HHArt, AU = window.HHAudio, ST = window.HHStore, PF = window.HHPlatform, NT = window.HHNotify;
  var GAME_URL = 'jonidge.com/play/hexglen';
  var view = document.getElementById('view');
  var REAL_TODAY = H.utcDateKey();
  var params = new URLSearchParams(location.search);
  var dateKey = REAL_TODAY, overridden = false;
  if (params.get('date') && H.validDateKey(params.get('date'))) { dateKey = params.get('date'); overridden = dateKey !== REAL_TODAY; }
  if (params.get('fresh') === '1') ST.reset();
  var settings = Object.assign({ sfx: true, music: false, haptics: true, skin: 'meadow', reminder: { on: false, time: '19:00' } }, ST.get('settings', {}));

  var screen = 'home', g = null, daily = null, preview = null, counted = false, svgEl = null, lastScoreShown = 0, busy = false, timers = [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.className = 'show'; clearTimeout(toast._t); toast._t = setTimeout(function () { t.className = ''; }, 2400); }
  function clearTimers() { timers.forEach(clearInterval); timers = []; }
  function saveSettings() { ST.set('settings', settings); }

  /* ---------------- saved data ---------------- */
  function results() { return ST.get('results', {}); }
  function streak() { return ST.get('streak', H.emptyStreak()); }
  function village() { return ST.get('village', []); }
  function covered() { return ST.get('covered', []); }
  function eventState() { return ST.get('events', {}); }
  function villagerState() { return ST.get('villagers', {}); }
  function daysPlayed() { return Object.keys(results()).length; }
  function isCountedDate(d) { return d === REAL_TODAY; }
  function applySkin() {
    var ok = M.unlockedSkins(daysPlayed());
    if (ok.indexOf(settings.skin) < 0) settings.skin = 'meadow';
    A.setSkin(settings.skin);
  }
  function syncReminders() {
    var sr = streak(), alive = H.streakAlive(sr, REAL_TODAY);
    NT.sync({ on: settings.reminder.on, time: settings.reminder.time, solvedToday: !!results()[REAL_TODAY], streak: alive ? sr.streak : 0 });
  }
  function starStr(n) { var s = ''; for (var i = 0; i < 3; i++) s += '<span class="star' + (i < n ? ' on' : '') + '">★</span>'; return '<span class="stars">' + s + '</span>'; }
  function vname(reqId) { var v = M.villagerFor(reqId); return v ? v.name : ''; }
  function avatar(id, px) { return '<svg class="avatar" width="' + px + '" height="' + px + '" viewBox="-14 -34 28 44" aria-hidden="true">' + A.DEFS + A.person(id) + '</svg>'; }

  /* ---------------- shared pieces ---------------- */
  function bagIcons(d) {
    var c = {}; d.tiles.forEach(function (t) { c[t] = (c[t] || 0) + 1; });
    return H.TYPES.map(function (t) { return '<span class="bagi" title="' + H.LABEL[t] + '">' + H.EMOJI[t] + '<b>' + c[t] + '</b></span>'; }).join('');
  }
  function calendarHtml() {
    var res = results(), strip = M.calendarStrip(REAL_TODAY, res, covered(), 7);
    return '<div class="cal" data-testid="calendar">' + strip.map(function (d) {
      var icon = d.status === 'played' ? '✓' : d.status === 'frozen' ? '❄️' : d.status === 'today' ? '•' : '';
      return '<div class="cd ' + d.status + (d.isToday ? ' tod' : '') + '" data-status="' + d.status + '"><span class="dw">' + d.dow + '</span><span class="dm">' + icon + '</span><span class="dn">' + d.day + '</span></div>';
    }).join('') + '</div>';
  }
  function eventCardHtml(date) {
    var th = M.weeklyTheme(date), ev = eventState()[th.weekKey] || { days: [], claimed: false };
    var dots = ''; for (var i = 0; i < th.daysNeeded; i++) dots += '<span class="dot' + (i < ev.days.length ? ' on' : '') + '"></span>';
    return '<div class="card event" data-testid="event" style="--ec:' + th.color + '"><div class="ehead"><span class="eicon">' + th.icon + '</span><div><div class="etitle">' + th.name + '</div>' +
      '<div class="esub">This week · ends ' + th.endsOn + '</div></div></div><p class="wtext">' + esc(th.blurb) + '</p>' +
      '<div class="egoal">Goal: ' + esc(th.text) + '</div><div class="eprog"><span class="dots">' + dots + '</span><span>' + (ev.claimed ? 'Reward claimed: ' + esc(th.reward.name) : 'Reach it on ' + th.daysNeeded + ' days to win the ' + esc(th.reward.name)) + '</span></div></div>';
  }

  /* ---------------- VILLAGE RENDERING ---------------- */
  var VS = 30;
  function villageSVG(o) {
    o = o || {};
    var items = village(), lay = M.layoutVillage(items), maxRing = 1, byCell = {};
    lay.forEach(function (p) { byCell[p.q + ',' + p.r] = p; maxRing = Math.max(maxRing, H.dist([p.q, p.r], [0, 0])); });
    var R = Math.max(2, maxRing + 1), cells = [];
    for (var r = -R; r <= R; r++) for (var q = -R; q <= R; q++) if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= R) cells.push([q, r]);
    var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    cells.forEach(function (c) {
      var x = VS * A.SQ3 * (c[0] + c[1] / 2), y = VS * 1.5 * A.K * c[1];
      minX = Math.min(minX, x - VS * 0.87); maxX = Math.max(maxX, x + VS * 0.87); minY = Math.min(minY, y - VS * A.K - 50); maxY = Math.max(maxY, y + VS * A.K + 14);
    });
    var revealFrom = o.reveal ? items.length - o.reveal : items.length, html = '', sparkle = '';
    cells.forEach(function (c) {
      var p = byCell[c[0] + ',' + c[1]], ring = H.dist(c, [0, 0]), cls = ring === R ? 'fringe' : '', wild = null;
      if (!p && ring >= 1 && M.hashCell(c[0], c[1]) < 0.4) wild = M.hashCell(c[1], c[0]) < 0.5 ? 'tree' : 'trees';
      var hexHtml = A.villageHex(c[0], c[1], VS, p ? p.item : null, cls, p ? null : wild);
      if (p && p.i >= revealFrom) {
        var d = ((p.i - revealFrom) * 0.55 + 0.35).toFixed(2), px = VS * A.SQ3 * (c[0] + c[1] / 2), py = VS * 1.5 * A.K * c[1];
        hexHtml = '<g class="newitem" style="--d:' + d + 's">' + hexHtml + '</g>';
        sparkle += '<text class="spark" x="' + px.toFixed(0) + '" y="' + (py - 34).toFixed(0) + '" style="--d:' + d + 's" text-anchor="middle" font-size="16">✨</text>';
      }
      if (p && p.item.kind === 'villager') hexHtml = '<g class="vclick" data-villager="' + p.item.type + '">' + hexHtml + '</g>';
      html += hexHtml;
    });
    var W = Math.round(maxX - minX + 20), Hh = Math.round(maxY - minY + 10);
    var newest = lay.length ? lay[lay.length - 1] : { q: 0, r: 0 };
    var nx = VS * A.SQ3 * (newest.q + newest.r / 2) - minX + 10, ny = VS * 1.5 * A.K * newest.r - minY + 5;
    var size = o.mini ? 'width="100%" style="max-height:' + (o.maxH || 200) + 'px"' : 'width="' + W + '" height="' + Hh + '"';
    return { html: '<svg id="vsvg" class="vsvg" data-testid="village-svg" ' + size + ' viewBox="' + (minX - 10).toFixed(0) + ' ' + (minY - 5).toFixed(0) + ' ' + W + ' ' + Hh + '" preserveAspectRatio="xMidYMid meet">' + A.DEFS + html + sparkle + '</svg>', nx: nx, ny: ny, W: W, H: Hh, count: items.length };
  }
  function progressHtml() {
    var dp = daysPlayed(), cur = M.levelFor(dp), nx = M.nextMilestone(dp);
    var base = cur ? cur.days : 0, pct = nx ? Math.round((dp - base) / (nx.days - base) * 100) : 100;
    return { name: cur ? cur.name : 'Empty meadow', level: cur ? cur.level : 0, next: nx, pct: pct, dp: dp };
  }

  /* ---------------- HOME ---------------- */
  function renderHome() {
    clearTimers(); screen = 'home'; g = null; daily = H.generateDaily(dateKey);
    var res = results()[dateKey], str = streak(), w = H.weatherById(daily.weather), alive = H.streakAlive(str, REAL_TODAY), pr = progressHtml();
    var reqs = daily.requests.map(function (r) {
      var def = H.requestDef(r.tier, r.id), v = M.villagerFor(r.id);
      return '<li>' + avatar(v.id, 26) + '<span class="rp ' + r.tier + '">+' + H.REQUEST_POINTS[r.tier] + '</span><span><b>' + v.name + '</b> asks: ' + esc(def.text) + '</span></li>';
    }).join('');
    var mini = village().length ? villageSVG({ mini: true, maxH: 190 }).html : '<p class="muted">Your village is an empty meadow. Finish a puzzle to build your first cottage.</p>';
    var th = M.weeklyTheme(REAL_TODAY);
    var done = res && !overridden;
    view.innerHTML =
      '<section class="screen home">' +
      '<header class="hero"><div class="logo">' + A.iconSVG('house', 54) + '</div><h1>Hexglen</h1><p class="tag">a cozy daily hex puzzle</p></header>' +
      '<div class="chips"><span class="chip streak" data-testid="streak">🔥 ' + (alive ? str.streak : 0) + ' day streak</span><span class="chip freeze" title="A freeze covers one missed day">❄️ ' + str.freezes + ' freeze' + (str.freezes === 1 ? '' : 's') + '</span></div>' +
      '<div class="card calcard">' + calendarHtml() + '<p class="muted calnote">❄️ A freeze quietly covers a missed day. You earn one after every 7 days you play (max 2).</p></div>' +
      '<div class="card daily">' +
      '<div class="dhead"><div><div class="dnum">Puzzle #' + daily.number + (overridden ? ' <em>practice</em>' : '') + '</div><div class="ddate">' + dateKey + ' (UTC)</div></div>' +
      '<div class="weather" title="' + esc(w.text) + '"><span>' + w.icon + '</span>' + w.name + '</div></div>' +
      '<p class="wtext">' + esc(w.text) + '</p>' +
      '<div class="bag"><span class="lbl">Today\'s 15 tiles</span>' + bagIcons(daily) + '</div>' +
      '<ul class="reqs">' + reqs + '</ul>' +
      (done ? '<div class="done">Today\'s score <b>' + res.score + '</b> ' + starStr(res.stars) + '</div><div class="nextin">Next puzzle in <b id="cd">' + M.fmtHMS(M.msUntilNextPuzzle(Date.now())) + '</b></div>' : '') +
      '<button class="btn primary" id="play" data-testid="play">' + (done ? 'View today\'s result' : overridden ? 'Play this practice day' : 'Play today\'s puzzle') + '</button>' +
      (done ? '<button class="btn ghost" id="practice">Play again for fun (doesn\'t count)</button>' : '') +
      '</div>' + eventCardHtml(REAL_TODAY) +
      '<div class="card vcard" data-testid="village-card"><div class="vtop"><h2>Your village</h2><span class="lvl">Lv ' + pr.level + ' · ' + pr.name + '</span></div><div class="vmini">' + mini + '</div>' +
      '<div class="bar"><i style="width:' + pr.pct + '%"></i></div><p class="muted">' + (pr.next ? 'Day ' + pr.dp + ' of ' + pr.next.days + ' to <b>' + pr.next.name + '</b>: ' + esc(pr.next.text) : 'Grand Glen reached. The village keeps growing.') + '</p>' +
      '<button class="btn" id="visit" data-testid="visit-village">Visit your village</button></div>' +
      '<div class="card lb"><h2>Leaderboard</h2><p class="muted">Global and friends boards switch on when online play ships. Your best so far: <b>' + (ST.get('best', 0) || '–') + '</b></p></div>' +
      '<div class="card practice"><h2>Practice any day</h2><p class="muted">Every date has its own fixed puzzle. Pick one to try (it won\'t count for streaks or the village).</p>' +
      '<div class="row"><input type="date" id="dpick" value="' + dateKey + '" aria-label="Puzzle date"><button class="btn small" id="dgo">Go</button></div></div>' +
      settingsHtml() + '</section>';
    $('#play').onclick = function () { AU.ensure(); if (done) renderSummary(res, true); else startGame(); };
    var prc = $('#practice'); if (prc) prc.onclick = function () { startGame(true); };
    $('#visit').onclick = function () { renderVillageScreen(); };
    $('#dgo').onclick = function () {
      var v = $('#dpick').value; if (!H.validDateKey(v)) return toast('Pick a valid date');
      var u = new URL(location.href); u.searchParams.set('date', v); location.href = u.toString();
    };
    wireSettings();
    if (done) tickCountdown('#cd');
    if (settings.music) document.addEventListener('pointerdown', function once() { AU.setMusic(true); document.removeEventListener('pointerdown', once); });
  }
  function tickCountdown(sel) {
    var iv = setInterval(function () { var e = $(sel); if (!e) return; var ms = M.msUntilNextPuzzle(Date.now()); e.textContent = M.fmtHMS(ms); if (ms < 1000) setTimeout(renderHome, 1500); }, 1000);
    timers.push(iv);
  }
  function settingsHtml() {
    var native = PF.native, rem = settings.reminder;
    return '<div class="card settings"><h2>Settings</h2>' +
      '<label class="srow"><span>Sound effects</span><input type="checkbox" id="sfx"' + (settings.sfx ? ' checked' : '') + '></label>' +
      '<label class="srow"><span>Ambient music</span><input type="checkbox" id="mus"' + (settings.music ? ' checked' : '') + '></label>' +
      '<label class="srow"><span>Haptics</span><input type="checkbox" id="hap"' + (settings.haptics ? ' checked' : '') + '></label>' +
      '<label class="srow"><span>Gentle daily reminder' + (native ? '' : ' <em>app only</em>') + '</span><input type="checkbox" id="rem" data-testid="reminder-toggle"' + (rem.on ? ' checked' : '') + (native ? '' : ' disabled') + '></label>' +
      '<label class="srow' + (rem.on ? '' : ' dim') + '"><span>Reminder time</span><select id="remtime"' + (native ? '' : ' disabled') + '>' +
      NT.PRESETS.map(function (t) { return '<option' + (t === rem.time ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></label>' +
      '<p class="muted">One quiet notification a day at most, only if you haven\'t played yet. Nothing leaves your device.</p></div>';
  }
  function wireSettings() {
    $('#sfx').onchange = function (e) { settings.sfx = e.target.checked; AU.setSfx(settings.sfx); saveSettings(); AU.play('tap'); };
    $('#mus').onchange = function (e) { settings.music = e.target.checked; saveSettings(); AU.setMusic(settings.music); };
    $('#hap').onchange = function (e) { settings.haptics = e.target.checked; PF.setHaptics(settings.haptics); saveSettings(); PF.haptic('tap'); };
    $('#rem').onchange = function (e) { setReminder(e.target.checked, true); };
    $('#remtime').onchange = function (e) { settings.reminder.time = e.target.value; saveSettings(); syncReminders(); toast('Reminder set for ' + e.target.value); };
  }
  function setReminder(on, fromHome) {
    if (!on) { settings.reminder.on = false; saveSettings(); syncReminders(); if (fromHome) renderHome(); return; }
    NT.request().then(function (st) {
      if (st === 'granted') { settings.reminder.on = true; saveSettings(); syncReminders(); toast('Reminder on at ' + settings.reminder.time); }
      else { settings.reminder.on = false; saveSettings(); toast(st === 'unsupported' ? 'Reminders work in the mobile app' : 'Notifications are off for Hexglen in system settings'); }
      if (screen === 'home') renderHome(); else if (screen === 'summary') { var b = $('#remind'); if (b) b.textContent = settings.reminder.on ? 'Reminder on ✓' : 'Remind me gently'; }
    });
  }

  /* ---------------- VILLAGE SCREEN ---------------- */
  function renderVillageScreen(reveal) {
    clearTimers(); screen = 'village'; var pr = progressHtml(), vs = villagerState(), dp = pr.dp;
    var vv = villageSVG({ reveal: reveal || 0 });
    var vill = Object.keys(M.VILLAGERS).map(function (id) {
      var v = M.VILLAGERS[id], s = vs[id], met = !!s, n = met ? s.done : 0, toGift = M.FRIEND_STEPS - (n % M.FRIEND_STEPS);
      var dots = ''; for (var i = 0; i < M.FRIEND_STEPS; i++) dots += '<span class="dot' + (met && i < (n % M.FRIEND_STEPS || (n && n % M.FRIEND_STEPS === 0 ? M.FRIEND_STEPS : 0)) ? ' on' : '') + '"></span>';
      return '<div class="vill ' + (met ? 'met' : 'locked') + '" data-testid="villager-' + id + '">' + (met ? avatar(id, 44) : '<div class="silh">?</div>') +
        '<div class="vinfo"><b>' + (met ? v.name : '???') + '</b> <span class="muted">the ' + v.role + '</span><div class="vsub">' + (met ? n + ' request' + (n === 1 ? '' : 's') + ' done · gift: ' + v.giftName : 'Moves in when you finish one of their requests') + '</div>' +
        (met ? '<div class="eprog"><span class="dots">' + dots + '</span><span class="muted">' + (toGift === M.FRIEND_STEPS ? 'next gift in ' + toGift : toGift + ' more for a gift') + '</span></div>' : '') + '</div></div>';
    }).join('');
    var ms = M.MILESTONES.map(function (m) {
      var ok = dp >= m.days;
      return '<li class="' + (ok ? 'done' : '') + '"><span class="mk">' + (ok ? '✓' : m.days) + '</span><span><b>Day ' + m.days + ': ' + m.name + '</b><br><span class="muted">' + esc(m.text) + '</span></span></li>';
    }).join('');
    var unl = M.unlockedSkins(dp);
    var skins = Object.keys(M.SKIN_UNLOCK).map(function (id) {
      var ok = unl.indexOf(id) >= 0;
      return '<button class="skin' + (settings.skin === id ? ' sel' : '') + (ok ? '' : ' lock') + '" data-skin="' + id + '" data-testid="skin-' + id + '">' + A.skinSwatch(id, 40) + '<span>' + A.SKINS[id].name + '</span><small>' + (ok ? (settings.skin === id ? 'in use' : 'tap to use') : 'Day ' + M.SKIN_UNLOCK[id]) + '</small></button>';
    }).join('');
    var th = M.weeklyTheme(REAL_TODAY), ev = eventState()[th.weekKey] || { days: [], claimed: false };
    view.innerHTML =
      '<section class="screen vscreen"><header class="gbar"><button class="icon" id="back" aria-label="Back">‹</button><div class="gtitle"><div class="vname" data-testid="vlevel">Lv ' + pr.level + ' · ' + pr.name + '</div><div>' + vv.count + ' things in your glen · day ' + dp + '</div></div></header>' +
      (reveal ? '<div class="banner" data-testid="new-today">✨ ' + reveal + ' new today!</div>' : '') +
      '<div class="vscroll" id="vscroll" data-testid="village-scroll">' + vv.html + '</div>' +
      '<div class="card"><div class="bar"><i style="width:' + pr.pct + '%"></i></div><p class="muted">' + (pr.next ? 'Next: <b>Day ' + pr.next.days + ' · ' + pr.next.name + '</b>. ' + esc(pr.next.text) : 'Grand Glen reached: the glen keeps growing.') + '</p></div>' +
      '<div class="card"><h2>Villagers</h2><div class="vills">' + vill + '</div></div>' +
      '<div class="card event2" style="--ec:' + th.color + '"><h2>' + th.icon + ' ' + th.name + '</h2><p class="muted">' + esc(th.text) + ' · ' + ev.days.length + '/' + th.daysNeeded + ' days · prize: ' + esc(th.reward.name) + (ev.claimed ? ' (won!)' : '') + '</p></div>' +
      '<div class="card"><h2>Tile looks</h2><div class="skins">' + skins + '</div><p class="muted">Cosmetic only: tile sets never change scoring.</p></div>' +
      '<div class="card"><h2>Milestones</h2><ol class="mlist">' + ms + '</ol></div>' +
      '<button class="btn ghost" id="home2">Home</button></section>';
    $('#back').onclick = renderHome; $('#home2').onclick = renderHome;
    Array.prototype.forEach.call(view.querySelectorAll('.skin'), function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-skin');
        if (M.unlockedSkins(daysPlayed()).indexOf(id) < 0) return toast('Unlocks on day ' + M.SKIN_UNLOCK[id] + ' of playing');
        settings.skin = id; A.setSkin(id); saveSettings(); AU.play('tap'); PF.haptic('tap'); renderVillageScreen();
      };
    });
    Array.prototype.forEach.call(view.querySelectorAll('.vclick'), function (el) {
      el.addEventListener('pointerdown', function () { var v = M.VILLAGERS[el.getAttribute('data-villager')]; toast(v.name + ': "' + v.line + '"'); AU.play('tap'); });
    });
    var sc = $('#vscroll'); sc.scrollLeft = Math.max(0, vv.nx - sc.clientWidth / 2); sc.scrollTop = Math.max(0, vv.ny - sc.clientHeight / 2);
    if (reveal) { AU.play('big'); PF.haptic('success'); }
  }

  /* ---------------- GAME ---------------- */
  function saveProgress() {
    if (!counted || !g) return;
    ST.set('game.' + dateKey, { board: g.board, queue: g.queue, stash: g.stash, placed: g.placed, undosLeft: g.undosLeft, history: g.history });
  }
  function startGame(practiceReplay) {
    daily = H.generateDaily(dateKey);
    counted = isCountedDate(dateKey) && !practiceReplay && !results()[dateKey];
    g = H.newGame(daily);
    if (counted) {
      var sv = ST.get('game.' + dateKey, null);
      if (sv && sv.board) { g.board = sv.board; g.queue = sv.queue; g.stash = sv.stash; g.placed = sv.placed; g.undosLeft = sv.undosLeft; g.history = sv.history || []; }
    }
    preview = null; busy = false;
    renderGame(); AU.play('start');
    if (H.isOver(g)) finishGame();
  }
  function reqChips() {
    var sc = H.gameScore(g);
    return daily.requests.map(function (r, i) {
      var def = H.requestDef(r.tier, r.id), ok = sc.requestsDone[i];
      return '<div class="rchip ' + (ok ? 'ok' : '') + '" data-testid="req-' + i + '"><span class="rp ' + r.tier + '">' + (ok ? '✓' : '+' + H.REQUEST_POINTS[r.tier]) + '</span><span class="rt"><b>' + vname(r.id) + ':</b> ' + esc(def.text) + '</span></div>';
    }).join('');
  }
  function renderGame() {
    clearTimers(); screen = 'game';
    var w = H.weatherById(daily.weather);
    view.innerHTML =
      '<section class="screen game">' +
      '<header class="gbar"><button class="icon" id="back" aria-label="Back">‹</button>' +
      '<div class="gtitle"><div>#' + daily.number + ' · ' + dateKey + (counted ? '' : ' <em>practice</em>') + '</div><div class="wchip">' + w.icon + ' ' + w.name + '</div></div>' +
      '<div class="scorebox"><div class="slabel">SCORE</div><div class="score" id="score" data-testid="score">0</div></div></header>' +
      '<div class="reqs2" id="reqs2">' + reqChips() + '</div>' +
      '<div class="boardwrap"><svg id="board" data-testid="board" viewBox="-170 -152 340 296" preserveAspectRatio="xMidYMid meet">' + A.DEFS + '<g id="cells"></g><g id="fx"></g></svg></div>' +
      '<div class="pantry" id="pantry" data-testid="pantry"></div>' +
      '<div class="tray"><div class="curwrap"><div class="curlabel">NOW</div><div class="cur" id="cur" data-testid="current"></div></div>' +
      '<div class="nexts"><div class="curlabel">NEXT</div><div class="nx" id="nexts"></div></div>' +
      '<div class="stashwrap"><div class="curlabel">STASH</div><button class="stashbox" id="stash" data-testid="stash"></button></div></div>' +
      '<div class="actions"><button class="btn small" id="undo" data-testid="undo">↶ Undo <span id="undon"></span></button>' +
      '<button class="btn primary" id="place" data-testid="place" disabled>Tap a hex</button></div></section>';
    svgEl = $('#board');
    var cellsG = $('#cells');
    H.CELLS.forEach(function (c) { var el = document.createElementNS('http://www.w3.org/2000/svg', 'g'); el.setAttribute('id', 'c_' + c[0] + '_' + c[1]); cellsG.appendChild(el); });
    H.CELLS.forEach(function (c) { drawCell(c[0], c[1]); });
    $('#back').onclick = function () { saveProgress(); renderHome(); };
    $('#undo').onclick = doUndo; $('#stash').onclick = doStash; $('#place').onclick = confirmPlace;
    lastScoreShown = 0; refreshHud(true);
  }
  function drawCell(q, r, dropped) {
    var el = $('#c_' + q + '_' + r), k = H.key(q, r), t = g.board[k], c = A.center(q, r), html;
    if (t) { html = A.tileGroup(t, c.x, c.y, {}); if (dropped) html = '<g class="drop">' + html + '</g>'; }
    else html = A.tileGroup('empty', c.x, c.y, { thick: 5 });
    if (!t && preview && preview.q === q && preview.r === r) html += '<g class="ghost">' + A.tileGroup(H.current(g), c.x, c.y, { spin: false, cls: 'ghosttile' }) + '</g>' + deltaBadge(c);
    var hp = A.hexPts(c.x, c.y, A.S * 0.98, A.K);
    html += '<polygon class="hit" data-cell="' + q + ',' + r + '" data-testid="cell-' + q + '_' + r + '" points="' + A.pts(hp) + '" fill="transparent"/>';
    el.innerHTML = html;
    el.querySelector('.hit').addEventListener('pointerdown', function (e) { e.preventDefault(); onCell(q, r); });
  }
  function deltaBadge(c) {
    var before = H.gameScore(g), t = H.current(g), tmp = Object.assign({}, g.board); tmp[H.key(preview.q, preview.r)] = t;
    var after = H.score(tmp, { weather: daily.weather, requests: daily.requests }), d = after.total - before.total;
    preview.delta = d;
    return '<g transform="translate(' + c.x.toFixed(1) + ',' + (c.y - 50).toFixed(1) + ')"><g class="pbadge"><rect x="-17" y="-11" width="34" height="19" rx="9.5" fill="#fffaf0" stroke="#e07a5f" stroke-width="1.6"/><text y="3.5" text-anchor="middle" font-size="12" font-weight="800" fill="#c4553f">' + (d >= 0 ? '+' : '') + d + '</text></g></g>';
  }
  function redrawAll() { H.CELLS.forEach(function (c) { drawCell(c[0], c[1]); }); }
  function refreshHud(instant) {
    var sc = H.gameScore(g), el = $('#score');
    if (instant) { el.textContent = sc.total; lastScoreShown = sc.total; } else { tween(el, lastScoreShown, sc.total); lastScoreShown = sc.total; }
    $('#reqs2').innerHTML = reqChips();
    var counts = {}; g.queue.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); if (g.stash) counts[g.stash] = (counts[g.stash] || 0) + 1;
    $('#pantry').innerHTML = '<span class="lbl">Left · ' + (g.queue.length + (g.stash ? 1 : 0)) + '</span>' + H.TYPES.map(function (t) {
      return '<span class="bagi' + (counts[t] ? '' : ' zero') + '">' + H.EMOJI[t] + '<b>' + (counts[t] || 0) + '</b></span>';
    }).join('');
    var cur = H.current(g);
    $('#cur').innerHTML = cur ? A.iconSVG(cur, 74) + '<div class="cname">' + H.LABEL[cur] + '</div>' : '';
    $('#nexts').innerHTML = g.queue.slice(1, 3).map(function (t) { return '<div class="nxi">' + A.iconSVG(t, 44) + '</div>'; }).join('') || '<span class="muted">–</span>';
    var sb = $('#stash'); sb.innerHTML = g.stash ? A.iconSVG(g.stash, 44) : '<span class="muted">swap</span>';
    sb.disabled = !(g.stash ? g.queue.length > 0 : g.queue.length > 1);
    $('#undon').textContent = '(' + g.undosLeft + ')'; $('#undo').disabled = !(g.history.length && g.undosLeft > 0);
    var pb = $('#place'); pb.disabled = !preview;
    pb.textContent = preview ? 'Place ' + H.LABEL[cur] + (preview.delta != null ? ' (' + (preview.delta >= 0 ? '+' : '') + preview.delta + ')' : '') : 'Tap a hex';
  }
  function tween(el, from, to) {
    var t0 = performance.now(), dur = 450;
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    (function step(t) { var p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(t0);
  }
  function onCell(q, r) {
    if (busy || !g || H.isOver(g)) return;
    if (g.board[H.key(q, r)]) { AU.play('error'); return; }
    if (preview && preview.q === q && preview.r === r) return confirmPlace();
    var old = preview; preview = { q: q, r: r };
    if (old) drawCell(old.q, old.r);
    drawCell(q, r); AU.play('preview'); PF.haptic('tap'); refreshHud(true);
  }
  function confirmPlace() {
    if (!preview || busy) return;
    var p = preview, before = H.gameScore(g); preview = null;
    var t = H.place(g, p.q, p.r); if (!t) return;
    var after = H.gameScore(g), diff = H.diffParts(before, after), total = after.total - before.total;
    drawCell(p.q, p.r, true); AU.play('place'); PF.haptic('place');
    var old = $('#fx'); while (old.firstChild) old.removeChild(old.firstChild);
    if (diff.length) popup(p.q, p.r, total, diff);
    refreshHud(false); saveProgress();
    if (diff.length >= 3) { AU.play('big'); PF.haptic('big'); } else if (total > 0) setTimeout(function () { AU.play('combo', diff.length); }, 120);
    if (H.isOver(g)) { busy = true; setTimeout(finishGame, 1300); }
  }
  var POP_LABEL = { grove: 'Grove', pasture: 'Pasture', river: 'River', windmill: 'Windmill', house: 'Cosy home', market: 'Market', request: 'Request done!' };
  function popup(q, r, total, diff) {
    var c = A.center(q, r), fx = $('#fx');
    var lines = diff.map(function (d) { return POP_LABEL[d.key] + ' ' + (d.delta > 0 ? '+' : '') + d.delta; });
    var big = (total >= 0 ? '+' : '') + total, el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    el.setAttribute('data-testid', 'popup');
    var w = Math.max(60, Math.max.apply(null, lines.map(function (l) { return l.length * 6.4 + 16; }).concat([40])));
    var h = 24 + lines.length * 14, x = Math.max(-170 + w / 2, Math.min(170 - w / 2, c.x)), y = c.y - 62 - h / 2;
    var html = '<g class="pop"><rect x="' + (-w / 2) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '" rx="12" fill="#fffaf0" stroke="#e07a5f" stroke-width="1.8"/>' +
      '<text y="' + (-h / 2 + 18) + '" text-anchor="middle" font-size="17" font-weight="900" fill="#c4553f">' + big + '</text>';
    lines.forEach(function (l, i) { html += '<text y="' + (-h / 2 + 32 + i * 14) + '" text-anchor="middle" font-size="10.5" font-weight="700" fill="#6b4a33">' + esc(l) + '</text>'; });
    el.innerHTML = html + '</g>'; el.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')');
    fx.appendChild(el); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2100);
  }
  function doUndo() { if (busy) return; if (!H.undo(g)) { AU.play('error'); return; } preview = null; redrawAll(); refreshHud(false); AU.play('undo'); saveProgress(); }
  function doStash() {
    if (busy) return; if (!H.stash(g)) { AU.play('error'); return; }
    if (preview) preview = { q: preview.q, r: preview.r };
    redrawAll(); refreshHud(true); AU.play('stash'); PF.haptic('tap'); saveProgress();
  }

  /* ---------------- FINISH ---------------- */
  function finishGame() {
    var sc = H.gameScore(g), st = H.stars(sc.total);
    var info = { score: sc.total, stars: st, parts: sc.parts, requestsDone: sc.requestsDone, rank: H.rank(sc.total), date: dateKey, number: daily.number, moments: [], items: [] };
    if (counted) {
      var dBefore = daysPlayed(), dAfter = dBefore + 1, moments = info.moments;
      var ac = M.applyCompletion(streak(), dateKey); ST.set('streak', ac.state); info.streak = ac.state.streak;
      if (ac.covered.length) ST.set('covered', covered().concat(ac.covered));
      ac.events.forEach(function (e) {
        if (e.type === 'freeze-used') moments.push({ icon: '❄️', text: 'A streak freeze covered ' + e.dates.length + ' missed day' + (e.dates.length > 1 ? 's' : '') + '. Your streak lives on!' });
        else if (e.type === 'freeze-earned') moments.push({ icon: '✨', text: 'You earned a streak freeze! (' + e.freezes + ' saved)' });
        else if (e.type === 'streak-reset') moments.push({ icon: '🌱', text: 'A fresh start: your ' + e.was + '-day streak has rested. Day 1 begins now.' });
        else if (e.type === 'streak-milestone') moments.push({ icon: '🔥', text: e.n + '-day streak! The glen is proud of you.' });
      });
      var items = M.villageReward(daily, sc.total, sc.requestsDone, dAfter);
      var vr = M.villagersOnComplete(villagerState(), daily, sc.requestsDone); ST.set('villagers', vr.state);
      vr.events.forEach(function (e) {
        var v = M.VILLAGERS[e.villager];
        if (e.type === 'moved-in') { moments.push({ icon: '🏡', text: v.name + ' the ' + v.role + ' moved in! "' + v.line + '"' }); items.push(e.item); }
        else if (e.type === 'gift') { moments.push({ icon: '🎁', text: v.name + ' gave you a gift: ' + v.giftName + '!' }); items.push(e.item); }
        else moments.push({ icon: '💬', text: v.name + ' thanks you. ' + (M.FRIEND_STEPS - (vr.state[v.id].done % M.FRIEND_STEPS)) + ' more request(s) for a gift.' });
      });
      var th = M.weeklyTheme(dateKey), eo = M.eventOnComplete(eventState(), th, dateKey, sc.stats); ST.set('events', eo.state);
      if (eo.claimedNow) { items.push(th.reward); moments.push({ icon: th.icon, text: th.name + ' reward: ' + th.reward.name + ' for your village!' }); }
      else if (eo.newDay) moments.push({ icon: th.icon, text: th.name + ': goal reached! ' + eo.progress + '/' + th.daysNeeded + ' days.' });
      else if (!eo.goalMet) moments.push({ icon: th.icon, text: th.name + ' goal: ' + th.text + '.' });
      M.milestonesCrossed(dBefore, dAfter).forEach(function (m) {
        moments.push({ icon: '🏆', text: 'Milestone: ' + m.name + '! ' + m.text });
      });
      info.items = items.map(function (it) { return { kind: it.kind, type: it.type }; });
      var v = village(); info.items.forEach(function (it) { v.push({ kind: it.kind, type: it.type, date: dateKey }); }); ST.set('village', v);
      if (sc.total > ST.get('best', 0)) ST.set('best', sc.total);
      info.share = H.shareString(daily, g.board, sc.total, { requestsDone: sc.requestsDone, streak: ac.state.streak }) + '\n' + GAME_URL;
      var all = results(); all[dateKey] = info; ST.set('results', all);
      ST.remove('game.' + dateKey);
      applySkin(); syncReminders();
    } else {
      info.share = H.shareString(daily, g.board, sc.total, { requestsDone: sc.requestsDone }) + '\n' + GAME_URL;
      info.practice = true;
    }
    window.__hhLastResult = info;
    renderSummary(info, false);
  }

  /* ---------------- SUMMARY + COME BACK TOMORROW ---------------- */
  function renderSummary(info, fromSaved) {
    clearTimers(); screen = 'summary';
    daily = H.generateDaily(info.date || dateKey);
    var rows = Object.keys(H.PART_LABEL).filter(function (k) { return info.parts[k] > 0; }).map(function (k) { return '<li><span>' + H.PART_LABEL[k] + '</span><b>' + info.parts[k] + '</b></li>'; }).join('');
    var items = (info.items || []).map(function (it) { return '<span class="got">' + A.villageItem(it.kind, it.type) + '</span>'; }).join('');
    var moments = (info.moments || []).map(function (m) { return '<li class="moment"><span class="mi">' + m.icon + '</span><span>' + esc(m.text) + '</span></li>'; }).join('');
    var w = H.weatherById(daily.weather), tomorrow = H.generateDaily(M.addDays(info.date, 1)), tw = H.weatherById(tomorrow.weather), tv = M.villagerFor(tomorrow.requests[0].id), tth = M.weeklyTheme(M.addDays(info.date, 1));
    var isToday = info.date === REAL_TODAY;
    var rem = settings.reminder;
    view.innerHTML =
      '<section class="screen summary">' +
      '<header class="shead"><div class="dnum">Puzzle #' + info.number + (info.practice ? ' <em>practice</em>' : '') + '</div><div class="ddate">' + info.date + ' · ' + w.icon + ' ' + w.name + '</div></header>' +
      '<div class="bigscore"><div class="bs" id="bs" data-testid="final-score">0</div><div class="rank" data-testid="rank">' + esc(info.rank) + '</div>' + starStr(0) + '</div>' +
      '<div class="card"><ul class="breakdown">' + rows + '</ul><div class="reqsum">' + daily.requests.map(function (r, i) { return '<div>' + (info.requestsDone[i] ? '✅' : '▫️') + ' <b>' + vname(r.id) + ':</b> ' + esc(H.requestDef(r.tier, r.id).text) + '</div>'; }).join('') + '</div></div>' +
      (moments ? '<div class="card"><h2>Today in the glen</h2><ul class="moments" data-testid="moments">' + moments + '</ul></div>' : '') +
      (items ? '<div class="card"><h2>Added to your village</h2><div class="village got-row">' + items + '</div><button class="btn primary" id="seev" data-testid="see-village">See your village grow</button></div>' : (info.practice ? '<div class="card"><p class="muted">Practice runs don\'t score for the leaderboard, streak or village.</p></div>' : '')) +
      (info.practice ? '' :
        '<div class="card tomorrow" data-testid="tomorrow"><h2>Come back tomorrow</h2><div class="cdbig"><span class="lbl">Next puzzle in</span><b id="cd2" data-testid="countdown">' + M.fmtHMS(M.msUntilNextPuzzle(Date.now())) + '</b></div>' +
        '<p class="muted">Tomorrow: ' + tw.icon + ' <b>' + tw.name + '</b>. ' + esc(tv.name) + ' the ' + tv.role + ' has a request waiting.' + (tth.weekKey !== M.weeklyTheme(info.date).weekKey ? ' A new week begins: <b>' + tth.name + '</b>!' : '') + '</p>' +
        '<div class="strip2">' + calendarHtml() + '</div>' +
        '<button class="btn' + (rem.on ? '' : ' primary') + '" id="remind" data-testid="remind">' + (rem.on ? 'Reminder on ✓' : 'Remind me gently') + '</button>' +
        (PF.native ? '' : '<p class="muted">Daily reminders are available in the mobile app.</p>') + '</div>') +
      '<div class="card share"><h2>Share your result</h2><pre id="sharetxt" data-testid="share">' + esc(info.share) + '</pre>' +
      '<div class="row"><button class="btn primary" id="copy" data-testid="copy">Copy</button><button class="btn" id="shr">Share</button></div></div>' +
      '<div class="row"><button class="btn ghost" id="home">Home</button>' + (info.practice ? '' : '<button class="btn ghost" id="again">Play again for fun</button>') + '</div></section>';
    var bs = $('#bs'), t0 = performance.now(), target = info.score, dur = fromSaved ? 0 : 1100;
    (function step(t) { var p = dur ? Math.min(1, (t - t0) / dur) : 1; bs.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(t0);
    var starsEl = $('.bigscore .stars');
    for (var i = 0; i < 3; i++) (function (i) {
      setTimeout(function () { var s = starsEl.children[i]; if (s && i < info.stars) { s.classList.add('on', 'pop'); if (!fromSaved) { AU.play('star', i); PF.haptic('tap'); } } }, fromSaved ? 0 : 900 + i * 380);
    })(i);
    if (!fromSaved) setTimeout(function () { AU.play('finish'); PF.haptic('success'); }, 300);
    if ($('#cd2')) tickCountdown('#cd2');
    var sv = $('#seev'); if (sv) sv.onclick = function () { renderVillageScreen(fromSaved ? 0 : (info.items || []).length); };
    var rb = $('#remind'); if (rb) rb.onclick = function () { setReminder(!settings.reminder.on, false); };
    $('#copy').onclick = function () {
      var txt = info.share, done = function () { toast('Copied! Paste it anywhere.'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { legacyCopy(txt); done(); }); else { legacyCopy(txt); done(); }
      AU.play('tap');
    };
    $('#shr').onclick = function () { PF.share(info.share).catch(function () { $('#copy').click(); }); };
    $('#home').onclick = renderHome;
    var ag = $('#again'); if (ag) ag.onclick = function () { startGame(true); };
  }
  function legacyCopy(txt) {
    var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta);
  }

  /* ---------------- boot ---------------- */
  new MutationObserver(function () { window.scrollTo(0, 0); }).observe(view, { childList: true });
  window.__hh = { H: H, M: M, state: function () { return g; }, date: function () { return dateKey; }, screen: function () { return screen; }, settings: function () { return settings; } };
  PF.onBack(function () {
    if (screen === 'home') return false;
    if (screen === 'game') saveProgress();
    renderHome(); return true;
  });
  PF.onResume(function () { syncReminders(); if (screen === 'home') renderHome(); });
  NT.onTap(function () { if (screen !== 'game') renderHome(); });
  PF.Store.whenReady(function () {
    PF.setup(); PF.setHaptics(settings.haptics); AU.setSfx(settings.sfx); applySkin(); syncReminders(); renderHome();
  });
})();
