/* Daily reminder: one optional local notification a day ("Today's Sunplop is ready"), via @capacitor/local-notifications.
 * Everything happens on the device: no server, no push service, no token, nothing is sent anywhere. Opt-in only:
 * the app never asks on first launch (see app.js maybeAskReminder / Settings). In a plain browser this is a no-op.
 *
 * Scheduling: one-shot notifications for the next DAYS_AHEAD days (one per day at the chosen time, inexact alarm,
 * no SCHEDULE_EXACT_ALARM permission). Every app start / resume / daily solve / settings change cancels and re-plans
 * them, so a day whose puzzle is already solved gets no reminder, and the reminders stop by themselves after a week
 * without opening the app (no endless nagging). */
(function (root) {
  'use strict';
  var P = root.Platform || { native: false, os: 'web' }, N = P.N;
  var LN = P.native && N && N.LocalNotifications ? N.LocalNotifications : null;
  var BASE_ID = 7101, DAYS_AHEAD = 7, CHANNEL = 'daily_reminder';
  var IDS = []; for (var i = 0; i < DAYS_AHEAD; i++) IDS.push(BASE_ID + i);
  var chain = Promise.resolve(), channelMade = false;

  function parseTime(t) { var m = /^(\d\d?):(\d\d)$/.exec(t || '') || [0, 19, 0]; return [Math.min(23, +m[1]), Math.min(59, +m[2])]; }

  /** Pure planner (unit-tested). o: { now: Date, time: 'HH:MM', solvedToday, streak, neutral, t: I18N.t }.
   *  streak = the streak the next reminder would keep alive (0 = none). Returns at most one item per calendar day. */
  function plan(o) {
    var hm = parseTime(o.time), out = [], t = o.t || function (k) { return k; };
    for (var d = 0; out.length < DAYS_AHEAD && d <= DAYS_AHEAD; d++) {
      var at = new Date(o.now.getFullYear(), o.now.getMonth(), o.now.getDate() + d, hm[0], hm[1], 0, 0);
      if (d === 0 && (o.solvedToday || at.getTime() <= o.now.getTime() + 60000)) continue;
      // The streak line only fits the first reminder that can still save the streak: today (not solved yet) or,
      // when today is solved, tomorrow. Never for children / minors (no streak pressure), never below 2 days.
      var streakDay = (d === 0 && !o.solvedToday) || (d === 1 && o.solvedToday);
      var useStreak = !o.neutral && o.streak >= 2 && streakDay && out.length === 0;
      out.push({ id: BASE_ID + out.length, at: at, title: t('reminder_title'),
        body: useStreak ? t('reminder_streak', { n: o.streak }) : t('reminder_body') });
    }
    return out;
  }

  function serial(fn) { chain = chain.then(fn).catch(function (e) { R.lastError = String(e && e.message || e); }); return chain; }

  var R = {
    supported: !!LN, DAYS_AHEAD: DAYS_AHEAD, IDS: IDS, CHANNEL: CHANNEL,
    DEFAULT_TIME: '19:00', PRESETS: ['08:00', '12:00', '17:00', '19:00', '20:00', '21:00'],
    lastError: null, scheduled: [],
    plan: plan,
    /** 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'unsupported' */
    permission: function () {
      if (!LN) return Promise.resolve('unsupported');
      return LN.checkPermissions().then(function (r) { return (r && r.display) || 'prompt'; }).catch(function () { return 'prompt'; });
    },
    /** Shows the system prompt (Android 13+ POST_NOTIFICATIONS / iOS authorization). Resolves to the new state. */
    request: function () {
      if (!LN) return Promise.resolve('unsupported');
      return LN.requestPermissions().then(function (r) { return (r && r.display) || 'denied'; }).catch(function () { return 'denied'; });
    },
    ensureChannel: function (t) {
      if (!LN || P.os !== 'android' || channelMade || !LN.createChannel) return Promise.resolve();
      return LN.createChannel({ id: CHANNEL, name: t('reminder_channel'), description: t('reminder_channel_desc'), importance: 3, visibility: 1, vibration: false })
        .then(function () { channelMade = true; }).catch(function () {});
    },
    cancelAll: function () {
      if (!LN) return Promise.resolve();
      return serial(function () { R.scheduled = []; return LN.cancel({ notifications: IDS.map(function (id) { return { id: id }; }) }); });
    },
    /** Re-plan from scratch. s: { on, time, solvedToday, streak, neutral, t }. Never prompts for permission. */
    sync: function (s) {
      if (!LN) return Promise.resolve([]);
      return serial(function () {
        return LN.cancel({ notifications: IDS.map(function (id) { return { id: id }; }) }).catch(function () {}).then(function () {
          R.scheduled = [];
          if (!s.on) return;
          return R.permission().then(function (perm) {
            if (perm !== 'granted') return;
            return R.ensureChannel(s.t).then(function () {
              var items = plan({ now: new Date(), time: s.time, solvedToday: s.solvedToday, streak: s.streak, neutral: s.neutral, t: s.t });
              var list = items.map(function (n) {
                return { id: n.id, title: n.title, body: n.body, schedule: { at: n.at, allowWhileIdle: true },
                  isExactNotification: false,            // inexact alarm: no SCHEDULE_EXACT_ALARM permission needed (Play policy)
                  channelId: CHANNEL, smallIcon: 'ic_stat_sunplop', iconColor: '#FF9F1C', autoCancel: true,
                  extra: { sunplop: 'daily' } };
              });
              if (!list.length) return;
              return LN.schedule({ notifications: list }).then(function () { R.scheduled = items; });
            });
          });
        });
      }).then(function () { return R.scheduled; });
    },
    /** fn() runs when the player taps one of our reminders (also on a cold start: the plugin retains the event). */
    onTap: function (fn) {
      if (!LN || !LN.addListener) return;
      LN.addListener('localNotificationActionPerformed', function (ev) {
        var n = ev && ev.notification, ex = n && n.extra;
        if ((ex && ex.sunplop === 'daily') || (n && IDS.indexOf(+n.id) >= 0)) fn();
      });
    }
  };
  root.Reminders = R;
})(typeof self !== 'undefined' ? self : this);
