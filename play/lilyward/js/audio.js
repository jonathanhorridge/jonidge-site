/* Lilyward audio: ElevenLabs-generated sound effects (one MP3 sprite) + a calm looping pond track.
 * - Everything plays through one WebAudio context, unlocked on the first tap (iOS/Android safe).
 * - The sprite is fetched at startup and decoded as soon as possible; until it is ready (or if it fails,
 *   e.g. opened from file://) the old tiny synth below is used so the game is never silent.
 * - Mute silences everything; music has its own on/off; audio suspends while the tab/app is hidden.
 * Sounds were generated with ElevenLabs Sound Effects v3 / Eleven Music v2.5 on a paid (Creator) plan
 * for use inside this game only - see AUDIO-LICENSE.md. */
(function (root) {
  'use strict';
  var SPRITE_URL = 'assets/audio/sfx.mp3', MUSIC_URL = 'assets/audio/pond-loop.mp3', MUSIC_LOOP_END = 37.5;
  // name: [start seconds, duration seconds] inside sfx.mp3
  var SPRITE = {
    tongue: [0.0, 0.3207],
    bubble: [0.4407, 0.4174],
    toad: [0.9781, 0.5],
    boom: [1.5981, 0.137],
    newt: [1.8551, 0.45],
    dart: [2.4251, 0.1773],
    pop: [2.7224, 0.1075],
    kill: [2.9499, 0.1393],
    coin: [3.2092, 0.4333],
    build: [3.7625, 0.3847],
    upgrade: [4.2672, 0.6112],
    sell: [4.9985, 0.4906],
    leak: [5.609, 0.5981],
    croak: [6.3271, 1.3189],
    stomp: [7.766, 0.5527],
    boss: [8.4387, 1.5368],
    wave: [10.0955, 0.6574],
    win: [10.8729, 2.1404],
    lose: [13.1333, 1.8773],
    tap: [15.1305, 0.1374],
    swat: [15.388, 0.2396]
  };
  // per-sound mix level and random pitch spread (repeated shots sound less robotic)
  var VOL = { tongue: 0.5, bubble: 0.45, toad: 0.55, boom: 0.5, newt: 0.42, dart: 0.45, pop: 0.4, kill: 0.42, coin: 0.5, build: 0.8, upgrade: 0.75,
    sell: 0.85, leak: 0.8, croak: 1, stomp: 0.95, boss: 1, wave: 0.7, win: 0.9, lose: 0.9, tap: 0.6, swat: 0.6 };
  var SPREAD = { tongue: 0.08, bubble: 0.1, toad: 0.08, boom: 0.1, newt: 0.08, dart: 0.08, pop: 0.12, kill: 0.12, coin: 0.04, swat: 0.08, tap: 0.04 };
  var GAP = { tongue: 70, bubble: 70, toad: 80, newt: 80, dart: 80, pop: 60, kill: 55, boom: 70, coin: 60 }; // ms between repeats of one sound
  var MAX_VOICES = 14;

  var ctx = null, master = null, sfxBus = null, musicBus = null, muted = false, musicOn = true, ducked = false, unlocked = false;
  var spriteBuf = null, spriteBytes = null, spriteState = 'idle', musicBuf = null, musicBytes = null, musicState = 'idle', musicSrc = null;
  var last = {}, voices = [], played = 0;

  function makeCtx() {
    if (ctx) return ctx;
    var A = root.AudioContext || root.webkitAudioContext; if (!A) return null;
    try { ctx = new A(); } catch (e) { return null; }
    master = ctx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.8; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
    decodeSprite();
    return ctx;
  }
  function fetchBytes(url) {
    if (!root.fetch) return Promise.reject(new Error('no fetch'));
    return root.fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); });
  }
  function decode(bytes) {
    return new Promise(function (res, rej) {
      try { var p = ctx.decodeAudioData(bytes.slice(0), res, rej); if (p && p.then) p.then(res, rej); } catch (e) { rej(e); }
    });
  }
  // preload: start downloading the sprite immediately so it is ready by the first tap
  var spriteFetch = fetchBytes(SPRITE_URL).then(function (b) { spriteBytes = b; decodeSprite(); }, function () { spriteState = 'failed'; });
  function decodeSprite() {
    if (!ctx || !spriteBytes || spriteState === 'decoding' || spriteState === 'ready') return;
    spriteState = 'decoding';
    decode(spriteBytes).then(function (buf) { spriteBuf = buf; spriteState = 'ready'; spriteBytes = null; }, function () { spriteState = 'failed'; });
  }
  function loadMusic() {
    if (musicState !== 'idle' || !ctx) return;
    musicState = 'loading';
    fetchBytes(MUSIC_URL).then(decode).then(function (buf) { musicBuf = buf; musicState = 'ready'; syncMusic(); }, function () { musicState = 'failed'; });
  }
  function wantMusic() { return unlocked && musicOn && !muted && !ducked && !(root.document && root.document.hidden); }
  function syncMusic() {
    if (!ctx) return;
    var want = wantMusic(), t = ctx.currentTime;
    if (want && !musicBuf) { loadMusic(); return; }
    if (want && !musicSrc) {
      musicSrc = ctx.createBufferSource(); musicSrc.buffer = musicBuf; musicSrc.loop = true;
      musicSrc.loopStart = 0; musicSrc.loopEnd = Math.min(MUSIC_LOOP_END, musicBuf.duration);
      musicSrc.connect(musicBus); musicSrc.start(0);
    }
    musicBus.gain.cancelScheduledValues(t); musicBus.gain.setValueAtTime(musicBus.gain.value, t);
    musicBus.gain.linearRampToValueAtTime(want ? 0.32 : 0, t + (want ? 1.2 : 0.25));
    if (!want && musicSrc) { var s = musicSrc; musicSrc = null; try { s.stop(t + 0.3); } catch (e) {} }
  }

  function tone(o) {
    var c = ctx; if (!c || muted) return;
    var t = c.currentTime + (o.delay || 0), osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + o.d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.v || 0.3, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + o.d);
    osc.connect(g); g.connect(master); osc.start(t); osc.stop(t + o.d + 0.02);
  }
  function noise(d, v, f) {
    var c = ctx; if (!c || muted) return;
    var b = c.createBuffer(1, Math.floor(c.sampleRate * d), c.sampleRate), data = b.getChannelData(0);
    for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    var s = c.createBufferSource(), g = c.createGain(), fl = c.createBiquadFilter();
    fl.type = 'lowpass'; fl.frequency.value = f || 900; s.buffer = b; g.gain.value = v || 0.3;
    s.connect(fl); fl.connect(g); g.connect(master); s.start();
  }
  var S = {
    tongue: function () { tone({ f: 900, f2: 300, d: 0.07, type: 'triangle', v: 0.12 }); },
    bubble: function () { tone({ f: 300, f2: 700, d: 0.1, v: 0.12 }); },
    toad: function () { tone({ f: 160, f2: 90, d: 0.15, type: 'square', v: 0.08 }); },
    newt: function () { noise(0.12, 0.12, 4000); },
    dart: function () { tone({ f: 1400, f2: 900, d: 0.06, type: 'sawtooth', v: 0.05 }); },
    pop: function () { tone({ f: 600, f2: 1200, d: 0.06, v: 0.1 }); },
    boom: function () { noise(0.3, 0.35, 500); },
    kill: function () { tone({ f: 520, f2: 260, d: 0.09, type: 'square', v: 0.06 }); },
    coin: function () { tone({ f: 1046, d: 0.08, type: 'triangle', v: 0.12 }); tone({ f: 1568, d: 0.12, type: 'triangle', v: 0.12, delay: 0.06 }); },
    build: function () { tone({ f: 220, f2: 440, d: 0.15, type: 'triangle', v: 0.25 }); noise(0.1, 0.15, 1500); },
    upgrade: function () { [523, 659, 784].forEach(function (f, i) { tone({ f: f, d: 0.12, type: 'triangle', v: 0.2, delay: i * 0.07 }); }); },
    sell: function () { tone({ f: 700, f2: 350, d: 0.15, type: 'triangle', v: 0.2 }); },
    leak: function () { tone({ f: 200, f2: 80, d: 0.3, type: 'sawtooth', v: 0.15 }); },
    croak: function () { tone({ f: 140, f2: 70, d: 0.5, type: 'sawtooth', v: 0.3 }); tone({ f: 210, f2: 100, d: 0.45, type: 'square', v: 0.12, delay: 0.05 }); noise(0.5, 0.2, 700); },
    stomp: function () { noise(0.4, 0.5, 250); tone({ f: 70, f2: 40, d: 0.4, type: 'sine', v: 0.4 }); },
    wave: function () { tone({ f: 392, d: 0.12, type: 'triangle', v: 0.2 }); tone({ f: 523, d: 0.2, type: 'triangle', v: 0.2, delay: 0.1 }); },
    boss: function () { [196, 185, 175, 165].forEach(function (f, i) { tone({ f: f, d: 0.25, type: 'sawtooth', v: 0.12, delay: i * 0.2 }); }); },
    win: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone({ f: f, d: 0.25, type: 'triangle', v: 0.25, delay: i * 0.12 }); }); },
    lose: function () { [392, 330, 262, 196].forEach(function (f, i) { tone({ f: f, d: 0.3, type: 'triangle', v: 0.2, delay: i * 0.15 }); }); },
    tap: function () { tone({ f: 660, d: 0.04, type: 'triangle', v: 0.1 }); },
    swat: function () { noise(0.06, 0.25, 2500); }
  };

  var SYNTH = {
    tongue: function () { tone({ f: 900, f2: 300, d: 0.07, type: 'triangle', v: 0.12 }); },
    bubble: function () { tone({ f: 300, f2: 700, d: 0.1, v: 0.12 }); },
    toad: function () { tone({ f: 160, f2: 90, d: 0.15, type: 'square', v: 0.08 }); },
    newt: function () { noise(0.12, 0.12, 4000); },
    dart: function () { tone({ f: 1400, f2: 900, d: 0.06, type: 'sawtooth', v: 0.05 }); },
    pop: function () { tone({ f: 600, f2: 1200, d: 0.06, v: 0.1 }); },
    boom: function () { noise(0.3, 0.35, 500); },
    kill: function () { tone({ f: 520, f2: 260, d: 0.09, type: 'square', v: 0.06 }); },
    coin: function () { tone({ f: 1046, d: 0.08, type: 'triangle', v: 0.12 }); tone({ f: 1568, d: 0.12, type: 'triangle', v: 0.12, delay: 0.06 }); },
    build: function () { tone({ f: 220, f2: 440, d: 0.15, type: 'triangle', v: 0.25 }); noise(0.1, 0.15, 1500); },
    upgrade: function () { [523, 659, 784].forEach(function (f, i) { tone({ f: f, d: 0.12, type: 'triangle', v: 0.2, delay: i * 0.07 }); }); },
    sell: function () { tone({ f: 700, f2: 350, d: 0.15, type: 'triangle', v: 0.2 }); },
    leak: function () { tone({ f: 200, f2: 80, d: 0.3, type: 'sawtooth', v: 0.15 }); },
    croak: function () { tone({ f: 140, f2: 70, d: 0.5, type: 'sawtooth', v: 0.3 }); noise(0.5, 0.2, 700); },
    stomp: function () { noise(0.4, 0.5, 250); tone({ f: 70, f2: 40, d: 0.4, type: 'sine', v: 0.4 }); },
    wave: function () { tone({ f: 392, d: 0.12, type: 'triangle', v: 0.2 }); tone({ f: 523, d: 0.2, type: 'triangle', v: 0.2, delay: 0.1 }); },
    boss: function () { [196, 185, 175, 165].forEach(function (f, i) { tone({ f: f, d: 0.25, type: 'sawtooth', v: 0.12, delay: i * 0.2 }); }); },
    win: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone({ f: f, d: 0.25, type: 'triangle', v: 0.25, delay: i * 0.12 }); }); },
    lose: function () { [392, 330, 262, 196].forEach(function (f, i) { tone({ f: f, d: 0.3, type: 'triangle', v: 0.2, delay: i * 0.15 }); }); },
    tap: function () { tone({ f: 660, d: 0.04, type: 'triangle', v: 0.1 }); },
    swat: function () { noise(0.06, 0.25, 2500); }
  };

  function playSprite(name) {
    var seg = SPRITE[name]; if (!seg) return false;
    var t = ctx.currentTime;
    voices = voices.filter(function (v) { return v.end > t; });
    if (voices.length >= MAX_VOICES) { var o = voices.shift(); try { o.src.stop(); } catch (e) {} }
    var src = ctx.createBufferSource(), g = ctx.createGain(), rate = 1 + ((Math.random() * 2 - 1) * (SPREAD[name] || 0));
    src.buffer = spriteBuf; src.playbackRate.value = rate; g.gain.value = VOL[name] || 0.7;
    src.connect(g); g.connect(sfxBus); src.start(t, seg[0], seg[1]);
    voices.push({ src: src, end: t + seg[1] / rate });
    return true;
  }

  function onVisibility() {
    if (!ctx) return;
    if (root.document.hidden) { if (ctx.suspend) ctx.suspend(); }
    else if (unlocked && ctx.resume) ctx.resume();
    syncMusic();
  }
  if (root.document && root.document.addEventListener) root.document.addEventListener('visibilitychange', onVisibility);

  root.Sfx = {
    play: function (name) {
      if (muted || !ctx || !unlocked || ctx.state === 'closed') return;
      var now = Date.now(); if (last[name] && now - last[name] < (GAP[name] || 45)) return; last[name] = now;
      try { if (!(spriteBuf && playSprite(name)) && SYNTH[name]) SYNTH[name](); played++; } catch (e) {}
    },
    /** Call from a user gesture (tap/click). Creates/resumes the audio context and starts music. */
    unlock: function () {
      var c = makeCtx(); if (!c) return;
      if (c.state !== 'running' && c.resume) c.resume();
      if (!unlocked) {
        unlocked = true;
        try { var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) {}
      }
      syncMusic();
    },
    setMuted: function (m) {
      muted = !!m;
      if (master) { var t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(muted ? 0 : 1, t); }
      syncMusic();
    },
    isMuted: function () { return muted; },
    setMusic: function (on) { musicOn = !!on; syncMusic(); },
    isMusicOn: function () { return musicOn; },
    /** Lower music while an ad / modal video plays. */
    duck: function (on) { ducked = !!on; syncMusic(); },
    /** For tests and debugging. */
    status: function () { return { ctx: ctx ? ctx.state : 'none', sprite: spriteState, music: musicState, musicPlaying: !!musicSrc, played: played, voices: voices.length }; },
    ready: function () { return spriteFetch; }
  };
})(typeof self !== 'undefined' ? self : this);
