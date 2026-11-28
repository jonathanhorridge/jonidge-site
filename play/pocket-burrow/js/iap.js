/* In-app purchases: Glowberry baskets (consumable, cosmetic currency) and the one-time Cozy Supporter pack, through
 * RevenueCat (@revenuecat/purchases-capacitor) with an ANONYMOUS app user id only: no login, no email, no attributes.
 * Modelled on Sunplop's iap.js.
 *
 * Modes:
 *   'sim'          web build / browser tests: a labelled "test purchase" (nothing is charged, ever).
 *   'off'          native app with features.purchases === false (default): the shop is hidden.
 *   'store'        native app, flag on and a real RevenueCat key: real store billing (Apple IAP / Google Play Billing).
 *   'sim'          native DEBUG build, flag on but no key yet: simulated, labelled test purchases for testers.
 *   'unavailable'  native RELEASE build, flag on but no key: the shop says "not available". A release build NEVER grants
 *                  anything for free.
 * Product ids must be created identically in App Store Connect, Play Console and RevenueCat (docs/RELEASE.md). */
(function (root) {
  'use strict';
  var CFG = root.PB_CONFIG || {}, C = CFG.purchases || {}, F = CFG.features || {};
  var N = root.PocketNative || null, NATIVE = !!(N && N.isNative), OS = NATIVE ? N.platform : 'web';
  var key = OS === 'ios' ? C.revenueCatKeyIOS : OS === 'android' ? C.revenueCatKeyAndroid : '';
  var realKey = !!key && !/REPLACE/.test(key);
  var release = !!(NATIVE && root.Capacitor && root.Capacitor.DEBUG === false);
  var MODE = !NATIVE ? 'sim' : F.purchases !== true ? 'off' : (N.Purchases && realKey) ? 'store' : release ? 'unavailable' : 'sim';
  var RC = MODE === 'store' ? N.Purchases : null;
  var EU = {}; ('AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO GB ' +
    'AUT BEL BGR HRV CYP CZE DNK EST FIN FRA DEU GRC HUN IRL ITA LVA LTU LUX MLT NLD POL PRT ROU SVK SVN ESP SWE ISL LIE NOR GBR').split(' ').forEach(function (c) { EU[c] = 1; });

  var IAP = {
    mode: MODE, native: NATIVE, simulated: MODE === 'sim',
    ready: false, products: {}, storefront: null, error: null,
    onChange: null,                 // app hook: function (customerInfo) {}, used to grant/restore the Supporter pack
    storeId: function (p) { return p.storeId || p.sku; },
    shopVisible: function () { return MODE !== 'off'; },
    init: function (list) {
      if (!RC) { IAP.ready = MODE === 'sim'; return Promise.resolve(IAP); }
      return RC.configure({ apiKey: key }).then(function () {
        RC.addCustomerInfoUpdateListener(function (info) { if (IAP.onChange) IAP.onChange(info); });
        return Promise.all([
          RC.getProducts({ productIdentifiers: list.map(IAP.storeId), type: N.PRODUCT_CATEGORY.NON_SUBSCRIPTION }).then(function (r) { (r.products || []).forEach(function (sp) { IAP.products[sp.identifier] = sp; }); }),
          RC.getStorefront().then(function (s) { IAP.storefront = s && s.countryCode ? String(s.countryCode).toUpperCase() : null; }).catch(function () {})
        ]);
      }).then(function () { IAP.ready = true; return RC.getCustomerInfo(); })
        .then(function (r) { if (r && IAP.onChange) IAP.onChange(r.customerInfo); return IAP; })
        .catch(function (e) { IAP.error = (e && e.message) || String(e); return IAP; });
    },
    storeProduct: function (p) { return IAP.products[IAP.storeId(p)] || null; },
    /** Localised, tax-inclusive store price; falls back to the USD reference price in sim mode. */
    price: function (p) { var sp = IAP.storeProduct(p); return sp ? sp.priceString : MODE === 'sim' ? '$' + p.usd.toFixed(2) : null; },
    /** EEA/UK storefront: ask for the digital-content withdrawal waiver before buying. */
    needsWaiver: function () { return !!(IAP.storefront && EU[IAP.storefront]); },
    /** Resolves { ok, cancelled, pending, alreadyOwned, error, transactionId, mock } */
    purchase: function (p, simConfirm) {
      if (MODE === 'sim') return new Promise(function (res) { if (simConfirm) simConfirm(res); else res(true); })
        .then(function (ok) { return { ok: !!ok, cancelled: !ok, mock: true, transactionId: ok ? 'SIM-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) : null }; });
      if (!RC) return Promise.resolve({ ok: false, error: 'unavailable' });
      var sp = IAP.storeProduct(p); if (!sp) return Promise.resolve({ ok: false, error: 'product_not_loaded' });
      return RC.purchaseStoreProduct({ product: sp }).then(function (r) {
        return { ok: true, transactionId: r.transaction && r.transaction.transactionIdentifier, customerInfo: r.customerInfo };
      }).catch(function (e) {
        var code = e && String(e.code);
        return { ok: false, cancelled: code === '1' || !!(e && e.userCancelled), pending: code === '20', alreadyOwned: code === '6', error: (e && e.message) || 'error' };
      });
    },
    /** Restore the one-time Supporter pack (consumable Glowberries cannot be restored by any store). */
    restore: function () { if (!RC) return Promise.resolve(null); return RC.restorePurchases().then(function (r) { return r.customerInfo; }).catch(function () { return null; }); },
    ownsSupporter: function (info) {
      if (!info) return false;
      var ent = info.entitlements && info.entitlements.active && info.entitlements.active[C.supporterEntitlement || 'supporter'];
      return !!ent || (info.nonSubscriptionTransactions || []).some(function (t) { return t.productIdentifier === 'supporter'; });
    }
  };
  root.PB_IAP = IAP;
})(typeof self !== 'undefined' ? self : this);
