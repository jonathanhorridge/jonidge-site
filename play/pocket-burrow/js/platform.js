/* Platform layer (mirrors Sunplop): durable storage, notifications, native bridge detection.
 * In a browser: localStorage. In the Capacitor app: @capacitor/preferences through window.PocketNative (native/entry.js, added
 * with the first store build), with localStorage kept as a synchronous mirror so game code stays synchronous. */
(function (root) {
  'use strict';
  var N = root.PocketNative || null, NATIVE = !!(N && N.isNative), KEY = (root.PB_CONFIG || {}).storageKey || 'pocketburrow:v1';
  var chain = Promise.resolve();
  var Store = {
    native: NATIVE,
    whenReady: function (cb) {
      if (!NATIVE) return cb();
      N.Preferences.get({ key: KEY }).then(function (r) {
        if (r && r.value != null) { try { localStorage.setItem(KEY, r.value); } catch (e) {} }
        else { var web = null; try { web = localStorage.getItem(KEY); } catch (e) {} if (web != null) return N.Preferences.set({ key: KEY, value: web }); }
      }).catch(function () {}).then(function () { cb(); });
    },
    read: function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
    write: function (value) {
      try { localStorage.setItem(KEY, value); } catch (e) {}
      if (NATIVE) chain = chain.then(function () { return N.Preferences.set({ key: KEY, value: value }); }).catch(function () {});
    },
    clear: function () { try { localStorage.removeItem(KEY); } catch (e) {} if (NATIVE) chain = chain.then(function () { return N.Preferences.remove({ key: KEY }); }).catch(function () {}); }
  };
  var Notify = {
    supported: NATIVE && !!N.LocalNotifications,
    /** plan: [{ id, at (ms), title, body }]. Replaces everything previously scheduled. */
    schedule: function (plan) {
      if (!Notify.supported) return Promise.resolve(false);
      return N.LocalNotifications.cancel({ notifications: [1, 2, 3, 4].map(function (id) { return { id: id }; }) }).catch(function () {}).then(function () {
        return N.LocalNotifications.schedule({ notifications: plan.map(function (p) { return { id: p.id, title: p.title, body: p.body, schedule: { at: new Date(p.at) } }; }) });
      }).then(function () { return true; }).catch(function () { return false; });
    },
    request: function () { if (!Notify.supported) return Promise.resolve(false); return N.LocalNotifications.requestPermissions().then(function (r) { return r.display === 'granted'; }).catch(function () { return false; }); }
  };
  root.PB_PLATFORM = { native: NATIVE, os: NATIVE ? N.platform : 'web', Store: Store, Notify: Notify };
})(typeof self !== 'undefined' ? self : this);
