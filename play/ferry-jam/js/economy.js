/* Tickets, costs, products, regional prices. Numbers are documented in MONETIZATION.md. */
(function (root) {
  'use strict';
  var ECONOMY = {
    currency: 'Tickets',
    welcomeGift: 50,
    perStar: 2,
    firstClear: 5,
    allClearBonus: 50,
    adReward: 15,
    adsPerDay: 3,
    interstitial: { everyLevels: 3, fromLevel: 6 }, // count completions of level >= 6; show every 3rd
    costs: { hint: 20, extraSlot: 25, skip: 50 },
    stars: { twoStarMaxHints: 1, twoStarParFactor: 2 }
  };

  var PRODUCTS = [
    { sku: 'tickets_200',  kind: 'pack',    name: 'Handful',  coins: 200,  bonus: 0 },
    { sku: 'tickets_550',  kind: 'pack',    name: 'Pouch',    coins: 550,  bonus: 10, tag: 'popular' },
    { sku: 'tickets_1200', kind: 'pack',    name: 'Chest',    coins: 1200, bonus: 20 },
    { sku: 'tickets_2600', kind: 'pack',    name: 'Treasure', coins: 2600, bonus: 30, tag: 'best_value' },
    { sku: 'starter',      kind: 'starter', name: 'Starter pack', coins: 500, dockTokens: 2, oneTime: true },
    { sku: 'no_ads',       kind: 'noads',   name: 'Remove Ads', oneTime: true }
  ];

  var PRICE_TABLE = {
    A: {
      USD: [1.99, 4.99, 9.99, 19.99, 2.99, 3.99],
      CHF: [2.00, 5.00, 10.00, 20.00, 3.00, 4.00],
      EUR: [1.99, 4.99, 9.99, 19.99, 2.99, 3.99],
      GBP: [1.99, 4.99, 9.99, 19.99, 2.99, 3.99],
      CAD: [2.79, 6.99, 13.99, 27.99, 3.99, 5.49],
      AUD: [2.99, 7.99, 15.99, 29.99, 4.49, 5.99],
      NZD: [3.49, 8.99, 16.99, 34.99, 4.99, 6.99],
      SEK: [25, 59, 119, 229, 35, 45],
      NOK: [25, 59, 119, 229, 35, 45],
      DKK: [15, 39, 75, 149, 22, 29],
      JPY: [300, 800, 1500, 3000, 450, 600]
    },
    B: {
      USD: [1.29, 2.99, 5.99, 12.99, 1.99, 2.49],
      EUR: [1.49, 3.49, 6.99, 13.99, 1.99, 2.99],
      PLN: [5.99, 13.99, 27.99, 54.99, 8.99, 10.99],
      CZK: [35, 85, 169, 339, 49, 65],
      KRW: [1900, 4400, 8800, 18000, 2900, 3900]
    },
    C: {
      USD: [0.99, 1.99, 3.99, 7.99, 0.99, 1.49],
      BRL: [4.90, 11.90, 22.90, 44.90, 6.90, 8.90],
      MXN: [19, 45, 89, 179, 29, 35],
      INR: [49, 119, 229, 449, 69, 89],
      IDR: [9900, 24900, 49900, 99000, 15000, 19000],
      TRY: [29.99, 69.99, 139.99, 279.99, 44.99, 54.99],
      PHP: [49, 119, 249, 499, 75, 99],
      ZAR: [17.99, 39.99, 79.99, 159.99, 24.99, 32.99],
      COP: [3900, 8900, 17900, 34900, 4900, 6900],
      ARS: [990, 2290, 4490, 8990, 1490, 1890]
    }
  };

  var COUNTRY = {
    US: ['A', 'USD'], CA: ['A', 'CAD'], GB: ['A', 'GBP'], AU: ['A', 'AUD'], NZ: ['A', 'NZD'], IE: ['A', 'EUR'],
    CH: ['A', 'CHF'], LI: ['A', 'CHF'], DE: ['A', 'EUR'], AT: ['A', 'EUR'], NL: ['A', 'EUR'], BE: ['A', 'EUR'],
    LU: ['A', 'EUR'], FR: ['A', 'EUR'], FI: ['A', 'EUR'], SE: ['A', 'SEK'], NO: ['A', 'NOK'], DK: ['A', 'DKK'],
    IS: ['A', 'USD'], JP: ['A', 'JPY'], SG: ['A', 'USD'], AE: ['A', 'USD'], IL: ['A', 'USD'], HK: ['A', 'USD'],
    ES: ['B', 'EUR'], IT: ['B', 'EUR'], PT: ['B', 'EUR'], GR: ['B', 'EUR'], SI: ['B', 'EUR'], SK: ['B', 'EUR'],
    EE: ['B', 'EUR'], LT: ['B', 'EUR'], LV: ['B', 'EUR'], CY: ['B', 'EUR'], MT: ['B', 'EUR'], HR: ['B', 'EUR'],
    PL: ['B', 'PLN'], CZ: ['B', 'CZK'], KR: ['B', 'KRW'], SA: ['B', 'USD'], TW: ['B', 'USD'], CL: ['B', 'USD'],
    UY: ['B', 'USD'], HU: ['B', 'USD'], RO: ['B', 'USD'],
    BR: ['C', 'BRL'], MX: ['C', 'MXN'], IN: ['C', 'INR'], ID: ['C', 'IDR'], TR: ['C', 'TRY'], PH: ['C', 'PHP'],
    ZA: ['C', 'ZAR'], CO: ['C', 'COP'], AR: ['C', 'ARS'], EG: ['C', 'USD'], NG: ['C', 'USD'], PK: ['C', 'USD'],
    VN: ['C', 'USD'], TH: ['C', 'USD'], MY: ['C', 'USD'], PE: ['C', 'USD'], KE: ['C', 'USD'], BD: ['C', 'USD'],
    UA: ['C', 'USD'], MA: ['C', 'USD']
  };
  var TZ_COUNTRY = {
    'Europe/Zurich': 'CH', 'Europe/Berlin': 'DE', 'Europe/Paris': 'FR', 'Europe/London': 'GB', 'Europe/Madrid': 'ES',
    'Europe/Rome': 'IT', 'Europe/Lisbon': 'PT', 'America/Sao_Paulo': 'BR', 'America/Mexico_City': 'MX',
    'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Jakarta': 'ID', 'Europe/Istanbul': 'TR', 'Asia/Tokyo': 'JP',
    'Australia/Sydney': 'AU', 'America/Toronto': 'CA', 'America/New_York': 'US', 'America/Chicago': 'US',
    'America/Los_Angeles': 'US', 'America/Denver': 'US'
  };

  function detectCountry() {
    try {
      var q = (typeof location !== 'undefined') && new URLSearchParams(location.search).get('region');
      if (q && COUNTRY[q.toUpperCase()]) return q.toUpperCase();
    } catch (e) {}
    var langs = [];
    if (typeof navigator !== 'undefined') langs = (navigator.languages || []).concat(navigator.language || []);
    try { langs.push(Intl.DateTimeFormat().resolvedOptions().locale); } catch (e) {}
    for (var i = 0; i < langs.length; i++) {
      var m = /[-_]([A-Za-z]{2})(?:$|[-_])/.exec(String(langs[i]));
      if (m && COUNTRY[m[1].toUpperCase()]) return m[1].toUpperCase();
    }
    try { var tz = Intl.DateTimeFormat().resolvedOptions().timeZone; if (TZ_COUNTRY[tz]) return TZ_COUNTRY[tz]; } catch (e) {}
    return 'US';
  }

  function priceFor(sku, country) {
    var idx = PRODUCTS.findIndex(function (p) { return p.sku === sku; });
    var cfg = COUNTRY[country] || ['A', 'USD'];
    var table = PRICE_TABLE[cfg[0]][cfg[1]] ? PRICE_TABLE[cfg[0]][cfg[1]] : PRICE_TABLE[cfg[0]].USD;
    var cur = PRICE_TABLE[cfg[0]][cfg[1]] ? cfg[1] : 'USD';
    var amount = table[idx], text;
    try {
      text = new Intl.NumberFormat(undefined, { style: 'currency', currency: cur,
        minimumFractionDigits: (amount % 1 || cur === 'CHF') ? 2 : 0, maximumFractionDigits: 2 }).format(amount);
    } catch (e) { text = cur + ' ' + amount; }
    return { amount: amount, currency: cur, tier: cfg[0], text: text };
  }

  root.Economy = { ECONOMY: ECONOMY, PRODUCTS: PRODUCTS, PRICE_TABLE: PRICE_TABLE, COUNTRY: COUNTRY,
    detectCountry: detectCountry, priceFor: priceFor };
})(typeof self !== 'undefined' ? self : this);
