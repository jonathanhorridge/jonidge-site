/* Daily reminder: one optional, gentle local notification a day via @capacitor/local-notifications.
   Opt-in only (never asked on first launch), everything stays on the device. On the web it is a no-op.
   Scheduling mirrors Sunplop: one-shot notifications for the next 7 days at the chosen time, re-planned on every app start,
   resume, daily solve or settings change, so a day already solved gets no reminder and reminders stop after a week away. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = { create: factory };
  else root.HHNotify = factory(root.HHPlatform || { native: false, os: 'web', N: null });
})(typeof self !== 'undefined' ? self : this, function (P) {
  'use strict';
  var LN = P.native && P.N && P.N.LocalNotifications ? P.N.LocalNotifications : null;
  var BASE_ID = 8201, DAYS_AHEAD = 7, CHANNEL = 'daily_reminder';
  var IDS = []; for (var i = 0; i < DAYS_AHEAD; i++) IDS.push(BASE_ID + i);
  var chain = Promise.resolve(), channelMade = false;
  var BODIES = [
    'Today\'s little puzzle is ready in the glen.',
    'Your village is waiting. A few quiet minutes?',
    'A new tile bag has arrived. Come and place it.',
    'The villagers have a request for you today.'
  ];
  function parseTime(t) { var m = /^(\d\d?):(\d\d)$/.exec(t || '') || [0, 19, 0]; return [Math.min(23, +m[1]), Math.min(59, +m[2])]; }

  /* Pure planner (unit-tested). o: { now: Date, time: 'HH:MM', solvedToday, streak }.
     Returns at most one item per calendar day, never in the past, nothing for a day already solved. */
  function plan(o) {
    var hm = parseTime(o.time), out = [];
    for (var d = 0; out.length < DAYS_AHEAD && d <= DAYS_AHEAD; d++) {
      var at = new Date(o.now.getFullYear(), o.now.getMonth(), o.now.getDate() + d, hm[0], hm[1], 0, 0);
      if (d === 0 && (o.solvedToday || at.getTime() <= o.now.getTime() + 60000)) continue;
      var streakLine = o.streak >= 2 && out.length === 0;
      out.push({ id: BASE_ID + out.length, at: at, title: 'Hexglen',
        body: streakLine ? 'Keep your ' + o.streak + '-day streak glowing: today\'s puzzle is ready.' : BODIES[(at.getDate() + at.getMonth()) % BODIES.length] });
    }
    return out;
  }
  function serial(fn) { chain = chain.then(fn).catch(function (e) { R.lastError = String(e && e.message || e); }); return chain; }

  var R = {
    supported: !!LN, DAYS_AHEAD: DAYS_AHEAD, IDS: IDS, CHANNEL: CHANNEL, DEFAULT_TIME: '19:00', PRESETS: ['08:00', '12:00', '17:00', '19:00', '20:00', '21:00'],
    lastError: null, scheduled: [], plan: plan,
    permission: function () {
      if (!LN) return Promise.resolve('unsupported');
      return LN.checkPermissions().then(function (r) { return (r && r.display) || 'prompt'; }).catch(function () { return 'prompt'; });
    },
    request: function () {
      if (!LN) return Promise.resolve('unsupported');
      return LN.requestPermissions().then(function (r) { return (r && r.display) || 'denied'; }).catch(function () { return 'denied'; });
    },
    ensureChannel: function () {
      if (!LN || P.os !== 'android' || channelMade || !LN.createChannel) return Promise.resolve();
      return LN.createChannel({ id: CHANNEL, name: 'Daily reminder', description: 'One gentle reminder a day', importance: 3, visibility: 1, vibration: false })
        .then(function () { channelMade = true; }).catch(function () {});
    },
    cancelAll: function () {
      if (!LN) return Promise.resolve();
      return serial(function () { R.scheduled = []; return LN.cancel({ notifications: IDS.map(function (id) { return { id: id }; }) }); });
    },
    /* Re-plan from scratch. s: { on, time, solvedToday, streak, now? }. Never prompts for permission. No-op on web. */
    sync: function (s) {
      if (!LN) return Promise.resolve([]);
      return serial(function () {
        return LN.cancel({ notifications: IDS.map(function (id) { return { id: id }; }) }).catch(function () {}).then(function () {
          R.scheduled = [];
          if (!s.on) return;
          return R.permission().then(function (perm) {
            if (perm !== 'granted') return;
            return R.ensureChannel().then(function () {
              var items = plan({ now: s.now || new Date(), time: s.time, solvedToday: s.solvedToday, streak: s.streak });
              var list = items.map(function (n) {
                return { id: n.id, title: n.title, body: n.body, schedule: { at: n.at, allowWhileIdle: true }, isExactNotification: false,
                  channelId: CHANNEL, smallIcon: 'ic_stat_hexglen', iconColor: '#E07A5F', autoCancel: true, extra: { hexglen: 'daily' } };
              });
              if (!list.length) return;
              return LN.schedule({ notifications: list }).then(function () { R.scheduled = items; });
            });
          });
        });
      }).then(function () { return R.scheduled; });
    },
    onTap: function (fn) {
      if (!LN || !LN.addListener) return;
      LN.addListener('localNotificationActionPerformed', function (ev) {
        var n = ev && ev.notification, ex = n && n.extra;
        if ((ex && ex.hexglen === 'daily') || (n && IDS.indexOf(+n.id) >= 0)) fn();
      });
    }
  };
  return R;
});
