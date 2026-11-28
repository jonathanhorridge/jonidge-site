/* Build/runtime configuration (same shape as Sunplop's config.js). Display name and every monetisation switch live here.
 *
 * FEATURE FLAGS (native app only; the web build is always a clearly labelled, simulated test mode):
 *   features.ads       false = no ad SDK calls at all and no ad buttons in the app (default until Jonathan approves)
 *                      true  = Google AdMob rewarded ads, after Google UMP consent (and Apple ATT on iOS)
 *   features.purchases false = no Glowberry shop in the app (default until Jonathan approves)
 *                      true  = store billing through RevenueCat (needs the RevenueCat public SDK keys below)
 *
 * Ad unit ids: `testUnits` are Google's OFFICIAL PUBLIC TEST ids (https://developers.google.com/admob/android/test-ads,
 * .../ios/test-ads). They are used by the web build, debug builds and any build where useTestAds is true. The real ids go
 * into `units` only when Jonathan has an AdMob account (docs/RELEASE.md). No live key lives in this repo. */
(function (root) {
  'use strict';
  root.PB_CONFIG = {
    version: '0.3.0',                       // keep in sync with android versionName / iOS MARKETING_VERSION
    brand: 'Pocket Burrow',
    publisher: 'Jonidge',
    storageKey: 'pocketburrow:v1',
    supportEmail: 'jonidge@yahoo.com',
    legalBase: 'legal/',                    // bundled pages (www/legal on the web, in-app copy with address in the native apps)
    features: { ads: false, purchases: false },
    ads: {
      useTestAds: null,                     // null = automatic: test ads everywhere except a native RELEASE build with real units
      testUnits: {
        android: { appId: 'ca-app-pub-3940256099942544~3347511713', rewarded: 'ca-app-pub-3940256099942544/5224354917' },
        ios:     { appId: 'ca-app-pub-3940256099942544~1458002511', rewarded: 'ca-app-pub-3940256099942544/1712485313' }
      },
      units: { android: { rewarded: '' }, ios: { rewarded: '' } },   // REAL ids: Jonathan's AdMob account (docs/RELEASE.md)
      maxAdContentRating: 'General',        // cosy, all-ages game: only G-rated ads
      consentDebugGeography: '',            // 'EEA' or 'US' to preview the consent form in a debug build
      testDeviceIds: [],
      loadTimeoutMs: 8000
    },
    purchases: {
      revenueCatKeyIOS: '', revenueCatKeyAndroid: '',   // RevenueCat PUBLIC SDK keys (appl_... / goog_...), from Jonathan's RevenueCat project
      supporterEntitlement: 'supporter'                  // RevenueCat entitlement attached to the one-time Supporter pack
    }
  };
})(typeof self !== 'undefined' ? self : this);
