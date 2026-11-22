/* Lilyward - app shell: screens, HUD, input, save, monetization flow. */
(function () {
  'use strict';
  var D = window.GameData, E = window.Engine, R = window.Render, Ads = window.Ads, IAP = window.IAP, Sfx = window.Sfx;
  var $ = function (q) { return document.querySelector(q); };
  var SAVE_KEY = 'lilyward-v1';
  var ICON = {
    heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-8-5.3-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.7-8 11-8 11z" fill="#FF5A6E" stroke="#8C1D2C" stroke-width="1.5"/><ellipse cx="8.5" cy="8.5" rx="2" ry="1.2" fill="#fff" opacity=".6"/></svg>',
    coin: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#FFD23F" stroke="#B8860B" stroke-width="1.8"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="#E0A800" stroke-width="1.5"/><ellipse cx="9" cy="8.5" rx="2" ry="1.2" fill="#fff" opacity=".7"/></svg>',
    fly: '<svg viewBox="0 0 24 24"><ellipse cx="7.5" cy="9" rx="5" ry="3.2" fill="#DDF4FF" stroke="#7AA9C2" transform="rotate(-25 7.5 9)"/><ellipse cx="16.5" cy="9" rx="5" ry="3.2" fill="#DDF4FF" stroke="#7AA9C2" transform="rotate(25 16.5 9)"/><ellipse cx="12" cy="14" rx="3.4" ry="5" fill="#33363F"/><circle cx="10.6" cy="10.5" r="1.3" fill="#E63946"/><circle cx="13.4" cy="10.5" r="1.3" fill="#E63946"/></svg>',
    pearl: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="#F3E9FF" stroke="#9C7FD1" stroke-width="1.6"/><circle cx="9.5" cy="9" r="2.6" fill="#fff"/><circle cx="14" cy="15" r="3" fill="#E1D0FA" opacity=".8"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1.5" fill="#fff"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="#fff"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" fill="#FFD23F" stroke="#B8860B" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    starOff: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" fill="rgba(0,0,0,.25)" stroke="rgba(255,255,255,.35)" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2.5" fill="#cfd8dc"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="#cfd8dc" stroke-width="2.5"/></svg>',
    note: '<svg viewBox="0 0 24 24"><path d="M9 17V5l11-2v12" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><circle cx="6.5" cy="17.5" r="2.8" fill="#fff"/><circle cx="17.5" cy="15.5" r="2.8" fill="#fff"/></svg>',
    sound: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="#fff"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
    mute: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="#fff"/><path d="M16 9l5 6M21 9l-5 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z" fill="#fff"/></svg>',
    gift: '<svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="10" rx="2" fill="#FF5FA2"/><rect x="3" y="7" width="18" height="4" rx="1.5" fill="#FF8FC8"/><rect x="11" y="7" width="2" height="13" fill="#FFE14D"/><path d="M12 7c-2-4-6-3-5 0zM12 7c2-4 6-3 5 0z" fill="#FFE14D"/></svg>'
  };
  function ic(n, cls) { return '<span class="ic ' + (cls || '') + '">' + ICON[n] + '</span>'; }

  // ---------- save ----------
  var defaults = { v: 1, ads: {}, stars: [], flies: 0, pearls: 0, up: { coins: 0, lives: 0, power: 0, chorus: 0 }, hats: { none: 1 }, hat: 'none', removeAds: false, starter: false, muted: false, stats: { levelEnds: 0, lastInterstitial: 0, plays: 0 }, daily: '', tut: false, seen: {} };
  var save = load();
  function load() { try { var s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && s.v === 1) return Object.assign({}, JSON.parse(JSON.stringify(defaults)), s); } catch (e) {} return JSON.parse(JSON.stringify(defaults)); }
  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }
  function unlockedLevels() { return Math.min(D.LEVELS.length, save.stars.filter(function (x) { return x > 0; }).length + 1); }
  Ads.removed = save.removeAds; Sfx.setMuted(save.muted); Sfx.setMusic(save.music !== false); R.hat = save.hat;

  // ---------- canvas ----------
  var cv = $('#game'), ctx = cv.getContext('2d'), dpr = 1, W = 0, H = 0;
  function safeTop() { return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat')) || 0; }
  function resize() {
    dpr = Math.min(3, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    R.layout(W, H, 64 + safeTop(), 104);
  }
  window.addEventListener('resize', resize); resize();

  // ---------- game session ----------
  var G = null, speed = 1, sel = null, paused = false, lastT = 0, acc = 0;
  function meta() { return save.up; }
  function startLevel(i) {
    G = E.create(i, meta()); R.reset(); sel = null; speed = 1; paused = false; acc = 0;
    save.stats.plays++; persist();
    show('game'); closeSheet(); updateHud(true);
    var L = D.LEVELS[i], news = [];
    D.TOWER_ORDER.forEach(function (k) { if (D.TOWERS[k].unlock === i + 1 && i > 0) news.push('New frog: <b>' + D.TOWERS[k].name + '</b> \u2014 ' + D.TOWERS[k].desc); });
    var types = {}; L.waves.forEach(function (w) { w.split(',').forEach(function (g) { types[g.split('*')[0]] = 1; }); });
    Object.keys(types).forEach(function (k) { if (!save.seen[k] && D.ENEMIES[k].tip) news.push('Watch out: <b>' + D.ENEMIES[k].name + '</b> \u2014 ' + D.ENEMIES[k].tip); save.seen[k] = 1; });
    persist();
    coach(i === 0 && !save.tut ? 'Tap a glowing <b>lily pad</b> to place a frog' : news.length ? news.join('<br>') : 'Level ' + (i + 1) + ': ' + L.name, i === 0 && !save.tut ? 0 : 4200);
  }
  var coachT = null;
  function coach(html, ms) {
    var el = $('#coach'); el.innerHTML = html; el.hidden = false; el.classList.remove('out');
    clearTimeout(coachT); if (ms) coachT = setTimeout(function () { el.classList.add('out'); setTimeout(function () { el.hidden = true; }, 300); }, ms);
  }
  function hideCoach() { $('#coach').hidden = true; }

  function frame(t) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (t - (lastT || t)) / 1000); lastT = t;
    if (!G || screen !== 'game') return;
    if (!paused && !modalOpen) {
      acc += dt * speed;
      var n = 0; while (acc >= 1 / 60 && n < 10) { E.step(G, 1 / 60); acc -= 1 / 60; n++; }
      if (n === 10) acc = 0;
    }
    R.consume(G);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R.draw(ctx, G, paused ? 0 : dt * (modalOpen ? 1 : speed), selView(), dpr);
    updateHud();
    if (G.status === 'won' && !modalOpen) onWin();
    else if (G.status === 'dead' && !modalOpen) onDead();
  }
  requestAnimationFrame(frame);
  function selView() {
    if (!sel) return null;
    if (sel.tower) return { pad: sel.tower.pad, x: sel.tower.x, y: sel.tower.y, range: D.TOWERS[sel.tower.type].eco ? 0 : E.towerStats(sel.tower).range };
    var p = G.pads[sel.pad]; return { pad: sel.pad, x: p.x, y: p.y, range: sel.preview || 0 };
  }

  // ---------- HUD ----------
  var hudCache = {};
  function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
  function updateHud(force) {
    if (force) hudCache = {};
    setText('#h-lives', String(G.lives)); setText('#h-coins', String(G.coins));
    setText('#h-wave', 'Wave ' + Math.max(1, G.wave) + '/' + G.waves.length);
    setText('#h-speed', speed + '\u00D7');
    var ch = $('#chorus'), pct = Math.round(G.chorus * 100);
    if (hudCache.ch !== pct) { hudCache.ch = pct; ch.style.setProperty('--p', pct + '%'); ch.classList.toggle('ready', G.chorus >= 1); }
    var sw = $('#send'), can = E.canSendWave(G), label;
    if (G.status === 'ready') label = 'Start wave';
    else if (!can) label = G.wave >= G.waves.length ? 'Final wave!' : 'Wave ' + G.wave + '\u2026';
    else label = 'Next wave' + (G.breakT > 0 ? ' +' + Math.ceil(G.breakT) : ' +' + (6 + G.level * 2));
    setText('#send-label', label);
    if (hudCache.can !== can) { hudCache.can = can; sw.disabled = !can; sw.classList.toggle('pulse', can && (G.status === 'ready' || G.breakT > 0)); }
    if (sel && $('#sheet').dataset.kind) refreshSheetAfford();
  }

  // ---------- input ----------
  cv.addEventListener('pointerdown', function (ev) {
    if (!G || screen !== 'game' || modalOpen) return;
    Sfx.unlock();
    var p = R.toTile(ev.clientX, ev.clientY);
    var pi = -1, bd = 0.5 * 0.5;
    G.pads.forEach(function (pd, i) { var dd = (pd.x - p.x) * (pd.x - p.x) + (pd.y - p.y) * (pd.y - p.y); if (dd < bd) { bd = dd; pi = i; } });
    if (pi >= 0) {
      var pad = G.pads[pi];
      Sfx.play('tap');
      if (pad.tower) openTowerSheet(pad.tower); else openBuildSheet(pi);
      return;
    }
    if (E.tap(G, p.x, p.y)) return;
    closeSheet();
  });

  // ---------- bottom sheet ----------
  function closeSheet() { sel = null; var s = $('#sheet'); s.classList.remove('open'); s.dataset.kind = ''; $('#bottom').classList.remove('hide'); }
  function openBuildSheet(pi) {
    sel = { pad: pi, preview: 0 };
    var html = '<div class="sheet-title">Build a frog<button class="x" data-act="close">\u2715</button></div><div class="cards">';
    D.TOWER_ORDER.forEach(function (k) {
      var T = D.TOWERS[k], locked = T.unlock > unlockedLevels(), bc = E.buildCost(G, k);
      html += '<button class="card' + (locked ? ' locked' : '') + '" data-build="' + k + '" data-cost="' + bc + '"' + (locked ? ' disabled' : '') + '>' +
        (locked ? '<span class="lockic">' + ICON.lock + '</span><span class="cname">Level ' + T.unlock + '</span>' :
          '<canvas class="ficon" data-type="' + k + '"></canvas><span class="cname">' + T.name.split(' ')[0] + '</span><span class="cost' + (bc > T.cost ? ' up' : '') + '">' + ic('coin') + bc + '</span>') + '</button>';
    });
    html += '</div><div class="sheet-hint">Each extra copy of the same frog costs a bit more — mix your frogs!</div>';
    showSheet('build', html);
  }
  function openTowerSheet(t) {
    sel = { tower: t, pad: t.pad };
    var T = D.TOWERS[t.type], st = E.towerStats(t), nx = T.lv[t.lvl + 1], cost = E.upgradeCost(t);
    function stat(cur, n, label, fmt) { fmt = fmt || function (x) { return x; }; return '<span class="st"><i>' + label + '</i>' + fmt(cur) + (n != null && n !== cur ? ' <em>\u2192 ' + fmt(n) + '</em>' : '') + '</span>'; }
    var stats = T.eco ? stat(st.coins, nx && nx.coins, 'Coins') + stat(st.every, nx && nx.every, 'Every', function (x) { return x + 's'; })
      : stat(st.dmg, nx && nx.dmg, 'Damage') + stat(st.range, nx && nx.range, 'Range') + stat((1 / st.rate).toFixed(1), nx && (1 / nx.rate).toFixed(1), 'Speed') +
        (st.slow ? stat(Math.round(st.slow * 100) + '%', nx && Math.round(nx.slow * 100) + '%', 'Slow') : '') + (st.chain ? stat(st.chain, nx && nx.chain, 'Chain') : '') + (st.poison ? stat(st.poison, nx && nx.poison, 'Poison') : '');
    var html = '<div class="sheet-title"><canvas class="ficon sm" data-type="' + t.type + '"></canvas>' + T.name + ' <span class="lvl">Lv ' + (t.lvl + 1) + '</span><button class="x" data-act="close">\u2715</button></div>' +
      '<div class="stats">' + stats + '</div><div class="row">' +
      (cost != null ? '<button class="btn green" data-act="upgrade" data-cost="' + cost + '">Upgrade ' + ic('coin') + cost + '</button>' : '<button class="btn gold" disabled>Max level</button>') +
      '<button class="btn red" data-act="sell">Sell +' + E.sellValue(t) + '</button></div>';
    showSheet('tower', html);
  }
  function showSheet(kind, html) {
    var s = $('#sheet'); s.innerHTML = html; s.dataset.kind = kind; s.classList.add('open'); $('#bottom').classList.add('hide');
    s.querySelectorAll('canvas.ficon').forEach(function (c) { c.width = c.clientWidth * 2 || 96; c.height = c.clientHeight * 2 || 96; R.drawFrogIcon(c, c.dataset.type, save.hat); });
    refreshSheetAfford();
  }
  function refreshSheetAfford() {
    $('#sheet').querySelectorAll('[data-cost]').forEach(function (b) { if (!b.classList.contains('locked')) b.classList.toggle('poor', G.coins < +b.dataset.cost); });
  }
  $('#sheet').addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b || !G) return;
    if (b.dataset.act === 'close') return closeSheet();
    if (b.dataset.build) {
      if (G.coins < E.buildCost(G, b.dataset.build)) { toast('Not enough coins'); Sfx.play('leak'); return; }
      var t = E.build(G, sel.pad, b.dataset.build);
      if (t) { closeSheet(); if (!save.tut) { save.tut = true; persist(); coach('Great! Now tap <b>Start wave</b>. Tap bugs to swat them!', 4500); } }
    } else if (b.dataset.act === 'upgrade') {
      if (E.upgrade(G, sel.tower)) openTowerSheet(sel.tower); else { toast('Not enough coins'); }
    } else if (b.dataset.act === 'sell') { E.sell(G, sel.tower); closeSheet(); }
  });
  $('#sheet').addEventListener('pointerover', function (ev) {
    var b = ev.target.closest('[data-build]'); if (b && sel && sel.pad != null && !sel.tower) sel.preview = D.TOWERS[b.dataset.build].lv[0].range || 0;
  });

  $('#send').addEventListener('click', function () { Sfx.unlock(); if (E.sendWave(G)) { hideCoach(); closeSheet(); } });
  $('#chorus').addEventListener('click', function () { if (E.chorus(G)) { coach('<b>CROAK!</b> The whole pond sings!', 1500); } else toast('Chorus charges as you squash bugs'); });
  $('#h-speed').addEventListener('click', function () { speed = speed === 1 ? 2 : speed === 2 ? 3 : 1; updateHud(); });
  $('#h-pause').addEventListener('click', function () { openPause(); });

  // ---------- modals ----------
  var modalOpen = false;
  function modal(html, cls) {
    modalOpen = true; var m = $('#modal'); m.className = 'modal ' + (cls || ''); m.innerHTML = '<div class="panel">' + html + '</div>'; $('#modal-root').hidden = false;
    return m;
  }
  function closeModal() { modalOpen = false; $('#modal-root').hidden = true; $('#modal').innerHTML = ''; }
  function openPause() {
    paused = true;
    var m = modal('<h2>Paused</h2><button class="btn green big" data-a="resume">' + ic('play') + 'Resume</button><button class="btn blue" data-a="restart">Restart level</button><button class="btn blue" data-a="sound">' + (save.muted ? 'Sound: off' : 'Sound: on') + '</button><button class="btn blue" data-a="music">' + (save.music === false ? 'Music: off' : 'Music: on') + '</button><button class="btn red" data-a="quit">Quit to map</button>');
    m.onclick = function (ev) {
      var a = ev.target.closest('[data-a]'); if (!a) return; a = a.dataset.a;
      if (a === 'resume') { closeModal(); paused = false; }
      if (a === 'restart') { closeModal(); startLevel(G.level); }
      if (a === 'sound') { save.muted = !save.muted; Sfx.setMuted(save.muted); persist(); closeModal(); openPause(); }
      if (a === 'music') { save.music = save.music === false; Sfx.setMusic(save.music); persist(); closeModal(); openPause(); }
      if (a === 'quit') { closeModal(); paused = false; G = null; showMap(); }
    };
  }
  function fliesFor(level, stars, first) { var b = 15 + 8 * level + stars * 6; return first ? b : Math.ceil(b / 2); }
  function onWin() {
    var lv = G.level, prev = save.stars[lv] || 0, stars = G.stars, first = prev === 0, flies = fliesFor(lv, stars, first), pearls = 0;
    if (stars === 3 && prev < 3) pearls += 5;
    if (first && D.LEVELS[lv].boss) pearls += 20;
    save.stars[lv] = Math.max(prev, stars); save.flies += flies; save.pearls += pearls; save.stats.levelEnds++; persist();
    Sfx.play('win'); R.spawnParticles(W / 2, H * 0.35, 80, '#FFE14D', 400, 5, { up: 200, g: 500 });
    var st = ''; for (var i = 0; i < 3; i++) st += '<span class="bigstar ' + (i < stars ? 'on' : '') + '" style="animation-delay:' + (0.15 + i * 0.25) + 's">' + (i < stars ? ICON.star : ICON.starOff) + '</span>';
    var last = lv >= D.LEVELS.length - 1;
    var m = modal('<h2 class="win">' + (last ? 'Pond saved!' : 'Victory!') + '</h2><div class="stars">' + st + '</div>' +
      '<div class="reward">' + ic('fly') + '<b id="w-flies">+' + flies + '</b> flies' + (pearls ? ' &nbsp; ' + ic('pearl') + '<b>+' + pearls + '</b>' : '') + '</div>' +
      '<button class="btn gold" data-a="double">' + ic('play', 'tv') + 'Watch ad: double flies</button>' +
      (last ? '<p class="small">World 1 complete! World 2 \u201cMisty Marsh\u201d coming soon.</p>' : '<button class="btn green big" data-a="next">Next level</button>') +
      '<button class="btn blue" data-a="map">Map</button>', 'win');
    m.onclick = function (ev) {
      var a = ev.target.closest('[data-a]'); if (!a) return; var k = a.dataset.a;
      if (k === 'double') { a.disabled = true; Ads.showRewarded('double_flies').then(function (ok) { if (ok) { save.flies += flies; persist(); $('#w-flies').textContent = '+' + flies * 2; a.textContent = 'Doubled!'; Sfx.play('coin'); } else a.disabled = false; }); }
      if (k === 'next') afterLevel(function () { startLevel(lv + 1); });
      if (k === 'map') afterLevel(showMap);
    };
  }
  function onDead() {
    Sfx.play('lose');
    var canRevive = !G.revived;
    var m = modal('<h2 class="lose">The bugs got in!</h2><p>Wave ' + G.wave + ' of ' + G.waves.length + '</p>' +
      (canRevive ? '<button class="btn gold big" data-a="revive">' + ic('play', 'tv') + 'Watch ad: +5 ' + ic('heart') + ' & continue</button>' : '') +
      '<button class="btn green" data-a="retry">Try again</button><button class="btn blue" data-a="map">Map</button>' +
      '<p class="small">Tip: spend flies on <b>Upgrades</b> to get stronger.</p>', 'lose');
    m.onclick = function (ev) {
      var a = ev.target.closest('[data-a]'); if (!a) return; var k = a.dataset.a;
      if (k === 'revive') { a.disabled = true; Ads.showRewarded('revive').then(function (ok) { if (ok && E.revive(G)) { closeModal(); coach('Second chance! Bugs are dazed.', 2000); } else a.disabled = false; }); }
      if (k === 'retry') { save.stats.levelEnds++; persist(); var l = G.level; afterLevel(function () { startLevel(l); }); }
      if (k === 'map') { save.stats.levelEnds++; persist(); afterLevel(showMap); }
    };
  }
  function afterLevel(next) {
    closeModal();
    var now = Date.now() / 1000;
    if (Ads.shouldShowInterstitial(save.stats, now)) {
      save.stats.lastInterstitial = now; persist();
      Ads.showInterstitial('level_end').then(next);
    } else next();
  }

  // mock ad / purchase UI (browser + test mode only)
  Ads.setMockUi(function (kind, info) {
    if (kind !== 'purchase') Sfx.duck(true);
    return new Promise(function (resolve) {
      var root = $('#ad'), fast = window.__FAST_ADS;
      if (kind === 'purchase') {
        root.innerHTML = '<div class="adbox"><div class="adtag">TEST MODE \u00B7 no real payment</div><h3>' + info.name + '</h3><p>' + info.desc + '</p><p class="price">' + info.price + '</p><button class="btn green" data-r="1">Buy (simulated)</button><button class="btn blue" data-r="0">Cancel</button></div>';
        root.hidden = false;
        root.onclick = function (ev) { var b = ev.target.closest('[data-r]'); if (!b) return; root.hidden = true; resolve(b.dataset.r === '1'); };
        return;
      }
      var secs = fast ? 0.2 : kind === 'rewarded' ? 3 : 2;
      root.innerHTML = '<div class="adbox fake"><div class="adtag">Test ad \u00B7 ' + (kind === 'rewarded' ? 'reward after video' : 'interstitial') + '</div><div class="adart"><canvas class="ficon big" data-type="tongue"></canvas></div><h3>Your ad here</h3><p>Real ads (AdMob) appear in the store build.</p><div class="adcount" id="adcount">' + Math.ceil(secs) + '</div></div>';
      root.hidden = false; root.onclick = null;
      var c = root.querySelector('canvas'); c.width = 160; c.height = 160; R.drawFrogIcon(c, 'tongue', 'crown');
      var left = secs, iv = setInterval(function () {
        left -= 0.1; var el = $('#adcount'); if (el) el.textContent = Math.max(0, Math.ceil(left));
        if (left <= 0) { clearInterval(iv); root.hidden = true; Sfx.duck(false); resolve(true); }
      }, fast ? 20 : 100);
    });
  });

  // ---------- screens ----------
  var screen = 'title';
  function show(name) {
    screen = name; document.body.dataset.screen = name;
    ['title', 'map', 'upgrades', 'shop'].forEach(function (n) { $('#scr-' + n).hidden = n !== name; });
    var g = name === 'game'; $('#hud').hidden = !g; $('#bottom').hidden = !g; $('#sheet').hidden = !g; cv.style.visibility = g ? 'visible' : 'hidden';
    if (!g) { hideCoach(); closeSheet(); }
    $('#bg').hidden = g;
  }
  function wallet() { return '<div class="wallet"><span>' + ic('fly') + save.flies + '</span><span>' + ic('pearl') + save.pearls + '</span></div>'; }
  function showTitle() {
    var today = new Date().toISOString().slice(0, 10), daily = save.daily !== today;
    $('#scr-title').innerHTML = '<div class="logo"><h1>Lily<span>ward</span></h1><p class="tag">Frog Pond Defense</p></div>' +
      '<div class="menu"><button class="btn green huge" data-go="map">' + ic('play') + 'Play</button>' +
      '<div class="row"><button class="btn blue" data-go="upgrades">Upgrades</button><button class="btn pink" data-go="shop">Shop</button></div>' +
      (daily ? '<button class="btn gold" data-go="daily">' + ic('gift') + 'Daily gift</button>' : '') + '</div>' +
      '<div class="foot"><button class="iconbtn" data-go="sound" aria-label="Sound">' + (save.muted ? ICON.mute : ICON.sound) + '</button><button class="iconbtn' + (save.music === false ? ' off' : '') + '" data-go="music" aria-label="Music">' + ICON.note + '</button><span>\u00A9 2026 Jonidge \u00B7 jonidge@yahoo.com</span></div>';
    show('title'); drawIcons('#scr-title');
  }
  function showMap() {
    var un = unlockedLevels(), total = save.stars.reduce(function (a, b) { return a + (b || 0); }, 0);
    var nodes = '';
    D.LEVELS.forEach(function (L, i) {
      var locked = i >= un, s = save.stars[i] || 0, st = '';
      for (var k = 0; k < 3; k++) st += k < s ? ICON.star : ICON.starOff;
      nodes += '<button class="node ' + (locked ? 'locked' : '') + (L.boss ? ' boss' : '') + (i === un - 1 && !s ? ' current' : '') + '" data-level="' + i + '" style="--i:' + i + '"' + (locked ? ' disabled' : '') + '>' +
        '<span class="num">' + (locked ? ICON.lock : i + 1) + '</span><span class="ntext"><span class="nname">' + L.name + '</span><span class="nstars">' + st + '</span></span></button>';
    });
    $('#scr-map').innerHTML = '<div class="top"><button class="iconbtn" data-go="title">' + ICON.back + '</button><h2>Willow Pond</h2>' + wallet() + '</div>' +
      '<div class="worldinfo">' + ic('star') + total + ' / ' + D.LEVELS.length * 3 + '</div><div class="nodes">' + nodes + '</div>' +
      '<div class="row map-foot"><button class="btn blue" data-go="upgrades">Upgrades</button><button class="btn pink" data-go="shop">Shop</button></div>';
    show('map');
  }
  function showUpgrades() {
    var html = '<div class="top"><button class="iconbtn" data-go="back">' + ICON.back + '</button><h2>Pond Upgrades</h2>' + wallet() + '</div><div class="list">';
    Object.keys(D.UPGRADES).forEach(function (k) {
      var U = D.UPGRADES[k], lv = save.up[k] || 0, max = lv >= U.max, cost = U.cost[lv], pips = '';
      for (var i = 0; i < U.max; i++) pips += '<i class="' + (i < lv ? 'on' : '') + '"></i>';
      html += '<div class="item"><div class="info"><b>' + U.name + '</b><span>' + U.desc + '</span><div class="pips">' + pips + '</div></div>' +
        (max ? '<button class="btn gold" disabled>Max</button>' : '<button class="btn green' + (save.flies < cost ? ' poor' : '') + '" data-up="' + k + '">' + ic('fly') + cost + '</button>') + '</div>';
    });
    html += '</div><p class="small center">Earn flies by winning levels. Replays give half.</p>';
    $('#scr-upgrades').innerHTML = html; show('upgrades');
  }
  function showShop() {
    var html = '<div class="top"><button class="iconbtn" data-go="back">' + ICON.back + '</button><h2>Shop</h2>' + wallet() + '</div><div class="list">';
    var today = new Date().toISOString().slice(0, 10);
    ['daily_pearls', 'free_flies'].forEach(function (pl) {
      var L = window.MONETIZATION.rewardedLimits[pl], st = adState(pl);
      html += '<div class="item free"><div class="info"><b>' + (pl === 'daily_pearls' ? ic('pearl') + 'Free pearls' : ic('fly') + 'Free flies') + '</b><span>Watch a short video: +' + L.amount + ' ' + (pl === 'daily_pearls' ? 'pearls' : 'flies') + '</span>' +
        '<span class="left" data-left="' + pl + '">' + st.left + ' of ' + L.perDay + ' left today</span></div><button class="btn gold" data-shop="' + pl + '" data-wait="' + pl + '"' + (st.left && !st.wait ? '' : ' disabled') + '>' + adLabel(st) + '</button></div>';
    });
    IAP.products.forEach(function (p) {
      var owned = (p.sku === 'remove_ads' && save.removeAds) || (p.sku === 'starter_pack' && save.starter);
      html += '<div class="item ' + (p.sku === 'starter_pack' ? 'hot' : '') + '"><div class="info"><b>' + p.name + '</b><span>' + p.desc + '</span></div><button class="btn pink" data-iap="' + p.sku + '"' + (owned ? ' disabled' : '') + '>' + (owned ? 'Owned' : p.price) + '</button></div>';
    });
    html += '<h3 class="sec">Frog hats</h3><div class="hats">';
    Object.keys(D.HATS).forEach(function (k) {
      var h = D.HATS[k], own = !!save.hats[k], on = save.hat === k;
      var price = own ? (on ? 'Wearing' : 'Wear') : h.flies ? ic('fly') + h.flies : ic('pearl') + h.price;
      html += '<button class="hat ' + (on ? 'on' : '') + '" data-hat="' + k + '"><canvas class="ficon" data-type="tongue" data-hat="' + k + '"></canvas><span>' + h.name + '</span><em>' + price + '</em></button>';
    });
    html += '</div><button class="btn blue small" data-shop="restore">Restore purchases</button><p class="small center">Prototype: test mode, no real payments or ads.</p>';
    $('#scr-shop').innerHTML = html; show('shop'); drawIcons('#scr-shop');
  }
  function drawIcons(root) { document.querySelectorAll(root + ' canvas.ficon').forEach(function (c) { c.width = (c.clientWidth || 48) * 2; c.height = (c.clientHeight || 48) * 2; R.drawFrogIcon(c, c.dataset.type, c.dataset.hat || save.hat); }); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  /** rewarded-video budget per placement: N per local day + short cooldown */
  function adState(pl) {
    var L = window.MONETIZATION.rewardedLimits[pl]; save.ads = save.ads || {};
    var a = save.ads[pl]; if (!a || a.day !== today()) a = save.ads[pl] = { day: today(), count: 0, last: 0 };
    var wait = Math.max(0, Math.ceil((a.last + L.cooldownSec * 1000 - Date.now()) / 1000));
    return { left: Math.max(0, L.perDay - a.count), wait: wait };
  }
  function adLabel(st) { return !st.left ? 'Tomorrow' : st.wait ? 'Ready in ' + st.wait + 's' : ic('play', 'tv') + 'Watch'; }
  setInterval(function () {
    if (screen !== 'shop') return;
    document.querySelectorAll('[data-wait]').forEach(function (b) {
      var st = adState(b.dataset.wait), lbl = adLabel(st);
      if (b.dataset.lbl !== lbl) { b.dataset.lbl = lbl; b.innerHTML = lbl; b.disabled = !(st.left && !st.wait); }
    });
  }, 500);
  var backTo = 'map';
  document.body.addEventListener('click', function (ev) {
    Sfx.unlock();
    var b = ev.target.closest('[data-go],[data-level],[data-up],[data-iap],[data-hat],[data-shop]'); if (!b || b.disabled) return;
    Sfx.play('tap');
    var go = b.dataset.go;
    if (go === 'map') showMap();
    else if (go === 'title') showTitle();
    else if (go === 'upgrades') { backTo = screen; showUpgrades(); }
    else if (go === 'shop') { backTo = screen; showShop(); }
    else if (go === 'back') { if (backTo === 'title') showTitle(); else showMap(); }
    else if (go === 'sound') { save.muted = !save.muted; Sfx.setMuted(save.muted); persist(); showTitle(); }
    else if (go === 'music') { save.music = save.music === false; Sfx.setMusic(save.music); persist(); showTitle(); }
    else if (go === 'daily') { save.daily = new Date().toISOString().slice(0, 10); save.flies += 30; save.pearls += 3; persist(); toast('Daily gift: +30 flies, +3 pearls!'); Sfx.play('upgrade'); showTitle(); }
    else if (b.dataset.level != null) startLevel(+b.dataset.level);
    else if (b.dataset.up) {
      var k = b.dataset.up, U = D.UPGRADES[k], c = U.cost[save.up[k] || 0];
      if (save.flies < c) { toast('Need more flies \u2014 win levels!'); return; }
      save.flies -= c; save.up[k] = (save.up[k] || 0) + 1; persist(); Sfx.play('upgrade'); showUpgrades();
    } else if (b.dataset.iap) {
      IAP.purchase(b.dataset.iap).then(function (r) {
        if (!r.ok) return; var p = IAP.find(r.sku);
        if (p.sku === 'remove_ads') { save.removeAds = true; Ads.removed = true; }
        if (p.sku === 'starter_pack') { save.starter = true; save.hats.crown = 1; }
        save.pearls += p.pearls || 0; save.flies += p.flies || 0; persist(); toast('Thank you! ' + p.name + ' unlocked'); Sfx.play('win'); showShop();
      });
    } else if (b.dataset.hat) {
      var hk = b.dataset.hat, h = D.HATS[hk];
      if (!save.hats[hk]) {
        if (h.flies) { if (save.flies < h.flies) return toast('Need ' + h.flies + ' flies'); save.flies -= h.flies; }
        else { if (save.pearls < h.price) return toast('Need ' + h.price + ' pearls'); save.pearls -= h.price; }
        save.hats[hk] = 1; Sfx.play('upgrade');
      }
      save.hat = hk; R.hat = hk; persist(); showShop();
    } else if (b.dataset.shop === 'daily_pearls' || b.dataset.shop === 'free_flies') {
      var pl = b.dataset.shop, LIM = window.MONETIZATION.rewardedLimits[pl], st0 = adState(pl);
      if (!st0.left || st0.wait) return;
      b.disabled = true;
      Ads.showRewarded(pl).then(function (ok) {
        if (!ok) { showShop(); return; }
        var a = save.ads[pl]; a.count++; a.last = Date.now();
        if (pl === 'daily_pearls') save.pearls += LIM.amount; else save.flies += LIM.amount;
        persist(); toast('+' + LIM.amount + (pl === 'daily_pearls' ? ' pearls!' : ' flies!')); Sfx.play('coin'); showShop();
      });
    } else if (b.dataset.shop === 'restore') { IAP.restore().then(function () { toast('Purchases restored'); }); }
  });

  var toastT = null;
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 1800); }
  // mobile-safe audio unlock: the first touch/click/key anywhere starts the audio context (and music)
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach(function (evn) { document.addEventListener(evn, function () { Sfx.unlock(); }, { capture: true, passive: true }); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && G && screen === 'game' && !modalOpen) openPause(); });

  showTitle();
  // test hooks (harmless in production)
  window.__ll = {
    get state() { return G; }, get save() { return save; }, get screen() { return screen; },
    step: function (n) { for (var i = 0; i < n && G && G.status === 'play'; i++) E.step(G, 1 / 60); },
    start: startLevel, build: function (pi, type) { return E.build(G, pi, type); }
  };
})();
