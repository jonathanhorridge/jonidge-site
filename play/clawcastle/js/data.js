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
  var D = { TILES: TILES, TROOPS: TROOPS, BUILD: BUILD, UPGRADES: UPGRADES, LEVELS: LEVELS, COLS: 7, ROWS: 7, FRONT: 2, HPX: +(typeof process !== 'undefined' && process.env && process.env.HPX || 4) };
  root.CCData = D;
  if (typeof module !== 'undefined') module.exports = D;
})(typeof window !== 'undefined' ? window : globalThis);
