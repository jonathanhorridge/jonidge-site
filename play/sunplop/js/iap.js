/* In-app purchases. In the app: store billing (Apple IAP / Google Play Billing) through RevenueCat
 * (@revenuecat/purchases-capacitor) with an ANONYMOUS app user ID only (no login, no email, no attributes).
 * Simulated TEST MODE (nothing is charged) is allowed only in web and native debug builds. A native release
 * build never falls back to mock purchases: without a real RevenueCat key the shop is unavailable.
 * Product IDs must be created identically in App Store Connect, Play Console and RevenueCat (legal/guides/iap-compliance.md §1). */
(function (root) {
  'use strict';
  var P = root.Platform || { native: false, os: 'web' }, C = (root.SUNPLOP_CONFIG || {}).purchases || {}, N = P.N;
  var key = P.os === 'ios' ? C.revenueCatKeyIOS : P.os === 'android' ? C.revenueCatKeyAndroid : '';
  var realKey = !!key && !/REPLACE/.test(key);
  // Same signal ads.js uses: Capacitor.DEBUG is false only in a native release / Play / App Store build.
  var release = !!(P.native && root.Capacitor && root.Capacitor.DEBUG === false);
  var canStore = !!(P.native && N && N.Purchases && realKey);
  var MODE = canStore ? 'store' : (release || C.mode === 'store') ? 'unavailable' : 'mock';
  var RC = MODE === 'store' ? N.Purchases : null;
  // EEA + UK storefronts (alpha-2 and alpha-3): show the withdrawal-right waiver step before buying (B7)
  var EU = 'AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO GB ' +
           'AUT BEL BGR HRV CYP CZE DNK EST FIN FRA DEU GRC HUN IRL ITA LVA LTU LUX MLT NLD POL PRT ROU SVK SVN ESP SWE ISL LIE NOR GBR';
  var EU_SET = {}; EU.split(' ').forEach(function (c) { EU_SET[c] = 1; });

  var IAP = {
    mode: MODE,                 // 'store' | 'mock' (simulated, test mode) | 'unavailable'
    MOCK: MODE !== 'store',
    ready: false, products: {}, storefront: null, appUserId: null, error: null,
    onChange: null,             // set by the app: function (customerInfo) {} -> entitlement / refund handling
    /** sku in the game -> product ID in the stores */
    storeId: function (p) { return p.storeId || p.sku; },

    init: function (productList) {
      if (!RC) { IAP.ready = MODE === 'mock'; return Promise.resolve(IAP); }
      return RC.configure({ apiKey: key }).then(function () {
        RC.addCustomerInfoUpdateListener(function (info) { if (IAP.onChange) IAP.onChange(info); });
        var ids = productList.map(IAP.storeId);
        return Promise.all([
          RC.getProducts({ productIdentifiers: ids, type: N.PRODUCT_CATEGORY.NON_SUBSCRIPTION }).then(function (r) {
            (r.products || []).forEach(function (sp) { IAP.products[sp.identifier] = sp; });
          }),
          RC.getStorefront().then(function (s) { IAP.storefront = s && s.countryCode ? String(s.countryCode).toUpperCase() : null; }).catch(function () {}),
          RC.getAppUserID().then(function (r) { IAP.appUserId = r.appUserID; }).catch(function () {})
        ]);
      }).then(function () { IAP.ready = true; return IAP.customerInfo(); })
        .then(function (info) { if (info && IAP.onChange) IAP.onChange(info); return IAP; })
        .catch(function (e) { IAP.error = (e && e.message) || String(e); return IAP; });
    },
    customerInfo: function () { return RC ? RC.getCustomerInfo().then(function (r) { return r.customerInfo; }) : Promise.resolve(null); },
    /** Store-provided, localised, tax-inclusive price string; null when not loaded. */
    storeProduct: function (p) { return IAP.products[IAP.storeId(p)] || null; },
    needsWithdrawalWaiver: function (fallbackCountry) { var c = IAP.storefront || (MODE === 'mock' ? fallbackCountry : null); return !!(c && EU_SET[String(c).toUpperCase()]); },

    /** Resolves { ok, cancelled, pending, alreadyOwned, error, transactionId, customerInfo } */
    purchase: function (p, confirmMock) {
      if (MODE === 'mock') {
        return Promise.resolve(confirmMock ? confirmMock() : true).then(function (ok) {
          return { ok: !!ok, cancelled: !ok, mock: true, transactionId: ok ? 'MOCK-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) : null };
        });
      }
      if (!RC) return Promise.resolve({ ok: false, error: 'unavailable' });
      var sp = IAP.storeProduct(p); if (!sp) return Promise.resolve({ ok: false, error: 'product_not_loaded' });
      return RC.purchaseStoreProduct({ product: sp }).then(function (r) {
        return { ok: true, transactionId: r.transaction && r.transaction.transactionIdentifier, customerInfo: r.customerInfo };
      }).catch(function (e) {
        var code = e && String(e.code);
        return { ok: false, cancelled: code === '1' || !!(e && e.userCancelled), pending: code === '20', alreadyOwned: code === '6', error: (e && e.message) || 'error' };
      });
    },
    /** Restore non-consumables (no_ads, starter_pack). Resolves customerInfo or null. */
    restore: function () {
      if (!RC) return Promise.resolve(null);
      return RC.restorePurchases().then(function (r) { return r.customerInfo; }).catch(function () { return null; });
    },
    hasEntitlement: function (info, ent) { return !!(info && info.entitlements && info.entitlements.active && info.entitlements.active[ent]); },
    transactions: function (info) { return (info && info.nonSubscriptionTransactions) || []; }
  };
  root.IAP = IAP;
})(typeof self !== 'undefined' ? self : this);
