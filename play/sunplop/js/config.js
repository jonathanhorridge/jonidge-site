/* Build/runtime configuration. The iOS RevenueCat public SDK key is live; the Android key stays a placeholder until
 * that app is added. AdMob uses the real app/unit IDs; official Google TEST units are substituted automatically
 * in web and native debug builds so we never request live ads while testing. */
(function (root) {
  'use strict';
  var TEST_UNITS = { android: {}, ios: {} };
  root.SUNPLOP_CONFIG = {
    version: '1.0.0',                              // keep in sync with android versionName / iOS MARKETING_VERSION
    brand: 'Sunplop',
    copyrightYear: 2026,
    supportEmail: 'jonidge@yahoo.com',
    // Hosted policy pages (legal/site/public). null = show the copies bundled in www/legal/ (work offline).
    policyBase: 'https://jonathanhorridge.github.io/sunplop/',
    purchases: {
      // 'auto': RevenueCat when this platform has a real public key. If the key is still a placeholder: simulated
      // test mode in web / native debug only; native release shows the shop as unavailable (never free grants).
      // 'mock' is also forced to unavailable in a native release build. 'store': require RevenueCat or show unavailable.
      mode: 'mock',
      revenueCatKeyIOS: '',
      revenueCatKeyAndroid: '',
      noAdsEntitlement: 'no_ads'
    },
    ads: {
      // 'auto': official test units + isTesting in web / native debug (Capacitor.DEBUG !== false).
      // Native release builds (Capacitor.DEBUG === false) use the live units below. Set true/false to force either mode.
      useTestAds: true,
      units: { android: {}, ios: {} },
      testUnits: TEST_UNITS,
      maxAdContentRating: 'General',
      consentDebugGeography: null,                 // 'EEA' or 'US' to test the UMP forms (debug builds only), null = real location
      testDeviceIds: []
    }
  };
})(typeof self !== 'undefined' ? self : this);
