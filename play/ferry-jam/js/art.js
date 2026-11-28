/* Ferry Jam v4 art: glossy pseudo-3D cars and ferries, harbor props, icons.
   All drawn in code (SVG). Shared gradients live in one hidden sprite. */
(function (root) {
  'use strict';

  var PALETTE = {
    red:    { body: '#F2393C', light: '#FF9A8E', dark: '#B4141E', side: '#7A0A12', roof: '#FF6159' },
    blue:   { body: '#2F86FF', light: '#9CCBFF', dark: '#1550C8', side: '#0C2F80', roof: '#5AA2FF' },
    yellow: { body: '#FFC81E', light: '#FFF29A', dark: '#D99500', side: '#8A5A00', roof: '#FFDA55' },
    green:  { body: '#22C065', light: '#96F2B6', dark: '#0E8A43', side: '#065327', roof: '#4AD884' },
    orange: { body: '#FF7A1A', light: '#FFC788', dark: '#CC4E00', side: '#833000', roof: '#FF9A48' }
  };
  var NAMES = Object.keys(PALETTE);
  function pal(c) { return PALETTE[c] || PALETTE.red; }

  /* ---------- shared gradient sprite ---------- */
  function lin(id, x1, y1, x2, y2, stops) {
    return '<linearGradient id="' + id + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') +
      '</linearGradient>';
  }
  function rad(id, stops, extra) {
    return '<radialGradient id="' + id + '" ' + (extra || '') + '>' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '" stop-opacity="' + (s[2] == null ? 1 : s[2]) + '"/>'; }).join('') +
      '</radialGradient>';
  }
  function spriteDefs() {
    var g = '';
    NAMES.forEach(function (c) {
      var p = PALETTE[c];
      g += lin('fj-bd-' + c, 0, 0, 1, 0, [[0, p.light], [0.2, p.body], [0.72, p.body], [1, p.dark]]);
      g += lin('fj-rf-' + c, 0, 0, 1, 1, [[0, p.light], [0.5, p.roof], [1, p.body]]);
      g += lin('fj-hull-' + c, 0, 0, 0, 1, [[0, p.light], [0.22, p.body], [1, p.dark]]);
      g += lin('fj-rim-' + c, 0, 0, 0, 1, [[0, p.light], [0.6, p.body], [1, p.dark]]);
    });
    g += lin('fj-glass', 0, 0, 0, 1, [[0, '#F4FCFF'], [0.35, '#A4DAF8'], [1, '#2E6AA8']]);
    g += lin('fj-deck', 0, 0, 0, 1, [[0, '#727A88'], [1, '#4A505E']]);
    g += lin('fj-cabin', 0, 0, 0, 1, [[0, '#FFFFFF'], [1, '#D6DEE8']]);
    g += lin('fj-roof', 0, 0, 0, 1, [[0, '#FBFCFD'], [1, '#C3CDD8']]);
    g += lin('fj-tire', 0, 0, 1, 0, [[0, '#454852'], [0.5, '#16181C'], [1, '#454852']]);
    g += lin('fj-steel', 0, 0, 0, 1, [[0, '#EEF2F6'], [1, '#97A3B0']]);
    g += lin('fj-wood', 0, 0, 0, 1, [[0, '#E9B171'], [1, '#B4763A']]);
    g += lin('fj-wood-dk', 0, 0, 1, 0, [[0, '#9A6634'], [0.5, '#6E4420'], [1, '#4E2E12']]);
    g += lin('fj-coin', 0, 0, 0, 1, [[0, '#FFF3A6'], [0.45, '#FFC928'], [1, '#DB8100']]);
    g += lin('fj-coin-rim', 0, 0, 0, 1, [[0, '#E8A000'], [1, '#9A5600']]);
    g += lin('fj-leaf', 0, 0, 0, 1, [[0, '#7BE05E'], [1, '#1A8536']]);
    g += lin('fj-leaf2', 0, 0, 0, 1, [[0, '#5BC94A'], [1, '#126B2A']]);
    g += lin('fj-trunk', 0, 0, 1, 0, [[0, '#D59A5C'], [1, '#7A4D22']]);
    g += lin('fj-rock', 0, 0, 0, 1, [[0, '#C9CED6'], [1, '#7C848F']]);
    g += lin('fj-cone', 0, 0, 1, 0, [[0, '#FFB06A'], [0.45, '#FF6A00'], [1, '#C24400']]);
    g += lin('fj-crate', 0, 0, 0, 1, [[0, '#E7B26B'], [1, '#A8702F']]);
    g += lin('fj-flame', 0, 1, 0, 0, [[0, '#FF3B1F'], [0.5, '#FF8A00'], [1, '#FFE45A']]);
    g += lin('fj-soil', 0, 0, 0, 1, [[0, '#8A5A2E'], [1, '#5E3B1A']]);
    g += rad('fj-glow', [[0, '#FFF6C0', 1], [1, '#FFF6C0', 0]]);
    g += rad('fj-shine', [[0, '#FFFFFF', 0.9], [1, '#FFFFFF', 0]]);
    return '<svg id="fj-sprite" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none" aria-hidden="true"><defs>' + g + '</defs></svg>';
  }
  if (typeof document !== 'undefined' && document.body && !document.getElementById('fj-sprite')) {
    document.body.insertAdjacentHTML('afterbegin', spriteDefs());
  }

  function rr(x, y, w, h, r, fill, op, extra) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="' + fill + '"' +
      (op != null ? ' opacity="' + op + '"' : '') + (extra || '') + '/>';
  }

  /* ---------- cars (drawn facing north, then rotated) ---------- */
  function kindOf(car) {
    if ((car.len || 1) >= 2) return 'bus';
    var n = 0, s = String(car.id || '');
    for (var i = 0; i < s.length; i++) n += s.charCodeAt(i);
    return (n % 2) ? 'sedan' : 'mini';
  }

  function smallCar(c, kind) {
    var p = pal(c);
    var H = kind === 'mini' ? 138 : 158;
    var R = kind === 'mini' ? 32 : 24;
    var ws = H * 0.27, we = H * 0.41, re = H * (kind === 'mini' ? 0.72 : 0.68);
    var s = '';
    [H * 0.19, H * 0.69].forEach(function (y) {
      s += rr(2, y, 17, H * 0.17, 7, 'url(#fj-tire)') + rr(81, y, 17, H * 0.17, 7, 'url(#fj-tire)');
    });
    s += '<rect x="9" y="4" width="82" height="' + (H - 8) + '" rx="' + R + '" fill="url(#fj-bd-' + c + ')" stroke="' + p.dark + '" stroke-width="2"/>';
    s += rr(19, 11, 62, ws - 14, 13, p.light, 0.32);
    s += '<ellipse cx="27" cy="11" rx="14" ry="9" fill="url(#fj-glow)"/><ellipse cx="73" cy="11" rx="14" ry="9" fill="url(#fj-glow)"/>';
    s += '<ellipse cx="27" cy="10" rx="8" ry="4.6" fill="#FFF9DA" stroke="' + p.dark + '" stroke-width=".8"/>' +
         '<ellipse cx="73" cy="10" rx="8" ry="4.6" fill="#FFF9DA" stroke="' + p.dark + '" stroke-width=".8"/>';
    s += rr(39, 5, 22, 5, 2.5, p.side, 0.55);
    s += '<path d="M20,' + ws + ' Q50,' + (ws - H * 0.05) + ' 80,' + ws + ' L74,' + we + ' L26,' + we + ' Z" fill="url(#fj-glass)" stroke="' + p.side + '" stroke-opacity=".45" stroke-width="1.2"/>';
    s += '<path d="M30,' + (ws + 1) + ' L45,' + (ws - 1) + ' L38,' + (we - 2) + ' L29,' + (we - 2) + ' Z" fill="#fff" opacity=".5"/>';
    s += rr(24, we, 52, re - we, 12, 'url(#fj-rf-' + c + ')');
    s += rr(30, we + 4, 9, re - we - 8, 4.5, '#fff', 0.42);
    s += rr(17, we + 1, 6, re - we - 2, 3, 'url(#fj-glass)') + rr(77, we + 1, 6, re - we - 2, 3, 'url(#fj-glass)');
    s += '<path d="M27,' + re + ' L73,' + re + ' L77,' + (H * 0.81) + ' Q50,' + (H * 0.845) + ' 23,' + (H * 0.81) + ' Z" fill="url(#fj-glass)" opacity=".92"/>';
    if (kind === 'sedan') s += rr(18, H * 0.86, 64, 5, 2.5, p.side, 0.45);
    s += rr(15, H - 13, 17, 6, 3, '#FF2D3A') + rr(68, H - 13, 17, 6, 3, '#FF2D3A');
    s += rr(1, ws + 1, 10, 11, 3.5, p.body, null, ' stroke="' + p.dark + '" stroke-width="1"') +
         rr(89, ws + 1, 10, 11, 3.5, p.body, null, ' stroke="' + p.dark + '" stroke-width="1"');
    s += '<path d="M15,' + (R + 6) + ' L15,' + (H - R - 6) + '" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".32"/>';
    return { w: 100, h: H, svg: s, sil: '<rect x="9" y="4" width="82" height="' + (H - 8) + '" rx="' + R + '"/>' };
  }

  function bus(c) {
    var p = pal(c);
    var H = 300, s = '';
    [44, 120, 236].forEach(function (y) {
      s += rr(1, y, 18, 32, 7, 'url(#fj-tire)') + rr(81, y, 18, 32, 7, 'url(#fj-tire)');
    });
    s += '<rect x="8" y="4" width="84" height="292" rx="20" fill="url(#fj-bd-' + c + ')" stroke="' + p.dark + '" stroke-width="2"/>';
    s += '<ellipse cx="26" cy="12" rx="15" ry="9" fill="url(#fj-glow)"/><ellipse cx="74" cy="12" rx="15" ry="9" fill="url(#fj-glow)"/>';
    s += rr(17, 7, 16, 7, 3.5, '#FFF9DA') + rr(67, 7, 16, 7, 3.5, '#FFF9DA');
    s += '<path d="M16,22 Q50,15 84,22 L80,50 L20,50 Z" fill="url(#fj-glass)" stroke="' + p.side + '" stroke-opacity=".45"/>';
    s += '<path d="M24,24 L40,21 L34,48 L22,48 Z" fill="#fff" opacity=".5"/>';
    s += rr(20, 52, 60, 230, 10, 'url(#fj-rf-' + c + ')');
    s += rr(27, 58, 9, 216, 4.5, '#fff', 0.36);
    for (var y = 62; y < 270; y += 34) {
      s += rr(11, y, 7, 26, 3, 'url(#fj-glass)') + rr(82, y, 7, 26, 3, 'url(#fj-glass)');
    }
    s += rr(36, 110, 28, 40, 5, p.dark, 0.35) + rr(40, 114, 20, 32, 4, p.light, 0.35);
    s += rr(36, 190, 28, 28, 5, p.dark, 0.3);
    s += rr(16, 284, 18, 7, 3, '#FF2D3A') + rr(66, 284, 18, 7, 3, '#FF2D3A');
    return { w: 100, h: H, svg: s, sil: '<rect x="8" y="4" width="84" height="292" rx="20"/>' };
  }

  function wrapCar(inner, dir, cls, color) {
    var p = pal(color);
    var rot = { N: 0, E: 90, S: 180, W: 270 }[dir] || 0;
    var horiz = dir === 'E' || dir === 'W';
    var ew = horiz ? inner.h : inner.w, eh = horiz ? inner.w : inner.h;
    var g = 'translate(' + ew / 2 + ',' + eh / 2 + ') rotate(' + rot + ') translate(' + (-inner.w / 2) + ',' + (-inner.h / 2) + ')';
    return '<svg class="' + (cls || 'car-svg') + '" viewBox="-6 -4 ' + (ew + 12) + ' ' + (eh + 18) + '" aria-hidden="true">' +
      '<g transform="translate(4,12)" fill="#06202C" opacity=".3"><g transform="' + g + '">' + inner.sil + '</g></g>' +
      '<g transform="translate(0,7)" fill="' + p.side + '"><g transform="' + g + '">' + inner.sil + '</g></g>' +
      '<g transform="' + g + '">' + inner.svg + '</g></svg>';
  }

  function carSVG(car, opts) {
    opts = opts || {};
    if (typeof car === 'string') car = { color: car, id: opts.id || 'x' };
    var kind = opts.kind || kindOf(car);
    var inner = kind === 'bus' ? bus(car.color) : smallCar(car.color, kind === 'bus' ? 'sedan' : kind);
    return wrapCar(inner, opts.dir || car.dir || 'N', opts.className, car.color);
  }

  /* ---------- ferry (3/4 view, bow right, ramp open toward the pier) ---------- */
  function ferrySlots(capacity) {
    var cap = Math.max(1, capacity || 1);
    var X0 = 108, X1 = 290, Y0 = 38, Y1 = 88, gap = 4;
    var rows = cap > 2 ? 2 : 1;
    var perRow = Math.ceil(cap / rows);
    var sw = (X1 - X0 - gap * (perRow - 1)) / perRow;
    var sh = (Y1 - Y0 - gap * (rows - 1)) / rows;
    var out = [];
    for (var i = 0; i < cap; i++) {
      var r = Math.floor(i / perRow), k = i % perRow;
      out.push({ x: (X0 + k * (sw + gap)) / 320 * 100, y: (Y0 + r * (sh + gap)) / 176 * 100, w: sw / 320 * 100, h: sh / 176 * 100 });
    }
    return out;
  }

  function ferrySVG(ferry, opts) {
    opts = opts || {};
    var c = PALETTE[ferry.color] ? ferry.color : 'red';
    var p = pal(c);
    var cap = ferry.capacity || 1;
    var bays = '';
    ferrySlots(cap).forEach(function (s, i) {
      var x = s.x / 100 * 320, y = s.y / 100 * 176, w = s.w / 100 * 320, h = s.h / 100 * 176;
      var filled = ferry.cargo && ferry.cargo[i];
      bays += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="' + (filled ? '#0000' : '#ffffff14') +
        '" stroke="#fff" stroke-width="1.6" stroke-dasharray="6 4" opacity=".75"/>';
    });
    var stripe = opts.stripe ? '<path d="M24,122 L296,122" stroke="' + p.light + '" stroke-width="4" opacity=".9"/>' : '';
    var ports = '';
    for (var x = 120; x <= 270; x += 26) ports += '<circle cx="' + x + '" cy="131" r="4.6" fill="#18314C" stroke="#fff" stroke-width="1.6"/>';
    return '<svg class="ferry-svg" viewBox="0 0 320 176" aria-hidden="true">' +
      '<ellipse cx="164" cy="160" rx="152" ry="13" fill="#033848" opacity=".33"/>' +
      /* hull side */
      '<path d="M16,92 L258,92 Q302,94 316,104 Q304,142 258,150 L44,150 Q18,150 13,124 Z" fill="url(#fj-hull-' + c + ')" stroke="' + p.dark + '" stroke-width="3"/>' +
      '<path d="M18,112 L304,112" stroke="#fff" stroke-width="7" opacity=".95"/>' + stripe + ports +
      '<path d="M30,146 Q90,152 150,148 T268,146" stroke="#fff" stroke-width="3" fill="none" opacity=".55"/>' +
      /* deck rim + deck */
      '<path d="M36,22 L250,22 Q298,24 318,62 Q298,98 250,100 L36,100 Q12,100 12,61 Q12,22 36,22 Z" fill="url(#fj-rim-' + c + ')" stroke="' + p.dark + '" stroke-width="3"/>' +
      '<path d="M42,32 L246,32 Q284,34 302,61 Q284,88 246,90 L42,90 Q24,90 24,61 Q24,32 42,32 Z" fill="url(#fj-deck)"/>' +
      '<path d="M104,61 L292,61" stroke="#FFD23F" stroke-width="2.4" stroke-dasharray="10 8" opacity=".85"/>' +
      bays +
      '<path d="M42,32 L246,32" stroke="#fff" stroke-width="1.5" opacity=".35"/>' +
      /* ramp lowered toward the pier */
      '<path d="M162,0 L238,0 L246,24 L154,24 Z" fill="url(#fj-steel)" stroke="#5A6572" stroke-width="2"/>' +
      '<path d="M170,5 L178,5 L174,20 L166,20 Z M190,5 L198,5 L194,20 L186,20 Z M210,5 L218,5 L214,20 L206,20 Z M230,5 L236,5 L234,20 L226,20Z" fill="#FFC81E"/>' +
      '<rect x="152" y="22" width="96" height="5" rx="2" fill="#3E4652"/>' +
      /* cabin at the stern */
      rr(14, 30, 84, 22, 8, 'url(#fj-roof)', null, ' stroke="#8D9AA8" stroke-width="1.5"') +
      rr(18, 50, 76, 44, 6, 'url(#fj-cabin)', null, ' stroke="#8D9AA8" stroke-width="1.5"') +
      rr(24, 57, 14, 14, 3, 'url(#fj-glass)') + rr(41, 57, 14, 14, 3, 'url(#fj-glass)') +
      rr(58, 57, 14, 14, 3, 'url(#fj-glass)') + rr(75, 57, 14, 14, 3, 'url(#fj-glass)') +
      rr(18, 78, 76, 8, 2, p.body) +
      '<path d="M26,58 L32,58 L28,70 L25,70 Z" fill="#fff" opacity=".55"/>' +
      /* funnel */
      rr(44, 4, 24, 36, 5, 'url(#fj-hull-' + c + ')', null, ' stroke="' + p.dark + '" stroke-width="1.6"') +
      rr(44, 14, 24, 6, 0, '#fff', 0.92) +
      '<ellipse cx="56" cy="5" rx="12" ry="4" fill="#24282E"/>' +
      /* life rings */
      '<circle cx="110" cy="27" r="6.5" fill="none" stroke="#fff" stroke-width="3.2"/>' +
      '<circle cx="110" cy="27" r="6.5" fill="none" stroke="#F2393C" stroke-width="3.2" stroke-dasharray="5 5.2"/>' +
      '<circle cx="110" cy="95" r="6.5" fill="none" stroke="#fff" stroke-width="3.2"/>' +
      '<circle cx="110" cy="95" r="6.5" fill="none" stroke="#F2393C" stroke-width="3.2" stroke-dasharray="5 5.2"/>' +
      '<circle cx="292" cy="61" r="5" fill="#C9D1DA" stroke="#5A6572" stroke-width="1.4"/>' +
      '</svg>';
  }

  /* ---------- currency + badges ---------- */
  function ticketSVG() {
    return '<svg class="ticket-svg coin-svg" viewBox="0 0 40 40" aria-hidden="true">' +
      '<ellipse cx="20" cy="23" rx="17" ry="16" fill="url(#fj-coin-rim)"/>' +
      '<circle cx="20" cy="19" r="17" fill="url(#fj-coin)" stroke="#B86A00" stroke-width="1.5"/>' +
      '<circle cx="20" cy="19" r="12" fill="none" stroke="#FFE680" stroke-width="2" opacity=".9"/>' +
      '<path d="M20 10.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L20 23.8 14.8 26.6l1-5.8-4.3-4.1 5.9-.8z" fill="#FFF3B0" stroke="#C47800" stroke-width="1.2"/>' +
      '<ellipse cx="13" cy="10" rx="5" ry="2.6" fill="#fff" opacity=".6" transform="rotate(-30 13 10)"/>' +
      '</svg>';
  }
  function coinStackSVG(n) {
    n = Math.max(1, Math.min(5, n || 1));
    var s = '<svg class="stack-svg" viewBox="0 0 120 96" aria-hidden="true"><ellipse cx="60" cy="88" rx="52" ry="7" fill="#000" opacity=".18"/>';
    var piles = [[60, 0]];
    if (n >= 2) piles = [[44, 0], [76, 1]];
    if (n >= 3) piles = [[30, 0], [60, 2], [90, 1]];
    if (n >= 4) piles = [[24, 1], [50, 3], [76, 2], [100, 0]];
    piles.forEach(function (pp) {
      var h = 2 + pp[1] + n;
      for (var i = 0; i < h; i++) {
        var y = 80 - i * 7;
        s += '<ellipse cx="' + pp[0] + '" cy="' + (y + 3) + '" rx="15" ry="6" fill="#B86A00"/>' +
             '<ellipse cx="' + pp[0] + '" cy="' + y + '" rx="15" ry="6" fill="url(#fj-coin)" stroke="#B86A00" stroke-width="1"/>';
      }
    });
    if (n >= 5) s += '<path d="M14 40 h92 v44 h-92z" fill="url(#fj-crate)" stroke="#7A4D22" stroke-width="2"/><path d="M10 26 q50-26 100 0 v16 h-100z" fill="#C0392B" stroke="#7A1E14" stroke-width="2"/><rect x="52" y="40" width="16" height="16" rx="3" fill="url(#fj-coin)"/>';
    s += '<circle cx="34" cy="20" r="3" fill="#fff" opacity=".9"/><circle cx="92" cy="30" r="2" fill="#fff" opacity=".8"/></svg>';
    return s;
  }
  function flameSVG() {
    return '<svg class="flame-svg" viewBox="0 0 40 48" aria-hidden="true">' +
      '<path d="M20 2 C24 12 34 16 34 30 C34 40 28 46 20 46 C12 46 6 40 6 30 C6 22 12 18 13 10 C16 16 18 18 19 18 C19 12 18 8 20 2 Z" fill="url(#fj-flame)" stroke="#B3200A" stroke-width="1.5"/>' +
      '<path d="M20 22 C22 28 27 30 27 36 C27 41 24 44 20 44 C16 44 13 41 13 36 C13 32 16 30 17 26 C18 28 19 29 20 29 Z" fill="#FFF1A0" opacity=".9"/></svg>';
  }
  function lockBadge() {
    return '<svg class="badge-svg" viewBox="0 0 32 32"><rect x="6" y="14" width="20" height="14" rx="3" fill="url(#fj-coin)" stroke="#8A5600" stroke-width="1.5"/><path d="M10 14 V11 a6 6 0 0 1 12 0 v3" fill="none" stroke="#8A5600" stroke-width="2.6"/><circle cx="16" cy="21" r="2.2" fill="#8A5600"/></svg>';
  }
  function keyBadge() {
    return '<svg class="badge-svg" viewBox="0 0 32 32"><circle cx="11" cy="16" r="6.5" fill="url(#fj-coin)" stroke="#8A5600" stroke-width="1.6"/><circle cx="11" cy="16" r="2.2" fill="#fff"/><rect x="16" y="14.2" width="12" height="3.8" rx="1" fill="url(#fj-coin)" stroke="#8A5600"/><rect x="23" y="17.6" width="2.2" height="4.4" fill="#E7A400"/><rect x="26.4" y="17.6" width="2.2" height="3.4" fill="#E7A400"/></svg>';
  }

  /* ---------- harbor props ---------- */
  function crateSVG() {
    return '<svg class="crate-svg" viewBox="0 0 60 64" aria-hidden="true">' +
      '<ellipse cx="32" cy="58" rx="26" ry="5" fill="#000" opacity=".28"/>' +
      '<path d="M6 18 L30 8 L54 18 L30 28 Z" fill="#F0C27E" stroke="#8A5A2B" stroke-width="2"/>' +
      '<path d="M6 18 L30 28 L30 58 L6 48 Z" fill="url(#fj-crate)" stroke="#8A5A2B" stroke-width="2"/>' +
      '<path d="M54 18 L30 28 L30 58 L54 48 Z" fill="#A8702F" stroke="#8A5A2B" stroke-width="2"/>' +
      '<path d="M8 22 L28 52 M28 30 L8 46 M52 22 L32 52 M32 30 L52 46" stroke="#7A4D22" stroke-width="2.4" opacity=".8"/></svg>';
  }
  function coneSVG() {
    return '<svg class="cone-svg" viewBox="0 0 40 52" aria-hidden="true">' +
      '<ellipse cx="21" cy="47" rx="17" ry="4.5" fill="#000" opacity=".25"/>' +
      '<rect x="4" y="40" width="32" height="7" rx="2" fill="#E05300"/>' +
      '<path d="M15 4 Q20 1 25 4 L33 41 L7 41 Z" fill="url(#fj-cone)"/>' +
      '<path d="M12.5 18 L27.5 18 L29.4 27 L10.6 27 Z" fill="#fff"/>' +
      '<path d="M17 6 L14 38" stroke="#fff" stroke-width="2" opacity=".35"/></svg>';
  }
  function palmSVG(flip) {
    var leaf = function (d, f) { return '<path d="' + d + '" fill="url(#' + (f || 'fj-leaf') + ')" stroke="#0E5A22" stroke-width="1.2"/>'; };
    return '<svg class="palm-svg" viewBox="0 0 120 150" aria-hidden="true"' + (flip ? ' style="transform:scaleX(-1)"' : '') + '>' +
      '<ellipse cx="62" cy="144" rx="30" ry="6" fill="#000" opacity=".22"/>' +
      '<path d="M56 144 C58 110 52 80 62 46 L70 47 C62 82 68 112 68 144 Z" fill="url(#fj-trunk)" stroke="#5E3B1A" stroke-width="1.4"/>' +
      '<path d="M57 130 h11 M56 116 h11 M56 102 h11 M57 88 h11 M58 74 h10 M60 60 h9" stroke="#6E4420" stroke-width="2" opacity=".6"/>' +
      leaf('M66 46 C46 30 20 34 4 52 C24 44 44 46 64 52 Z', 'fj-leaf2') +
      leaf('M66 46 C86 28 108 32 118 54 C100 44 84 46 68 52 Z', 'fj-leaf2') +
      leaf('M66 44 C50 18 28 10 12 16 C34 22 50 32 62 48 Z') +
      leaf('M66 44 C80 16 100 8 116 18 C96 22 82 32 70 48 Z') +
      leaf('M66 44 C62 22 70 6 82 2 C76 16 74 30 70 46 Z') +
      leaf('M66 46 C44 50 30 66 30 82 C40 66 52 58 66 52 Z', 'fj-leaf2') +
      leaf('M66 46 C88 52 98 68 96 84 C88 68 78 60 66 52 Z', 'fj-leaf2') +
      '<circle cx="62" cy="50" r="5" fill="#7A4D22"/><circle cx="71" cy="52" r="5" fill="#8A5A2B"/><circle cx="66" cy="56" r="4.5" fill="#6E4420"/>' +
      '</svg>';
  }
  function treeSVG() { return palmSVG(false); }
  function flowerBedSVG() {
    var fl = '';
    var spots = [[18, 22, '#FF5C9A'], [34, 16, '#FFD23F'], [52, 22, '#FF5C9A'], [70, 15, '#FFFFFF'], [86, 22, '#FF8A3D'], [28, 30, '#FFFFFF'], [62, 30, '#FFD23F'], [80, 30, '#FF5C9A']];
    spots.forEach(function (s) {
      fl += '<circle cx="' + s[0] + '" cy="' + s[1] + '" r="4.2" fill="' + s[2] + '"/><circle cx="' + s[0] + '" cy="' + s[1] + '" r="1.6" fill="#FFE45A"/>';
    });
    return '<svg class="bed-svg" viewBox="0 0 104 54" aria-hidden="true">' +
      '<ellipse cx="52" cy="48" rx="50" ry="6" fill="#000" opacity=".2"/>' +
      '<path d="M4 30 Q4 18 16 16 L88 16 Q100 18 100 30 L100 40 Q100 48 88 48 L16 48 Q4 48 4 40 Z" fill="#B9B2A4" stroke="#7E776A" stroke-width="2"/>' +
      '<path d="M10 30 Q10 22 18 22 L86 22 Q94 22 94 30 L94 36 L10 36 Z" fill="url(#fj-soil)"/>' +
      '<path d="M8 32 Q14 6 30 18 Q38 4 52 16 Q64 2 76 16 Q90 6 96 32 Z" fill="url(#fj-leaf)" stroke="#0E5A22" stroke-width="1"/>' +
      fl + '</svg>';
  }
  function rockSVG() {
    return '<svg class="rock-svg" viewBox="0 0 70 44" aria-hidden="true">' +
      '<ellipse cx="36" cy="40" rx="32" ry="4.5" fill="#000" opacity=".22"/>' +
      '<path d="M6 38 Q2 22 16 16 Q24 6 38 10 Q56 8 64 24 Q68 36 60 39 Z" fill="url(#fj-rock)" stroke="#5E6670" stroke-width="1.6"/>' +
      '<path d="M18 18 Q26 12 36 14" stroke="#fff" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>' +
      '<path d="M44 38 Q46 28 58 30" stroke="#5E6670" stroke-width="1.4" fill="none" opacity=".7"/></svg>';
  }
  function bollardSVG() {
    return '<svg class="bollard-svg" viewBox="0 0 30 50" aria-hidden="true">' +
      '<rect x="5" y="8" width="20" height="40" rx="3" fill="url(#fj-wood-dk)"/>' +
      '<ellipse cx="15" cy="8" rx="10" ry="4" fill="#B07A44" stroke="#4E2E12" stroke-width="1.2"/>' +
      '<path d="M5 20 Q15 24 25 20" stroke="#E8D4A8" stroke-width="2.4" fill="none"/></svg>';
  }
  function gateSVG() {
    return '<svg class="gate-svg" viewBox="0 0 80 80" aria-hidden="true">' +
      '<ellipse cx="40" cy="70" rx="34" ry="6" fill="#000" opacity=".25"/>' +
      '<rect x="6" y="20" width="10" height="50" rx="3" fill="url(#fj-steel)" stroke="#5A6572"/>' +
      '<rect x="64" y="20" width="10" height="50" rx="3" fill="url(#fj-steel)" stroke="#5A6572"/>' +
      '<rect x="8" y="28" width="64" height="16" rx="4" fill="#F2393C" stroke="#8A0E16" stroke-width="2"/>' +
      '<path d="M18 28 l-8 16 M34 28 l-8 16 M50 28 l-8 16 M66 28 l-8 16" stroke="#fff" stroke-width="6"/>' +
      '<rect x="8" y="28" width="64" height="16" rx="4" fill="none" stroke="#8A0E16" stroke-width="2"/>' +
      '<circle cx="11" cy="18" r="5" fill="#FFD23F" stroke="#8A5600"/></svg>';
  }
  function handSVG() {
    return '<svg class="hand-svg" viewBox="0 0 80 90" aria-hidden="true">' +
      '<path d="M28 38 V16 a6 6 0 0 1 12 0 V38" fill="#FFE2C0" stroke="#B5794A" stroke-width="2"/>' +
      '<path d="M40 36 V30 a6 6 0 0 1 12 0 V38" fill="#FFE2C0" stroke="#B5794A" stroke-width="2"/>' +
      '<path d="M52 38 V32 a6 6 0 0 1 12 0 V44" fill="#FFE2C0" stroke="#B5794A" stroke-width="2"/>' +
      '<path d="M18 44 h46 c8 0 14 6 14 14 v8 c0 14-12 22-26 22 h-16 c-16 0-28-8-30-22 v-8 c0-8 6-14 12-14z" fill="#FFE2C0" stroke="#B5794A" stroke-width="2"/>' +
      '<path d="M30 20 a4 4 0 0 1 8 0" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/></svg>';
  }

  function logoSVG() {
    var f = { color: 'red', capacity: 3, cargo: [] };
    var car = function (x, y, col) {
      return carSVG({ color: col, id: 'logo' + x }, { dir: 'E', kind: 'sedan' }).replace('<svg ', '<svg x="' + x + '" y="' + y + '" width="58" height="36" ');
    };
    return '<svg class="logo-mark" viewBox="0 0 320 190" aria-hidden="true">' +
      ferrySVG(f).replace('<svg ', '<svg x="0" y="6" width="320" height="176" ') +
      car(112, 38, 'red') + car(170, 38, 'red') + car(228, 38, 'red') +
      '</svg>';
  }

  /* ---------- icons ---------- */
  function icon(name, color) {
    var c = color || 'currentColor';
    var icons = {
      back: '<path d="M15 5l-8 7 8 7" fill="none" stroke="' + c + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
      undo: '<path d="M8 9 H15 a5 5 0 1 1 0 10 H10" fill="none" stroke="' + c + '" stroke-width="3" stroke-linecap="round"/><path d="M11 4 L6 9 L11 14" fill="none" stroke="' + c + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
      restart: '<path d="M19 12a7 7 0 1 1-2-5" fill="none" stroke="' + c + '" stroke-width="2.8" stroke-linecap="round"/><path d="M18 3v5h-5" fill="none" stroke="' + c + '" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>',
      hint: '<path d="M12 2.5a6.5 6.5 0 0 0-3.6 11.9c.6.8.9 1.5 1 2.6h5.2c.1-1.1.4-1.8 1-2.6A6.5 6.5 0 0 0 12 2.5z" fill="#FFE45A" stroke="#B37A00" stroke-width="1.4"/><path d="M9.8 19h4.4M10.4 21.3h3.2" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><path d="M9.5 6.5a3.5 3.5 0 0 1 3-1.5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
      dock: '<path d="M4 20 V8 M20 20 V8" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round"/><path d="M7.5 12.5 l1.3-3.2 h6.4 l1.3 3.2 v4.5 h-9z" fill="none" stroke="' + c + '" stroke-width="2" stroke-linejoin="round"/><circle cx="9.5" cy="17" r="1.3" fill="' + c + '"/><circle cx="14.5" cy="17" r="1.3" fill="' + c + '"/>',
      lock: '<rect x="6" y="11" width="12" height="9" rx="2" fill="#8A97A3" stroke="#3E4A52" stroke-width="1.3"/><path d="M8.5 11 V8 a3.5 3.5 0 0 1 7 0v3" fill="none" stroke="#3E4A52" stroke-width="1.8" stroke-linecap="round"/>',
      play: '<path d="M8 4.5l12 7.5-12 7.5z" fill="' + c + '" stroke="' + c + '" stroke-width="1.5" stroke-linejoin="round"/>',
      shop: '<path d="M4.5 8.5h15l-1.3 11H5.8z" fill="none" stroke="' + c + '" stroke-width="2.2" stroke-linejoin="round"/><path d="M8.5 8.5 V6.5 a3.5 3.5 0 0 1 7 0v2" fill="none" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round"/>',
      help: '<circle cx="12" cy="12" r="9" fill="none" stroke="' + c + '" stroke-width="2.2"/><path d="M9.5 10a2.5 2.5 0 1 1 3.2 2.4c-.7.3-1.2.8-1.2 1.6V15" fill="none" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="18" r="1.1" fill="' + c + '"/>',
      close: '<path d="M6 6l12 12M18 6L6 18" stroke="' + c + '" stroke-width="3" stroke-linecap="round"/>',
      star: '<path d="M12 2.2l2.8 6.2 6.8.7-5.1 4.6 1.5 6.7L12 16.9 6 20.4l1.5-6.7L2.4 9.1l6.8-.7z" fill="#FFCF2E" stroke="#C47800" stroke-width="1.2" stroke-linejoin="round"/><path d="M9 8.5 L11 4.5" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>',
      starOff: '<path d="M12 2.2l2.8 6.2 6.8.7-5.1 4.6 1.5 6.7L12 16.9 6 20.4l1.5-6.7L2.4 9.1l6.8-.7z" fill="#C9D2DC" stroke="#94A0AE" stroke-width="1.2" stroke-linejoin="round"/>',
      gear: '<path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6z" fill="none" stroke="' + c + '" stroke-width="2.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" stroke="' + c + '" stroke-width="2.6" stroke-linecap="round"/>',
      plus: '<path d="M12 5v14M5 12h14" stroke="' + c + '" stroke-width="3.4" stroke-linecap="round"/>',
      check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="' + c + '" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>',
      snow: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round"/><path d="M9.5 4.5L12 6.5l2.5-2M9.5 19.5L12 17.5l2.5 2" fill="none" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round"/>',
      gift: '<rect x="4" y="10" width="16" height="10" rx="1.5" fill="#F2393C" stroke="#8A0E16" stroke-width="1.2"/><rect x="3" y="7" width="18" height="4" rx="1.2" fill="#FF6159" stroke="#8A0E16" stroke-width="1.2"/><path d="M12 7v13" stroke="#FFD23F" stroke-width="2.6"/><path d="M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0" fill="none" stroke="#FFD23F" stroke-width="2"/>',
      calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.5" fill="#fff" stroke="' + c + '" stroke-width="2"/><path d="M3.5 9.5h17" stroke="' + c + '" stroke-width="2"/><path d="M8 3v4M16 3v4" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round"/>',
      share: '<circle cx="6" cy="12" r="2.6" fill="' + c + '"/><circle cx="18" cy="6" r="2.6" fill="' + c + '"/><circle cx="18" cy="18" r="2.6" fill="' + c + '"/><path d="M8.3 10.8l7.4-3.6M8.3 13.2l7.4 3.6" stroke="' + c + '" stroke-width="2"/>',
      home: '<path d="M4 11.5L12 4.5l8 7" fill="none" stroke="' + c + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 10.5V19.5h11V10.5" fill="none" stroke="' + c + '" stroke-width="2.6" stroke-linejoin="round"/>',
      ad: '<rect x="3" y="5" width="18" height="13" rx="2.5" fill="none" stroke="' + c + '" stroke-width="2"/><path d="M10 9l5 2.5-5 2.5z" fill="' + c + '"/>'
    };
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (icons[name] || '') + '</svg>';
  }
  function muteIcon(kind, muted) {
    var body = kind === 'bgm'
      ? '<path d="M10 17.5V6l9-2v11.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><circle cx="7.5" cy="17.5" r="2.6" fill="currentColor"/><circle cx="16.5" cy="15.5" r="2.6" fill="currentColor"/>'
      : '<path d="M4 9.5h4l5-4.5v14l-5-4.5H4z" fill="currentColor"/><path d="M16 8.5c2 2 2 5 0 7M18.5 6c3.4 3.4 3.4 8.6 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
    var slash = muted ? '<path d="M4 20 L20 4" stroke="#F2393C" stroke-width="3" stroke-linecap="round"/>' : '';
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + body + slash + '</svg>';
  }

  root.Art = {
    PALETTE: PALETTE, kindOf: kindOf, carSVG: carSVG, ferrySVG: ferrySVG, ferrySlots: ferrySlots,
    icon: icon, ticketSVG: ticketSVG, coinSVG: ticketSVG, coinStackSVG: coinStackSVG, flameSVG: flameSVG,
    crateSVG: crateSVG, coneSVG: coneSVG, treeSVG: treeSVG, palmSVG: palmSVG, flowerBedSVG: flowerBedSVG,
    rockSVG: rockSVG, bollardSVG: bollardSVG, logoSVG: logoSVG, handSVG: handSVG, lockBadge: lockBadge,
    keyBadge: keyBadge, gateSVG: gateSVG, muteIcon: muteIcon, spriteDefs: spriteDefs
  };
})(typeof self !== 'undefined' ? self : this);
