/* Ferry Jam UI v4 — studio-style harbor, road routing, daily loop, shop stubs, juice. */
(function () {
  'use strict';
  var KEY = 'ferryjam:v1';
  var ECO = Economy.ECONOMY || Economy;
  var view = document.getElementById('view');
  var modalRoot = document.getElementById('modal-root');
  var toastEl = document.getElementById('toast');
  var banner = document.getElementById('ad-banner');
  var country = Economy.detectCountry ? Economy.detectCountry() : 'US';
  var currency = Economy.currencyFor ? Economy.currencyFor(country) : 'USD';
  var save, screen = 'home', play = null, busy = false, toastTimer = 0;
  var moveQueue = [];
  var lastRewarded = 0;
  var ROAD = 22;

  function utcToday() {
    try { return new Date().toISOString().slice(0, 10); } catch (e) { return '1970-01-01'; }
  }
  function dayShift(iso, n) { return new Date(Date.parse(iso + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10); }
  function defaultSave() {
    return {
      tickets: ECO.welcomeGift, welcomed: true, stars: {}, unlocked: 1, cleared: {},
      noAds: false, starterBought: false, dockTokens: 0, hintTokens: 3, bayTokens: 2,
      adsToday: { date: utcToday(), count: 0 },
      levelsSinceInterstitial: 0, seenHelp: false, seenTutorial: false,
      mutedSfx: false, mutedBgm: false,
      harborPass: false, harborPassUntil: null,
      skins: { owned: [], car: 'default', ferry: 'default' },
      streak: { count: 0, last: null, freeze: 0 },
      daily: { date: null, done: false, stars: 0, moves: 0, result: '' },
      login: { last: null, day: 0, claimed: false },
      quests: { date: null, items: [] },
      stats: { ferries: 0, combos: 0 }
    };
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return defaultSave();
      var s = Object.assign(defaultSave(), JSON.parse(raw));
      if (s.adsToday && s.adsToday.date !== utcToday()) s.adsToday = { date: utcToday(), count: 0 };
      s.skins = Object.assign({ owned: [], car: 'default', ferry: 'default' }, s.skins || {});
      s.streak = Object.assign({ count: 0, last: null, freeze: 0 }, s.streak || {});
      s.daily = Object.assign({ date: null, done: false, stars: 0, moves: 0, result: '' }, s.daily || {});
      s.login = Object.assign({ last: null, day: 0, claimed: false }, s.login || {});
      s.quests = Object.assign({ date: null, items: [] }, s.quests || {});
      s.stats = Object.assign({ ferries: 0, combos: 0 }, s.stats || {});
      return s;
    } catch (e) { return defaultSave(); }
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} }

  function levelById(id) { return LEVELS.filter(function (l) { return l.id === id; })[0]; }
  function isUnlocked(id) { return id <= (save.unlocked || 1); }
  function adsFree() {
    if (save.noAds) return true;
    return !!(save.harborPass && save.harborPassUntil && save.harborPassUntil > Date.now());
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }
  function coinChip(withPlus) {
    return '<div class="coin-chip" data-go="shop">' + Art.ticketSVG() + '<b data-tickets="1">' + save.tickets + '</b>' +
      (withPlus !== false ? '<span class="plus" aria-label="Get coins">' + Art.icon('plus', '#fff') + '</span>' : '') + '</div>';
  }
  function streakBadge() {
    return '<div class="streak-badge" data-go="daily" title="Daily streak">' + Art.flameSVG() +
      '<b>' + (save.streak.count || 0) + '</b><small>STREAK</small></div>';
  }
  function gearBtn() {
    return '<button type="button" class="round-btn gear" data-act="settings" aria-label="Settings">' + Art.icon('gear') + '</button>';
  }
  function backBtn(to) {
    return '<button type="button" class="ico-btn" data-go="' + to + '" aria-label="Back">' + Art.icon('back') + '</button>';
  }
  function starStr(n, max) {
    max = max || 3;
    var s = '', i;
    for (i = 1; i <= max; i++) s += Art.icon(i <= (n || 0) ? 'star' : 'starOff');
    return '<div class="stars">' + s + '</div>';
  }
  function showBanner(where) {
    var hide = adsFree() || where === 'daily';
    banner.hidden = hide;
    banner.textContent = hide ? '' : 'AD · 320×50 placeholder';
  }
  function closeModal() { modalRoot.className = ''; modalRoot.innerHTML = ''; }
  function openModal(html, cls) {
    modalRoot.className = 'open';
    modalRoot.innerHTML = '<div class="modal-back"><div class="modal ' + (cls || '') + '">' + html + '</div></div>';
  }
  function sfx(name) { if (window.AudioFx) AudioFx.play(name); }
  function applyMute() { if (window.AudioFx) AudioFx.setMute(!!save.mutedSfx, !!save.mutedBgm); }
  function pal(color) { return (typeof COLORS !== 'undefined' && COLORS[color]) || { fill: '#888', name: color }; }

  function ensureDailyMeta() {
    rollQuests();
    var d = utcToday();
    if (save.daily.date !== d) {
      save.daily = { date: d, done: false, stars: 0, moves: 0, result: '' };
      persist();
    }
  }
  function rollQuests() {
    var d = utcToday();
    if (save.quests.date === d && save.quests.items && save.quests.items.length) return;
    save.quests = {
      date: d,
      items: [
        { id: 'clear', label: 'Clear 2 levels', progress: 0, goal: 2, reward: ECO.questReward },
        { id: 'ferries', label: 'Fill 3 ferries', progress: 0, goal: 3, reward: ECO.questReward },
        { id: 'combo', label: 'Score a combo', progress: 0, goal: 1, reward: ECO.questReward }
      ]
    };
    persist();
  }
  function bumpQuest(id, n) {
    rollQuests();
    var item = save.quests.items.filter(function (q) { return q.id === id; })[0];
    if (!item || item.done) return;
    item.progress = Math.min(item.goal, (item.progress || 0) + (n || 1));
    if (item.progress >= item.goal && !item.done) {
      item.done = true;
      save.tickets += item.reward;
      toast('Quest complete! +' + item.reward + ' coins');
      sfx('coin');
    }
    persist();
  }
  function pendingLogin() { return save.login.last !== utcToday(); }
  function loginDay() {
    var last = save.login.last, d = utcToday();
    if (!last) return 1;
    if (dayShift(last, 1) === d) return Math.min(7, (save.login.day || 0) + 1);
    return 1;
  }
  function claimLogin(mult) {
    if (!pendingLogin()) return 0;
    var day = loginDay();
    var amt = (ECO.loginCalendar[day - 1] || 10) * (mult || 1);
    save.login = { last: utcToday(), day: day, claimed: true };
    save.tickets += amt;
    persist();
    return amt;
  }
  function syncStreakOnOpen() {
    var d = utcToday(), st = save.streak;
    if (!st.last || st.last === d) return;
    if (st.last === dayShift(d, -1)) return;
    if (st.freeze > 0) { st.freeze -= 1; st.last = dayShift(d, -1); toast('Streak freeze used'); }
    else st.count = 0;
    persist();
  }
  function markDailyWin(stars, moves) {
    var d = utcToday(), st = save.streak, y = dayShift(d, -1);
    if (st.last === d) { /* counted */ }
    else if (st.last === y || st.count === 0) st.count = (st.last === y ? st.count : 0) + 1;
    else if (st.freeze > 0) { st.freeze -= 1; st.count += 1; }
    else st.count = 1;
    st.last = d;
    var boxes = '';
    for (var i = 0; i < 3; i++) boxes += i < stars ? '⭐' : '☆';
    save.daily = {
      date: d, done: true, stars: stars, moves: moves,
      result: 'Ferry Jam Daily ' + d + '\n' + boxes + '  ' + moves + ' moves\n🔥 Streak: ' + st.count + '\nhttps://jonidge.com/play/ferry-jam/'
    };
    persist();
  }
  var dailyCache = null;
  function todaysDaily() {
    var d = utcToday();
    if (!dailyCache || dailyCache.date !== d) dailyCache = { date: d, level: Engine.generateDaily(d, 2) };
    return dailyCache.level;
  }

  /* ---------------- screens ---------------- */
  function render() {
    ensureDailyMeta();
    if (screen === 'home') renderHome();
    else if (screen === 'levels') renderLevels();
    else if (screen === 'help') renderHelp();
    else if (screen === 'shop') renderShop();
    else if (screen === 'daily') renderDaily();
    else if (screen === 'rewards') renderRewards();
    else if (screen === 'play') renderPlay();
    showBanner(play && play.mode === 'daily' && screen === 'play' ? 'daily' : screen);
  }
  function sceneBits() {
    return '<div class="sky-bits"><div class="sun"></div><div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div>' +
      '<div class="island i1"></div><div class="island i2"></div></div>';
  }
  function topbar(title, back) {
    return '<div class="topbar">' + backBtn(back || 'home') + '<h2>' + title + '</h2>' + coinChip(true) + '</div>';
  }

  function renderHome() {
    var questOpen = save.quests.items.some(function (q) { return !q.done; });
    var next = nextPlayable();
    var dailyDone = save.daily.done && save.daily.date === utcToday();
    view.innerHTML =
      '<div class="home">' + sceneBits() +
        '<div class="home-hud">' + coinChip(true) + '<span class="grow"></span>' + streakBadge() + gearBtn() + '</div>' +
        '<div class="home-hero">' +
          '<div class="logo-wrap">' + Art.logoSVG() + '</div>' +
          '<h1 class="wordmark">Ferry <span>Jam</span></h1>' +
          '<p class="tagline">Match colors · Fill the ferry · Clear the lot</p>' +
        '</div>' +
        '<div class="home-actions">' +
          '<button type="button" class="btn mega block" data-act="play-next"><span class="mega-sub">Level ' + next + '</span>' + Art.icon('play', '#fff') + ' Play</button>' +
          '<div class="home-row">' +
            '<button type="button" class="tile daily-tile" data-go="daily">' +
              '<span class="tile-ico">' + Art.flameSVG() + '</span><span class="tile-txt"><b>Daily Puzzle</b><small>' +
              (dailyDone ? 'Done · ' + save.streak.count + ' day streak' : 'New harbor today!') + '</small></span>' +
              (dailyDone ? '' : '<span class="new-tag">NEW</span>') + '</button>' +
            '<button type="button" class="tile gift-tile" data-go="rewards">' +
              '<span class="tile-ico">' + Art.icon('gift') + '</span><span class="tile-txt"><b>Rewards</b><small>' +
              (pendingLogin() ? 'Gift ready' : 'Daily quests') + '</small></span>' +
              (questOpen || pendingLogin() ? '<span class="dot"></span>' : '') + '</button>' +
          '</div>' +
          '<div class="home-row">' +
            '<button type="button" class="btn white block" data-go="levels">' + Art.icon('calendar') + ' Levels</button>' +
            '<button type="button" class="btn white block" data-go="shop">' + Art.icon('shop') + ' Shop</button>' +
          '</div>' +
          '<button type="button" class="link-btn" data-go="help">' + Art.icon('help') + ' How to play</button>' +
        '</div>' +
        '<div class="home-sea"><div class="sparkles"></div><div class="home-boat">' +
          Art.ferrySVG({ color: 'blue', capacity: 2 }) + '</div>' +
          '<div class="home-palm l">' + Art.palmSVG() + '</div><div class="home-palm r">' + Art.palmSVG(true) + '</div>' +
        '</div>' +
      '</div>';
  }

  function renderLevels() {
    var chapters = (typeof CHAPTERS !== 'undefined' && CHAPTERS) || [{ id: 1, name: 'Harbor', start: 1, end: LEVELS.length }];
    var html = '';
    chapters.forEach(function (ch) {
      var got = 0, max = 0;
      LEVELS.forEach(function (lv) { if (lv.id >= ch.start && lv.id <= ch.end) { max += 3; got += save.stars[lv.id] || 0; } });
      html += '<div class="chapter-head"><span class="ch-no">Chapter ' + ch.id + '</span><b>' + ch.name + '</b><span class="ch-stars">' + Art.icon('star') + got + '/' + max + '</span></div>';
      LEVELS.filter(function (lv) { return lv.id >= ch.start && lv.id <= ch.end; }).forEach(function (lv) {
        var open = isUnlocked(lv.id);
        var isNext = open && !save.cleared[lv.id];
        html += '<button type="button" class="lvl' + (open ? '' : ' locked') + (isNext ? ' next' : '') + '" ' +
          (open ? 'data-level="' + lv.id + '"' : 'disabled') + '>' +
          (open ? '<div class="num">' + lv.id + '</div>' : '<div class="lock-ico">' + Art.icon('lock') + '</div>') +
          '<div class="nm">' + (lv.name || ('Level ' + lv.id)) + '</div>' + starStr(save.stars[lv.id] || 0) + '</button>';
      });
    });
    view.innerHTML = '<div class="screen">' + sceneBits() + topbar('Levels') + '<div class="level-grid chapters">' + html + '</div></div>';
  }

  function renderHelp() {
    var mini = function (c, dir) { return '<span class="help-art">' + Art.carSVG({ color: c, id: 'h' + c }, { dir: dir || 'N', kind: 'sedan' }) + '</span>'; };
    view.innerHTML =
      '<div class="screen">' + sceneBits() + topbar('How to play') +
        '<div class="help-list">' +
        '<div class="help-card">' + mini('red') + '<div><h3>1. Tap a clear car</h3><p>A car can leave only if the road ahead is empty, all the way to the edge of the lot.</p></div></div>' +
        '<div class="help-card">' + mini('blue', 'E') + '<div><h3>2. Drive the road</h3><p>Cars never fall off the map. They drive the ring road down to the pier, then take the ramp.</p></div></div>' +
        '<div class="help-card"><span class="help-art wide">' + Art.ferrySVG({ color: 'yellow', capacity: 2 }) + '</span><div><h3>3. Match the boarding ferry</h3><p>Only a docked ferry loads, and only its own color. Full ferries sail and the NEXT ferry docks.</p></div></div>' +
        '<div class="help-card">' + mini('green', 'E') + '<div><h3>4. Waiting bays</h3><p>Wrong color? The car parks in a numbered bay until its ferry docks. All bays full means a jam.</p></div></div>' +
        '<div class="help-card"><span class="help-art">' + Art.gateSVG() + '</span><div><h3>5. Specials</h3><p>Keys unlock cars, gates block lanes, some ferries take small cars only, some leave on a timer.</p></div></div>' +
        '</div>' +
        '<button type="button" class="btn mega block" data-act="start-play">Got it</button>' +
      '</div>';
  }

  function priceOf(p) { return Economy.formatPrice(p.priceUSD, currency); }
  function renderShop() {
    var P = function (id) { return Economy.product(id); };
    var packs = ['tickets_100', 'tickets_550', 'tickets_1200', 'tickets_2500'].map(function (id, i) {
      var p = P(id); if (!p) return '';
      return '<div class="pack' + (p.tag === 'Best' ? ' best' : '') + '">' +
        (p.tag ? '<span class="pack-tag">' + (p.tag === 'Best' ? 'Best value' : p.tag) + '</span>' : '') +
        '<div class="pack-art">' + Art.coinStackSVG(i === 3 ? 5 : i + 1) + '</div>' +
        '<div class="pack-amt">' + Art.ticketSVG() + p.tickets.toLocaleString('en-US') + '</div>' +
        '<button type="button" class="btn green sm block" data-buy="' + p.id + '">' + priceOf(p) + '</button></div>';
    }).join('');
    var ra = P('remove_ads'), hp = P('harbor_pass'), sp = P('starter_pack');
    var taxi = P('skin_car_taxi'), stripe = P('skin_ferry_stripe');
    view.innerHTML =
      '<div class="screen">' + sceneBits() + topbar('Shop') +
        '<div class="shop-list">' +
          '<div class="offer starter"><span class="ribbon-tag">Starter Pack</span>' +
            '<div class="offer-art">' + Art.coinStackSVG(3) + '</div>' +
            '<div class="offer-txt"><b>' + sp.tickets + ' coins + 3 hints</b><small>Plus a short ad-free window. One time only.</small></div>' +
            '<button type="button" class="btn sm" data-buy="starter_pack">' + priceOf(sp) + '</button></div>' +
          '<div class="offer free"><div class="offer-art ad-art">' + Art.icon('ad', '#fff') + '</div>' +
            '<div class="offer-txt"><b>Free coins</b><small>Watch a placeholder ad · +' + ECO.adReward.tickets + ' coins</small></div>' +
            '<button type="button" class="btn teal sm" data-act="watch-ad">Watch</button></div>' +
          '<div class="pack-grid">' + packs + '</div>' +
          '<div class="offer pass"><div class="offer-art">' + Art.ferrySVG({ color: 'yellow', capacity: 2 }) + '</div>' +
            '<div class="offer-txt"><b>Harbor Pass</b><small>No ads + ' + ((hp.extras && hp.extras.dailyBonus) || 20) + ' bonus coins a day for 30 days</small></div>' +
            '<button type="button" class="btn sm" data-buy="harbor_pass">' + priceOf(hp) + '</button></div>' +
          '<div class="offer noads"><div class="offer-art noads-art">AD<i></i></div>' +
            '<div class="offer-txt"><b>Remove Ads</b><small>No interstitials or banner. Rewarded ads stay optional.</small></div>' +
            '<button type="button" class="btn sm" data-buy="remove_ads">' + priceOf(ra) + '</button></div>' +
          '<div class="section-head">Cosmetics</div>' +
          '<div class="pack-grid two">' +
            '<div class="pack skin"><div class="pack-art">' + Art.carSVG({ color: 'yellow', id: 'taxi' }, { dir: 'E', kind: 'sedan' }) + '</div><div class="pack-amt">Taxi skin</div>' +
              '<button type="button" class="btn green sm block" data-buy="skin_car_taxi">' + priceOf(taxi) + '</button></div>' +
            '<div class="pack skin"><div class="pack-art">' + Art.ferrySVG({ color: 'green', capacity: 2 }, { stripe: true }) + '</div><div class="pack-amt">Stripe livery</div>' +
              '<button type="button" class="btn green sm block" data-buy="skin_ferry_stripe">' + priceOf(stripe) + '</button></div>' +
          '</div>' +
          '<p class="fine">Placeholder prices only. Nothing is billed. Contact jonidge@yahoo.com.</p>' +
        '</div>' +
      '</div>';
  }

  function miniLot(lv) {
    if (!lv) return '';
    var cs = 12, W = lv.cols * cs + 8, H = lv.rows * cs + 8;
    var s = '<svg class="mini-lot" viewBox="-4 -4 ' + W + ' ' + H + '"><rect x="-4" y="-4" width="' + W + '" height="' + H + '" rx="6" fill="#4A505C"/>';
    (lv.obstacles || []).forEach(function (o) { s += '<rect x="' + (o.c * cs + 2) + '" y="' + (o.r * cs + 2) + '" width="8" height="8" rx="2" fill="#C48A4A"/>'; });
    lv.cars.forEach(function (car) {
      var p = carPos(car);
      s += '<rect x="' + (p.c0 * cs + 1.5) + '" y="' + (p.r0 * cs + 1.5) + '" width="' + ((p.c1 - p.c0 + 1) * cs - 3) + '" height="' + ((p.r1 - p.r0 + 1) * cs - 3) +
        '" rx="3" fill="' + (Art.PALETTE[car.color] || {}).body + '" stroke="#0004"/>';
    });
    return s + '</svg>';
  }

  function renderDaily() {
    var d = utcToday();
    var done = save.daily.done && save.daily.date === d;
    var st = save.streak;
    var lv = todaysDaily();
    var week = '', names = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (var i = -6; i <= 0; i++) {
      var day = dayShift(d, i);
      var played = st.last && st.count > 0 && day <= st.last && day > dayShift(st.last, -st.count);
      week += '<div class="wk' + (played ? ' on' : '') + (i === 0 ? ' today' : '') + '"><span>' + names[new Date(day + 'T00:00:00Z').getUTCDay()] + '</span><i>' +
        (played ? Art.icon('check', '#fff') : (i === 0 ? '?' : '')) + '</i></div>';
    }
    var now = new Date();
    var left = Math.max(0, Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) - now.getTime());
    var hh = Math.floor(left / 3600000), mm = Math.floor(left % 3600000 / 60000);
    var pretty = new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' });
    view.innerHTML =
      '<div class="screen daily">' + sceneBits() + topbar('Daily Puzzle') +
        '<div class="daily-hero">' +
          '<div class="ribbon-title">Daily Harbor</div>' +
          '<div class="daily-date">' + pretty + '</div>' +
          '<div class="streak-row"><div class="big-flame">' + Art.flameSVG() + '<b>' + (st.count || 0) + '</b></div>' +
            '<div class="streak-txt"><b>' + (st.count || 0) + ' day streak</b><small>' + (st.freeze ? st.freeze + ' streak freeze ready' : 'No freeze yet. Grab one below.') + '</small></div></div>' +
          '<div class="week">' + week + '</div>' +
        '</div>' +
        '<div class="daily-card">' +
          '<div class="preview">' + miniLot(lv) + '</div>' +
          '<div class="facts">' +
            '<div><b>' + (lv ? lv.cars.length : '?') + '</b><small>cars</small></div>' +
            '<div><b>' + (lv ? lv.ferries.length : '?') + '</b><small>ferries</small></div>' +
            '<div><b>' + (lv ? lv.parMoves : '?') + '</b><small>par moves</small></div>' +
          '</div>' +
          '<div class="rewards-row"><span>' + Art.ticketSVG() + '+' + (ECO.dailyPuzzleReward || 25) + '</span><span>' + Art.icon('star') + '+' + (ECO.dailyPuzzlePerfect || 15) + ' perfect</span></div>' +
        '</div>' +
        (done
          ? '<div class="done-row">' + starStr(save.daily.stars) + '<span>Cleared in ' + save.daily.moves + ' moves</span></div>' +
            '<div class="home-row"><button type="button" class="btn teal block" data-act="daily-share">' + Art.icon('share', '#fff') + ' Share</button>' +
            '<button type="button" class="btn white block" data-act="daily-play">Replay</button></div>'
          : '<button type="button" class="btn mega block" data-act="daily-play">' + Art.icon('play', '#fff') + ' Play today\'s harbor</button>') +
        '<div class="daily-foot">' +
          '<button type="button" class="btn ghost sm" data-act="buy-freeze">' + Art.icon('snow') + ' Freeze · ' + ECO.streakFreezeCost + '</button>' +
          '<span class="countdown">Next harbor in ' + hh + 'h ' + mm + 'm</span>' +
        '</div>' +
        '<p class="fine">Same puzzle for everyone. Miss a day and a freeze keeps the streak.</p>' +
      '</div>';
  }

  function renderRewards() {
    rollQuests();
    var claimedUpTo = pendingLogin() ? loginDay() - 1 : save.login.day;
    var cal = ECO.loginCalendar.map(function (n, i) {
      var day = i + 1, cls = 'cal-day';
      if (day <= claimedUpTo) cls += ' claimed';
      if (pendingLogin() && loginDay() === day) cls += ' today';
      if (day === 7) cls += ' big';
      return '<div class="' + cls + '"><div class="d">Day ' + day + '</div><div class="ci">' + (day === 7 ? Art.icon('gift') : Art.ticketSVG()) + '</div><div class="n">+' + n + '</div>' +
        (day <= claimedUpTo ? '<span class="tick">' + Art.icon('check', '#fff') + '</span>' : '') + '</div>';
    }).join('');
    var quests = save.quests.items.map(function (q) {
      var pct = Math.min(100, Math.round((q.progress || 0) / q.goal * 100));
      return '<div class="quest' + (q.done ? ' done' : '') + '"><div class="info"><b>' + q.label + '</b><div class="bar"><i style="width:' + pct + '%"></i></div><small>' + (q.progress || 0) + '/' + q.goal + '</small></div>' +
        '<div class="q-rew">' + (q.done ? Art.icon('check', '#17A85C') : Art.ticketSVG() + '+' + q.reward) + '</div></div>';
    }).join('');
    view.innerHTML =
      '<div class="screen">' + sceneBits() + topbar('Rewards') +
        '<div class="panel"><div class="ribbon-title">Daily gift</div><div class="calendar">' + cal + '</div>' +
        (pendingLogin()
          ? '<div class="home-row"><button type="button" class="btn green block" data-act="claim-login">Claim</button>' +
            '<button type="button" class="btn teal block" data-act="claim-login-x2">' + Art.icon('ad', '#fff') + ' Claim ×2</button></div>'
          : '<p class="fine dark">Claimed today. Come back tomorrow for day ' + Math.min(7, save.login.day + 1) + '.</p>') +
        '</div>' +
        '<div class="panel"><div class="ribbon-title">Daily quests</div>' + quests + '</div>' +
      '</div>';
  }

  /* ---------------- play ---------------- */
  function startLevel(id, mode) {
    var lv = mode === 'daily' ? todaysDaily() : levelById(id);
    if (!lv) { toast('Could not load that harbor'); return; }
    if (mode !== 'daily' && !isUnlocked(id)) return;
    play = {
      level: lv, state: Engine.init(lv), history: [], mode: mode || 'campaign',
      freeUndos: ECO.freeUndosPerLevel || 3, doubled: false, tutorialStep: 0,
      shownDocked: {}, intro: true
    };
    moveQueue = [];
    busy = false;
    if (mode !== 'daily' && !save.seenHelp) { screen = 'help'; render(); return; }
    screen = 'play';
    render();
  }
  function nextPlayable() {
    for (var i = 0; i < LEVELS.length; i++) {
      if (isUnlocked(LEVELS[i].id) && !save.cleared[LEVELS[i].id]) return LEVELS[i].id;
    }
    return Math.min(save.unlocked || 1, LEVELS[LEVELS.length - 1].id);
  }

  function carPos(car) {
    var cells = Engine.cellsOf(car);
    var rs = cells.map(function (p) { return p.r; }), cs = cells.map(function (p) { return p.c; });
    return { r0: Math.min.apply(null, rs), r1: Math.max.apply(null, rs), c0: Math.min.apply(null, cs), c1: Math.max.apply(null, cs) };
  }
  function carHtml(car) {
    var p = carPos(car);
    var badges = '';
    if (car.locked) badges += '<span class="badge">' + Art.lockBadge() + '</span>';
    if (car.isKey) badges += '<span class="badge">' + Art.keyBadge() + '</span>';
    var locked = play && Engine.isLocked(car, play.state);
    return '<button type="button" class="car' + (locked ? ' locked' : '') + '" data-car="' + car.id + '" style="grid-row:' + (p.r0 + 1) + ' / ' + (p.r1 + 2) +
      ';grid-column:' + (p.c0 + 1) + ' / ' + (p.c1 + 2) + '" aria-label="' + car.color + ' car">' +
      Art.carSVG(car, { dir: car.dir }) + badges + '</button>';
  }
  function deckCarHtml(car, dir) { return Art.carSVG(car, { dir: dir || 'E' }); }

  function ferryHtml(f, cls) {
    var slots = Art.ferrySlots(f.capacity);
    var slotHtml = (f.cargo || []).map(function (c, i) {
      var s = slots[i];
      return '<div class="fslot" style="left:' + s.x + '%;top:' + s.y + '%;width:' + s.w + '%;height:' + s.h + '%">' + deckCarHtml(c, 'E') + '</div>';
    }).join('');
    var badges = '';
    if (f.maxLen) badges += '<span class="ferry-badge small-only">Cars only</span>';
    if (f.timeLimit) badges += '<span class="ferry-badge timer">⏱ ' + (f.timeLeft == null ? f.timeLimit : f.timeLeft) + '</span>';
    return '<div class="ferry ' + (cls || '') + '" data-ferry="' + f.id + '">' + badges +
      '<div class="ferry-art">' + Art.ferrySVG(f, { stripe: save.skins.ferry === 'stripe' }) + '</div>' +
      '<div class="ferry-slots">' + slotHtml + '</div></div>';
  }
  function powerBtn(act, cls, ico, label, count) {
    return '<button type="button" class="power ' + cls + '" data-act="' + act + '"><span class="orb">' + ico + '</span>' +
      '<span class="cnt' + (count > 0 ? '' : ' plus') + '">' + (count > 0 ? count : '+') + '</span><b>' + label + '</b></button>';
  }

  function renderPlay() {
    var lv = play.level, st = play.state;
    var rows = lv.rows, cols = lv.cols;
    var cells = '';
    var gates = Engine.activeBarriers ? Engine.activeBarriers(lv, st) : (lv.barriers || []);
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var obs = (lv.obstacles || []).some(function (o) { return o.r === r && o.c === c; });
        var gate = gates.filter(function (b) { return b.r === r && b.c === c; })[0];
        cells += '<div class="cell" style="grid-row:' + (r + 1) + ';grid-column:' + (c + 1) + '">' +
          (obs ? '<div class="obs">' + Art.crateSVG() + '</div>' : '') +
          (gate ? '<div class="gate">' + Art.gateSVG() + '</div>' : '') + '</div>';
      }
    }
    var cars = st.cars.map(carHtml).join('');
    var cap = Engine.holdCap(st);
    var bays = '';
    for (var i = 0; i < cap; i++) {
      var held = st.hold[i];
      bays += '<div class="bay' + (held ? ' full' : '') + '" data-bay="' + i + '"><span class="wp" data-wp="bay-' + i + '"></span>' +
        (held ? deckCarHtml(held, 'E') : '<span class="bay-empty"><i>' + (i + 1) + '</i>' + Art.icon('dock', '#ffffffb0') + '</span>') + '</div>';
    }
    var ramps = st.docked.map(function (f, i) {
      return '<div class="ramp-col"><div class="ramp" data-ramp="' + i + '"><span class="wp" data-wp="ramp-' + i + '"></span></div></div>';
    }).join('');
    var shown = play.shownDocked || {};
    var berths = st.docked.map(function (f, i) {
      var p = pal(f.color);
      var pips = '';
      for (var k = 0; k < f.capacity; k++) pips += '<i class="pip' + (k < f.loaded ? ' on' : '') + '"></i>';
      return '<div class="berth boarding" data-berth="' + i + '" style="--fc:' + p.fill + '">' +
        '<div class="berth-sign"><span class="dotc"></span>BOARDING <b>' + f.loaded + '/' + f.capacity + '</b><span class="cap-pips">' + pips + '</span></div>' +
        ferryHtml(f, shown[f.id] ? '' : 'arrive') + '<span class="wp" data-wp="ferry-' + i + '"></span></div>';
    }).join('') || '<div class="berth empty"><div class="berth-sign">All ferries sailed</div></div>';
    play.shownDocked = {};
    st.docked.forEach(function (f) { play.shownDocked[f.id] = true; });
    var q = st.queue.map(function (f, i) {
      var p = pal(f.color);
      return '<div class="qferry" data-qid="' + f.id + '" title="' + p.name + '" style="--d:' + (i * 0.4) + 's">' +
        '<span class="next-tag" style="--fc:' + p.fill + '">' + (i === 0 ? 'NEXT' : 'THEN') + '</span>' +
        Art.ferrySVG(f, { stripe: save.skins.ferry === 'stripe' }) + '<span class="qcap">' + f.capacity + '</span></div>';
    }).join('');
    var title = play.mode === 'daily' ? 'DAILY' : ('LEVEL ' + lv.id);
    view.innerHTML =
      '<div class="play">' +
        '<div class="hud">' +
          '<button type="button" class="level-pill" data-go="' + (play.mode === 'daily' ? 'daily' : 'levels') + '">' + Art.icon('back', '#fff') + '<span>' + title + '</span></button>' +
          coinChip(true) + '<span class="grow"></span>' + gearBtn() + streakBadge() +
        '</div>' +
        '<div class="stage" id="stage">' +
          '<div class="yard" id="yard">' +
            '<div class="deco palm-l">' + Art.palmSVG() + '</div>' +
            '<div class="deco palm-r">' + Art.palmSVG(true) + '</div>' +
            '<div class="ring" id="ring">' +
              '<div class="road road-n"><span class="wp" data-wp="N"></span></div>' +
              '<div class="yard-mid">' +
                '<div class="road road-w"><span class="wp" data-wp="W"></span></div>' +
                '<div class="lot" id="lot" style="grid-template-rows:repeat(' + rows + ',1fr);grid-template-columns:repeat(' + cols + ',1fr)">' + cells + cars + '</div>' +
                '<div class="road road-e"><span class="wp" data-wp="E"></span></div>' +
              '</div>' +
              '<div class="road road-s"><span class="wp" data-wp="S"></span></div>' +
              '<div class="deco cone">' + Art.coneSVG() + '</div>' +
            '</div>' +
            '<div class="deco bed-l">' + Art.flowerBedSVG() + '</div>' +
            '<div class="deco rock-r">' + Art.rockSVG() + '</div>' +
          '</div>' +
          '<div class="dock-row" id="dock-row">' +
            '<div class="bay-block" id="bay-block"><div class="bay-label"><span>Waiting</span><span>bays</span></div><div class="waiting-bays">' + bays + '</div></div>' +
            '<div class="neck" id="neck"><span class="wp" data-wp="NECK"></span><i class="curb l"></i><i class="curb r"></i></div>' +
          '</div>' +
          '<div class="pier">' +
            '<span class="wp pier-wp" data-wp="PIER"></span>' +
            '<div class="posts"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
          '</div>' +
          '<div class="ramps">' + ramps + '</div>' +
          '<div class="berths">' + berths + '</div>' +
          '<div class="water"><div class="sparkles"></div><div class="waves"></div>' +
            '<div class="queue-row">' + (q || '<span class="q-empty">No more ferries in the queue</span>') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="powerbar">' +
          powerBtn('undo', 'undo', Art.icon('undo', '#fff'), 'Undo', play.freeUndos) +
          powerBtn('hint', 'hint', Art.icon('hint'), 'Hint', save.hintTokens || 0) +
          powerBtn('extra-bay', 'xbay', Art.icon('dock', '#fff'), 'Extra bay', save.bayTokens || 0) +
        '</div>' +
      '</div>';
    fitBoard();
    if (play.intro) { play.intro = false; if (lv.blurb) introTip(lv.blurb); }
    maybeTutorial();
  }

  function fitBoard() {
    var yard = document.getElementById('yard'), ring = document.getElementById('ring'), lot = document.getElementById('lot');
    if (!yard || !ring || !lot || !play) return;
    var lv = play.level;
    var W = yard.clientWidth - 20, H = yard.clientHeight - 22;
    var cell = Math.floor(Math.min((W - 2 * ROAD) / lv.cols, (H - 2 * ROAD) / lv.rows, 64));
    cell = Math.max(28, cell);
    lot.style.width = (cell * lv.cols) + 'px';
    lot.style.height = (cell * lv.rows) + 'px';
    ring.style.width = (cell * lv.cols + 2 * ROAD) + 'px';
    play.cell = cell;
    var stage = document.getElementById('stage'), neck = document.getElementById('neck'), bb = document.getElementById('bay-block');
    if (stage && neck) {
      var sr = stage.getBoundingClientRect(), rr = ring.getBoundingClientRect();
      var nx = rr.right - sr.left - ROAD / 2;
      var nw = 30;
      neck.style.left = (nx - nw / 2) + 'px';
      neck.style.width = nw + 'px';
      if (bb) bb.style.right = (sr.width - (nx - nw / 2) + 6) + 'px';
    }
  }
  window.addEventListener('resize', function () { if (screen === 'play') fitBoard(); });

  function introTip(text) {
    var stage = document.getElementById('stage');
    if (!stage) return;
    var n = document.createElement('div');
    n.className = 'intro-tip';
    n.textContent = text;
    stage.appendChild(n);
    setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 3600);
  }

  function maybeTutorial() {
    if (!play || play.mode === 'daily' || save.seenTutorial) return;
    var stage = document.getElementById('stage');
    if (!stage) return;
    var legal = Engine.legalMoves(play.level, play.state);
    var step = play.tutorialStep || 0;
    var text = [
      'Tap a car that can drive out. The road ahead must be clear.',
      'Cars follow the road to the pier and board the ferry of their color.',
      'Wrong color? It parks in a waiting bay until its ferry docks.'
    ][Math.min(step, 2)];
    var tutor = document.createElement('div');
    tutor.className = 'tutor';
    tutor.innerHTML = '<div class="bubble">' + text + '<div><button type="button" class="btn sm" data-act="tutor-next">Got it</button></div></div>';
    if (step === 0 && legal[0]) {
      var car = stage.querySelector('[data-car="' + legal[0] + '"]');
      if (car) {
        var sr = stage.getBoundingClientRect(), cr = car.getBoundingClientRect();
        var hand = document.createElement('div');
        hand.className = 'hand-wrap';
        hand.innerHTML = Art.handSVG();
        hand.style.left = (cr.left - sr.left + cr.width * 0.4) + 'px';
        hand.style.top = (cr.top - sr.top + cr.height * 0.4) + 'px';
        tutor.appendChild(hand);
      }
    }
    stage.appendChild(tutor);
  }

  /* ---------------- motion + juice ---------------- */
  function wp(name, stage) {
    var el = stage.querySelector('[data-wp="' + name + '"]');
    if (!el) return null;
    var sr = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - sr.left, y: r.top + r.height / 2 - sr.top };
  }
  function buildPath(start, edge, destName, stage) {
    var N = wp('N', stage), E = wp('E', stage), Wp = wp('W', stage), S = wp('S', stage);
    var pts = [start];
    if (edge === 'N') pts.push({ x: start.x, y: N.y }, { x: E.x, y: N.y }, { x: E.x, y: S.y });
    else if (edge === 'E') pts.push({ x: E.x, y: start.y }, { x: E.x, y: S.y });
    else if (edge === 'W') pts.push({ x: Wp.x, y: start.y }, { x: Wp.x, y: S.y });
    else pts.push({ x: start.x, y: S.y });
    pts.push(S);
    var neck = wp('NECK', stage), pier = wp('PIER', stage);
    if (neck) pts.push({ x: S.x, y: neck.y });
    if (pier) pts.push({ x: S.x, y: pier.y });
    if (destName.indexOf('ferry-') === 0) {
      var ramp = wp('ramp-' + destName.split('-')[1], stage);
      if (ramp) { pts.push({ x: ramp.x, y: pts[pts.length - 1].y }); pts.push(ramp); }
    }
    var dest = wp(destName, stage);
    if (dest) {
      if (destName.indexOf('bay-') === 0) pts.push({ x: dest.x, y: pts[pts.length - 1].y });
      pts.push(dest);
    }
    return pts.filter(function (p, i) { return i === 0 || Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) > 1; });
  }

  function animatePath(flyer, pts, w, h, endScale, rot0) {
    var segs = [], total = 0, i;
    for (i = 1; i < pts.length; i++) {
      var dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y;
      var len = Math.hypot(dx, dy) || 1;
      segs.push({ a: pts[i - 1], b: pts[i], len: len, ang: Math.atan2(dy, dx) * 180 / Math.PI + 90 });
      total += len;
    }
    if (!segs.length) return Promise.resolve();
    var dur = Math.max(650, Math.min(1100, total * 1.1));
    var frames = [], acc = 0, prevRot = rot0;
    segs.forEach(function (s, k) {
      var rot = s.ang;
      while (rot - prevRot > 180) rot -= 360;
      while (rot - prevRot < -180) rot += 360;
      var sc1 = (k === segs.length - 1) ? (endScale || 1) : 1;
      var o0 = acc / total;
      acc += s.len;
      frames.push({ offset: o0, transform: 'translate(' + (s.a.x - w / 2) + 'px,' + (s.a.y - h / 2) + 'px) rotate(' + rot + 'deg) scale(1)' });
      frames.push({ offset: Math.min(1, acc / total), transform: 'translate(' + (s.b.x - w / 2) + 'px,' + (s.b.y - h / 2) + 'px) rotate(' + rot + 'deg) scale(' + sc1 + ')' });
      prevRot = rot;
    });
    frames[0].offset = 0;
    frames[frames.length - 1].offset = 1;
    var anim = flyer.animate(frames, { duration: dur, delay: 110, easing: 'cubic-bezier(.45,.05,.4,1)', fill: 'forwards' });
    return anim.finished.catch(function () {});
  }

  function dustTrail(flyer, stage, until) {
    var t = setInterval(function () {
      if (!flyer.parentNode) { clearInterval(t); return; }
      var sr = stage.getBoundingClientRect(), r = flyer.getBoundingClientRect();
      var d = document.createElement('i');
      d.className = 'dust';
      d.style.left = (r.left + r.width / 2 - sr.left - 8 + (Math.random() * 6 - 3)) + 'px';
      d.style.top = (r.top + r.height / 2 - sr.top - 8 + (Math.random() * 6 - 3)) + 'px';
      stage.appendChild(d);
      setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 620);
    }, 75);
    until.then(function () { clearInterval(t); });
  }

  function fxBanner(text, cls) {
    var stage = document.getElementById('stage');
    if (!stage) return;
    var n = document.createElement('div');
    n.className = 'fx-toast ' + (cls || '');
    n.textContent = text;
    stage.appendChild(n);
    setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 1050);
  }

  function flyTickets(n, fromEl) {
    var chip = document.querySelector('[data-tickets]');
    if (!chip || !fromEl) { sfx('coin'); return; }
    var a = fromEl.getBoundingClientRect(), b = chip.getBoundingClientRect();
    for (var i = 0; i < Math.min(n, 7); i++) {
      var el = document.createElement('div');
      el.className = 'fly-ticket';
      el.innerHTML = Art.ticketSVG();
      el.style.left = (a.left + a.width / 2 - 14 + (i - 2) * 10) + 'px';
      el.style.top = (a.top + a.height / 2 - 14) + 'px';
      document.body.appendChild(el);
      (function (node, delay) {
        setTimeout(function () {
          node.style.transform = 'translate(' + (b.left - a.left) + 'px,' + (b.top - a.top) + 'px) scale(.6)';
          node.style.opacity = '0.2';
        }, 30 + delay);
        setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 850 + delay);
      })(el, i * 70);
    }
    sfx('coin');
  }

  function burstConfetti(cx, cy, count) {
    var cvs = document.getElementById('fx');
    if (!cvs) return;
    var ctx = cvs.getContext('2d');
    cvs.width = innerWidth; cvs.height = innerHeight;
    var bits = [], i, local = cy != null;
    for (i = 0; i < (count || 90); i++) {
      var ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, sp = 3 + Math.random() * 5;
      bits.push({
        x: local ? cx : Math.random() * cvs.width, y: local ? cy : -20 - Math.random() * 80,
        vx: local ? Math.cos(ang) * sp : -2 + Math.random() * 4, vy: local ? Math.sin(ang) * sp : 2 + Math.random() * 4,
        w: 5 + Math.random() * 6, c: ['#F2393C', '#2F86FF', '#FFC81E', '#22C065', '#FF7A1A', '#FFFFFF'][i % 6], rot: Math.random() * 6
      });
    }
    var t = 0;
    function tick() {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      bits.forEach(function (b) {
        if (local) b.vy += 0.18;
        b.y += b.vy; b.x += b.vx; b.rot += 0.15;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot);
        ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -3, b.w, 6); ctx.restore();
      });
      if (++t < 95) requestAnimationFrame(tick); else ctx.clearRect(0, 0, cvs.width, cvs.height);
    }
    tick();
  }

  function splashAt(el) {
    var stage = document.getElementById('stage');
    if (!stage || !el) return;
    var sr = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
    var s = document.createElement('div');
    s.className = 'splash';
    s.style.left = (r.left + r.width * 0.5 - sr.left) + 'px';
    s.style.top = (r.top + r.height * 0.82 - sr.top) + 'px';
    s.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i><b></b>';
    stage.appendChild(s);
    setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 950);
  }

  function destFor(result, nextState) {
    if (result.how === 'hold') return 'bay-' + Math.max(0, nextState.hold.length - 1);
    if (result.how === 'ferry') {
      var docked = play._prevDocked || [], found = 0;
      for (var i = 0; i < docked.length; i++) if (docked[i].id === result.ferryId) { found = i; break; }
      return 'ferry-' + found;
    }
    return 'PIER';
  }

  function sailAway(result, done) {
    var fEl = document.querySelector('.ferry[data-ferry="' + result.ferryId + '"]');
    if (!fEl) { done(); return; }
    var prevF = (play._prevDockedFull || []).filter(function (f) { return f.id === result.ferryId; })[0];
    if (prevF && result.car) {
      var s = Art.ferrySlots(prevF.capacity)[prevF.loaded];
      if (s) {
        var d = document.createElement('div');
        d.className = 'fslot pop';
        d.style.cssText = 'left:' + s.x + '%;top:' + s.y + '%;width:' + s.w + '%;height:' + s.h + '%';
        d.innerHTML = deckCarHtml(result.car, 'E');
        fEl.querySelector('.ferry-slots').appendChild(d);
      }
    }
    var berth = fEl.parentNode;
    var sign = berth && berth.querySelector('.berth-sign');
    if (sign) { sign.classList.add('full'); var b = sign.querySelector('b'); if (b) b.textContent = prevF.capacity + '/' + prevF.capacity; }
    fxBanner('FERRY FULL!', 'big');
    sfx('horn');
    var r = fEl.getBoundingClientRect();
    setTimeout(function () {
      splashAt(fEl);
      burstConfetti(r.left + r.width / 2, r.top + r.height * 0.4, 60);
      fEl.classList.add('sailing');
    }, 280);
    setTimeout(done, 1050);
  }

  function finishMove(result) {
    function after() {
      renderPlay();
      var st = play.state;
      if (result.how === 'ferry' && !result.sailed) {
        var f = document.querySelector('.ferry[data-ferry="' + result.ferryId + '"]');
        if (f) {
          f.classList.add('bob');
          var slots = f.querySelectorAll('.fslot');
          if (slots.length) slots[slots.length - 1].classList.add('pop');
        }
      }
      if (result.how === 'hold') {
        var bs = document.querySelectorAll('.waiting-bays .bay.full');
        if (bs.length) bs[bs.length - 1].classList.add('pop');
      }
      if (result.combo >= 2) {
        fxBanner('COMBO ×' + result.combo, 'combo');
        bumpQuest('combo', 1);
        save.stats.combos = (save.stats.combos || 0) + 1;
      }
      busy = false;
      if (st.status === 'won') onWin();
      else if (st.status === 'lost') onLose(result.how === 'jammed' ? 'Every waiting bay is full and no ferry matches.' : 'No car can reach the road.');
      else if (moveQueue.length) tryMove(moveQueue.shift());
    }
    if (result.sailed) {
      save.stats.ferries = (save.stats.ferries || 0) + 1;
      bumpQuest('ferries', 1);
      save.tickets += (ECO.ferryFullBonus || 0);
      persist();
      sailAway(result, after);
    } else after();
  }

  function tryMove(carId) {
    if (!play || play.state.status !== 'playing') return;
    if (busy) { if (moveQueue.indexOf(carId) === -1) moveQueue.push(carId); return; }
    var lv = play.level, st = play.state;
    var car = st.cars.filter(function (c) { return c.id === carId; })[0];
    if (!car) return;
    var grid = Engine.occupancy(lv, st);
    var el = document.querySelector('[data-car="' + carId + '"]');
    var locked = Engine.isLocked(car, st);
    if (locked || !Engine.canExit(lv, car, grid, st)) {
      sfx(locked ? 'bump' : 'honk');
      if (locked) toast('Locked. Drive the key car out first.');
      if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); setTimeout(function () { el.classList.remove('shake'); }, 420); }
      return;
    }
    busy = true;
    play._prevDocked = st.docked.map(function (f) { return { id: f.id }; });
    play._prevDockedFull = Engine.clone(st.docked);
    play.history.push(Engine.clone(st));
    var step = Engine.apply(lv, st, carId);
    var result = step.result;
    play.state = step.state;
    if (!result.ok && result.how !== 'jammed') { play.state = play.history.pop(); busy = false; sfx('bump'); return; }
    if (play.tutorialStep === 0) play.tutorialStep = 1;
    else if (result.how === 'hold') play.tutorialStep = 2;

    var stage = document.getElementById('stage');
    if (!el || !stage || !el.animate) { sfx('drive'); finishMove(result); return; }
    var sr = stage.getBoundingClientRect(), box = el.getBoundingClientRect();
    var cell = play.cell || 48, len = car.len || 1;
    var fw = cell * 0.9, fh = cell * len * 0.9;
    var start = { x: box.left + box.width / 2 - sr.left, y: box.top + box.height / 2 - sr.top };
    var rot0 = { N: 0, E: 90, S: 180, W: 270 }[car.dir] || 0;
    var flyer = document.createElement('div');
    flyer.className = 'flyer';
    flyer.style.width = fw + 'px';
    flyer.style.height = fh + 'px';
    flyer.style.transform = 'translate(' + (start.x - fw / 2) + 'px,' + (start.y - fh / 2) + 'px) rotate(' + rot0 + 'deg)';
    flyer.innerHTML = Art.carSVG(car, { dir: 'N' });
    stage.appendChild(flyer);
    el.parentNode.removeChild(el);
    var inner = flyer.firstElementChild;
    if (inner && inner.animate) inner.animate([
      { transform: 'scale(1,1)' }, { transform: 'scale(1.18,.82)' }, { transform: 'scale(.9,1.12)' }, { transform: 'scale(1,1)' }
    ], { duration: 280, easing: 'ease-out' });
    sfx('drive');
    var dest = destFor(result, play.state);
    var pts = buildPath(start, result.edge || 'S', dest, stage);
    var endScale = dest.indexOf('ferry-') === 0 ? 0.5 : (dest.indexOf('bay-') === 0 ? 0.75 : 1);
    var p = animatePath(flyer, pts, fw, fh, endScale, rot0);
    dustTrail(flyer, stage, p);
    p.then(function () {
      if (flyer.parentNode) flyer.parentNode.removeChild(flyer);
      finishMove(result);
    });
  }

  /* ---------------- level flow ---------------- */
  function undo() {
    if (!play || busy) return;
    if (!play.history.length) { toast('Nothing to undo'); return; }
    function applyUndo() { play.state = play.history.pop(); moveQueue = []; renderPlay(); }
    if (play.freeUndos > 0) { play.freeUndos -= 1; applyUndo(); return; }
    openModal('<h3>Undo</h3><p>Free undos are used up for this level.</p><div class="actions">' +
      '<button class="btn block" data-act="undo-pay">' + Art.ticketSVG() + ' Spend ' + ECO.undoCost + '</button>' +
      '<button class="btn teal block" data-act="undo-ad">' + Art.icon('ad', '#fff') + ' Watch ad · 3 undos</button>' +
      '<button class="btn ghost block" data-act="close-modal">Cancel</button></div>');
    modalRoot._undoApply = applyUndo;
  }
  function restart() {
    if (!play) return;
    moveQueue = []; busy = false;
    play.state = Engine.init(play.level);
    play.history = [];
    play.freeUndos = ECO.freeUndosPerLevel || 3;
    play.shownDocked = {};
    renderPlay();
  }
  function rateStars(state) {
    var par = (play.level.parMoves || state.moves);
    if (state.moves <= par) return 3;
    if (state.moves <= par + 2) return 2;
    return 1;
  }
  function grantWinRewards(stars) {
    var reward = stars * (ECO.perStar || 5), first = false;
    if (play.mode !== 'daily') {
      var id = play.level.id;
      first = !save.cleared[id];
      if (first) { save.cleared[id] = true; reward += ECO.firstClearBonus || 0; }
      save.stars[id] = Math.max(save.stars[id] || 0, stars);
      if (id >= (save.unlocked || 1)) save.unlocked = Math.min(LEVELS[LEVELS.length - 1].id, id + 1);
      bumpQuest('clear', 1);
      save.seenTutorial = true;
    } else {
      reward += ECO.dailyPuzzleReward || 0;
      if (stars === 3) reward += ECO.dailyPuzzlePerfect || 0;
    }
    if (play.state.maxCombo > 1) reward += Math.min(10, play.state.maxCombo * (ECO.comboBonus || 0));
    save.tickets += reward;
    persist();
    return { reward: reward, first: first };
  }
  function maybeInterstitial(then) {
    then = then || function () {};
    if (adsFree()) return then();
    if (play && play.mode === 'daily') return then();
    if (Date.now() - lastRewarded < 15000) return then();
    var minLevel = (ECO.interstitial && ECO.interstitial.afterLevel) || 8;
    var every = (ECO.interstitial && ECO.interstitial.every) || 3;
    if ((play && play.level && play.level.id < minLevel) || (save.unlocked || 1) < minLevel) return then();
    save.levelsSinceInterstitial = (save.levelsSinceInterstitial || 0) + 1;
    persist();
    if (save.levelsSinceInterstitial < every) return then();
    save.levelsSinceInterstitial = 0;
    persist();
    Ads.showInterstitial().then(function () { then(); });
  }

  function onWin() {
    var stars = rateStars(play.state);
    if (play.mode === 'daily') markDailyWin(stars, play.state.moves);
    sfx('win');
    burstConfetti();
    var granted = grantWinRewards(stars);
    var chip = document.querySelector('[data-tickets]');
    if (chip) chip.textContent = save.tickets;
    var nextBtn = play.mode === 'daily'
      ? '<button class="btn green block" data-act="daily-share">' + Art.icon('share', '#fff') + ' Share result</button><button class="btn white block" data-go="daily">Back to daily</button>'
      : '<button class="btn green mega block" data-act="next">Next level ' + Art.icon('play', '#fff') + '</button>' +
        '<div class="home-row"><button class="btn white block" data-act="after-win-replay">' + Art.icon('restart') + ' Replay</button>' +
        '<button class="btn white block" data-act="after-win-levels">Levels</button></div>';
    openModal(
      '<h3>' + (play.mode === 'daily' ? 'Harbor cleared!' : 'Cleared!') + '</h3>' +
      '<div class="star-row">' + [1, 2, 3].map(function (i) { return Art.icon(i <= stars ? 'star' : 'starOff').replace('class="ico"', 'class="ico' + (i <= stars ? ' on' : '') + '"'); }).join('') + '</div>' +
      '<div class="reward">' + Art.ticketSVG() + '<b>+' + granted.reward + '</b>' + (granted.first ? '<small>first clear</small>' : '') + '</div>' +
      '<p>' + play.state.moves + ' moves' + (play.state.maxCombo > 1 ? ' · best combo ×' + play.state.maxCombo : '') + '</p>' +
      '<div class="actions"><button class="btn teal block" data-act="double-coins">' + Art.icon('ad', '#fff') + ' Watch ad · double coins</button>' + nextBtn + '</div>',
      'win');
    var modal = modalRoot.querySelector('.modal');
    if (modal) flyTickets(Math.min(7, 3 + stars), modal.querySelector('.reward') || modal);
  }

  function onLose(why) {
    sfx('bump');
    var extra = play.mode === 'daily'
      ? '<button class="btn teal block" data-act="streak-save">' + Art.icon('ad', '#fff') + ' Watch ad · save streak</button>'
      : '<button class="btn teal block" data-act="bay-ad-retry">' + Art.icon('ad', '#fff') + ' Watch ad · undo + extra bay</button>' +
        '<button class="btn white block" data-act="skip">Skip level · ' + ECO.skipCost + ' coins</button>';
    openModal(
      '<h3>Jammed!</h3><div class="lose-art">' + Art.carSVG({ color: 'red', id: 'jam' }, { dir: 'E', kind: 'sedan' }) + Art.carSVG({ color: 'blue', id: 'jam2' }, { dir: 'W', kind: 'mini' }) + '</div>' +
      '<p>' + (why || 'The waiting bays filled before the right ferry arrived.') + '</p>' +
      '<div class="actions"><button class="btn mega block" data-act="restart-close">' + Art.icon('restart', '#fff') + ' Try again</button>' + extra +
      '<button class="btn ghost block" data-act="after-win-levels">Levels</button></div>', 'lose');
  }
  function afterWinNav(kind) {
    closeModal();
    maybeInterstitial(function () {
      if (kind === 'next') startLevel(Math.min((play.level.id || 1) + 1, LEVELS[LEVELS.length - 1].id));
      else if (kind === 'replay') restart();
      else if (kind === 'levels') { screen = 'levels'; play = null; render(); }
    });
  }
  function spend(cost, label) {
    if (save.tickets < cost) { toast('Need ' + cost + ' coins' + (label ? ' for ' + label : '')); return false; }
    save.tickets -= cost;
    persist();
    return true;
  }
  function doHint() {
    var id = Engine.hint(play.level, play.state);
    if (!id) { toast('No hint right now'); return false; }
    play.state.usedHint = true;
    var el = document.querySelector('[data-car="' + id + '"]');
    if (el) el.classList.add('hinting');
    toast('Try this car');
    return true;
  }
  function doExtraBay() {
    play.state = Engine.addExtraSlot(play.state);
    renderPlay();
    var b = document.querySelectorAll('.waiting-bays .bay');
    if (b.length) b[b.length - 1].classList.add('pop');
    toast('Extra waiting bay added');
  }
  function settingsModal() {
    var inPlay = screen === 'play' && play;
    openModal(
      '<h3>Settings</h3><div class="settings">' +
        '<button class="set-row" data-act="mute-sfx">' + Art.muteIcon('sfx', save.mutedSfx) + '<span>Sound effects</span><i class="tog' + (save.mutedSfx ? '' : ' on') + '"></i></button>' +
        '<button class="set-row" data-act="mute-bgm">' + Art.muteIcon('bgm', save.mutedBgm) + '<span>Music</span><i class="tog' + (save.mutedBgm ? '' : ' on') + '"></i></button>' +
      '</div><div class="actions">' +
        (inPlay ? '<button class="btn block" data-act="restart-close">' + Art.icon('restart', '#fff') + ' Restart level</button>' : '') +
        '<button class="btn white block" data-go="help">' + Art.icon('help') + ' How to play</button>' +
        (inPlay ? '<button class="btn white block" data-go="home">' + Art.icon('home') + ' Home</button>' : '') +
        '<button class="btn ghost block" data-act="close-modal">Close</button>' +
      '</div><p class="fine dark">Ferry Jam by Jonidge · jonidge@yahoo.com</p>', 'settings-modal');
  }
  function handleBuy(id) {
    var p = Economy.product(id);
    if (!p) return;
    IAP.purchase(id).then(function (res) {
      if (!res || !res.ok) return;
      if (p.tickets) save.tickets += p.tickets;
      if (p.type === 'ads' || (p.extras && p.extras.removeAds)) save.noAds = true;
      if (p.type === 'starter') { save.starterBought = true; save.hintTokens = (save.hintTokens || 0) + 3; }
      if (p.type === 'pass') { save.harborPass = true; save.harborPassUntil = Date.now() + 30 * 86400000; save.noAds = true; }
      if (p.type === 'skin' && p.skin) {
        if (save.skins.owned.indexOf(p.skin.id) === -1) save.skins.owned.push(p.skin.id);
        save.skins[p.skin.kind] = p.skin.id;
      }
      persist();
      toast('Demo unlock: ' + p.title);
      if (screen === 'shop') renderShop();
    });
  }
  function rewarded(reason, onOk) {
    Ads.showRewarded(reason).then(function (ok) { if (!ok) return; lastRewarded = Date.now(); onOk(); });
  }
  function setCnt(sel, n) {
    var c = document.querySelector(sel);
    if (!c) return;
    c.textContent = n > 0 ? n : '+';
    c.classList.toggle('plus', !(n > 0));
  }

  /* ---------------- input ---------------- */
  function onClick(ev) {
    var t = ev.target.closest('[data-act],[data-go],[data-level],[data-car],[data-buy]');
    if (!t) return;
    if (window.AudioFx) { AudioFx.resume(); if (t.getAttribute('data-car') == null) sfx('tap'); }
    var act = t.getAttribute('data-act'), go = t.getAttribute('data-go');
    var lvl = t.getAttribute('data-level'), car = t.getAttribute('data-car'), buy = t.getAttribute('data-buy');
    if (go) { closeModal(); screen = go; render(); return; }
    if (lvl) { startLevel(Number(lvl)); return; }
    if (car) { tryMove(car); return; }
    if (buy) { handleBuy(buy); return; }
    switch (act) {
      case 'play-next': if (!save.seenHelp) { screen = 'help'; render(); return; } startLevel(nextPlayable()); return;
      case 'start-play':
        save.seenHelp = true; persist();
        if (play && play.state.status === 'playing' && play.history.length) { screen = 'play'; render(); return; }
        startLevel(play && play.mode === 'campaign' ? play.level.id : nextPlayable()); return;
      case 'settings': settingsModal(); return;
      case 'mute-sfx': save.mutedSfx = !save.mutedSfx; persist(); applyMute(); settingsModal(); return;
      case 'mute-bgm': save.mutedBgm = !save.mutedBgm; persist(); applyMute(); settingsModal(); return;
      case 'undo': undo(); return;
      case 'restart': case 'restart-close': closeModal(); restart(); return;
      case 'hint':
        if (busy) return;
        if ((save.hintTokens || 0) > 0) { if (doHint()) { save.hintTokens -= 1; persist(); setCnt('.power.hint .cnt', save.hintTokens); } return; }
        openModal('<h3>Hint</h3><p>Out of free hints. Spend coins or watch a placeholder ad.</p><div class="actions">' +
          '<button class="btn block" data-act="hint-pay">' + Art.ticketSVG() + ' Spend ' + ECO.hintCost + '</button>' +
          '<button class="btn teal block" data-act="hint-ad">' + Art.icon('ad', '#fff') + ' Watch ad</button>' +
          '<button class="btn ghost block" data-act="close-modal">Cancel</button></div>');
        return;
      case 'hint-pay': closeModal(); if (spend(ECO.hintCost, 'a hint')) doHint(); return;
      case 'hint-ad': closeModal(); rewarded('hint', doHint); return;
      case 'extra-bay':
        if (busy) return;
        if ((save.bayTokens || 0) > 0) { save.bayTokens -= 1; persist(); doExtraBay(); return; }
        openModal('<h3>Extra bay</h3><p>Add one more waiting bay on the pier for this level.</p><div class="actions">' +
          '<button class="btn block" data-act="bay-pay">' + Art.ticketSVG() + ' Spend ' + ECO.extraBayCost + '</button>' +
          '<button class="btn teal block" data-act="bay-ad">' + Art.icon('ad', '#fff') + ' Watch ad</button>' +
          '<button class="btn ghost block" data-act="close-modal">Cancel</button></div>');
        return;
      case 'bay-pay': closeModal(); if (spend(ECO.extraBayCost, 'an extra bay')) doExtraBay(); return;
      case 'bay-ad': closeModal(); rewarded('extra-bay', doExtraBay); return;
      case 'bay-ad-retry':
        closeModal();
        rewarded('extra-bay', function () { if (play.history.length) play.state = play.history.pop(); doExtraBay(); });
        return;
      case 'undo-pay': closeModal(); if (spend(ECO.undoCost, 'undo') && modalRoot._undoApply) modalRoot._undoApply(); return;
      case 'undo-ad': closeModal(); rewarded('undo', function () { play.freeUndos += 2; if (modalRoot._undoApply) modalRoot._undoApply(); }); return;
      case 'close-modal': closeModal(); return;
      case 'next': afterWinNav('next'); return;
      case 'after-win-replay': afterWinNav('replay'); return;
      case 'after-win-levels': afterWinNav('levels'); return;
      case 'double-coins':
        if (play.doubled) { toast('Already doubled'); return; }
        rewarded('double-coins', function () {
          play.doubled = true;
          var add = rateStars(play.state) * (ECO.perStar || 5) + (play.mode === 'daily' ? (ECO.dailyPuzzleReward || 0) : 0);
          save.tickets += add; persist();
          var rec = modalRoot.querySelector('.reward b');
          if (rec) rec.textContent = 'Doubled!';
          var chip = document.querySelector('[data-tickets]');
          if (chip) chip.textContent = save.tickets;
          var btn = modalRoot.querySelector('[data-act="double-coins"]');
          if (btn) btn.setAttribute('disabled', '');
          flyTickets(5, modalRoot.querySelector('.reward'));
        });
        return;
      case 'skip':
        closeModal();
        if (play.mode === 'daily' || !spend(ECO.skipCost, 'a skip')) return;
        var sid = play.level.id;
        save.unlocked = Math.max(save.unlocked || 1, sid + 1); persist();
        maybeInterstitial(function () { startLevel(sid + 1); });
        return;
      case 'streak-save':
        closeModal();
        rewarded('streak-save', function () { save.streak.freeze = (save.streak.freeze || 0) + 1; persist(); toast('Streak freeze ready'); restart(); });
        return;
      case 'daily-play': startLevel('daily', 'daily'); return;
      case 'daily-share':
        var text = save.daily.result || ('Ferry Jam Daily ' + utcToday());
        openModal('<h3>Share</h3><div class="share-box">' + text.replace(/</g, '') + '</div><div class="actions">' +
          '<button class="btn green block" data-act="copy-share">Copy</button><button class="btn ghost block" data-act="close-modal">Close</button></div>');
        modalRoot._share = text;
        return;
      case 'copy-share':
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(modalRoot._share || '').catch(function () {});
        toast('Copied'); closeModal(); return;
      case 'buy-freeze':
        if (spend(ECO.streakFreezeCost, 'a streak freeze')) { save.streak.freeze = (save.streak.freeze || 0) + 1; persist(); toast('Freeze added'); renderDaily(); }
        return;
      case 'claim-login':
        var amt = claimLogin(1);
        if (amt) { sfx('coin'); toast('+' + amt + ' coins'); renderRewards(); }
        return;
      case 'claim-login-x2':
        rewarded('daily-double', function () { var a2 = claimLogin(2); if (a2) { sfx('coin'); toast('+' + a2 + ' coins (×2)'); renderRewards(); } });
        return;
      case 'watch-ad':
        rewarded('coins', function () { save.tickets += ECO.adReward.tickets; persist(); toast('+' + ECO.adReward.tickets + ' coins'); renderShop(); });
        return;
      case 'tutor-next':
        if (play) {
          play.tutorialStep = (play.tutorialStep || 0) + 1;
          if (play.tutorialStep >= 3) { save.seenTutorial = true; persist(); }
        } else { save.seenTutorial = true; persist(); }
        var old = document.querySelector('.tutor');
        if (old) old.parentNode.removeChild(old);
        maybeTutorial();
        return;
    }
  }

  document.addEventListener('click', onClick);
  document.addEventListener('pointerdown', function () { if (window.AudioFx) AudioFx.resume(); });

  save = load();
  syncStreakOnOpen();
  ensureDailyMeta();
  rollQuests();
  applyMute();
  if (window.AudioFx) AudioFx.preload();
  render();
})();
