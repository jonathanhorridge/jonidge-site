/* Pocket Burrow game data: rooms, critters, economy numbers, decorations, products.
 * Pure data + tiny helpers, no DOM. Works in the browser (window.PB_DATA) and in Node tests (module.exports).
 * Every number here is documented in docs/GDD.md section 7; change them here only. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PB_DATA = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var HOUR = 3600 * 1000;

  // ---------- goods (one per room) ----------
  var GOODS = {
    mushroom: { name: 'Mushrooms', icon: '🍄', value: 1 },
    bread:    { name: 'Bread',     icon: '🥖', value: 2 },
    tale:     { name: 'Tales',     icon: '📖', value: 3 },
    salt:     { name: 'Spring Salts', icon: '🧂', value: 4 },
    tea:      { name: 'Tea Leaves', icon: '🍃', value: 5 },
    honey:    { name: 'Honey',     icon: '🍯', value: 6 },
    yarn:     { name: 'Yarn',      icon: '🧶', value: 8 },
    glow:     { name: 'Glowcaps',  icon: '✨', value: 10 },
    note:     { name: 'Notes',     icon: '🎵', value: 12 },
    stardust: { name: 'Stardust',  icon: '⭐', value: 15 }
  };

  // ---------- rooms ----------
  // rate = goods per hour at level 1 (acorn value of one hour = rate * GOODS[good].value). cost = acorns to build.
  var ROOMS = [
    { id: 'farm',    name: 'Mushroom Farm', good: 'mushroom', rate: 24,  cost: 0,     unlock: 1,  blurb: 'Damp, dark and perfect for little caps.' },
    { id: 'bakery',  name: 'Bakery',        good: 'bread',    rate: 25,  cost: 220,   unlock: 2,  blurb: 'Warm ovens and the smell of fresh crust.' },
    { id: 'library', name: 'Library',       good: 'tale',     rate: 36,  cost: 600,   unlock: 3,  blurb: 'Roots for shelves, lanterns for reading.' },
    { id: 'spring',  name: 'Hot Spring',    good: 'salt',     rate: 60,  cost: 1400,  unlock: 4,  blurb: 'A steaming pool tucked under the clay.' },
    { id: 'tea',     name: 'Tea Room',      good: 'tea',      rate: 104, cost: 3000,  unlock: 5,  blurb: 'Low tables, round cups, no rush.' },
    { id: 'honey',   name: 'Honey Cellar',  good: 'honey',    rate: 166, cost: 6000,  unlock: 6,  blurb: 'Golden jars and a gentle hum.' },
    { id: 'yarn',    name: 'Yarn Nook',     good: 'yarn',     rate: 225, cost: 11000, unlock: 7,  blurb: 'Soft piles, clicking needles.' },
    { id: 'glow',    name: 'Glow Grotto',   good: 'glow',     rate: 300, cost: 18000, unlock: 8,  blurb: 'Crystals that hum in the dark.' },
    { id: 'music',   name: 'Music Hall',    good: 'note',     rate: 400, cost: 29000, unlock: 9,  blurb: 'Tiny stage, perfect echo.' },
    { id: 'loft',    name: 'Stargazer Loft', good: 'stardust', rate: 500, cost: 45000, unlock: 10, blurb: 'A skylight right up to the night sky.' }
  ];
  var ROOM_BY_ID = {}; ROOMS.forEach(function (r) { ROOM_BY_ID[r.id] = r; });

  // index = level-1
  var ROOM_LEVELS = {
    max: 5,
    rateMult: [1, 1.6, 2.3, 3.1, 4.0],
    capHours: [4, 6, 8, 10, 12],
    beds:     [2, 2, 3, 3, 4],
    upgradeCostMult: [0, 1.0, 2.2, 4.5, 9],   // x room.cost (farm uses 60 as its base)
    upgradeGoods: [0, 20, 40, 80, 160]          // goods of the room's own type
  };
  var FARM_UPGRADE_BASE = 60;

  // ---------- critters ----------
  var RARITY = {
    common:    { name: 'Common',    weight: 60, bonus: 0.05, color: '#8fb98b' },
    uncommon:  { name: 'Uncommon',  weight: 28, bonus: 0.10, color: '#6fa8d6' },
    rare:      { name: 'Rare',      weight: 10, bonus: 0.20, color: '#b48be0' },
    legendary: { name: 'Legendary', weight: 2,  bonus: 0.35, color: '#f0b63a' }
  };

  function F(body, belly, o) { o = o || {}; return Object.assign({ arch: 'furry', body: body, belly: belly, ears: 'round', tail: 'thin', nose: '#e58b8b', acc: 'none', accColor: '#d9534f' }, o); }
  var CRITTERS = [
    // Mushroom Farm
    { id: 'truffle', name: 'Truffle', species: 'Mole', room: 'farm', rarity: 'common', trait: 'Earnest and always muddy', quote: 'I dug here first. Well, near here.', look: F('#7b8798', '#c9ced6', { ears: 'tiny', tail: 'none', nose: '#f2a6a6', big: 1.05 }) },
    { id: 'morel', name: 'Morel', species: 'Snail', room: 'farm', rarity: 'common', trait: 'Slow and philosophical', quote: 'Is a mushroom a cap... or a hat?', look: { arch: 'snail', body: '#d9c7a1', shell: '#b7653a', swirl: '#8a4526' } },
    { id: 'sporey', name: 'Sporey', species: 'Beetle', room: 'farm', rarity: 'uncommon', trait: 'Cheerful gardener', quote: 'Everything grows if you hum at it.', look: { arch: 'beetle', body: '#5e8d5a', spots: '#f3e9a8', acc: 'flower', accColor: '#f08fb0' } },
    // Bakery
    { id: 'crumb', name: 'Crumb', species: 'Mouse', room: 'bakery', rarity: 'common', trait: 'Greedy but generous', quote: 'One for me, one for you. Two for me.', look: F('#d8b894', '#f7ead7', { ears: 'round', tail: 'thin', nose: '#e89aa0' }) },
    { id: 'bun', name: 'Bun', species: 'Hedgehog', room: 'bakery', rarity: 'common', trait: 'Shy, bakes at 3 a.m.', quote: 'Please don\'t look at the dough yet.', look: F('#8a6a52', '#f2dcc0', { ears: 'tiny', tail: 'none', spikes: '#5c4333', nose: '#4a3a30', acc: 'hat', accColor: '#f8f4ea' }) },
    { id: 'poppy', name: 'Poppy', species: 'Squirrel', room: 'bakery', rarity: 'uncommon', trait: 'Chatty, buns for everyone', quote: 'Did I tell you about my cousin? Anyway, bun?', look: F('#c9773e', '#f6e1c2', { ears: 'point', tail: 'bushy', nose: '#5a3a2a', acc: 'bow', accColor: '#e0556a' }) },
    // Library
    { id: 'inkwell', name: 'Inkwell', species: 'Mole', room: 'library', rarity: 'common', trait: 'Bookish and absent-minded', quote: 'Have you seen my glasses? Oh. Wearing them.', look: F('#4f5d7a', '#aab4c8', { ears: 'tiny', tail: 'none', nose: '#e8a0a0', acc: 'glasses', accColor: '#2c2c3a' }) },
    { id: 'page', name: 'Page', species: 'Dormouse', room: 'library', rarity: 'uncommon', trait: 'Sleepy reader', quote: 'Just one more chap... zzz.', look: F('#e0b27a', '#fff2dc', { ears: 'round', tail: 'bushy', nose: '#d98a8a', acc: 'scarf', accColor: '#7fb4a0' }) },
    { id: 'quill', name: 'Quill', species: 'Owl', room: 'library', rarity: 'rare', trait: 'Pompous poet, secretly shy', quote: 'Roses are... um. Roots are red?', look: { arch: 'winged', kind: 'owl', body: '#a3825c', belly: '#f1e2c6', wing: '#7a5c3c', acc: 'glasses', accColor: '#c9a227' } },
    // Hot Spring
    { id: 'steamy', name: 'Steamy', species: 'Frog', room: 'spring', rarity: 'common', trait: 'Easygoing', quote: 'Ahhh. Yeah. That\'s the spot.', look: { arch: 'frog', body: '#7fb872', belly: '#e9f2c9', spot: '#5c9a56', acc: 'towel', accColor: '#ffffff' } },
    { id: 'brock', name: 'Grandpa Brock', species: 'Badger', room: 'spring', rarity: 'uncommon', trait: 'Grumbly but sweet', quote: 'Hmph. The water is... acceptable.', look: F('#6b6b73', '#d9d9de', { ears: 'round', tail: 'none', stripe: '#f4f1ea', nose: '#2e2e34', acc: 'towel', accColor: '#a8d4e6' }) },
    { id: 'yuzu', name: 'Yuzu', species: 'Fox', room: 'spring', rarity: 'rare', trait: 'Elegant, treasures silence', quote: '...', look: F('#e8924a', '#fff1dc', { ears: 'point', tail: 'bushy', nose: '#3a2a22', tip: '#fff6e8', acc: 'flower', accColor: '#f6c744' }) },
    // Tea Room
    { id: 'chamomile', name: 'Chamomile', species: 'Rabbit', room: 'tea', rarity: 'common', trait: 'Calm, hears everything', quote: 'Milk first. Always milk first.', look: F('#efe6d6', '#ffffff', { ears: 'long', tail: 'puff', nose: '#f0a0aa', acc: 'flower', accColor: '#f7e27a' }) },
    { id: 'sip', name: 'Sip', species: 'Frog', room: 'tea', rarity: 'common', trait: 'Dry humour', quote: 'I\'m not grumpy. I\'m steeping.', look: { arch: 'frog', body: '#a3c76b', belly: '#f2f2cf', spot: '#7ea64a', acc: 'hat', accColor: '#6e8f55' } },
    { id: 'earl', name: 'Earl', species: 'Hedgehog', room: 'tea', rarity: 'uncommon', trait: 'Dignified, a little dusty', quote: 'One lump. Spiky side down.', look: F('#a58e7b', '#efe3d2', { ears: 'tiny', tail: 'none', spikes: '#6e5a4a', nose: '#3c2e28', acc: 'glasses', accColor: '#caa64a' }) },
    // Honey Cellar
    { id: 'bumble', name: 'Bumble', species: 'Bee', room: 'honey', rarity: 'common', trait: 'Clumsy and kind', quote: 'Sorry! Sorry! That was a wall.', look: { arch: 'bee', body: '#f6c744', stripe: '#3b2f2a', wing: '#e8f4ff' } },
    { id: 'clover', name: 'Clover', species: 'Bee', room: 'honey', rarity: 'common', trait: 'Dreamy', quote: 'I was thinking about flowers. Again.', look: { arch: 'bee', body: '#f0d36a', stripe: '#5c4a33', wing: '#eef6ff', acc: 'flower', accColor: '#9fd68a' } },
    { id: 'marigold', name: 'Queen Marigold', species: 'Bee', room: 'honey', rarity: 'legendary', trait: 'Gentle ruler of the hive', quote: 'Welcome, dear. Sit. Sticky is fine.', look: { arch: 'bee', body: '#f3b52a', stripe: '#46302a', wing: '#fff6d0', acc: 'crown', accColor: '#ffd84a', big: 1.15 } },
    // Yarn Nook
    { id: 'purl', name: 'Purl', species: 'Rabbit', room: 'yarn', rarity: 'common', trait: 'Patient knitter', quote: 'Knit one, purl one, breathe.', look: F('#c9a7c8', '#f6ebf5', { ears: 'long', tail: 'puff', nose: '#e090a8', acc: 'scarf', accColor: '#8fb8e8' }) },
    { id: 'skein', name: 'Skein', species: 'Squirrel', room: 'yarn', rarity: 'common', trait: 'Tangles everything', quote: 'It was a sweater a minute ago!', look: F('#b5683c', '#f2d9b8', { ears: 'point', tail: 'bushy', nose: '#4a2e22', acc: 'scarf', accColor: '#e46a6a' }) },
    { id: 'stitch', name: 'Stitch', species: 'Fox', room: 'yarn', rarity: 'uncommon', trait: 'Sneaky seamstress', quote: 'I borrowed your sock. For art.', look: F('#d9703a', '#ffe9cf', { ears: 'point', tail: 'bushy', nose: '#3a2a22', tip: '#fff6e8', acc: 'bow', accColor: '#6a8fe0' }) },
    // Glow Grotto
    { id: 'gleam', name: 'Gleam', species: 'Glowbeetle', room: 'glow', rarity: 'common', trait: 'Shiny-minded', quote: 'I\'m not showing off. I\'m just... bright.', look: { arch: 'beetle', body: '#3d4f8a', spots: '#baf5ff', glow: '#9fefff' } },
    { id: 'lumen', name: 'Lumen', species: 'Bat', room: 'glow', rarity: 'uncommon', trait: 'Whispers, loves the dark', quote: 'Shh. The crystals are singing.', look: { arch: 'winged', kind: 'bat', body: '#6a5a86', belly: '#cfc3e6', wing: '#4a3c68' } },
    { id: 'geode', name: 'Geode', species: 'Mole', room: 'glow', rarity: 'rare', trait: 'Gentle giant', quote: 'I\'m sparkly on the inside. And outside.', look: F('#6fa3a8', '#d5eef0', { ears: 'tiny', tail: 'none', nose: '#f2b0b8', big: 1.15, gem: '#9fefff' }) },
    // Music Hall
    { id: 'tinker', name: 'Tinker', species: 'Mouse', room: 'music', rarity: 'common', trait: 'Hums while working', quote: 'Hm-hm-hmmm. Oh, were you talking?', look: F('#bfc3cc', '#f0f1f4', { ears: 'round', tail: 'thin', nose: '#ee9aa6', acc: 'hat', accColor: '#e0a63a' }) },
    { id: 'fiddle', name: 'Fiddle', species: 'Frog', room: 'music', rarity: 'uncommon', trait: 'Loves an audience', quote: 'This one\'s for the cheap seats!', look: { arch: 'frog', body: '#6fb7a4', belly: '#e6f5df', spot: '#4e9a88', acc: 'bow', accColor: '#e0556a' } },
    { id: 'lullaby', name: 'Lullaby', species: 'Moth', room: 'music', rarity: 'rare', trait: 'Sings to sleepers', quote: 'Close your eyes. I\'ll hum the rest.', look: { arch: 'winged', kind: 'moth', body: '#e8dcc6', belly: '#fff7e8', wing: '#c9b4e8' } },
    // Stargazer Loft
    { id: 'comet', name: 'Comet', species: 'Fox', room: 'loft', rarity: 'uncommon', trait: 'Restless dreamer', quote: 'That one! No, THAT one!', look: F('#8a7cc9', '#e6e0f7', { ears: 'point', tail: 'bushy', nose: '#2a2438', tip: '#fff6e8', acc: 'scarf', accColor: '#f6d24a' }) },
    { id: 'nova', name: 'Nova', species: 'Moth', room: 'loft', rarity: 'rare', trait: 'Star-struck', quote: 'It\'s so big. Isn\'t it so BIG?', look: { arch: 'winged', kind: 'moth', body: '#d8d2f0', belly: '#ffffff', wing: '#8fb4f0' } },
    { id: 'luna', name: 'Luna', species: 'Owl', room: 'loft', rarity: 'legendary', trait: 'Quiet guardian of the night', quote: 'Rest. I\'ll watch the stars for you.', look: { arch: 'winged', kind: 'owl', body: '#586a9a', belly: '#dbe2f7', wing: '#3e4b78', acc: 'crown', accColor: '#dfe8ff', big: 1.2 } }
  ];
  var CRITTER_BY_ID = {}; CRITTERS.forEach(function (c) { CRITTER_BY_ID[c.id] = c; });

  // ---------- grid / digging ----------
  var GRID = {
    cols: 4, rows: 8, entranceCol: 1,
    strata: [ { name: 'Topsoil', fromRow: 0, level: 1 }, { name: 'Clay', fromRow: 3, level: 4 }, { name: 'Deep Rock', fromRow: 6, level: 7 } ]
  };
  function stratumForRow(y) { var s = GRID.strata[0]; GRID.strata.forEach(function (t) { if (y >= t.fromRow) s = t; }); return s; }

  var DIG = {
    freeTapDigs: 3, tapsPerFreeDig: 3,
    costBase: 15, costGrowth: 1.28,
    times: [30, 120, 300, 900, 1800, 3600, 7200, 10800, 14400],   // seconds, indexed by dugCount - freeTapDigs, last repeats
    berrySkipMinutesPerBerry: 20
  };
  function digCost(dugCount) { return Math.round(DIG.costBase * Math.pow(DIG.costGrowth, dugCount)); }
  function digSeconds(dugCount) {
    var i = dugCount - DIG.freeTapDigs;
    if (i < 0) return 0;
    return DIG.times[Math.min(i, DIG.times.length - 1)];
  }

  // ---------- burrow level ("cosy") ----------
  var COZY = { perRoom: 10, perRoomLevel: 5, perResident: 3, perMet: 1, perDecor: 2, thresholds: [0, 10, 30, 60, 100, 160, 240, 340, 470, 640] };

  // ---------- visitors ----------
  var VISITORS = {
    slotHours: [9, 14, 19], nightHour: 21, nightRareChance: 0.25, rarePityDays: 6,
    maxWaiting: 5, staysHours: 36, wandererChance: 0.15,
    requestBase: 2, reward: { acornMult: 2.5, berryChanceCommon: 0.1 }
  };

  // ---------- gifts & away ----------
  var GIFTS = { everyHours: 8, acornHours: 1, berryChance: { common: 0.02, uncommon: 0.04, rare: 0.1, legendary: 0.2 } };

  // ---------- daily calendar (visit days, never resets) ----------
  var DAILY = [
    { acorns: 40 }, { goods: 10 }, { acorns: 80 }, { berries: 1 }, { acorns: 150 }, { goods: 25 }, { berries: 3, label: 'Weekly treat' }
  ];

  var ALBUM_REWARDS = [ { at: 5, berries: 2 }, { at: 10, berries: 3, acorns: 500 }, { at: 15, berries: 5 }, { at: 20, berries: 8, acorns: 5000 }, { at: 25, berries: 10 }, { at: 30, berries: 20, acorns: 25000 } ];

  // ---------- ads / rewarded ----------
  var ADS = { perDay: 5, doubleHarvest: 3, berryPerDay: 1 };

  // ---------- decorations (cosmetic) ----------
  var DECOR = [
    { id: 'pumpkins',  name: 'Pumpkin Patch',    season: 'autumn', price: 12, icon: '🎃' },
    { id: 'lanterns',  name: 'Paper Lanterns',   season: 'autumn', price: 18, icon: '🏮' },
    { id: 'snowman',   name: 'Little Snowmole',  season: 'winter', price: 12, icon: '⛄' },
    { id: 'fairy',     name: 'Fairy Lights',     season: 'winter', price: 18, icon: '✨' },
    { id: 'blossom',   name: 'Blossom Branch',   season: 'spring', price: 12, icon: '🌸' },
    { id: 'tulips',    name: 'Tulip Border',     season: 'spring', price: 18, icon: '🌷' },
    { id: 'sunflower', name: 'Sunflower Row',    season: 'summer', price: 12, icon: '🌻' },
    { id: 'jar',       name: 'Firefly Jar',      season: 'summer', price: 18, icon: '🫙' },
    { id: 'chimes',    name: 'Wind Chimes',      season: 'any',    price: 15, icon: '🎐' },
    { id: 'goldframe', name: 'Golden Acorn Sign', season: 'any',   price: 0,  icon: '🌰', supporter: true }
  ];
  function seasonOf(date, southern) {
    var m = date.getMonth(); // 0..11
    var s = (m === 11 || m <= 1) ? 'winter' : (m <= 4 ? 'spring' : (m <= 7 ? 'summer' : 'autumn'));
    if (southern) s = { winter: 'summer', summer: 'winter', spring: 'autumn', autumn: 'spring' }[s];
    return s;
  }

  // ---------- products (cosmetic IAP; prices follow the Sunplop tier table, see docs/GDD.md 11) ----------
  var PRODUCTS = [
    { sku: 'berries_60',   kind: 'pack', name: 'Pocketful of Glowberries', berries: 60,  usd: 1.99 },
    { sku: 'berries_180',  kind: 'pack', name: 'Basket of Glowberries',    berries: 180, usd: 4.99 },
    { sku: 'berries_400',  kind: 'pack', name: 'Barrel of Glowberries',    berries: 400, usd: 9.99 },
    { sku: 'supporter',    kind: 'supporter', name: 'Cozy Supporter', oneTime: true, usd: 3.99,
      desc: 'Golden Acorn Sign, a tiny star on your burrow door, and 60 Glowberries. Never gives power.' }
  ];

  return {
    HOUR: HOUR, GOODS: GOODS, ROOMS: ROOMS, ROOM_BY_ID: ROOM_BY_ID, ROOM_LEVELS: ROOM_LEVELS, FARM_UPGRADE_BASE: FARM_UPGRADE_BASE,
    RARITY: RARITY, CRITTERS: CRITTERS, CRITTER_BY_ID: CRITTER_BY_ID,
    GRID: GRID, stratumForRow: stratumForRow, DIG: DIG, digCost: digCost, digSeconds: digSeconds,
    COZY: COZY, VISITORS: VISITORS, GIFTS: GIFTS, DAILY: DAILY, ALBUM_REWARDS: ALBUM_REWARDS, ADS: ADS, DECOR: DECOR, seasonOf: seasonOf, PRODUCTS: PRODUCTS,
    START: { acorns: 120, berries: 3 }
  };
});
