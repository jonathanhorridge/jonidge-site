/* Build/runtime config. Display name lives here. */
(function (root) {
  'use strict';
  root.KC_CONFIG = {
    version: '0.1.0',
    title: 'Gust Rally',            // final name ("Kite Clash" was taken on both stores, see docs/NAME-CHECK.md)
    appId: 'com.jonidge.gustrally',
    brand: 'Jonidge',
    supportEmail: 'jonidge@yahoo.com',
    copyrightYear: 2026,
    storageKey: 'gustrally:v1',
    // Monetisation plumbing: everything is OFF. No real ad unit or store ids exist yet (see docs/MONETIZATION.md).
    //  ads.mode:       'off' (default) | 'mock' (browser/debug test only, simulated ad, nothing is requested) | 'live' (needs the AdMob plugin + real unit ids)
    //  purchases.mode: 'off' (default) | 'mock' (browser/debug test only, simulated purchase) | 'store' (needs the RevenueCat plugin + real keys)
    ads: { mode: 'off', maxRewardedPerDay: 3, maxAdContentRating: 'General', units: { android: { rewarded: '' }, ios: { rewarded: '' } } },
    purchases: { mode: 'off', revenueCatKeyIOS: '', revenueCatKeyAndroid: '', products: [{ sku: 'cosmetic_pack_sky', storeId: '' }] },
    backend: { mode: 'local', url: '' }   // online ghosts/leaderboard stay OFF until mode='worker' AND url is the deployed gust-rally-api Worker (server/README.md)
  };
})(this);
