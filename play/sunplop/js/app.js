/* Sunplop app: daily puzzle + endless levels, streaks, stars, wallet, shop. Plain JS, no build step.
 * Starts after the durable save is loaded (synchronously on the web, after @capacitor/preferences in the app). */
SunplopStore.whenReady(function () {
  'use strict';
  var E = window.SunplopEngine, T = I18N.t, EC = Economy.ECONOMY;
  var EPOCH = '2026-11-01';          // daily puzzle #1
  var STORE_KEY = 'sunplop:v2';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var params = new URLSearchParams(location.search);

  // ---------- icons ----------
  var ICON = {
    sun: '<svg class="sun" viewBox="0 0 40 40"><g stroke="#FFB020" stroke-width="3.2" stroke-linecap="round"><path d="M20 2.5v5M20 32.5v5M2.5 20h5M32.5 20h5M7.6 7.6l3.5 3.5M28.9 28.9l3.5 3.5M7.6 32.4l3.5-3.5M28.9 11.1l3.5-3.5"/></g><circle cx="20" cy="20" r="9.5" fill="#FFC83D" stroke="#FF9F1C" stroke-width="2"/></svg>',
    coin: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10.5" fill="#FFB020"/><circle cx="12" cy="12" r="8" fill="#FFD25C"/><g stroke="#E58A00" stroke-width="1.6" stroke-linecap="round"><path d="M12 5.5v2M12 16.5v2M5.5 12h2M16.5 12h2M7.4 7.4l1.4 1.4M15.2 15.2l1.4 1.4M7.4 16.6l1.4-1.4M15.2 8.8l1.4-1.4"/></g><circle cx="12" cy="12" r="3" fill="#E58A00"/></svg>',
    flame: '<svg viewBox="0 0 24 24"><path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.4 1.2-3.8 2.3-5 .2 1.6.9 2.6 1.9 3C11 8 11 5 12 2z" fill="#FF6B2C"/><path d="M12 12c.6 2 2.5 2.6 2.5 5a2.5 2.5 0 0 1-5 0c0-1.5.9-2.5 2.5-5z" fill="#FFC83D"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',
    clear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
    today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>',
    archive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    cloud: '<svg viewBox="0 0 40 40" class="cloud-ic"><path d="M12 30h17a7 7 0 0 0 .6-14 9 9 0 0 0-17.2 2.6A5.8 5.8 0 0 0 12 30z" fill="#fff" stroke="#B9C6D8" stroke-width="2"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/></svg>',
    skip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5l9 7-9 7zM18 5v14"/></svg>',
    levels: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><circle cx="17.25" cy="17.25" r="3.5"/></svg>',
    shop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M4 8h16l-1.3 11.2a2 2 0 0 1-2 1.8H7.3a2 2 0 0 1-2-1.8z"/><path d="M8.5 10V6.5a3.5 3.5 0 0 1 7 0V10"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };
  var coinSvg = function (sz) { return ICON.coin.replace('<svg', '<svg width="' + sz + '" height="' + sz + '"'); };
  var coinHtml = function (n) { return '<span class="pill">' + ICON.coin + n + '</span>'; };
  function starsHtml(n, cls) { var h = '<span class="stars ' + (cls || '') + '">'; for (var i = 0; i < 3; i++) h += '<i class="' + (i < n ? 'on' : '') + '">' + ICON.star + '</i>'; return h + '</span>'; }

  // ---------- dates ----------
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function keyOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseKey(k) { var a = k.split('-').map(Number); return new Date(a[0], a[1] - 1, a[2]); }
  function addDays(k, n) { var d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); }
  function dayDiff(a, b) { return Math.round((parseKey(b) - parseKey(a)) / 864e5); }
  function todayKey() { var o = params.get('date'); return /^\d{4}-\d\d-\d\d$/.test(o || '') ? o : keyOf(new Date()); }
  function puzzleNo(k) { return dayDiff(EPOCH, k) + 1; }
  function fmtDate(k) { try { return parseKey(k).toLocaleDateString(I18N.lang, { weekday: 'short', month: 'short', day: 'numeric' }); } catch (e) { return k; } }
  function fmtTime(s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + pad(s % 60); }

  // ---------- persistence ----------
  function fresh() {
    return { wallet: 0, jokers: 0, daily: {}, levels: {}, progress: {}, unlockedTo: 1, chapterBonus: {}, seenIntro: {},
      jokered: {}, declined: {}, milestones: {}, best: 0, sinceAd: 0, ads: { date: '', n: 0 }, owned: {},
      settings: { lang: null, sound: true, music: false, sfxVol: 0.8, musicVol: 0.35, seenHelp: false,
        reminder: false, reminderTime: '19:00', reminderAsks: 0, reminderAskedAt: 0, reminderDenied: false }, welcomed: false, levelSet: 4, iap: { granted: {}, waivers: [] } };
  }
  var db;
  try { var raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); db = Object.assign(fresh(), raw); if (raw.wallet != null && !raw.levelSet) db.levelSet = 2; } catch (e) { db = fresh(); }
  // Level set v2 had a 25-level 4x4 chapter 1; v3 keeps 10 of those and every later level moved down by 15.
  // Move records by puzzle identity (E.fromLegacy); Rays already earned stay in the wallet.
  function migrateLevelSet() { migrateV2toV3(); migrateV3toV4(); }
  // v4 replaced the puzzles of chapters 3 and 9 (level numbers unchanged). Records follow the puzzle: the old stars/best
  // time/in-progress board of a replaced level are dropped, but a level that was done stays done (marked like a skip), so
  // unlocks, chapter completion and the already-paid chapter bonus are unchanged. Rays already earned stay. Replaying earns stars again.
  function migrateV3toV4() {
    if (db.levelSet >= 4) return;
    var n = 0;
    Object.keys(db.levels || {}).forEach(function (k) {
      if (!E.isV4Level(+k)) return;
      var r = db.levels[k]; if (r && (r.stars || r.skipped)) { db.levels[k] = { stars: 0, best: null, skipped: true, replaced: true }; n++; } else delete db.levels[k];
    });
    Object.keys(db.progress || {}).forEach(function (k) { var m = /^level:(\d+)$/.exec(k); if (m && E.isV4Level(+m[1])) delete db.progress[k]; });
    db.migratedV3 = { replacedRecords: n }; db.levelSet = 4; save();
  }
  function migrateV2toV3() {
    if (db.levelSet >= 3) return;
    var lv = {}, pr = {}, dropped = 0, u = +db.unlockedTo || 1;
    Object.keys(db.levels || {}).forEach(function (k) { var n = E.fromLegacy(k); if (n) lv[n] = db.levels[k]; else dropped++; });
    Object.keys(db.progress || {}).forEach(function (k) { var m = /^level:(\d+)$/.exec(k), n = m && E.fromLegacy(m[1]); if (n) pr['level:' + n] = db.progress[k]; else if (!m) pr[k] = db.progress[k]; });
    var nu;
    if (u > 25) nu = E.fromLegacy(u);
    else { nu = E.FIRST_CHAPTER_SIZE + 1; for (var j = 1; j <= E.FIRST_CHAPTER_SIZE; j++) if (E.CH1_PICK[j - 1] >= u) { nu = j; break; } }
    db.levels = lv; db.progress = pr; db.unlockedTo = Math.max(1, Math.min(nu, E.TOTAL_LEVELS));
    db.migratedV2 = { droppedCh1Records: dropped, oldUnlockedTo: u };
    db.levelSet = 3; save();
  }
  migrateLevelSet();
  db.settings = Object.assign(fresh().settings, db.settings || {});
  // seenIntro used to be keyed by chapter number; it is now keyed by feature ('size5', 'cloud', 'plus').
  Object.keys(db.seenIntro || {}).forEach(function (k) { if (/^\d+$/.test(k)) { introKeys(E.chapterInfo(+k)).forEach(function (f) { db.seenIntro[f] = true; }); delete db.seenIntro[k]; } });
  function save() { if (deleting) return; try { SunplopStore.write(STORE_KEY, JSON.stringify(db)); } catch (e) {} }
  I18N.setLang(db.settings.lang || I18N.detect());
  var COUNTRY = Economy.detectCountry();

  // ---------- puzzles ----------
  var pcache = {};
  function getPuzzle(id) {
    if (pcache[id]) return pcache[id];
    var parts = id.split(':');
    return (pcache[id] = parts[0] === 'daily' ? E.getDaily(parts[1]) : E.getLevel(+parts[1]));
  }
  function levelDone(L) { var r = db.levels[L]; return !!(r && (r.stars || r.skipped)); }
  function totalStars() { var s = 0; for (var k in db.levels) s += db.levels[k].stars || 0; return s; }
  function chapterStats(ch) {
    var done = 0, stars = 0;
    for (var L = E.chapterStart(ch); L <= E.chapterEnd(ch); L++) { var r = db.levels[L]; if (r && (r.stars || r.skipped)) done++; if (r) stars += r.stars || 0; }
    return { done: done, stars: stars };
  }
  function currentLevel() { return Math.min(db.unlockedTo, E.TOTAL_LEVELS); }

  // ---------- streaks ----------
  function inStreak(k) { var r = db.daily[k]; return !!((r && r.onDay) || db.jokered[k]); }
  function streakEnding(k) { var n = 0; while (inStreak(k) && n < 5000) { n++; k = addDays(k, -1); } return n; }
  function currentStreak() { var t = todayKey(); return inStreak(t) ? streakEnding(t) : streakEnding(addDays(t, -1)); }
  function brokenStreak() {
    var t = todayKey();
    if (inStreak(addDays(t, -1))) return null;
    for (var gap = 1; gap <= EC.jokerMaxMissedDays; gap++) {
      var d = addDays(t, -(gap + 1));
      if (inStreak(d)) { var len = streakEnding(d); return (len >= EC.jokerMinStreak && !db.declined[d]) ? { last: d, len: len, missed: gap } : null; }
    }
    return null;
  }
  function restoreStreak(b) { for (var i = 1; i <= b.missed; i++) db.jokered[addDays(b.last, i)] = true; db.best = Math.max(db.best, currentStreak()); save(); }

  // ---------- wallet ----------
  function addCoins(n) { db.wallet += n; save(); updateChips(true); }
  function spend(n) { if (db.wallet < n) { snd('error'); toast(T('not_enough')); return false; } db.wallet -= n; save(); updateChips(true); return true; }
  function adsLeft() { if (db.ads.date !== todayKey()) db.ads = { date: todayKey(), n: 0 }; return EC.adsPerDay - db.ads.n; }

  // ---------- sound / haptics ----------
  // ElevenLabs-generated SFX + music live in js/audio.js (GameAudio); this is the game-side mapping.
  var Snd = window.GameAudio || { play: function () {}, configure: function () {}, preload: function () {}, unlock: function () {}, setHidden: function () {} };
  function snd(name, opts) { Snd.play(name, opts); }
  Snd.configure(db.settings); Snd.preload();
  var STAR_RATE = [1, 1.122, 1.26];   // stars 1-3: same chime, rising a major second / third
  function buzz(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }

  // ---------- UI helpers ----------
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 1900); }
  function modal(html, onMount, opts) {
    var root = $('#modal-root'), wrap = document.createElement('div');
    wrap.className = 'backdrop' + (opts && opts.cls ? ' ' + opts.cls : ''); wrap.innerHTML = '<div class="sheet">' + html + '</div>';
    root.appendChild(wrap); Ads.bannerPause(true);
    var closed = false;
    var close = function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); if (!closed) { closed = true; Ads.bannerPause(false); } };
    wrap._close = close; if (opts && opts.sticky) wrap.dataset.sticky = '1';
    if (!(opts && opts.sticky)) wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    if (onMount) onMount(wrap.firstChild, close);
    return close;
  }
  function updateChips(bump) {
    var c = $('#chip-coins'); c.innerHTML = ICON.coin + '<span>' + db.wallet + '</span>';
    $('#chip-streak').innerHTML = ICON.flame + '<span>' + currentStreak() + '</span>';
    if (bump) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
    $('#ad-banner').classList.toggle('hidden', !!db.owned.no_ads || !Ads.enabled);
    Ads.setBanner(!db.owned.no_ads && Ads.enabled);
  }
  function confetti() {
    var cv = $('#fx'), ctx = cv.getContext('2d'), W = cv.width = innerWidth * devicePixelRatio, H = cv.height = innerHeight * devicePixelRatio;
    var cols = ['#FFC83D', '#FF9F1C', '#FF7A3D', '#3FB57A', '#8FD3FF', '#ffffff'], parts = [];
    for (var i = 0; i < 140; i++) parts.push({ x: W / 2, y: H * 0.45, vx: (Math.random() - 0.5) * 26 * devicePixelRatio, vy: (-Math.random() * 22 - 6) * devicePixelRatio,
      r: (Math.random() * 5 + 3) * devicePixelRatio, c: cols[i % cols.length], a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, sq: Math.random() < 0.5 });
    var t0 = performance.now();
    (function frame(t) {
      ctx.clearRect(0, 0, W, H);
      parts.forEach(function (p) {
        p.vy += 0.6 * devicePixelRatio; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c;
        if (p.sq) ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 7); ctx.fill(); }
        ctx.restore();
      });
      if (t - t0 < 2600) requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
    })(t0);
  }

  // ---------- navigation ----------
  var tab = 'today', G = null, timerInt = null, openCh = null;
  function renderTabs() {
    var tabs = [['today', ICON.today], ['levels', ICON.levels], ['shop', ICON.shop]];
    $('#tabbar').innerHTML = tabs.map(function (t) {
      return '<button class="tab' + (tab === t[0] && !G ? ' active' : '') + '" data-tab="' + t[0] + '">' + t[1] + '<span>' + T('tab_' + t[0]) + '</span></button>';
    }).join('');
  }
  function go(t) { leaveGame(); tab = t; render(); }
  function leaveToMap() { var wasLevel = G && G.mode === 'level'; if (wasLevel) openCh = E.chapterOf(G.L); go(wasLevel ? 'levels' : 'today'); }
  // Android / browser back button: one sentinel history entry. Back closes the top popup, else leaves the puzzle,
  // else returns to the Today tab; only on Today with nothing open does it really go back (= exits the app in Capacitor).
  function armBack() { try { history.pushState({ sunplop: 1 }, ''); } catch (e) {} }
  function handleBack() {
    var tops = document.querySelectorAll('#modal-root > .backdrop'), top = tops[tops.length - 1];
    if (top) { if (!top.dataset.sticky && top._close) top._close(); return true; }   // sticky popups (rewards, intro) need their button
    if (G) { leaveToMap(); return true; }
    if (tab !== 'today') { go('today'); return true; }
    return false;
  }
  window.addEventListener('popstate', function () { if (handleBack()) armBack(); else history.back(); });
  var lastView = null;
  function render() {
    document.body.classList.toggle('in-game', !!G);
    renderTabs(); updateChips();
    var v = $('#view'); v.style.animation = 'none'; void v.offsetWidth; v.style.animation = '';
    // new screen -> start at the top (the level map scrolls to the current level; that scroll must not carry over)
    var key = G ? 'game:' + G.id : tab; if (key !== lastView) { lastView = key; window.scrollTo(0, 0); }
    if (G) return renderGame();
    ({ today: renderToday, levels: renderLevels, shop: renderShop })[tab]();
    if (tab === 'levels') { var cur = $('.lvl.current'); if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'center' }); }
  }

  // ---------- Today ----------
  function renderToday() {
    var t = todayKey(), r = db.daily[t], solved = r && r.solved;
    var h = '<div class="h1">' + fmtDate(t) + '</div><div class="sub">' + T('tagline') + '</div>';
    var b = brokenStreak();
    if (b) h += '<div class="card joker-banner row" data-act="joker"><div style="font-size:30px">🃏</div><div style="flex:1"><b>' + T('joker_title') + '</b><br><small>' +
      T('joker_body', { n: b.len }) + '</small></div><button class="btn white sm">→</button></div>';
    h += '<div class="card hero"><svg class="big-sun" viewBox="0 0 40 40">' + ICON.sun.replace(/^<svg[^>]*>|<\/svg>$/g, '') + '</svg>' +
      '<div class="pill on-dark">☀ #' + puzzleNo(t) + ' · 6×6</div><h2>' + T('main_title') + '</h2><div class="meta">' + T('main_sub') + '</div>' +
      '<div class="row">' + (solved ? '<span class="btn white" data-open="daily:' + t + '">' + ICON.check + fmtTime(r.time) + '</span>' :
        '<button class="btn white" data-open="daily:' + t + '">' + T(r && r.board ? 'resume' : 'play') + '</button><span class="pill on-dark">' + ICON.coin + '+' + EC.daily.base + '</span>') + '</div></div>';
    var L = currentLevel(), ch = E.chapterOf(L), st = chapterStats(ch), info = E.levelConfig(L);
    h += '<div class="card cont-card" data-level="' + L + '"><div class="cont-num">' + L + '</div><div style="flex:1"><div class="pill">' + T('chapter', { n: ch }) + ' · ' + info.n + '×' + info.n + '</div>' +
      '<div class="bar"><i style="width:' + Math.round(st.done / E.chapterSize(ch) * 100) + '%"></i></div><small class="muted">' + st.done + '/' + E.chapterSize(ch) + ' · ★ ' + st.stars + '/' + (E.chapterSize(ch) * 3) + '</small></div>' +
      '<button class="btn">' + T('continue_level') + '</button></div>';
    h += '<div class="card streak-card"><div class="row"><span class="flame">' + ICON.flame.replace('<svg', '<svg width="40" height="40"') + '</span>' +
      '<div class="stat" style="text-align:left"><b>' + currentStreak() + '</b><span>' + T('streak') + '</span></div></div>' +
      '<div class="stat"><b>' + Math.max(db.best, currentStreak()) + '</b><span>' + T('best') + '</span></div>' +
      '<div class="stat"><b>' + totalStars() + '</b><span>★</span></div>' +
      '<div class="stat"><b>' + db.jokers + '</b><span>🃏</span></div></div>';
    $('#view').innerHTML = h;
  }

  // ---------- Levels map ----------
  function chapterBadges(ch) {
    var info = E.chapterInfo(ch), b = '<span class="pill">' + info.n + '×' + info.n + '</span>';
    if (info.plus) b += '<span class="pill green">+</span>';
    if (info.clouds && (info.clouds[0] || info.clouds[1])) b += '<span class="pill sky">☁</span>';
    if (info.intro && info.intro !== 'basics') b += '<span class="pill new">' + T('intro_new') + '</span>';
    return b;
  }
  function renderLevels() {
    var cur = currentLevel(), curCh = E.chapterOf(cur), lastCh = E.TOTAL_CHAPTERS, showTo = Math.min(lastCh, curCh + 3);
    if (openCh == null) openCh = curCh;
    var h = '<div class="row" style="justify-content:space-between"><div class="h1">' + T('levels_title') + '</div><span class="pill big">★ ' + totalStars() + '</span></div>' +
      '<div class="sub">' + T('level', { n: cur }) + ' / ' + E.TOTAL_LEVELS + '</div>';
    for (var ch = 1; ch <= showTo; ch++) {
      var st = chapterStats(ch), locked = E.chapterStart(ch) > cur, size = E.chapterSize(ch);
      h += '<div class="card chapter' + (locked ? ' locked' : '') + (ch === openCh ? ' open' : '') + '"><div class="ch-head" data-ch="' + ch + '">' +
        '<div><b>' + T('chapter', { n: ch }) + '</b><div class="badges">' + chapterBadges(ch) + '</div></div>' +
        (locked ? '<span class="muted">' + ICON.lock + '</span>' : '<div class="ch-prog"><small>' + st.done + '/' + size + '</small><small>★ ' + st.stars + '/' + size * 3 + '</small></div>') + '</div>';
      if (ch === openCh && !locked) {
        h += '<div class="lvl-grid">';
        for (var L = E.chapterStart(ch); L <= E.chapterEnd(ch); L++) {
          var r = db.levels[L], isCur = L === cur && !levelDone(L), lk = L > cur;
          h += '<button class="lvl' + (isCur ? ' current' : '') + (lk ? ' lk' : '') + (r && r.skipped && !r.stars ? ' skipped' : '') + '" data-level="' + L + '"' + (lk ? ' disabled' : '') + '><b>' + L + '</b>' +
            (lk ? ICON.lock : starsHtml(r ? r.stars || 0 : 0, 'tiny')) + '</button>';
        }
        h += '</div>';
      }
      h += '</div>';
    }
    if (showTo < lastCh) h += '<div class="region">' + T('more_chapters', { n: lastCh - showTo, m: E.TOTAL_LEVELS }) + '</div>';
    $('#view').innerHTML = h;
  }

  // ---------- Shop ----------
  // Prices: in the store build they come from the store (localised, tax-inclusive priceString via RevenueCat);
  // the PRICE_TABLE / country detection in economy.js is only used in simulated test mode.
  var MOCK = IAP.mode !== 'store';
  function product(sku) { return Economy.PRODUCTS.find(function (x) { return x.sku === sku; }); }
  function priceText(sku) {
    if (MOCK) return IAP.mode === 'unavailable' ? null : Economy.priceFor(sku, COUNTRY).text;
    var sp = IAP.storeProduct(product(sku)); return sp ? sp.priceString : null;
  }
  /** approx. real-money value of n Rays at the base pack rate (EU CPC virtual-currency principles) */
  function rayValue(n) {
    var base = product('rays_200'), amount, cur;
    if (MOCK) { var pr = Economy.priceFor('rays_200', COUNTRY); amount = pr.amount; cur = pr.currency; }
    else { var sp = IAP.storeProduct(base); if (!sp) return ''; amount = sp.price; cur = sp.currencyCode; }
    if (!(amount > 0) || !cur) return '';
    try { return T('approx', { v: new Intl.NumberFormat(I18N.lang, { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(amount * n / base.coins) }); } catch (e) { return ''; }
  }
  function approxTag(n) { var v = rayValue(n); return v ? ' <small class="approx">' + v + '</small>' : ''; }
  function buyBtn(sku, cls) {
    var t = priceText(sku);
    return '<button class="btn ' + (cls || '') + '" data-buy="' + sku + '"' + (t ? '' : ' disabled') + '>' + (t || T('unavailable')) + '</button>';
  }
  function linkBtn(kind) { return '<button class="link" data-policy="' + kind + '">' + T(kind) + '</button>'; }
  function renderShop() {
    var P = Economy.PRODUCTS;
    var h = '<div class="h1">' + T('shop_title') + '</div><div class="balance">' + ICON.coin + db.wallet + '</div>' +
      (MOCK ? '<div class="mock-note">🧪 ' + T(IAP.mode === 'unavailable' ? 'store_unavailable' : 'shop_mock') + '</div>' : '');
    if (!db.owned.starter) h += '<div class="card starter"><div style="font-size:38px">🎁</div><div class="txt"><b>' + T('starter') + '</b><br><small style="font-weight:800">' +
      T('starter_desc', { coins: 500 }) + '</small></div>' + buyBtn('starter') + '</div>';
    h += '<div class="section-t">' + T('shop_free') + '</div><div class="card item"><div class="ic" style="background:#E9F6FF">▶️</div><div class="txt"><b>' + T('shop_ad') + '</b><small>' +
      T('shop_ad_left', { n: adsLeft() }) + '</small></div><button class="btn green sm" data-ad="coins"' + (adsLeft() <= 0 ? ' disabled' : '') + '>' + coinSvg(18) + '+' + EC.adReward + '</button></div>';
    h += '<div class="section-t">' + T('shop_packs') + '</div><div class="grid2">';
    P.filter(function (p) { return p.kind === 'pack'; }).forEach(function (p, i) {
      var art = ''; for (var j = 0; j < i + 1; j++) art += ICON.coin;
      h += '<div class="card pack' + (p.tag ? ' tagged' : '') + '">' + (p.tag ? '<div class="tag">' + T(p.tag) + '</div>' : '') +
        '<div class="art">' + art + '</div><div class="amt">' + p.coins.toLocaleString() + '</div><div class="name">' + T(p.name) + '</div>' +
        '<div class="bonus">' + (p.bonus ? T('bonus_pct', { n: p.bonus }) : '') + '</div>' + buyBtn(p.sku, 'sm') + '</div>';
    });
    h += '</div><div class="section-t">' + T('shop_items') + '</div>';
    var jv = rayValue(EC.costs.joker);
    h += '<div class="card item"><div class="ic">🃏</div><div class="txt"><b>' + T('joker_name') + '</b><small>' + T('joker_desc') + ' · ' + T('owned', { n: db.jokers }) + '</small></div>' +
      '<button class="btn ghost sm" data-joker-buy>' + coinSvg(18) + EC.costs.joker + (jv ? '<small class="approx">' + jv + '</small>' : '') + '</button></div>';
    if (!db.owned.no_ads) h += '<div class="card item"><div class="ic" style="background:#FFF0E6">🚫</div><div class="txt"><b>' + T('noads_name') + '</b><small>' + T('noads_desc') + '</small></div>' +
      buyBtn('no_ads', 'sm') + '</div>';
    h += '<div class="shop-foot">' + T('shop_footer') + ' ' + linkBtn('terms') + '</div>';
    if (IAP.mode === 'mock') { var pr = Economy.priceFor('rays_200', COUNTRY); h += '<div class="region">' + T('region', { r: COUNTRY + ' · tier ' + pr.tier + ' · ' + pr.currency }) + '</div>'; }
    $('#view').innerHTML = h;
  }
  /** Credit a confirmed transaction exactly once (idempotent by transaction ID, also across restores). */
  function grant(sku, txId) {
    var p = product(sku); if (!p) return false;
    db.iap = db.iap || { granted: {}, waivers: [] };
    if (txId && db.iap.granted[txId]) { if (p.oneTime) db.owned[sku] = true; return false; }
    if (p.coins) db.wallet += p.coins;
    if (p.jokers) db.jokers += p.jokers;
    if (p.oneTime) db.owned[sku] = true;
    if (txId) db.iap.granted[txId] = { sku: sku, coins: p.coins || 0, jokers: p.jokers || 0, at: Date.now() };
    save(); return true;
  }
  /** EU/UK storefronts: separate consent to immediate delivery (withdrawal-right waiver) before the store sheet. */
  function waiverStep(sku, name, priceTxt) {
    if (!IAP.needsWithdrawalWaiver(COUNTRY)) return Promise.resolve(true);
    return new Promise(function (res) {
      modal('<h2>' + T('waiver_title') + '</h2><p><b>' + name + '</b> · ' + priceTxt + '</p><label class="waiver"><input type="checkbox" id="waiver-ok"> <span>' + T('waiver_text') + '</span></label>' +
        '<div class="actions"><button class="btn block" data-y disabled>' + T('buy') + '</button><button class="btn ghost block" data-n>' + T('cancel') + '</button></div>', function (el, close) {
        var cb = el.querySelector('#waiver-ok'), y = el.querySelector('[data-y]');
        cb.onchange = function () { y.disabled = !cb.checked; };
        y.onclick = function () { if (!cb.checked) return; db.iap.waivers.push({ t: new Date().toISOString(), sku: sku, storefront: IAP.storefront || COUNTRY }); if (db.iap.waivers.length > 50) db.iap.waivers.shift(); save(); close(); res(true); };
        el.querySelector('[data-n]').onclick = function () { close(); res(false); };
      }, { sticky: true });
    });
  }
  var buying = false;
  function buy(sku) {
    var p = product(sku), priceTxt = priceText(sku); if (!p || !priceTxt || buying) return;
    if (p.oneTime && db.owned[sku]) return toast(T('already_owned'));
    var name = p.kind === 'pack' ? p.coins + ' ' + T('currency') : T(p.name);
    buying = true;
    waiverStep(sku, name, priceTxt).then(function (go) {
      if (!go) return { ok: false, cancelled: true };
      return IAP.purchase(p, function () {
        return new Promise(function (res) {   // simulated test mode only: stands in for the store's own purchase sheet
          modal('<h2>🧪 ' + T('confirm_title') + '</h2><p>' + T('confirm_body', { item: name, price: priceTxt }) + '</p><div class="actions"><button class="btn block" data-y>' +
            T('confirm') + '</button><button class="btn ghost block" data-n>' + T('cancel') + '</button></div>', function (el, close) {
            el.querySelector('[data-y]').onclick = function () { close(); res(true); };
            el.querySelector('[data-n]').onclick = function () { close(); res(false); };
          }, { sticky: true });
        });
      });
    }).then(function (r) {
      buying = false; Ads.lastDialogAt = Date.now();   // never an interstitial right after a purchase
      if (r.ok) {
        grant(sku, r.transactionId);
        if (r.customerInfo) onCustomerInfo(r.customerInfo);
        snd('purchase'); confetti(); toast(T('bought')); render(); updateChips(true); return;
      }
      if (r.cancelled) return;
      if (r.pending) return toast(T('purchase_pending'));
      if (r.alreadyOwned) return restorePurchases();
      toast(T(r.error === 'unavailable' || r.error === 'product_not_loaded' ? 'store_unavailable' : 'purchase_failed'));
    }, function () { buying = false; toast(T('purchase_failed')); });
  }
  /** Store state -> local state: No ads entitlement (every launch, restore, reinstall), Starter record, refunds. */
  function onCustomerInfo(info) {
    if (!info) return;
    var C = SUNPLOP_CONFIG.purchases, changed = false;
    var noAds = IAP.hasEntitlement(info, C.noAdsEntitlement);
    if (noAds && !db.owned.no_ads) { db.owned.no_ads = true; changed = true; }
    var txs = IAP.transactions(info), ids = {};
    txs.forEach(function (t) { ids[t.transactionIdentifier] = t.productIdentifier; });
    // no_ads refunded/revoked: entitlement gone although we granted it from a store transaction
    if (!noAds && db.owned.no_ads && Object.keys(db.iap.granted).some(function (k) { return db.iap.granted[k].sku === 'no_ads' && !/^MOCK-/.test(k); }) && txs.length) { db.owned.no_ads = false; changed = true; }
    // refunded consumables / starter: the store lists FEWER transactions for a product than we credited. Counting per product
    // (not only matching IDs) means an ID format difference between purchase and history can never deduct Rays by mistake.
    // Only credits >10 min old whose ID is missing from the list are deducted, at most the missing count.
    if (txs.length) Economy.PRODUCTS.forEach(function (p) {
      var sid = IAP.storeId(p), listed = txs.filter(function (t) { return t.productIdentifier === sid; }).length;
      var mine = Object.keys(db.iap.granted).filter(function (k) { var g = db.iap.granted[k]; return g.sku === p.sku && !g.refunded && !/^MOCK-/.test(k); });
      var excess = mine.length - listed; if (excess <= 0) return;
      mine.filter(function (k) { return !ids[k] && Date.now() - db.iap.granted[k].at >= 600000; }).slice(0, excess).forEach(function (k) {
        var g = db.iap.granted[k]; g.refunded = true; db.wallet -= g.coins; db.jokers = Math.max(0, db.jokers - g.jokers); changed = true; toast(T('refunded'));
      });
    });
    if (changed) { save(); render(); updateChips(true); }
  }
  IAP.onChange = onCustomerInfo;
  function restorePurchases() {
    if (MOCK) { toast(T(db.owned.no_ads ? 'restored_noads' : 'restored_none')); return Promise.resolve(); }
    return IAP.restore().then(function (info) {
      if (!info) return toast(T('store_error'));
      var had = !!db.owned.no_ads; onCustomerInfo(info);
      // Starter: non-consumable. If the local save was wiped, re-grant once (Terms 3.6); grant() is idempotent per transaction.
      IAP.transactions(info).forEach(function (t) { var p = Economy.PRODUCTS.find(function (x) { return IAP.storeId(x) === t.productIdentifier && x.oneTime; }); if (p) grant(p.sku, t.transactionIdentifier); });
      toast(T(db.owned.no_ads && !had ? 'restored_noads' : db.owned.no_ads ? 'restored_noads' : 'restored_none')); render(); updateChips(true);
    });
  }
  function watchAd(placement) {
    return Ads.showRewarded(placement, Ads.native ? null : function () {
      return new Promise(function (res) {
        var n = 3;
        modal('<h2>' + T('ad_title') + '</h2><div class="ad-box">AD · rewarded</div><p>' + T('ad_body') + '</p><div class="actions"><button class="btn green block" data-claim disabled>' +
          T('ad_wait', { n: n }) + '</button><button class="btn ghost block" data-x>' + T('cancel') + '</button></div>', function (el, close) {
          var btn = el.querySelector('[data-claim]');
          var iv = setInterval(function () { n--; if (n <= 0) { clearInterval(iv); btn.disabled = false; btn.textContent = T('ad_claim'); } else btn.textContent = T('ad_wait', { n: n }); }, 1000);
          btn.onclick = function () { close(); res(true); };
          el.querySelector('[data-x]').onclick = function () { clearInterval(iv); close(); res(false); };
        }, { sticky: true });
      });
    }, function () { toast(T('ad_unavailable')); });
  }
  /** Interstitial placeholder (levels only). Resolves when closed. */
  function showInterstitial() {
    return Ads.showInterstitial('level_break', function () {
      return new Promise(function (res) {
        var n = 5;
        modal('<div class="pill" style="margin:0 auto 10px;display:flex;width:max-content">' + T('ad_interstitial') + '</div><div class="ad-box tall">AD · interstitial<br><small>placeholder, no SDK</small></div>' +
          '<div class="actions"><button class="btn ghost block" data-close disabled>' + T('ad_close_in', { n: n }) + '</button></div>', function (el, close) {
          var btn = el.querySelector('[data-close]');
          var iv = setInterval(function () { n--; if (n <= 0) { clearInterval(iv); btn.disabled = false; btn.textContent = T('ad_close'); } else btn.textContent = T('ad_close_in', { n: n }); }, 1000);
          btn.onclick = function () { close(); res(); };
        }, { sticky: true, cls: 'interstitial' });
      });
    });
  }

  // ---------- Joker ----------
  function openJoker() {
    var b = brokenStreak(); if (!b) return;
    modal('<div style="font-size:64px;text-align:center">🃏</div><h2>' + T('joker_title') + '</h2><p>' + T('joker_body', { n: b.len }) + '<br><small>' + T('joker_window') + '</small></p>' +
      '<div class="actions">' + (db.jokers > 0 ? '<button class="btn block" data-use>' + T('joker_use', { n: db.jokers }) + '</button>' : '') +
      '<button class="btn ' + (db.jokers > 0 ? 'ghost' : '') + ' block" data-pay>' + coinSvg(20) + T('joker_buy', { n: EC.costs.joker }) + approxTag(EC.costs.joker) + '</button>' +
      '<button class="btn ghost block" data-no>' + T('joker_decline') + '</button></div>', function (el, close) {
      var done = function () { restoreStreak(b); close(); snd('daily_solved'); confetti(); toast(T('streak_restored')); render(); };
      var u = el.querySelector('[data-use]'); if (u) u.onclick = function () { db.jokers--; done(); };
      el.querySelector('[data-pay]').onclick = function () { if (spend(EC.costs.joker)) done(); else { close(); setTimeout(function () { go('shop'); }, 500); } };
      el.querySelector('[data-no]').onclick = function () { db.declined[b.last] = true; save(); close(); render(); };
    });
  }

  // ---------- chapter intro tutorials ----------
  function introIll(kind, n) {
    if (kind === 'cloud') return illGrid(3, ['', 's', '', 'cl', '', '', '', 'cl', 's']);
    if (kind === 'plus') return illGrid(3, ['s', 's', '', '', 'p1', '', '', '', '']) + '<div class="ill-note">✓ ↑ &nbsp; ✗ ↖</div>';
    var cells = []; for (var i = 0; i < n * n; i++) cells.push(''); return illGrid(n, cells, 12);
  }
  // Feature keys a chapter introduces: 'size5'..'size9', 'cloud', 'plus' (old saves used chapter numbers; migrated on load).
  function introKeys(info) {
    var k = [];
    if (info.n >= 5) k.push('size' + info.n);
    if (info.clouds && info.clouds[0] > 0) k.push('cloud');
    if (info.plus) k.push('plus');
    return k;
  }
  // What on THIS board is new to the player. Driven by the opened puzzle itself, so the popup always matches the
  // grid behind it, shows once per feature, and a player who skipped ahead gets one combined popup for the current level.
  function pendingIntros(p) {
    var kinds = [];
    if (p.n >= 5 && !db.seenIntro['size' + p.n]) kinds.push('size');
    if (p.cloudCount && !db.seenIntro.cloud) kinds.push('cloud');
    if (p.plusCount && !db.seenIntro.plus) kinds.push('plus');
    return kinds;
  }
  function markIntros(p, kinds) {
    kinds.forEach(function (k) { if (k === 'size') { for (var m = 5; m <= p.n; m++) db.seenIntro['size' + m] = true; } else db.seenIntro[k] = true; });
    save();
  }
  // Shown on top of the level that was just opened (never over the previous screen); the clock waits for "Got it".
  function maybeIntro() {
    if (!G || G.mode !== 'level' || G.solved) return;
    var g = G, p = g.p, kinds = pendingIntros(p);
    if (!kinds.length) return;
    pauseClock(); stopTimer();
    var many = kinds.length > 1;
    var secs = kinds.map(function (k) {
      return '<div class="intro-sec" data-intro="' + k + '">' + (many ? '<h3>' : '<h2>') + T('intro_' + k + '_title', { n: p.n }) + (many ? '</h3>' : '</h2>') +
        '<div class="intro-ill">' + introIll(k, p.n) + '</div><p>' + T('intro_' + k + '_body') + '</p></div>';
    }).join('');
    modal('<div class="new-badge">' + T('intro_new') + ' · ' + T('chapter', { n: E.chapterOf(g.L) }) + '</div>' + secs +
      '<div class="actions"><button class="btn block" data-ok>' + T('intro_ok') + '</button></div>', function (el, close) {
      el.dataset.introLevel = g.L;
      snd('chapter_unlock');
      el.querySelector('[data-ok]').onclick = function () { markIntros(p, kinds); close(); if (G === g) { G.start = performance.now(); startTimer(); } };
    }, { sticky: true });
  }

  // ---------- Game ----------
  function openLevel(L) {
    L = +L; if (L > currentLevel()) return;
    openGame('level:' + L); maybeIntro();
  }
  function openGame(id) {
    leaveGame();
    var parts = id.split(':'), isDaily = parts[0] === 'daily';
    if (isDaily && parts[1] !== todayKey()) return;
    var p = getPuzzle(id), rec = isDaily ? db.daily[parts[1]] : db.levels[parts[1]];
    var prog = isDaily ? rec : db.progress[id];
    var board = prog && prog.board && !(isDaily && rec.solved) ? prog.board.slice() : new Array(p.n * p.n).fill(0);
    var solvedView = isDaily && rec && rec.solved;
    if (solvedView) board = p.solution.map(function (v) { return v ? 1 : 0; });
    G = { id: id, p: p, mode: isDaily ? 'daily' : 'level', date: isDaily ? parts[1] : null, L: isDaily ? null : +parts[1],
      board: board, hist: [], elapsed: (prog && !solvedView && prog.elapsed) || 0, hints: (prog && !solvedView && prog.hints) || 0,
      hinted: (prog && !solvedView && prog.hinted) || [], solved: !!solvedView, start: performance.now() };
    if (solvedView) G.elapsed = rec.time;
    tab = isDaily ? 'today' : 'levels';
    render(); startTimer();
  }
  function leaveGame() { if (!G) return; persist(); stopTimer(); G = null; }
  function elapsed() { return G.solved ? G.elapsed : G.elapsed + (performance.now() - G.start) / 1000; }
  function startTimer() { stopTimer(); timerInt = setInterval(function () { var el = $('#timer'); if (el && G) el.textContent = fmtTime(elapsed()); }, 250); }
  function stopTimer() { clearInterval(timerInt); timerInt = null; }
  function pauseClock() { if (G && !G.solved) { G.elapsed = elapsed(); G.start = performance.now(); persist(); } }
  function persist() {
    if (!G || G.solved) return;
    G.elapsed = elapsed(); G.start = performance.now();
    var snap = { board: G.board, elapsed: G.elapsed, hints: G.hints, hinted: G.hinted };
    if (G.mode === 'daily') db.daily[G.date] = Object.assign(db.daily[G.date] || {}, snap);
    else db.progress[G.id] = snap;
    save();
  }
  function titleOf() {
    if (G.mode === 'daily') return '☀ ' + T('main_title') + ' #' + puzzleNo(G.date);
    return T('level', { n: G.L }) + '<small>' + T('chapter', { n: E.chapterOf(G.L) }) + '</small>';
  }
  function renderGame() {
    var p = G.p, n = p.n;
    var h = '<div class="game-head"><button class="back" data-act="back">' + ICON.back + '</button><div class="game-title">' + titleOf() + '</div><div class="timer" id="timer">' + fmtTime(elapsed()) + '</div></div>';
    if (G.mode === 'level') h += '<div class="par-hint">' + T('par_hint', { t: fmtTime(p.par) }) + '</div>';
    h += '<div class="board-wrap"><div class="board n' + n + '" id="board" style="grid-template-columns:repeat(' + n + ',1fr) 12px">';
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        var i = r * n + c, ty = p.types[i];
        h += '<button class="cell' + (ty === 1 ? ' clue' : ty === 2 ? ' clue plus' : ty === 3 ? ' cloud' : '') + '" data-i="' + i + '" style="--d:' + (r + c) + '">' + (ty === 3 ? ICON.cloud : '') + '</button>';
      }
      h += '<div class="pips-r" data-row="' + r + '"></div>';
    }
    for (var c2 = 0; c2 < n; c2++) h += '<div class="pips-c" data-col="' + c2 + '"></div>';
    h += '</div></div>';
    h += '<div class="controls' + (G.mode === 'level' ? ' four' : '') + '"><button class="ctrl" data-act="undo">' + ICON.undo + T('undo') + '</button><button class="ctrl" data-act="clear">' + ICON.clear + T('clear') +
      '</button><button class="ctrl" data-act="hint">' + ICON.bulb + T('hint') + '</button>' +
      (G.mode === 'level' ? '<button class="ctrl" data-act="skip">' + ICON.skip + T('skip') + '</button>' : '') + '</div>';
    h += '<div class="legend"><span>' + ICON.sun + '×1</span><span><i class="dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#CDBFAE"></i>×2</span><span>∅×3</span></div>';
    $('#view').innerHTML = h;
    paintBoard();
  }
  function paintBoard() {
    var p = G.p, n = p.n, k = p.k, geo = E.geometry(n), b = G.board;
    var rowS = new Array(n).fill(0), colS = new Array(n).fill(0);
    for (var i = 0; i < n * n; i++) if (b[i] === 1) { rowS[Math.floor(i / n)]++; colS[i % n]++; }
    document.querySelectorAll('#board .cell').forEach(function (el) {
      var i = +el.dataset.i, ty = p.types[i];
      if (ty === 3) return;
      if (ty === 1 || ty === 2) {
        var s = 0, u = 0; (ty === 2 ? geo.nb4[i] : geo.nb[i]).forEach(function (j) { if (b[j] === 1) s++; else if (b[j] === 0 && !p.types[j]) u++; });
        el.textContent = p.vals[i];
        el.classList.toggle('err', s > p.vals[i] || s + u < p.vals[i]);
        el.classList.toggle('done', s === p.vals[i]);
        return;
      }
      var want = b[i] === 1 ? 'sun' : b[i] === 2 ? 'dot' : '';
      if (el.dataset.s !== want) { el.dataset.s = want; el.innerHTML = want === 'sun' ? ICON.sun : want === 'dot' ? '<i class="dot"></i>' : ''; }
      var r = Math.floor(i / n), c = i % n;
      el.classList.toggle('err', b[i] === 1 && (rowS[r] > k || colS[c] > k));
      el.classList.toggle('hinted', G.hinted.indexOf(i) >= 0);
    });
    var pips = function (cnt) { var s = ''; for (var q = 0; q < k; q++) s += '<i class="pip' + (q < cnt ? ' f' : '') + '"></i>'; return s; };
    document.querySelectorAll('.pips-r').forEach(function (el) { var c = rowS[+el.dataset.row]; el.innerHTML = pips(c); el.className = 'pips-r' + (c === k ? ' ok' : c > k ? ' over' : ''); });
    document.querySelectorAll('.pips-c').forEach(function (el) { var c = colS[+el.dataset.col]; el.innerHTML = pips(c); el.className = 'pips-c' + (c === k ? ' ok' : c > k ? ' over' : ''); });
  }
  function setCell(i, v, record) {
    if (record !== false) G.hist.push([i, G.board[i]]);
    G.board[i] = v; paintBoard(); persist(); checkSolved();
  }
  function tapCell(i) {
    if (G.solved || G.p.types[i]) return;
    var nv = (G.board[i] + 1) % 3;
    if (nv === 1) { snd('tap_sun'); buzz(8); } else snd('tap_dot', { vol: nv === 2 ? 1 : 0.6 });
    setCell(i, nv);
    if (nv === 1 && G && !G.solved) placeFeedback(i);
  }
  // after placing a sun: soft "bonk" if it breaks a row/column/clue, rising notes if it completes a row or column
  function placeFeedback(i) {
    var p = G.p, n = p.n, k = p.k, b = G.board, r = Math.floor(i / n), c = i % n, rs = 0, cs = 0, geo = E.geometry(n);
    for (var q = 0; q < n; q++) { if (b[r * n + q] === 1) rs++; if (b[q * n + c] === 1) cs++; }
    var broken = rs > k || cs > k;
    geo.nb[i].forEach(function (j) {
      if (!p.types[j] || p.types[j] === 3) return;
      if (p.types[j] === 2 && geo.nb4[j].indexOf(i) < 0) return;
      var s = 0; (p.types[j] === 2 ? geo.nb4[j] : geo.nb[j]).forEach(function (x) { if (b[x] === 1) s++; });
      if (s > p.vals[j]) broken = true;
    });
    if (broken) { snd('error', { delay: 0.05 }); buzz([12, 40, 12]); }
    else if (rs === k || cs === k) snd('line_complete', { delay: 0.06 });
  }
  function starsFor(time, hints, par) {
    if (!hints && time <= par) return 3;
    if (hints <= EC.stars.twoStarMaxHints && time <= par * EC.stars.twoStarParFactor) return 2;
    return 1;
  }
  function checkSolved() {
    var p = G.p;
    for (var i = 0; i < p.n * p.n; i++) if ((G.board[i] === 1) !== (p.solution[i] === 1)) return;
    G.elapsed = elapsed(); G.solved = true; stopTimer();
    $('#timer').textContent = fmtTime(G.elapsed);
    for (var j = 0; j < G.board.length; j++) if (G.board[j] === 2) G.board[j] = 0;
    paintBoard();
    var res = G.mode === 'daily' ? recordDaily() : recordLevel(false);
    setTimeout(function () { $('#board') && $('#board').classList.add('win'); snd(G.mode === 'daily' ? 'daily_solved' : 'level_solved'); buzz([20, 40, 20]); }, 120);
    setTimeout(function () { confetti(); }, 450);
    setTimeout(function () { G.mode === 'daily' ? showDailyReward(res) : showLevelReward(res); }, 1200);
  }
  function recordDaily() {
    db.daily[G.date] = { solved: true, time: Math.round(G.elapsed), hints: G.hints, onDay: true, at: Date.now() };
    var s = currentStreak(); db.best = Math.max(db.best, s);
    var lines = [[T('reward_base'), EC.daily.base]];
    if (!G.hints && G.elapsed <= EC.daily.par) lines.push([T('reward_speed') + ' (≤ ' + fmtTime(EC.daily.par) + ')', EC.daily.speedBonus]);
    var m = EC.streakMilestones[s] || (s > 100 && (s - 100) % 30 === 0 ? 300 : 0);
    if (m && !db.milestones[G.date]) { db.milestones[G.date] = s; lines.push([T('reward_streak', { n: s }), m]); }
    var total = lines.reduce(function (a, l) { return a + l[1]; }, 0);
    db.wallet += total; save(); syncReminders();
    return { lines: lines, total: total, streak: s };
  }
  function recordLevel(skipped) {
    var L = G.L, prev = db.levels[L] || {}, prevStars = prev.stars || 0;
    var stars = skipped ? 0 : starsFor(G.elapsed, G.hints, G.p.par);
    var rec = { stars: Math.max(prevStars, stars), best: prev.best ? Math.min(prev.best, Math.round(G.elapsed)) : (skipped ? null : Math.round(G.elapsed)), skipped: !!(prev.skipped || skipped) };
    db.levels[L] = rec; delete db.progress[G.id];
    if (L + 1 > db.unlockedTo) db.unlockedTo = Math.min(L + 1, E.TOTAL_LEVELS);
    var lines = [], newStars = Math.max(0, stars - prevStars);
    if (newStars) lines.push([prevStars ? T('reward_new_stars', { n: newStars }) : T('reward_stars', { n: newStars }), newStars * EC.level.perStar]);
    var ch = E.chapterOf(L);
    if (!db.chapterBonus[ch] && chapterStats(ch).done === E.chapterSize(ch)) { db.chapterBonus[ch] = true; lines.push([T('reward_chapter', { n: ch }), EC.chapterClear]); }
    var total = lines.reduce(function (a, l) { return a + l[1]; }, 0);
    db.wallet += total;
    var adDue = false;
    // every 3rd level from level 11, but never twice within EC.interstitial.minSeconds (fast early levels take ~30 s each)
    if (L >= EC.interstitial.fromLevel && !db.owned.no_ads) {
      db.sinceAd++;
      if (db.sinceAd >= EC.interstitial.everyLevels && Date.now() - (db.lastAdAt || 0) >= EC.interstitial.minSeconds * 1000) { db.sinceAd = 0; db.lastAdAt = Date.now(); adDue = true; }
    }
    save();
    return { lines: lines, total: total, stars: stars, adDue: adDue };
  }
  function shareText() {
    var par = EC.daily.par, ratio = G.elapsed / par;
    var suns = ratio <= 0.5 ? 5 : ratio <= 1 ? 4 : ratio <= 1.5 ? 3 : ratio <= 2.5 ? 2 : 1;
    suns = Math.max(1, suns - G.hints);
    var bar = ''; for (var i = 0; i < 5; i++) bar += i < suns ? '☀️' : '🌥️';
    var lines = ['Sunplop #' + puzzleNo(G.date), bar, '⏱️ ' + fmtTime(G.elapsed) + (G.hints ? '  💡' + G.hints : '') + '  🔥' + currentStreak()];
    if (!Platform.native && /^https?:/.test(location.protocol)) lines.push(location.origin + location.pathname);
    return lines.join('\n');
  }
  function copy(text) {
    if (Platform.native && Platform.N.Share) return Platform.N.Share.share({ text: text }).catch(function () {});   // OS share sheet only (B13)
    var done = function () { toast(T('copied')); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); done(); }
  }
  function rewardLinesHtml(res) {
    if (!res.lines.length) return '';
    return '<div class="reward-lines">' + res.lines.map(function (l, i) { return '<div style="animation-delay:' + (i * 0.25 + 0.5) + 's"><span>' + l[0] + '</span><span class="v">' + ICON.coin + '+' + l[1] + '</span></div>'; }).join('') +
      '<div class="total" style="animation-delay:' + (res.lines.length * 0.25 + 0.5) + 's"><span>' + T('reward_total') + '</span><span class="v">' + ICON.coin + '<b id="count">0</b></span></div></div>';
  }
  function countUp(el, res) {
    var cnt = el.querySelector('#count'); if (!cnt) return;
    var start = performance.now() + res.lines.length * 250 + 500, shown = -1;
    (function tick(t) { var k = Math.min(1, Math.max(0, (t - start) / 700)), v = Math.round(res.total * k);
      if (v !== shown) { shown = v; cnt.textContent = '+' + v; }
      if (k < 1) requestAnimationFrame(tick); else { if (res.total) snd('coins'); updateChips(true); } })(performance.now());
  }
  function showDailyReward(res) {
    var h = '<svg class="win-sun" viewBox="0 0 40 40">' + ICON.sun.replace(/^<svg[^>]*>|<\/svg>$/g, '') + '</svg><h2>' + T('solved_title') + '</h2>';
    h += '<div class="stats3"><div class="stat"><b>' + fmtTime(G.elapsed) + '</b><span>' + T('time') + '</span></div><div class="stat"><b>' + G.hints + '</b><span>' + T('hints_used') +
      '</span></div><div class="stat"><b>' + res.streak + '</b><span>' + T('streak') + '</span></div></div>' + rewardLinesHtml(res);
    h += '<div class="actions"><button class="btn block" data-share>📋 ' + T('share') + '</button><button class="btn white block" data-tolevels>' + T('tab_levels') + ' →</button>' +
      '<button class="btn ghost block" data-home>' + T('home') + '</button></div>';
    modal(h, function (el, close) {
      countUp(el, res);
      el.querySelector('[data-share]').onclick = function () { copy(shareText()); };
      el.querySelector('[data-tolevels]').onclick = function () { close(); maybeAskReminder(function () { openLevel(currentLevel()); }); };
      el.querySelector('[data-home]').onclick = function () { close(); maybeAskReminder(function () { go('today'); }); };
    });
  }
  function showLevelReward(res) {
    var L = G.L, h = '<h2>' + T('level_complete') + '</h2><div class="big-stars">';
    for (var i = 0; i < 3; i++) h += '<i class="' + (i < res.stars ? 'on' : '') + '" style="animation-delay:' + (0.15 + i * 0.22) + 's">' + ICON.star + '</i>';
    h += '</div><div class="stats3"><div class="stat"><b>' + fmtTime(G.elapsed) + '</b><span>' + T('time') + '</span></div><div class="stat"><b>' + G.hints + '</b><span>' + T('hints_used') +
      '</span></div><div class="stat"><b>' + fmtTime(G.p.par) + '</b><span>★★★</span></div></div>' + rewardLinesHtml(res);
    var hasNext = L < E.TOTAL_LEVELS;
    h += '<div class="actions">' + (hasNext ? '<button class="btn block" data-next>' + T('next_level') + ' →</button>' : '') +
      '<div class="grid2"><button class="btn white" data-replay>↻ ' + T('replay') + '</button><button class="btn ghost" data-map>' + T('map') + '</button></div></div>';
    modal(h, function (el, close) {
      countUp(el, res);
      for (var s = 0; s < res.stars; s++) (function (s) { setTimeout(function () { snd('star', { rate: STAR_RATE[s] }); }, 150 + s * 220); })(s);
      var adGate = function (fn) { maybeAskTracking(function () { if (res.adDue) { res.adDue = false; showInterstitial().then(fn); } else fn(); }); };
      var nx = el.querySelector('[data-next]'); if (nx) nx.onclick = function () { close(); adGate(function () { openLevel(L + 1); }); };
      el.querySelector('[data-replay]').onclick = function () { close(); adGate(function () { openGame('level:' + L); }); };
      el.querySelector('[data-map]').onclick = function () { close(); adGate(function () { openCh = E.chapterOf(currentLevel()); go('levels'); }); };
    }, { sticky: true });
  }
  function undo() { var h = G.hist.pop(); if (h && !G.solved) { snd('undo'); setCell(h[0], h[1], false); } }
  function clearBoard() { if (G.solved) return; snd('clear'); G.board = G.board.map(function () { return 0; }); G.hist = []; G.hinted = []; paintBoard(); persist(); }
  function applyHint() {
    var h = E.nextHint(G.p, G.board, Math.random());
    if (!h) return;
    G.hints++; G.hinted.push(h.i); snd('hint');
    setCell(h.i, h.v);
  }
  function askHint() {
    if (G.solved) return;
    modal('<div style="font-size:52px;text-align:center">💡</div><h2>' + T('hint_title') + '</h2><p>' + T('hint_body') + '</p><div class="actions">' +
      '<button class="btn green block" data-ad>▶️ ' + T('hint_ad') + '</button><button class="btn block" data-pay>' + coinSvg(20) +
      T('hint_pay', { n: EC.costs.hint }) + approxTag(EC.costs.hint) + '</button><button class="btn ghost block" data-x>' + T('cancel') + '</button></div>', function (el, close) {
      el.querySelector('[data-ad]').onclick = function () { close(); pauseClock(); watchAd('hint').then(function (ok) { if (G) G.start = performance.now(); if (ok) applyHint(); }); };
      el.querySelector('[data-pay]').onclick = function () { close(); if (spend(EC.costs.hint)) applyHint(); };
      el.querySelector('[data-x]').onclick = close;
    });
  }
  function askSkip() {
    if (G.solved || G.mode !== 'level') return;
    modal('<div style="font-size:52px;text-align:center">⏭️</div><h2>' + T('skip_title') + '</h2><p>' + T('skip_body') + '</p><div class="actions">' +
      '<button class="btn block" data-pay>' + coinSvg(20) + EC.costs.skip + approxTag(EC.costs.skip) + '</button><button class="btn ghost block" data-x>' + T('cancel') + '</button></div>', function (el, close) {
      el.querySelector('[data-pay]').onclick = function () {
        close(); if (!spend(EC.costs.skip)) return;
        G.elapsed = elapsed(); G.solved = true; stopTimer(); var L = G.L; recordLevel(true); snd('coins', { vol: 0.7 });
        openLevel(Math.min(L + 1, E.TOTAL_LEVELS));
      };
      el.querySelector('[data-x]').onclick = close;
    });
  }

  // ---------- help / settings ----------
  function illGrid(n, cells, size) {
    size = size || 22;
    var h = '<div class="ill-grid" style="grid-template-columns:repeat(' + n + ',' + size + 'px)">';
    cells.forEach(function (c) {
      var cls = typeof c === 'number' ? 'c' : c === 'p1' ? 'c plus' : c === 'cl' ? 'cl' : '';
      var inner = c === 's' ? ICON.sun : typeof c === 'number' ? c : c === 'p1' ? '1' : c === 'cl' ? ICON.cloud : '';
      h += '<i class="' + cls + '" style="width:' + size + 'px;height:' + size + 'px">' + inner + '</i>';
    });
    return h + '</div>';
  }
  function openHelp(first) {
    var h = '<h2>' + T('help_title') + '</h2>' +
      '<div class="help-step" style="flex-direction:column;align-items:flex-start"><div class="ill">' + illGrid(6, ['', 's', '', '', 's', '']) + '</div><div class="t">' + T('help_1') + '</div></div>' +
      '<div class="help-step"><div class="ill">' + illGrid(3, ['s', '', '', '', 2, '', '', '', 's']) + '</div><div class="t">' + T('help_2') + '</div></div>' +
      '<div class="help-step"><div class="ill ill-cycle">' + illGrid(1, ['']) + '→' + illGrid(1, ['s']) + '→<i style="width:8px;height:8px;border-radius:50%;background:#CDBFAE;display:inline-block;margin:0 6px"></i>→' + illGrid(1, ['']) + '</div><div class="t">' + T('help_3') + '</div></div>' +
      (first ? '<p class="notice">' + T('first_notice', { terms: linkBtn('terms'), privacy: linkBtn('privacy') }) + '</p>' : '') +
      '<div class="actions"><button class="btn block" data-go>' + T('help_go') + '</button></div>';
    modal(h, function (el, close) {
      el.querySelector('[data-go]').onclick = function () {
        close(); db.settings.seenHelp = true;
        if (!db.welcomed) { db.welcomed = true; db.wallet += EC.welcomeGift; toast(T('welcome_gift', { n: EC.welcomeGift })); snd('coins'); }
        save(); updateChips(true);
      };
    }, { sticky: !!first });
  }
  function openSettings() {
    var st = db.settings, opts = Object.keys(I18N.LANGS).map(function (c) { return '<option value="' + c + '"' + (c === I18N.lang ? ' selected' : '') + '>' + I18N.LANGS[c] + '</option>'; }).join('');
    var row = function (id, icon, label, on, vol) {
      return '<div class="set-row"><span>' + icon + ' ' + T(label) + '</span><button class="btn sm ghost" id="' + id + '">' + T(on ? 'on' : 'off') + '</button></div>' +
        '<div class="set-row vol"><span>' + T('volume') + '</span><input type="range" min="0" max="100" step="5" id="' + id + '-vol" value="' + Math.round(vol * 100) + '" aria-label="' + T(label) + ' ' + T('volume') + '"></div>';
    };
    modal('<h2>' + T('settings') + '</h2><div class="set-row"><span>🌐 ' + T('language') + '</span><select id="lang">' + opts + '</select></div>' +
      row('snd', '🔊', 'sound', st.sound, st.sfxVol) + row('mus', '🎵', 'music', st.music, st.musicVol) +
      reminderRows() + privacyRows() + (MOCK ? '<div class="region">' + T('region', { r: COUNTRY }) + '</div>' : ''), function (el, close) {
      el.querySelectorAll('[data-set]').forEach(function (b) { b.onclick = function () { settingsAction(b.dataset.set, close); }; });
      var apply = function () { save(); Snd.configure(db.settings); };
      el.querySelector('#lang').onchange = function (e) { db.settings.lang = e.target.value; I18N.setLang(e.target.value); save(); close(); render(); syncReminders(); };
      el.querySelector('#snd').onclick = function (e) { st.sound = !st.sound; apply(); e.target.textContent = T(st.sound ? 'on' : 'off'); if (st.sound) snd('ui_click'); };
      el.querySelector('#mus').onclick = function (e) { st.music = !st.music; apply(); e.target.textContent = T(st.music ? 'on' : 'off'); };
      el.querySelector('#snd-vol').oninput = function (e) { st.sfxVol = e.target.value / 100; apply(); };
      el.querySelector('#snd-vol').onchange = function () { snd('tap_sun'); };
      el.querySelector('#mus-vol').oninput = function (e) { st.musicVol = e.target.value / 100; apply(); };
      var rem = el.querySelector('#rem'), remTime = el.querySelector('#rem-time');
      if (rem) rem.onclick = function () {
        if (st.reminder) { st.reminder = false; save(); syncReminders(); rem.textContent = T('off'); return; }
        enableReminder(true).then(function (on) { rem.textContent = T(on ? 'on' : 'off'); });
      };
      if (remTime) remTime.onchange = function (e) { st.reminderTime = e.target.value; save(); syncReminders(); if (st.reminder) toast(T('reminder_set', { time: fmtClock(st.reminderTime) })); };
    });
  }

  // ---------- daily reminder (optional local notification, js/reminders.js) ----------
  // Opt-in only: never asked on first launch. A soft in-game question comes first (after the first solved daily
  // puzzle; at most once more, 7+ days after a "Not now"), then the system prompt. Children get no automatic
  // question (Settings only) and minors / children never get streak wording. Nothing leaves the device.
  var R = window.Reminders || { supported: false, sync: function () { return Promise.resolve([]); }, cancelAll: function () { return Promise.resolve(); }, onTap: function () {} };
  function youngPlayer() { var f = Platform.Age.flag; return f === 'child' || f === 'minor'; }
  function fmtClock(hm) {   // device locale when it matches the game language (en-GB 19:00, en-US 7:00 PM)
    var a = hm.split(':'), nl = navigator.language || '', loc = nl.slice(0, 2).toLowerCase() === I18N.lang ? nl : I18N.lang;
    try { return new Date(2000, 0, 1, +a[0], +a[1]).toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' }); } catch (e) { return hm; }
  }
  function syncReminders() {
    var st = db.settings, t = todayKey(), r = db.daily[t];
    return R.sync({ on: !!st.reminder, time: st.reminderTime || '19:00', solvedToday: !!(r && r.solved), streak: currentStreak(), neutral: youngPlayer(), t: T });
  }
  function reminderRows() {
    if (!R.supported) return '';
    var st = db.settings, cur = st.reminderTime || '19:00', times = R.PRESETS.indexOf(cur) < 0 ? R.PRESETS.concat([cur]) : R.PRESETS;
    var opts = times.map(function (hm) { return '<option value="' + hm + '"' + (hm === cur ? ' selected' : '') + '>' + fmtClock(hm) + '</option>'; }).join('');
    return '<div class="set-row"><span>🔔 ' + T('reminder') + '</span><button class="btn sm ghost" id="rem">' + T(st.reminder ? 'on' : 'off') + '</button></div>' +
      '<div class="set-row vol"><span>' + T('reminder_time') + '</span><select id="rem-time" aria-label="' + T('reminder') + ' ' + T('reminder_time') + '">' + opts + '</select></div>' +
      '<p class="small set-note">' + T('reminder_note') + '</p>';
  }
  /** Turn the reminder on (asks the OS if needed). fromSettings: explain when the OS blocks it. Resolves true/false. */
  function enableReminder(fromSettings) {
    var st = db.settings;
    return R.permission().then(function (perm) {
      if (perm === 'granted') return 'granted';
      if (perm === 'denied') return 'denied';
      return R.request();
    }).then(function (perm) {
      if (perm !== 'granted') {
        st.reminderDenied = true; st.reminder = false; save();
        if (fromSettings) toast(T('reminder_blocked'));
        return false;
      }
      st.reminder = true; st.reminderDenied = false; save(); syncReminders();
      toast(T('reminder_set', { time: fmtClock(st.reminderTime || '19:00') }));
      return true;
    });
  }
  function maybeAskReminder(next) {
    var st = db.settings, solvedDays = Object.keys(db.daily).filter(function (k) { return db.daily[k].solved; }).length;
    var due = R.supported && !st.reminder && !st.reminderDenied && solvedDays >= 1 && Platform.Age.flag !== 'child' &&
      (st.reminderAsks === 0 || (st.reminderAsks === 1 && Date.now() - (st.reminderAskedAt || 0) > 7 * 864e5));
    if (!due) return next();
    R.permission().then(function (perm) {
      if (perm === 'denied') { st.reminderDenied = true; save(); return next(); }
      st.reminderAsks = (st.reminderAsks || 0) + 1; st.reminderAskedAt = Date.now(); save();
      modal('<div class="ask-ic">🔔</div><h2>' + T('reminder_ask_title') + '</h2><p>' + T('reminder_ask_body', { time: fmtClock(st.reminderTime || '19:00') }) + '</p>' +
        '<div class="actions"><button class="btn block" data-y>' + T('reminder_yes') + '</button><button class="btn ghost block" data-n>' + T('reminder_no') + '</button></div>', function (el, close) {
        el.querySelector('[data-y]').onclick = function () { close(); enableReminder(false).then(function () { next(); }); };
        el.querySelector('[data-n]').onclick = function () { close(); next(); };
      }, { sticky: true });
    });
  }
  /** Tapping a reminder opens today's daily puzzle (closing any closable popup first). */
  function openTodayFromReminder() {
    document.querySelectorAll('#modal-root > .backdrop').forEach(function (b) { if (!b.dataset.sticky && b._close) b._close(); });
    if (document.querySelector('#modal-root > .backdrop')) { if (!G) go('today'); return; }
    var id = 'daily:' + todayKey();
    if (G && G.id === id) return;
    leaveGame(); tab = 'today'; openGame(id);
  }

  // ---------- legal / privacy (B1, B2, B4) ----------
  function policyFile(kind) {
    if (kind === 'terms') return 'terms.html';   // Terms exist in English only for now (B14)
    return I18N.lang === 'en' ? 'privacy.html' : 'privacy-' + I18N.lang + '.html';
  }
  function openPolicy(kind) {
    var base = SUNPLOP_CONFIG.policyBase;
    if (base) return Platform.openUrl(base.replace(/\/?$/, '/') + policyFile(kind));
    modal('<div class="policy-head"><b>' + T(kind) + '</b><button class="btn ghost sm" data-x>' + T('close') + '</button></div>' +
      '<iframe class="policy-frame" src="legal/' + policyFile(kind) + '" title="' + T(kind) + '"></iframe>', function (el, close) {
      el.querySelector('[data-x]').onclick = close;
    }, { cls: 'policy' });
  }
  function supportMail() {
    var C = SUNPLOP_CONFIG, body = 'App version ' + C.version + ', platform ' + Platform.os + (IAP.appUserId ? ', ' + T('support_id') + ' ' + IAP.appUserId : '') + '\n\n';
    Platform.openUrl('mailto:' + C.supportEmail + '?subject=' + encodeURIComponent('Sunplop support') + '&body=' + encodeURIComponent(body));
  }
  function openWithdraw() {
    modal('<h2>' + T('withdraw') + '</h2><p>' + T('withdraw_body') + '</p><div class="actions"><button class="btn block" data-mail>✉️ ' + T('contact') + '</button><button class="btn ghost block" data-x>' + T('close') + '</button></div>', function (el, close) {
      el.querySelector('[data-mail]').onclick = function () { close(); supportMail(); };
      el.querySelector('[data-x]').onclick = close;
    });
  }
  function openDelete() {
    modal('<h2>' + T('delete_data') + '</h2><p>' + T('delete_body') + '</p><div class="actions"><button class="btn red block" data-y>' + T('delete_confirm') + '</button><button class="btn ghost block" data-n>' + T('cancel') + '</button></div>', function (el, close) {
      el.querySelector('[data-y]').onclick = function () { close(); deleting = true; leaveGame(); R.cancelAll().then(function () { return SunplopStore.clearAll(); }).then(function () { toast(T('deleted')); setTimeout(function () { location.reload(); }, 600); }); };
      el.querySelector('[data-n]').onclick = close;
    }, { sticky: true });
  }
  var deleting = false;
  function openAbout() {
    var C = SUNPLOP_CONFIG;
    modal('<h2>' + C.brand + '</h2><p>' + T('version', { v: C.version }) + ' · ' + Platform.os + '<br>© ' + C.copyrightYear + ' ' + C.brand + '</p><p class="small">' + T('about_licences') + '</p>' +
      (IAP.appUserId ? '<p class="small">' + T('support_id') + ': ' + IAP.appUserId + '</p>' : '') +
      '<div class="actions"><button class="btn ghost block" data-x>' + T('close') + '</button></div>', function (el, close) { el.querySelector('[data-x]').onclick = close; });
  }
  function privacyRows() {
    var rows = [['privacy', '📄'], ['terms', '📜']];
    if (Ads.privacyRequired) rows.push(['manage_privacy', '🛡️']);
    if (Ads.privacyRequired && (COUNTRY === 'US' || /^US/.test(IAP.storefront || ''))) rows.push(['dns', '🚫']);
    rows.push(['restore', '♻️']);
    if (IAP.needsWithdrawalWaiver(COUNTRY)) rows.push(['withdraw', '↩️']);
    rows.push(['delete_data', '🗑️'], ['contact', '✉️'], ['about', 'ℹ️']);
    return '<div class="section-t">' + T('privacy_ads') + '</div><div class="set-list">' + rows.map(function (r) {
      return '<button class="set-link" data-set="' + r[0] + '"><span>' + r[1] + ' ' + T(r[0]) + '</span><span class="chev">›</span></button>';
    }).join('') + '</div>';
  }
  function settingsAction(k, close) {
    if (k === 'privacy' || k === 'terms') return openPolicy(k);
    if (k === 'manage_privacy' || k === 'dns') { close(); return Ads.showPrivacyOptions(); }
    if (k === 'restore') return restorePurchases();
    if (k === 'withdraw') return openWithdraw();
    if (k === 'delete_data') { close(); return openDelete(); }
    if (k === 'contact') return supportMail();
    if (k === 'about') return openAbout();
  }
  /** iOS ATT: once, after the first completed level and after the consent form; short neutral explainer, no incentive. */
  function maybeAskTracking(fn) {
    if (db.attAsked || !Ads.native) return fn();
    Ads.canAskTracking().then(function (ok) {
      if (!ok) return fn();
      db.attAsked = true; save();
      modal('<h2>' + T('att_title') + '</h2><p>' + T('att_body') + '</p><div class="actions"><button class="btn block" data-y>' + T('att_continue') + '</button></div>', function (el, close) {
        el.querySelector('[data-y]').onclick = function () { close(); Ads.requestTracking().then(function () { fn(); }); };
      }, { sticky: true });
    });
  }

  // ---------- events ----------
  document.addEventListener('click', function (e) {
    var t = e.target, pl = t.closest('[data-policy]');
    if (pl) { e.preventDefault(); return openPolicy(pl.dataset.policy); }
    if (t.closest('#modal-root')) return;
    var cell = t.closest('#board .cell'); if (cell && G) return tapCell(+cell.dataset.i);
    var el;
    if ((el = t.closest('[data-tab]'))) return go(el.dataset.tab);
    if ((el = t.closest('[data-ch]'))) { var ch = +el.dataset.ch; if (E.chapterStart(ch) <= currentLevel()) { openCh = openCh === ch ? -1 : ch; renderLevels(); } return; }
    if ((el = t.closest('[data-level]'))) return openLevel(el.dataset.level);
    if ((el = t.closest('[data-open]'))) return openGame(el.dataset.open);
    if ((el = t.closest('[data-buy]'))) return buy(el.dataset.buy);
    if ((el = t.closest('[data-joker-buy]'))) { if (spend(EC.costs.joker)) { db.jokers++; save(); snd('purchase'); toast('🃏 +1'); render(); } return; }
    if ((el = t.closest('[data-ad]'))) { if (adsLeft() <= 0) return; return watchAd('coins').then(function (ok) { if (ok) { db.ads.n++; addCoins(EC.adReward); snd('coins'); toast('+' + EC.adReward + ' ' + T('currency')); render(); } }); }
    if ((el = t.closest('[data-act]'))) {
      var a = el.dataset.act;
      if (a === 'back') return leaveToMap();
      if (a === 'undo') return undo(); if (a === 'clear') return clearBoard(); if (a === 'hint') return askHint(); if (a === 'skip') return askSkip();
      if (a === 'joker') return openJoker();
    }
  });
  document.addEventListener('contextmenu', function (e) { var cell = e.target.closest('#board .cell'); if (cell && G && !G.solved && !G.p.types[+cell.dataset.i]) { e.preventDefault(); snd('tap_dot'); setCell(+cell.dataset.i, G.board[+cell.dataset.i] === 2 ? 0 : 2); } });
  $('#chip-coins').onclick = function () { go('shop'); };
  $('#chip-streak').onclick = function () { go('today'); };
  $('#logo').onclick = function () { go('today'); };
  $('#btn-help').onclick = function () { openHelp(false); };
  $('#btn-settings').innerHTML = ICON.gear; $('#btn-settings').onclick = openSettings;
  // first gesture unlocks WebAudio (autoplay rules) and starts music if it is on; soft click on general UI buttons
  document.addEventListener('pointerdown', function (e) {
    Snd.unlock();
    var b = e.target.closest('button, .lvl, [data-tab], [data-ch], select');
    if (b && !b.closest('#board') && !b.matches('[data-act="undo"], [data-act="clear"], [data-act="hint"], #snd')) snd('ui_click');
  }, true);
  document.addEventListener('visibilitychange', function () { Snd.setHidden(document.hidden); if (!G || G.solved) return; if (document.hidden) pauseClock(); else G.start = performance.now(); });
  window.addEventListener('pagehide', function () { if (!deleting) persist(); });

  // test hooks (automated tests / screenshots only)
  window.__sunplop = { audio: function () { return Snd.state ? Snd.state() : null; }, db: function () { return db; }, game: function () { return G; }, openGame: openGame, openLevel: openLevel, go: go, render: render, save: save,
    solveAllBut: function (left) { var p = G.p, cnt = 0; for (var i = 0; i < p.n * p.n; i++) { if (p.types[i]) continue; if (p.solution[i]) { G.board[i] = cnt >= left ? 1 : 0; cnt++; } else G.board[i] = 2; } paintBoard(); persist(); },
    remaining: function () { var g = G; return g.p.solution.findIndex(function (v, i) { return v && g.board[i] !== 1; }); },
    setElapsed: function (s) { G.elapsed = s; G.start = performance.now(); }, todayKey: todayKey, checkDay: checkDay, back: handleBack, syncReminders: syncReminders };

  // Midnight rollover: a new local day refreshes Today (new daily, streak/Joker state) unless a puzzle is open.
  var shownDay = todayKey();
  function checkDay() { var k = todayKey(); if (k === shownDay) return; shownDay = k; syncReminders(); if (!G && !document.querySelector('#modal-root > .backdrop')) { render(); if (brokenStreak()) openJoker(); } }
  setInterval(checkDay, 30000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) checkDay(); });

  try { history.replaceState({ sunplopRoot: 1 }, ''); } catch (e) {} armBack();
  if (Platform.native && Platform.N.App) {
    Platform.N.App.addListener('backButton', function () { if (!handleBack()) Platform.N.App.exitApp(); });   // Android back: same rules as the browser Back
    Platform.N.App.addListener('pause', function () { persist(); });
    Platform.N.App.addListener('resume', function () { checkDay(); syncReminders(); });   // re-plan: solved today? new day? streak?
  }
  R.onTap(openTodayFromReminder);
  Platform.Age.check().then(function () { syncReminders(); });   // also on every launch (age flag decides the wording)
  document.body.classList.toggle('native', Platform.native);
  // store + ads start in the background; the game is playable right away (consent pending = no ads yet)
  IAP.init(Economy.PRODUCTS).then(function () { if (tab === 'shop' && !G && !document.querySelector('#modal-root > .backdrop')) render(); });
  Ads.start().then(function () { updateChips(); });
  render();
  if (!db.settings.seenHelp) openHelp(true);
  else if (brokenStreak() && !G) setTimeout(openJoker, 400);
});
