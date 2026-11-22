/* Lilyward - game data: towers, enemies, levels. Pure data, no DOM. */
(function (root) {
  'use strict';
  var TOWERS = {
    tongue: { name: 'Lasher Frog', desc: 'Whip-fast tongue. Hits flyers.', color: '#5DC23A', dark: '#2F7D1E', belly: '#D4F59A', cost: 40, air: true, unlock: 1,
      lv: [{ dmg: 9, rate: 0.65, range: 2.2 }, { dmg: 15, rate: 0.55, range: 2.4, cost: 60 }, { dmg: 24, rate: 0.48, range: 2.6, cost: 110 }] },
    bubble: { name: 'Bubbler', desc: 'Sticky foam slows bugs down.', color: '#3FB6E8', dark: '#1A6E9C', belly: '#BDEBFF', cost: 55, air: true, unlock: 1,
      lv: [{ dmg: 4, rate: 1.0, range: 2.3, slow: 0.4, slowT: 1.6, splash: 0.75 }, { dmg: 7, rate: 0.9, range: 2.5, slow: 0.5, slowT: 1.9, splash: 0.9, cost: 55 }, { dmg: 12, rate: 0.8, range: 2.8, slow: 0.6, slowT: 2.3, splash: 1.1, cost: 95 }] },
    toad: { name: 'Mudlobber', desc: 'Lobs mud clods. Big splash. Ground only.', color: '#C98A3B', dark: '#7A4E1A', belly: '#F5D9A6', cost: 80, air: false, unlock: 2,
      lv: [{ dmg: 28, rate: 1.6, range: 2.6, splash: 1.1 }, { dmg: 50, rate: 1.5, range: 2.8, splash: 1.25, cost: 80 }, { dmg: 90, rate: 1.35, range: 3.1, splash: 1.45, cost: 140 }] },
    glow: { name: 'Glow Keeper', desc: 'Firefly lantern frog. Earns coins during waves.', color: '#FF9E5E', dark: '#B5532A', belly: '#FFE6CF', cost: 70, eco: true, unlock: 3,
      lv: [{ coins: 8, every: 7 }, { coins: 13, every: 6.5, cost: 70 }, { coins: 22, every: 6, cost: 120 }] },
    newt: { name: 'Storm Newt', desc: 'Static sparks jump between bugs.', color: '#FFC928', dark: '#B07A00', belly: '#FFF1B0', cost: 100, air: true, unlock: 4,
      lv: [{ dmg: 16, rate: 1.2, range: 2.4, chain: 3 }, { dmg: 26, rate: 1.1, range: 2.6, chain: 4, cost: 95 }, { dmg: 42, rate: 0.95, range: 2.9, chain: 6, cost: 170 }] },
    dart: { name: 'Thornback', desc: 'Long-range venom thorns. Pierce shells.', color: '#A35CF0', dark: '#5B2A9E', belly: '#E6D1FF', cost: 120, air: true, unlock: 6,
      lv: [{ dmg: 55, rate: 1.8, range: 3.8, poison: 8, poisonT: 3, pierce: true }, { dmg: 80, rate: 1.75, range: 4.1, poison: 14, poisonT: 3, pierce: true, cost: 110 }, { dmg: 140, rate: 1.6, range: 4.5, poison: 24, poisonT: 3.5, pierce: true, cost: 190 }] }
  };
  var TOWER_ORDER = ['tongue', 'bubble', 'toad', 'glow', 'newt', 'dart'];

  var ENEMIES = {
    ant: { name: 'Marsh Ant', hp: 32, spd: 1.15, reward: 4, lives: 1, size: 0.27 },
    gnat: { name: 'Gnat', hp: 15, spd: 2.0, reward: 2, lives: 1, size: 0.2 },
    beetle: { name: 'Armorback Beetle', hp: 95, spd: 0.75, armor: 5, reward: 9, lives: 1, size: 0.36, tip: 'Armored: shrugs off weak hits.' },
    fly: { name: 'Dragonfly', hp: 48, spd: 1.55, reward: 7, lives: 1, size: 0.34, air: true, tip: 'Flies over mud clods.' },
    snail: { name: 'Boulder Snail', hp: 300, spd: 0.45, armor: 2, reward: 22, lives: 3, size: 0.44, tip: 'Slow and very tough.' },
    heron: { name: 'Old Stiltbeak', hp: 3200, spd: 0.3, armor: 3, reward: 250, lives: 20, size: 0.85, boss: true, stomp: { every: 6, radius: 1.9, stun: 2.2 }, tip: 'Boss heron! Stomps and dazes nearby frogs.' }
  };

  // Waves: groups "type*count@gap" separated by ","; groups run one after another.
  var LEVELS = [
    { name: 'Reed Bend', path: [[4, -1], [4, 3], [1, 3], [1, 7], [7, 7], [7, 11], [4, 11], [4, 14]],
      waves: ['ant*6@1.3', 'ant*9@1', 'gnat*8@0.6', 'ant*8@0.9,gnat*6@0.5', 'ant*12@0.7,gnat*10@0.45'] },
    { name: 'Mossy Loop', path: [[1, -1], [1, 4], [7, 4], [7, 8], [2, 8], [2, 12], [6, 12], [6, 14]],
      waves: ['ant*8@1', 'gnat*10@0.5', 'beetle*3@2,ant*6@0.8', 'ant*10@0.7,beetle*4@1.6', 'gnat*14@0.4,beetle*4@1.5', 'beetle*6@1.2,ant*14@0.5'] },
    { name: 'Lantern Shallows', path: [[7, -1], [7, 2], [2, 2], [2, 5], [6, 5], [6, 9], [1, 9], [1, 12], [4, 12], [4, 14]],
      waves: ['ant*10@0.8', 'fly*5@1.2', 'beetle*5@1.4,gnat*10@0.4', 'fly*8@0.9,ant*10@0.6', 'beetle*8@1.1', 'fly*10@0.7,gnat*16@0.3', 'beetle*8@1,fly*8@0.8,ant*16@0.4'] },
    { name: 'Snail Trail', path: [[-1, 2], [6, 2], [6, 6], [2, 6], [2, 10], [7, 10], [7, 14]],
      waves: ['ant*12@0.7', 'snail*2@4', 'fly*10@0.8', 'beetle*8@1,snail*2@3', 'gnat*24@0.25', 'snail*4@2.5,fly*10@0.6', 'beetle*10@0.8,snail*3@2,gnat*20@0.3'] },
    { name: 'Willow Zigzag', path: [[4, -1], [4, 1], [1, 1], [1, 5], [4, 5], [4, 8], [7, 8], [7, 12], [2, 12], [2, 14]],
      waves: ['ant*14@0.6', 'beetle*6@1.3', 'fly*12@0.6', 'snail*3@2.2,ant*10@0.6', 'gnat*26@0.26', 'beetle*10@0.9,fly*10@0.6', 'snail*6@1.8,beetle*8@0.8', 'fly*14@0.45,gnat*20@0.28,snail*3@1.6'] },
    { name: 'Firefly Ferry', hp: 1.2, path: [[9, 1], [2, 1], [2, 4], [7, 4], [7, 7], [2, 7], [2, 10], [7, 10], [7, 13], [4, 13], [4, 14]],
      waves: ['ant*16@0.5', 'beetle*10@0.9', 'fly*14@0.5', 'snail*5@1.8', 'gnat*30@0.2,ant*14@0.4', 'beetle*14@0.7,snail*4@1.5', 'fly*20@0.4,beetle*10@0.6', 'snail*8@1.2,gnat*30@0.2'] },
    { name: 'Long Lily Run', hp: 1.2, path: [[1, -1], [1, 12], [4, 12], [4, 3], [7, 3], [7, 14]],
      waves: ['ant*18@0.5', 'fly*14@0.5,gnat*14@0.3', 'beetle*14@0.7', 'snail*6@1.5,ant*16@0.4', 'fly*22@0.35', 'beetle*16@0.6,snail*5@1.4', 'gnat*40@0.18,fly*14@0.4', 'snail*10@1,beetle*12@0.5', 'fly*24@0.3,snail*8@1,beetle*14@0.5'] },
    { name: 'Stiltbeak\u2019s Roost', boss: true, path: [[4, -1], [4, 2], [1, 2], [1, 6], [7, 6], [7, 9], [1, 9], [1, 12], [4, 12], [4, 14]],
      waves: ['ant*20@0.45', 'beetle*12@0.7', 'fly*18@0.45', 'snail*7@1.4,gnat*20@0.25', 'beetle*16@0.6,fly*12@0.5', 'snail*10@1.1', 'gnat*45@0.16,ant*20@0.35', 'fly*26@0.3,beetle*16@0.5', 'snail*12@0.9,fly*16@0.4', 'heron*1@1,ant*20@0.6,beetle*10@1,fly*12@0.8'] }
  ];

  var UPGRADES = {
    coins: { name: 'Fat Purse', desc: '+15 starting coins', max: 5, cost: [30, 60, 100, 160, 250] },
    lives: { name: 'Thick Reeds', desc: '+2 lives', max: 5, cost: [40, 80, 130, 200, 300] },
    power: { name: 'Bug Protein', desc: '+6% frog damage', max: 5, cost: [50, 100, 170, 260, 380] },
    chorus: { name: 'Louder Croak', desc: 'Chorus charges 20% faster', max: 3, cost: [60, 140, 260] }
  };

  var HATS = {
    none: { name: 'No hat', price: 0 },
    leaf: { name: 'Leaf Cap', price: 0, flies: 80 },
    crown: { name: 'Reed Crown', price: 40 },
    party: { name: 'Lily Bloom', price: 25 },
    viking: { name: 'Acorn Helm', price: 60 }
  };

  root.GameData = { TOWERS: TOWERS, TOWER_ORDER: TOWER_ORDER, ENEMIES: ENEMIES, LEVELS: LEVELS, UPGRADES: UPGRADES, HATS: HATS, COLS: 9, ROWS: 15 };
  if (typeof module !== 'undefined') module.exports = root.GameData;
})(typeof self !== 'undefined' ? self : this);
