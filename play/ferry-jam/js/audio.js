/* Ferry Jam audio: MP3 assets when present, Web Audio synth otherwise. */
(function (root) {
  'use strict';

  var FILES = {
    drive: 'assets/audio/car-drive.mp3',
    honk:  'assets/audio/honk.mp3',
    horn:  'assets/audio/ferry-horn.mp3',
    coin:  'assets/audio/coin.mp3',
    win:   'assets/audio/win.mp3',
    bump:  'assets/audio/bump.mp3',
    tap:   'assets/audio/tap.mp3',
    bgm:   'assets/audio/bgm.mp3'
  };

  var ctx = null, master = null, bgmGain = null, sfxGain = null;
  var buffers = {};
  var ready = {};
  var bgmSrc = null, bgmEl = null, unlocked = false;
  var muteSfx = false, muteBgm = false;

  function ac() {
    if (ctx) return ctx;
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.85; master.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.9; sfxGain.connect(master);
    bgmGain = ctx.createGain(); bgmGain.gain.value = 0.28; bgmGain.connect(master);
    return ctx;
  }

  function resume() {
    var c = ac();
    if (c && c.state === 'suspended') c.resume();
    unlocked = true;
    if (!muteBgm) startBgm();
  }

  function loadFile(name, url) {
    return fetch(url, { cache: 'force-cache' }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.arrayBuffer();
    }).then(function (ab) {
      return new Promise(function (resolve, reject) {
        var c = ac();
        if (!c) return reject(new Error('no audio'));
        c.decodeAudioData(ab.slice(0), resolve, reject);
      });
    }).then(function (buf) {
      buffers[name] = buf;
      ready[name] = 'file';
      return buf;
    });
  }

  function preload() {
    ac();
    Object.keys(FILES).forEach(function (name) {
      loadFile(name, FILES[name]).catch(function () { ready[name] = 'synth'; });
    });
  }

  function now() { return ac() ? ctx.currentTime : 0; }

  function envGain(start, dur, peak, a, z) {
    var g = ctx.createGain();
    var t = start;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + (a || 0.02));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur - (z || 0.02));
    g.connect(sfxGain);
    return g;
  }

  function osc(type, freq, start, dur, peak, a) {
    var o = ctx.createOscillator();
    o.type = type;
    if (typeof freq === 'number') o.frequency.setValueAtTime(freq, start);
    o.connect(envGain(start, dur, peak || 0.2, a));
    o.start(start);
    o.stop(start + dur);
    return o;
  }

  function noise(start, dur, peak, type) {
    var c = ac();
    var n = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    var d = n.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    var src = c.createBufferSource();
    src.buffer = n;
    var f = c.createBiquadFilter();
    f.type = type || 'lowpass';
    f.frequency.value = type === 'highpass' ? 1800 : 900;
    src.connect(f);
    f.connect(envGain(start, dur, peak || 0.15, 0.01, 0.04));
    src.start(start);
    src.stop(start + dur);
  }

  var SYNTH = {
    drive: function () {
      var t = now();
      noise(t, 0.55, 0.12, 'lowpass');
      var o = osc('sawtooth', 90, t, 0.5, 0.07, 0.05);
      o.frequency.exponentialRampToValueAtTime(150, t + 0.45);
    },
    honk: function () {
      var t = now();
      osc('square', 420, t, 0.14, 0.18);
      osc('square', 520, t + 0.02, 0.14, 0.12);
    },
    horn: function () {
      var t = now();
      osc('sawtooth', 196, t, 0.35, 0.22, 0.02);
      osc('sawtooth', 247, t, 0.35, 0.16, 0.02);
      osc('sawtooth', 196, t + 0.38, 0.45, 0.22, 0.02);
      osc('sawtooth', 247, t + 0.38, 0.45, 0.16, 0.02);
    },
    coin: function () {
      var t = now();
      var o = osc('sine', 880, t, 0.18, 0.2, 0.005);
      o.frequency.exponentialRampToValueAtTime(1320, t + 0.08);
      osc('sine', 1760, t + 0.08, 0.16, 0.12, 0.005);
    },
    win: function () {
      var t = now();
      var notes = [523, 659, 784, 1046];
      notes.forEach(function (f, i) { osc('triangle', f, t + i * 0.12, 0.28, 0.18, 0.01); });
      osc('sine', 1318, t + 0.48, 0.4, 0.12, 0.02);
    },
    bump: function () {
      var t = now();
      noise(t, 0.12, 0.2, 'lowpass');
      var o = osc('triangle', 180, t, 0.14, 0.2, 0.005);
      o.frequency.exponentialRampToValueAtTime(80, t + 0.12);
    },
    tap: function () {
      var t = now();
      osc('sine', 720, t, 0.06, 0.09, 0.002);
    }
  };

  function playBuf(name) {
    var c = ac();
    if (!c || !buffers[name]) return false;
    var src = c.createBufferSource();
    src.buffer = buffers[name];
    src.connect(name === 'bgm' ? bgmGain : sfxGain);
    src.start(0);
    return true;
  }

  function play(name) {
    if (muteSfx) return;
    ac();
    if (buffers[name]) { playBuf(name); return; }
    if (SYNTH[name]) SYNTH[name]();
  }

  function startBgm() {
    if (muteBgm) return;
    var c = ac();
    if (!c) return;
    stopBgm();
    if (buffers.bgm) {
      bgmSrc = c.createBufferSource();
      bgmSrc.buffer = buffers.bgm;
      bgmSrc.loop = true;
      bgmSrc.connect(bgmGain);
      bgmSrc.start(0);
      return;
    }
    // Looping synth stinger if the mp3 is not ready.
    if (bgmEl) return;
    playSynthBgm();
  }

  var bgmTimer = 0;
  function playSynthBgm() {
    if (muteBgm || !ac()) return;
    var t = now();
    var melody = [392, 440, 523, 440, 392, 349, 392, 0, 523, 587, 659, 587, 523, 440, 392, 0];
    var bass = [196, 196, 174, 174, 196, 196, 164, 196];
    melody.forEach(function (f, i) {
      if (!f) return;
      var o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + i * 0.28);
      g.gain.exponentialRampToValueAtTime(0.07, t + i * 0.28 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.28 + 0.26);
      o.connect(g); g.connect(bgmGain);
      o.start(t + i * 0.28);
      o.stop(t + i * 0.28 + 0.28);
    });
    bass.forEach(function (f, i) {
      var o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      var g = ctx.createGain();
      var st = t + i * 0.56;
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.06, st + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.5);
      o.connect(g); g.connect(bgmGain);
      o.start(st); o.stop(st + 0.56);
    });
    bgmTimer = setTimeout(playSynthBgm, 16 * 280);
  }

  function stopBgm() {
    if (bgmTimer) { clearTimeout(bgmTimer); bgmTimer = 0; }
    if (bgmSrc) { try { bgmSrc.stop(); } catch (e) {} bgmSrc = null; }
    if (bgmEl) { bgmEl.pause(); bgmEl = null; }
  }

  function setMute(sfx, bgm) {
    muteSfx = !!sfx; muteBgm = !!bgm;
    if (bgmGain) bgmGain.gain.value = muteBgm ? 0 : 0.28;
    if (muteBgm) stopBgm();
    else if (unlocked) startBgm();
  }

  root.AudioFx = {
    preload: preload, resume: resume, play: play,
    startBgm: startBgm, stopBgm: stopBgm, setMute: setMute,
    get muteSfx() { return muteSfx; },
    get muteBgm() { return muteBgm; },
    ready: ready
  };
})(typeof self !== 'undefined' ? self : this);
