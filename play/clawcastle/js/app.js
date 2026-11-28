/* Clawcastle app v2: screens, battle input, village, raids, dailies, shop. */
(function () {
  'use strict';
  var D = window.CCData, E = window.CCEngine, M = window.CCMeta, R = window.Render, Sfx = window.Sfx;
  var $ = function (q) { return document.querySelector(q); }, $$ = function (q) { return Array.prototype.slice.call(document.querySelectorAll(q)); };
  var save = M.load(), s = null, screen = 'title', prevScreen = 'title';
  var busy = false, drag = null, FAST = false, extraUsed = false, idleT = 0;
  var tutStep = 0, replay = null, pendingOpp = null, worldTab = 0;
  var vSel = null, vTool = null, vMoveFrom = null;
  var SCREENS = ['title', 'map', 'village', 'raid', 'shop', 'pass', 'cards', 'quests'];

  var bootEvents = M.tickDailies(save);
  M.save(save);

  function persist() { M.save(save); if (M.RaidAPI && M.RaidAPI.syncVillage) M.RaidAPI.syncVillage(save); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, FAST ? 0 : ms); }); }
  function toast(msg, ms) { var t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove('on'); }, ms || 2200); }
  function vibrate(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
  function fmt(n) { n = Math.round(n * 10) / 10; return String(n); }
  function walletHTML() {
    return '<span class="chip sand"><i class="ico-sand"></i><b class="w-sand">0</b></span>' +
      '<span class="chip pearls"><i class="ico-pearl"></i><b class="w-pearls">0</b></span>' +
      '<span class="chip gems"><i class="ico-gem"></i><b class="w-gems">0</b></span>';
  }
  $$('[data-wallet]').forEach(function (el) { el.innerHTML = walletHTML(); });
  function updateWallet() {
    $$('.w-sand').forEach(function (e) { e.textContent = save.sand; });
    $$('.w-pearls').forEach(function (e) { e.textContent = save.pearls; });
    $$('.w-gems').forEach(function (e) { e.textContent = save.gems || 0; });
    var need = M.xpFor(save.level), prev = save.level > 1 ? M.xpFor(save.level - 1) : 0;
    var pct = Math.max(0, Math.min(100, (save.xp - prev) / Math.max(1, need - prev) * 100));
    var chip = $('#t-player');
    if (chip) {
      var lg = M.league(save.trophies);
      var nm = save.name || 'Captain';
      chip.innerHTML = '<span class="lv">Lv ' + save.level + '</span><span class="who">' + nm + '</span><span class="xp"><i style="width:' + pct + '%"></i></span><span class="cups-mini">\uD83C\uDFC6 ' + (save.trophies || 0) + '</span>';
      chip.title = lg.name;
      chip.onclick = function () { openNamePicker(true); };
    }
  }

  function openNamePicker(force) {
    if (!force && save.name) return;
    var cur = save.name || '';
    var sugs = (M.NAME_SUGGESTIONS || []).map(function (n) {
      return '<button type="button" class="name-sug" data-nm="' + n + '">' + n + '</button>';
    }).join('');
    modal('<h2>Your captain name</h2><p class="info">Other captains will see this when they visit your beach.</p>' +
      '<input id="nm-in" maxlength="18" placeholder="e.g. Captain Shuck" value="' + cur.replace(/"/g, '&quot;') + '">' +
      '<div class="name-sugs">' + sugs + '</div>' +
      '<p class="err" id="nm-err" hidden></p>' +
      '<div class="btns"><button class="btn big orange" id="nm-ok">That\u2019s me</button>' +
      (save.name ? '<button class="btn small ghost" id="m-close">Cancel</button>' : '') + '</div>');
    var inp = $('#nm-in');
    if (inp) setTimeout(function () { inp.focus(); }, 50);
    $$('.name-sug').forEach(function (b) {
      b.onclick = function () { if (inp) inp.value = b.getAttribute('data-nm'); };
    });
    $('#nm-ok').onclick = function () {
      var err = M.setName(save, inp ? inp.value : '');
      if (err) { var e = $('#nm-err'); if (e) { e.hidden = false; e.textContent = err; } return; }
      persist(); closeModal(); updateWallet();
      if (M.RaidAPI && M.RaidAPI.syncVillage) M.RaidAPI.syncVillage(save, true);
      toast('Welcome, ' + save.name + '!');
    };
    if ($('#m-close')) $('#m-close').onclick = closeModal;
  }

  function show(name) {
    if (name === 'back') name = prevScreen === 'game' ? 'title' : prevScreen;
    if (name !== screen) prevScreen = screen;
    screen = name;
    SCREENS.forEach(function (n) { var el = $('#scr-' + n); if (el) el.hidden = n !== name; });
    $('#hud').hidden = name !== 'game';
    if (name !== 'game') { $('#coach').hidden = true; R.spotlight = null; }
    if (name === 'map') buildMap();
    if (name === 'village') buildVillage();
    if (name === 'raid') { buildRaid(); if (!save.name && M.RaidAPI && M.RaidAPI.mode === 'online') setTimeout(function () { openNamePicker(); }, 350); }
    if (name === 'shop') buildShop();
    if (name === 'pass') buildPass();
    if (name === 'cards') buildCards();
    if (name === 'quests') buildQuests();
    updateWallet();
  }
  document.addEventListener('click', function (e) {
    var go = e.target.closest('[data-go]'); if (!go) return;
    Sfx.play('click'); show(go.getAttribute('data-go'));
  });
  document.addEventListener('pointerdown', function () { Sfx.unlock(); }, { capture: true });
  function soundLabels() { $('#t-sound').textContent = 'Sound: ' + (save.sound ? 'on' : 'off'); $('#t-music').textContent = 'Music: ' + (save.music ? 'on' : 'off'); }
  $('#t-sound').onclick = function () { save.sound = !save.sound; Sfx.set('sound', save.sound); persist(); soundLabels(); };
  $('#t-music').onclick = function () { save.music = !save.music; Sfx.set('music', save.music); persist(); soundLabels(); };

  function modal(html, cls) { $('#modal').className = 'modal ' + (cls || ''); $('#modal').innerHTML = html; $('#modal-root').hidden = false; }
  function closeModal() { $('#modal-root').hidden = true; }
  function starsHtml(n) { var h = ''; for (var i = 0; i < 3; i++) h += '<span class="' + (i < n ? '' : 'off') + '">\u2605</span>'; return h; }

  // ---------- campaign map ----------
  function buildMap() {
    var tabs = $('#world-tabs');
    tabs.innerHTML = D.WORLDS.map(function (w, i) {
      var open = save.unlocked >= w.from;
      return '<button class="' + (i === worldTab ? 'on' : '') + '" data-w="' + i + '"' + (open ? '' : ' disabled') + '>' + w.name + (open ? '' : ' \uD83D\uDD12') + '</button>';
    }).join('');
    $$('#world-tabs button').forEach(function (b) { b.onclick = function () { worldTab = +b.getAttribute('data-w'); buildMap(); }; });
    var Wd = D.WORLDS[worldTab] || D.WORLDS[0];
    var from = Wd.from, to = Wd.to, n = to - from + 1;
    var inner = $('#map-inner'), gap = 112, H = n * gap + 140;
    inner.style.height = H + 'px';
    var pts = [], html = '';
    for (var i = from; i <= to; i++) {
      var L = D.LEVELS[i], k = i - from;
      var y = H - 90 - k * gap, x = 50 + Math.sin(k * 1.15) * 28;
      pts.push([x, y]);
      var locked = i > save.unlocked, st = save.stars[i] || 0, cur = i === save.unlocked;
      html += '<button class="node' + (cur ? ' cur' : '') + (i === to ? ' boss' : '') + '" data-level="' + i + '" style="left:' + x + '%;top:' + y + 'px"' + (locked ? ' disabled' : '') + ' aria-label="Raid ' + (i + 1) + '">' +
        (locked ? '<svg viewBox="0 0 24 24" width="28" height="28"><rect x="5" y="11" width="14" height="10" rx="2" fill="#888"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#888" stroke-width="2.5" fill="none"/></svg>' : (i + 1)) +
        ((cur || i === to || !locked) ? '<span class="nm">' + L.name + '</span>' : '') +
        (!locked ? '<span class="st">' + starsHtml(st) + '</span>' : '') + '</button>';
    }
    var W = Math.min(window.innerWidth, 480);
    var path = '<svg class="path" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><path d="' + pts.map(function (p, i) { return (i ? 'L' : 'M') + (p[0] / 100 * W) + ' ' + p[1]; }).join(' ') + '" stroke="rgba(255,255,255,.75)" stroke-width="10" stroke-dasharray="2 18" stroke-linecap="round" fill="none"/></svg>';
    inner.innerHTML = path + html;
    $$('.node').forEach(function (b) { b.onclick = function () { Sfx.play('click'); intro(+b.getAttribute('data-level')); }; });
    var cur = $('.node.cur') || $('.node:not([disabled])');
    var sc = $('#map-scroll');
    requestAnimationFrame(function () { if (cur) sc.scrollTop = Math.max(0, parseFloat(cur.style.top) - sc.clientHeight / 2); });
  }
  var NEWS = { pearl: ['Puffer', 'Pearls send Puffers that pop for a big blast.'], bomb: ['Pearl Bomb', 'Match in an L or T shape: a bomb hits three lanes.'], riptide: ['Riptide', 'Match 5 in a row: hits every lane and washes sand away.'] };
  function legendHtml(L) {
    var codes = {}; (L.lanes || []).forEach(function (l) { (l || '').split(/\s+/).forEach(function (t) { if (t) codes[t[0]] = 1; }); });
    return Object.keys(codes).sort(function (a, b) { return 'FWCKGT'.indexOf(a) - 'FWCKGT'.indexOf(b); }).map(function (c) {
      return '<div class="it' + (L.isNew === c ? ' new' : '') + '"><canvas width="108" height="108" data-b="' + D.BUILD[c].k + '"></canvas>' + D.BUILD[c].name + '</div>';
    }).join('');
  }
  function drawLegend() { $$('[data-b]').forEach(function (c) { var x = c.getContext('2d'); R.drawBuilding(x, c.getAttribute('data-b'), 54, c.getAttribute('data-b') === 'flag' ? 66 : 56, 84, 76, 0.5); }); }
  function intro(i) {
    var L = D.LEVELS[i], mv = L.moves + (save.up.harbour || 0), nw = NEWS[L.isNew];
    modal('<h2>Raid ' + (i + 1) + '</h2><p><b>' + L.name + '</b> &middot; ' + mv + ' moves</p>' +
      '<div class="legend">' + legendHtml(L) + '</div>' +
      (nw ? '<p class="tip"><b>New: ' + nw[0] + '!</b> ' + nw[1] + '</p>' : '') +
      '<p class="tip">' + L.tip + '</p>' +
      '<div class="btns"><button class="btn big orange" id="m-go">Raid!</button><button class="btn small ghost" id="m-close">Not now</button></div>');
    drawLegend();
    $('#m-go').onclick = function () { Sfx.play('click'); closeModal(); start(i); };
    $('#m-close').onclick = closeModal;
  }

  // ---------- village ----------
  var vCv = $('#village-canvas');
  function vResize() {
    var d = Math.min(2, window.devicePixelRatio || 1), w = vCv.clientWidth, h = vCv.clientHeight;
    if (!w || !h) return;
    if (vCv.width !== Math.round(w * d)) { vCv.width = Math.round(w * d); vCv.height = Math.round(h * d); }
    return { w: w, h: h, d: d };
  }
  function buildVillage() {
    vTool = vTool; vSel = vSel;
    var html = '';
    D.VBUILD.forEach(function (b) {
      if (b.unique) return;
      var locked = save.unlocked < b.unlock;
      html += '<button class="v-item' + (vTool === b.code ? ' on' : '') + '" data-tool="' + b.code + '"' + (locked ? ' disabled' : '') + '><canvas width="72" height="72" data-vb="' + b.code + '"></canvas>' + b.name + '<br>' + b.cost + ' Sand</button>';
    });
    D.DECOS.forEach(function (d) {
      html += '<button class="v-item' + (vTool === d.id ? ' on' : '') + '" data-tool="' + d.id + '"><canvas width="72" height="72" data-deco="' + d.id + '"></canvas>' + d.name + '<br>' + d.cost + ' ' + d.cur + '</button>';
    });
    $('#v-tray').innerHTML = html; vCv._artTray = 0;
    $$('#v-tray [data-vb]').forEach(function (c) {
      var x = c.getContext('2d'), k = D.BUILD[c.getAttribute('data-vb')].k;
      x.clearRect(0, 0, 72, 72);
      if (!R.drawArt(x, k, 36, 66, 48, 0.4, {})) R.drawBuilding(x, k, 36, 44, 56, 48, 0.4);
    });
    $$('#v-tray [data-deco]').forEach(function (c) {
      var x = c.getContext('2d'), id = c.getAttribute('data-deco');
      x.clearRect(0, 0, 72, 72);
      if (!R.drawArt(x, id, 36, 66, 50, 0.4, {})) R.drawDeco(x, id, 36, 40, 64);
    });
    $$('#v-tray [data-tool]').forEach(function (b) {
      b.onclick = function () { vTool = vTool === b.getAttribute('data-tool') ? null : b.getAttribute('data-tool'); vMoveFrom = null; buildVillage(); };
    });
    $('#v-hint').textContent = vMoveFrom ? 'Tap an empty plot to move it.' : vTool ? 'Tap an empty plot to place it.' : 'Tap a plot to build, or tap a building to upgrade, move or sell.';
    updateWallet();
  }
  var vCam = { x: 0, y: 0, z: 1 }, vDrag = null, vPtrs = {}, vPinch = null;
  function vClampCam() {
    var lim = 140;
    vCam.z = Math.max(0.85, Math.min(1.85, vCam.z));
    vCam.x = Math.max(-lim, Math.min(lim, vCam.x));
    vCam.y = Math.max(-lim, Math.min(lim, vCam.y));
  }
  vCv.addEventListener('pointerdown', function (e) {
    if (screen !== 'village') return;
    try { vCv.setPointerCapture(e.pointerId); } catch (err) {}
    vPtrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(vPtrs);
    if (ids.length >= 2) {
      var a = vPtrs[ids[0]], b = vPtrs[ids[1]];
      var dx = a.x - b.x, dy = a.y - b.y;
      vPinch = { d: Math.sqrt(dx * dx + dy * dy) || 1, z: vCam.z };
      vDrag = null;
      return;
    }
    vDrag = { x: e.clientX, y: e.clientY, cx: vCam.x, cy: vCam.y, moved: false };
  });
  vCv.addEventListener('pointermove', function (e) {
    if (screen !== 'village') return;
    if (vPtrs[e.pointerId]) vPtrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(vPtrs);
    if (vPinch && ids.length >= 2) {
      var a = vPtrs[ids[0]], b = vPtrs[ids[1]];
      var d = Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)) || 1;
      vCam.z = vPinch.z * (d / vPinch.d); vClampCam();
      return;
    }
    if (vDrag) {
      var dx = e.clientX - vDrag.x, dy = e.clientY - vDrag.y;
      if (Math.abs(dx) + Math.abs(dy) > 10) vDrag.moved = true;
      if (vDrag.moved) { vCam.x = vDrag.cx + dx / vCam.z; vCam.y = vDrag.cy + dy / vCam.z; vClampCam(); }
    }
  });
  vCv.addEventListener('pointercancel', function (e) { delete vPtrs[e.pointerId]; vDrag = null; vPinch = null; });
  vCv.addEventListener('wheel', function (e) {
    if (screen !== 'village') return;
    e.preventDefault();
    vCam.z *= e.deltaY > 0 ? 0.92 : 1.08; vClampCam();
  }, { passive: false });
  vCv.addEventListener('pointerup', function (e) {
    if (screen !== 'village') return;
    var doTap = vDrag && !vDrag.moved && !vPinch;
    delete vPtrs[e.pointerId];
    if (Object.keys(vPtrs).length < 2) vPinch = null;
    if (Object.keys(vPtrs).length === 0) vDrag = null;
    if (!doTap) return;
    var rect = vCv.getBoundingClientRect();
    var cell = R.villageCellAt(e.clientX - rect.left, e.clientY - rect.top);
    if (!cell) return;
    Sfx.play('click');
    if (vMoveFrom) {
      var err = M.move(save, vMoveFrom.r, vMoveFrom.c, cell.r, cell.c);
      if (err) toast(err); else { toast('Moved!'); persist(); }
      vMoveFrom = null; vSel = cell; buildVillage(); return;
    }
    var occ = M.vGet(save, cell.r, cell.c);
    if (vTool && !occ) {
      var err2 = M.place(save, cell.r, cell.c, vTool);
      if (err2) toast(err2); else { Sfx.play('coin'); persist(); }
      vSel = cell; buildVillage(); return;
    }
    vSel = cell;
    if (!occ) { toast('Pick a building in the tray, then tap this plot.'); return; }
    var title = occ.deco ? (D.DECOS.filter(function (d) { return d.id === occ.id; })[0] || { name: occ.id }).name : D.BUILD[occ.code].name + (occ.lv ? ' · Lv ' + occ.lv : '');
    var upBtn = (!occ.deco && occ.code) ? '<button class="btn small green" id="v-up">Upgrade</button>' : '';
    modal('<h2>' + title + '</h2><p class="info">' + (occ.deco ? 'Decoration. Looks pretty, does nothing in a raid.' : (M.vDef(occ.code) || { desc: '' }).desc) + '</p>' +
      '<div class="btns"><div class="row">' + upBtn + '<button class="btn small blue" id="v-move">Move</button></div>' +
      (occ.code === 'F' ? '' : '<button class="btn small ghost" id="v-sell">Sell for half</button>') +
      '<button class="btn small ghost" id="m-close">Close</button></div>');
    if ($('#v-up')) $('#v-up').onclick = function () { var e = M.upgradeBuilding(save, cell.r, cell.c); if (e) toast(e); else { Sfx.play('coin'); persist(); closeModal(); buildVillage(); } };
    $('#v-move').onclick = function () { vMoveFrom = cell; vTool = null; closeModal(); buildVillage(); toast('Tap an empty plot.'); };
    if ($('#v-sell')) $('#v-sell').onclick = function () { var e = M.sell(save, cell.r, cell.c); if (e) toast(e); else { persist(); closeModal(); buildVillage(); } };
    $('#m-close').onclick = closeModal;
  });

  // ---------- raid lobby ----------
  function timeLeft(ms) {
    ms = Math.max(0, ms); var m = Math.floor(ms / 60000), h = Math.floor(m / 60); m = m % 60;
    return h ? h + 'h ' + m + 'm' : m + 'm';
  }
  function miniVillage(cv, grid) {
    var x = cv.getContext('2d');
    x.clearRect(0, 0, cv.width, cv.height);
    R.drawVillage(x, grid, { W: cv.width, H: cv.height, t: 0.4, mini: true });
  }
  function buildRaid() {
    var now = Date.now();
    var lg = M.league(save.trophies);
    $('#r-cups').textContent = '\uD83C\uDFC6 ' + (save.trophies || 0);
    if ($('#r-league')) $('#r-league').textContent = lg.name;
    var sh = (save.shieldUntil || 0) > now ? 'Shield up for ' + timeLeft(save.shieldUntil - now) + '. Your village is safe.' : 'No shield. Other captains may raid you while you are away.';
    $('#r-shield').textContent = sh;
    function paintOpps(list) {
      $('#r-list').innerHTML = list.map(function (o, i) {
        var lg = M.league(o.trophies);
        return '<div class="opp" data-opp="' + i + '"><canvas width="168" height="112"></canvas><div><h3>' + o.name + '</h3><p>' + o.trophies + ' cups · ' + lg.name.replace(' League','') + '</p></div><button class="btn small orange" data-raid="' + i + '">Raid</button></div>';
      }).join('') || '<p class="shop-note">No beaches left today. Come back tomorrow, or tap New beaches.</p>';
      $$('#r-list canvas').forEach(function (c, i) { if (list[i] && list[i].grid) miniVillage(c, list[i].grid); });
      $$('[data-raid]').forEach(function (b) {
        b.onclick = function () { Sfx.play('click'); startPvp(list[+b.getAttribute('data-raid')]); };
      });
    }
    var list = M.listOpponents(save);
    paintOpps(list);
    if (M.RaidAPI && M.RaidAPI.opponents) {
      var paintOnline = function () {
        return M.RaidAPI.opponents(save).then(function (online) { if (online && online.length) paintOpps(online); });
      };
      if (M.RaidAPI.pullInbox) {
        M.RaidAPI.pullInbox(save).then(function (ev) {
          if (ev && ev.length) {
            persist();
            $('#r-log').innerHTML = (save.raidLog || []).length ? save.raidLog.map(function (r) { return logLine(r, 'def'); }).join('') : '<p class="shop-note">No one has raided you yet.</p>';
            bindLogButtons();
            if (ev.some(function (r) { return r.win; })) toast(ev.length === 1 ? ev[0].name + ' raided your village!' : ev.length + ' captains raided your village!');
          }
          return paintOnline();
        }).catch(function () { paintOnline(); });
      } else paintOnline().catch(function () {});
    }
    $('#r-refresh').onclick = function () { Sfx.play('click'); M.refreshOpponents(save); persist(); buildRaid(); };
    function logLine(r, kind) {
      var when = new Date(r.t).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
      if (kind === 'def') {
        return '<div class="log"><div><b>' + r.name + '</b> ' + (r.win ? 'raided you and stole ' + r.stolen + ' Sand' : 'tried to raid you and failed') + ' (' + (r.delta >= 0 ? '+' : '') + r.delta + ' cups)<br><span style="opacity:.7">' + when + '</span></div>' +
          '<button class="btn small ghost" data-watch="' + r.id + '">Watch</button>' +
          '<button class="btn small orange" data-rev="' + r.id + '">Revenge</button></div>';
      }
      return '<div class="log"><div>You ' + (r.win ? 'raided' : 'failed to raid') + ' <b>' + r.name + '</b> · ' + (r.trophies >= 0 ? '+' : '') + r.trophies + ' cups · +' + r.sand + ' Sand<br><span style="opacity:.7">' + when + '</span></div></div>';
    }
    $('#r-log').innerHTML = (save.raidLog || []).length ? save.raidLog.map(function (r) { return logLine(r, 'def'); }).join('') : '<p class="shop-note">No one has raided you yet.</p>';
    $('#r-atk').innerHTML = (save.attacks || []).length ? save.attacks.map(function (r) { return logLine(r, 'atk'); }).join('') : '<p class="shop-note">You have not raided anyone yet.</p>';
    bindLogButtons();
    function bindLogButtons() {
      $$('[data-watch]').forEach(function (b) { b.onclick = function () { watchReplay(b.getAttribute('data-watch')); }; });
      $$('[data-rev]').forEach(function (b) {
        b.onclick = function () {
          var rec = (save.raidLog || []).filter(function (r) { return r.id === b.getAttribute('data-rev'); })[0];
          if (!rec) return;
          Sfx.play('click');
          var pid = rec.playerId || rec.botId;
          if (pid && String(pid).indexOf('bot-') !== 0 && M.RaidAPI && M.RaidAPI.fetchVillage) {
            M.RaidAPI.fetchVillage(pid).then(function (opp) {
              if (opp && opp.grid) startPvp(opp, 'Revenge on ' + rec.name);
              else toast('That beach could not be found just now.');
            });
            return;
          }
          var seed = parseInt(String(rec.botId || '').replace('bot-', ''), 36) || 1;
          startPvp(M.genBot(seed, rec.trophies || save.trophies), 'Revenge on ' + rec.name);
        };
      });
    }
  }

  // ---------- shop / pass / cards / quests ----------
  function buildShop() {
    var ads = [
      { id: 'daily_gems', name: 'Daily Gems', desc: '+8 Gems for watching a preview video.', ok: !save.adsToday },
      { id: 'speed_chest', name: 'Ready the free chest', desc: 'Skip the wait on today\u2019s free chest.', ok: !M.chestReady(save) }
    ];
    $('#shop-ads').innerHTML = ads.map(function (a) {
      return '<div class="card"><h3>' + a.name + '</h3><p>' + a.desc + '</p><button class="btn small green" data-ad="' + a.id + '"' + (save.adsRemoved && false ? '' : '') + '>Watch preview</button></div>';
    }).join('');
    $$('[data-ad]').forEach(function (b) { b.onclick = function () { watchAd(b.getAttribute('data-ad')); }; });
    $('#shop-list').innerHTML = M.SHOP.map(function (p) {
      var owned = (save.bought || {})[p.sku];
      return '<div class="card"><h3>' + p.name + '</h3><p>' + p.desc + '</p><button class="btn small ' + (p.type === 'gem' ? 'blue' : 'ghost') + '" data-sku="' + p.sku + '"' + (owned && p.once ? ' disabled' : '') + '>' + (owned && p.once ? 'Owned' : p.price) + '</button></div>';
    }).join('');
    $$('[data-sku]').forEach(function (b) { b.onclick = function () { buySku(b.getAttribute('data-sku')); }; });
    updateWallet();
  }
  function watchAd(kind) {
    modal('<h2>Preview video</h2><p>This is a placeholder. In the app a short rewarded ad would play here. Nothing is charged, and no video is loaded.</p><div class="btns"><button class="btn green" id="ad-ok">Pretend I watched</button><button class="btn small ghost" id="m-close">Cancel</button></div>');
    $('#ad-ok').onclick = function () {
      closeModal();
      window.Ads.showRewarded(kind).then(function () {
        if (kind === 'daily_gems') { if (save.adsToday) { toast('Come back tomorrow.'); return; } save.adsToday = M.dayKey(); M.grant(save, { gems: 8 }, 'ad'); persist(); toast('+8 Gems (preview).'); updateWallet(); }
        else if (kind === 'speed_chest') { save.dailies.chestAt = Date.now() - 1; persist(); toast('Free chest is ready!'); }
        else if (kind === 'extra_moves') { /* handled by caller */ }
      });
    };
    $('#m-close').onclick = closeModal;
  }
  function buySku(sku) {
    var p = M.SHOP.filter(function (x) { return x.sku === sku; })[0];
    if (p && p.type === 'gem') {
      var r = M.buy(save, sku, false);
      if (r.err) toast(r.err); else { Sfx.play('coin'); persist(); toast('Bought ' + p.name + '!'); buildShop(); }
      return;
    }
    modal('<h2>' + p.name + '</h2><p>' + p.desc + '</p><p class="tip">Preview only. Nothing will be charged. If you confirm, the items are added to this save so we can test the shop.</p><div class="btns"><button class="btn orange" id="buy-ok">Preview purchase</button><button class="btn small ghost" id="m-close">Cancel</button></div>');
    $('#buy-ok').onclick = function () {
      var r = M.buy(save, sku, true);
      closeModal();
      if (r.err) toast(r.err); else { Sfx.play('coin'); persist(); toast('Preview: ' + p.name + ' added.'); buildShop(); updateWallet(); }
    };
    $('#m-close').onclick = closeModal;
  }
  function rewText(r) {
    if (!r) return '';
    var bits = [];
    if (r.sand) bits.push(r.sand + ' Sand');
    if (r.pearls) bits.push(r.pearls + ' Pearls');
    if (r.gems) bits.push(r.gems + ' Gems');
    if (r.chest) bits.push((D.CHESTS[r.chest] || { name: 'Chest' }).name);
    if (r.skin) bits.push('skin');
    if (r.hat) bits.push('hat');
    if (r.deco) bits.push('decoration');
    if (r.xp) bits.push(r.xp + ' XP');
    return bits.join(', ') || 'a surprise';
  }
  function buildPass() {
    var tier = M.passTier(save), acc = 0, next = D.PASS[tier] ? D.PASS[tier].xp : 0;
    for (var i = 0; i < tier; i++) acc += D.PASS[i].xp;
    var pct = next ? Math.min(100, (save.pass.xp - acc) / next * 100) : 100;
    $('#pass-status').textContent = (save.pass.premium ? 'Premium track unlocked (preview).' : 'Free track. Premium is a preview and is not charged.') + '  Points: ' + save.pass.xp;
    $('#pass-xpbar').style.width = pct + '%';
    $('#pass-track').innerHTML = D.PASS.map(function (row, i) {
      var freeOk = i < tier, premOk = i < tier && save.pass.premium;
      var fGot = save.pass.freeClaim.indexOf(i) >= 0, pGot = save.pass.premClaim.indexOf(i) >= 0;
      return '<div class="pass-row"><div class="n">' + (i + 1) + '</div>' +
        '<div class="pass-cell">Free<br>' + rewText(row.free) + (fGot ? '<button class="btn small ghost" disabled>Claimed</button>' : '<button class="btn small green" data-pf="' + i + '"' + (freeOk ? '' : ' disabled') + '>Claim</button>') + '</div>' +
        '<div class="pass-cell prem">Premium<br>' + rewText(row.prem) + (pGot ? '<button class="btn small ghost" disabled>Claimed</button>' : '<button class="btn small blue" data-pp="' + i + '"' + (premOk ? '' : ' disabled') + '>' + (save.pass.premium ? 'Claim' : 'Locked') + '</button>') + '</div></div>';
    }).join('');
    $$('[data-pf]').forEach(function (b) { b.onclick = function () { var r = M.claimPass(save, +b.getAttribute('data-pf'), 'free'); if (r.err) toast(r.err); else { Sfx.play('coin'); persist(); buildPass(); updateWallet(); } }; });
    $$('[data-pp]').forEach(function (b) { b.onclick = function () { var r = M.claimPass(save, +b.getAttribute('data-pp'), 'prem'); if (r.err) toast(r.err); else { Sfx.play('coin'); persist(); buildPass(); updateWallet(); } }; });
  }
  function buildCards() {
    $('#card-list').innerHTML = ['shieldcrab', 'lobster', 'eel', 'spinner', 'puffer'].map(function (id) {
      var c = save.cards[id], cost = M.cardUpgradeCost(save, id), def = D.TROOPS[id];
      var pips = ''; for (var i = 0; i < 5; i++) pips += '<i class="' + (i < c.lv ? 'on' : '') + '"></i>';
      var btn = cost ? '<button class="btn small green" data-card="' + id + '"' + (c.copies >= cost.copies && save.sand >= cost.sand ? '' : ' disabled') + '>Upgrade · ' + cost.copies + ' copies + ' + cost.sand + ' Sand</button>' : '<button class="btn small ghost" disabled>Maxed out</button>';
      return '<div class="card"><div class="row"><canvas width="96" height="96" data-tr="' + id + '"></canvas><div><h3>' + def.name + ' · Lv ' + c.lv + '</h3><div class="pips">' + pips + '</div><p>' + c.copies + ' copies</p></div></div><p>' + def.desc + ' +20% health and damage per level.</p>' + btn + '</div>';
    }).join('');
    $$('#card-list [data-tr]').forEach(function (c) { R.drawTroop(c.getContext('2d'), c.getAttribute('data-tr'), 48, 54, 70, 0.3, { brute: save.cards[c.getAttribute('data-tr')].lv >= 4, hat: save.cosmetics.hat }); });
    $$('[data-card]').forEach(function (b) { b.onclick = function () { if (M.upgradeCard(save, b.getAttribute('data-card'))) { Sfx.play('coin'); persist(); buildCards(); updateWallet(); toast('Troop upgraded!'); } }; });
    $('#meta-up').innerHTML = D.UPGRADES.filter(function (u) { return !D.TROOPS[u.id]; }).map(function (u) {
      var lv = save.up[u.id] || u.start, idx = lv - u.start, cost = u.cost[idx];
      var pips = ''; for (var i = u.start; i < u.max; i++) pips += '<i class="' + (i < lv ? 'on' : '') + '"></i>';
      var btn = cost == null ? '<button class="btn small ghost" disabled>Maxed out</button>' : '<button class="btn small ' + (u.cur === 'pearls' ? 'blue' : 'green') + '" data-mu="' + u.id + '"' + (save[u.cur] >= cost ? '' : ' disabled') + '>Upgrade · ' + cost + ' ' + u.cur + '</button>';
      return '<div class="card"><h3>' + u.name + '</h3><div class="pips">' + pips + '</div><p>' + u.desc + '</p>' + btn + '</div>';
    }).join('');
    $$('[data-mu]').forEach(function (b) { b.onclick = function () { if (M.upgradeMeta(save, b.getAttribute('data-mu'))) { Sfx.play('coin'); persist(); buildCards(); updateWallet(); } else toast('Cannot afford that.'); }; });
    updateWallet();
  }
  function buildQuests() {
    var st = save.dailies.streak || 1;
    $('#streak-row').innerHTML = D.STREAK.map(function (r, i) {
      var on = i === st - 1, claimed = save.dailies.claimed && on;
      return '<div class="streak-day' + (on ? ' on' : '') + (claimed ? ' claimed' : '') + '"><b>Day ' + (i + 1) + '</b><br>' + rewText(r) + '</div>';
    }).join('') + (save.dailies.claimed ? '' : '<button class="btn small orange" id="claim-streak">Claim today</button>');
    if ($('#claim-streak')) $('#claim-streak').onclick = function () { var g = M.claimStreak(save); if (g) { Sfx.play('coin'); persist(); showRew('Daily login, day ' + st, g); buildQuests(); } };
    $('#quest-list').innerHTML = (save.dailies.quests || []).map(function (q) {
      var btn = q.claimed ? '<button class="btn small ghost" disabled>Claimed</button>' : q.done ? '<button class="btn small green" data-cq="' + q.id + '">Claim</button>' : '<button class="btn small ghost" disabled>' + q.progress + ' / ' + q.target + '</button>';
      return '<div class="card"><h3>' + q.title + '</h3><p>' + rewText(q.reward) + '</p>' + btn + '</div>';
    }).join('');
    $$('[data-cq]').forEach(function (b) { b.onclick = function () { var g = M.claimQuest(save, b.getAttribute('data-cq')); if (g) { Sfx.play('quest'); persist(); showRew('Quest complete', g); buildQuests(); } }; });
    var ready = M.chestReady(save);
    var left = Math.max(0, (save.dailies.chestAt || 0) - Date.now());
    $('#free-chest').innerHTML = '<div class="card"><h3>Beach Chest</h3><p>' + (ready ? 'Ready to open!' : 'Ready in ' + timeLeft(left)) + '</p><button class="btn ' + (ready ? 'orange' : 'ghost') + '" id="free-open"' + (ready ? '' : ' disabled') + '>' + (ready ? 'Open' : 'Waiting') + '</button></div>';
    if ($('#free-open')) $('#free-open').onclick = function () { var c = M.collectFreeChest(save); if (c) { persist(); openChest(c.id); buildQuests(); } };
    updateWallet();
  }
  function showRew(title, g) {
    var bits = [];
    if (g.sand) bits.push('+' + g.sand + ' Sand');
    if (g.pearls) bits.push('+' + g.pearls + ' Pearls');
    if (g.gems) bits.push('+' + g.gems + ' Gems');
    if (g.copies && g.copies.length) bits.push(g.copies.length + ' card copies');
    if (g.chests && g.chests.length) bits.push('a chest');
    if (g.cosmetics && g.cosmetics.length) bits.push(g.cosmetics.join(', '));
    if (g.xp) bits.push('+' + g.xp + ' XP');
    toast(title + ': ' + (bits.join(', ') || 'Nice!') , 2800);
    updateWallet();
    if (g.levelUps && g.levelUps.length) showLevelUps(g.levelUps);
  }
  function showLevelUps(ups) {
    if (!ups || !ups.length) return;
    Sfx.play('levelup');
    var u = ups[0];
    modal('<h2>Level ' + u.level + '!</h2><p>Your crew is growing.</p><p class="tip">Bonus: ' + rewText(u.bonus) + '</p><div class="btns"><button class="btn orange" id="m-close">Hooray</button></div>');
    $('#m-close').onclick = function () { closeModal(); if (ups.length > 1) showLevelUps(ups.slice(1)); };
  }
  function openChest(id) {
    var got = M.openChest(save, id); if (!got) return;
    persist(); Sfx.play('chest');
    modal('<h2>' + (D.CHESTS[got.chest.type] || { name: 'Chest' }).name + '</h2><div class="chest-open">\uD83C\uDF81</div><p>' +
      (got.sand ? '+' + got.sand + ' Sand<br>' : '') +
      (got.pearls ? '+' + got.pearls + ' Pearls<br>' : '') +
      (got.gems ? '+' + got.gems + ' Gems<br>' : '') +
      (got.copies && got.copies.length ? got.copies.length + ' card copies' : '') + '</p>' +
      '<div class="btns"><button class="btn orange" id="m-close">Lovely</button></div>', 'win');
    $('#m-close').onclick = closeModal;
    updateWallet();
  }

  // ---------- game ----------
  var TUT = [
    { sp: 'board', text: 'Swipe two treasures to make a line of three. That is how every turn starts.' },
    { sp: 'lanes', text: 'A match sends a troop up that column. Watch your crabs walk up the lane!' },
    { sp: 'castle', text: 'Each building has a health bar. When it hits 0, it crumbles. Numbers on towers count down to a shot.' },
    { sp: 'flagbar', text: 'This bar is the Flag Tower\u2019s health. Drop it to zero to win the raid. Go on, Captain!' }
  ];
  function start(i, seed) {
    pendingOpp = null; replay = null;
    s = E.newState(i, save.up, seed == null ? (Date.now() & 0xffffff) : seed);
    afterStart(D.LEVELS[i] ? D.LEVELS[i].name : 'Raid', 'Raid ' + (i + 1));
    if (i === 0 && !save.seen.tutorial) { tutStep = 0; showTut(); } else { tutStep = 99; $('#coach').hidden = true; R.spotlight = null; }
  }
  function startPvp(opp, title) {
    pendingOpp = opp; replay = null;
    var moves = 20 + Math.min(6, opp.power || 1) + (save.up.harbour || 0);
    s = E.newStateSpec({ lanes: E.villageToLanes(opp.grid), moves: moves - (save.up.harbour || 0), up: save.up, seed: Date.now() & 0xffffff, mode: 'pvp', title: title || ('Raid ' + opp.name) });
    afterStart(s.title, 'PvP');
    $('#coach').hidden = true; R.spotlight = null; tutStep = 99;
  }
  function watchReplay(id) {
    var rec = (save.raidLog || []).filter(function (r) { return r.id === id; })[0];
    if (!rec || !rec.snap) { toast('Replay is missing.'); return; }
    replay = { moves: rec.moves || [], i: 0, rec: rec };
    s = E.newStateSpec({ lanes: E.villageToLanes(rec.snap), moves: 24, up: { shieldcrab: 2, lobster: 2, eel: 2, spinner: 2, puffer: 2 }, seed: rec.seed || 1, mode: 'replay', title: rec.name + ' raids you' });
    afterStart(s.title, 'Replay');
    $('#coach').hidden = true; R.spotlight = null;
    runReplay();
  }
  async function runReplay() {
    busy = true;
    await wait(800);
    while (replay && replay.i < replay.moves.length && s && s.status === 'play') {
      var m = replay.moves[replay.i++];
      await runMove(m[0], m[1], true);
    }
    busy = false;
    if (s && s.status === 'play') s.status = replay.rec.win ? 'won' : 'lost';
    await wait(600); result();
  }
  function afterStart(name, label) {
    R.reset(); busy = false; extraUsed = false; idleT = 0;
    show('game');
    hud(name, label);
    R.showBanner(label, name);
  }
  function showTut() {
    var step = TUT[tutStep]; if (!step) { $('#coach').hidden = true; R.spotlight = null; save.seen.tutorial = 1; persist(); return; }
    R.spotlight = step.sp;
    var c = $('#coach');
    c.style.top = 'auto'; c.style.bottom = 'calc(14px + env(safe-area-inset-bottom,0px))';
    c.innerHTML = '<span>' + step.text + '</span><button class="btn small blue" id="tut-next">' + (tutStep === TUT.length - 1 ? 'Let\u2019s raid!' : 'Next') + '</button>';
    c.hidden = false;
    $('#tut-next').onclick = function () { tutStep++; showTut(); };
  }
  function hud(name, label) {
    if (!s) return;
    $('#h-level').textContent = label || (s.mode === 'pvp' ? 'Raid' : 'Raid ' + ((s.level || 0) + 1));
    $('#h-name').textContent = name || s.title || (D.LEVELS[s.level] || { name: 'Raid' }).name;
    $('#h-moves').textContent = s.moves;
    $('#h-moves-chip').classList.toggle('low', s.moves <= 3 && s.status === 'play');
  }
  $('#h-pause').onclick = function () {
    if (!s) return; Sfx.play('click');
    modal('<h2>Paused</h2><div class="info"><p><b>How it works</b></p><p>Match 3 to send a troop up <b>that column</b>. Match 4 for a Brute. L/T shapes drop a Pearl Bomb, 5 in a row makes a Riptide.</p><p>Health bars sit under every crab and every building. The golden bar at the top is the <b>Flag Tower</b> — drop it to zero to win.</p><p>Numbers on enemy towers show how many turns until they fire. Tap a building to learn what it does.</p></div>' +
      '<div class="btns"><button class="btn green" id="p-resume">Resume</button><div class="row"><button class="btn small ghost" id="p-snd">Sound: ' + (save.sound ? 'on' : 'off') + '</button><button class="btn small ghost" id="p-mus">Music: ' + (save.music ? 'on' : 'off') + '</button></div><div class="row"><button class="btn small blue" id="p-restart">Restart</button><button class="btn small orange" id="p-map">Leave raid</button></div></div>');
    $('#p-resume').onclick = closeModal;
    $('#p-snd').onclick = function () { save.sound = !save.sound; Sfx.set('sound', save.sound); persist(); this.textContent = 'Sound: ' + (save.sound ? 'on' : 'off'); soundLabels(); };
    $('#p-mus').onclick = function () { save.music = !save.music; Sfx.set('music', save.music); persist(); this.textContent = 'Music: ' + (save.music ? 'on' : 'off'); soundLabels(); };
    $('#p-restart').onclick = function () { closeModal(); if (pendingOpp) startPvp(pendingOpp); else start(s.level); };
    $('#p-map').onclick = function () { closeModal(); s = null; show(pendingOpp ? 'raid' : 'map'); };
  };

  var cv = $('#game');
  function pt(e) { return { x: e.clientX, y: e.clientY }; }
  cv.addEventListener('pointerdown', function (e) {
    if (screen !== 'game' || !s || s.status !== 'play' || replay) return;
    var p = pt(e), cell = R.cellAt(p.x, p.y); idleT = 0; R.hint = null;
    if (!cell) {
      var st = R.structAt(s, p.x, p.y);
      if (st) { var d = D.BUILD[st.b.code]; toast(d.name + ' (' + Math.ceil(st.b.hp) + ' / ' + Math.ceil(st.b.max) + ' HP): ' + d.desc + (st.b.cd ? ' Fires in ' + st.b.t + ' turn' + (st.b.t === 1 ? '' : 's') + '.' : ''), 3600); }
      R.sel = null; R.lane = -1; return;
    }
    if (busy) return;
    if (R.sel && Math.abs(R.sel[0] - cell[0]) + Math.abs(R.sel[1] - cell[1]) === 1) { var a = R.sel; R.sel = null; attempt(a, cell); return; }
    R.sel = cell; R.lane = cell[1]; drag = { cell: cell, x: p.x, y: p.y };
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
  });
  cv.addEventListener('pointermove', function (e) {
    if (!drag || busy || replay) return;
    var p = pt(e), dx = p.x - drag.x, dy = p.y - drag.y, th = R.view.ts * 0.32;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < th) return;
    var b = Math.abs(dx) > Math.abs(dy) ? [drag.cell[0], drag.cell[1] + (dx > 0 ? 1 : -1)] : [drag.cell[0] + (dy > 0 ? 1 : -1), drag.cell[1]];
    var a = drag.cell; drag = null; R.sel = null;
    if (b[0] < 0 || b[1] < 0 || b[0] >= D.ROWS || b[1] >= D.COLS) { R.lane = -1; return; }
    attempt(a, b);
  });
  cv.addEventListener('pointerup', function () { drag = null; if (!R.sel) R.lane = -1; });
  cv.addEventListener('pointercancel', function () { drag = null; });

  function attempt(a, b) {
    if (busy || !s || s.status !== 'play' || replay) return;
    if (!E.validSwap(s, a, b)) {
      var why = !E.swappable(s, a) || !E.swappable(s, b);
      Sfx.play('bad'); R.lane = -1;
      if (why) { var x = s.grid[a[0]][a[1]], y = s.grid[b[0]][b[1]]; toast((x.lock || y.lock) ? 'Barnacles! Include that tile in a match to break it free.' : 'Sand clumps can\'t be moved. Match next to them to clear them.'); return; }
      busy = true; E.swap(s, a, b);
      wait(150).then(function () { E.swap(s, a, b); return wait(150); }).then(function () { busy = false; });
      return;
    }
    if (tutStep === 0 && !save.seen.tutorial) { tutStep = 1; showTut(); }
    runMove(a, b);
  }

  function structPos(id, lane) {
    var vs = R.svis[id];
    if (vs) return { x: R.laneX(vs.lane), y: vs.y };
    return { x: R.laneX(lane || 0), y: R.slotY(0) };
  }
  function troopPos(id) { var vt = R.tvis[id]; return vt ? { x: vt.x, y: vt.y } : null; }
  function fire(kind, from, to, dur, cb) { if (FAST) { cb(); return; } R.shoot(kind, from.x, from.y, to.x, to.y, dur, cb); }
  function waitProj() { return new Promise(function (res) { (function chk() { if (FAST || !R.proj.length) res(); else setTimeout(chk, 40); })(); }); }

  function hitFx(e) {
    var p = structPos(e.id, e.lane), vs = R.svis[e.id];
    if (vs) vs.flash = 0.25;
    R.float(p.x, p.y - 10, '-' + fmt(e.dmg), '#FFE36E', 22);
    Sfx.play('hit');
    if (e.k === 'flag' && R._hp) R._hp.pulse = 1;
    if (e.killed) {
      if (vs) vs.dead = true;
      R.burst(p.x, p.y, '#F2D497', 22, 1.3); R.burst(p.x, p.y, '#A67A3A', 8, 1);
      R.shake = Math.max(R.shake, e.k === 'flag' ? 18 : 9); Sfx.play('crumble'); vibrate(30);
      if (e.loot) { R.float(p.x, p.y - 30, '+' + e.loot + ' Sand', '#FFF3B0', 22); Sfx.play('coin'); }
      if (e.k === 'flag') { Sfx.play('flag'); R.flash = 0.6; }
    }
  }
  function spellFx(e) {
    if (e.type === 'spell' && e.k === 'bomb') {
      var p = { x: R.laneX(e.col), y: R.slotY(0) };
      R.ring(p.x, p.y, '#FFFFFF', 260); R.ring(p.x, p.y, '#B9A6FF', 180); R.burst(p.x, p.y, '#E4DBFF', 26, 1.5);
      R.shake = 14; Sfx.play('bomb'); R.showBanner('PEARL BOMB!', null, '#E4DBFF'); vibrate(40);
    } else if (e.type === 'spell' && e.k === 'riptide') {
      R.flash = 0.35; Sfx.play('riptide'); R.showBanner('RIPTIDE!', 'Every lane takes a hit', '#7FE7FF');
      for (var c = 0; c < D.COLS; c++) R.burst(R.laneX(c), R.view.bfTop, '#7FE7FF', 10, 1.2);
    } else if (e.type === 'wash') {
      e.cells.forEach(function (q) { var pp = R.cellXY(q.r, q.c); R.burst(pp.x, pp.y, '#9BE8FF', 6, 0.8); R.ghosts.push({ r: q.r, c: q.c, t: -1, life: 0.35, max: 0.35 }); });
    } else if (e.type === 'hit') hitFx(e);
  }

  async function runMove(a, b, fromReplay) {
    busy = true; R.sel = null; R.lane = -1; R.hint = null;
    if (!fromReplay && tutStep < 99 && tutStep !== 0) { /* keep coach until they dismiss */ }
    if (!fromReplay) { s.moveLog = s.moveLog || []; s.moveLog.push([a, b]); }
    E.swap(s, a, b); s.moves--; hud(); Sfx.play('swap');
    await wait(180);
    var combo = 0, hint = b;
    for (;;) {
      var st = E.resolveStep(s, hint, combo);
      if (!st) break;
      st.cleared.forEach(function (q) { var p = R.cellXY(q.r, q.c); R.ghosts.push({ r: q.r, c: q.c, t: q.t, life: 0.25, max: 0.25 }); R.burst(p.x, p.y, D.TILES[q.t].col, 6, 0.8); });
      st.sand.forEach(function (q) { var p = R.cellXY(q.r, q.c); R.ghosts.push({ r: q.r, c: q.c, t: -1, life: 0.3, max: 0.3 }); R.burst(p.x, p.y, '#D9AE66', 8, 0.9); });
      st.unlocked.forEach(function (q) { var p = R.cellXY(q.r, q.c); R.burst(p.x, p.y, '#B0BEC5', 10, 0.9); });
      Sfx.play('pop', combo);
      st.deploy.forEach(function (d) {
        var p = R.cellXY(d.fromRow, d.troop.lane);
        R.tvis[d.troop.id] = { x: p.x, y: p.y, hp: d.troop.hp, a: 1, seed: d.troop.id * 1.7, tr: d.troop, gone: 0 };
        if (d.troop.brute) R.float(p.x, p.y - 16, 'BRUTE ' + D.TROOPS[d.troop.k].name + '!', '#FFD23F', 20);
        Sfx.play(d.troop.brute ? 'brute' : 'deploy');
        if (tutStep === 1) { tutStep = 2; if (!save.seen.tutorial) showTut(); }
      });
      st.events.forEach(spellFx);
      if (st.events.some(function (e) { return e.type === 'hit'; }) && tutStep === 2) { tutStep = 3; if (!save.seen.tutorial) showTut(); }
      if (combo >= 1) { var cp = R.cellXY(3, 3); R.float(cp.x, cp.y, 'Combo x' + (combo + 1) + '!', '#FF8A2B', 26 + combo * 3); }
      await wait(260);
      E.gravity(s);
      await wait(270);
      hint = null; combo++;
      if (combo > 40) break;
    }
    s.stats.best = Math.max(s.stats.best, combo);
    if (s.status === 'play') await enemy(E.enemyTurn(s));
    while (s.status === 'play' && s.moves <= 0 && s.charge < E.FINAL_TICKS) {
      if (s.charge === 0) { R.showBanner('Final charge!', 'Your troops make a last push', '#FF8A2B'); await wait(900); }
      s.charge++; await enemy(E.enemyTurn(s));
    }
    if (s.status === 'play' && s.moves <= 0) s.status = 'lost';
    if (s.status === 'play' && !E.findMove(s)) { E.shuffle(s); R.vis = {}; toast('No moves left, reshuffling the beach!'); }
    hud();
    busy = false;
    if (!fromReplay && s.status !== 'play') { await wait(s.status === 'won' ? 900 : 500); result(); }
  }

  async function enemy(ev) {
    var marched = false;
    for (var i = 0; i < ev.length; i++) { if (ev[i].type === 'move' || ev[i].type === 'scuttle') { if (!marched) { Sfx.play('march'); marched = true; } } }
    if (marched) await wait(330);
    for (i = 0; i < ev.length; i++) {
      var e = ev[i];
      if (e.type === 'attack') { var vt = R.tvis[e.id]; if (vt) vt.lunge = 1; await wait(90); }
      else if (e.type === 'hit') hitFx(e);
      else if (e.type === 'pop') { var p = troopPos(e.id); if (p) { R.burst(p.x, p.y, '#FFD23F', 18, 1.2); R.ring(p.x, p.y, '#FFF3A6', 140); } Sfx.play('puff'); if (R.tvis[e.id]) R.tvis[e.id].dying = 'fade'; }
      else if (e.type === 'home') { if (R.tvis[e.id]) R.tvis[e.id].dying = 'home'; var ph = troopPos(e.id); if (ph) R.float(ph.x, ph.y - 20, 'Home!', '#BFF0FF', 13); }
    }
    if (s.status === 'won') return;
    var shots = ev.filter(function (x) { return ['shoot', 'lob', 'gull', 'glue'].indexOf(x.type) >= 0; });
    if (shots.length) await wait(200);
    for (i = 0; i < shots.length; i++) {
      (function (e) {
        var from = structPos(e.from, e.lane);
        if (e.type === 'shoot') {
          var ids = e.all || [e.to];
          var to = troopPos(ids[0]) || { x: R.laneX(e.lane), y: R.posY(1) };
          Sfx.play('cannon');
          fire(e.k === 'cat' ? 'coco' : 'ball', from, to, 0.42, function () {
            ids.forEach(function (id) {
              var vt2 = R.tvis[id], p = troopPos(id);
              if (vt2) { vt2.hurt = 0.4; var alive = s.troops.filter(function (t) { return t.id === id; })[0]; if (!alive) { vt2.hp = 0; vt2.dying = 'fade'; } }
              if (p) { R.float(p.x, p.y - 14, '-' + fmt(e.dmg), '#FF6B6B', 18); R.burst(p.x, p.y, e.k === 'cat' ? '#8D6E63' : '#455A64', 8, 0.8); }
            });
            Sfx.play('hit'); R.shake = Math.max(R.shake, 5);
          });
        } else if (e.type === 'lob' || e.type === 'gull') {
          if (e.type === 'gull') Sfx.play('click'); else Sfx.play('cannon');
          e.drops.forEach(function (d) {
            R.held[d.id] = 1; R.keep[d.old] = 1;
            var to2 = R.cellXY(d.r, d.c);
            fire(e.type === 'gull' ? 'gull' : 'sand', from, to2, e.type === 'gull' ? 0.6 : 0.5, function () {
              delete R.held[d.id]; delete R.keep[d.old];
              R.vis[d.id] = { x: d.c, y: d.r, vy: 0, sc: 0.3 };
              R.burst(to2.x, to2.y, '#D9AE66', 10, 0.9); Sfx.play('splat');
            });
          });
        } else if (e.type === 'glue') {
          Sfx.play('cannon');
          e.locks.forEach(function (d) {
            R.heldLock[d.id] = 1;
            var to3 = R.cellXY(d.r, d.c);
            fire('barn', from, to3, 0.5, function () { delete R.heldLock[d.id]; R.burst(to3.x, to3.y, '#B0BEC5', 10, 0.9); Sfx.play('splat'); });
          });
        }
      })(shots[i]);
      await wait(170);
    }
    await waitProj();
    await wait(120);
  }

  function result() {
    if (s.mode === 'replay') {
      var rec = replay && replay.rec;
      modal('<h2 class="' + ((rec && rec.win) ? 'lose' : '') + '">' + ((rec && rec.win) ? 'They toppled your flag' : 'You held the beach!') + '</h2><p>' + (rec && rec.win ? rec.name + ' stole ' + rec.stolen + ' Sand.' : 'Your defences stood firm.') + '</p><div class="btns"><button class="btn orange" id="r-map">Back to raids</button></div>');
      $('#r-map').onclick = function () { closeModal(); s = null; replay = null; show('raid'); };
      return;
    }
    if (s.status === 'won') {
      var stars = E.stars(s);
      var rew = pendingOpp ? M.pvpReward(save, s, stars, pendingOpp) : M.campaignReward(save, s, stars);
      persist(); Sfx.play('win');
      if (pendingOpp) {
        M.recordAttack(save, pendingOpp, s, rew);
        if (M.RaidAPI && M.RaidAPI.submitRaid) M.RaidAPI.submitRaid(save, pendingOpp, s, rew);
      }
      persist();
      var st = ''; for (var k = 0; k < 3; k++) st += '<span class="' + (k < stars ? 'on' : '') + '">\u2605</span>';
      var next = !pendingOpp && s.level + 1 < D.LEVELS.length;
      modal('<h2>Castle toppled!</h2><div class="stars">' + st + '</div><p>' + (s.charge ? 'Won in the final charge!' : s.moves + ' moves to spare') + ' &middot; ' + s.stats.troops + ' troops sent</p>' +
        '<div class="rewards"><span class="chip"><i class="ico-sand"></i>+' + rew.sand + '</span>' +
        (rew.pearls ? '<span class="chip"><i class="ico-pearl"></i>+' + rew.pearls + '</span>' : '') +
        (rew.trophies ? '<span class="chip cups">' + (rew.trophies > 0 ? '+' : '') + rew.trophies + ' cups</span>' : '') +
        (rew.xp ? '<span class="chip">+' + rew.xp + ' XP</span>' : '') + '</div>' +
        (rew.copies && rew.copies.length ? '<p>Card copies: ' + rew.copies.join(', ') + '</p>' : '') +
        (rew.chest ? '<p class="tip">You earned a ' + (D.CHESTS[rew.chest.type] || { name: 'chest' }).name + '!</p>' : '') +
        '<div class="btns">' + (rew.chest ? '<button class="btn big orange" id="r-chest">Open chest</button>' : '') +
        (next ? '<button class="btn ' + (rew.chest ? 'small' : 'big') + ' orange" id="r-next">Next raid</button>' : '') +
        '<div class="row"><button class="btn small blue" id="r-base">' + (pendingOpp ? 'Village' : 'Village') + '</button><button class="btn small green" id="r-again">Replay</button></div><button class="btn small ghost" id="r-map">Map</button></div>', 'win');
      if (rew.chest) $('#r-chest').onclick = function () { closeModal(); openChest(rew.chest.id); };
      if (next) $('#r-next').onclick = function () { closeModal(); intro(s.level + 1); };
      if (rew.levelUps && rew.levelUps.length) { /* show after they close chest or later */ }
    } else {
      Sfx.play('lose');
      var f = E.flag(s);
      if (pendingOpp) {
        var rew2 = M.pvpReward(save, s, 0, pendingOpp);
        M.recordAttack(save, pendingOpp, s, rew2);
        if (M.RaidAPI && M.RaidAPI.submitRaid) M.RaidAPI.submitRaid(save, pendingOpp, s, rew2);
        persist();
      }
      modal('<h2 class="lose">The tide turned...</h2><p>The Flag Tower held with <b>' + (f ? Math.ceil(f.hp) : 0) + ' HP</b> left.</p>' +
        '<p class="tip">Tip: send troops up the flag\u2019s column, take out cannons that cover it, and upgrade your army and village.</p>' +
        '<div class="btns">' + (extraUsed || pendingOpp ? '' : '<button class="btn green" id="r-extra">+3 moves (preview ad)</button>') +
        '<div class="row"><button class="btn small orange" id="r-again">Try again</button><button class="btn small blue" id="r-base">Village</button></div><button class="btn small ghost" id="r-map">Map</button></div>', 'lose');
      if ($('#r-extra')) $('#r-extra').onclick = function () {
        modal('<h2>Preview video</h2><p>A rewarded ad would play here in the app. Nothing is charged.</p><div class="btns"><button class="btn green" id="ad-ok">Pretend I watched</button><button class="btn small ghost" id="m-close">Cancel</button></div>');
        $('#ad-ok').onclick = function () { extraUsed = true; closeModal(); s.status = 'play'; s.moves += 3; s.charge = 0; hud(); toast('+3 moves! (Preview — a rewarded ad will go here in the app.)'); };
        $('#m-close').onclick = closeModal;
      };
    }
    if ($('#r-again')) $('#r-again').onclick = function () { closeModal(); if (pendingOpp) startPvp(pendingOpp); else start(s.level); };
    if ($('#r-base')) $('#r-base').onclick = function () { closeModal(); s = null; show('village'); };
    if ($('#r-map')) $('#r-map').onclick = function () { closeModal(); s = null; show(pendingOpp ? 'raid' : 'map'); };
    updateWallet();
  }

  // ---------- loop ----------
  var last = performance.now(), T = 0, bctx = vCv.getContext('2d');
  function loop(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
    if (screen === 'game' && s) {
      R.frame(s, T, dt);
      idleT += dt;
      if (idleT > 6 && !busy && s.status === 'play' && !R.hint && !replay) { R.hint = E.findMove(s); }
    } else {
      var ctx = cv.getContext('2d'), v = R.view, dpr = cv.width / Math.max(1, v.W);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R.drawScene(ctx, v.W, v.H, T, save.up, screen === 'title' ? { seaY: 0.12, castleY: 0.1, scale: 0.16 } : { seaY: 0.22, castleY: 0.17, scale: 0.1 });
      if (screen === 'village') {
        var sz = vResize();
        if (sz) {
          bctx.setTransform(sz.d, 0, 0, sz.d, 0, 0);
          R.drawVillage(bctx, save.village.grid, { W: sz.w, H: sz.h, t: T, sel: vSel, skin: save.cosmetics.skin || 'default', cam: vCam, placing: !!(vTool || vMoveFrom), moveFrom: vMoveFrom });
          if (R.hasArt('flag') && !vCv._artTray) {
            vCv._artTray = 1;
            $$('#v-tray [data-vb]').forEach(function (c) {
              var x = c.getContext('2d'), k = D.BUILD[c.getAttribute('data-vb')].k;
              x.clearRect(0, 0, 72, 72); R.drawArt(x, k, 36, 66, 48, 0.4, {});
            });
            $$('#v-tray [data-deco]').forEach(function (c) {
              var x = c.getContext('2d'), id = c.getAttribute('data-deco');
              x.clearRect(0, 0, 72, 72); R.drawArt(x, id, 36, 66, 50, 0.4, {});
            });
          }
        }
      }
    }
    requestAnimationFrame(loop);
  }
  window.addEventListener('resize', function () { R.resize(); R.vis = {}; if (screen === 'village') vResize(); });

  R.init(cv);
  Sfx.set('sound', save.sound); Sfx.set('music', save.music); soundLabels();
  show('title');
  if (M.RaidAPI && M.RaidAPI.connect) {
    M.RaidAPI.connect(save).then(function (res) {
      if (res && res.status && res.status.online) persist();
      var ev = res && res.inbox;
      if (ev && ev.length) {
        persist();
        var stole = ev.reduce(function (a, r) { return a + (r.stolen || 0); }, 0);
        toast((ev.length === 1 ? ev[0].name + ' raided your village!' : ev.length + ' captains raided your village!') + (stole ? ' They stole ' + stole + ' Sand.' : ''), 4000);
      }
    }).catch(function () {});
  }
  requestAnimationFrame(loop);
  if (document.fonts && document.fonts.load) document.fonts.load('20px "Lilita One"');

  // first-session welcome / streak
  if (bootEvents.login && !save.seen.welcome) {
    save.seen.welcome = 1; persist();
    setTimeout(function () {
      modal('<h2>Welcome to the beach!</h2><p>Match treasures at the bottom to send crabs up each lane and topple the Flag Tower. Between raids, build your own sandcastle village — and raid the beaches of other captains.</p><div class="btns"><button class="btn big orange" id="w-play">Start the first raid</button><button class="btn small ghost" id="m-close">I\u2019ll look around</button></div>');
      $('#w-play').onclick = function () { closeModal(); show('map'); intro(0); };
      $('#m-close').onclick = closeModal;
    }, 500);
  } else if (bootEvents.login && !save.dailies.claimed) {
    setTimeout(function () { show('quests'); }, 400);
  }
  if (bootEvents.incoming && bootEvents.incoming.length) {
    setTimeout(function () {
      var n = bootEvents.incoming.length, stole = bootEvents.incoming.reduce(function (a, r) { return a + (r.stolen || 0); }, 0);
      toast((n === 1 ? 'Someone raided your village!' : n + ' captains raided your village!') + (stole ? ' They stole ' + stole + ' Sand.' : ''), 4000);
    }, 900);
  }

  window.__cc = {
    get state() { return s; }, get screen() { return screen; }, get busy() { return busy; }, get save() { return save; },
    set fast(v) { FAST = !!v; }, E: E, M: M, start: start, startPvp: startPvp, show: show, intro: intro,
    openNamePicker: openNamePicker, setName: function (n) { var e = M.setName(save, n); if (!e) persist(); return e; },
    botMove: function () { if (!s || busy || s.status !== 'play') return false; var m = E.botMove(s); if (!m) return false; runMove(m[0], m[1]); return true; },
    attempt: attempt, openChest: openChest,
    reset: function () { save = M.defaults(); persist(); }
  };
})();
