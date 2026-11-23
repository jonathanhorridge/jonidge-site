/* Ferry Jam UI — road routing, daily loop, shop stubs, audio. */
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

  function utcToday() {
    try { return new Date().toISOString().slice(0, 10); } catch (e) { return '1970-01-01'; }
  }
  function defaultSave() {
    return {
      tickets: ECO.welcomeGift, welcomed: true, stars: {}, unlocked: 1, cleared: {},
      noAds: false, starterBought: false, dockTokens: 0,
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
      return s;
    } catch (e) { return defaultSave(); }
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} }

  function levelById(id) { return LEVELS.filter(function (l) { return l.id === id; })[0]; }
  function isUnlocked(id) { return id <= (save.unlocked || 1); }
  function adsFree() {
    if (save.noAds) return true;
    if (save.harborPass && save.harborPassUntil && save.harborPassUntil > Date.now()) return true;
    return false;
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }

  function ticketsChip() {
    return '<div class="chip" data-go="shop">' + Art.ticketSVG() + '<b data-tickets="1">' + save.tickets + '</b></div>';
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
  function muteBtns() {
    return '<div class="mute-row">' +
      '<button type="button" class="ico-btn" data-act="mute-sfx" aria-label="Toggle sound">' + Art.muteIcon('sfx', save.mutedSfx) + '</button>' +
      '<button type="button" class="ico-btn" data-act="mute-bgm" aria-label="Toggle music">' + Art.muteIcon('bgm', save.mutedBgm) + '</button>' +
    '</div>';
  }
  function showBanner(where) {
    var hide = adsFree() || where === 'daily';
    banner.hidden = hide;
    banner.textContent = hide ? '' : 'AD · 320×50 placeholder';
  }
  function closeModal() { modalRoot.className = ''; modalRoot.innerHTML = ''; }
  function openModal(html, centered) {
    modalRoot.className = 'open';
    modalRoot.innerHTML = '<div class="modal-back"><div class="modal' + (centered ? ' center' : '') + '">' + html + '</div></div>';
  }
  function sfx(name) { if (window.AudioFx) AudioFx.play(name); }
  function applyMute() {
    if (window.AudioFx) AudioFx.setMute(!!save.mutedSfx, !!save.mutedBgm);
  }

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
      toast('Quest complete! +' + item.reward);
      sfx('coin');
    }
    persist();
  }
  function pendingLogin() {
    var d = utcToday();
    return save.login.last !== d;
  }
  function loginDay() {
    var last = save.login.last, d = utcToday();
    if (!last) return 1;
    var prev = new Date(last + 'T00:00:00Z').getTime() + 86400000;
    var cur = new Date(d + 'T00:00:00Z').getTime();
    if (prev === cur) return Math.min(7, (save.login.day || 0) + 1);
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
    var d = utcToday();
    var st = save.streak;
    if (!st.last || st.last === d) return;
    var yesterday = new Date(new Date(d + 'T00:00:00Z').getTime() - 86400000).toISOString().slice(0, 10);
    if (st.last === yesterday) return;
    if (st.freeze > 0) {
      st.freeze -= 1;
      st.last = yesterday;
      toast('Streak freeze used');
    } else {
      st.count = 0;
    }
    persist();
  }

  function markDailyWin(stars, moves) {
    var d = utcToday();
    var st = save.streak;
    var yesterday = new Date(new Date(d + 'T00:00:00Z').getTime() - 86400000).toISOString().slice(0, 10);
    if (st.last === d) {
      /* already counted today */
    } else if (st.last === yesterday || st.count === 0) {
      st.count = (st.last === yesterday ? st.count : 0) + 1;
    } else if (st.freeze > 0) {
      st.freeze -= 1;
      st.count += 1;
    } else {
      st.count = 1;
    }
    st.last = d;
    var boxes = '';
    for (var i = 0; i < 3; i++) boxes += i < stars ? '⭐' : '☆';
    save.daily = {
      date: d, done: true, stars: stars, moves: moves,
      result: 'Ferry Jam Daily ' + d + '\n' + boxes + '\nStreak: ' + st.count + '\nhttps://jonidge.com/play/ferry-jam/'
    };
    persist();
  }

  function render() {
    ensureDailyMeta();
    if (screen === 'home') renderHome();
    else if (screen === 'levels') renderLevels();
    else if (screen === 'help') renderHelp();
    else if (screen === 'shop') renderShop();
    else if (screen === 'daily') renderDaily();
    else if (screen === 'rewards') renderRewards();
    else if (screen === 'play') renderPlay();
    showBanner(play && play.mode === 'daily' ? 'daily' : screen);
  }

  function renderHome() {
    ensureDailyMeta();
    rollQuests();
    var questOpen = save.quests.items.some(function (q) { return !q.done; });
    view.innerHTML =
      '<div class="home">' +
        '<div class="home-sky"><div class="sun"></div><div class="cloud c1"></div><div class="cloud c2"></div></div>' +
        '<div class="home-hero">' +
          '<div class="logo-wrap">' + Art.logoSVG() + '</div>' +
          '<h1 class="wordmark">Ferry <span>Jam</span></h1>' +
          '<p>Match colors. Fill the ferry. Clear the lot.</p>' +
          '<div class="chip-row">' + ticketsChip() +
            '<div class="chip streak-chip">🔥 <b>' + (save.streak.count || 0) + '</b> streak</div>' +
            muteBtns() +
          '</div>' +
        '</div>' +
        '<div class="home-actions">' +
          '<button type="button" class="btn lg block" data-act="play-next">' + Art.icon('play') + ' Play</button>' +
          '<div class="home-daily">' +
            '<button type="button" class="btn teal block" data-go="daily">Daily Puzzle</button>' +
            '<button type="button" class="btn white block" data-go="rewards">Rewards' + (questOpen || pendingLogin() ? '<span class="quest-dot"></span>' : '') + '</button>' +
          '</div>' +
          '<button type="button" class="btn white block" data-go="levels">Levels</button>' +
          '<button type="button" class="btn white block" data-go="shop">' + Art.icon('shop') + ' Shop</button>' +
          '<button type="button" class="btn ghost block" data-go="help">' + Art.icon('help') + ' How to play</button>' +
        '</div>' +
        '<div class="home-shore"></div>' +
      '</div>';
  }

  function renderLevels() {
    var chapters = (typeof CHAPTERS !== 'undefined' && CHAPTERS) || [
      { id: 1, name: 'Harbor', start: 1, end: LEVELS.length }
    ];
    var html = '';
    chapters.forEach(function (ch) {
      html += '<div class="chapter-head">' + ch.name + '</div>';
      LEVELS.filter(function (lv) { return lv.id >= ch.start && lv.id <= ch.end; }).forEach(function (lv) {
        var open = isUnlocked(lv.id);
        html +=
          '<button type="button" class="lvl' + (open ? '' : ' locked') + '" ' +
            (open ? 'data-level="' + lv.id + '"' : 'disabled') + '>' +
            (open ? '<div class="num">' + lv.id + '</div>' : '<div class="lock-ico">' + Art.icon('lock') + '</div>') +
            '<div class="nm">' + (lv.name || ('Level ' + lv.id)) + '</div>' +
            starStr(save.stars[lv.id] || 0) +
          '</button>';
      });
    });
    view.innerHTML =
      '<div class="screen">' +
        '<div class="topbar">' + backBtn('home') + '<h2>Levels</h2>' + ticketsChip() + '</div>' +
        '<div class="level-grid chapters">' + html + '</div>' +
      '</div>';
  }

  function renderHelp() {
    view.innerHTML =
      '<div class="screen">' +
        '<div class="topbar">' + backBtn('home') + '<h2>How to play</h2>' + ticketsChip() + '</div>' +
        '<div class="help-card"><h3>1. Tap a clear car</h3><p>A car can leave only if the road ahead of it is empty, all the way to the exit.</p></div>' +
        '<div class="help-card"><h3>2. Drive the ring road</h3><p>Cars never fall off the map. They drive out, follow the road, and roll down a ramp onto a ferry — or park in a waiting bay.</p></div>' +
        '<div class="help-card"><h3>3. Match the boarding ferry</h3><p>Only the ferry in a berth can load. Same color boards. When it is full it sails, and the next ferry in the queue docks.</p></div>' +
        '<div class="help-card"><h3>4. Waiting bays</h3><p>If the docked ferry is the wrong color, the car waits on the pier. If every bay is full and no ferry matches, you jam.</p></div>' +
        '<div class="help-card"><h3>5. Special cars & ferries</h3><p>Keys unlock cars, gates block a lane until opened, some ferries take small cars only, and some will leave on a timer.</p></div>' +
        '<button type="button" class="btn block" data-act="start-play">Got it</button>' +
      '</div>';
  }

  function renderShop() {
    var items = (ECO.products || []).map(function (p) {
      var price = Economy.formatPrice(p.priceUSD, currency);
      var extra = p.tickets ? (p.tickets + ' tickets') : (p.type === 'ads' ? 'Removes interstitial ads' : (p.type === 'pass' ? 'No ads + daily bonus for 30 days' : (p.tag || '')));
      return '<div class="product">' +
        '<div class="info"><h3>' + p.title + (p.tag ? ' <span class="tag">' + p.tag + '</span>' : '') + '</h3>' +
        '<p>' + extra + '</p></div>' +
        '<button type="button" class="btn sm" data-buy="' + p.id + '">' + price + '</button>' +
      '</div>';
    }).join('');
    view.innerHTML =
      '<div class="screen">' +
        '<div class="topbar">' + backBtn('home') + '<h2>Shop</h2>' + ticketsChip() + '</div>' +
        '<p class="blurb">Placeholder prices only — nothing is billed. Contact jonidge@yahoo.com.</p>' +
        '<div class="shop-list">' +
          '<div class="product"><div class="info"><h3>Watch a placeholder ad</h3><p>+' + ECO.adReward.tickets + ' tickets</p></div>' +
            '<button type="button" class="btn sm teal" data-act="watch-ad">Watch</button></div>' +
          items +
        '</div>' +
      '</div>';
  }

  function renderDaily() {
    ensureDailyMeta();
    var d = utcToday();
    var done = save.daily.done && save.daily.date === d;
    view.innerHTML =
      '<div class="screen">' +
        '<div class="topbar">' + backBtn('home') + '<h2>Daily Puzzle</h2>' + ticketsChip() + '</div>' +
        '<div class="daily-hero">' +
          '<h3>' + d + '</h3>' +
          '<div class="streak-big">' + (save.streak.count || 0) + '</div>' +
          '<p>day streak' + (save.streak.freeze ? ' · ' + save.streak.freeze + ' freeze' : '') + '</p>' +
          (done
            ? starStr(save.daily.stars) + '<p>Cleared in ' + save.daily.moves + ' moves.</p>'
            : '<p>Same puzzle for everyone today. Come back each day to keep your streak.</p>') +
        '</div>' +
        (done
          ? '<button type="button" class="btn block" data-act="daily-play">Play again</button>' +
            '<button type="button" class="btn white block" data-act="daily-share">Share result</button>'
          : '<button type="button" class="btn lg block" data-act="daily-play">Play today\'s harbor</button>') +
        '<button type="button" class="btn ghost block" data-act="buy-freeze">Streak freeze · ' + ECO.streakFreezeCost + ' tickets</button>' +
        '<p class="blurb">Miss a day? A freeze keeps your streak. You can also watch a placeholder ad on the lose screen.</p>' +
      '</div>';
  }

  function renderRewards() {
    rollQuests();
    var cal = ECO.loginCalendar.map(function (n, i) {
      var day = i + 1;
      var cls = 'cal-day';
      if (save.login.day >= day && save.login.last === utcToday() || (save.login.day >= day && !pendingLogin())) cls += ' claimed';
      if (pendingLogin() && loginDay() === day) cls += ' today';
      if (pendingLogin() && day > loginDay()) cls += ' locked';
      return '<div class="' + cls + '"><div class="d">Day ' + day + '</div><div class="n">+' + n + '</div></div>';
    }).join('');
    var quests = save.quests.items.map(function (q) {
      var pct = Math.min(100, Math.round((q.progress || 0) / q.goal * 100));
      return '<div class="quest' + (q.done ? ' done' : '') + '"><div class="info"><b>' + q.label + '</b><div class="bar"><i style="width:' + pct + '%"></i></div></div><div>+' + q.reward + '</div></div>';
    }).join('');
    view.innerHTML =
      '<div class="screen">' +
        '<div class="topbar">' + backBtn('home') + '<h2>Rewards</h2>' + ticketsChip() + '</div>' +
        '<div class="help-card"><h3>Daily login</h3><p>Claim once a day. Day 7 is the big gift.</p></div>' +
        '<div class="calendar">' + cal + '</div>' +
        (pendingLogin()
          ? '<button type="button" class="btn block" data-act="claim-login">Claim today</button>' +
            '<button type="button" class="btn teal block" data-act="claim-login-x2">Watch ad · claim ×2</button>'
          : '<p class="blurb">Already claimed today. See you tomorrow.</p>') +
        '<div class="help-card"><h3>Daily quests</h3><p>Reset at midnight UTC, same window as the daily puzzle.</p></div>' +
        quests +
      '</div>';
  }

  function startLevel(id, mode) {
    var lv = mode === 'daily' ? Engine.generateDaily(utcToday(), 2) : levelById(id);
    if (!lv) { toast('Could not load that harbor'); return; }
    if (mode !== 'daily' && !isUnlocked(id)) return;
    play = {
      level: lv, state: Engine.init(lv), history: [], mode: mode || 'campaign',
      freeUndos: ECO.freeUndosPerLevel || 3, doubled: false, tutorialStep: 0
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

  function pal(color) { return (typeof COLORS !== 'undefined' && COLORS[color]) || { fill: '#888', name: color }; }

  function carStyle(car) {
    var cells = Engine.cellsOf(car);
    var rs = cells.map(function (p) { return p.r; });
    var cs = cells.map(function (p) { return p.c; });
    var r0 = Math.min.apply(null, rs), r1 = Math.max.apply(null, rs);
    var c0 = Math.min.apply(null, cs), c1 = Math.max.apply(null, cs);
    var rot = { N: 0, E: 90, S: 180, W: 270 }[car.dir] || 0;
    return 'grid-row:' + (r0 + 1) + ' / ' + (r1 + 2) + ';grid-column:' + (c0 + 1) + ' / ' + (c1 + 2) +
      ';transform:rotate(' + rot + 'deg)';
  }

  function carHtml(car, extraClass) {
    var kind = Art.kindOf(car);
    var badges = '';
    if (car.locked) badges += '<span class="badge">' + Art.lockBadge() + '</span>';
    if (car.isKey) badges += '<span class="badge">' + Art.keyBadge() + '</span>';
    var locked = play && Engine.isLocked(car, play.state);
    return '<button type="button" class="car' + (extraClass ? ' ' + extraClass : '') + (locked ? ' locked' : '') +
      '" data-car="' + car.id + '" style="' + carStyle(car) + '" aria-label="' + car.color + ' car">' +
      Art.carSVG(car, { kind: kind, dir: 'N', idPrefix: 'lot' }) + badges + '</button>';
  }

  function deckCarHtml(car) {
    var kind = Art.kindOf(car);
    return Art.carSVG(car, { kind: kind, dir: 'E', idPrefix: 'deck' });
  }

  function ferryHtml(f, cls) {
    var slots = Art.ferrySlots ? Art.ferrySlots(f.capacity) : [];
    var slotHtml = (f.cargo || []).map(function (c, i) {
      var s = slots[i] || { x: 20 + i * 18, y: 40, w: 16, h: 28 };
      return '<div class="fslot" style="left:' + s.x + '%;top:' + s.y + '%;width:' + s.w + '%;height:' + s.h + '%">' +
        deckCarHtml(c) + '</div>';
    }).join('');
    var badges = '';
    if (f.maxLen) badges += '<span class="ferry-badge small-only">Cars only</span>';
    if (f.timeLimit) badges += '<span class="ferry-badge timer">⏱ ' + (f.timeLeft == null ? f.timeLimit : f.timeLeft) + '</span>';
    return '<div class="ferry ' + (cls || '') + '" data-ferry="' + f.id + '">' +
      badges +
      '<div class="ferry-art">' + Art.ferrySVG(f, { uid: 'dock-' + (save.skins.ferry || 'default') }) + '</div>' +
      '<div class="ferry-slots">' + slotHtml + '</div><div class="wake"></div></div>';
  }

  function holdCap(state) { return Engine.holdCap(state); }

  function renderPlay() {
    var lv = play.level, st = play.state;
    var rows = lv.rows, cols = lv.cols;
    var cells = '';
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var obs = (lv.obstacles || []).some(function (o) { return o.r === r && o.c === c; });
        var gate = (Engine.activeBarriers ? Engine.activeBarriers(lv, st) : (lv.barriers || [])).filter(function (b) {
          return b.r === r && b.c === c;
        })[0];
        cells += '<div class="cell" style="grid-row:' + (r + 1) + ';grid-column:' + (c + 1) + '">' +
          (obs ? '<div class="obs">' + Art.crateSVG() + '</div>' : '') +
          (gate ? '<div class="gate">' + Art.gateSVG() + '</div>' : '') +
        '</div>';
      }
    }
    var cars = st.cars.map(function (car) { return carHtml(car); }).join('');
    var cap = holdCap(st);
    var bays = '';
    for (var i = 0; i < cap; i++) {
      var held = st.hold[i];
      bays += '<div class="bay" data-bay="' + i + '"><span class="wp" data-wp="bay-' + i + '"></span>' +
        (held ? deckCarHtml(held) : '') + '</div>';
    }
    var ramps = st.docked.map(function (f, i) {
      return '<div class="ramp" data-ramp="' + i + '"><span class="wp" data-wp="ramp-' + i + '"></span></div>';
    }).join('');
    var berths = st.docked.map(function (f, i) {
      var p = pal(f.color);
      var pips = '';
      for (var k = 0; k < f.capacity; k++) pips += '<i class="pip' + (k < f.loaded ? ' on' : '') + '"></i>';
      var boarding = i === 0 || st.docked.length === 1 || true;
      return '<div class="berth' + (boarding ? ' boarding' : '') + '" data-berth="' + i + '">' +
        '<div class="berth-sign" style="background:' + p.fill + '">Boarding · ' + p.name +
          ' · ' + f.loaded + '/' + f.capacity + '<span class="cap-pips">' + pips + '</span></div>' +
        ferryHtml(f, 'arrive') +
        '<span class="wp" data-wp="ferry-' + i + '"></span>' +
      '</div>';
    }).join('') || '<div class="berth"><div class="berth-sign">All ferries have sailed</div></div>';
    var q = st.queue.map(function (f) {
      var p = pal(f.color);
      return '<div class="qferry" data-qid="' + f.id + '" title="' + p.name + '">' +
        Art.ferrySVG(f, { uid: 'q' }) +
        '<span class="qcap">' + p.name + ' · ' + f.capacity + '</span></div>';
    }).join('');
    var title = play.mode === 'daily' ? 'Daily' : ('Level ' + lv.id);
    var undoLabel = play.freeUndos > 0 ? 'Undo' : (ECO.undoCost + ' · or ad');
    view.innerHTML =
      '<div class="play">' +
        '<div class="play-top">' + backBtn(play.mode === 'daily' ? 'daily' : 'levels') +
          '<div class="level-badge"><div class="no">' + title + '</div><h2>' + (lv.name || '') + '</h2></div>' +
          ticketsChip() + muteBtns() +
        '</div>' +
        '<div class="tools">' +
          '<button type="button" class="tool" data-act="undo">' + Art.icon('undo') + '<span>' + undoLabel + '</span></button>' +
          '<button type="button" class="tool" data-act="restart">' + Art.icon('restart') + '<span>Restart</span></button>' +
          '<button type="button" class="tool hint" data-act="hint">' + Art.icon('hint') + '<span>Hint · ' + ECO.hintCost + '</span></button>' +
          '<button type="button" class="tool dock" data-act="extra-bay">' + Art.icon('dock') + '<span>Bay · ' + ECO.extraBayCost + '</span></button>' +
        '</div>' +
        '<div class="stage" id="stage">' +
          '<div class="yard">' +
            '<div class="deco tree-l">' + Art.treeSVG() + '</div>' +
            '<div class="deco tree-r">' + Art.treeSVG() + '</div>' +
            '<div class="road road-n"><span class="arrow">▶</span><span class="wp" data-wp="N"></span></div>' +
            '<div class="yard-mid">' +
              '<div class="road road-w"><span class="arrow">▼</span><span class="wp" data-wp="W"></span></div>' +
              '<div class="lot" style="--rows:' + rows + ';--cols:' + cols + ';grid-template-rows:repeat(' + rows + ',1fr);grid-template-columns:repeat(' + cols + ',1fr)">' +
                cells + cars +
              '</div>' +
              '<div class="road road-e"><span class="arrow">▼</span><span class="wp" data-wp="E"></span></div>' +
            '</div>' +
            '<div class="road road-s"><span class="arrow">▶</span>' +
              '<span class="wp sw" data-wp="S-W"></span>' +
              '<span class="wp" data-wp="S"></span>' +
              '<span class="wp se" data-wp="S-E"></span>' +
            '</div>' +
          '</div>' +
          '<div class="pier">' +
            '<div class="pier-head"><span class="pier-label">Pier</span><span class="bay-label">Waiting bays</span></div>' +
            '<div class="waiting-bays">' + bays + '</div>' +
            '<div class="ramps">' + ramps + '</div>' +
            '<span class="wp pier" data-wp="PIER"></span>' +
          '</div>' +
          '<div class="berths">' + berths + '</div>' +
          '<div class="water"><div class="foam"></div>' +
            '<div class="queue-row"><span class="next-label">Next</span>' + (q || '<span style="color:#D6F4FF;font-size:12px;font-weight:700">Queue empty</span>') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="blurb">' + (lv.blurb || 'Tap a car with a clear path. It will drive the road to the pier.') + '</div>' +
      '</div>';
    maybeTutorial();
  }

  function maybeTutorial() {
    if (!play || play.mode === 'daily' || save.seenTutorial) return;
    var stage = document.getElementById('stage');
    if (!stage) return;
    var legal = Engine.legalMoves(play.level, play.state);
    var step = play.tutorialStep || 0;
    var text = [
      'Tap a car that can drive out — the road ahead must be empty.',
      'Cars follow the road to the pier. Match the boarding ferry’s color to load.',
      'Wrong color? The car parks in a waiting bay until its ferry docks.'
    ][Math.min(step, 2)];
    var tutor = document.createElement('div');
    tutor.className = 'tutor';
    tutor.innerHTML = '<div class="bubble">' + text +
      '<div><button type="button" class="btn sm" data-act="tutor-next">Got it</button></div></div>';
    if (step === 0 && legal[0]) {
      var car = stage.querySelector('[data-car="' + legal[0] + '"]');
      if (car) {
        var sr = stage.getBoundingClientRect(), cr = car.getBoundingClientRect();
        var hand = document.createElement('div');
        hand.className = 'hand-wrap';
        hand.innerHTML = Art.handSVG();
        hand.style.left = (cr.left - sr.left + cr.width * 0.35) + 'px';
        hand.style.top = (cr.top - sr.top + cr.height * 0.35) + 'px';
        tutor.appendChild(hand);
      }
    }
    stage.appendChild(tutor);
  }

  function wp(name, stage) {
    var el = stage.querySelector('[data-wp="' + name + '"]');
    var sr = stage.getBoundingClientRect();
    if (!el) return { x: sr.width / 2, y: sr.height * 0.7 };
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - sr.left, y: r.top + r.height / 2 - sr.top };
  }

  function buildPath(carEl, edge, destName, stage) {
    var sr = stage.getBoundingClientRect();
    var r = carEl.getBoundingClientRect();
    var start = { x: r.left + r.width / 2 - sr.left, y: r.top + r.height / 2 - sr.top };
    var pts = [start];
    if (edge === 'N') { pts.push(wp('N', stage)); pts.push(wp('E', stage)); pts.push(wp('S-E', stage)); }
    else if (edge === 'E') { pts.push(wp('E', stage)); pts.push(wp('S-E', stage)); }
    else if (edge === 'W') { pts.push(wp('W', stage)); pts.push(wp('S-W', stage)); }
    else { pts.push(wp('S', stage)); }
    pts.push(wp('PIER', stage));
    if (destName && destName.indexOf('ferry-') === 0) {
      var idx = destName.split('-')[1];
      pts.push(wp('ramp-' + idx, stage));
    }
    pts.push(wp(destName, stage));
    return pts;
  }

  function animatePath(flyer, pts, w, h) {
    var segs = [], total = 0, i;
    for (i = 1; i < pts.length; i++) {
      var dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y;
      var len = Math.hypot(dx, dy) || 1;
      segs.push({ a: pts[i - 1], b: pts[i], len: len, ang: Math.atan2(dy, dx) });
      total += len;
    }
    var dur = Math.max(600, Math.min(1000, total * 1.15));
    var frames = [];
    var acc = 0;
    segs.forEach(function (s) {
      var rot = s.ang * 180 / Math.PI + 90;
      var o0 = acc / total, o1;
      acc += s.len;
      o1 = acc / total;
      frames.push({ offset: o0, transform: 'translate(' + (s.a.x - w / 2) + 'px,' + (s.a.y - h / 2) + 'px) rotate(' + rot + 'deg)' });
      frames.push({ offset: Math.min(1, o1), transform: 'translate(' + (s.b.x - w / 2) + 'px,' + (s.b.y - h / 2) + 'px) rotate(' + rot + 'deg)' });
    });
    if (frames.length) frames[frames.length - 1].offset = 1;
    return flyer.animate(frames, { duration: dur, easing: 'linear', fill: 'forwards' }).finished.catch(function () {});
  }

  function fxBanner(text) {
    var stage = document.getElementById('stage');
    if (!stage) return;
    var n = document.createElement('div');
    n.className = 'fx-toast';
    n.textContent = text;
    stage.appendChild(n);
    setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 950);
  }

  function flyTickets(n, fromEl) {
    var chip = document.querySelector('[data-tickets]');
    if (!chip || !fromEl) { if (window.AudioFx && n) sfx('coin'); return; }
    var a = fromEl.getBoundingClientRect();
    var b = chip.getBoundingClientRect();
    for (var i = 0; i < Math.min(n, 6); i++) {
      var el = document.createElement('div');
      el.className = 'fly-ticket';
      el.innerHTML = Art.ticketSVG();
      el.style.left = (a.left + a.width / 2 - 14 + (i - 1) * 8) + 'px';
      el.style.top = (a.top + a.height / 2 - 10) + 'px';
      document.body.appendChild(el);
      (function (node, delay) {
        setTimeout(function () {
          node.style.transform = 'translate(' + (b.left - a.left) + 'px,' + (b.top - a.top) + 'px) scale(.6)';
          node.style.opacity = '0';
        }, 20 + delay);
        setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 800 + delay);
      })(el, i * 70);
    }
    sfx('coin');
  }

  function destFor(result, nextState) {
    if (result.how === 'hold') {
      var idx = Math.max(0, nextState.hold.length - 1);
      return 'bay-' + idx;
    }
    if (result.how === 'ferry') {
      var docked = play._prevDocked || [];
      var i, found = 0;
      for (i = 0; i < docked.length; i++) if (docked[i].id === result.ferryId) { found = i; break; }
      return result.sailed ? ('ramp-' + found) : ('ferry-' + found);
    }
    return 'PIER';
  }

  function finishMove(prev, result) {
    renderPlay();
    if (result.combo >= 2) {
      fxBanner('COMBO ×' + result.combo);
      bumpQuest('combo', 1);
      save.stats.combos = (save.stats.combos || 0) + 1;
    }
    if (result.sailed) {
      fxBanner('FERRY FULL!');
      sfx('horn');
      save.stats.ferries = (save.stats.ferries || 0) + 1;
      bumpQuest('ferries', 1);
      save.tickets += (ECO.ferryFullBonus || 0);
      persist();
    }
    var st = play.state;
    if (st.status === 'won') onWin();
    else if (st.status === 'lost') onLose(result.how === 'jammed' ? 'The waiting bays are full.' : 'No car can reach the road.');
    busy = false;
    if (moveQueue.length && st.status === 'playing') {
      var id = moveQueue.shift();
      tryMove(id);
    }
  }

  function tryMove(carId) {
    if (!play || play.state.status !== 'playing') return;
    if (busy) { moveQueue.push(carId); return; }
    var lv = play.level, st = play.state;
    var car = st.cars.filter(function (c) { return c.id === carId; })[0];
    if (!car) return;
    var grid = Engine.occupancy(lv, st);
    if (Engine.isLocked(car, st)) { sfx('bump'); toast('This car is locked. Free it with the key first.'); return; }
    if (!Engine.canExit(lv, car, grid, st)) {
      sfx('bump');
      var el = document.querySelector('[data-car="' + carId + '"]');
      if (el) { el.classList.add('shake'); setTimeout(function () { el.classList.remove('shake'); }, 400); }
      return;
    }
    busy = true;
    play._prevDocked = (st.docked || []).map(function (f) { return { id: f.id }; });
    play.history.push(Engine.clone(st));
    var step = Engine.apply(lv, st, carId);
    var result = step.result;
    play.state = step.state;
    if (!result.ok && result.how === 'jammed') {
      /* still animate onto a full pier then lose */
    } else if (!result.ok) {
      play.state = play.history.pop();
      busy = false;
      sfx('bump');
      return;
    }

    var carEl = document.querySelector('[data-car="' + carId + '"]');
    var stage = document.getElementById('stage');
    if (!carEl || !stage || !carEl.animate) {
      sfx('drive');
      finishMove(st, result);
      return;
    }
    var dest = destFor(result, play.state);
    var box = carEl.getBoundingClientRect();
    var flyer = carEl.cloneNode(true);
    flyer.removeAttribute('data-car');
    flyer.classList.add('flyer');
    flyer.style.cssText = 'width:' + box.width + 'px;height:' + box.height + 'px;';
    carEl.style.opacity = '0';
    stage.appendChild(flyer);
    sfx('drive');
    if (play.tutorialStep === 0) play.tutorialStep = 1;
    else if (result.how === 'hold') play.tutorialStep = 2;
    var pts = buildPath(carEl, result.edge || 'S', dest, stage);
    animatePath(flyer, pts, box.width, box.height).then(function () {
      if (flyer.parentNode) flyer.parentNode.removeChild(flyer);
      finishMove(st, result);
    });
  }

  function undo() {
    if (!play || !play.history.length || busy) return;
    function applyUndo() {
      play.state = play.history.pop();
      moveQueue = [];
      play.usedUndo = true;
      renderPlay();
    }
    if (play.freeUndos > 0) { play.freeUndos -= 1; applyUndo(); return; }
    openModal(
      '<h3>Undo</h3><p>Free undos are used up. Spend ' + ECO.undoCost + ' tickets or watch a placeholder ad.</p>' +
      '<div class="actions">' +
        '<button class="btn block" data-act="undo-pay">Spend ' + ECO.undoCost + '</button>' +
        '<button class="btn teal block" data-act="undo-ad">Watch ad · 3 undos</button>' +
        '<button class="btn ghost block" data-act="close-modal">Cancel</button>' +
      '</div>'
    );
    modalRoot._undoApply = applyUndo;
  }

  function restart() {
    if (!play) return;
    moveQueue = [];
    busy = false;
    play.state = Engine.init(play.level);
    play.history = [];
    play.freeUndos = ECO.freeUndosPerLevel || 3;
    renderPlay();
  }

  function rateStars(state) {
    var par = (play.level.parMoves || state.moves);
    if (state.moves <= par) return 3;
    if (state.moves <= par + 2) return 2;
    return 1;
  }

  function grantWinRewards(stars, opts) {
    opts = opts || {};
    var reward = stars * (ECO.perStar || 5);
    var first = false;
    if (play.mode !== 'daily') {
      var id = play.level.id;
      first = !save.cleared[id];
      if (first) { save.cleared[id] = true; reward += ECO.firstClearBonus || 0; }
      save.stars[id] = Math.max(save.stars[id] || 0, stars);
      if (id >= (save.unlocked || 1)) save.unlocked = Math.min(LEVELS[LEVELS.length - 1].id, id + 1);
      bumpQuest('clear', 1);
    } else {
      reward += ECO.dailyPuzzleReward || 0;
      if (stars === 3) reward += ECO.dailyPuzzlePerfect || 0;
    }
    if (stateComboBonus()) reward += Math.min(10, (play.state.maxCombo || 0) * (ECO.comboBonus || 0));
    if (opts.double) reward *= 2;
    save.tickets += reward;
    persist();
    return { reward: reward, first: first };
  }
  function stateComboBonus() { return play && play.state && play.state.maxCombo > 1; }

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

  function burstConfetti() {
    var cvs = document.getElementById('fx');
    if (!cvs) return;
    var ctx = cvs.getContext('2d');
    cvs.width = innerWidth; cvs.height = innerHeight;
    var bits = [], i;
    for (i = 0; i < 80; i++) bits.push({
      x: Math.random() * cvs.width, y: -20 - Math.random() * 80,
      vy: 2 + Math.random() * 4, vx: -2 + Math.random() * 4, w: 6 + Math.random() * 6,
      c: ['#E23B3B', '#2F7BF6', '#F5C400', '#17A85C', '#F07810'][i % 5], rot: Math.random() * 6
    });
    var t = 0;
    function tick() {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      bits.forEach(function (b) {
        b.y += b.vy; b.x += b.vx; b.rot += 0.1;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot);
        ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -3, b.w, 6); ctx.restore();
      });
      if (++t < 90) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, cvs.width, cvs.height);
    }
    tick();
  }

  function onWin() {
    var stars = rateStars(play.state);
    if (play.mode === 'daily') markDailyWin(stars, play.state.moves);
    sfx('win');
    burstConfetti();
    renderPlay();
    var granted = grantWinRewards(stars);
    var chip = document.querySelector('[data-tickets]');
    if (chip) chip.textContent = save.tickets;
    var nextBtn = play.mode === 'daily'
      ? '<button class="btn block" data-act="daily-share">Share result</button><button class="btn white block" data-go="daily">Back to daily</button>'
      : '<button class="btn block" data-act="next">Next level</button>' +
        '<button class="btn white block" data-act="after-win-replay">Replay</button>' +
        '<button class="btn ghost block" data-act="after-win-levels">Levels</button>';
    openModal(
      '<h3>' + (play.mode === 'daily' ? 'Harbor cleared!' : 'Cleared!') + '</h3>' +
      '<div class="star-row">' + [1, 2, 3].map(function (i) { return Art.icon(i <= stars ? 'star' : 'starOff').replace('class="ico"', 'class="ico' + (i <= stars ? ' on' : '') + '"'); }).join('') + '</div>' +
      '<div class="reward">+' + granted.reward + ' tickets' + (granted.first ? ' · first clear' : '') + '</div>' +
      '<p>' + play.state.moves + ' moves' + (play.state.maxCombo > 1 ? ' · combo ×' + play.state.maxCombo : '') + '</p>' +
      '<div class="actions">' +
        '<button class="btn teal block" data-act="double-coins">Watch ad · double tickets</button>' +
        nextBtn +
      '</div>'
    );
    var modal = modalRoot.querySelector('.modal');
    if (modal) flyTickets(Math.min(6, 2 + stars), modal.querySelector('.reward') || modal);
  }

  function onLose(why) {
    sfx('bump');
    var extra = play.mode === 'daily'
      ? '<button class="btn teal block" data-act="streak-save">Watch ad · save streak</button>'
      : '<button class="btn block" data-act="skip">Skip · ' + ECO.skipCost + ' tickets</button>';
    openModal(
      '<h3>Jammed</h3><p>' + (why || 'The waiting bays filled before the right ferry arrived.') + '</p>' +
      '<div class="actions">' +
        '<button class="btn block" data-act="restart-close">Try again</button>' +
        extra +
        '<button class="btn ghost block" data-act="after-win-levels">Levels</button>' +
      '</div>'
    );
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
    if (save.tickets < cost) { toast('Need ' + cost + ' tickets' + (label ? ' for ' + label : '')); return false; }
    save.tickets -= cost;
    persist();
    return true;
  }

  function doHint() {
    var id = Engine.hint(play.level, play.state);
    if (!id) { toast('No hint right now'); return; }
    play.state.usedHint = true;
    var el = document.querySelector('[data-car="' + id + '"]');
    if (el) el.classList.add('hinting');
    toast('Try this car');
  }

  function doExtraBay() {
    play.state = Engine.addExtraSlot(play.state);
    renderPlay();
    toast('Extra waiting bay added');
  }

  function handleBuy(id) {
    var p = Economy.product(id);
    if (!p) return;
    IAP.purchase(id).then(function (res) {
      if (!res || !res.ok) return;
      if (p.tickets) save.tickets += p.tickets;
      if (p.type === 'ads' || (p.extras && p.extras.removeAds)) save.noAds = true;
      if (p.type === 'starter') { save.starterBought = true; save.dockTokens = (save.dockTokens || 0) + 3; }
      if (p.type === 'pass') {
        save.harborPass = true;
        save.harborPassUntil = Date.now() + 30 * 86400000;
        save.noAds = true;
      }
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
    Ads.showRewarded(reason).then(function (ok) {
      if (!ok) return;
      lastRewarded = Date.now();
      if (typeof Ads.lastRewardedAt === 'function') lastRewarded = Ads.lastRewardedAt() || lastRewarded;
      onOk();
    });
  }

  function onClick(ev) {
    var t = ev.target.closest('[data-act],[data-go],[data-level],[data-car],[data-buy]');
    if (!t) return;
    if (window.AudioFx) { AudioFx.resume(); if (t.getAttribute('data-car') == null) sfx('tap'); }
    var act = t.getAttribute('data-act');
    var go = t.getAttribute('data-go');
    var lvl = t.getAttribute('data-level');
    var car = t.getAttribute('data-car');
    var buy = t.getAttribute('data-buy');
    if (go) { screen = go; render(); return; }
    if (lvl) { startLevel(Number(lvl)); return; }
    if (car) { tryMove(car); return; }
    if (buy) { handleBuy(buy); return; }
    if (act === 'play-next') { if (!save.seenHelp) { screen = 'help'; render(); return; } startLevel(nextPlayable()); return; }
    if (act === 'start-play') { save.seenHelp = true; persist(); startLevel(nextPlayable()); return; }
    if (act === 'mute-sfx') { save.mutedSfx = !save.mutedSfx; persist(); applyMute(); render(); return; }
    if (act === 'mute-bgm') { save.mutedBgm = !save.mutedBgm; persist(); applyMute(); render(); return; }
    if (act === 'undo') { undo(); return; }
    if (act === 'restart' || act === 'restart-close') { closeModal(); restart(); return; }
    if (act === 'hint') {
      openModal('<h3>Hint</h3><p>Spend ' + ECO.hintCost + ' tickets, or watch a placeholder ad.</p><div class="actions">' +
        '<button class="btn block" data-act="hint-pay">Spend ' + ECO.hintCost + '</button>' +
        '<button class="btn teal block" data-act="hint-ad">Watch ad</button>' +
        '<button class="btn ghost block" data-act="close-modal">Cancel</button></div>');
      return;
    }
    if (act === 'hint-pay') { closeModal(); if (spend(ECO.hintCost, 'a hint')) doHint(); return; }
    if (act === 'hint-ad') { closeModal(); rewarded('hint', doHint); return; }
    if (act === 'extra-bay') {
      openModal('<h3>Extra waiting bay</h3><p>Add one more stall on the pier for this level.</p><div class="actions">' +
        '<button class="btn block" data-act="bay-pay">Spend ' + ECO.extraBayCost + '</button>' +
        '<button class="btn teal block" data-act="bay-ad">Watch ad</button>' +
        '<button class="btn ghost block" data-act="close-modal">Cancel</button></div>');
      return;
    }
    if (act === 'bay-pay') { closeModal(); if (spend(ECO.extraBayCost, 'an extra bay')) doExtraBay(); return; }
    if (act === 'bay-ad') { closeModal(); rewarded('extra-bay', doExtraBay); return; }
    if (act === 'undo-pay') { closeModal(); if (spend(ECO.undoCost, 'undo')) { play.freeUndos += 1; if (modalRoot._undoApply) modalRoot._undoApply(); } return; }
    if (act === 'undo-ad') { closeModal(); rewarded('undo', function () { play.freeUndos += 3; if (modalRoot._undoApply) modalRoot._undoApply(); }); return; }
    if (act === 'close-modal') { closeModal(); return; }
    if (act === 'next') { afterWinNav('next'); return; }
    if (act === 'after-win-replay') { afterWinNav('replay'); return; }
    if (act === 'after-win-levels') { afterWinNav('levels'); return; }
    if (act === 'double-coins') {
      if (play.doubled) { toast('Already doubled'); return; }
      rewarded('double-coins', function () {
        play.doubled = true;
        var stars = rateStars(play.state);
        var add = stars * (ECO.perStar || 5);
        if (play.mode === 'daily') add += ECO.dailyPuzzleReward || 0;
        else if (!save.cleared[play.level.id]) { /* already granted first-clear */ }
        save.tickets += add;
        persist();
        var rec = modalRoot.querySelector('.reward');
        if (rec) rec.textContent = 'Tickets doubled!';
        var chip = document.querySelector('[data-tickets]');
        if (chip) chip.textContent = save.tickets;
        toast('Tickets doubled');
      });
      return;
    }
    if (act === 'skip') {
      closeModal();
      if (play.mode === 'daily') return;
      if (!spend(ECO.skipCost, 'a skip')) return;
      var id = play.level.id;
      save.unlocked = Math.max(save.unlocked || 1, id + 1);
      persist();
      maybeInterstitial(function () { startLevel(id + 1); });
      return;
    }
    if (act === 'streak-save') {
      closeModal();
      rewarded('streak-save', function () {
        save.streak.freeze = (save.streak.freeze || 0) + 1;
        persist();
        toast('Streak freeze ready');
        restart();
      });
      return;
    }
    if (act === 'daily-play') { startLevel('daily', 'daily'); return; }
    if (act === 'daily-share') {
      var text = save.daily.result || ('Ferry Jam Daily ' + utcToday());
      openModal('<h3>Share</h3><div class="share-box">' + text.replace(/</g, '') + '</div><div class="actions">' +
        '<button class="btn block" data-act="copy-share">Copy</button>' +
        '<button class="btn ghost block" data-act="close-modal">Close</button></div>');
      modalRoot._share = text;
      return;
    }
    if (act === 'copy-share') {
      var tx = modalRoot._share || '';
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(tx).catch(function () {});
      toast('Copied');
      closeModal();
      return;
    }
    if (act === 'buy-freeze') {
      if (spend(ECO.streakFreezeCost, 'a streak freeze')) {
        save.streak.freeze = (save.streak.freeze || 0) + 1;
        persist();
        toast('Freeze added');
        renderDaily();
      }
      return;
    }
    if (act === 'claim-login') {
      var amt = claimLogin(1);
      if (amt) { sfx('coin'); toast('+' + amt + ' tickets'); renderRewards(); }
      return;
    }
    if (act === 'claim-login-x2') {
      rewarded('daily-double', function () {
        var amt = claimLogin(2);
        if (amt) { sfx('coin'); toast('+' + amt + ' tickets (×2)'); renderRewards(); }
      });
      return;
    }
    if (act === 'watch-ad') {
      rewarded('tickets', function () {
        save.tickets += ECO.adReward.tickets;
        persist();
        toast('+' + ECO.adReward.tickets + ' tickets');
        renderShop();
      });
      return;
    }
    if (act === 'tutor-next') {
      if (play) {
        play.tutorialStep = (play.tutorialStep || 0) + 1;
        if (play.tutorialStep >= 3) { save.seenTutorial = true; persist(); }
      } else { save.seenTutorial = true; persist(); }
      renderPlay();
      return;
    }
  }

  document.addEventListener('click', onClick);
  document.addEventListener('pointerdown', function once() {
    if (window.AudioFx) AudioFx.resume();
  }, { once: false });

  save = load();
  syncStreakOnOpen();
  ensureDailyMeta();
  rollQuests();
  applyMute();
  if (window.AudioFx) AudioFx.preload();
  render();
})();
