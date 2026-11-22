/* Tiny WebAudio synth for sound effects - no audio files needed. */
(function (root) {
  'use strict';
  var ctx = null, master = null, muted = false, last = {};
  function ac() {
    if (!ctx) { var A = root.AudioContext || root.webkitAudioContext; if (!A) return null; ctx = new A(); master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(o) {
    var c = ac(); if (!c || muted) return;
    var t = c.currentTime + (o.delay || 0), osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + o.d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.v || 0.3, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + o.d);
    osc.connect(g); g.connect(master); osc.start(t); osc.stop(t + o.d + 0.02);
  }
  function noise(d, v, f) {
    var c = ac(); if (!c || muted) return;
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
  root.Sfx = {
    play: function (name) {
      if (muted || !S[name]) return;
      var now = Date.now(); if (last[name] && now - last[name] < 45) return; last[name] = now;
      try { S[name](); } catch (e) {}
    },
    unlock: function () { ac(); },
    setMuted: function (m) { muted = !!m; },
    isMuted: function () { return muted; }
  };
})(typeof self !== 'undefined' ? self : this);
