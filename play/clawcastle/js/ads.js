/* Monetisation PLACEHOLDERS: no ad SDK, no payment SDK, no network calls, nothing is ever charged.
 * Native plan (same Promise API, swap the bodies):
 *   Ads.showRewarded -> @capacitor-community/admob rewarded video (optional only: +3 moves, bonus chest)
 *   IAP.purchase     -> StoreKit / Play Billing via a Capacitor purchases plugin
 * Fair rules: you can never buy troop power. Only cosmetics, the Tide Pass and "remove ads". */
(function (root) {
  'use strict';
  var Ads = {
    LIVE: false,
    showRewarded: function (placement) { return Promise.resolve({ ok: true, placeholder: true, placement: placement }); }
  };
  var IAP = {
    LIVE: false,
    products: [
      { sku: 'remove_ads_starter', name: 'No Ads + Starter Chest', price: 'CHF 3.00', desc: 'Removes all ads and gives 300 Sand + 10 Pearls. One time only.' },
      { sku: 'tide_pass', name: 'Tide Pass (season)', price: 'CHF 5.00', desc: 'Bonus rewards track and a golden crab skin. The free track stays generous.' },
      { sku: 'skin_pirate', name: 'Pirate Crab Outfits', price: 'CHF 2.00', desc: 'Cosmetic only: hats and eye patches for your crew.' }
    ],
    purchase: function (sku) { return Promise.resolve({ ok: false, reason: 'coming_soon', sku: sku }); }
  };
  root.Ads = Ads; root.IAP = IAP;
})(window);
