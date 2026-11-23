/* Ferry Jam economy + IAP catalog. Placeholder prices only — no real charges. */
(function (root) {
  'use strict';
  var E = {
    currencyName: 'Tickets',
    currencyCode: 'tickets',
    welcomeGift: 40,
    perStar: 5,
    firstClearBonus: 15,
    dailyPuzzleReward: 25,
    dailyPuzzlePerfect: 15,
    comboBonus: 2,
    ferryFullBonus: 3,
    questReward: 15,
    skipCost: 40,
    hintCost: 20,
    extraBayCost: 25,
    undoCost: 10,
    freeUndosPerLevel: 3,
    streakFreezeCost: 30,
    adReward: {
      tickets: 25,
      hint: 1,
      extraBay: 1,
      undo: 3,
      doubleCoins: true,
      streakSave: true,
      dailyDouble: true
    },
    interstitial: {
      afterLevel: 8,
      every: 3,
      neverInDaily: true,
      neverAfterRewarded: true
    },
    loginCalendar: [10, 15, 20, 25, 30, 40, 80],
    products: [
      { id: 'tickets_100',  title: '100 Tickets',     tickets: 100,  priceUSD: 0.99, tag: null },
      { id: 'tickets_550',  title: '550 Tickets',     tickets: 550,  priceUSD: 4.99, tag: 'Popular' },
      { id: 'tickets_1200', title: '1,200 Tickets',   tickets: 1200, priceUSD: 9.99, tag: 'Best' },
      { id: 'tickets_2500', title: '2,500 Tickets',   tickets: 2500, priceUSD: 19.99, tag: null },
      { id: 'remove_ads',   title: 'Remove Ads',      tickets: 0,    priceUSD: 3.99, tag: 'No ads', type: 'ads' },
      { id: 'starter_pack', title: 'Starter Pack',    tickets: 200,  priceUSD: 2.99, tag: 'Value', type: 'starter', extras: { removeAds7d: true, hint: 3 } },
      { id: 'harbor_pass',  title: 'Harbor Pass',     tickets: 0,    priceUSD: 4.99, tag: 'Pass', type: 'pass', extras: { removeAds: true, dailyBonus: 20, days: 30 } },
      { id: 'skin_car_taxi',   title: 'Taxi Skin',    tickets: 0,    priceUSD: 1.99, tag: 'Cosmetic', type: 'skin', skin: { kind: 'car', id: 'taxi' } },
      { id: 'skin_ferry_stripe', title: 'Stripe Livery', tickets: 0, priceUSD: 1.99, tag: 'Cosmetic', type: 'skin', skin: { kind: 'ferry', id: 'stripe' } }
    ],
    fx: { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 154, BRL: 5.15, INR: 83, AUD: 1.52, CAD: 1.36 },
    symbols: { USD: '$', EUR: '€', GBP: '£', JPY: '¥', BRL: 'R$', INR: '₹', AUD: 'A$', CAD: 'C$' }
  };

  E.formatPrice = function (usd, currency) {
    currency = currency || 'USD';
    var fx = E.fx[currency] || 1;
    var raw = usd * fx;
    var n = (currency === 'JPY' || currency === 'INR') ? Math.round(raw) : Math.round(raw * 100) / 100;
    var sym = E.symbols[currency] || (currency + ' ');
    if (currency === 'JPY' || currency === 'INR') return sym + n.toLocaleString('en-US');
    return sym + n.toFixed(2);
  };

  E.product = function (id) {
    for (var i = 0; i < E.products.length; i++) if (E.products[i].id === id) return E.products[i];
    return null;
  };

  E.ECONOMY = E;
  E.PRODUCTS = E.products;
  E.detectCountry = function () {
    try {
      var loc = (Intl.DateTimeFormat().resolvedOptions().locale || '').toUpperCase();
      if (loc.indexOf('GB') !== -1) return 'GB';
      if (loc.indexOf('DE') !== -1 || loc.indexOf('FR') !== -1 || loc.indexOf('CH') !== -1 || loc.indexOf('IT') !== -1 || loc.indexOf('ES') !== -1 || loc.indexOf('NL') !== -1) return 'EU';
      if (loc.indexOf('JP') !== -1) return 'JP';
      if (loc.indexOf('BR') !== -1) return 'BR';
      if (loc.indexOf('IN') !== -1) return 'IN';
      if (loc.indexOf('AU') !== -1) return 'AU';
      if (loc.indexOf('CA') !== -1) return 'CA';
    } catch (e) {}
    return 'US';
  };
  E.currencyFor = function (country) {
    return ({ US: 'USD', GB: 'GBP', EU: 'EUR', JP: 'JPY', BR: 'BRL', IN: 'INR', AU: 'AUD', CA: 'CAD' })[country] || 'USD';
  };

  root.Economy = E;
  if (typeof module === 'object' && module.exports) module.exports = E;
})(typeof self !== 'undefined' ? self : this);
