/* Gentle return reminders (opt-in). At most 4 are scheduled (ids 1-4), never inside quiet hours (21:00-08:00), at least
 * 2 hours apart, only within the next ~2 days, and the whole plan is rebuilt every time the player leaves, so a player who
 * stays away simply stops hearing from us after the last one. Pure function so it is unit-testable. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./data.js'), require('./sim.js'));
  else root.PB_REMIND = factory(root.PB_DATA, root.PB_SIM);
})(typeof self !== 'undefined' ? self : this, function (D, S) {
  'use strict';
  var HOUR = 3600e3, DAY = 24 * HOUR, MAX = 4, MIN_GAP = 2 * HOUR, HORIZON = 2 * DAY;
  var QUIET_FROM = 21, QUIET_TO = 8;
  function quiet(ms) { var h = new Date(ms).getHours(); return h >= QUIET_FROM || h < QUIET_TO; }
  /** move a time out of quiet hours: to 08:30 the next morning (or this morning) */
  function shift(ms) {
    if (!quiet(ms)) return ms;
    var d = new Date(ms); if (d.getHours() >= QUIET_FROM) d.setDate(d.getDate() + 1); d.setHours(8, 30, 0, 0); return d.getTime();
  }
  function atNext(now, hour, minute) { var d = new Date(now); d.setHours(hour, minute || 0, 0, 0); if (d.getTime() <= now) d.setDate(d.getDate() + 1); return d.getTime(); }
  var COPY = {
    basket: function (u) { return { title: 'Baskets are full', body: u.text + '. Your burrow has been busy; no rush at all.' }; },
    dig: function () { return { title: 'Tunnel finished', body: 'Your new tunnel is ready for a cosy room.' }; },
    visitor: function () { return { title: 'Knock, knock', body: 'A little friend is waiting at your burrow door.' }; },
    rare: function () { return { title: 'Something sparkly tonight', body: 'A rare guest is on their way. Leave the lantern on.' }; },
    daily: function (u, s, now) { var g = S.tomorrowGift(s, now); return { title: 'Your visit gift is ready', body: 'Day ' + g.day + ' of your calendar is waiting. Skipped days never reset it.' }; },
    gift: function (u) { return { title: 'A little present', body: u.text + ' is ready to collect.' }; }
  };
  /** Returns [{ id, at, title, body }] sorted by time. */
  function plan(s, now) {
    if (!s.settings.notifications || s.tut < 5) return [];
    var ups = S.nextUps(s, now), cands = [];
    var rank = { dig: 0, basket: 1, rare: 2, visitor: 3, gift: 4, daily: 5 };
    ups.forEach(function (u) {
      if (u.at - now < 45 * 60000) return;                                   // they are about to see it anyway
      var c = COPY[u.kind](u, s, now); cands.push({ kind: u.kind, at: shift(u.at + (u.kind === 'basket' ? 20 * 60000 : 0)), title: c.title, body: c.body, rank: rank[u.kind] });
    });
    // always one calm "day 2 / day 3" return nudge in the late morning
    var morning = shift(atNext(now + 6 * HOUR, 10, 0)); cands.push({ kind: 'return', at: morning, title: 'Pocket Burrow', body: 'Your friends have been busy. Come and see what they left for you.', rank: 6 });
    cands = cands.filter(function (c) { return c.at - now < HORIZON && c.at > now + 30 * 60000; });
    cands.sort(function (a, b) { return a.rank - b.rank || a.at - b.at; });
    var out = [];
    cands.forEach(function (c) {
      if (out.length >= MAX) return;
      if (out.some(function (o) { return Math.abs(o.at - c.at) < MIN_GAP; })) return;   // never two pings close together
      if (out.some(function (o) { return o.kind === c.kind && (c.kind !== 'basket' || Math.abs(o.at - c.at) < 6 * HOUR); })) return;
      out.push(c);
    });
    out.sort(function (a, b) { return a.at - b.at; });
    return out.map(function (c, i) { return { id: i + 1, at: c.at, title: c.title, body: c.body, kind: c.kind }; });
  }
  return { plan: plan, quiet: quiet, shift: shift, MAX: MAX, MIN_GAP: MIN_GAP };
});
