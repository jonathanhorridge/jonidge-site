/* Ads: Google AdMob via @capacitor-community/admob in the app, with Google UMP consent (EEA/UK/CH + US states) and
 * iOS App Tracking Transparency. In a plain browser (web build, tests) the same API shows placeholder ads.
 * Order (legal/guides/ads-consent.md): age signal -> UMP consent info (every launch) -> consent form if required ->
 * only if canRequestAds: initialise the Mobile Ads SDK and load ads. The game never waits for any of this. */
(function (root) {
  'use strict';
  var P = root.Platform || { native: false, os: 'web' }, CFG = (root.SUNPLOP_CONFIG || {}).ads || {}, N = P.N;
  var AdMob = P.native && N ? N.AdMob : null, OS = P.os;
  var listeners = [];
  /** Live ads only in a native release build (Capacitor.DEBUG === false). Web, tests and debug builds use official test units. */
  function testing() {
    var flag = CFG.useTestAds;
    if (flag === true || flag === false) return flag;
    var cap = root.Capacitor;
    return !(P.native && cap && cap.DEBUG === false);
  }
  function units() {
    var set = testing() && CFG.testUnits ? CFG.testUnits : (CFG.units || {});
    return set[OS] || {};
  }
  function on(ev, fn) { if (AdMob) AdMob.addListener(ev, fn).then(function (h) { listeners.push(h); }); }

  var Ads = {
    enabled: true,               // banner slot visible (hidden after the "No ads" purchase)
    native: !!AdMob,
    started: false, sdkReady: false, canRequest: false, consentStatus: 'UNKNOWN', privacyRequired: false,
    child: false, minor: false, att: 'unknown', lastDialogAt: 0,
    interstitialLoaded: false, rewardedLoaded: false, bannerShown: false, bannerWanted: false, bannerPaused: 0,
    log: [],

    /** Call once at app start. Resolves when consent is settled (the game is already playable). */
    start: function () {
      if (!AdMob) return Promise.resolve(Ads);
      if (Ads._start) return Ads._start;
      Ads.started = true;
      Ads._start = P.Age.check().then(function (flag) {
        Ads.child = flag === 'child'; Ads.minor = flag === 'minor';
        var req = { tagForUnderAgeOfConsent: Ads.child || Ads.minor };
        if (testing() && CFG.consentDebugGeography) req.debugGeography = CFG.consentDebugGeography === 'EEA' ? 1 : CFG.consentDebugGeography === 'US' ? 3 : 0;
        if (testing() && CFG.testDeviceIds && CFG.testDeviceIds.length) req.testDeviceIdentifiers = CFG.testDeviceIds;
        return AdMob.requestConsentInfo(req);
      }).then(function (info) {
        if (info && info.status === 'REQUIRED' && info.isConsentFormAvailable) { Ads.lastDialogAt = Date.now(); return AdMob.showConsentForm(); }
        return info;
      }).then(function (info) { Ads._consent(info); return Ads._initSdk(); })
        .catch(function (e) { Ads.log.push('consent error ' + (e && e.message)); })
        .then(function () { return Ads; });
      return Ads._start;
    },
    _consent: function (info) {
      if (!info) return;
      Ads.consentStatus = info.status; Ads.canRequest = !!info.canRequestAds;
      Ads.privacyRequired = info.privacyOptionsRequirementStatus === 'REQUIRED';
    },
    _initSdk: function () {
      if (!Ads.canRequest || Ads.sdkReady) return Promise.resolve();
      return AdMob.initialize({
        initializeForTesting: testing(), testingDevices: testing() ? (CFG.testDeviceIds || []) : [],
        tagForChildDirectedTreatment: Ads.child, tagForUnderAgeOfConsent: Ads.child || Ads.minor,
        maxAdContentRating: CFG.maxAdContentRating || 'General'
      }).then(function () {
        Ads.sdkReady = true;
        on('interstitialAdDismissed', function () { Ads.interstitialLoaded = false; Ads._fire('interstitialDone'); Ads._loadInterstitial(); });
        on('interstitialAdFailedToShow', function () { Ads.interstitialLoaded = false; Ads._fire('interstitialDone'); });
        on('onRewardedVideoAdReward', function () { Ads._rewardEarned = true; });
        on('onRewardedVideoAdDismissed', function () { Ads.rewardedLoaded = false; Ads._fire('rewardedDone'); Ads._loadRewarded(); });
        on('onRewardedVideoAdFailedToShow', function () { Ads.rewardedLoaded = false; Ads._fire('rewardedDone'); });
        Ads._loadInterstitial(); Ads._loadRewarded();
        if (Ads.bannerWanted) Ads._showBanner();
      }).catch(function (e) { Ads.log.push('init error ' + (e && e.message)); });
    },
    _waiters: {},
    _fire: function (k) { var w = Ads._waiters[k]; Ads._waiters[k] = null; if (w) w(); },
    _opts: function (id) { return { adId: id, isTesting: testing(), npa: Ads.child || Ads.minor }; },
    _loadInterstitial: function () {
      if (!Ads.sdkReady || !units().interstitial) return;
      AdMob.prepareInterstitial(Ads._opts(units().interstitial)).then(function () { Ads.interstitialLoaded = true; }).catch(function () { Ads.interstitialLoaded = false; });
    },
    _loadRewarded: function () {
      if (!Ads.sdkReady || !units().rewarded) return;
      AdMob.prepareRewardVideoAd(Ads._opts(units().rewarded)).then(function () { Ads.rewardedLoaded = true; }).catch(function () { Ads.rewardedLoaded = false; });
    },

    /** Rewarded video (always user-initiated, reward stated before). Resolves true only if the reward was earned.
     *  ui(placement) = placeholder used in the browser build. unavailable() is called if no ad can be shown. */
    showRewarded: function (placement, ui, unavailable) {
      if (!AdMob) return ui ? ui(placement) : Promise.resolve(true);
      if (!Ads.sdkReady || !Ads.rewardedLoaded) { Ads._loadRewarded(); if (unavailable) unavailable(); return Promise.resolve(false); }
      Ads._rewardEarned = false; Ads.bannerPause(true);
      return new Promise(function (res) {
        Ads._waiters.rewardedDone = function () { Ads.bannerPause(false); res(!!Ads._rewardEarned); };
        AdMob.showRewardVideoAd().catch(function () { Ads._fire('rewardedDone'); });
      });
    },
    /** Interstitial between levels only (never in the daily, never on launch / mid-puzzle / right after a purchase or a
     *  consent or tracking dialog). Resolves when dismissed or immediately when nothing is shown. */
    showInterstitial: function (placement, ui) {
      if (!AdMob) return ui ? ui(placement) : Promise.resolve();
      if (!Ads.sdkReady || !Ads.interstitialLoaded || Date.now() - Ads.lastDialogAt < 30000) { Ads._loadInterstitial(); return Promise.resolve(); }
      Ads.bannerPause(true);
      return new Promise(function (res) {
        Ads._waiters.interstitialDone = function () { Ads.bannerPause(false); res(); };
        AdMob.showInterstitial().catch(function () { Ads._fire('interstitialDone'); });
      });
    },

    // ---------- banner: native view drawn over the reserved 50 px slot (#ad-banner) ----------
    setBanner: function (want) {
      Ads.bannerWanted = !!want;
      if (!AdMob) return;
      if (want) Ads._showBanner(); else if (Ads.bannerShown) { Ads.bannerShown = false; AdMob.removeBanner().catch(function () {}); }
    },
    _showBanner: function () {
      if (!Ads.sdkReady || !units().banner || Ads.bannerShown || Ads.bannerPaused > 0) return;
      var slot = document.getElementById('ad-banner'); if (!slot || slot.classList.contains('hidden')) return;
      var margin = Math.max(0, Math.round(root.innerHeight - slot.getBoundingClientRect().bottom));
      Ads.bannerShown = true;
      var o = Ads._opts(units().banner); o.adSize = 'BANNER'; o.position = 'BOTTOM_CENTER'; o.margin = margin;
      AdMob.showBanner(o).catch(function () { Ads.bannerShown = false; });
    },
    /** Popups and full-screen ads must never sit under the native banner: hide it while they are open. */
    bannerPause: function (pause) {
      Ads.bannerPaused = Math.max(0, Ads.bannerPaused + (pause ? 1 : -1));
      if (!AdMob || !Ads.sdkReady) return;
      if (Ads.bannerPaused > 0 && Ads.bannerShown) AdMob.hideBanner().catch(function () {});
      else if (Ads.bannerPaused === 0 && Ads.bannerWanted) { if (Ads.bannerShown) AdMob.resumeBanner().catch(function () {}); else Ads._showBanner(); }
    },

    /** Settings -> Manage privacy choices / Do Not Sell or Share (UMP privacy options form). */
    showPrivacyOptions: function () {
      if (!AdMob) return Promise.resolve(false);
      Ads.lastDialogAt = Date.now();
      return AdMob.showPrivacyOptionsForm().then(function () { return AdMob.requestConsentInfo({ tagForUnderAgeOfConsent: Ads.child || Ads.minor }); })
        .then(function (info) { Ads._consent(info); return Ads._initSdk(); }).then(function () { return true; }).catch(function () { return false; });
    },

    // ---------- iOS App Tracking Transparency (B4) ----------
    /** True when the app may ask (iOS, consent settled, status not determined, not a known minor). */
    canAskTracking: function () {
      if (!AdMob || OS !== 'ios') return Promise.resolve(false);
      // Wait for age + UMP to settle so we never ask a known under-13 (or other minor) and never ask before consent.
      return (Ads._start || Ads.start()).then(function () {
        if (Ads.child || Ads.minor) return false;
        return AdMob.trackingAuthorizationStatus().then(function (r) { Ads.att = r.status; return r.status === 'notDetermined'; }).catch(function () { return false; });
      });
    },
    requestTracking: function () {
      Ads.lastDialogAt = Date.now();
      return AdMob.requestTrackingAuthorization().then(function () { return AdMob.trackingAuthorizationStatus(); })
        .then(function (r) { Ads.att = r.status; Ads.lastDialogAt = Date.now(); return r.status; }).catch(function () { return 'error'; });
    },
    state: function () { return { native: Ads.native, sdkReady: Ads.sdkReady, canRequest: Ads.canRequest, consent: Ads.consentStatus, privacyRequired: Ads.privacyRequired, child: Ads.child, minor: Ads.minor, att: Ads.att, banner: Ads.bannerShown, log: Ads.log.slice() }; }
  };
  root.Ads = Ads;
})(typeof self !== 'undefined' ? self : this);
