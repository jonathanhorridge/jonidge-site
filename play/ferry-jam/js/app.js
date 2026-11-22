/* Ferry Jam UI — progress, play, shop, ad placeholders. */
(function () {
  'use strict';
  var KEY = 'ferryjam:v1';
  var ECO = Economy.ECONOMY;
  var view = document.getElementById('view');
  var modalRoot = document.getElementById('modal-root');
  var toastEl = document.getElementById('toast');
  var banner = document.getElementById('ad-banner');
  var country = Economy.detectCountry();
  var save, screen = 'home', play = null, busy = false, toastTimer = 0;

  function today() {
    try { return new Date().toISOString().slice(0, 10); } catch (e) { return '1970-01-01'; }
  }
  function defaultSave() {
    return {
      tickets: ECO.welcomeGift, welcomed: true, stars: {}, unlocked: 1, cleared: {},
      noAds: false, starterBought: false, dockTokens: 0,
      adsToday: { date: today(), count: 0 },
      levelsSinceInterstitial: 0, seenHelp: false
    };
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return defaultSave();
      var s = Object.assign(defaultSave(), JSON.parse(raw));
      if (s.adsToday && s.adsToday.date !== today()) s.adsToday = { date: today(), count: 0 };
      return s;
    } catch (e) { return defaultSave(); }
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} }
  save = load();

  function levelById(id) { return LEVELS.filter(function (l) { return l.id === id; })[0]; }
  function isUnlocked(id) { return id <= (save.unlocked || 1); }
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }
  function ticketsChip() {
    return '<button class="chip" id="chip-tickets" type="button" aria-label="Tickets">' + Art.ticketSVG() +
      '<b>' + save.tickets + '</b></button>';
  }
  function backBtn(to) {
    return '<button class="ico-btn" data-go="' + to + '" aria-label="Back">' + Art.icon('back', '#C25100') + '</button>';
  }
  function starStr(n, max) {
    max = max || 3;
    var s = '';
    for (var i = 1; i <= max; i++) {
      var svg = Art.icon(i <= n ? 'star' : 'starOff');
      if (i <= n) svg = svg.replace('class="ico"', 'class="ico on"');
      s += svg;
    }
    return s;
  }
  function showBanner(where) {
    var hide = save.noAds || !Ads.enabled || where === 'none';
    banner.hidden = hide;
  }
  function closeModal() { modalRoot.className = ''; modalRoot.innerHTML = ''; }
  function openModal(html, centered) {
    modalRoot.className = 'open';
    modalRoot.innerHTML = '<div class="modal-back"><div class="modal' + (centered ? ' center' : '') + '">' + html + '</div></div>';
  }

  /* ---------- screens ---------- */
  function render() {
    if (screen === 'home') renderHome();
    else if (screen === 'levels') renderLevels();
    else if (screen === 'help') renderHelp();
    else if (screen === 'shop') renderShop();
    else if (screen === 'play') renderPlay();
    showBanner(screen === 'play' || screen === 'home' || screen === 'levels' ? screen : 'none');
  }

  function renderHome() {
    var cleared = Object.keys(save.cleared).length;
    view.innerHTML =
      '<div class="home">' +
        '<div class="home-sky"><div class="sun"></div><div class="cloud c1"></div><div class="cloud c2"></div></div>' +
        '<div class="home-hero">' +
          '<div class="logo-wrap">' + Art.logoSVG() + '</div>' +
          '<h1 class="wordmark">FERRY<span>JAM</span></h1>' +
          '<p>Clear the harbor. Load the ferries.</p>' +
          '<div class="chip-row">' + ticketsChip() +
            (cleared ? '<span class="chip">Cleared ' + cleared + '/10</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="home-shore"></div>' +
        '<div class="home-actions">' +
          '<button class="btn lg block" data-go="play-next">' + Art.icon('play') + ' Play</button>' +
          '<button class="btn white block" data-go="levels">Levels</button>' +
          '<div style="display:flex;gap:8px">' +
            '<button class="btn ghost block" data-go="help">' + Art.icon('help', '#1A2A33') + ' How to play</button>' +
            '<button class="btn ghost block" data-go="shop">' + Art.icon('shop', '#1A2A33') + ' Shop</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderLevels() {
    var cards = LEVELS.map(function (lv) {
      var open = isUnlocked(lv.id);
      var stars = save.stars[lv.id] || 0;
      return '<button class="lvl' + (open ? '' : ' locked') + '" data-level="' + lv.id + '" ' + (open ? '' : 'disabled') + '>' +
        '<div class="num">' + (open ? lv.id : '<span class="lock-ico">' + Art.icon('lock') + '</span>') + '</div>' +
        '<div class="nm">' + lv.name + '</div>' +
        '<div class="stars">' + (open ? starStr(stars) : '') + '</div>' +
      '</button>';
    }).join('');
    view.innerHTML =
      '<div class="screen">' +
        '<div class="topbar">' + backBtn('home') + '<h2>Levels</h2>' + ticketsChip() + '</div>' +
        '<div class="level-grid">' + cards + '</div>' +
      '</div>';
  }

  function renderHelp() {
    view.innerHTML =
      '<div class="screen">' +
        '<div class="topbar">' + backBtn('home') + '<h2>How to play</h2><span style="width:40px"></span></div>' +
        '<div class="help-card"><h3>1. Drive a car out</h3><p>Tap a car. It only leaves if every space in front of it, in the direction it faces, is empty all the way to the edge.</p></div>' +
        '<div class="help-card"><h3>2. Match the ferry</h3><p>Cars board a docked ferry of the same color. When a ferry is full it sails away, and the next one in line docks.</p></div>' +
        '<div class="help-card"><h3>3. Use the holding dock</h3><p>If the right ferry is not in yet, the car can wait in a holding stall. Fill every stall with the wrong color and you are jammed.</p></div>' +
        '<div class="help-card"><h3>4. Stars</h3><p>Three stars means you cleared the level in at most the par number of moves, without a hint or an extra stall.</p></div>' +
        '<button class="btn block" data-act="start-play">Got it</button>' +
      '</div>';
  }

  function renderShop() {
    var items = Economy.PRODUCTS.map(function (p) {
      var price = Economy.priceFor(p.sku, country);
      var owned = (p.kind === 'noads' && save.noAds) || (p.kind === 'starter' && save.starterBought);
      var tag = p.tag === 'popular' ? '<span class="tag">Popular</span>' :
                p.tag === 'best_value' ? '<span class="tag best">Best value</span>' : '';
      var detail = p.kind === 'noads' ? 'Removes banner and interstitials. Rewarded ads stay optional.' :
                   p.kind === 'starter' ? '500 Tickets + 2 extra-dock tokens. One-time hook offer.' :
                   p.coins + ' Tickets' + (p.bonus ? ' (includes ' + p.bonus + '% bonus)' : '');
      return '<div class="product">' +
        '<div class="info"><h3>' + p.name + ' ' + tag + '</h3><p>' + detail + '</p></div>' +
        (owned ? '<span class="chip">Owned</span>' :
          '<button class="btn sm" data-buy="' + p.sku + '">' + price.text + '</button>') +
      '</div>';
    }).join('');
    var adLeft = Math.max(0, ECO.adsPerDay - (save.adsToday.count || 0));
    view.innerHTML =
      '<div class="screen">' +
        '<div class="topbar">' + backBtn('home') + '<h2>Shop</h2>' + ticketsChip() + '</div>' +
        '<p style="color:#fff;font-weight:700;margin:0 0 10px;text-align:center">Simulated store — nothing is charged.</p>' +
        '<div class="shop-list">' + items +
          '<div class="product"><div class="info"><h3>Watch an ad</h3><p>Placeholder rewarded ad. +' + ECO.adReward +
            ' Tickets, ' + adLeft + ' left today.</p></div>' +
            '<button class="btn sm teal" data-act="watch-coins"' + (adLeft ? '' : ' disabled') + '>Watch</button></div>' +
        '</div>' +
      '</div>';
  }

  /* ---------- play ---------- */
  function startLevel(id) {
    var level = levelById(id);
    if (!level || !isUnlocked(id)) return;
    play = {
      level: level,
      state: Engine.init(level),
      undo: [],
      hintsUsed: 0,
      animating: false
    };
    screen = 'play';
    render();
  }

  function nextPlayable() {
    for (var i = 0; i < LEVELS.length; i++) {
      if (isUnlocked(LEVELS[i].id) && !save.cleared[LEVELS[i].id]) return LEVELS[i].id;
    }
    return save.unlocked <= 10 ? Math.min(save.unlocked, 10) : 1;
  }

  function carStyle(car) {
    var cells = Engine.cellsOf(car);
    var rs = cells.map(function (p) { return p.r; });
    var cs = cells.map(function (p) { return p.c; });
    return 'grid-row:' + (Math.min.apply(null, rs) + 1) + ' / ' + (Math.max.apply(null, rs) + 2) +
      ';grid-column:' + (Math.min.apply(null, cs) + 1) + ' / ' + (Math.max.apply(null, cs) + 2);
  }

  function carHtml(car, extraClass, opts) {
    opts = opts || {};
    return '<button class="car c-' + car.color + ' dir-' + car.dir + ' len-' + car.len + ' kind-' + Art.kindOf(car) +
      (extraClass ? ' ' + extraClass : '') + '" data-car="' + (opts.noPick ? '' : car.id) + '" style="' + carStyle(car) +
      '" aria-label="' + car.color + ' car">' + Art.carSVG(car) + '</button>';
  }

  function deckCarHtml(car, dir) {
    var c = { id: car.id, color: car.color, len: car.len || 1, dir: dir || 'E', r: 0, c: 0 };
    return Art.carSVG(c, { dir: dir || 'E', uid: 'deck', className: 'car-svg' });
  }

  function ferryHtml(f, cls) {
    var slots = Art.ferrySlots(f.capacity || 1);
    var cargo = f.cargo || [];
    var slotHtml = slots.map(function (s, i) {
      var car = cargo[i];
      return '<div class="fslot" data-slot="' + i + '" style="left:' + s.x + '%;top:' + s.y + '%;width:' + s.w + '%;height:' + s.h + '%">' +
        (car ? deckCarHtml(car, 'E') : '') + '</div>';
    }).join('');
    return '<div class="ferry c-' + f.color + (cls ? ' ' + cls : '') + '" data-ferry="' + f.id + '">' +
      '<div class="ferry-art">' + Art.ferrySVG(f) + '</div>' +
      '<div class="ferry-slots">' + slotHtml + '</div>' +
      '<div class="wake"></div></div>';
  }

  function renderPlay() {
    if (!play) return;
    var lv = play.level, st = play.state;
    var cells = '';
    for (var r = 0; r < lv.rows; r++) {
      for (var c = 0; c < lv.cols; c++) {
        var obs = (lv.obstacles || []).some(function (o) { return o.r === r && o.c === c; });
        cells += '<div class="' + (obs ? 'obs' : 'cell') + '" style="grid-row:' + (r + 1) + ';grid-column:' + (c + 1) + '">' +
          (obs ? Art.crateSVG() : '') + '</div>';
      }
    }
    var cars = st.cars.map(function (car) { return carHtml(car); }).join('');
    var ferries = st.docked.map(function (f) { return ferryHtml(f); }).join('') ||
      '<div style="color:#083344;font-weight:700;padding:8px">All ferries have sailed</div>';
    var cap = Engine.holdCap(st);
    var slots = '';
    for (var i = 0; i < cap; i++) {
      var h = st.hold[i];
      slots += '<div class="hold-slot' + (h ? ' filled' : '') + '" data-hold="' + i + '">' +
        (h ? deckCarHtml(h, 'E') : '') + '</div>';
    }
    var q = st.queue.map(function (f) {
      return '<i class="qdot" style="background:' + Art.PALETTE[f.color].body + '"></i>';
    }).join('');
    view.innerHTML =
      '<div class="play">' +
        '<div class="play-top">' + backBtn('levels') +
          '<div class="level-badge"><span class="no">Level ' + lv.id + '</span><h2>' + lv.name + '</h2></div>' +
          ticketsChip() +
        '</div>' +
        '<div class="tools">' +
          '<button class="tool" data-act="undo"' + (play.undo.length ? '' : ' disabled') + '>' + Art.icon('undo', '#C25100') + '<span class="k">Undo</span></button>' +
          '<button class="tool" data-act="restart">' + Art.icon('restart', '#C25100') + '<span class="k">Restart</span></button>' +
          '<button class="tool hint" data-act="hint">' + Art.icon('hint') + '<span class="k">' + ECO.costs.hint + ' / ad</span></button>' +
          '<button class="tool dock" data-act="extradock">' + Art.icon('dock', '#1A2A33') + '<span class="k">Dock slot</span></button>' +
        '</div>' +
        '<div class="stage" id="stage">' +
          '<div class="lot-wrap">' +
            '<div class="deco tree-l">' + Art.treeSVG() + '</div>' +
            '<div class="deco tree-r">' + Art.treeSVG() + '</div>' +
            '<div class="deco cone-l">' + Art.coneSVG() + '</div>' +
            '<div class="deco cone-r">' + Art.coneSVG() + '</div>' +
            '<div class="lot" id="lot" style="--rows:' + lv.rows + ';--cols:' + lv.cols +
              ';grid-template-rows:repeat(' + lv.rows + ',1fr);grid-template-columns:repeat(' + lv.cols + ',1fr)">' +
              cells + cars +
            '</div>' +
          '</div>' +
          '<div class="harbor">' +
            '<div class="pier">' +
              '<div class="deco" style="width:18px">' + Art.bollardSVG() + '</div>' +
              '<div class="hold-col"><label>Hold</label><div class="hold-slots">' + slots + '</div></div>' +
              '<div class="deco" style="width:18px">' + Art.bollardSVG() + '</div>' +
            '</div>' +
            '<div class="pier-edge"></div>' +
            '<div class="water">' +
              '<div class="foam"></div>' +
              '<div class="docks">' +
                '<div class="berth-row" id="berths">' + ferries + '</div>' +
              '</div>' +
              '<div class="queue-hint">Next <span class="queue-dots">' + (st.queue.length ? q : '—') + '</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="blurb">' + (lv.blurb || '') + (st.moves ? ' · ' + st.moves + ' moves' : '') + '</div>' +
      '</div>';
  }

  function afterMove(prevDockedIds, result) {
    renderPlay();
    if (play.state.status === 'won') onWin();
    else if (play.state.status === 'lost') onLose(result && result.how === 'jammed'
      ? 'No matching ferry and the holding dock is full.'
      : 'No car can leave the lot.');
  }

  function honk() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      honk.ac = honk.ac || new AC();
      var ac = honk.ac, t = ac.currentTime;
      [392, 311].forEach(function (freq, i) {
        var o = ac.createOscillator(), g = ac.createGain();
        o.type = 'triangle'; o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.07, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16 + i * 0.07);
        o.connect(g); g.connect(ac.destination);
        o.start(t + i * 0.08); o.stop(t + 0.22 + i * 0.08);
      });
    } catch (e) {}
  }

  function animateTo(el, keyframes, opts) {
    return new Promise(function (resolve) {
      if (!el || !el.animate) { resolve(); return; }
      var a = el.animate(keyframes, opts);
      a.onfinish = function () { resolve(); };
      a.oncancel = function () { resolve(); };
    });
  }

  function exitDistance(level, car) {
    var d = Engine.DIR[car.dir];
    var steps = 0, r = car.r, c = car.c;
    for (;;) {
      r += d.dr; c += d.dc; steps += 1;
      if (r < 0 || c < 0 || r >= level.rows || c >= level.cols) break;
    }
    return steps + (car.len || 1);
  }

  function findLanding(before, result, car) {
    if (result.how === 'hold') {
      var i = before.hold.length; // new car will be appended
      return view.querySelector('.hold-slot[data-hold="' + i + '"]') || view.querySelector('.hold-slot:not(.filled)');
    }
    if (result.how === 'ferry' || result.how === 'jammed') {
      var idx = -1;
      for (var i = 0; i < before.docked.length; i++) {
        var f = before.docked[i];
        if (f.color === car.color && f.loaded < f.capacity) { idx = i; break; }
      }
      if (idx === -1) return null;
      var ferry = before.docked[idx];
      var slot = (ferry.cargo || []).length;
      return view.querySelector('[data-ferry="' + ferry.id + '"] .fslot[data-slot="' + slot + '"]') ||
        view.querySelector('[data-ferry="' + ferry.id + '"]');
    }
    return null;
  }

  function tryMove(carId) {
    if (!play || play.state.status !== 'playing' || busy) return;
    var before = play.state;
    var step = Engine.apply(play.level, before, carId);
    var el = view.querySelector('[data-car="' + carId + '"]');
    if (!step.result.ok && step.state.status !== 'lost' && step.result.how === 'blocked') {
      if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
      var stage = document.getElementById('stage');
      if (stage) { stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake'); }
      return;
    }
    if (!step.result.ok && step.result.how !== 'jammed' && step.state.status !== 'lost') return;
    busy = true;
    play.undo.push(Engine.clone(before));
    var car = null;
    for (var i = 0; i < before.cars.length; i++) if (before.cars[i].id === carId) car = before.cars[i];
    var sailed = step.state.sailed.length > before.sailed.length;
    var sailId = sailed ? step.state.sailed[step.state.sailed.length - 1].id : null;

    function finish() {
      var fly = document.querySelector('.flyer');
      if (fly && fly.parentNode) fly.parentNode.removeChild(fly);
      play.state = step.state;
      busy = false;
      afterMove(null, step.result);
    }

    if (!el || !car) {
      if (sailed) {
        var fe = view.querySelector('[data-ferry="' + sailId + '"]');
        if (fe) fe.classList.add('sailing');
        if (sailed) honk();
        setTimeout(finish, 700);
      } else finish();
      return;
    }

    var rect = el.getBoundingClientRect();
    var flyer = el.cloneNode(true);
    flyer.classList.add('flyer');
    flyer.removeAttribute('data-car');
    flyer.style.left = rect.left + 'px';
    flyer.style.top = rect.top + 'px';
    flyer.style.width = rect.width + 'px';
    flyer.style.height = rect.height + 'px';
    document.body.appendChild(flyer);
    el.style.visibility = 'hidden';

    var lot = document.getElementById('lot');
    var lotRect = lot.getBoundingClientRect();
    var cellW = lotRect.width / play.level.cols;
    var cellH = lotRect.height / play.level.rows;
    var d = Engine.DIR[car.dir];
    var cells = exitDistance(play.level, car);
    var distX = d.dc * cells * cellW;
    var distY = d.dr * cells * cellH;
    var tDrive = Math.min(560, 160 + cells * 80);
    var landing = findLanding(before, step.result, car);

    animateTo(flyer, [
      { transform: 'translate(0px,0px)' },
      { transform: 'translate(' + distX + 'px,' + distY + 'px)' }
    ], { duration: tDrive, easing: 'ease-in', fill: 'forwards' }).then(function () {
      if (!landing) { finish(); return { skipped: true }; }
      var cur = flyer.getBoundingClientRect();
      var dest = landing.getBoundingClientRect();
      flyer.style.transform = 'none';
      flyer.style.left = cur.left + 'px';
      flyer.style.top = cur.top + 'px';
      return animateTo(flyer, [
        { left: cur.left + 'px', top: cur.top + 'px', width: cur.width + 'px', height: cur.height + 'px' },
        { left: dest.left + 'px', top: dest.top + 'px', width: Math.max(dest.width, 8) + 'px', height: Math.max(dest.height, 8) + 'px' }
      ], { duration: 280, easing: 'ease-out', fill: 'forwards' }).then(function () { return { skipped: false }; });
    }).then(function (flag) {
      if (!flag || flag.skipped) return;
      if (sailed) {
        honk();
        var fe = view.querySelector('[data-ferry="' + sailId + '"]');
        if (fe) fe.classList.add('sailing');
        setTimeout(finish, 720);
      } else {
        finish();
      }
    });
  }

  function undo() {
    if (!play || !play.undo.length || busy) return;
    play.state = play.undo.pop();
    renderPlay();
  }
  function restart() {
    if (!play || busy) return;
    var extra = play.state.extraSlots || 0;
    var used = play.state.usedExtraSlot;
    play.state = Engine.init(play.level);
    play.state.extraSlots = extra;
    play.state.usedExtraSlot = used;
    play.undo = [];
    renderPlay();
  }

  function rateStars(state) {
    var par = play.level.parMoves || state.moves;
    if (!state.usedHint && !state.usedExtraSlot && state.moves <= par) return 3;
    if ((play.hintsUsed <= ECO.stars.twoStarMaxHints) && !state.usedExtraSlot && state.moves <= par * ECO.stars.twoStarParFactor) return 2;
    return 1;
  }

  function grantWinRewards(stars) {
    var id = play.level.id;
    var prev = save.stars[id] || 0;
    var first = !save.cleared[id];
    var gained = 0;
    if (stars > prev) gained += (stars - prev) * ECO.perStar;
    if (first) gained += ECO.firstClear;
    save.stars[id] = Math.max(prev, stars);
    save.cleared[id] = true;
    if (id >= save.unlocked) save.unlocked = Math.min(10, id + 1);
    var allNow = LEVELS.every(function (l) { return save.cleared[l.id]; });
    var allBonus = 0;
    if (allNow && !save.allClearPaid) { allBonus = ECO.allClearBonus; save.allClearPaid = true; }
    save.tickets += gained + allBonus;
    persist();
    return { gained: gained, allBonus: allBonus, first: first, newUnlock: first && id < 10 ? id + 1 : 0 };
  }

  function maybeInterstitial(then) {
    if (save.noAds) return then();
    var id = play.level.id;
    if (id < 5) return then(); // never during / after first 5? "after level 5"
    // Count completions of levels 6+ (the win we just had is included if id>=6)
    if (id < ECO.interstitial.fromLevel) return then();
    save.levelsSinceInterstitial = (save.levelsSinceInterstitial || 0) + 1;
    persist();
    if (save.levelsSinceInterstitial < ECO.interstitial.everyLevels) return then();
    save.levelsSinceInterstitial = 0;
    persist();
    Ads.showInterstitial('between-levels', showInterstitialUI).then(then);
  }

  function burstConfetti() {
    var canvas = document.getElementById('fx');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var colors = ['#E23B3B', '#2F7BF6', '#F5C400', '#17A85C', '#F07810', '#fff', '#FFE56A'];
    var bits = [];
    for (var i = 0; i < 90; i++) {
      bits.push({
        x: canvas.width * (0.2 + Math.random() * 0.6),
        y: -20 - Math.random() * 80,
        vx: (Math.random() - 0.5) * 7,
        vy: 2 + Math.random() * 5,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        color: colors[i % colors.length],
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.3
      });
    }
    var start = Date.now();
    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      bits.forEach(function (b) {
        b.x += b.vx; b.y += b.vy; b.vy += 0.12; b.rot += b.vr;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillStyle = b.color;
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.restore();
      });
      if (Date.now() - start < 1800) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    tick();
  }

  function onWin() {
    var stars = rateStars(play.state);
    var rw = grantWinRewards(stars);
    renderPlay();
    burstConfetti();
    var msg = '+' + rw.gained + ' Tickets';
    if (rw.allBonus) msg += ' · Harbor cleared! +' + rw.allBonus;
    openModal(
      '<h3>Harbor clear!</h3>' +
      '<div class="star-row">' + starStr(stars) + '</div>' +
      '<p>Level ' + play.level.id + ' · ' + play.state.moves + ' moves' +
        (play.state.moves <= play.level.parMoves ? ' (par ' + play.level.parMoves + ')' : '') + '</p>' +
      '<div class="reward">' + msg + '</div>' +
      '<div class="actions">' +
        (play.level.id < 10 ? '<button class="btn block" data-act="next">Next level</button>' : '') +
        '<button class="btn white block" data-act="after-win-replay">Replay</button>' +
        '<button class="btn ghost block" data-act="after-win-levels" style="color:#0F2A33;box-shadow:0 3px 0 #D1D5DB">Level select</button>' +
      '</div>'
    );
  }

  function onLose(why) {
    openModal(
      '<h3>Jammed!</h3>' +
      '<p>' + (why || 'The harbor is stuck.') + '</p>' +
      '<div class="actions">' +
        '<button class="btn block" data-act="retry">Try again</button>' +
        '<button class="btn teal block" data-act="extradock">Extra dock slot · ' + ECO.costs.extraSlot + ' / ad</button>' +
        '<button class="btn ghost block" data-act="hint" style="color:#0F2A33;box-shadow:0 3px 0 #D1D5DB">Hint · ' + ECO.costs.hint + ' / ad</button>' +
        '<button class="btn ghost block" data-act="skip" style="color:#0F2A33;box-shadow:0 3px 0 #D1D5DB">Skip level · ' + ECO.costs.skip + ' Tickets</button>' +
        '<button class="btn ghost block" data-go="levels" style="color:#0F2A33;box-shadow:0 3px 0 #D1D5DB">Level select</button>' +
      '</div>'
    );
  }

  /* ---------- ads / iap placeholders ---------- */
  function showRewardedUI(placement) {
    return new Promise(function (resolve) {
      var secs = 3;
      function paint(n) {
        openModal(
          '<div class="ad-overlay" style="position:relative;border-radius:16px;min-height:280px">' +
            '<h3>Rewarded ad</h3><p>Placeholder — no real ad is shown.</p>' +
            '<div class="ad-box">AD · ' + placement + '</div>' +
            '<p>' + (n > 0 ? 'Reward in ' + n + '…' : 'Done') + '</p>' +
          '</div>', true);
      }
      paint(secs);
      var t = setInterval(function () {
        secs -= 1;
        if (secs <= 0) {
          clearInterval(t);
          closeModal();
          resolve(true);
        } else paint(secs);
      }, 1000);
    });
  }
  function showInterstitialUI(placement) {
    return new Promise(function (resolve) {
      var skipAt = Date.now() + 2000;
      function paint(canSkip) {
        openModal(
          '<div class="ad-overlay" style="position:relative;border-radius:16px;min-height:280px">' +
            '<h3>Advertisement</h3><p>Placeholder interstitial — nothing is loaded from a network.</p>' +
            '<div class="ad-box">AD · ' + placement + '</div>' +
            '<button class="btn white"' + (canSkip ? '' : ' disabled') + ' data-skip-ad="1">' +
              (canSkip ? 'Close' : 'Close in 2s') + '</button>' +
          '</div>', true);
      }
      paint(false);
      setTimeout(function () { paint(true); }, 2000);
      modalRoot.addEventListener('click', function handler(ev) {
        if (!ev.target.closest('[data-skip-ad]')) return;
        if (Date.now() < skipAt) return;
        modalRoot.removeEventListener('click', handler);
        closeModal();
        resolve();
      });
    });
  }
  function confirmPurchase(product, price) {
    return new Promise(function (resolve) {
      openModal(
        '<h3>' + product.name + '</h3>' +
        '<p>This is a <b>simulated</b> purchase for ' + price.text + '. No money will be charged.</p>' +
        '<div class="actions">' +
          '<button class="btn block" data-confirm-buy="1">Pretend to buy</button>' +
          '<button class="btn white block" data-confirm-buy="0">Cancel</button>' +
        '</div>'
      );
      modalRoot.addEventListener('click', function handler(ev) {
        var btn = ev.target.closest('[data-confirm-buy]');
        if (!btn) return;
        modalRoot.removeEventListener('click', handler);
        closeModal();
        resolve(btn.getAttribute('data-confirm-buy') === '1');
      });
    });
  }

  function offerPay(cost, kind, onYes) {
    var adLabel = kind === 'coins' ? 'Watch for ' + ECO.adReward + ' Tickets' : 'Watch a rewarded ad instead';
    openModal(
      '<h3>' + (kind === 'hint' ? 'Need a hint?' : kind === 'slot' ? 'Extra dock slot' : 'Tickets') + '</h3>' +
      '<p>' + (kind === 'hint' ? 'A safe car will be highlighted.' :
               kind === 'slot' ? 'Adds one holding stall for this attempt.' : '') + '</p>' +
      '<div class="actions">' +
        '<button class="btn block" data-pay="tickets"' + (save.tickets >= cost ? '' : ' disabled') + '>' +
          'Spend ' + cost + ' Tickets</button>' +
        '<button class="btn teal block" data-pay="ad">' + adLabel + '</button>' +
        (kind === 'slot' && save.dockTokens > 0 ?
          '<button class="btn green block" data-pay="token">Use a dock token (' + save.dockTokens + ' left)</button>' : '') +
        '<button class="btn white block" data-pay="no">Cancel</button>' +
      '</div>'
    );
    modalRoot.addEventListener('click', function handler(ev) {
      var btn = ev.target.closest('[data-pay]');
      if (!btn) return;
      var how = btn.getAttribute('data-pay');
      modalRoot.removeEventListener('click', handler);
      closeModal();
      if (how === 'no') return;
      if (how === 'tickets') {
        if (save.tickets < cost) { toast('Not enough Tickets'); return; }
        save.tickets -= cost; persist(); onYes(); render(); return;
      }
      if (how === 'token') {
        if (save.dockTokens <= 0) return;
        save.dockTokens -= 1; persist(); onYes(); render(); return;
      }
      if (how === 'ad') {
        Ads.showRewarded(kind, showRewardedUI).then(function (ok) {
          if (ok) { onYes(); render(); }
        });
      }
    });
  }

  function doHint() {
    if (!play) return;
    if (play.state.status === 'lost') {
      // Restart then hint is more useful; just offer after retry. Apply on current if playing.
    }
    var id = Engine.hint(play.level, play.state);
    if (!id) { toast('No hint right now'); return; }
    play.state.usedHint = true;
    play.hintsUsed += 1;
    renderPlay();
    var el = view.querySelector('[data-car="' + id + '"]');
    if (el) el.classList.add('hinting');
    toast('Try the highlighted car');
  }

  function doExtraSlot() {
    if (!play) return;
    var wasLost = play.state.status === 'lost';
    if (wasLost && play.undo.length) {
      // Step back to before the jammed move, then add a slot so the player can retry that car.
      play.state = play.undo[play.undo.length - 1];
    } else if (wasLost) {
      play.state = Engine.init(play.level);
      play.undo = [];
    }
    play.state = Engine.addExtraSlot(play.state);
    closeModal();
    renderPlay();
    toast('Extra holding stall added');
  }

  function buy(sku) {
    var product = Economy.PRODUCTS.filter(function (p) { return p.sku === sku; })[0];
    if (!product) return;
    if (product.kind === 'noads' && save.noAds) return;
    if (product.kind === 'starter' && save.starterBought) return;
    var price = Economy.priceFor(sku, country);
    IAP.purchase(product, price, confirmPurchase).then(function (res) {
      if (!res.ok) return;
      if (product.kind === 'noads') save.noAds = true;
      else if (product.kind === 'starter') {
        save.starterBought = true;
        save.tickets += product.coins;
        save.dockTokens = (save.dockTokens || 0) + (product.dockTokens || 0);
      } else {
        save.tickets += product.coins;
      }
      persist();
      toast('Added to your account (mock)');
      render();
    });
  }

  function watchCoins() {
    if (save.adsToday.date !== today()) save.adsToday = { date: today(), count: 0 };
    if (save.adsToday.count >= ECO.adsPerDay) { toast('Come back tomorrow'); return; }
    Ads.showRewarded('tickets', showRewardedUI).then(function (ok) {
      if (!ok) return;
      save.adsToday.count += 1;
      save.tickets += ECO.adReward;
      persist();
      toast('+' + ECO.adReward + ' Tickets');
      render();
    });
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-go],[data-level],[data-car],[data-act],[data-buy]');
    if (!t) {
      if (ev.target.closest('#chip-tickets')) { screen = 'shop'; closeModal(); render(); }
      return;
    }
    if (t.hasAttribute('data-go')) {
      var go = t.getAttribute('data-go');
      closeModal();
      if (go === 'play-next') {
        if (!save.seenHelp) { save.seenHelp = true; persist(); screen = 'help'; render(); return; }
        startLevel(nextPlayable()); return;
      }
      screen = go;
      render();
      return;
    }
    if (t.hasAttribute('data-level')) {
      var id = +t.getAttribute('data-level');
      startLevel(id);
      return;
    }
    if (t.hasAttribute('data-car')) { tryMove(t.getAttribute('data-car')); return; }
    if (t.hasAttribute('data-buy')) { buy(t.getAttribute('data-buy')); return; }
    if (t.hasAttribute('data-act')) {
      var act = t.getAttribute('data-act');
      if (act === 'start-play') {
        save.seenHelp = true; persist();
        startLevel(nextPlayable()); return;
      }
      if (act === 'undo') undo();
      else if (act === 'restart' || act === 'retry' || act === 'replay') { closeModal(); restart(); }
      else if (act === 'hint') {
        if (play && play.state.status === 'lost') { closeModal(); restart(); }
        offerPay(ECO.costs.hint, 'hint', doHint);
      }
      else if (act === 'extradock') offerPay(ECO.costs.extraSlot, 'slot', doExtraSlot);
      else if (act === 'skip') {
        closeModal();
        if (save.tickets < ECO.costs.skip) { toast('Not enough Tickets'); return; }
        save.tickets -= ECO.costs.skip;
        var id = play.level.id;
        if (id >= save.unlocked) save.unlocked = Math.min(10, id + 1);
        persist();
        toast('Level skipped');
        var nxt = id + 1;
        if (levelById(nxt) && isUnlocked(nxt)) startLevel(nxt);
        else { screen = 'levels'; render(); }
      }
      else if (act === 'watch-coins') watchCoins();
      else if (act === 'next' || act === 'after-win-replay' || act === 'after-win-levels') {
        var winAct = act === 'next' ? 'next' : (act === 'after-win-replay' ? 'replay' : 'levels');
        closeModal();
        maybeInterstitial(function () {
          if (winAct === 'next') {
            var nxt = play.level.id + 1;
            if (levelById(nxt) && isUnlocked(nxt)) startLevel(nxt);
            else { screen = 'levels'; render(); }
          } else if (winAct === 'replay') restart();
          else { screen = 'levels'; play = null; render(); }
        });
      }
    }
  });

  // First-run help
  if (!save.seenHelp) screen = 'help';
  render();
})();
