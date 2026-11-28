/* Clawcastle data: tiles, troops, enemy buildings, upgrades and the hand-tuned raid levels. */
(function (root) {
  'use strict';
  // Tile colours (index = tile type). Each one charges a troop.
  var TILES = [
    { key: 'shell', name: 'Shell', troop: 'shieldcrab', col: '#FF7FA8' },
    { key: 'pebble', name: 'Pebble', troop: 'lobster', col: '#8FA3C7' },
    { key: 'kelp', name: 'Kelp', troop: 'eel', col: '#4DC07A' },
    { key: 'star', name: 'Starfish', troop: 'spinner', col: '#FF9A3C' },
    { key: 'pearl', name: 'Pearl', troop: 'puffer', col: '#B9A6FF' }
  ];
  var TROOPS = {
    shieldcrab: { name: 'Shieldcrab', hp: 6, dmg: 1, spd: 1, taunt: true, desc: 'Tough. Cannons always shoot it first.' },
    lobster: { name: 'Rock Lobster', hp: 3, dmg: 1, spd: 1, wallx: 2, desc: 'Double damage against walls.' },
    eel: { name: 'Eel', hp: 2, dmg: 1, spd: 2, sneak: true, desc: 'Fast. Slips past walls to hit what is behind.' },
    spinner: { name: 'Spinner', hp: 3, dmg: 0.7, spd: 1, splash: true, desc: 'Hits its lane and both lanes beside it.' },
    puffer: { name: 'Puffer', hp: 2, dmg: 3, spd: 1, boom: true, st: 1, desc: 'Pops on arrival for a big blast.' }
  };
  // Enemy buildings. cd = turns between shots, dmg = damage to troops.
  var BUILD = {
    W: { k: 'wall', name: 'Driftwood Wall', hp: 4, desc: 'Just gets in the way.' },
    C: { k: 'cannon', name: 'Bucket Cannon', hp: 5, cd: 2, dmg: 3, range: 1, desc: 'Shoots a troop in its lane or next to it. No target? It lobs a sand clump onto your board.' },
    K: { k: 'cat', name: 'Coconut Catapult', hp: 5, cd: 2, dmg: 2, range: 0, desc: 'Splashes every troop in its lane. No target? It glues barnacles onto two tiles.' },
    G: { k: 'gull', name: 'Gull Lookout', hp: 4, cd: 3, desc: 'Drops two sand clumps onto your board.' },
    T: { k: 'chest', name: 'Treasure Chest', hp: 3, loot: 25, desc: 'Break it for +25 Sand.' },
    F: { k: 'flag', name: 'Flag Tower', hp: 8, cd: 2, dmg: 2, range: 1, desc: 'Topple it to win the raid! It shoots back at troops next to it.' }
  };
  // Upgrades bought at your home beach. Troop levels 1-5. cost[i] = price to go from level i+1 to i+2.
  var UPGRADES = [
    { id: 'shieldcrab', name: 'Shieldcrab Hut', cur: 'sand', cost: [60, 140, 260, 420], max: 5, start: 1, desc: '+20% health and damage per level' },
    { id: 'lobster', name: 'Lobster Pot', cur: 'sand', cost: [60, 140, 260, 420], max: 5, start: 1, desc: '+20% health and damage per level' },
    { id: 'eel', name: 'Eel Grotto', cur: 'sand', cost: [60, 140, 260, 420], max: 5, start: 1, desc: '+20% health and damage per level' },
    { id: 'spinner', name: 'Starfish Pool', cur: 'sand', cost: [60, 140, 260, 420], max: 5, start: 1, desc: '+20% health and damage per level' },
    { id: 'puffer', name: 'Puffer Bay', cur: 'sand', cost: [60, 140, 260, 420], max: 5, start: 1, desc: '+20% health and damage per level' },
    { id: 'harbour', name: 'Harbour', cur: 'pearls', cost: [4, 8, 14], max: 3, start: 0, desc: '+1 move in every raid per level' },
    { id: 'shrine', name: 'Tide Shrine', cur: 'pearls', cost: [3, 6, 10], max: 3, start: 0, desc: 'Pearl Bomb and Riptide hit 25% harder per level' },
    { id: 'castle', name: 'Your Sandcastle', cur: 'sand', cost: [150, 300, 600, 1000], max: 5, start: 1, desc: '+10% Sand from raids per level, and it grows!' }
  ];
  // Levels: lanes[col] = buildings front-to-back, tokens like "W4" (type + optional hp).
  // colors = number of tile types in play (4 = no pearls yet).
  var LEVELS = [
    { name: 'First Pinch', moves: 12, colors: 4, lanes: ['', '', '', 'W3 F5', '', '', ''], tip: 'Swipe to match 3. A match sends a troop up that column. Crabs in an empty lane scuttle sideways to the fight!' },
    { name: 'Driftwood Line', moves: 14, colors: 4, lanes: ['', 'W3', 'W3', 'W4 F7', 'W3', 'W3', ''], tip: 'Rock Lobsters (pebbles) smash walls twice as fast.' },
    { name: 'Bucket Trouble', moves: 14, colors: 4, lanes: ['', 'C4', '', 'W4 F7', '', 'C4', ''], tip: 'Bucket Cannons shoot troops nearby, or lob sand on your board. Clear sand by matching next to it.', isNew: 'C' },
    { name: 'Puffer Bay', moves: 16, colors: 5, lanes: ['W3', '', 'W4', 'W4 F8', 'W4', '', 'W3'], tip: 'Pearls send Puffers: they pop on arrival for 5 damage.', isNew: 'pearl' },
    { name: 'Match Four', moves: 20, colors: 5, lanes: ['', 'C4', 'W4', 'W4 C4 F9', 'W4', 'T3', ''], tip: 'Match 4 in a row for a Brute: double health, double damage. Chests give bonus Sand.', isNew: 'T' },
    { name: 'Seagull Watch', moves: 17, colors: 5, lanes: ['G4', '', 'W4', 'W5 F9', 'W4', '', 'G4'], tip: 'Gull Lookouts drop sand every 3 turns. Take them out early or bring Eels.', isNew: 'G' },
    { name: 'Corner Shot', moves: 20, colors: 5, lanes: ['', 'W4', 'C5', 'W5 F10', 'C5', 'W4', ''], tip: 'Match in an L or T shape to drop a Pearl Bomb on three lanes at once.', isNew: 'bomb' },
    { name: 'Coconut Grove', moves: 17, colors: 5, lanes: ['K5', '', 'W4', 'W5 F10', 'W4', '', 'K5'], tip: 'Coconut Catapults splash a whole lane, or glue barnacles onto your tiles. Barnacled tiles can\'t be swiped; match them to break free.', isNew: 'K' },
    { name: 'Low Tide Fort', moves: 22, colors: 5, lanes: ['W3', 'C5', 'W5', 'W5 W4 F10', 'W5', 'C5', 'W3'], tip: 'Shieldcrabs (shells) soak up cannon fire. Send them first!' },
    { name: 'The Long Wall', moves: 22, colors: 5, lanes: ['W5', 'W5', 'W6', 'W6 F11', 'W6', 'W5', 'W5 T3'], tip: 'Match 5 in a row for a Riptide: it hits every lane and washes sand away.', isNew: 'riptide' },
    { name: 'Gull Island', moves: 22, colors: 5, lanes: ['G4', 'C5', '', 'W5 G4 F11', '', 'C5', 'G4'], tip: 'Lots of sand incoming. Spinners (starfish) hit three lanes at once.' },
    { name: 'Off-Centre', moves: 22, colors: 5, lanes: ['W4 F11', 'C5', 'W4', '', 'K5', 'W4', 'T3'], tip: 'The flag is on the edge today. Plan your lanes!' },
    { name: 'Twin Buckets', moves: 22, colors: 5, lanes: ['', 'W4 C5', 'C5', 'W6 F12', 'C5', 'W4 C5', ''], tip: 'Cannons cover the lanes beside them. Hit from the edges.' },
    { name: 'Barnacle Bay', moves: 21, colors: 5, lanes: ['K5', 'W5', 'K5', 'W6 F12', 'K5', 'W5', 'K5'], tip: 'Catapults everywhere. Keep your troops spread out.' },
    { name: 'Crab King\'s Gate', moves: 24, colors: 5, lanes: ['G4', 'W5 C5', 'W5', 'W6 C5 F13', 'W5', 'W5 C5', 'G4'], tip: 'A proper fortress. Use your upgrades!' },
    { name: 'Sunset Siege', moves: 24, colors: 5, lanes: ['C5', 'K5', 'W6', 'W6 W5 F13', 'W6', 'K5', 'C5 T3'], tip: 'Cannons on the flanks, catapults inside.' },
    { name: 'Storm Tide', moves: 25, colors: 5, lanes: ['W5', 'G4 C5', 'W6 K5', 'W7 F14', 'W6 K5', 'G4 C5', 'W5'], tip: 'Everything at once. Good luck, Captain!' },
    { name: 'Clawcastle', moves: 26, colors: 5, lanes: ['C5', 'W6 G4', 'W6 C5', 'W7 K6 F15', 'W6 C5', 'W6 G4', 'C5 T3'], tip: 'The great Clawcastle itself. Topple the flag!' }
  ];

  var MORE = [
    { name: 'Tide Pools', world: 1, moves: 22, colors: 5, hpx: 4.2, lanes: ['W5', 'T3', 'W5', 'W6 F12', 'W5', 'T3', 'W5'], tip: 'Two chests sit on the flanks. Grab them if you can, but the flag still wins the raid.' },
    { name: 'Coral Gate', world: 1, moves: 22, colors: 5, hpx: 4.2, lanes: ['C5', 'W6', 'C5', 'W6 F13', 'C5', 'W6', 'C5'], tip: 'A full line of cannons. Send Shieldcrabs up the middle and nibble from a quiet lane.' },
    { name: 'Crossfire', world: 1, moves: 23, colors: 5, hpx: 4.4, lanes: ['K5', 'C5', 'W6', 'W6 F13', 'W6', 'C5', 'K5'], tip: 'Catapults on the edge, cannons inside. Keep your army spread out.' },
    { name: 'Kelp Forest', world: 1, moves: 23, colors: 5, hpx: 4.4, lanes: ['G4 W5', '', 'W6 G4', 'W7 F14', 'W6 G4', '', 'G4 W5'], tip: 'Gulls hide behind walls. Eels can slip past and shut them up.' },
    { name: 'Narrows', world: 1, moves: 22, colors: 5, hpx: 4.5, lanes: ['', '', 'W7 C6', 'W7 C6 F14', 'W7 C6', '', ''], tip: 'Everything is piled in the middle three lanes. Pearl Bombs shine here.' },
    { name: 'Pearl Vault', world: 1, moves: 24, colors: 5, hpx: 4.5, lanes: ['T3', 'K6', 'W6', 'W7 F14', 'W6', 'K6', 'T3'], tip: 'A vault of chests behind catapults. Decide: loot or the flag first.' },
    { name: 'Hammerhead Wall', world: 1, moves: 24, colors: 5, hpx: 4.6, lanes: ['W7', 'W7', 'W8', 'W8 F15', 'W8', 'W7', 'W7'], tip: 'All walls. Rock Lobsters and a Riptide will crack it open.' },
    { name: 'Cove Keep', world: 1, moves: 25, colors: 5, hpx: 4.8, lanes: ['G5 C6', 'W7', 'K6', 'W8 C6 F16', 'K6', 'W7', 'G5 C6'], tip: 'The keep of Coral Cove. Use every tool you have!' },
    { name: 'Lightning Buckets', world: 2, moves: 24, colors: 5, hpx: 5, lanes: ['C6', 'C6', 'C6', 'W8 F16', 'C6', 'C6', 'C6'], tip: 'Cannons on every flank. Shieldcrabs are your best friends.' },
    { name: 'Reef Maze', world: 2, moves: 24, colors: 5, hpx: 5, lanes: ['W6 K6', 'C6', 'W7', 'C6 W7 F16', 'W7', 'C6', 'W6 K6'], tip: 'A maze of walls and guns. Pick a lane and commit.' },
    { name: 'Gull Storm', world: 2, moves: 25, colors: 5, hpx: 5, lanes: ['G5', 'G5 C6', 'G5', 'W8 F17', 'G5', 'G5 C6', 'G5'], tip: 'Sand will rain down. Clear it quickly or you will drown in clumps.' },
    { name: 'Iron Tide', world: 2, moves: 28, colors: 5, hpx: 5.0, lanes: ['W7 C6', 'K6', 'W8', 'W8 K6 F17', 'W8', 'K6', 'W7 C6'], tip: 'Heavy guns behind thick walls. Brutes help a lot.' },
    { name: 'Barnacle Crown', world: 2, moves: 26, colors: 5, hpx: 5.2, lanes: ['K6', 'K6', 'W8', 'W8 F18', 'W8', 'K6', 'K6'], tip: 'The board will get glued. Match barnacled tiles to free them, or wash them with a Riptide.' },
    { name: 'Deep Moat', world: 2, moves: 26, colors: 5, hpx: 5.4, lanes: ['C6 G5', 'W8', 'C6 W7', 'W9 F18', 'C6 W7', 'W8', 'C6 G5'], tip: 'A deep defence. Chip the sides, then strike the flag.' },
    { name: 'Hurricane Row', world: 2, moves: 30, colors: 5, hpx: 5.0, lanes: ['W7 K6', 'C7', 'W8 K6', 'W9 F19', 'W8 K6', 'C7', 'W7 K6'], tip: 'Everything fires often. Keep troops in several lanes so one volley cannot wipe you out.' },
    { name: "King Crab's Keep", world: 2, moves: 32, colors: 5, hpx: 5.0, lanes: ['G5 C7', 'W8 K6', 'W8 C7', 'W9 K7 F20', 'W8 C7', 'W8 K6', 'G5 C7'], tip: 'The keep of Storm Reef. Take a deep breath!' },
    { name: 'The Last Castle', world: 2, moves: 34, colors: 5, hpx: 5.1, lanes: ['C7 K6', 'W9 G5', 'W9 C7', 'W10 K7 F22', 'W9 C7', 'W9 G5', 'C7 K6 T4'], tip: 'The last sandcastle on the shore. Topple the flag, Captain!' }
  ];
  MORE.forEach(function (L) { LEVELS.push(L); });
  LEVELS.forEach(function (L, i) { if (L.world == null) L.world = i <= 17 ? 0 : L.world; });

  var WORLDS = [
    { id: 'shore', name: 'Sunny Shore', from: 0, to: 17, blurb: 'Learn the beach and topple the first Clawcastle.' },
    { id: 'cove', name: 'Coral Cove', from: 18, to: 25, blurb: 'Chests, crossfire and a sturdier keep.' },
    { id: 'reef', name: 'Storm Reef', from: 26, to: 34, blurb: 'The hardest sieges. Only the cleverest captains finish this.' }
  ];

  var VCOLS = 7, VROWS = 4; // row 0 = front (faces attackers), row VROWS-1 = back (keep)
  var VBUILD = [
    { code: 'W', name: 'Driftwood Wall', cur: 'sand', cost: 80, upCost: [120, 200], max: 3, unlock: 0, desc: 'Blocks the lane. Upgrade for more health.' },
    { code: 'C', name: 'Bucket Cannon', cur: 'sand', cost: 160, upCost: [220, 360], max: 3, unlock: 2, desc: 'Shoots nearby troops, or lobs sand if the lane is empty.' },
    { code: 'K', name: 'Coconut Catapult', cur: 'sand', cost: 220, upCost: [300, 480], max: 3, unlock: 6, desc: 'Splashes a whole lane, or glues barnacles onto the board.' },
    { code: 'G', name: 'Gull Lookout', cur: 'sand', cost: 180, upCost: [260, 400], max: 3, unlock: 5, desc: 'Drops sand clumps onto the attacker\u2019s board.' },
    { code: 'T', name: 'Treasure Chest', cur: 'sand', cost: 100, upCost: [160, 240], max: 3, unlock: 3, desc: 'If a raider breaks it they steal bonus Sand. A tasty lure.' },
    { code: 'F', name: 'Flag Tower', cur: 'sand', cost: 0, upCost: [400, 800], max: 3, unlock: 0, unique: true, desc: 'Your keep. If it falls, you lose the defence. Upgrade for more health and a sharper shot.' }
  ];
  var DECOS = [
    { id: 'palm', name: 'Palm Tree', cur: 'sand', cost: 50, desc: 'A shady palm. Purely decorative.' },
    { id: 'umbrella', name: 'Beach Umbrella', cur: 'sand', cost: 40, desc: 'A bright umbrella for the sand.' },
    { id: 'statue', name: 'Starfish Statue', cur: 'pearls', cost: 3, desc: 'A proud little statue.' },
    { id: 'bucket', name: 'Toy Bucket', cur: 'sand', cost: 30, desc: 'A child\u2019s bucket and spade.' },
    { id: 'lantern', name: 'Shell Lantern', cur: 'pearls', cost: 5, desc: 'Glows softly at dusk.' }
  ];

  var XP_LEVELS = [0, 40, 90, 150, 230, 330, 450, 590, 750, 930, 1130, 1360, 1620, 1910, 2230, 2580, 2960, 3380, 3840, 4340, 4900];
  var STREAK = [
    { sand: 40 }, { pearls: 2 }, { chest: 'bronze' }, { sand: 80 }, { gems: 5 }, { pearls: 4 }, { chest: 'gold', gems: 10 }
  ];
  var QUEST_POOL = [
    { id: 'win_raids', title: 'Win 2 raids', kind: 'win_raids', target: 2, reward: { sand: 60, xp: 20 } },
    { id: 'win_one', title: 'Win a raid', kind: 'win_raids', target: 1, reward: { sand: 30, xp: 10 } },
    { id: 'three_star', title: 'Win a raid with 3 stars', kind: 'three_star', target: 1, reward: { pearls: 2, xp: 20 } },
    { id: 'deal_dmg', title: 'Deal 100 damage', kind: 'dmg', target: 100, reward: { sand: 50, xp: 15 } },
    { id: 'clear_tiles', title: 'Match 40 treasures', kind: 'cleared', target: 40, reward: { sand: 40, xp: 10 } },
    { id: 'open_chest', title: 'Open a chest', kind: 'chests', target: 1, reward: { pearls: 1, xp: 10 } },
    { id: 'pvp_raid', title: 'Raid a beach', kind: 'pvp', target: 1, reward: { sand: 70, pearls: 1, xp: 20 } },
    { id: 'upgrade', title: 'Upgrade a troop or building', kind: 'upgrade', target: 1, reward: { sand: 40, xp: 15 } },
    { id: 'place', title: 'Build or move something in your village', kind: 'place', target: 1, reward: { sand: 40, xp: 15 } },
    { id: 'brutes', title: 'Deploy 3 Brutes', kind: 'brutes', target: 3, reward: { pearls: 2, xp: 15 } }
  ];
  var CHESTS = {
    wood: { name: 'Driftwood Chest', sand: [20, 40], pearls: [0, 1], gems: [0, 0], copies: 1 },
    bronze: { name: 'Bronze Chest', sand: [40, 80], pearls: [1, 2], gems: [0, 1], copies: 2 },
    silver: { name: 'Silver Chest', sand: [80, 140], pearls: [2, 3], gems: [1, 2], copies: 3 },
    gold: { name: 'Gold Chest', sand: [140, 220], pearls: [3, 5], gems: [3, 6], copies: 4 }
  };
  var CARD_COPY_NEED = [0, 2, 4, 8, 12]; // copies needed to go from lv 1->2, 2->3, ...
  var CARD_SAND_NEED = [0, 60, 140, 260, 420];

  var PASS = [];
  (function () {
    var free = [
      { sand: 40 }, { chest: 'wood' }, { sand: 60 }, { pearls: 1 }, { chest: 'bronze' },
      { sand: 80 }, { pearls: 2 }, { deco: 'palm' }, { sand: 100 }, { chest: 'silver' },
      { gems: 3 }, { sand: 120 }, { pearls: 3 }, { deco: 'statue' }, { chest: 'silver' },
      { sand: 140 }, { pearls: 3 }, { gems: 5 }, { deco: 'lantern' }, { chest: 'gold' }
    ];
    var prem = [
      { gems: 10 }, { chest: 'bronze' }, { skin: 'sunset' }, { pearls: 4 }, { chest: 'silver' },
      { gems: 10 }, { sand: 200 }, { hat: 'pirate' }, { pearls: 5 }, { chest: 'gold' },
      { gems: 15 }, { sand: 250 }, { pearls: 6 }, { hat: 'crown' }, { chest: 'gold' },
      { gems: 15 }, { sand: 300 }, { skin: 'royal' }, { pearls: 8 }, { chest: 'gold', gems: 20 }
    ];
    for (var i = 0; i < 20; i++) PASS.push({ xp: 20 + i * 8, free: free[i], prem: prem[i] });
  })();

  var COSMETICS = [
    { id: 'sunset', kind: 'skin', name: 'Sunset Castle', desc: 'Warm evening colours for your keep.' },
    { id: 'royal', kind: 'skin', name: 'Royal Castle', desc: 'A regal gold-and-blue keep.' },
    { id: 'pirate', kind: 'hat', name: 'Pirate Hats', desc: 'Tiny pirate hats for your crew. Cosmetic only.' },
    { id: 'crown', kind: 'hat', name: 'Shell Crowns', desc: 'A shiny crown for every crab. Cosmetic only.' }
  ];

  var BOT_NAMES = ['Pearl Pete','Sandy Sam','Kelp Karen','Captain Shuck','Nacre Nina','Bucket Ben','Tide Tessa','Claw Clive','Winkle Will','Coral Cara','Pebble Pip','Gull Gary','Lobster Lou','Brine Bella','Shimmer Sid','Driftwood Dot','Riptide Ray','Barnacle Beau','Pincer Pat','Foam Fiona','Shell Shocked','Mayor Moat',' Duchess Dune','Private Pebble','Sargeant Star'];

  var D = { TILES: TILES, TROOPS: TROOPS, BUILD: BUILD, UPGRADES: UPGRADES, LEVELS: LEVELS, WORLDS: WORLDS,
    VCOLS: VCOLS, VROWS: VROWS, VBUILD: VBUILD, DECOS: DECOS, XP_LEVELS: XP_LEVELS, STREAK: STREAK,
    QUEST_POOL: QUEST_POOL, CHESTS: CHESTS, CARD_COPY_NEED: CARD_COPY_NEED, CARD_SAND_NEED: CARD_SAND_NEED,
    PASS: PASS, COSMETICS: COSMETICS, BOT_NAMES: BOT_NAMES,
    COLS: 7, ROWS: 7, FRONT: 2, HPX: +(typeof process !== 'undefined' && process.env && process.env.HPX || 4),
    FREE_CHEST_MS: 4 * 60 * 60 * 1000, SHIELD_MS: 4 * 60 * 60 * 1000 };


  root.CCData = D;
  if (typeof module !== 'undefined') module.exports = D;
})(typeof window !== 'undefined' ? window : globalThis);
