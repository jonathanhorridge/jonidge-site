/* Rewarded ads (Google AdMob via @capacitor-community/admob), modelled on Sunplop's ads.js. REWARDED ONLY: no banners, no
 * interstitials, never forced, never needed to progress, capped per day by the game rules (PB_DATA.ADS).
 *
 * Modes:
 *   'sim'  web build / browser tests: a labelled "test ad" screen, nothing is requested from any network.
 *   'off'  native app with features.ads === false (default): no SDK call is ever made and available() is false.
 *   'live' native app with features.ads === true: Google UMP consent first (every launch), then, only if canRequestAds,
 *          the Mobile Ads SDK starts. On iOS the SDK waits until Apple's tracking (ATT) question has been answered; the
 *          app asks it after a short explainer the first time the player taps a "watch" button.
 *          Test units are used unless this is a native RELEASE build (Capacitor.DEBUG === false) with real units set. */
(function (root) {
  'use strict';
  var CFG = root.PB_CONFIG || {}, C = CFG.ads || {}, F = CFG.features || {};
  var N = root.PocketNative || null, NATIVE = !!(N && N.isNative), OS = NATIVE ? N.platform : 'web';
  var AdMob = NATIVE && N.AdMob ? N.AdMob : null;
  var MODE = !NATIVE ? 'sim' : (F.ads === true && AdMob) ? 'live' : 'off';
  function release() { return !!(NATIVE && root.Capacitor && root.Capacitor.DEBUG === false); }
  function real() { return ((C.units || {})[OS] || {}).rewarded || ''; }
  function testing() {
    if (C.useTestAds === true || C.useTestAds === false) return C.useTestAds || !real();
    return !(release() && real());
  }
  function unit() { return testing() ? (((C.testUnits || {})[OS] || {}).rewarded || '') : real(); }
  function on(ev, fn) { AdMob.addListener(ev, fn).catch(function () {}); }

  var Ads = {
    mode: MODE, native: NATIVE, simulated: MODE === 'sim',
    sdkReady: false, canRequest: false, consentStatus: 'UNKNOWN', privacyRequired: false,
    att: 'unknown', attPending: false, rewardedLoaded: false, log: [],
    testing: testing, unit: unit,
    _err: function (where, e) { var line = where + ' ' + ((e && (e.code != null ? 'code ' + e.code + ' ' : '')) || '') + ((e && e.message) || String(e)); Ads.log.push(line); if (root.console) console.warn('[Pocket Burrow ads] ' + line); },
    /** Can the game show a "watch" button at all? (Daily caps are checked by the game rules.) */
    available: function () { return MODE !== 'off'; },

    /** Call once at boot. Never blocks play. */
    start: function () {
      if (MODE !== 'live') return Promise.resolve(Ads);
      if (Ads._start) return Ads._start;
      var req = { tagForUnderAgeOfConsent: false };
      if (testing() && C.consentDebugGeography) req.debugGeography = C.consentDebugGeography === 'EEA' ? 1 : C.consentDebugGeography === 'US' ? 3 : 0;
      if (testing() && C.testDeviceIds && C.testDeviceIds.length) req.testDeviceIdentifiers = C.testDeviceIds;
      Ads._start = AdMob.requestConsentInfo(req).then(function (info) {
        if (info && info.status === 'REQUIRED' && info.isConsentFormAvailable) return AdMob.showConsentForm();
        return info;
      }).then(function (info) { Ads._consent(info); return Ads._init(); })
        .catch(function (e) { Ads._err('consent', e); }).then(function () { return Ads; });
      return Ads._start;
    },
    _consent: function (info) {
      if (!info) return;
      Ads.consentStatus = info.status; Ads.canRequest = !!info.canRequestAds;
      Ads.privacyRequired = info.privacyOptionsRequirementStatus === 'REQUIRED';
    },
    _init: function () {
      if (!Ads.canRequest || Ads.sdkReady || Ads._initing) return Promise.resolve();
      var gate = OS === 'ios'
        ? AdMob.trackingAuthorizationStatus().then(function (r) { Ads.att = r.status; return r.status !== 'notDetermined'; }).catch(function () { return true; })
        : Promise.resolve(true);
      return gate.then(function (go) {
        Ads.attPending = !go; if (!go) return;
        Ads._initing = true;
        return AdMob.initialize({ initializeForTesting: testing(), testingDevices: testing() ? (C.testDeviceIds || []) : [], tagForChildDirectedTreatment: false, tagForUnderAgeOfConsent: false, maxAdContentRating: C.maxAdContentRating || 'General' })
          .then(function () {
            Ads.sdkReady = true;
            on('onRewardedVideoAdReward', function () { Ads._earned = true; });
            on('onRewardedVideoAdDismissed', function () { Ads.rewardedLoaded = false; Ads._done(); Ads._load(); });
            on('onRewardedVideoAdFailedToShow', function (e) { Ads.rewardedLoaded = false; Ads._err('FailedToShow', e); Ads._done(); });
            on('onRewardedVideoAdFailedToLoad', function (e) { Ads.rewardedLoaded = false; Ads._err('FailedToLoad', e); });
            return Ads._load();
          }).catch(function (e) { Ads._err('init', e); }).then(function () { Ads._initing = false; });
      });
    },
    _load: function () {
      if (!Ads.sdkReady || !unit()) return Promise.resolve(false);
      if (Ads._loading) return Ads._loading;
      Ads._loading = new Promise(function (res) {
        var settled = false, t = setTimeout(function () { if (!settled) { settled = true; res(Ads.rewardedLoaded); } }, C.loadTimeoutMs || 8000);
        AdMob.prepareRewardVideoAd({ adId: unit(), isTesting: testing() }).then(function () { Ads.rewardedLoaded = true; if (!settled) { settled = true; clearTimeout(t); res(true); } })
          .catch(function (e) { Ads._err('prepare', e); if (!settled) { settled = true; clearTimeout(t); res(false); } });
      }).then(function (ok) { Ads._loading = null; return ok; });
      return Ads._loading;
    },
    _done: function () { var w = Ads._waiter; Ads._waiter = null; if (w) w(!!Ads._earned); },

    /** Rewarded video, always started by the player with the reward stated first. Resolves true only if earned.
     *  sim(resolve) draws the web test screen. unavailable(reason): 'att' (iOS, ask tracking first) | 'consent' | 'unavailable'. */
    showRewarded: function (placement, sim, unavailable) {
      if (MODE === 'sim') return new Promise(function (res) { if (sim) sim(res); else res(true); });
      if (MODE !== 'live') { if (unavailable) unavailable('unavailable'); return Promise.resolve(false); }
      return Ads.start().then(function () {
        if (OS === 'ios' && Ads.attPending) { if (unavailable) unavailable('att'); return false; }
        if (!Ads.canRequest) { if (unavailable) unavailable('consent'); return false; }
        return (Ads.rewardedLoaded ? Promise.resolve(true) : Ads._load().then(function (ok) { return ok || Ads._load(); })).then(function (ok) {
          if (!ok) { if (unavailable) unavailable('unavailable'); return false; }
          Ads._earned = false;
          return new Promise(function (res) { Ads._waiter = res; AdMob.showRewardVideoAd().catch(function (e) { Ads._err('show', e); Ads._done(); }); });
        });
      });
    },

    /** Settings > Privacy choices (UMP privacy options form, also covers US-state "do not sell or share"). */
    showPrivacyOptions: function () {
      if (MODE !== 'live') return Promise.resolve(false);
      return AdMob.showPrivacyOptionsForm().then(function () { return AdMob.requestConsentInfo({ tagForUnderAgeOfConsent: false }); })
        .then(function (info) { Ads._consent(info); return Ads._init(); }).then(function () { return true; }).catch(function () { return false; });
    },
    /** iOS: true when Apple's tracking question has not been asked yet (the app shows its explainer first). */
    needsTrackingAsk: function () {
      if (MODE !== 'live' || OS !== 'ios') return Promise.resolve(false);
      return Ads.start().then(function () { return AdMob.trackingAuthorizationStatus(); }).then(function (r) { Ads.att = r.status; return r.status === 'notDetermined'; }).catch(function () { return false; });
    },
    requestTracking: function () {
      if (MODE !== 'live' || OS !== 'ios') return Promise.resolve('n/a');
      return AdMob.requestTrackingAuthorization().then(function () { return AdMob.trackingAuthorizationStatus(); })
        .then(function (r) { Ads.att = r.status; return r.status; }).catch(function () { return 'error'; })
        .then(function (s) { return Ads._init().then(function () { return s; }); });
    },
    state: function () { return { mode: MODE, testing: testing(), unit: unit(), sdkReady: Ads.sdkReady, canRequest: Ads.canRequest, consent: Ads.consentStatus, privacyRequired: Ads.privacyRequired, att: Ads.att, attPending: Ads.attPending, loaded: Ads.rewardedLoaded, log: Ads.log.slice() }; }
  };
  root.PB_ADS = Ads;
})(typeof self !== 'undefined' ? self : this);
