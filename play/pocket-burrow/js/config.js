/* Build/runtime configuration (same shape as Sunplop's config.js). No live keys live in this repo:
 * AdMob/RevenueCat ids are added at store-build time. In a browser everything runs in a clearly labelled test mode. */
(function (root) {
  'use strict';
  root.PB_CONFIG = {
    version: '0.1.0',                       // keep in sync with android versionName / iOS MARKETING_VERSION
    brand: 'Pocket Burrow',
    storageKey: 'pocketburrow:v1',
    supportEmail: 'jonidge@yahoo.com',
    purchases: { mode: 'mock', revenueCatKeyIOS: '', revenueCatKeyAndroid: '' },       // mock = simulated in web / native debug only
    ads: { useTestAds: true, units: { android: {}, ios: {} }, maxAdContentRating: 'General' }
  };
})(typeof self !== 'undefined' ? self : this);
