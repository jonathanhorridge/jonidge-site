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
    var g1 = shade ? '#2f6b3f' : '#3d7d4a', g2 = shade ? '#3c8049' : '#52a05a';
    return '<g transform="translate(' + x + ',' + y + ') scale(' + sc + ')">' +
      '<rect x="-2" y="-4" width="4" height="8" rx="1" fill="#7a5233"/>' +
      '<polygon points="0,-30 -11,-6 11,-6" fill="' + g1 + '"/>' +
      '<polygon points="0,-38 -9,-17 9,-17" fill="' + g2 + '"/>' +
      '<polygon points="0,-38 -9,-17 0,-17" fill="#ffffff" opacity=".12"/></g>';
  }
  function house(x, y, sc, roof, wall) {
    roof = roof || '#d9674a'; wall = wall || '#fbe9c8';
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
    var p = PAL[type] || PAL.empty, top = hexPts(0, 0, S, K), bot = hexPts(0, TH, S, K), th = o.thick == null ? TH : o.thick;
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

  /* --- village items (small standalone icons) --- */
  function villageItem(kind, type) {
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
    return '<svg class="vitem" viewBox="-26 -48 52 62" aria-hidden="true">' + DEFS.replace(/id="wob"/, 'id="wobv"').replace('url(#wob)', 'url(#wobv)') + '<g filter="url(#wobv)">' + g + '</g></svg>';
  }

  root.HHArt = { S: S, K: K, TH: TH, SQ3: SQ3, center: center, hexPts: hexPts, pts: pts, tileGroup: tileGroup, DEFS: DEFS, iconSVG: iconSVG, villageItem: villageItem, PAL: PAL };
})(window);
