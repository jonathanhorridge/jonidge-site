/* Hexglen audio: all sounds are synthesised live with WebAudio (original, no sample files, nothing to license).
   Sound effects + an optional gentle ambient pad (pentatonic wind-chime drift). */
(function (root) {
  'use strict';
  var ctx = null, master = null, sfxGain = null, ambGain = null, ambTimer = null, ambOn = false;
  var settings = { sfx: true, music: false };
  var PENTA = [0, 2, 4, 7, 9]; // major pentatonic
  function hz(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    var AC = root.AudioContext || root.webkitAudioContext; if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.7; sfxGain.connect(master);
    ambGain = ctx.createGain(); ambGain.gain.value = 0.0; ambGain.connect(master);
    return ctx;
  }
  function tone(freq, t0, dur, type, vol, dest, o) {
    o = o || {};
    var osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type || 'sine'; osc.frequency.setValueAtTime(freq, t0);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + (o.attack || 0.012));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(dest || sfxGain); osc.start(t0); osc.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, vol, freq, q) {
    var n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = ctx.createBufferSource(); src.buffer = buf;
    var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1;
    var g = ctx.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(sfxGain); src.start(t0);
  }
  var SFX = {
    tap: function (t) { tone(520, t, .06, 'triangle', .12); },
    preview: function (t) { tone(660, t, .08, 'sine', .1); tone(880, t + .05, .08, 'sine', .07); },
    place: function (t) { tone(190, t, .16, 'sine', .35, null, { slideTo: 120 }); noise(t, .09, .22, 900, 1.2); tone(1200, t + .01, .05, 'triangle', .05); },
    stash: function (t) { tone(400, t, .09, 'triangle', .14, null, { slideTo: 620 }); },
    undo: function (t) { tone(520, t, .14, 'triangle', .14, null, { slideTo: 300 }); },
    error: function (t) { tone(180, t, .14, 'square', .06); },
    start: function (t) { [0, 4, 7].forEach(function (s, i) { tone(hz(60 + s), t + i * .09, .5, 'sine', .15); }); },
    combo: function (t, n) { // n = number of rules that scored: higher = brighter arpeggio
      n = Math.max(1, Math.min(5, n || 1));
      for (var i = 0; i < n + 1; i++) { var m = 72 + PENTA[i % 5] + 12 * Math.floor(i / 5); tone(hz(m), t + i * .075, .45, 'sine', .13); tone(hz(m) * 2, t + i * .075, .25, 'triangle', .035); }
    },
    big: function (t) { [0, 4, 7, 12, 16].forEach(function (s, i) { tone(hz(72 + s), t + i * .09, .7, 'sine', .14); }); },
    finish: function (t) {
      var seq = [0, 2, 4, 7, 9, 12];
      seq.forEach(function (s, i) { tone(hz(67 + s), t + i * .13, .9, 'sine', .16); tone(hz(55 + s), t + i * .13, 1.0, 'triangle', .05); });
      [0, 4, 7, 12].forEach(function (s) { tone(hz(72 + s), t + .9, 1.8, 'sine', .1); });
    },
    star: function (t, n) { tone(hz(76 + (n || 0) * 4), t, .6, 'sine', .16); tone(hz(88 + (n || 0) * 4), t + .05, .5, 'triangle', .05); }
  };
  function play(name, a) {
    if (!settings.sfx) return;
    var c = ensure(); if (!c || !SFX[name]) return;
    try { SFX[name](c.currentTime + 0.005, a); } catch (e) {}
  }
  /* ambient: slow warm chord pad + occasional pentatonic chime + soft filtered-noise wind */
  var CHORDS = [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 64]];
  var chordIdx = 0;
  function ambientStep() {
    if (!ambOn || !ctx) return;
    var t = ctx.currentTime + .05, ch = CHORDS[chordIdx++ % CHORDS.length];
    ch.forEach(function (m, i) {
      var osc = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      osc.type = 'sine'; osc.frequency.value = hz(m); osc.detune.value = (i - 1.5) * 4;
      f.type = 'lowpass'; f.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 2.2); g.gain.linearRampToValueAtTime(0.0001, t + 7.5);
      osc.connect(f); f.connect(g); g.connect(ambGain); osc.start(t); osc.stop(t + 8);
    });
    for (var k = 0; k < 3; k++) {
      var m2 = 69 + PENTA[Math.floor(Math.random() * 5)] + (Math.random() < .3 ? 12 : 0), tt = t + 1 + k * 2 + Math.random();
      tone(hz(m2), tt, 1.6, 'sine', .035, ambGain);
    }
    ambTimer = setTimeout(ambientStep, 6500);
  }
  function setMusic(on) {
    settings.music = on;
    if (on) {
      var c = ensure(); if (!c) return;
      ambOn = true; ambGain.gain.cancelScheduledValues(c.currentTime); ambGain.gain.linearRampToValueAtTime(0.9, c.currentTime + 2);
      clearTimeout(ambTimer); ambientStep();
    } else if (ctx) {
      ambOn = false; clearTimeout(ambTimer); ambGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + .6);
    }
  }
  root.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else if (settings.music || settings.sfx) ctx.resume();
  });
  root.HHAudio = {
    play: play, settings: settings, setMusic: setMusic, ensure: ensure,
    setSfx: function (on) { settings.sfx = on; }
  };
})(window);
