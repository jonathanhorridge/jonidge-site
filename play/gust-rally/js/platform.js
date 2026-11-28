/* Platform layer: durable storage. Works in a plain browser (localStorage) and in the Capacitor app (window.GustNative).
 * In the app the save lives in @capacitor/preferences (Android SharedPreferences / iOS UserDefaults) because iOS may purge
 * WKWebView localStorage under low disk space. localStorage is kept as a synchronous mirror so game code reads synchronously.
 * First native launch migrates an existing web-storage save once. Same approach as Sunplop's platform.js. */
(function (root) {
  'use strict';
  var N = root.GustNative || null, NATIVE = !!(N && N.isNative && N.Preferences);
  var KEYS = [(root.KC_CONFIG && root.KC_CONFIG.storageKey) || 'gustrally:v1'];
  var chain = Promise.resolve();
  var Platform = {
    native: NATIVE, os: NATIVE ? N.platform : 'web', migrated: null,
    /** cb runs synchronously on the web; in the app after the native save has been loaded into the mirror. */
    whenReady: function (cb) {
      if (!NATIVE) return cb();
      var done = false, fin = function () { if (!done) { done = true; cb(); } };
      setTimeout(fin, 2500); // never block the game on a slow bridge
      Promise.all(KEYS.map(function (k) {
        return N.Preferences.get({ key: k }).then(function (r) {
          var web = null; try { web = localStorage.getItem(k); } catch (e) {}
          if (r && r.value != null) { try { localStorage.setItem(k, r.value); } catch (e) {} }
          else if (web != null) { Platform.migrated = k; return N.Preferences.set({ key: k, value: web }); }
        });
      })).catch(function () {}).then(fin);
    },
    write: function (key, value) {
      try { localStorage.setItem(key, value); } catch (e) {}
      if (NATIVE) chain = chain.then(function () { return N.Preferences.set({ key: key, value: value }); }).catch(function () {});
      return chain;
    },
    remove: function (key) {
      try { localStorage.removeItem(key); } catch (e) {}
      if (NATIVE) chain = chain.then(function () { return N.Preferences.remove({ key: key }); }).catch(function () {});
      return chain;
    }
  };
  root.KCPlatform = Platform;
})(typeof self !== 'undefined' ? self : this);
