/* Rewarded ads (opt-in "double Breeze" after a run). DISABLED by default: KC_CONFIG.ads.mode === 'off'.
 * Structure mirrors Sunplop's ads.js: Ads.showRewarded(placement, ui) resolves true only if the reward was earned.
 *  - 'off':  nothing is requested, available() is false, the button stays disabled.
 *  - 'mock': browser / native-debug test only. A simulated placeholder "ad" (ui callback). No network, no SDK.
 *  - 'live': Google AdMob through the Capacitor AdMob plugin (window.GustNative.AdMob). The plugin is NOT installed yet and
 *            no unit ids exist, so live mode reports unavailable. Never used with real ids until Jonathan approves store/ads setup.
 * Rewards: never forced, never required, never gates play. Capped per day (ads.maxRewardedPerDay). */
(function (root) {
  'use strict';
  var C = (root.KC_CONFIG || {}).ads || {}, N = root.GustNative || null, native = !!(N && N.isNative);
  var qs = null; try { qs = new URLSearchParams(root.location.search).get('ads'); } catch (e) {}
  // ?ads=mock only works in a browser (never in the native app), so release builds can't be switched on by URL.
  var mode = (!native && qs === 'mock') ? 'mock' : (C.mode || 'off');
  var AdMob = native && N.AdMob ? N.AdMob : null;
  function unit() { var u = (C.units || {})[native ? N.platform : ''] || {}; return u.rewarded || ''; }
  var Ads = {
    mode: mode,
    rewardedLoaded: false, sdkReady: false, _earned: false, _waiter: null,
    /** Can a rewarded ad be offered right now? */
    available: function () {
      if (mode === 'mock') return true;
      if (mode === 'live') return !!(AdMob && unit() && Ads.sdkReady && Ads.rewardedLoaded);
      return false;
    },
    start: function () {
      if (mode !== 'live' || !AdMob || !unit() || Ads.sdkReady) return Promise.resolve(Ads);
      return AdMob.initialize({ initializeForTesting: native && root.Capacitor && root.Capacitor.DEBUG !== false, maxAdContentRating: C.maxAdContentRating || 'General' })
        .then(function () {
          Ads.sdkReady = true;
          AdMob.addListener('onRewardedVideoAdReward', function () { Ads._earned = true; });
          AdMob.addListener('onRewardedVideoAdDismissed', function () { Ads.rewardedLoaded = false; if (Ads._waiter) { var w = Ads._waiter; Ads._waiter = null; w(!!Ads._earned); } Ads._load(); });
          AdMob.addListener('onRewardedVideoAdFailedToShow', function () { Ads.rewardedLoaded = false; if (Ads._waiter) { var w = Ads._waiter; Ads._waiter = null; w(false); } });
          return Ads._load();
        }).catch(function () {}).then(function () { return Ads; });
    },
    _load: function () {
      if (!AdMob || !Ads.sdkReady || !unit()) return Promise.resolve();
      return AdMob.prepareRewardVideoAd({ adId: unit(), isTesting: root.Capacitor && root.Capacitor.DEBUG !== false }).then(function () { Ads.rewardedLoaded = true; }).catch(function () { Ads.rewardedLoaded = false; });
    },
    /** ui(placement) = placeholder used in 'mock' mode (resolves true when the fake ad "finishes"). */
    showRewarded: function (placement, ui) {
      if (mode === 'mock') return ui ? ui(placement) : Promise.resolve(true);
      if (!Ads.available()) { Ads._load(); return Promise.resolve(false); }
      Ads._earned = false;
      return new Promise(function (res) { Ads._waiter = res; AdMob.showRewardVideoAd().catch(function () { if (Ads._waiter) { Ads._waiter = null; res(false); } }); });
    }
  };
  root.Ads = Ads;
})(typeof self !== 'undefined' ? self : this);
