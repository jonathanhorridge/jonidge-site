/* Gentle return reminders (opt-in, max 3 scheduled, quiet hours 21:00-08:00). Pure function so it is unit-testable. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./data.js'), require('./sim.js'));
  else root.PB_REMIND = factory(root.PB_DATA, root.PB_SIM);
})(typeof self !== 'undefined' ? self : this, function (D, S) {
  'use strict';
  function quiet(ms) { var h = new Date(ms).getHours(); return h >= 21 || h < 8; }
  function shift(ms) { var d = new Date(ms); if (d.getHours() >= 21) d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); if (d.getTime() < ms) d.setDate(d.getDate() + 1); return quiet(ms) ? d.getTime() : ms; }
  function plan(s, now) {
    if (!s.settings.notifications || s.tut < 5) return [];
    var out = [], full = null, dig = null;
    S.eachRoom(s, function (r) { var tf = S.timeToFull(r, now); if (tf > 0 && (full == null || tf < full)) full = tf; });
    if (full != null) out.push({ id: 1, at: shift(now + Math.max(full, 30 * 60000)), title: 'Pocket Burrow', body: 'Your baskets are full and a few friends are waiting. No rush.' });
    s.digs.forEach(function (d) { if (d.end && (dig == null || d.end < dig)) dig = d.end; });
    if (dig) out.push({ id: 2, at: shift(dig), title: 'Pocket Burrow', body: 'Your new tunnel is finished.' });
    var next = new Date(now); next.setDate(next.getDate() + 1); next.setHours(10, 0, 0, 0);
    out.push({ id: 3, at: next.getTime(), title: 'Pocket Burrow', body: 'Someone is knocking at the burrow door.' });
    return out.slice(0, 3);
  }
  return { plan: plan };
});
