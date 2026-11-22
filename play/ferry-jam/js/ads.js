/* Ad + in-app-purchase STUBS. No ad SDK, no payment SDK, no network calls.
 * Later (Capacitor): replace showRewarded() with AdMob rewarded ads
 * and purchase() with a store plugin (e.g. RevenueCat). Keep the same Promise API. */
(function (root) {
  'use strict';
  var Ads = {
    enabled: true,
    showRewarded: function (placement, ui) { return ui ? ui(placement) : Promise.resolve(true); },
    showInterstitial: function (placement, ui) { return ui ? ui(placement) : Promise.resolve(); }
  };
  var IAP = {
    MOCK: true,
    purchase: function (product, price, confirmUi) {
      return Promise.resolve(confirmUi ? confirmUi(product, price) : true)
        .then(function (ok) { return { ok: !!ok, sku: product.sku, mock: true, receipt: ok ? 'MOCK-' + Date.now() : null }; });
    }
  };
  root.Ads = Ads; root.IAP = IAP;
})(typeof self !== 'undefined' ? self : this);
