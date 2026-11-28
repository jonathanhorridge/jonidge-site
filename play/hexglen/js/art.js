/* Hexglen art: original warm hand-drawn-style placeholder art, generated as SVG (no external assets). */
(function (root) {
  'use strict';
  var S = 38, K = 0.80, TH = 13, SQ3 = Math.sqrt(3);
  var PAL = {
    forest:   { top: '#8dbd68', l: '#5d8c48', r: '#72a257' },
    field:    { top: '#efd27a', l: '#c4a147', r: '#d9b659' },
    river:    { top: '#7cc3df', l: '#4d93b5', r: '#63aad0' },
    house:    { top: '#c8dc94', l: '#93aa64', r: '#abc178' },
    windmill: { top: '#d3e49e', l: '#9fb36d', r: '#b8cb82' },
    market:   { top: '#ebd0a6', l: '#bf9d70', r: '#d5b88c' },
    empty:    { top: '#f6e9cb', l: '#e4d1a9', r: '#ecdcb8' }
  };
  var BASE_TREE = ['#3d7d4a', '#52a05a', '#2f6b3f', '#3c8049'];
  var SKINS = {
    meadow:  { name: 'Meadow', pal: {}, tree: BASE_TREE, roof: '#d9674a', grass: { top: '#bfe08e', l: '#8fb062', r: '#a5c474' } },
    autumn:  { name: 'Autumn', tree: ['#b5532b', '#d9803a', '#9a3f22', '#c4682f'], roof: '#a8452f', grass: { top: '#dcc57c', l: '#b09a52', r: '#c6af64' },
      pal: { forest: { top: '#d49a4a', l: '#a8702f', r: '#bd8440' }, field: { top: '#f0c65c', l: '#c79a35', r: '#dcb046' }, river: { top: '#78b6c4', l: '#4b8896', r: '#609ead' }, house: { top: '#dcc57c', l: '#b09a52', r: '#c6af64' }, windmill: { top: '#e3d08a', l: '#b9a45f', r: '#cfba72' }, market: { top: '#e8c9a0', l: '#bc9a6c', r: '#d2b284' } } },
    blossom: { name: 'Blossom', tree: ['#d56f9a', '#f09bbd', '#c25a85', '#e581a8'], roof: '#8c6bb5', grass: { top: '#ecd3e6', l: '#c4a0bd', r: '#d8b8d0' },
      pal: { forest: { top: '#d8a6c4', l: '#b07a9c', r: '#c48fb0' }, field: { top: '#f4dc8c', l: '#cfb25c', r: '#e2c672' }, river: { top: '#8cc8e8', l: '#5a9ac0', r: '#72b0d6' }, house: { top: '#ecd3e6', l: '#c4a0bd', r: '#d8b8d0' }, windmill: { top: '#e2d6f2', l: '#b8a8d0', r: '#cdc0e2' }, market: { top: '#f4dcc8', l: '#cdae98', r: '#e2c4ae' } } },
    snow:    { name: 'Snowfall', tree: ['#2f5f5a', '#3f7a72', '#274f4b', '#356b64'], roof: '#b84a3a', grass: { top: '#e6f0f4', l: '#b4c8d0', r: '#cadbe2' },
      pal: { forest: { top: '#cfe6e2', l: '#9dbfbb', r: '#b3d2ce' }, field: { top: '#f1efe2', l: '#cbc8b4', r: '#e0ddca' }, river: { top: '#a8d8ec', l: '#78aac4', r: '#90c0d8' }, house: { top: '#e6f0f4', l: '#b4c8d0', r: '#cadbe2' }, windmill: { top: '#eaf3f7', l: '#bccdd6', r: '#d2e1e8' }, market: { top: '#eae2d6', l: '#c2b6a4', r: '#d8ccba' } } },
    candy:   { name: 'Candy', tree: ['#35a374', '#5fd3a0', '#2b8d63', '#49bf8c'], roof: '#ff7aa8', grass: { top: '#ffd9e8', l: '#e6a9c2', r: '#f2c0d4' },
      pal: { forest: { top: '#9ae3c2', l: '#62b992', r: '#7acfa6' }, field: { top: '#ffe38c', l: '#e0bd5a', r: '#f2d070' }, river: { top: '#88d8ff', l: '#56a8d8', r: '#6cc0ee' }, house: { top: '#ffd1e3', l: '#e6a1bf', r: '#f2b7d0' }, windmill: { top: '#dccaff', l: '#b4a0e0', r: '#c8b6f0' }, market: { top: '#ffe3c2', l: '#e0b894', r: '#f2cca8' } } }
  };
  var SKIN = SKINS.meadow, SKIN_ID = 'meadow';
  function setSkin(id) { if (SKINS[id]) { SKIN = SKINS[id]; SKIN_ID = id; } return SKIN_ID; }
  function palOf(type) { if (type === 'grass') return SKIN.grass; return (SKIN.pal && SKIN.pal[type]) || PAL[type] || PAL.empty; }
  function hexPts(dx, dy, s, k) {
    var p = [];
    for (var i = 0; i < 6; i++) {
      var a = (60 * i + 30) * Math.PI / 180;
      p.push([dx + s * Math.cos(a), dy + s * Math.sin(a) * k]);
    }
    return p;
  }
  function pts(arr) { return arr.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }
  function center(q, r) { return { x: S * SQ3 * (q + r / 2), y: S * 1.5 * K * r }; }

  /* --- sprites (drawn upright, y negative = up) --- */
  function tree(x, y, sc, shade) {
    var T = SKIN.tree, g1 = shade ? T[2] : T[0], g2 = shade ? T[3] : T[1];
    return '<g transform="translate(' + x + ',' + y + ') scale(' + sc + ')">' +
      '<rect x="-2" y="-4" width="4" height="8" rx="1" fill="#7a5233"/>' +
      '<polygon points="0,-30 -11,-6 11,-6" fill="' + g1 + '"/>' +
      '<polygon points="0,-38 -9,-17 9,-17" fill="' + g2 + '"/>' +
      '<polygon points="0,-38 -9,-17 0,-17" fill="#ffffff" opacity=".12"/></g>';
  }
  function house(x, y, sc, roof, wall) {
    roof = roof || SKIN.roof; wall = wall || '#fbe9c8';
    return '<g transform="translate(' + x + ',' + y + ') scale(' + sc + ')">' +
      '<rect x="-12" y="-16" width="24" height="18" rx="2" fill="' + wall + '" stroke="#b98e63" stroke-width="1.2"/>' +
      '<polygon points="-16,-15 0,-32 16,-15" fill="' + roof + '" stroke="#a24b34" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<rect x="7" y="-31" width="4" height="9" fill="#a8604a"/>' +
      '<rect x="-3.5" y="-9" width="7" height="11" rx="3" fill="#8b5a3c"/>' +
      '<rect x="-10" y="-12" width="5" height="5" rx="1" fill="#8ed0e0" stroke="#b98e63" stroke-width=".8"/>' +
      '<rect x="5" y="-12" width="5" height="5" rx="1" fill="#f7d774" stroke="#b98e63" stroke-width=".8"/></g>';
  }
  function windmill(x, y, sc, spin) {
    var blades = '';
    for (var i = 0; i < 4; i++) blades += '<g transform="rotate(' + (i * 90 + 20) + ')"><rect x="-1.6" y="-24" width="3.2" height="24" fill="#8a6a4a"/><rect x="1.6" y="-24" width="8" height="15" rx="1" fill="#fff6e1" stroke="#c9b08a" stroke-width=".8"/></g>';
    var anim = spin ? '<animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="14s" repeatCount="indefinite"/>' : '';
    return '<g transform="translate(' + x + ',' + y + ') scale(' + sc + ')">' +
      '<polygon points="-11,4 11,4 7,-26 -7,-26" fill="#f6dfb5" stroke="#b98e63" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<polygon points="-10,-25 0,-36 10,-25" fill="#c4553f" stroke="#a24b34" stroke-width="1.1" stroke-linejoin="round"/>' +
      '<rect x="-3" y="-8" width="6" height="12" rx="3" fill="#8b5a3c"/>' +
      '<g transform="translate(0,-24)"><g>' + anim + blades + '</g><circle r="3" fill="#6d4c33"/></g></g>';
  }
  function market(x, y, sc) {
    var stripes = '';
    for (var i = 0; i < 4; i++) stripes += '<rect x="' + (-15 + i * 7.5) + '" y="-24" width="7.5" height="9" fill="' + (i % 2 ? '#fff3dc' : '#e0614a') + '"/>';
    return '<g transform="translate(' + x + ',' + y + ') scale(' + sc + ')">' +
      '<rect x="-13" y="-16" width="2.5" height="18" fill="#8a6a4a"/><rect x="10.5" y="-16" width="2.5" height="18" fill="#8a6a4a"/>' +
      '<rect x="-13" y="-4" width="26" height="8" rx="1.5" fill="#c99a62" stroke="#9c7040" stroke-width="1"/>' +
      stripes + '<path d="M-15,-15 q3.75,5 7.5,0 q3.75,5 7.5,0 q3.75,5 7.5,0 q3.75,5 7.5,0" fill="none" stroke="#c4503c" stroke-width="1.4"/>' +
      '<circle cx="-6" cy="-6.5" r="3" fill="#ef8354"/><circle cx="0" cy="-7" r="3" fill="#a9d86e"/><circle cx="6" cy="-6.5" r="3" fill="#f7c948"/></g>';
  }
  function fieldFlat() {
    var o = '';
    for (var i = -3; i <= 3; i++) {
      var y = i * 5.2 * K;
      o += '<line x1="-30" y1="' + y.toFixed(1) + '" x2="30" y2="' + y.toFixed(1) + '" stroke="#cfa645" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="7 3.5"/>';
    }
    return o;
  }
  function riverFlat() {
    var o = '';
    [-9, 0, 9].forEach(function (y, i) {
      var yy = y * K;
      o += '<path d="M-26,' + yy + ' q6.5,-5 13,0 t13,0 t13,0 t13,0" fill="none" stroke="' + (i === 1 ? '#ffffff' : '#d5f0fa') + '" stroke-width="2.2" stroke-linecap="round" opacity="' + (i === 1 ? .8 : .7) + '"/>';
    });
    return o;
  }

  /* --- one tile at (cx,cy) --- */
  function tileGroup(type, cx, cy, o) {
    o = o || {};
    var p = palOf(type), top = hexPts(0, 0, S, K), bot = hexPts(0, TH, S, K), th = o.thick == null ? TH : o.thick;
    if (th !== TH) bot = hexPts(0, th, S, K);
    var walls = '';
    [[2, 3, 'l'], [1, 2, 'l'], [0, 1, 'r'], [5, 0, 'r']].forEach(function (e) {
      var a = top[e[0]], b = top[e[1]], c = bot[e[1]], d = bot[e[0]];
      walls += '<polygon points="' + pts([a, b, c, d]) + '" fill="' + p[e[2]] + '" stroke="' + p[e[2]] + '" stroke-width=".6" stroke-linejoin="round"/>';
    });
    var s = '<g class="tile ' + (o.cls || '') + '" transform="translate(' + cx.toFixed(1) + ',' + cy.toFixed(1) + ')">' + walls;
    s += '<polygon points="' + pts(top) + '" fill="' + p.top + '" stroke="' + (type === 'empty' ? '#d9c291' : 'rgba(80,50,20,.28)') + '" stroke-width="' + (type === 'empty' ? 1.4 : 1.1) + '"' + (type === 'empty' ? ' stroke-dasharray="4 3"' : '') + ' stroke-linejoin="round"/>';
    if (type === 'field' || type === 'river') {
      var clip = 'clip' + Math.random().toString(36).slice(2, 8);
      s += '<clipPath id="' + clip + '"><polygon points="' + pts(top) + '"/></clipPath><g clip-path="url(#' + clip + ')">' + (type === 'field' ? fieldFlat() : riverFlat()) + '</g>';
    }
    if (type === 'house' || type === 'windmill' || type === 'market' || type === 'forest') {
      // little grass tufts so stand-up sprites feel planted
      s += '<ellipse cx="0" cy="4" rx="17" ry="6.5" fill="rgba(60,40,20,.14)"/>';
    }
    var st = '';
    if (type === 'forest') st = tree(-12, 3, .78, true) + tree(11, 2, .8, false) + tree(0, 9, 1, false);
    else if (type === 'house') st = house(0, 8, 1.1);
    else if (type === 'windmill') st = windmill(0, 9, .92, o.spin !== false);
    else if (type === 'market') st = market(0, 8, 1.15);
    else if (type === 'field') st = '<g stroke="#b88a2f" stroke-width="1.6" stroke-linecap="round" fill="none"><path d="M-14,3 l0,-9 m-2,3 l2,-3 l2,3"/><path d="M12,-1 l0,-9 m-2,3 l2,-3 l2,3"/><path d="M-1,8 l0,-8 m-2,3 l2,-3 l2,3"/></g>';
    if (st) s += '<g filter="url(#wob)">' + st + '</g>';
    return s + '</g>';
  }
  var DEFS = '<defs><filter id="wob" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.8"/></filter>' +
    '<filter id="soft"><feGaussianBlur stdDeviation="2"/></filter></defs>';

  function iconSVG(type, px) {
    var h = px * 106 / 72;
    return '<svg class="ticon" viewBox="-36 -60 72 106" width="' + px + '" height="' + h.toFixed(0) + '" aria-hidden="true">' + DEFS.replace(/id="wob"/, 'id="wob' + type + '"').replace('url(#wob)', 'url(#wob' + type + ')') +
      tileGroup(type, 0, 0, { spin: false }).replace(/filter="url\(#wob\)"/g, 'filter="url(#wob' + type + ')"') + '</svg>';
  }

  /* --- village items (small standalone icons; coordinates fit a 52 x 62 box, feet near y=+10) --- */
  var PERSON = {
    fern:  { cloth: '#5fa05a', hat: 'leaf',  hair: '#7a4a2a', skin: '#f2cfa6', hatc: '#3f8a47' },
    orla:  { cloth: '#f2c14e', hat: 'straw', hair: '#c97a3a', skin: '#f6d6b0', hatc: '#e8cf8a' },
    pip:   { cloth: '#5b9bd5', hat: 'cap',   hair: '#2f2f3f', skin: '#e8bf94', hatc: '#2f6fa8' },
    mabel: { cloth: '#ef8fb0', hat: 'bun',   hair: '#8a5a8a', skin: '#f4d2ac', hatc: '#8a5a8a' },
    orin:  { cloth: '#a8764a', hat: 'chef',  hair: '#d9d9d9', skin: '#efc79b', hatc: '#fff8ea' },
    bram:  { cloth: '#d9574a', hat: 'beret', hair: '#4a3020', skin: '#dcae82', hatc: '#2f4a8a' }
  };
  function person(id) {
    var P = PERSON[id] || PERSON.fern, hat = '';
    if (P.hat === 'leaf') hat = '<path d="M-7,-20 q7,-12 14,0z" fill="' + P.hatc + '"/><path d="M0,-30 q6,-2 7,5 q-6,1 -7,-5z" fill="#6fc06a"/>';
    else if (P.hat === 'straw') hat = '<ellipse cx="0" cy="-19" rx="11" ry="3.2" fill="' + P.hatc + '"/><path d="M-6,-19 q6,-10 12,0z" fill="' + P.hatc + '"/>';
    else if (P.hat === 'cap') hat = '<path d="M-7,-19 q7,-10 14,0z" fill="' + P.hatc + '"/><rect x="2" y="-20" width="9" height="2.6" rx="1.3" fill="' + P.hatc + '"/>';
    else if (P.hat === 'bun') hat = '<circle cx="0" cy="-26" r="4.5" fill="' + P.hair + '"/>';
    else if (P.hat === 'chef') hat = '<rect x="-6" y="-24" width="12" height="7" rx="2" fill="' + P.hatc + '"/><circle cx="-4" cy="-26" r="3.6" fill="' + P.hatc + '"/><circle cx="4" cy="-26" r="3.6" fill="' + P.hatc + '"/>';
    else hat = '<ellipse cx="-1" cy="-21" rx="9" ry="3.6" fill="' + P.hatc + '"/><circle cx="-1" cy="-25" r="1.6" fill="' + P.hatc + '"/>';
    return '<g class="vperson"><ellipse cx="0" cy="9" rx="9" ry="3" fill="rgba(60,40,20,.2)"/>' +
      '<rect x="-3.4" y="2" width="2.8" height="7" rx="1.2" fill="#6b4a33"/><rect x="0.6" y="2" width="2.8" height="7" rx="1.2" fill="#6b4a33"/>' +
      '<path d="M-8,3 q0,-14 8,-14 q8,0 8,14z" fill="' + P.cloth + '" stroke="rgba(60,40,20,.25)" stroke-width="1"/>' +
      '<circle cx="0" cy="-15" r="6.4" fill="' + P.skin + '" stroke="rgba(60,40,20,.25)" stroke-width="1"/>' +
      '<path d="M-6.4,-16 q6.4,-8 12.8,0 q-6.4,-3 -12.8,0z" fill="' + P.hair + '"/>' + hat +
      '<circle cx="-2.2" cy="-14.6" r=".9" fill="#4a3020"/><circle cx="2.2" cy="-14.6" r=".9" fill="#4a3020"/><path d="M-2,-12.2 q2,1.6 4,0" fill="none" stroke="#b5654a" stroke-width=".8"/></g>';
  }
  function villageGroup(kind, type) {
    var g = '';
    if (kind === 'building') {
      if (type === 'cottage') g = house(0, 4, 1.15);
      else if (type === 'barn') g = house(0, 4, 1.2, '#b5533c', '#e9c9a0');
      else if (type === 'bakery') g = house(0, 4, 1.15, '#7d6ab5', '#fff0d6') + '<circle cx="14" cy="-26" r="3" fill="#fff" opacity=".7"/><circle cx="17" cy="-32" r="2.4" fill="#fff" opacity=".5"/>';
      else if (type === 'chapel') g = house(-2, 4, 1.15, '#6f8fb5', '#f5ead6') + '<polygon points="12,-34 16,-44 20,-34" fill="#6f8fb5"/><rect x="12" y="-34" width="8" height="12" fill="#f5ead6"/>';
      else if (type === 'inn') g = house(0, 4, 1.25, '#9c4f3a', '#f3dcb4') + '<rect x="-18" y="-6" width="5" height="9" fill="#7a5233"/>';
      else if (type === 'mill') g = windmill(0, 6, 1.05, true);
      else if (type === 'well') g = '<ellipse cx="0" cy="2" rx="11" ry="5" fill="#9a9a9a"/><rect x="-10" y="-8" width="20" height="10" fill="#c9b79c"/><ellipse cx="0" cy="-8" rx="10" ry="4.5" fill="#6ab4d6"/><rect x="-11" y="-24" width="2.5" height="17" fill="#8a6a4a"/><rect x="8.5" y="-24" width="2.5" height="17" fill="#8a6a4a"/><polygon points="-14,-23 0,-33 14,-23" fill="#c4553f"/>';
      else if (type === 'bridge') g = '<path d="M-20,2 q20,-26 40,0 l0,5 q-20,-26 -40,0z" fill="#b08a5e" stroke="#7d5c38" stroke-width="1.2"/><rect x="-22" y="1" width="44" height="4" fill="#6ab4d6" opacity=".0"/>';
    } else {
      if (type === 'flowers') g = '<g><circle cx="-10" cy="0" r="4" fill="#f28ab0"/><circle cx="0" cy="-5" r="4" fill="#f7c948"/><circle cx="10" cy="1" r="4" fill="#b79ce8"/><circle cx="-10" cy="0" r="1.4" fill="#fff"/><circle cx="0" cy="-5" r="1.4" fill="#fff"/><circle cx="10" cy="1" r="1.4" fill="#fff"/><path d="M-10,4 v8 M0,-1 v13 M10,5 v7" stroke="#4f9a55" stroke-width="1.6"/></g>';
      else if (type === 'bench') g = '<rect x="-14" y="-8" width="28" height="4" rx="1.5" fill="#a9754a"/><rect x="-14" y="-14" width="28" height="3.5" rx="1.5" fill="#b9834f"/><rect x="-12" y="-4" width="3" height="9" fill="#7a5233"/><rect x="9" y="-4" width="3" height="9" fill="#7a5233"/>';
      else if (type === 'lantern') g = '<rect x="-1.5" y="-20" width="3" height="28" fill="#5b4a3a"/><rect x="-6" y="-32" width="12" height="13" rx="3" fill="#ffd96b" stroke="#5b4a3a" stroke-width="1.5"/><circle cx="0" cy="-26" r="9" fill="#ffd96b" opacity=".3"/>';
      else if (type === 'scarecrow') g = '<rect x="-1.5" y="-24" width="3" height="32" fill="#7a5233"/><rect x="-14" y="-17" width="28" height="3" fill="#7a5233"/><circle cx="0" cy="-28" r="6" fill="#f2d49a"/><polygon points="-9,-30 9,-30 0,-42" fill="#c98a45"/><polygon points="-7,-14 7,-14 5,-2 -5,-2" fill="#6f8fb5"/>';
      else if (type === 'fountain') g = '<ellipse cx="0" cy="2" rx="16" ry="7" fill="#c9c2b4"/><ellipse cx="0" cy="0" rx="13" ry="5.5" fill="#7cc3df"/><rect x="-2" y="-14" width="4" height="14" fill="#c9c2b4"/><path d="M0,-14 q-8,-4 -10,6 M0,-14 q8,-4 10,6" fill="none" stroke="#bfe6f4" stroke-width="2"/>';
    }
    if (kind === 'building' && type === 'townhall') g = '<rect x="-17" y="-18" width="34" height="22" rx="2" fill="#fbe9c8" stroke="#b98e63" stroke-width="1.3"/><polygon points="-21,-17 0,-34 21,-17" fill="' + SKIN.roof + '" stroke="#a24b34" stroke-width="1.2" stroke-linejoin="round"/><rect x="-5" y="-48" width="10" height="16" fill="#f5ead6" stroke="#b98e63" stroke-width="1.2"/><polygon points="-6,-47 0,-56 6,-47" fill="' + SKIN.roof + '"/><circle cx="0" cy="-40" r="3.4" fill="#fff" stroke="#8a6a4a" stroke-width="1"/><rect x="-4" y="-8" width="8" height="12" rx="4" fill="#8b5a3c"/><rect x="-14" y="-12" width="6" height="6" rx="1" fill="#8ed0e0"/><rect x="8" y="-12" width="6" height="6" rx="1" fill="#f7d774"/><path d="M0,-56 v-6" stroke="#8a6a4a" stroke-width="1.4"/><polygon points="0,-62 9,-59 0,-56" fill="#e0614a"/>';
    if (kind === 'deco') {
      var D = {
        logpile: '<g><rect x="-13" y="-4" width="26" height="8" rx="4" fill="#a9754a" stroke="#7a5233" stroke-width="1"/><rect x="-9" y="-12" width="22" height="8" rx="4" fill="#b98456" stroke="#7a5233" stroke-width="1"/><circle cx="-13" cy="0" r="3.6" fill="#e3c08c" stroke="#7a5233" stroke-width=".8"/><circle cx="13" cy="-8" r="3.6" fill="#e3c08c" stroke="#7a5233" stroke-width=".8"/></g>',
        haystack: '<g><path d="M-15,6 q0,-26 15,-26 q15,0 15,26z" fill="#e9c35a" stroke="#b98a2f" stroke-width="1.2"/><path d="M-9,2 l4,-12 M0,2 l0,-16 M9,2 l-4,-12" stroke="#c99a35" stroke-width="1.2"/></g>',
        rowboat: '<g><path d="M-18,-2 q18,16 36,0 l-5,-8 q-13,6 -26,0z" fill="#b5703c" stroke="#7a4a24" stroke-width="1.2"/><rect x="-1" y="-22" width="2.4" height="20" fill="#8a6a4a"/><polygon points="1.4,-22 14,-10 1.4,-10" fill="#fff6e1" stroke="#c9b08a" stroke-width=".8"/></g>',
        oven: '<g><path d="M-14,6 q0,-26 14,-26 q14,0 14,26z" fill="#c9b79c" stroke="#8a7a62" stroke-width="1.2"/><path d="M-6,6 q0,-12 6,-12 q6,0 6,12z" fill="#e8742e"/><path d="M-3,6 q0,-6 3,-6 q3,0 3,6z" fill="#ffd36b"/><rect x="6" y="-26" width="5" height="9" fill="#a89880"/><circle cx="9" cy="-30" r="3" fill="#fff" opacity=".6"/></g>',
        sacks: '<g><path d="M-14,6 q-2,-14 6,-18 q8,4 6,18z" fill="#f1e2c0" stroke="#b9a37a" stroke-width="1.2"/><path d="M0,6 q-2,-12 5,-15 q7,3 5,15z" fill="#e8d6ae" stroke="#b9a37a" stroke-width="1.2"/><path d="M-11,-10 h6 M3,-8 h5" stroke="#b9a37a" stroke-width="1.4"/></g>',
        cart: '<g><rect x="-15" y="-10" width="30" height="10" rx="2" fill="#c99a62" stroke="#8a6a3a" stroke-width="1.2"/><circle cx="-8" cy="3" r="6" fill="#a9754a" stroke="#6b4a2a" stroke-width="1.4"/><circle cx="-8" cy="3" r="1.6" fill="#6b4a2a"/><path d="M15,-6 l10,-6" stroke="#8a6a3a" stroke-width="2"/><circle cx="-6" cy="-13" r="3.4" fill="#ef8354"/><circle cx="2" cy="-13" r="3.4" fill="#a9d86e"/><circle cx="9" cy="-13" r="3.4" fill="#f7c948"/></g>',
        bunting: '<g><path d="M-22,-20 q22,14 44,0" fill="none" stroke="#8a6a4a" stroke-width="1.4"/><polygon points="-18,-17 -12,-17 -15,-8" fill="#e0614a"/><polygon points="-9,-12 -3,-12 -6,-3" fill="#f7c948"/><polygon points="0,-10 6,-10 3,-1" fill="#5fa05a"/><polygon points="10,-11 16,-11 13,-2" fill="#5b9bd5"/><rect x="-23" y="-26" width="2.4" height="30" fill="#8a6a4a"/><rect x="20.6" y="-26" width="2.4" height="30" fill="#8a6a4a"/></g>',
        snowman: '<g><circle cx="0" cy="-2" r="9" fill="#fff" stroke="#c4d4dc" stroke-width="1.2"/><circle cx="0" cy="-16" r="6.5" fill="#fff" stroke="#c4d4dc" stroke-width="1.2"/><polygon points="0,-16 7,-14.6 0,-13.6" fill="#ef8354"/><circle cx="-2.2" cy="-18" r=".9" fill="#333"/><circle cx="2.2" cy="-18" r=".9" fill="#333"/><rect x="-6" y="-26" width="12" height="4" fill="#4a3a5a"/><rect x="-4" y="-31" width="8" height="6" fill="#4a3a5a"/><path d="M-6,-10 q6,3 12,0" stroke="#d9574a" stroke-width="2.4" fill="none"/></g>',
        blossomtree: '<g><rect x="-2.4" y="-8" width="4.8" height="16" rx="1.4" fill="#7a5233"/><circle cx="-8" cy="-14" r="9" fill="#f4a9c4"/><circle cx="8" cy="-15" r="9" fill="#f08bb0"/><circle cx="0" cy="-24" r="9.5" fill="#f9bfd4"/><circle cx="-5" cy="-20" r="1.6" fill="#fff"/><circle cx="6" cy="-12" r="1.6" fill="#fff"/><circle cx="1" cy="-27" r="1.6" fill="#fff"/></g>',
        kite: '<g><polygon points="0,-34 9,-22 0,-8 -9,-22" fill="#ef8354" stroke="#b9543b" stroke-width="1.2"/><path d="M0,-34 V-8 M-9,-22 H9" stroke="#b9543b" stroke-width=".9"/><path d="M0,-8 q-6,6 0,10 q6,4 0,10" fill="none" stroke="#8a6a4a" stroke-width="1.2"/><polygon points="-3,-1 3,-1 0,3" fill="#f7c948"/></g>',
        balloons: '<g><path d="M-8,-18 L0,6 M2,-24 L0,6 M10,-16 L0,6" stroke="#8a6a4a" stroke-width="1"/><ellipse cx="-8" cy="-22" rx="6" ry="7.4" fill="#e0614a"/><ellipse cx="2" cy="-28" rx="6" ry="7.4" fill="#f7c948"/><ellipse cx="10" cy="-20" rx="6" ry="7.4" fill="#5b9bd5"/><path d="M-10,-26 q2,-2 4,-1" stroke="#fff" opacity=".6" fill="none" stroke-width="1.4"/></g>',
        paperlanterns: '<g><path d="M-22,-24 q22,8 44,0" fill="none" stroke="#8a6a4a" stroke-width="1.2"/><g><ellipse cx="-14" cy="-16" rx="5" ry="6.4" fill="#ef6a4a"/><ellipse cx="0" cy="-12" rx="5" ry="6.4" fill="#f7a548"/><ellipse cx="14" cy="-16" rx="5" ry="6.4" fill="#e0614a"/></g><circle cx="0" cy="-12" r="9" fill="#ffd96b" opacity=".25"/><rect x="-23" y="-28" width="2.4" height="34" fill="#8a6a4a"/><rect x="20.6" y="-28" width="2.4" height="34" fill="#8a6a4a"/></g>'
      };
      if (D[type]) g = D[type];
    }
    if (kind === 'villager') g = person(type);
    return g;
  }
  function villageItem(kind, type) {
    var g = villageGroup(kind, type);
    return '<svg class="vitem" viewBox="-26 -62 52 76" aria-hidden="true">' + DEFS.replace(/id="wob"/, 'id="wobv"').replace('url(#wob)', 'url(#wobv)') + '<g filter="url(#wobv)">' + g + '</g></svg>';
  }
  /* a grass hex of the village (scaled by `sc`), optional upright item and optional class */
  function villageHex(q, r, vs, item, cls, wild) {
    var c = { x: vs * SQ3 * (q + r / 2) * (S / S), y: vs * 1.5 * K * r }, sc = vs / S;
    var s = '<g class="vhex ' + (cls || '') + '" transform="translate(' + c.x.toFixed(1) + ',' + c.y.toFixed(1) + ') scale(' + sc.toFixed(3) + ')">' + tileGroup('grass', 0, 0, { thick: 9 }).replace('class="tile "', 'class="tile"');
    if (wild) s += '<g filter="url(#wob)">' + (wild === 'tree' ? tree(0, 6, 1, false) : tree(-8, 4, .7, true) + tree(8, 6, .75, false)) + '</g>';
    if (item) s += '<g filter="url(#wob)" transform="translate(0,6) scale(1.12)">' + villageGroup(item.kind, item.type) + '</g>';
    return s + '</g>';
  }
  function skinSwatch(id, px) {
    var sk = SKINS[id], old = SKIN_ID; setSkin(id);
    var html = iconSVG('forest', px) ; setSkin(old); return html;
  }

  root.HHArt = { SKINS: SKINS, setSkin: setSkin, getSkin: function () { return SKIN_ID; }, villageGroup: villageGroup, villageHex: villageHex, person: person, skinSwatch: skinSwatch, DEFS_ONLY: DEFS, S: S, K: K, TH: TH, SQ3: SQ3, center: center, hexPts: hexPts, pts: pts, tileGroup: tileGroup, DEFS: DEFS, iconSVG: iconSVG, villageItem: villageItem, PAL: PAL };
})(window);
