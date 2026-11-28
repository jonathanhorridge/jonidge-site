/* Platform layer: durable storage, haptics, share, back button, status bar. Plain browser = safe fallbacks (web drop, tests).
   Inside the Capacitor app, js/native.js (bundled from native/entry.js) provides window.HexglenNative. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = { create: factory };
  else root.HHPlatform = factory(root.HexglenNative || null, root);
})(typeof self !== 'undefined' ? self : this, function (N, root) {
  'use strict';
  var NATIVE = !!(N && N.isNative), OS = NATIVE ? N.platform : 'web';
  var PREFIX = 'hexglen.v1.', chain = Promise.resolve();

  var Store = {
    native: NATIVE,
    /* In the app the save lives in @capacitor/preferences (SharedPreferences / UserDefaults) because iOS can purge WKWebView
       localStorage; localStorage stays as a synchronous mirror, loaded once before the UI starts. */
    whenReady: function (cb) {
      if (!NATIVE) return cb();
      N.Preferences.keys().then(function (r) {
        return Promise.all((r.keys || []).filter(function (k) { return k.indexOf(PREFIX) === 0; }).map(function (k) {
          return N.Preferences.get({ key: k }).then(function (v) { if (v && v.value != null) try { root.localStorage.setItem(k, v.value); } catch (e) {} });
        }));
      }).catch(function () {}).then(function () { cb(); });
    },
    write: function (key, value) { if (NATIVE) chain = chain.then(function () { return N.Preferences.set({ key: key, value: value }); }).catch(function () {}); },
    remove: function (key) { if (NATIVE) chain = chain.then(function () { return N.Preferences.remove({ key: key }); }).catch(function () {}); },
    clearAll: function () { if (NATIVE) chain = chain.then(function () { return N.Preferences.clear(); }).catch(function () {}); }
  };

  var haptics = true;
  /* kinds: tap (light), place (medium), success, big */
  function haptic(kind) {
    if (!haptics) return;
    try {
      if (NATIVE && N.Haptics) {
        if (kind === 'success') N.Haptics.notification({ type: N.NotificationType.Success });
        else N.Haptics.impact({ style: kind === 'place' || kind === 'big' ? N.ImpactStyle.Medium : N.ImpactStyle.Light });
      } else if (root.navigator && root.navigator.vibrate) root.navigator.vibrate(kind === 'success' || kind === 'big' ? [10, 40, 18] : 10);
    } catch (e) {}
  }
  function share(text) {
    if (NATIVE && N.Share) return N.Share.share({ text: text }).catch(function () {});
    if (root.navigator && root.navigator.share) return root.navigator.share({ text: text }).catch(function () {});
    return Promise.reject(new Error('no-share'));
  }
  /* Android hardware/gesture back: handler(canGoBack) is called; it returns true if it handled the press, else the app exits. */
  function onBack(handler) {
    if (!NATIVE || !N.App) return;
    N.App.addListener('backButton', function () { if (!handler()) { try { N.App.exitApp(); } catch (e) {} } });
  }
  function onResume(fn) { if (NATIVE && N.App) N.App.addListener('appStateChange', function (s) { if (s && s.isActive) fn(); }); else if (root.document) root.document.addEventListener('visibilitychange', function () { if (!root.document.hidden) fn(); }); }
  function setup() {
    if (!NATIVE) return;
    try { N.StatusBar.setStyle({ style: N.Style.Light }); } catch (e) {}
    try { N.SplashScreen.hide(); } catch (e) {}
    root.document.documentElement.classList.add('native', 'os-' + OS);
  }
  return { native: NATIVE, os: OS, N: N, Store: Store, haptic: haptic, setHaptics: function (on) { haptics = !!on; }, share: share, onBack: onBack, onResume: onResume, setup: setup };
});
