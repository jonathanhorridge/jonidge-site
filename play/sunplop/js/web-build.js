/* Injected only into the static web build (tools/build-web.sh). Not used by the native app.
 * Disables ads and live billing, keeps clearly labelled simulated purchases, and no-ops native plugins. */
(function (root) {
  'use strict';
  root.SUNPLOP_WEB_BUILD = true;

  var C = root.SUNPLOP_CONFIG;
  if (C) {
    if (C.purchases) {
      C.purchases.mode = 'mock';
      C.purchases.revenueCatKeyIOS = '';
      C.purchases.revenueCatKeyAndroid = '';
    }
    if (C.ads) {
      C.ads.useTestAds = true;
      C.ads.units = { android: {}, ios: {} };
      C.ads.testUnits = { android: {}, ios: {} };
    }
  }

  // Ads: never request AdMob / UMP / ATT. Hide the banner. Skip automatic interstitials.
  // "Watch an ad" still uses the in-game placeholder so testers can claim daily free Rays, with no network.
  if (root.Ads) {
    var Ads = root.Ads;
    Ads.enabled = false;
    Ads.native = false;
    Ads.started = true;
    Ads.sdkReady = false;
    Ads.canRequest = false;
    Ads.bannerWanted = false;
    Ads.bannerShown = false;
    Ads.start = function () { return Promise.resolve(Ads); };
    Ads.setBanner = function () {};
    Ads._showBanner = function () {};
    Ads._loadInterstitial = function () {};
    Ads._loadRewarded = function () {};
    Ads._initSdk = function () { return Promise.resolve(); };
    Ads.showPrivacyOptions = function () { return Promise.resolve(false); };
    Ads.canAskTracking = function () { return Promise.resolve(false); };
    Ads.requestTracking = function () { return Promise.resolve('unsupported'); };
    Ads.showRewarded = function (placement, ui) { return ui ? ui(placement) : Promise.resolve(false); };
    Ads.showInterstitial = function () { return Promise.resolve(); };
  }

  // IAP: simulated test mode only. No RevenueCat configure / purchase / restore calls.
  if (root.IAP) {
    var IAP = root.IAP;
    IAP.mode = 'mock';
    IAP.MOCK = true;
    IAP.ready = true;
    IAP.init = function () { IAP.ready = true; return Promise.resolve(IAP); };
    IAP.customerInfo = function () { return Promise.resolve(null); };
    IAP.restore = function () { return Promise.resolve(null); };
    IAP.storeProduct = function () { return null; };
  }

  // Belt and suspenders: native plugins exist in the Capacitor web bundle but must not be called.
  var N = root.SunplopNative;
  if (N) {
    N.isNative = false;
    N.platform = 'web';
    N.AdMob = null;
    N.Purchases = null;
    N.LocalNotifications = null;
    N.AgeSignals = null;
  }
})(typeof self !== 'undefined' ? self : this);
