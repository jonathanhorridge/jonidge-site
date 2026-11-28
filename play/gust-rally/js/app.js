/* Screens: home (daily card, quests, streak + freeze), run, results, settings. Input: touch / mouse / Space / Up. */
(function (root) {
  'use strict';
  var C = root.KC_CONFIG, S = root.KCSim, Store = root.KCStore, fmt = root.KCfmt;
  var $ = function (id) { return document.getElementById(id); };
  var canvas = $('game'), ui = $('ui'), game = null, mode = 'daily', seed = null, course = null, par = {};
  var params = new URLSearchParams(location.search);
  var N = root.GustNative || null;

  function todaySeed() { return params.get('seed') || S.dailySeed(new Date()); }
  function parFor(c) { if (!par[c.seed]) par[c.seed] = S.botRun(c).state.finishT; return par[c.seed]; }
  function medal(t, p) {
    if (t <= p * 0.94) return { id: 'master', name: 'Wind Master', em: '🏆' };
    if (t <= p * 1.0) return { id: 'gold', name: 'Gold', em: '🥇' };
    if (t <= p * 1.08) return { id: 'silver', name: 'Silver', em: '🥈' };
    return { id: 'bronze', name: 'Bronze', em: '🥉' };
  }
  function cfg() { return Store.data.settings; }
  function reduced() { var r = cfg().reduced; return r == null ? !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches) : r; }
  function applyAudio() { Sfx.configure(cfg().sfx, cfg().music); }
  function haptic(kind) {
    if (!cfg().haptics) return;
    try {
      if (N && N.isNative) N.Haptics.impact({ style: kind === 'hit' ? N.ImpactStyle.Medium : N.ImpactStyle.Light });
      else if (navigator.vibrate) navigator.vibrate(kind === 'hit' ? 40 : 15);
    } catch (e) {}
  }
  function tap() { Sfx.unlock(); applyAudio(); Sfx.play('click', 0.6); haptic('tap'); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function questsHtml() {
    return Store.questState().map(function (q) {
      var pct = Math.round(100 * q.progress / q.n);
      return '<div class="quest' + (q.done ? ' done' : '') + '"><div class="qtext"><span>' + esc(q.text) + '</span><small>' + q.progress + '/' + q.n + ' · +' + q.reward + ' 🌬️</small>' +
        '<div class="bar"><i style="width:' + pct + '%"></i></div></div>' +
        (q.claimed ? '<span class="claimed">✓</span>' : q.done ? '<button class="btn claim" data-claim="' + q.id + '">Claim</button>' : '') + '</div>';
    }).join('');
  }

  function home() {
    stopGame();
    seed = todaySeed(); course = S.generate(seed);
    var best = Store.best(seed), d = seed.replace('gustrally-', ''), p = parFor(course), D = Store.data;
    ui.className = 'screen home';
    ui.innerHTML =
      '<button class="btn icon gear" id="b-settings" aria-label="Settings">⚙️</button>' +
      '<div class="logo"><span class="logo-kite"></span><h1>' + C.title + '</h1><p class="tag">Hold to rise · release to dive</p></div>' +
      '<div class="card daily">' +
        '<div class="row"><span class="pill">Daily course</span><span class="date">' + d + '</span></div>' +
        '<div class="theme">' + course.theme.name + '</div>' +
        '<div class="stats"><div><b>' + (best ? fmt(best.time) : '—') + '</b><small>your best</small></div><div><b>' + fmt(p) + '</b><small>par</small></div>' +
        '<div><b>' + Store.streakShown() + '🔥</b><small>streak</small></div><div><b>' + D.freezes + '❄️</b><small title="Saves your streak if you miss a day. Earn one every 7 days.">freeze</small></div></div>' +
        '<button class="btn primary" id="b-daily">' + (best ? 'Race your ghost' : 'Fly today\u2019s course') + '</button>' +
        '<div class="next" id="next"></div>' +
      '</div>' +
      '<div class="card quests"><div class="qhead"><b>Daily quests</b><span class="breeze">🌬️ ' + D.breeze + '</span></div><div id="quests">' + questsHtml() + '</div></div>' +
      '<div class="row2"><button class="btn" id="b-practice">Practice (random course)</button></div>' +
      '<footer>' + C.brand + ' · prototype v' + C.version + '</footer>';
    $('b-daily').onclick = function () { tap(); mode = 'daily'; play(seed); };
    $('b-practice').onclick = function () { tap(); mode = 'practice'; play('practice-' + Math.floor(Math.random() * 1e9)); };
    $('b-settings').onclick = function () { tap(); settings(); };
    $('quests').onclick = function (e) {
      var id = e.target.getAttribute && e.target.getAttribute('data-claim'); if (!id) return;
      var r = Store.claimQuest(id); if (r) { Sfx.unlock(); Sfx.play('ring', 0.8); home(); }
    };
    tickNext();
  }
  function tickNext() {
    var el = $('next'); if (!el) return;
    var now = new Date(), next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1), ms = next - now;
    var h = Math.floor(ms / 36e5), m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
    el.textContent = 'New course in ' + h + 'h ' + String(m).padStart(2, '0') + 'm ' + String(s).padStart(2, '0') + 's';
    setTimeout(tickNext, 1000);
  }

  function settings() {
    var m = document.createElement('div'); m.className = 'modal'; m.id = 'settings';
    function row(key, label, val) { return '<label class="set"><span>' + label + '</span><input type="checkbox" data-k="' + key + '"' + (val ? ' checked' : '') + '><i class="sw"></i></label>'; }
    m.innerHTML = '<div class="card"><h2>Settings</h2>' + row('sfx', 'Sound effects', cfg().sfx) + row('music', 'Music', cfg().music) +
      row('haptics', 'Haptics (vibration)', cfg().haptics) + row('reduced', 'Reduced motion (no shake or flashes)', reduced()) +
      '<p class="fine">Contact: ' + C.supportEmail + '</p><button class="btn primary" id="b-close">Done</button></div>';
    document.body.appendChild(m);
    m.addEventListener('change', function (e) { var k = e.target.getAttribute('data-k'); if (!k) return; Store.set(k, e.target.checked); applyAudio(); if (k === 'haptics' && e.target.checked) haptic('hit'); });
    $('b-close').onclick = function () { m.remove(); Sfx.play('click', 0.5); };
  }

  function play(sd) {
    stopGame();
    var c = sd === seed ? course : S.generate(sd);
    ui.className = 'screen run'; ui.innerHTML = '<button class="btn icon pause" id="b-home" aria-label="Home">✕</button>';
    $('b-home').onclick = function (e) { e.stopPropagation(); home(); };
    applyAudio();
    Store.ghostsFor(sd).then(function (gs) {
      game = new root.KCGame(canvas, {
        course: c, ghost: gs[0] || null, autopilot: params.get('autopilot') === '1', timeScale: +params.get('ts') || 1,
        reduced: reduced(), haptics: cfg().haptics, onHaptic: haptic,
        onCount: function (n) { Sfx.play(n ? 'count' : 'go', 0.7); },
        onFinish: function (r) { results(c, r); }
      });
      root.KC.game = game;
      game.start();
    });
  }

  function results(c, r) {
    var daily = mode === 'daily', p = parFor(c), m = medal(r.time, p);
    var res = Store.submit(c.seed, r, daily, { par: p });
    var earned = 10 + r.rings + (m.id === 'master' ? 25 : m.id === 'gold' ? 15 : m.id === 'silver' ? 8 : 3) + (res.improved && res.prev ? 10 : 0);
    Store.addBreeze(earned);
    if (res.improved && res.prev) Sfx.play('best', 0.8);
    var delta = res.prev ? r.time - res.prev.time : null;
    var nDone = Store.questState().filter(function (q) { return q.done && !q.claimed; }).length;
    ui.className = 'screen results';
    ui.innerHTML =
      '<div class="card">' +
        '<div class="medal medal-' + m.id + '">' + m.em + '</div><h2>' + m.name + '</h2>' +
        '<div class="big">' + fmt(r.time) + '</div>' +
        (delta == null ? '<div class="sub">First flight on this course: your ghost is saved</div>' :
          '<div class="sub ' + (delta < 0 ? 'good' : 'bad') + '">' + (delta < 0 ? 'New best! −' : '+') + Math.abs(delta).toFixed(2) + 's vs best</div>') +
        '<div class="stats"><div><b>' + r.rings + '</b><small>rings</small></div><div><b>' + r.hits + '</b><small>hits</small></div><div><b>' + fmt(p) + '</b><small>par</small></div></div>' +
        '<div class="earn">+' + earned + ' 🌬️ Breeze</div>' +
        (res.freezeUsed ? '<div class="sub good">❄️ Streak freeze saved your streak!</div>' : '') +
        (res.freezeGained ? '<div class="sub good">❄️ You earned a streak freeze (7-day streak)</div>' : '') +
        (daily ? '<div class="sub">🔥 ' + Store.data.streak + '-day streak</div>' : '<div class="sub">Practice runs don\u2019t count for the daily streak</div>') +
        (nDone ? '<div class="sub good">🎯 ' + nDone + ' quest' + (nDone > 1 ? 's' : '') + ' ready to claim on Home</div>' : '') +
        '<button class="btn primary" id="b-again">Fly again</button>' +
        '<button class="btn ghosty" id="b-ad" disabled title="Rewarded ads are off in the prototype">▶ Double Breeze (ad, coming soon)</button>' +
        '<div class="row2"><button class="btn" id="b-share">Share</button><button class="btn" id="b-home2">Home</button></div>' +
      '</div>';
    $('b-again').onclick = function () { tap(); play(c.seed); };
    $('b-home2').onclick = function () { tap(); home(); };
    $('b-share').onclick = function () {
      var txt = '🪁 ' + C.title + ' ' + c.seed.replace('gustrally-', '') + ' — ' + fmt(r.time) + ' ' + m.em + ' (' + r.rings + ' rings)';
      if (N && N.isNative) N.Share.share({ text: txt }).catch(function () {});
      else if (navigator.share) navigator.share({ text: txt }).catch(function () {}); else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { $('b-share').textContent = 'Copied!'; });
    };
  }

  function stopGame() { if (game) { game.stop(); game = null; } }

  // input
  function down(e) { if (!game) return; if (e.target.closest && e.target.closest('button')) return; Sfx.unlock(); game.setHold(true); if (e.cancelable) e.preventDefault(); }
  function up() { if (game) game.setHold(false); }
  ui.addEventListener('pointerdown', down); canvas.addEventListener('pointerdown', down);
  root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up); root.addEventListener('blur', up);
  root.addEventListener('keydown', function (e) { if (e.code === 'Space' || e.code === 'ArrowUp') { if (game) { Sfx.unlock(); game.setHold(true); e.preventDefault(); } } });
  root.addEventListener('keyup', function (e) { if (e.code === 'Space' || e.code === 'ArrowUp') up(); });
  root.addEventListener('resize', function () { if (game) game.resize(); if (root.KC && root.KC.bg) root.KC.bg.resize(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) up(); });
  // scrolling lists on the home screen must still scroll by touch
  ui.addEventListener('touchmove', function () {}, { passive: true });

  // idle background: an autopilot kite flies behind the home screen
  function idle() {
    var bg = new root.KCGame(canvas, { course: S.generate(todaySeed()), autopilot: true, silent: true, reduced: reduced(), onFinish: function () {} });
    bg.countdown = 0; bg._hud = function () {}; root.KC.bg = bg; bg.start();
  }
  root.KC = { home: home, play: play, store: Store, sim: S };
  var _home = home; home = function () { stopGame(); if (root.KC.bg) root.KC.bg.stop(); _home(); idle(); };
  var _play = play; play = function (sd) { if (root.KC.bg) { root.KC.bg.stop(); root.KC.bg = null; } _play(sd); };
  root.KC.home = home; root.KC.play = play;
  applyAudio();
  home();
})(this);
