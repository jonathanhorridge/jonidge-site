/* Rewarded ads + purchases facade. In a browser (and the web build) everything is SIMULATED and labelled as a test.
 * In the Capacitor app the same calls go to @capacitor-community/admob (rewarded only; no banners, no interstitials) and
 * RevenueCat, exactly like Sunplop's ads.js / iap.js, after Google UMP consent. Native glue arrives with the first store build. */
(function (root) {
  'use strict';
  var N = root.PocketNative || null, NATIVE = !!(N && N.isNative);
  var Ads = {
    native: NATIVE,
    simulated: !(NATIVE && N.AdMob && N.AdMob.showRewarded),   // stays simulated until the owner approves the AdMob setup
    /** resolves true if the player earned the reward. ui(cb) is the simulated "test ad" screen used in the browser. */
    showRewarded: function (kind, ui) {
      if (NATIVE && N.AdMob && N.AdMob.showRewarded) return N.AdMob.showRewarded(kind).then(function (r) { return !!r; }).catch(function () { return false; });
      return new Promise(function (res) { if (ui) ui(res); else res(true); });
    }
  };
  var IAP = {
    native: NATIVE, simulated: !(NATIVE && N.Purchases && N.Purchases.buy),
    buy: function (sku, ui) {
      if (NATIVE && N.Purchases && N.Purchases.buy) return N.Purchases.buy(sku).then(function (r) { return !!r; }).catch(function () { return false; });
      return new Promise(function (res) { if (ui) ui(res); else res(true); });
    },
    restore: function () { if (NATIVE && N.Purchases && N.Purchases.restore) return N.Purchases.restore().catch(function () { return {}; }); return Promise.resolve({}); }
  };
  root.PB_ADS = Ads; root.PB_IAP = IAP;
})(typeof self !== 'undefined' ? self : this);
