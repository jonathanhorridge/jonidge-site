/* Hexglen UI. Plain JS, no build step (webDir = www for Capacitor). */
(function () {
  'use strict';
  var H = window.HH, A = window.HHArt, AU = window.HHAudio, ST = window.HHStore;
  var GAME_URL = 'jonidge.com/play/hexglen';
  var view = document.getElementById('view');
  var REAL_TODAY = H.utcDateKey();
  var params = new URLSearchParams(location.search);
  var dateKey = REAL_TODAY, overridden = false;
  if (params.get('date')) {
    if (H.validDateKey(params.get('date'))) { dateKey = params.get('date'); overridden = dateKey !== REAL_TODAY; }
  }
  if (params.get('fresh') === '1') ST.reset();
  var settings = ST.get('settings', { sfx: true, music: false });
  AU.setSfx(settings.sfx);

  var g = null, daily = null, preview = null, counted = false, svgEl = null, lastScoreShown = 0, busy = false;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.className = 'show'; clearTimeout(toast._t); toast._t = setTimeout(function () { t.className = ''; }, 2200); }
  function vib(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

  /* ---------------- saved data helpers ---------------- */
  function results() { return ST.get('results', {}); }
  function streak() { return ST.get('streak', H.emptyStreak()); }
  function village() { return ST.get('village', []); }
  function isCountedDate(d) { return d === REAL_TODAY; }

  /* ---------------- HOME ---------------- */
  function bagIcons(d) {
    var c = {}; d.tiles.forEach(function (t) { c[t] = (c[t] || 0) + 1; });
    return H.TYPES.map(function (t) { return '<span class="bagi" title="' + H.LABEL[t] + '">' + H.EMOJI[t] + '<b>' + c[t] + '</b></span>'; }).join('');
  }
  function renderHome() {
    g = null; daily = H.generateDaily(dateKey);
    var res = results()[dateKey], str = streak(), w = H.weatherById(daily.weather), vill = village();
    var alive = H.streakAlive(str, REAL_TODAY);
    var reqs = daily.requests.map(function (r) {
      var def = H.requestDef(r.tier, r.id);
      return '<li><span class="rp ' + r.tier + '">+' + H.REQUEST_POINTS[r.tier] + '</span>' + esc(def.text) + '</li>';
    }).join('');
    var villHtml = vill.length ? vill.slice(-24).map(function (v) { return A.villageItem(v.kind, v.type); }).join('') : '<p class="muted">Your village is empty. Finish today\'s puzzle to build your first cottage.</p>';
    view.innerHTML =
      '<section class="screen home">' +
      '<header class="hero"><div class="logo">' + A.iconSVG('house', 54) + '</div><h1>Hexglen</h1><p class="tag">a cozy daily hex puzzle</p></header>' +
      '<div class="chips"><span class="chip streak" data-testid="streak">🔥 ' + (alive ? str.streak : 0) + ' day streak</span><span class="chip freeze" title="Streak freezes cover a missed day">❄️ ' + str.freezes + ' freeze' + (str.freezes === 1 ? '' : 's') + '</span></div>' +
      '<div class="card daily">' +
      '<div class="dhead"><div><div class="dnum">Puzzle #' + daily.number + (overridden ? ' <em>practice</em>' : '') + '</div><div class="ddate">' + dateKey + ' (UTC)</div></div>' +
      '<div class="weather" title="' + esc(w.text) + '"><span>' + w.icon + '</span>' + w.name + '</div></div>' +
      '<p class="wtext">' + esc(w.text) + '</p>' +
      '<div class="bag"><span class="lbl">Today\'s 15 tiles</span>' + bagIcons(daily) + '</div>' +
      '<ul class="reqs">' + reqs + '</ul>' +
      (res && !overridden ? '<div class="done">Today\'s score <b>' + res.score + '</b> ' + starStr(res.stars) + '</div>' : '') +
      '<button class="btn primary" id="play" data-testid="play">' + (res && !overridden ? 'View today\'s result' : overridden ? 'Play this practice day' : 'Play today\'s puzzle') + '</button>' +
      (res && !overridden ? '<button class="btn ghost" id="practice">Play again for fun (doesn\'t count)</button>' : '') +
      '</div>' +
      '<div class="card"><h2>Your village</h2><div class="village">' + villHtml + '</div></div>' +
      '<div class="card lb"><h2>Leaderboard</h2><p class="muted">Global and friends boards switch on when online play ships. Your best so far: <b>' + (ST.get('best', 0) || '–') + '</b></p></div>' +
      '<div class="card practice"><h2>Practice any day</h2><p class="muted">Every date has its own fixed puzzle. Pick one to try (it won\'t count for streaks).</p>' +
      '<div class="row"><input type="date" id="dpick" value="' + dateKey + '" aria-label="Puzzle date"><button class="btn small" id="dgo">Go</button></div></div>' +
      '<footer class="foot"><label><input type="checkbox" id="sfx"' + (settings.sfx ? ' checked' : '') + '> Sound</label><label><input type="checkbox" id="mus"' + (settings.music ? ' checked' : '') + '> Ambient music</label></footer>' +
      '</section>';
    $('#play').onclick = function () { AU.ensure(); if (res && !overridden) renderSummary(res, true); else startGame(); };
    var pr = $('#practice'); if (pr) pr.onclick = function () { startGame(true); };
    $('#dgo').onclick = function () {
      var v = $('#dpick').value;
      if (!H.validDateKey(v)) return toast('Pick a valid date');
      var u = new URL(location.href); u.searchParams.set('date', v); location.href = u.toString();
    };
    $('#sfx').onchange = function (e) { settings.sfx = e.target.checked; AU.setSfx(settings.sfx); ST.set('settings', settings); AU.play('tap'); };
    $('#mus').onchange = function (e) { settings.music = e.target.checked; ST.set('settings', settings); AU.setMusic(settings.music); };
    if (settings.music) { /* browsers need a gesture first; resumes on the next tap */ document.addEventListener('pointerdown', function once() { AU.setMusic(true); document.removeEventListener('pointerdown', once); }); }
  }
  function starStr(n) { var s = ''; for (var i = 0; i < 3; i++) s += '<span class="star' + (i < n ? ' on' : '') + '">★</span>'; return '<span class="stars">' + s + '</span>'; }

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
    renderGame();
    AU.play('start');
    if (H.isOver(g)) finishGame();
  }
  function reqChips() {
    var sc = H.gameScore(g);
    return daily.requests.map(function (r, i) {
      var def = H.requestDef(r.tier, r.id), ok = sc.requestsDone[i];
      return '<div class="rchip ' + (ok ? 'ok' : '') + '" data-testid="req-' + i + '"><span class="rp ' + r.tier + '">' + (ok ? '✓' : '+' + H.REQUEST_POINTS[r.tier]) + '</span><span class="rt">' + esc(def.text) + '</span></div>';
    }).join('');
  }
  function renderGame() {
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
      '<button class="btn primary" id="place" data-testid="place" disabled>Tap a hex</button></div>' +
      '</section>';
    svgEl = $('#board');
    var cellsG = $('#cells');
    H.CELLS.forEach(function (c) {
      var el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      el.setAttribute('id', 'c_' + c[0] + '_' + c[1]); cellsG.appendChild(el);
    });
    H.CELLS.forEach(function (c) { drawCell(c[0], c[1]); });
    $('#back').onclick = function () { saveProgress(); renderHome(); };
    $('#undo').onclick = doUndo; $('#stash').onclick = doStash; $('#place').onclick = confirmPlace;
    lastScoreShown = 0; refreshHud(true);
  }
  function drawCell(q, r, dropped) {
    var el = $('#c_' + q + '_' + r), k = H.key(q, r), t = g.board[k], c = A.center(q, r), html;
    if (t) html = A.tileGroup(t, c.x, c.y, {}), html = dropped ? '<g class="drop">' + html + '</g>' : html;
    else html = A.tileGroup('empty', c.x, c.y, { thick: 5 });
    if (!t && preview && preview.q === q && preview.r === r) {
      html += '<g class="ghost">' + A.tileGroup(H.current(g), c.x, c.y, { spin: false, cls: 'ghosttile' }) + '</g>' + deltaBadge(c);
    }
    var hp = A.hexPts(c.x, c.y, A.S * 0.98, A.K);
    html += '<polygon class="hit" data-cell="' + q + ',' + r + '" data-testid="cell-' + q + '_' + r + '" points="' + A.pts(hp) + '" fill="transparent"/>';
    el.innerHTML = html;
    var hit = el.querySelector('.hit');
    hit.addEventListener('pointerdown', function (e) { e.preventDefault(); onCell(q, r); });
    hit.addEventListener('keydown', function () {});
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
    if (instant) { el.textContent = sc.total; lastScoreShown = sc.total; }
    else tween(el, lastScoreShown, sc.total), lastScoreShown = sc.total;
    $('#reqs2').innerHTML = reqChips();
    // pantry = tiles still to come (incl. current & stash)
    var counts = {}; g.queue.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); if (g.stash) counts[g.stash] = (counts[g.stash] || 0) + 1;
    $('#pantry').innerHTML = '<span class="lbl">Left · ' + (g.queue.length + (g.stash ? 1 : 0)) + '</span>' + H.TYPES.map(function (t) {
      return '<span class="bagi' + (counts[t] ? '' : ' zero') + '">' + H.EMOJI[t] + '<b>' + (counts[t] || 0) + '</b></span>';
    }).join('');
    var cur = H.current(g);
    $('#cur').innerHTML = cur ? A.iconSVG(cur, 74) + '<div class="cname">' + H.LABEL[cur] + '</div>' : '';
    var nx = g.queue.slice(1, 3);
    $('#nexts').innerHTML = nx.map(function (t) { return '<div class="nxi">' + A.iconSVG(t, 44) + '</div>'; }).join('') || '<span class="muted">–</span>';
    var sb = $('#stash'); sb.innerHTML = g.stash ? A.iconSVG(g.stash, 44) : '<span class="muted">swap</span>';
    sb.disabled = !(g.stash ? g.queue.length > 0 : g.queue.length > 1);
    $('#undon').textContent = '(' + g.undosLeft + ')'; $('#undo').disabled = !(g.history.length && g.undosLeft > 0);
    var pb = $('#place'); pb.disabled = !preview;
    pb.textContent = preview ? 'Place ' + H.LABEL[cur] + (preview.delta != null ? ' (' + (preview.delta >= 0 ? '+' : '') + preview.delta + ')' : '') : 'Tap a hex';
    var n = $('#curtile'); void n;
  }
  function tween(el, from, to) {
    var t0 = performance.now(), dur = 450;
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    (function step(t) {
      var p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  function onCell(q, r) {
    if (busy || !g || H.isOver(g)) return;
    if (g.board[H.key(q, r)]) { AU.play('error'); return; }
    if (preview && preview.q === q && preview.r === r) return confirmPlace();
    var old = preview; preview = { q: q, r: r };
    if (old) drawCell(old.q, old.r);
    drawCell(q, r); AU.play('preview'); refreshHud(true);
  }
  function confirmPlace() {
    if (!preview || busy) return;
    var p = preview, before = H.gameScore(g);
    preview = null;
    var t = H.place(g, p.q, p.r);
    if (!t) return;
    var after = H.gameScore(g), diff = H.diffParts(before, after), total = after.total - before.total;
    drawCell(p.q, p.r, true);
    AU.play('place'); vib(12);
    var old = $('#fx'); while (old.firstChild) old.removeChild(old.firstChild);
    if (diff.length) popup(p.q, p.r, total, diff);
    refreshHud(false); saveProgress();
    if (diff.length >= 3) AU.play('big'); else if (total > 0) setTimeout(function () { AU.play('combo', diff.length); }, 120);
    if (H.isOver(g)) { busy = true; setTimeout(finishGame, 1300); }
  }
  var POP_LABEL = { grove: 'Grove', pasture: 'Pasture', river: 'River', windmill: 'Windmill', house: 'Cosy home', market: 'Market', request: 'Request done!' };
  function popup(q, r, total, diff) {
    var c = A.center(q, r), fx = $('#fx');
    var lines = diff.map(function (d) { return POP_LABEL[d.key] + ' ' + (d.delta > 0 ? '+' : '') + d.delta; });
    var big = (total >= 0 ? '+' : '') + total;
    var el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    el.setAttribute('data-testid', 'popup');
    var w = Math.max(60, Math.max.apply(null, lines.map(function (l) { return l.length * 6.4 + 16; }).concat([40])));
    var h = 24 + lines.length * 14, x = Math.max(-170 + w / 2, Math.min(170 - w / 2, c.x)), y = c.y - 62 - h / 2;
    var html = '<g class="pop"><rect x="' + (-w / 2) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '" rx="12" fill="#fffaf0" stroke="#e07a5f" stroke-width="1.8"/>' +
      '<text y="' + (-h / 2 + 18) + '" text-anchor="middle" font-size="17" font-weight="900" fill="#c4553f">' + big + '</text>';
    lines.forEach(function (l, i) { html += '<text y="' + (-h / 2 + 32 + i * 14) + '" text-anchor="middle" font-size="10.5" font-weight="700" fill="#6b4a33">' + esc(l) + '</text>'; });
    html += '</g>';
    el.innerHTML = html; el.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')');
    fx.appendChild(el); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2100);
  }
  function doUndo() {
    if (busy) return;
    var before = Object.keys(g.board);
    if (!H.undo(g)) { AU.play('error'); return; }
    preview = null; redrawAll(); refreshHud(false); AU.play('undo'); saveProgress();
    void before;
  }
  function doStash() {
    if (busy) return;
    if (!H.stash(g)) { AU.play('error'); return; }
    var old = preview; if (old) { preview = { q: old.q, r: old.r }; }
    redrawAll(); refreshHud(true); AU.play('stash'); saveProgress();
  }

  /* ---------------- FINISH + SUMMARY ---------------- */
  function finishGame() {
    var sc = H.gameScore(g), st = H.stars(sc.total), res = null;
    var info = { score: sc.total, stars: st, parts: sc.parts, requestsDone: sc.requestsDone, rank: H.rank(sc.total), date: dateKey, number: daily.number };
    var items = [];
    if (counted) {
      var s2 = H.streakOnComplete(streak(), dateKey); ST.set('streak', s2); info.streak = s2.streak;
      items = H.villageReward(daily, sc.total, sc.requestsDone); info.items = items;
      var v = village(); items.forEach(function (it) { v.push({ kind: it.kind, type: it.type, date: dateKey }); }); ST.set('village', v);
      if (sc.total > ST.get('best', 0)) ST.set('best', sc.total);
      info.share = H.shareString(daily, g.board, sc.total, { requestsDone: sc.requestsDone, streak: s2.streak }) + '\n' + GAME_URL;
      var all = results(); all[dateKey] = info; ST.set('results', all);
      try { window.localStorage.removeItem('hexglen.v1.game.' + dateKey); } catch (e) {}
    } else {
      info.share = H.shareString(daily, g.board, sc.total, { requestsDone: sc.requestsDone }) + '\n' + GAME_URL;
      info.practice = true; info.items = [];
    }
    window.__hhLastResult = info;
    renderSummary(info, false);
  }
  function renderSummary(info, fromSaved) {
    daily = H.generateDaily(info.date || dateKey);
    var rows = Object.keys(H.PART_LABEL).filter(function (k) { return info.parts[k] > 0; }).map(function (k) {
      return '<li><span>' + H.PART_LABEL[k] + '</span><b>' + info.parts[k] + '</b></li>';
    }).join('');
    var items = (info.items || []).map(function (it) { return '<span class="got">' + A.villageItem(it.kind, it.type) + '</span>'; }).join('');
    var w = H.weatherById(daily.weather);
    view.innerHTML =
      '<section class="screen summary">' +
      '<header class="shead"><div class="dnum">Puzzle #' + info.number + (info.practice ? ' <em>practice</em>' : '') + '</div><div class="ddate">' + info.date + ' · ' + w.icon + ' ' + w.name + '</div></header>' +
      '<div class="bigscore"><div class="bs" id="bs" data-testid="final-score">0</div><div class="rank" data-testid="rank">' + esc(info.rank) + '</div>' + starStr(0) + '</div>' +
      '<div class="card"><ul class="breakdown">' + rows + '</ul><div class="reqsum">' + daily.requests.map(function (r, i) { return '<div>' + (info.requestsDone[i] ? '✅' : '▫️') + ' ' + esc(H.requestDef(r.tier, r.id).text) + '</div>'; }).join('') + '</div></div>' +
      (items ? '<div class="card"><h2>Added to your village</h2><div class="village got-row">' + items + '</div></div>' : (info.practice ? '<div class="card"><p class="muted">Practice runs don\'t score for the leaderboard, streak or village.</p></div>' : '')) +
      '<div class="card share"><h2>Share your result</h2><pre id="sharetxt" data-testid="share">' + esc(info.share) + '</pre>' +
      '<div class="row"><button class="btn primary" id="copy" data-testid="copy">Copy</button><button class="btn" id="shr">Share</button></div></div>' +
      '<div class="row"><button class="btn ghost" id="home">Home</button>' + (info.practice ? '' : '<button class="btn ghost" id="again">Play again for fun</button>') + '</div>' +
      '</section>';
    var bs = $('#bs'), t0 = performance.now(), target = info.score, dur = fromSaved ? 0 : 1100;
    (function step(t) { var p = dur ? Math.min(1, (t - t0) / dur) : 1; bs.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(t0);
    var starsEl = $('.bigscore .stars');
    for (var i = 0; i < 3; i++) (function (i) {
      setTimeout(function () { var s = starsEl.children[i]; if (i < info.stars) { s.classList.add('on', 'pop'); if (!fromSaved) AU.play('star', i); } }, fromSaved ? 0 : 900 + i * 380);
    })(i);
    if (!fromSaved) setTimeout(function () { AU.play('finish'); }, 300);
    $('#copy').onclick = function () {
      var txt = info.share;
      var done = function () { toast('Copied! Paste it anywhere.'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { legacyCopy(txt); done(); });
      else { legacyCopy(txt); done(); }
      AU.play('tap');
    };
    $('#shr').onclick = function () {
      if (navigator.share) navigator.share({ text: info.share }).catch(function () {});
      else { $('#copy').click(); }
    };
    $('#home').onclick = function () { renderHome(); };
    var ag = $('#again'); if (ag) ag.onclick = function () { startGame(true); };
  }
  function legacyCopy(txt) {
    var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta);
  }

  window.__hh = { H: H, state: function () { return g; }, date: function () { return dateKey; } };
  renderHome();
})();
