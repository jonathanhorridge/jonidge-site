/* Lilyward - game data: towers, enemies, levels. Pure data, no DOM. */
(function (root) {
  'use strict';
  var TOWERS = {
    tongue: { name: 'Lasher Frog', desc: 'Whip-fast tongue. Hits flyers.', color: '#5DC23A', dark: '#2F7D1E', belly: '#D4F59A', cost: 45, air: true, unlock: 1,
      lv: [{ dmg: 9, rate: 0.7, range: 2.1 }, { dmg: 14, rate: 0.6, range: 2.3, cost: 70 }, { dmg: 21, rate: 0.52, range: 2.5, cost: 130 }] },
    bubble: { name: 'Bubbler', desc: 'Sticky foam slows bugs down.', color: '#3FB6E8', dark: '#1A6E9C', belly: '#BDEBFF', cost: 55, air: true, unlock: 1,
      lv: [{ dmg: 4, rate: 1.0, range: 2.3, slow: 0.4, slowT: 1.6, splash: 0.75 }, { dmg: 6, rate: 0.9, range: 2.5, slow: 0.48, slowT: 1.8, splash: 0.9, cost: 55 }, { dmg: 10, rate: 0.85, range: 2.7, slow: 0.55, slowT: 2.1, splash: 1.0, cost: 100 }] },
    toad: { name: 'Mudlobber', desc: 'Lobs mud clods. Big splash. Ground only.', color: '#C98A3B', dark: '#7A4E1A', belly: '#F5D9A6', cost: 90, air: false, unlock: 2,
      lv: [{ dmg: 24, rate: 1.7, range: 2.5, splash: 0.95 }, { dmg: 40, rate: 1.6, range: 2.7, splash: 1.05, cost: 95 }, { dmg: 66, rate: 1.5, range: 2.9, splash: 1.2, cost: 165 }] },
    glow: { name: 'Glow Keeper', desc: 'Firefly lantern frog. Earns coins during waves.', color: '#FF9E5E', dark: '#B5532A', belly: '#FFE6CF', cost: 70, eco: true, unlock: 3,
      lv: [{ coins: 8, every: 7 }, { coins: 13, every: 6.5, cost: 70 }, { coins: 20, every: 6, cost: 130 }] },
    newt: { name: 'Storm Newt', desc: 'Static sparks jump between bugs.', color: '#FFC928', dark: '#B07A00', belly: '#FFF1B0', cost: 100, air: true, unlock: 4,
      lv: [{ dmg: 12, rate: 1.3, range: 2.4, chain: 3 }, { dmg: 19, rate: 1.2, range: 2.6, chain: 4, cost: 115 }, { dmg: 30, rate: 1.1, range: 2.8, chain: 5, cost: 200 }] },
    dart: { name: 'Thornback', desc: 'Long-range venom thorns. Pierce shells. Ground only.', color: '#A35CF0', dark: '#5B2A9E', belly: '#E6D1FF', cost: 120, air: false, unlock: 6,
      lv: [{ dmg: 50, rate: 2.3, range: 3.0, poison: 6, poisonT: 3, pierce: true }, { dmg: 74, rate: 2.2, range: 3.2, poison: 10, poisonT: 3, pierce: true, cost: 125 }, { dmg: 118, rate: 2.0, range: 3.5, poison: 16, poisonT: 3.5, pierce: true, cost: 210 }] }
  };
  var TOWER_ORDER = ['tongue', 'bubble', 'toad', 'glow', 'newt', 'dart'];

  var ENEMIES = {
    ant: { name: 'Marsh Ant', hp: 32, spd: 1.15, reward: 4, lives: 1, size: 0.27 },
    gnat: { name: 'Gnat', hp: 15, spd: 2.0, reward: 2, lives: 1, size: 0.2 },
    beetle: { name: 'Armorback Beetle', hp: 90, spd: 0.75, armor: 5, reward: 9, lives: 1, size: 0.36, tip: 'Armored: shrugs off weak hits.' },
    fly: { name: 'Dragonfly', hp: 48, spd: 1.55, reward: 7, lives: 1, size: 0.34, air: true, tip: 'Flies over mud clods.' },
    snail: { name: 'Boulder Snail', hp: 270, spd: 0.45, armor: 4, reward: 22, lives: 3, size: 0.44, tip: 'Slow and very tough.' },
    skip: { name: 'Reed Skipper', hp: 26, spd: 1.85, reward: 5, lives: 1, size: 0.26, hop: { every: 3.0, dist: 0.75 }, tip: 'Skates the path, then hops forward.' },
    pinch: { name: 'Pinchclaw', hp: 130, spd: 0.7, armor: 6, reward: 12, lives: 2, size: 0.4, pinch: { every: 6, radius: 1.4, stun: 1.1 }, tip: 'Pinches nearby frogs and dazes them.' },
    moth: { name: 'Cattail Moth', hp: 62, spd: 1.4, reward: 8, lives: 1, size: 0.32, air: true, tip: 'A dusty night flyer. Mud clods miss it.' },
    heron: { name: 'Old Stiltbeak', hp: 3200, spd: 0.3, armor: 3, reward: 250, lives: 20, size: 0.85, boss: true, stomp: { every: 6, radius: 1.9, stun: 2.2 }, tip: 'Boss heron! Stomps and dazes nearby frogs.' },
    snap: { name: 'Old Snapjaw', hp: 3800, spd: 0.28, armor: 5, reward: 300, lives: 20, size: 0.9, boss: true, stomp: { every: 6.2, radius: 1.9, stun: 2.0 }, tip: 'Boss snapping turtle! Snaps at frogs around it.' },
    bittern: { name: 'Pale Bittern', hp: 4800, spd: 0.26, armor: 4, reward: 400, lives: 25, size: 0.88, boss: true, screech: { every: 8.5, stun: 1.0, summon: { type: 'moth', n: 1 } }, tip: 'Boss night bird! A screech dazes every frog and calls moths.' }
  };

  var WORLDS = [
    { id: 'willow', name: 'Willow Pond', theme: 'day', tag: 'World 1' },
    { id: 'cattail', name: 'Cattail Creek', theme: 'dusk', tag: 'World 2' },
    { id: 'fen', name: 'Moonlit Fen', theme: 'night', tag: 'World 3' }
  ];

  // Waves: groups "type*count@gap" separated by ","; groups run one after another.
  var LEVELS = [
    { world: 0, stage: 0, name: 'Reed Bend', path: [[4, -1], [4, 3], [1, 3], [1, 7], [7, 7], [7, 11], [4, 11], [4, 14]],
      waves: ['ant*6@1.3', 'ant*9@1', 'gnat*8@0.6', 'ant*8@0.9,gnat*6@0.5', 'ant*12@0.7,gnat*10@0.45'] },
    { world: 0, stage: 1, name: 'Mossy Loop', path: [[1, -1], [1, 4], [7, 4], [7, 8], [2, 8], [2, 12], [6, 12], [6, 14]],
      waves: ['ant*8@1', 'gnat*10@0.5', 'beetle*3@2,ant*6@0.8', 'ant*10@0.7,beetle*4@1.6', 'gnat*12@0.4,fly*4@1.4,beetle*4@1.5', 'beetle*6@1.2,fly*4@1.2,ant*14@0.5'] },
    { world: 0, stage: 2, name: 'Lantern Shallows', hp: 1.1, path: [[7, -1], [7, 2], [2, 2], [2, 5], [6, 5], [6, 9], [1, 9], [1, 12], [4, 12], [4, 14]],
      waves: ['ant*10@0.8', 'fly*5@1.2', 'beetle*5@1.4,gnat*10@0.4', 'fly*8@0.9,ant*10@0.6', 'beetle*8@1.1', 'fly*10@0.7,gnat*16@0.3', 'beetle*8@1,fly*8@0.8,ant*16@0.4'] },
    { world: 0, stage: 3, name: 'Snail Trail', hp: 0.76, path: [[-1, 2], [6, 2], [6, 6], [2, 6], [2, 10], [7, 10], [7, 14]],
      waves: ['ant*12@0.7', 'snail*2@4', 'fly*10@0.8', 'beetle*6@1.1,snail*2@3', 'gnat*16@0.3,beetle*6@1', 'snail*4@2.5,fly*10@0.6', 'beetle*10@0.8,snail*3@2,gnat*20@0.3'] },
    { world: 0, stage: 4, name: 'Willow Zigzag', hp: 0.75, path: [[4, -1], [4, 1], [1, 1], [1, 5], [4, 5], [4, 8], [7, 8], [7, 12], [2, 12], [2, 14]],
      waves: ['ant*14@0.6', 'beetle*6@1.3', 'fly*12@0.6', 'snail*3@2.2,ant*10@0.6', 'gnat*26@0.26', 'beetle*10@0.9,fly*10@0.6', 'snail*6@1.8,beetle*8@0.8', 'fly*14@0.45,gnat*20@0.28,snail*3@1.6'] },
    { world: 0, stage: 5, name: 'Firefly Ferry', hp: 0.95, theme: 'dusk', path: [[9, 1], [2, 1], [2, 4], [7, 4], [7, 7], [2, 7], [2, 10], [7, 10], [7, 13], [4, 13], [4, 14]],
      waves: ['ant*16@0.5', 'beetle*10@0.9', 'fly*14@0.5', 'snail*5@1.8', 'gnat*30@0.2,ant*14@0.4', 'beetle*14@0.7,snail*4@1.5', 'fly*20@0.4,beetle*10@0.6', 'snail*8@1.2,gnat*30@0.2'] },
    { world: 0, stage: 6, name: 'Long Lily Run', hp: 0.95, theme: 'dusk', path: [[1, -1], [1, 12], [4, 12], [4, 3], [7, 3], [7, 14]],
      waves: ['ant*18@0.5', 'fly*14@0.5,gnat*14@0.3', 'beetle*14@0.7', 'snail*6@1.5,ant*16@0.4', 'fly*22@0.35', 'beetle*16@0.6,snail*5@1.4', 'gnat*40@0.18,fly*14@0.4', 'snail*10@1,beetle*12@0.5', 'fly*24@0.3,snail*8@1,beetle*14@0.5'] },
    { world: 0, stage: 7, name: 'Stiltbeak\u2019s Roost', hp: 0.9, theme: 'dusk', boss: true, path: [[4, -1], [4, 2], [1, 2], [1, 6], [7, 6], [7, 9], [1, 9], [1, 12], [4, 12], [4, 14]],
      waves: ['ant*20@0.45', 'beetle*12@0.7', 'fly*18@0.45', 'snail*7@1.4,gnat*20@0.25', 'beetle*16@0.6,fly*12@0.5', 'snail*10@1.1', 'gnat*45@0.16,ant*20@0.35', 'fly*26@0.3,beetle*16@0.5', 'snail*12@0.9,fly*16@0.4', 'heron*1@1,ant*20@0.6,beetle*10@1,fly*12@0.8'] },
    { world: 1, stage: 0, name: 'Creek Mouth', hp: 0.875, path: [[3, -1], [3, 5], [6, 5], [6, 10], [2, 10], [2, 14]],
      waves: ['ant*10@0.85', 'skip*6@1.2', 'ant*10@0.7,gnat*8@0.5', 'fly*8@0.8,skip*8@0.85', 'beetle*5@1.3,skip*10@0.7,fly*8@0.7,snail*4@1.8', 'snail*5@1.6,beetle*8@0.9,fly*10@0.6,skip*10@0.55'] },
    { world: 1, stage: 1, name: 'Strider Run', hp: 0.89, path: [[0, -1], [0, 3], [7, 3], [7, 7], [1, 7], [1, 11], [6, 11], [6, 14]],
      waves: ['ant*12@0.7', 'skip*8@0.9', 'fly*8@0.85,ant*8@0.65', 'skip*10@0.7,beetle*5@1.4', 'fly*12@0.6,skip*10@0.65,snail*4@1.8,beetle*8@0.9', 'fly*14@0.5,skip*14@0.5,beetle*7@1,gnat*16@0.3,snail*4@1.8,beetle*8@0.9'] },
    { world: 1, stage: 2, name: 'Pinch Bend', hp: 0.74, path: [[8, -1], [8, 4], [4, 4], [4, 8], [1, 8], [1, 12], [5, 12], [5, 14]],
      waves: ['ant*12@0.7', 'pinch*2@3.5,ant*8@0.75', 'skip*8@0.8,fly*8@0.85', 'pinch*3@2.8,beetle*5@1.3', 'snail*2@3.2,skip*10@0.7', 'pinch*3@2.4,fly*10@0.7,ant*12@0.55', 'pinch*4@2.1,beetle*7@1,skip*12@0.6,fly*8@0.7'] },
    { world: 1, stage: 3, name: 'Twin Reeds', hp: 1.04, path: [[2, -1], [2, 6], [6, 6], [6, 2], [8, 2], [8, 10], [3, 10], [3, 14]],
      waves: ['ant*12@0.7', 'skip*8@0.85,gnat*10@0.4', 'fly*10@0.75,beetle*5@1.3', 'pinch*3@2.6,skip*10@0.7', 'snail*3@2.5,fly*8@0.75', 'beetle*8@1,pinch*3@2.3,ant*12@0.5', 'skip*14@0.55,pinch*4@2,fly*10@0.6,gnat*16@0.3'] },
    { world: 1, stage: 4, name: 'Crab Crossing', hp: 0.59, path: [[-1, 3], [5, 3], [5, 7], [1, 7], [1, 11], [7, 11], [7, 14]],
      waves: ['ant*12@0.65', 'pinch*3@2.6,beetle*5@1.2', 'fly*10@0.7,skip*8@0.7', 'pinch*4@2.3,snail*3@2.4', 'gnat*18@0.32,beetle*6@1.1', 'pinch*4@2,fly*10@0.65,skip*10@0.6', 'snail*4@2,pinch*5@1.9,beetle*8@0.9,fly*8@0.7'] },
    { world: 1, stage: 5, name: 'Moth Drift', hp: 0.65, theme: 'dusk', path: [[7, -1], [7, 6], [2, 6], [2, 11], [8, 11], [8, 14]],
      waves: ['ant*12@0.65', 'moth*6@1.15', 'skip*10@0.7,fly*8@0.75', 'moth*8@0.9,pinch*3@2.5', 'beetle*8@1,moth*8@0.85', 'snail*3@2.3,moth*8@0.8,skip*10@0.6', 'moth*12@0.65,pinch*4@2,gnat*16@0.3,snail*4@1.8,beetle*8@0.9', 'fly*12@0.55,moth*10@0.65,beetle*8@0.85,snail*4@1.8,beetle*8@0.9'] },
    { world: 1, stage: 6, name: 'Snapping Flats', hp: 0.56, theme: 'dusk', path: [[1, -1], [1, 2], [6, 2], [6, 6], [1, 6], [1, 10], [6, 10], [6, 14]],
      waves: ['ant*12@0.65', 'skip*8@0.8', 'pinch*3@2.5,ant*10@0.6', 'moth*8@0.85,fly*8@0.7', 'snail*3@2.2,beetle*6@1', 'moth*10@0.7,pinch*4@2.1', 'skip*12@0.55,gnat*16@0.3', 'pinch*5@1.9,snail*4@1.9,moth*10@0.65,beetle*8@0.85'] },
    { world: 1, stage: 7, name: 'Deep Channel', hp: 0.56, theme: 'dusk', path: [[9, 2], [1, 2], [1, 7], [8, 7], [8, 12], [3, 12], [3, 14]],
      waves: ['ant*12@0.65', 'moth*8@0.9,skip*6@0.8', 'pinch*3@2.4,beetle*6@1', 'snail*4@2.1,fly*10@0.65', 'moth*10@0.7,skip*10@0.6', 'pinch*5@2,snail*4@1.9,gnat*16@0.3', 'moth*12@0.6,beetle*8@0.85,pinch*4@2', 'snail*6@1.7,moth*10@0.6,skip*12@0.5,pinch*4@1.9'] },
    { world: 1, stage: 8, name: 'Snapjaw\u2019s Nest', hp: 0.44, theme: 'dusk', boss: true, path: [[4, -1], [4, 3], [7, 3], [7, 7], [1, 7], [1, 11], [4, 11], [4, 14]],
      waves: ['ant*14@0.6', 'skip*10@0.7,beetle*6@1.1', 'moth*8@0.8,fly*8@0.7', 'pinch*4@2.2,snail*3@2.2', 'gnat*18@0.3,skip*10@0.6', 'moth*10@0.65,pinch*4@2,beetle*8@0.9', 'snail*5@1.8,fly*10@0.6', 'pinch*5@1.9,moth*12@0.6,skip*12@0.55', 'snap*1@1,pinch*4@2,moth*8@0.8,skip*8@0.7'] },
    { world: 2, stage: 0, name: 'Moon Gate', hp: 0.8, path: [[5, -1], [5, 4], [1, 4], [1, 8], [6, 8], [6, 12], [2, 12], [2, 14]],
      waves: ['ant*12@0.7', 'moth*6@1.1', 'skip*8@0.75,gnat*10@0.4', 'fly*10@0.7,beetle*5@1.25', 'moth*8@0.8,skip*10@0.65', 'pinch*3@2.4,moth*8@0.75,fly*8@0.7,snail*4@1.8,beetle*8@0.9', 'moth*12@0.6,beetle*7@1,skip*12@0.55,fly*10@0.6,snail*4@1.8,beetle*8@0.9'] },
    { world: 2, stage: 1, name: 'Star Reed', hp: 0.575, path: [[-1, 0], [6, 0], [6, 5], [2, 5], [2, 10], [7, 10], [7, 14]],
      waves: ['ant*12@0.65', 'moth*8@0.9', 'pinch*3@2.5,ant*10@0.6', 'fly*10@0.7,moth*6@0.85', 'snail*4@2,skip*10@0.65', 'moth*10@0.7,beetle*8@0.9,gnat*14@0.32', 'pinch*4@2.1,snail*5@1.7,beetle*8@0.85', 'snail*6@1.5,beetle*10@0.8,pinch*5@1.8,moth*8@0.7'] },
    { world: 2, stage: 2, name: 'Misty Oxbow', hp: 0.71, path: [[0, -1], [0, 6], [4, 6], [4, 2], [8, 2], [8, 10], [3, 10], [3, 14]],
      waves: ['ant*12@0.65', 'moth*8@0.85,skip*6@0.8', 'pinch*3@2.4,beetle*6@1.1', 'snail*3@2.2,fly*10@0.65', 'moth*10@0.7,gnat*16@0.3', 'pinch*4@2.1,skip*12@0.6,ant*10@0.55', 'moth*12@0.6,snail*4@1.9,beetle*8@0.85', 'pinch*5@1.9,moth*12@0.6,fly*10@0.6,skip*10@0.55'] },
    { world: 2, stage: 3, name: 'Moth Veil', hp: 0.58, path: [[8, -1], [8, 3], [3, 3], [3, 8], [8, 8], [8, 12], [1, 12], [1, 14]],
      waves: ['ant*12@0.65', 'moth*8@0.9', 'skip*8@0.75,moth*6@0.85', 'pinch*3@2.4,beetle*6@1', 'snail*4@1.9,moth*10@0.7', 'pinch*4@2,snail*5@1.7,beetle*8@0.85', 'snail*6@1.5,moth*10@0.6,beetle*10@0.8', 'pinch*6@1.7,snail*8@1.4,beetle*12@0.75,moth*8@0.6'] },
    { world: 2, stage: 4, name: 'Silent Pool', hp: 0.53, path: [[2, -1], [2, 3], [7, 3], [7, 8], [0, 8], [0, 12], [5, 12], [5, 14]],
      waves: ['ant*12@0.65', 'skip*8@0.8,moth*6@0.9', 'pinch*3@2.4,beetle*6@1', 'moth*10@0.7,fly*10@0.65', 'snail*4@2,skip*10@0.6', 'moth*12@0.6,pinch*4@2,gnat*16@0.3', 'beetle*8@0.85,moth*10@0.6,fly*10@0.6', 'snail*5@1.8,pinch*5@1.9,moth*12@0.55,skip*12@0.5'] },
    { world: 2, stage: 5, name: 'Bittern Marsh', hp: 0.56, path: [[9, 4], [4, 4], [4, 1], [1, 1], [1, 9], [7, 9], [7, 14]],
      waves: ['ant*12@0.65', 'moth*8@0.85', 'pinch*3@2.4,skip*10@0.7', 'fly*12@0.6,moth*8@0.7', 'snail*4@2,beetle*7@1', 'moth*12@0.6,gnat*16@0.3', 'pinch*5@2,skip*12@0.55,fly*10@0.6', 'moth*14@0.55,snail*5@1.8,beetle*8@0.85', 'pinch*6@1.8,moth*14@0.5,skip*12@0.5,fly*10@0.55'] },
    { world: 2, stage: 6, name: 'Blackwater Run', hp: 0.65, path: [[1, -1], [1, 13], [4, 13], [4, 2], [7, 2], [7, 14]],
      waves: ['ant*12@0.65', 'moth*8@0.85,skip*6@0.8', 'pinch*3@2.4,beetle*6@1', 'fly*12@0.6,gnat*14@0.32', 'snail*4@2,moth*8@0.7', 'pinch*4@2.1,skip*12@0.6,fly*8@0.65', 'moth*12@0.6,beetle*8@0.85,snail*4@1.8', 'pinch*5@1.9,moth*12@0.55,skip*12@0.5', 'snail*6@1.7,moth*12@0.55,pinch*5@1.8,beetle*8@0.8'] },
    { world: 2, stage: 7, name: 'Fen Spine', hp: 0.5, path: [[6, -1], [6, 3], [2, 3], [2, 7], [8, 7], [8, 11], [0, 11], [0, 14]],
      waves: ['ant*12@0.65', 'moth*8@0.85,skip*6@0.8', 'pinch*3@2.4,beetle*6@1', 'fly*12@0.6,moth*8@0.7', 'snail*4@2,skip*10@0.6', 'moth*12@0.6,pinch*4@2,gnat*16@0.3', 'fly*12@0.55,beetle*8@0.85,moth*10@0.6', 'pinch*5@1.9,snail*5@1.8,skip*12@0.5', 'moth*14@0.5,pinch*5@1.8,fly*12@0.55,beetle*8@0.8'] },
    { world: 2, stage: 8, name: 'Pale Bittern\u2019s Court', hp: 0.41, boss: true, path: [[4, -1], [4, 2], [8, 2], [8, 6], [0, 6], [0, 10], [7, 10], [7, 13], [4, 13], [4, 14]],
      waves: ['ant*12@0.65', 'moth*8@0.85,skip*6@0.8', 'pinch*3@2.4,beetle*6@0.95', 'fly*12@0.6,gnat*14@0.32', 'snail*4@1.9,moth*8@0.7', 'pinch*4@2.1,skip*10@0.6', 'moth*12@0.6,beetle*8@0.85', 'snail*5@1.7,pinch*4@2,fly*10@0.6', 'moth*14@0.5,skip*12@0.5,beetle*8@0.8', 'bittern*1@1,moth*8@0.8,pinch*4@1.9,skip*8@0.7'] }
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

  root.GameData = { TOWERS: TOWERS, TOWER_ORDER: TOWER_ORDER, ENEMIES: ENEMIES, WORLDS: WORLDS, LEVELS: LEVELS, UPGRADES: UPGRADES, HATS: HATS, COLS: 9, ROWS: 15 };
  if (typeof module !== 'undefined') module.exports = root.GameData;
})(typeof self !== 'undefined' ? self : this);
