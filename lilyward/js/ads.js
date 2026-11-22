/* Monetization STUBS - no ad SDK, no payment SDK, no network calls, nothing is charged.
 * Native build plan (same Promise API, swap the bodies):
 *   Ads.showRewarded / showInterstitial -> @capacitor-community/admob (rewarded + interstitial)
 *   IAP.purchase / restore             -> @revenuecat/purchases-capacitor (anonymous user id)
 * Placements: rewarded 'revive', 'double_flies', 'daily_pearls', 'free_flies'; interstitial 'level_end'. */
(function (root) {
  'use strict';
  var CONFIG = {
    interstitial: { firstAfterLevel: 3, everyNthLevelEnd: 2, minSecondsBetween: 120 },
    // optional reward videos in the Shop: several per day, short cooldown between them
    rewardedLimits: {
      daily_pearls: { perDay: 5, cooldownSec: 60, amount: 10 },
      free_flies: { perDay: 5, cooldownSec: 60, amount: 40 }
    },
    products: [
      { sku: 'remove_ads', name: 'Remove Ads', price: 'CHF 3.00', type: 'non_consumable', desc: 'No more forced ads. Bonus videos stay optional.' },
      { sku: 'starter_pack', name: 'Starter Pond Pack', price: 'CHF 2.00', type: 'non_consumable', desc: '100 pearls + 500 flies + Reed Crown. One time only.', pearls: 100, flies: 500, hat: 'crown' },
      { sku: 'pearls_small', name: 'Pouch of Pearls', price: 'CHF 1.00', type: 'consumable', desc: '60 pearls', pearls: 60 },
      { sku: 'pearls_big', name: 'Clam of Pearls', price: 'CHF 5.00', type: 'consumable', desc: '400 pearls (best value)', pearls: 400 }
    ]
  };
  var mockUi = null; // set by app: function (kind, placement) -> Promise<boolean>
  var Ads = {
    MOCK: true,
    removed: false,
    setMockUi: function (fn) { mockUi = fn; },
    /** Resolves true if the player watched to the end and earned the reward. */
    showRewarded: function (placement) { return mockUi ? mockUi('rewarded', placement) : Promise.resolve(true); },
    /** Resolves when closed. Caller decides frequency via shouldShowInterstitial(). */
    showInterstitial: function (placement) { if (Ads.removed) return Promise.resolve(false); return mockUi ? mockUi('interstitial', placement) : Promise.resolve(true); },
    shouldShowInterstitial: function (stats, nowSec) {
      var c = CONFIG.interstitial;
      if (Ads.removed) return false;
      if ((stats.levelEnds || 0) < c.firstAfterLevel) return false;
      if ((stats.levelEnds || 0) % c.everyNthLevelEnd !== 0) return false;
      return nowSec - (stats.lastInterstitial || 0) >= c.minSecondsBetween;
    }
  };
  var IAP = {
    MOCK: true,
    products: CONFIG.products,
    find: function (sku) { return CONFIG.products.filter(function (p) { return p.sku === sku; })[0]; },
    /** Resolves { ok, sku, mock, transactionId } */
    purchase: function (sku) {
      var p = IAP.find(sku);
      return (mockUi ? mockUi('purchase', p) : Promise.resolve(true)).then(function (ok) {
        return { ok: !!ok, sku: sku, mock: true, transactionId: ok ? 'MOCK-' + Date.now() : null };
      });
    },
    restore: function () { return Promise.resolve({ ok: true, restored: [] }); }
  };
  root.Ads = Ads; root.IAP = IAP; root.MONETIZATION = CONFIG;
})(typeof self !== 'undefined' ? self : this);
