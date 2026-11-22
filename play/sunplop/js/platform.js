/* Platform layer: durable storage, store age signals, device info. Works in a plain browser (web build, tests)
 * and inside the Capacitor app (window.SunplopNative from js/native.js). */
(function (root) {
  'use strict';
  var N = root.SunplopNative || null, NATIVE = !!(N && N.isNative), OS = NATIVE ? N.platform : 'web';
  var KEYS = ['sunplop:v2'];

  // ---------- durable storage (B10) ----------
  // In the app the save game lives in @capacitor/preferences (Android SharedPreferences / iOS UserDefaults): iOS may purge
  // WKWebView localStorage under low disk, which would lose purchased Rays. localStorage is kept as a synchronous mirror,
  // so the game code can keep reading synchronously. First native launch migrates an existing web-storage save once.
  var chain = Promise.resolve();
  var Store = {
    native: NATIVE,
    migrated: null,
    /** cb runs synchronously on the web; in the app after the native save has been loaded into the mirror. */
    whenReady: function (cb) {
      if (!NATIVE) return cb();
      Promise.all(KEYS.map(function (k) {
        return N.Preferences.get({ key: k }).then(function (r) {
          var web = null; try { web = localStorage.getItem(k); } catch (e) {}
          if (r && r.value != null) { try { localStorage.setItem(k, r.value); } catch (e) {} }
          else if (web != null) { Store.migrated = k; return N.Preferences.set({ key: k, value: web }); }
        });
      })).catch(function () {}).then(function () { cb(); });
    },
    write: function (key, value) {
      try { localStorage.setItem(key, value); } catch (e) {}
      if (NATIVE) chain = chain.then(function () { return N.Preferences.set({ key: key, value: value }); }).catch(function () {});
      return chain;
    },
    clearAll: function () {
      try { KEYS.forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {}
      if (NATIVE) chain = chain.then(function () { return N.Preferences.clear(); }).catch(function () {});
      return chain;
    }
  };

  // ---------- age signals (B9) ----------
  // Only the derived flag ('child' < 13, 'minor' 13-17, 'adult', 'unknown') is kept, in memory; it is never sent anywhere.
  var Age = {
    flag: 'unknown', source: 'none',
    _p: null,
    /** Asks the store once per launch (iOS may show the Declared Age Range sheet); later callers share the result. */
    check: function () {
      if (!NATIVE || !N.AgeSignals) return Promise.resolve(Age.flag);
      if (Age._p) return Age._p;
      return (Age._p = N.AgeSignals.check().then(function (r) {
        Age.source = (r && r.status) || 'unavailable';
        if (r && r.status === 'shared') {
          var lo = r.lower == null ? null : +r.lower, up = r.upper == null ? null : +r.upper;
          if (lo == null && up == null) Age.flag = 'unknown';
          else if ((up != null && up < 13) || lo == null) Age.flag = 'child';
          else if (lo < 18) Age.flag = 'minor';
          else Age.flag = 'adult';
        }
        return Age.flag;
      }).catch(function () { Age.source = 'error'; return Age.flag; }));
    }
  };

  // ---------- links ----------
  function openUrl(url) {
    if (NATIVE && N.Browser && /^https?:/.test(url)) return N.Browser.open({ url: url });
    if (/^mailto:/.test(url)) { location.href = url; return Promise.resolve(); }
    root.open(url, '_blank', 'noopener'); return Promise.resolve();
  }

  root.Platform = { native: NATIVE, os: OS, N: N, Store: Store, Age: Age, openUrl: openUrl };
  root.SunplopStore = Store;
})(typeof self !== 'undefined' ? self : this);
