/* Hand-drawn SVG art for Ferry Jam: cars, ferries, icons, scenery. */
(function (root) {
  'use strict';

  var PALETTE = {
    red:    { body: '#E23B3B', dark: '#A51D22', light: '#FF7A76', roof: '#C2272D', glass: '#9AD8FF', shade: '#7A1218' },
    blue:   { body: '#2F7BF6', dark: '#1A4DB8', light: '#7EB6FF', roof: '#1D4ED8', glass: '#C8EBFF', shade: '#163A8A' },
    yellow: { body: '#F5C400', dark: '#C48A00', light: '#FFE56A', roof: '#E0A800', glass: '#8EC8EA', shade: '#8A6400' },
    green:  { body: '#17A85C', dark: '#0B7A3E', light: '#5FDC94', roof: '#0E8A48', glass: '#B8E8FF', shade: '#075C2E' },
    orange: { body: '#F07810', dark: '#C25100', light: '#FFB060', roof: '#D35E08', glass: '#B8E0FF', shade: '#8A3A00' }
  };

  function kindOf(car) {
    if (car.len >= 2) return 'bus';
    var n = 0, s = String(car.id || '');
    for (var i = 0; i < s.length; i++) n += s.charCodeAt(i);
    return (n % 2) ? 'sedan' : 'mini';
  }

  function pal(color) { return PALETTE[color] || PALETTE.red; }

  function wheels(ys, H) {
    var out = '';
    ys.forEach(function (y) {
      out +=
        '<ellipse cx="15" cy="' + y + '" rx="10" ry="16" fill="#1C1C1C"/>' +
        '<ellipse cx="85" cy="' + y + '" rx="10" ry="16" fill="#1C1C1C"/>' +
        '<ellipse cx="15" cy="' + y + '" rx="5.2" ry="8" fill="#D0D4DA"/>' +
        '<ellipse cx="85" cy="' + y + '" rx="5.2" ry="8" fill="#D0D4DA"/>' +
        '<ellipse cx="15" cy="' + y + '" rx="2.4" ry="3.6" fill="#6B717A"/>' +
        '<ellipse cx="85" cy="' + y + '" rx="2.4" ry="3.6" fill="#6B717A"/>';
    });
    return out;
  }

  function defs(id, p) {
    return '<defs>' +
      '<filter id="sh-' + id + '" x="-35%" y="-20%" width="170%" height="170%">' +
        '<feDropShadow dx="1.2" dy="2.8" stdDeviation="1.8" flood-color="#000" flood-opacity=".4"/>' +
      '</filter>' +
      '<linearGradient id="bd-' + id + '" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" stop-color="' + p.light + '"/>' +
        '<stop offset=".28" stop-color="' + p.body + '"/>' +
        '<stop offset=".72" stop-color="' + p.body + '"/>' +
        '<stop offset="1" stop-color="' + p.dark + '"/>' +
      '</linearGradient>' +
      '<linearGradient id="rf-' + id + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="' + p.light + '"/>' +
        '<stop offset="1" stop-color="' + p.roof + '"/>' +
      '</linearGradient>' +
      '<linearGradient id="gl-' + id + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#F4FBFF"/>' +
        '<stop offset=".35" stop-color="' + p.glass + '"/>' +
        '<stop offset="1" stop-color="#4A8EBE"/>' +
      '</linearGradient>' +
    '</defs>';
  }

  function miniInner(id, p) {
    var H = 158;
    return { w: 100, h: H, svg:
      defs(id, p) +
      wheels([44, 116]) +
      /* body */
      '<path filter="url(#sh-' + id + ')" fill="url(#bd-' + id + ')" stroke="' + p.shade + '" stroke-width="1.6" d="' +
        'M30,11 C22,11 17,17 17,26 L16,130 C16,144 25,152 36,152 L64,152 C75,152 84,144 84,130 L83,26 C83,17 78,11 70,11 Z"/>' +
      /* front bumper */
      '<rect x="24" y="7" width="52" height="10" rx="5" fill="#2A2E34"/>' +
      /* headlights */
      '<ellipse cx="32" cy="13" rx="7" ry="5" fill="#FFF4C2"/>' +
      '<ellipse cx="68" cy="13" rx="7" ry="5" fill="#FFF4C2"/>' +
      '<ellipse cx="32" cy="12" rx="3.2" ry="2.2" fill="#fff" opacity=".9"/>' +
      '<ellipse cx="68" cy="12" rx="3.2" ry="2.2" fill="#fff" opacity=".9"/>' +
      /* hood */
      '<rect x="27" y="20" width="46" height="16" rx="4" fill="' + p.light + '" opacity=".32"/>' +
      '<path d="M50 20v16" stroke="' + p.shade + '" stroke-width="1" opacity=".18"/>' +
      /* windshield */
      '<path d="M30,38 L70,38 L63,59 L37,59 Z" fill="url(#gl-' + id + ')" stroke="#fff" stroke-opacity=".35" stroke-width="1"/>' +
      /* roof */
      '<rect x="31" y="57" width="38" height="40" rx="6" fill="url(#rf-' + id + ')"/>' +
      '<rect x="35" y="61" width="14" height="30" rx="4" fill="#fff" opacity=".2"/>' +
      /* rear window */
      '<path d="M37,98 L63,98 L70,118 L30,118 Z" fill="url(#gl-' + id + ')" stroke="#fff" stroke-opacity=".25" stroke-width=".8"/>' +
      /* trunk lid line */
      '<path d="M28,128 h44" stroke="' + p.shade + '" stroke-width="1.2" opacity=".25"/>' +
      /* taillights */
      '<rect x="22" y="145" width="15" height="6" rx="2" fill="#FF3A3A"/>' +
      '<rect x="63" y="145" width="15" height="6" rx="2" fill="#FF3A3A"/>' +
      /* rear bumper */
      '<rect x="24" y="150" width="52" height="6" rx="3" fill="#2A2E34"/>' +
      /* mirrors */
      '<ellipse cx="13" cy="50" rx="6.5" ry="5" fill="' + p.body + '" stroke="' + p.shade + '" stroke-width="1.2"/>' +
      '<ellipse cx="87" cy="50" rx="6.5" ry="5" fill="' + p.body + '" stroke="' + p.shade + '" stroke-width="1.2"/>' +
      '<ellipse cx="13" cy="50" rx="3" ry="2.4" fill="#9AD0F0"/>' +
      '<ellipse cx="87" cy="50" rx="3" ry="2.4" fill="#9AD0F0"/>' +
      /* side highlight */
      '<path d="M22,36 L21,128" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".18"/>'
    };
  }

  function sedanInner(id, p) {
    var H = 178;
    return { w: 100, h: H, svg:
      defs(id, p) +
      wheels([48, 136]) +
      '<path filter="url(#sh-' + id + ')" fill="url(#bd-' + id + ')" stroke="' + p.shade + '" stroke-width="1.6" d="' +
        'M28,10 C20,10 16,16 16,26 L15,152 C15,164 24,172 35,172 L65,172 C76,172 85,164 85,152 L84,26 C84,16 80,10 72,10 Z"/>' +
      '<rect x="23" y="6" width="54" height="11" rx="5.5" fill="#2A2E34"/>' +
      '<ellipse cx="31" cy="12.5" rx="7.5" ry="5.2" fill="#FFF4C2"/>' +
      '<ellipse cx="69" cy="12.5" rx="7.5" ry="5.2" fill="#FFF4C2"/>' +
      '<ellipse cx="31" cy="11.5" rx="3.3" ry="2.3" fill="#fff" opacity=".9"/>' +
      '<ellipse cx="69" cy="11.5" rx="3.3" ry="2.3" fill="#fff" opacity=".9"/>' +
      /* long hood */
      '<rect x="26" y="20" width="48" height="26" rx="5" fill="' + p.light + '" opacity=".3"/>' +
      '<path d="M50 22v22" stroke="' + p.shade + '" stroke-width="1" opacity=".16"/>' +
      /* windshield */
      '<path d="M29,48 L71,48 L64,72 L36,72 Z" fill="url(#gl-' + id + ')" stroke="#fff" stroke-opacity=".35" stroke-width="1"/>' +
      /* roof cabin */
      '<rect x="32" y="70" width="36" height="44" rx="5" fill="url(#rf-' + id + ')"/>' +
      '<rect x="36" y="74" width="14" height="34" rx="3" fill="#fff" opacity=".2"/>' +
      /* rear window */
      '<path d="M36,114 L64,114 L71,136 L29,136 Z" fill="url(#gl-' + id + ')" stroke="#fff" stroke-opacity=".25" stroke-width=".8"/>' +
      /* long trunk */
      '<rect x="26" y="138" width="48" height="18" rx="3" fill="' + p.light + '" opacity=".18"/>' +
      '<path d="M26,148 h48" stroke="' + p.shade + '" stroke-width="1" opacity=".2"/>' +
      '<rect x="21" y="164" width="16" height="6.5" rx="2" fill="#FF3A3A"/>' +
      '<rect x="63" y="164" width="16" height="6.5" rx="2" fill="#FF3A3A"/>' +
      '<rect x="23" y="170" width="54" height="6" rx="3" fill="#2A2E34"/>' +
      '<ellipse cx="12" cy="56" rx="6.5" ry="5" fill="' + p.body + '" stroke="' + p.shade + '" stroke-width="1.2"/>' +
      '<ellipse cx="88" cy="56" rx="6.5" ry="5" fill="' + p.body + '" stroke="' + p.shade + '" stroke-width="1.2"/>' +
      '<ellipse cx="12" cy="56" rx="3" ry="2.4" fill="#9AD0F0"/>' +
      '<ellipse cx="88" cy="56" rx="3" ry="2.4" fill="#9AD0F0"/>' +
      '<path d="M22,40 L20,150" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".16"/>'
    };
  }

  function busInner(id, p) {
    var H = 232;
    var windows = '';
    for (var i = 0; i < 4; i++) {
      var y = 78 + i * 28;
      windows +=
        '<rect x="24" y="' + y + '" width="16" height="18" rx="3" fill="url(#gl-' + id + ')" stroke="#fff" stroke-opacity=".3"/>' +
        '<rect x="60" y="' + y + '" width="16" height="18" rx="3" fill="url(#gl-' + id + ')" stroke="#fff" stroke-opacity=".3"/>';
    }
    return { w: 100, h: H, svg:
      defs(id, p) +
      wheels([52, 120, 188]) +
      '<path filter="url(#sh-' + id + ')" fill="url(#bd-' + id + ')" stroke="' + p.shade + '" stroke-width="1.7" d="' +
        'M24,8 C18,8 15,14 15,22 L14,212 C14,224 22,228 32,228 L68,228 C78,228 86,224 86,212 L85,22 C85,14 82,8 76,8 Z"/>' +
      /* cab front */
      '<rect x="20" y="6" width="60" height="12" rx="5" fill="#2A2E34"/>' +
      '<ellipse cx="30" cy="13" rx="8" ry="5.4" fill="#FFF4C2"/>' +
      '<ellipse cx="70" cy="13" rx="8" ry="5.4" fill="#FFF4C2"/>' +
      '<ellipse cx="30" cy="12" rx="3.4" ry="2.3" fill="#fff" opacity=".9"/>' +
      '<ellipse cx="70" cy="12" rx="3.4" ry="2.3" fill="#fff" opacity=".9"/>' +
      /* windshield */
      '<path d="M24,24 L76,24 L72,58 L28,58 Z" fill="url(#gl-' + id + ')" stroke="#fff" stroke-opacity=".4" stroke-width="1.1"/>' +
      /* cab roof */
      '<rect x="26" y="56" width="48" height="16" rx="3" fill="url(#rf-' + id + ')"/>' +
      /* color band */
      '<rect x="16" y="70" width="68" height="8" fill="' + p.dark + '" opacity=".55"/>' +
      windows +
      /* roof hatch details */
      '<rect x="42" y="100" width="16" height="8" rx="2" fill="' + p.dark + '" opacity=".35"/>' +
      '<rect x="42" y="156" width="16" height="8" rx="2" fill="' + p.dark + '" opacity=".35"/>' +
      /* rear window */
      '<rect x="28" y="196" width="44" height="16" rx="3" fill="url(#gl-' + id + ')"/>' +
      '<rect x="20" y="216" width="16" height="7" rx="2" fill="#FF3A3A"/>' +
      '<rect x="64" y="216" width="16" height="7" rx="2" fill="#FF3A3A"/>' +
      '<rect x="20" y="223" width="60" height="6" rx="3" fill="#2A2E34"/>' +
      /* mirrors */
      '<rect x="7" y="30" width="10" height="14" rx="3" fill="' + p.body + '" stroke="' + p.shade + '" stroke-width="1.1"/>' +
      '<rect x="83" y="30" width="10" height="14" rx="3" fill="' + p.body + '" stroke="' + p.shade + '" stroke-width="1.1"/>' +
      '<rect x="8.5" y="32" width="7" height="8" rx="1.5" fill="#9AD0F0"/>' +
      '<rect x="84.5" y="32" width="7" height="8" rx="1.5" fill="#9AD0F0"/>' +
      '<path d="M22,40 L21,200" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".16"/>'
    };
  }

  function wrapCar(inner, dir, className) {
    var rot = { N: 0, E: 90, S: 180, W: 270 }[dir] || 0;
    var ew, eh, tx, ty;
    if (dir === 'E' || dir === 'W') {
      ew = inner.h; eh = inner.w; tx = inner.h / 2; ty = inner.w / 2;
    } else {
      ew = inner.w; eh = inner.h; tx = inner.w / 2; ty = inner.h / 2;
    }
    return '<svg class="' + (className || 'car-svg') + '" viewBox="0 0 ' + ew + ' ' + eh + '" aria-hidden="true">' +
      '<g transform="translate(' + tx + ',' + ty + ') rotate(' + rot + ') translate(' + (-inner.w / 2) + ',' + (-inner.h / 2) + ')">' +
      inner.svg + '</g></svg>';
  }

  function carSVG(car, opts) {
    opts = opts || {};
    var id = (opts.idPrefix || 'c') + '-' + (car.id || 'x') + '-' + (opts.uid || '');
    var p = pal(car.color);
    var kind = opts.kind || kindOf(car);
    var inner = kind === 'bus' ? busInner(id, p) : kind === 'sedan' ? sedanInner(id, p) : miniInner(id, p);
    var dir = opts.dir || car.dir || 'N';
    return wrapCar(inner, dir, opts.className);
  }

  /* ---------- Ferry (top-down, bow to the right) ---------- */
  function ferrySVG(ferry, opts) {
    opts = opts || {};
    var id = 'fy-' + (ferry.id || 'x') + '-' + (opts.uid || '');
    var p = pal(ferry.color);
    var cap = ferry.capacity || 1;
    var slots = ferrySlots(cap); // percent boxes, also used to paint bays
    var bays = '';
    slots.forEach(function (s, i) {
      var x = s.x / 100 * 320, y = s.y / 100 * 150, w = s.w / 100 * 320, h = s.h / 100 * 150;
      var filled = ferry.cargo && ferry.cargo[i];
      bays += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="' + (filled ? '#00000018' : '#ffffff22') +
        '" stroke="#fff" stroke-width="1.6" stroke-dasharray="5 3" opacity=".9"/>' +
        '<path d="M' + (x + 6) + ' ' + (y + h / 2) + ' h' + (w - 12) + '" stroke="#fff" stroke-width="1.1" opacity=".35"/>';
    });
    return '<svg class="ferry-svg" viewBox="0 0 320 150" aria-hidden="true">' +
      '<defs>' +
        '<filter id="fsh-' + id + '" x="-10%" y="-20%" width="130%" height="150%">' +
          '<feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#062018" flood-opacity=".4"/>' +
        '</filter>' +
        '<linearGradient id="hull-' + id + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="' + p.light + '"/>' +
          '<stop offset=".45" stop-color="' + p.body + '"/>' +
          '<stop offset="1" stop-color="' + p.dark + '"/>' +
        '</linearGradient>' +
        '<linearGradient id="deck-' + id + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#F7F1E4"/>' +
          '<stop offset="1" stop-color="#D9CDB3"/>' +
        '</linearGradient>' +
      '</defs>' +
      /* hull */
      '<path filter="url(#fsh-' + id + ')" fill="url(#hull-' + id + ')" stroke="' + p.shade + '" stroke-width="3" d="' +
        'M36,22 C18,22 8,40 8,75 C8,110 18,128 36,128 L236,132 C268,132 304,108 312,75 C304,42 268,18 236,18 Z"/>' +
      /* gunwale / color rail */
      '<path fill="none" stroke="' + p.shade + '" stroke-width="5" stroke-linecap="round" opacity=".35" d="M40,28 L232,24 C262,24 294,48 302,75"/>' +
      /* deck */
      '<path fill="url(#deck-' + id + ')" stroke="#C4B89A" stroke-width="1.2" d="' +
        'M48,36 C38,36 32,48 32,75 C32,102 38,114 48,114 L228,118 C250,118 278,100 286,75 C278,50 250,32 228,32 Z"/>' +
      bays +
      /* cabin / bridge at the stern (left) */
      '<rect x="40" y="44" width="44" height="62" rx="6" fill="#F4F7FA" stroke="#8A93A0" stroke-width="1.4"/>' +
      '<rect x="44" y="50" width="16" height="14" rx="2" fill="#7EC8F0"/>' +
      '<rect x="64" y="50" width="16" height="14" rx="2" fill="#7EC8F0"/>' +
      '<rect x="44" y="70" width="16" height="14" rx="2" fill="#7EC8F0"/>' +
      '<rect x="64" y="70" width="16" height="14" rx="2" fill="#7EC8F0"/>' +
      '<rect x="46" y="90" width="32" height="8" rx="2" fill="#D5DCE3"/>' +
      /* roof of cabin */
      '<rect x="38" y="38" width="48" height="10" rx="3" fill="#E8EEF3" stroke="#8A93A0" stroke-width="1"/>' +
      /* funnel */
      '<rect x="54" y="16" width="16" height="26" rx="3" fill="' + p.body + '" stroke="' + p.shade + '" stroke-width="1.3"/>' +
      '<rect x="54" y="22" width="16" height="5" fill="#fff" opacity=".85"/>' +
      '<rect x="53" y="14" width="18" height="6" rx="2" fill="#2A2E34"/>' +
      /* life rings */
      '<circle cx="108" cy="36" r="8" fill="none" stroke="#F4F4F4" stroke-width="3"/>' +
      '<circle cx="108" cy="36" r="8" fill="none" stroke="#E23B3B" stroke-width="3" stroke-dasharray="6 6"/>' +
      '<circle cx="108" cy="114" r="8" fill="none" stroke="#F4F4F4" stroke-width="3"/>' +
      '<circle cx="108" cy="114" r="8" fill="none" stroke="#E23B3B" stroke-width="3" stroke-dasharray="6 6"/>' +
      /* bow capstan */
      '<circle cx="268" cy="75" r="6" fill="#C5CCD3" stroke="#6A727A" stroke-width="1.2"/>' +
      '<circle cx="268" cy="75" r="2.5" fill="#6A727A"/>' +
    '</svg>';
  }

  function ferrySlots(capacity) {
    var cap = Math.max(1, capacity || 1);
    var left = 30, top = 34, width = 54, height = 32, gap = 1.6;
    var sw = (width - gap * (cap - 1)) / cap;
    var out = [];
    for (var i = 0; i < cap; i++) {
      out.push({ x: left + i * (sw + gap), y: top, w: sw, h: height });
    }
    return out;
  }

  /* ---------- Icons (no emoji) ---------- */
  function icon(name, color) {
    var c = color || 'currentColor';
    var icons = {
      back: '<path d="M15 5l-8 7 8 7" fill="none" stroke="' + c + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
      undo: '<path d="M7 10 H16 a5 5 0 1 1 0 4" fill="none" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round"/>' +
            '<path d="M7 10 l4-4 M7 10 l4 4" fill="none" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
      restart: '<path d="M19 12a7 7 0 1 1-2-5" fill="none" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round"/>' +
               '<path d="M17 3v5h-5" fill="none" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
      hint: '<path d="M12 3a6 6 0 0 0-3 11c.4 1 .8 1.6 1 2.4h4c.2-.8.6-1.4 1-2.4A6 6 0 0 0 12 3z" fill="#FFE56A" stroke="#C48A00" stroke-width="1.5"/>' +
            '<path d="M10 19h4M10.5 21h3" stroke="#C48A00" stroke-width="1.6" stroke-linecap="round"/>',
      dock: '<rect x="3" y="14" width="18" height="6" rx="1.5" fill="#C48A4A" stroke="#8B5A2B" stroke-width="1"/>' +
            '<rect x="5" y="6" width="6" height="9" rx="1" fill="none" stroke="' + c + '" stroke-width="1.6" stroke-dasharray="2 1.5"/>' +
            '<path d="M17 4v6M14 7h6" stroke="#1FAA62" stroke-width="2.2" stroke-linecap="round"/>',
      lock: '<rect x="6" y="11" width="12" height="9" rx="2" fill="#7A8B96" stroke="#3E4A52" stroke-width="1.3"/>' +
            '<path d="M8.5 11 V8 a3.5 3.5 0 0 1 7 0v3" fill="none" stroke="#3E4A52" stroke-width="1.7" stroke-linecap="round"/>',
      play: '<path d="M8 5l12 7-12 7z" fill="#fff"/>',
      shop: '<path d="M5 8h14l-1.2 11H6.2z" fill="none" stroke="' + c + '" stroke-width="2" stroke-linejoin="round"/>' +
            '<path d="M8 8 V6 a4 4 0 0 1 8 0v2" fill="none" stroke="' + c + '" stroke-width="2" stroke-linecap="round"/>',
      help: '<circle cx="12" cy="12" r="9" fill="none" stroke="' + c + '" stroke-width="2"/>' +
            '<path d="M9.5 10a2.5 2.5 0 1 1 3.2 2.4c-.7.3-1.2.8-1.2 1.6V15" fill="none" stroke="' + c + '" stroke-width="2" stroke-linecap="round"/>' +
            '<circle cx="12" cy="18" r="1" fill="' + c + '"/>',
      close: '<path d="M6 6l12 12M18 6L6 18" stroke="' + c + '" stroke-width="2.3" stroke-linecap="round"/>',
      star: '<path d="M12 2.5l2.6 6.3 6.9.6-5.2 4.5 1.6 6.7L12 17.2 6.1 20.6 7.7 13.9 2.5 9.4l6.9-.6z" fill="#F5C400" stroke="#C48A00" stroke-width="1"/>',
      starOff: '<path d="M12 2.5l2.6 6.3 6.9.6-5.2 4.5 1.6 6.7L12 17.2 6.1 20.6 7.7 13.9 2.5 9.4l6.9-.6z" fill="#D5D8DE" stroke="#B0B6BE" stroke-width="1"/>'
    };
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (icons[name] || '') + '</svg>';
  }

  function ticketSVG() {
    return '<svg class="ticket-svg" viewBox="0 0 32 24" aria-hidden="true">' +
      '<defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#FFE56A"/><stop offset="1" stop-color="#F5C400"/></linearGradient></defs>' +
      '<path d="M3 5h20c0 2.4 2.2 3.6 2.2 6S23 14.6 23 17H3c0-2.2 2-3.4 2-6S3 7.2 3 5z" fill="url(#tg)" stroke="#C48A00" stroke-width="1.3"/>' +
      '<path d="M13 6v12" stroke="#C48A00" stroke-width="1.1" stroke-dasharray="2 2" opacity=".7"/>' +
      '<circle cx="9" cy="12" r="2.2" fill="none" stroke="#C48A00" stroke-width="1.1"/>' +
    '</svg>';
  }

  function crateSVG() {
    return '<svg class="crate-svg" viewBox="0 0 64 64" aria-hidden="true">' +
      '<defs><linearGradient id="cr" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#D9A15A"/><stop offset="1" stop-color="#8B5A2B"/></linearGradient></defs>' +
      '<rect x="6" y="8" width="52" height="48" rx="4" fill="url(#cr)" stroke="#5C3A18" stroke-width="2"/>' +
      '<path d="M6 20h52M6 44h52M20 8v48M44 8v48M10 12l44 40M54 12L10 52" stroke="#5C3A18" stroke-width="1.6" opacity=".55"/>' +
      '<rect x="6" y="8" width="52" height="8" rx="2" fill="#E8B86A" opacity=".4"/>' +
    '</svg>';
  }

  function coneSVG() {
    return '<svg viewBox="0 0 40 52" class="deco-svg" aria-hidden="true">' +
      '<ellipse cx="20" cy="48" rx="16" ry="3.5" fill="#000" opacity=".2"/>' +
      '<path d="M20 2 L34 46 H6 Z" fill="#F07810" stroke="#C25100" stroke-width="1.3"/>' +
      '<path d="M14 28 h12 l2.2 8 H11.8z" fill="#F4F4F4"/>' +
      '<path d="M16.6 16 h6.8 l1.6 6 H15z" fill="#F4F4F4"/>' +
    '</svg>';
  }

  function treeSVG() {
    return '<svg viewBox="0 0 48 64" class="deco-svg" aria-hidden="true">' +
      '<rect x="21" y="38" width="6" height="20" rx="2" fill="#8B5A2B"/>' +
      '<circle cx="24" cy="28" r="16" fill="#17A85C"/>' +
      '<circle cx="16" cy="24" r="10" fill="#2FBF70"/>' +
      '<circle cx="32" cy="22" r="11" fill="#0E8A48"/>' +
      '<circle cx="24" cy="18" r="8" fill="#5FDC94" opacity=".8"/>' +
    '</svg>';
  }

  function bollardSVG() {
    return '<svg viewBox="0 0 28 48" class="deco-svg" aria-hidden="true">' +
      '<ellipse cx="14" cy="44" rx="10" ry="3" fill="#000" opacity=".18"/>' +
      '<rect x="8" y="10" width="12" height="32" rx="3" fill="#E8EEF3" stroke="#8A93A0" stroke-width="1.2"/>' +
      '<rect x="6" y="6" width="16" height="8" rx="3" fill="#F4F7FA" stroke="#8A93A0" stroke-width="1.2"/>' +
      '<rect x="8" y="22" width="12" height="5" fill="#E23B3B"/>' +
    '</svg>';
  }

  function logoSVG() {
    return '<svg class="logo-mark" viewBox="0 0 220 90" aria-hidden="true">' +
      /* water */
      '<ellipse cx="110" cy="78" rx="100" ry="10" fill="#1A7A9E" opacity=".35"/>' +
      /* small ferry */
      '<g transform="translate(18,22) scale(.62)">' +
        '<path d="M20 40 C8 40 4 54 4 70 C4 86 8 100 20 100 L180 104 C210 104 240 86 248 70 C240 54 210 36 180 36 Z" fill="#F07810" stroke="#C25100" stroke-width="4"/>' +
        '<path d="M32 50 C26 50 22 58 22 70 C22 82 26 90 32 90 L172 94 C192 94 214 82 220 70 C214 58 192 48 172 48 Z" fill="#F7F1E4"/>' +
        '<rect x="36" y="54" width="28" height="32" rx="4" fill="#F4F7FA" stroke="#8A93A0"/>' +
        '<rect x="46" y="28" width="12" height="26" rx="2" fill="#F07810" stroke="#C25100"/>' +
        '<rect x="46" y="34" width="12" height="5" fill="#fff"/>' +
        '<rect x="80" y="58" width="28" height="18" rx="3" fill="#E23B3B"/>' +
        '<rect x="116" y="58" width="28" height="18" rx="3" fill="#2F7BF6"/>' +
      '</g></svg>';
  }

  root.Art = {
    PALETTE: PALETTE,
    kindOf: kindOf,
    carSVG: carSVG,
    ferrySVG: ferrySVG,
    ferrySlots: ferrySlots,
    icon: icon,
    ticketSVG: ticketSVG,
    crateSVG: crateSVG,
    coneSVG: coneSVG,
    treeSVG: treeSVG,
    bollardSVG: bollardSVG,
    logoSVG: logoSVG,
    handSVG: handSVG,
    lockBadge: lockBadge,
    keyBadge: keyBadge,
    gateSVG: gateSVG,
    muteIcon: muteIcon
  };

  function handSVG() {
    return '<svg class="hand-svg" viewBox="0 0 80 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M28 38 V16 a6 6 0 0 1 12 0 V38" fill="#FFE7C2" stroke="#C48A4A" stroke-width="2"/>' +
      '<path d="M40 36 V12 a6 6 0 0 1 12 0 V36" fill="#FFE7C2" stroke="#C48A4A" stroke-width="2"/>' +
      '<path d="M52 38 V18 a6 6 0 0 1 12 0 V42" fill="#FFE7C2" stroke="#C48A4A" stroke-width="2"/>' +
      '<path d="M20 44 V32 a6 6 0 0 1 12 0 V46" fill="#FFE7C2" stroke="#C48A4A" stroke-width="2"/>' +
      '<path d="M18 44 h46 c8 0 14 6 14 14 v8 c0 14-12 22-26 22 h-16 c-16 0-28-8-30-22 v-8 c0-8 6-14 12-14z" fill="#FFE7C2" stroke="#C48A4A" stroke-width="2"/>' +
      '<circle cx="58" cy="58" r="3.2" fill="#E8B48A"/>' +
      '</svg>';
  }
  function lockBadge() {
    return '<svg class="badge-svg" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="14" width="20" height="14" rx="3" fill="#F5C400" stroke="#8A6400" stroke-width="1.5"/><path d="M10 14 V11 a6 6 0 0 1 12 0 v3" fill="none" stroke="#8A6400" stroke-width="2.4"/><circle cx="16" cy="21" r="2.2" fill="#8A6400"/></svg>';
  }
  function keyBadge() {
    return '<svg class="badge-svg" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="16" r="6" fill="#F5C400" stroke="#8A6400" stroke-width="1.6"/><circle cx="11" cy="16" r="2.2" fill="#fff"/><rect x="16" y="14.2" width="12" height="3.6" rx="1" fill="#F5C400" stroke="#8A6400" stroke-width="1"/><rect x="23" y="17.6" width="2" height="4" fill="#F5C400"/><rect x="26.5" y="17.6" width="2" height="3" fill="#F5C400"/></svg>';
  }
  function gateSVG() {
    return '<svg class="gate-svg" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="6" y="8" width="8" height="64" rx="2" fill="#C48A4A" stroke="#6E4520"/>' +
      '<rect x="66" y="8" width="8" height="64" rx="2" fill="#C48A4A" stroke="#6E4520"/>' +
      '<rect x="10" y="18" width="60" height="36" fill="#E23B3B"/>' +
      '<rect x="10" y="26" width="60" height="8" fill="#fff"/>' +
      '<rect x="10" y="42" width="60" height="8" fill="#fff"/>' +
      '<rect x="10" y="18" width="60" height="36" fill="none" stroke="#8A1218" stroke-width="2"/>' +
      '</svg>';
  }
  function muteIcon(kind, muted) {
    var body = kind === 'bgm'
      ? '<path d="M8 14h6l8-6v20l-8-6H8z" fill="currentColor"/>'
      : '<path d="M8 13h5l7-6v18l-7-6H8z" fill="currentColor"/><path d="M22 12 c3 2 3 8 0 10" fill="none" stroke="currentColor" stroke-width="2"/>';
    var slash = muted ? '<path d="M7 25 L25 7" stroke="#E23B3B" stroke-width="3" stroke-linecap="round"/>' : '';
    return '<svg class="ico" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">' + body + slash + '</svg>';
  }
})(typeof self !== 'undefined' ? self : this);
