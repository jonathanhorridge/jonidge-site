/* In-app purchases: one optional COSMETIC pack (no currency, no gameplay effect). DISABLED by default: KC_CONFIG.purchases.mode === 'off'.
 * Structure mirrors Sunplop's iap.js (RevenueCat, anonymous app user id, mock only in web/debug, never a free grant in a release build).
 *  - 'off':   shop shows nothing to buy.
 *  - 'mock':  browser / native-debug test only. A simulated purchase (nothing is charged).
 *  - 'store': RevenueCat (window.GustNative.Purchases). The plugin is NOT installed yet and there are no keys or product ids.
 * Product ids must be created identically in App Store Connect, Play Console and RevenueCat before turning this on. */
(function (root) {
  'use strict';
  var C = (root.KC_CONFIG || {}).purchases || {}, N = root.GustNative || null, native = !!(N && N.isNative);
  var qs = null; try { qs = new URLSearchParams(root.location.search).get('iap'); } catch (e) {}
  var key = native ? (N.platform === 'ios' ? C.revenueCatKeyIOS : C.revenueCatKeyAndroid) : '';
  var RC = native && N.Purchases && key ? N.Purchases : null;
  var MODE = RC && C.mode === 'store' ? 'store' : (!native && qs === 'mock') ? 'mock' : (C.mode === 'mock' && !(native && root.Capacitor && root.Capacitor.DEBUG === false)) ? 'mock' : 'off';
  // Packs unlock fixed items directly. Every item is also buyable with earned Breeze, so nothing is exclusive to money.
  var PACKS = [{ sku: 'cosmetic_pack_sky', name: 'Sky Pack', blurb: 'Aurora kite, Stars tail, Rainbow trail', items: [['kite', 'aurora'], ['tail', 'stars'], ['trail', 'rainbow']] }];
  var IAP = {
    mode: MODE, PACKS: PACKS, ready: false, products: {},
    enabled: function () { return MODE !== 'off'; },
    storeId: function (p) { var c = (C.products || []).filter(function (x) { return x.sku === p.sku; })[0]; return (c && c.storeId) || p.sku; },
    init: function () {
      if (!RC || MODE !== 'store') { IAP.ready = MODE === 'mock'; return Promise.resolve(IAP); }
      return RC.configure({ apiKey: key }).then(function () { IAP.ready = true; return IAP; }).catch(function () { return IAP; });
    },
    /** Resolves { ok, cancelled, mock, error } */
    purchase: function (p, confirmMock) {
      if (MODE === 'mock') return Promise.resolve(confirmMock ? confirmMock() : true).then(function (ok) { return { ok: !!ok, cancelled: !ok, mock: true }; });
      if (MODE !== 'store' || !RC) return Promise.resolve({ ok: false, error: 'unavailable' });
      return Promise.resolve({ ok: false, error: 'product_not_loaded' }); // real RevenueCat purchase call is wired when ids/keys exist
    },
    restore: function () { return Promise.resolve(null); }
  };
  root.IAP = IAP;
})(typeof self !== 'undefined' ? self : this);
