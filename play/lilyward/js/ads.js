/* Monetization. Same Promise API on web and native.
 *
 * Web, and native while FLAGS.adsEnabled / iapEnabled are false: stubs only.
 *   No ad or payment SDK is loaded, nothing is charged, no network calls.
 *   app.js supplies a mock UI via Ads.setMockUi so the shop can be tested.
 *
 * Native, when a flag is turned on: uses Capacitor.Plugins (no bundler imports)
 *   Ads  -> @capacitor-community/admob (rewarded + interstitial + UMP consent)
 *   IAP  -> @revenuecat/purchases-capacitor (anonymous user id)
 * Official Google test ad unit IDs are used while FLAGS.useTestIds is true.
 * Production AdMob / RevenueCat ids stay blank until Jonathan fills them in.
 *
 * Placements: rewarded 'revive', 'double_flies', 'daily_pearls', 'free_flies';
 * interstitial 'level_end'.
 */
(function (root) {
  'use strict';

  var FLAGS = {
    adsEnabled: false,
    iapEnabled: false,
    useTestIds: true
  };

  /* Google's official sample / test IDs — safe to ship in a debug build. */
  var TEST_IDS = {
    androidApp: 'ca-app-pub-3940256099942544~3347511713',
    iosApp: 'ca-app-pub-3940256099942544~1458002511',
    rewardedAndroid: 'ca-app-pub-3940256099942544/5224354917',
    rewardedIos: 'ca-app-pub-3940256099942544/1712485313',
    interstitialAndroid: 'ca-app-pub-3940256099942544/1033173712',
    interstitialIos: 'ca-app-pub-3940256099942544/4411468910'
  };

  /* Leave blank until AdMob / App Store Connect / Play Console apps exist. */
  var PROD_IDS = {
    androidApp: '',
    iosApp: '',
    rewardedAndroid: '',
    rewardedIos: '',
    interstitialAndroid: '',
    interstitialIos: ''
  };

  /* RevenueCat public SDK keys — leave blank until the project is created. */
  var REVENUECAT = {
    androidApiKey: '',
    iosApiKey: ''
  };

  var CONFIG = {
    flags: FLAGS,
    testIds: TEST_IDS,
    prodIds: PROD_IDS,
    revenueCat: REVENUECAT,
    interstitial: { firstAfterLevel: 3, everyNthLevelEnd: 2, minSecondsBetween: 120 },
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

  var mockUi = null;
  var nativeReady = { ads: false, iap: false, consent: false };

  function isNative() {
    try {
      var C = root.Capacitor;
      return !!(C && typeof C.isNativePlatform === 'function' && C.isNativePlatform());
    } catch (e) { return false; }
  }
  function plugins() { return (root.Capacitor && root.Capacitor.Plugins) || {}; }
  function platform() {
    try { return (root.Capacitor && root.Capacitor.getPlatform && root.Capacitor.getPlatform()) || 'web'; }
    catch (e) { return 'web'; }
  }
  function ids() { return FLAGS.useTestIds ? TEST_IDS : PROD_IDS; }
  function adUnit(kind) {
    var p = platform(), I = ids();
    if (kind === 'rewarded') return p === 'ios' ? I.rewardedIos : I.rewardedAndroid;
    return p === 'ios' ? I.interstitialIos : I.interstitialAndroid;
  }
  function adsLive() { return isNative() && FLAGS.adsEnabled && !!plugins().AdMob && !!adUnit('rewarded'); }
  function iapLive() {
    var key = platform() === 'ios' ? REVENUECAT.iosApiKey : REVENUECAT.androidApiKey;
    return isNative() && FLAGS.iapEnabled && !!plugins().Purchases && !!key;
  }

  function stubRewarded(placement) { return mockUi ? mockUi('rewarded', placement) : Promise.resolve(true); }
  function stubInterstitial(placement) {
    if (Ads.removed) return Promise.resolve(false);
    return mockUi ? mockUi('interstitial', placement) : Promise.resolve(true);
  }
  function stubPurchase(sku) {
    var p = IAP.find(sku);
    return (mockUi ? mockUi('purchase', p) : Promise.resolve(true)).then(function (ok) {
      return { ok: !!ok, sku: sku, mock: true, transactionId: ok ? 'MOCK-' + Date.now() : null };
    });
  }

  function initAds() {
    if (nativeReady.ads || !adsLive()) return Promise.resolve(false);
    var AdMob = plugins().AdMob;
    return Promise.resolve(AdMob.initialize({
      initializeForTesting: FLAGS.useTestIds,
      requestTrackingAuthorization: true
    })).then(function () {
      if (!AdMob.requestConsentInfo) { nativeReady.ads = true; return true; }
      return Promise.resolve(AdMob.requestConsentInfo({
        debugGeography: FLAGS.useTestIds ? 1 : 0
      })).then(function (info) {
        var status = info && (info.status || info.consentStatus);
        var need = status === 'REQUIRED' || status === 1 || status === 'required';
        if (need && AdMob.showConsentForm) return AdMob.showConsentForm();
      }).catch(function () { /* consent is best-effort; ads may still fill with non-personalised */ })
        .then(function () { nativeReady.consent = true; nativeReady.ads = true; return true; });
    }).catch(function () { nativeReady.ads = false; return false; });
  }

  function initIap() {
    if (nativeReady.iap || !iapLive()) return Promise.resolve(false);
    var Purchases = plugins().Purchases;
    var key = platform() === 'ios' ? REVENUECAT.iosApiKey : REVENUECAT.androidApiKey;
    return Promise.resolve(Purchases.configure({ apiKey: key })).then(function () {
      nativeReady.iap = true; return true;
    }).catch(function () { nativeReady.iap = false; return false; });
  }

  function showNativeRewarded(placement) {
    var AdMob = plugins().AdMob;
    var opts = { adId: adUnit('rewarded'), isTesting: FLAGS.useTestIds };
    return initAds().then(function (ok) {
      if (!ok) return stubRewarded(placement);
      return Promise.resolve(AdMob.prepareRewardVideoAd(opts)).then(function () {
        return AdMob.showRewardVideoAd();
      }).then(function (reward) {
        return !!(reward && (reward.ad == null || reward.rewarded !== false || reward.type || reward.amount != null || reward === true));
      }).catch(function () { return false; });
    });
  }

  function showNativeInterstitial(placement) {
    if (Ads.removed) return Promise.resolve(false);
    var AdMob = plugins().AdMob;
    var opts = { adId: adUnit('interstitial'), isTesting: FLAGS.useTestIds };
    return initAds().then(function (ok) {
      if (!ok) return stubInterstitial(placement);
      return Promise.resolve(AdMob.prepareInterstitial(opts)).then(function () {
        return AdMob.showInterstitial();
      }).then(function () { return true; }).catch(function () { return false; });
    });
  }

  function nativePurchase(sku) {
    var Purchases = plugins().Purchases;
    return initIap().then(function (ok) {
      if (!ok) return stubPurchase(sku);
      return Promise.resolve(Purchases.getProducts({ productIdentifiers: [sku] })).then(function (res) {
        var list = (res && (res.products || res)) || [];
        var product = list[0];
        if (!product) return { ok: false, sku: sku, mock: false, transactionId: null };
        return Purchases.purchaseStoreProduct({ product: product }).then(function (r) {
          var info = r && r.customerInfo;
          return { ok: true, sku: sku, mock: false, transactionId: (info && info.originalAppUserId) || sku, customerInfo: info };
        });
      }).catch(function () { return { ok: false, sku: sku, mock: false, transactionId: null }; });
    });
  }

  function nativeRestore() {
    var Purchases = plugins().Purchases;
    return initIap().then(function (ok) {
      if (!ok) return { ok: true, restored: [] };
      return Promise.resolve(Purchases.restorePurchases()).then(function (r) {
        var info = r && (r.customerInfo || r);
        var ents = (info && info.entitlements && (info.entitlements.active || info.entitlements)) || {};
        var restored = [];
        if (ents.remove_ads || ents['remove ads']) restored.push('remove_ads');
        if (ents.starter_pack || ents['starter pack']) restored.push('starter_pack');
        /* Also map known product identifiers if present on the customer info. */
        var all = info && (info.allPurchasedProductIdentifiers || info.allPurchaseDates);
        if (all) {
          Object.keys(all).forEach(function (id) {
            if (['remove_ads', 'starter_pack'].indexOf(id) >= 0 && restored.indexOf(id) < 0) restored.push(id);
          });
        }
        return { ok: true, restored: restored, customerInfo: info };
      }).catch(function () { return { ok: false, restored: [] }; });
    });
  }

  var Ads = {
    MOCK: true,
    removed: false,
    flags: FLAGS,
    setMockUi: function (fn) { mockUi = fn; },
    init: function () {
      Ads.MOCK = !adsLive();
      IAP.MOCK = !iapLive();
      return Promise.all([initAds(), initIap()]);
    },
    /** Resolves true if the player watched to the end and earned the reward. */
    showRewarded: function (placement) {
      return adsLive() ? showNativeRewarded(placement) : stubRewarded(placement);
    },
    /** Resolves when closed. Caller decides frequency via shouldShowInterstitial(). */
    showInterstitial: function (placement) {
      if (Ads.removed) return Promise.resolve(false);
      return adsLive() ? showNativeInterstitial(placement) : stubInterstitial(placement);
    },
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
      return iapLive() ? nativePurchase(sku) : stubPurchase(sku);
    },
    restore: function () {
      return iapLive() ? nativeRestore() : Promise.resolve({ ok: true, restored: [] });
    }
  };

  root.Ads = Ads;
  root.IAP = IAP;
  root.MONETIZATION = CONFIG;
})(typeof self !== 'undefined' ? self : this);
