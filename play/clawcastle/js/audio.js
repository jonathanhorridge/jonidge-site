/* Clawcastle audio: tiny WebAudio synth for sound effects and a sunny steel-drum music loop. No audio files. */
(function (root) {
  'use strict';
  var ac = null, master = null, sfxGain = null, musGain = null, noiseBuf = null, played = 0, musicOn = false, musTimer = null, step = 0, nextT = 0;
  var S = { sound: true, music: true };
  function ensure() {
    if (ac) return ac;
    var AC = root.AudioContext || root.webkitAudioContext; if (!AC) return null;
    ac = new AC(); master = ac.createGain(); master.gain.value = 0.8; master.connect(ac.destination);
    sfxGain = ac.createGain(); sfxGain.gain.value = 0.9; sfxGain.connect(master);
    musGain = ac.createGain(); musGain.gain.value = 0.22; musGain.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.6, ac.sampleRate);
    var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ac;
  }
  function tone(freq, dur, type, vol, slide, when, dest) {
    if (!ac) return; var t = (when || ac.currentTime);
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.3, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxGain); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, freq, q, when, sweep) {
    if (!ac) return; var t = when || ac.currentTime;
    var s = ac.createBufferSource(); s.buffer = noiseBuf;
    var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(freq || 1200, t); f.Q.value = q || 1;
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    var g = ac.createGain(); g.gain.setValueAtTime(vol || 0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t); s.stop(t + dur);
  }
  var FX = {
    swap: function () { tone(520, 0.08, 'triangle', 0.18, 1.4); },
    bad: function () { tone(220, 0.12, 'square', 0.08, 0.8); tone(180, 0.14, 'square', 0.07, 0.8, ac.currentTime + 0.09); },
    pop: function (n) { var f = 440 * Math.pow(1.12246, Math.min(12, n || 0)); tone(f, 0.12, 'sine', 0.28, 1.6); tone(f * 2, 0.08, 'triangle', 0.08, 1.3); noise(0.08, 0.08, 3000, 2); },
    deploy: function () { tone(880, 0.05, 'square', 0.06); tone(1320, 0.05, 'square', 0.05, 1, ac.currentTime + 0.05); },
    march: function () { noise(0.05, 0.05, 2500, 3); },
    hit: function () { tone(160, 0.12, 'triangle', 0.25, 0.6); noise(0.08, 0.12, 800, 1.5); },
    crumble: function () { noise(0.5, 0.35, 600, 0.8, null, 150); tone(90, 0.35, 'sine', 0.3, 0.5); },
    cannon: function () { tone(110, 0.25, 'sine', 0.35, 0.4); noise(0.18, 0.2, 400, 1); },
    splat: function () { noise(0.15, 0.15, 1500, 1, null, 300); },
    bomb: function () { tone(70, 0.6, 'sine', 0.45, 0.4); noise(0.6, 0.35, 900, 0.7, null, 120); tone(1600, 0.3, 'triangle', 0.08, 2); },
    riptide: function () { noise(0.9, 0.35, 300, 0.6, null, 3000); tone(300, 0.8, 'sine', 0.12, 2.5); },
    puff: function () { tone(600, 0.15, 'sine', 0.2, 0.3); noise(0.25, 0.25, 1200, 1, null, 300); },
    brute: function () { tone(330, 0.12, 'square', 0.1); tone(495, 0.18, 'square', 0.1, 1, ac.currentTime + 0.1); },
    click: function () { tone(700, 0.05, 'triangle', 0.15, 1.2); },
    coin: function () { tone(988, 0.08, 'square', 0.08); tone(1319, 0.2, 'square', 0.08, 1, ac.currentTime + 0.08); },
    win: function () { [523, 659, 784, 1047, 784, 1047].forEach(function (f, i) { tone(f, 0.25, 'triangle', 0.22, 1, ac.currentTime + i * 0.11); }); },
    lose: function () { [392, 349, 311, 262].forEach(function (f, i) { tone(f, 0.35, 'triangle', 0.2, 0.97, ac.currentTime + i * 0.18); }); },
    flag: function () { [784, 988, 1175, 1568].forEach(function (f, i) { tone(f, 0.3, 'square', 0.1, 1, ac.currentTime + i * 0.07); }); noise(0.7, 0.3, 500, 0.7, null, 100); },
    levelup: function () { [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, 0.22, 'triangle', 0.2, 1, ac.currentTime + i * 0.08); }); },
    chest: function () { tone(392, 0.1, 'square', 0.1); tone(523, 0.15, 'square', 0.1, 1, ac.currentTime + 0.1); tone(784, 0.3, 'triangle', 0.18, 1, ac.currentTime + 0.22); noise(0.2, 0.1, 2000, 2); },
    quest: function () { tone(880, 0.1, 'sine', 0.16); tone(1175, 0.2, 'sine', 0.16, 1, ac.currentTime + 0.1); }
  };
  // music: C-major pentatonic steel-drum riff, 100 bpm
  var MEL = [0, 2, 4, 7, 4, 2, 9, 7, 0, 4, 7, 9, 12, 9, 7, 4], BASS = [0, 0, 7, 7, 5, 5, 7, 7], SC = [0, 2, 4, 5, 7, 9, 11, 12];
  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  function schedule() {
    if (!ac || !musicOn) return;
    var beat = 60 / 100 / 2;
    while (nextT < ac.currentTime + 0.3) {
      var i = step % 16;
      if (i % 2 === 0 || Math.random() < 0.35) { var n = 72 + MEL[(i + Math.floor(step / 32) * 3) % 16]; tone(midi(n), 0.28, 'sine', 0.22, 1, nextT, musGain); tone(midi(n + 12), 0.12, 'triangle', 0.05, 1, nextT, musGain); }
      if (i % 2 === 0) tone(midi(48 + BASS[(step / 2 | 0) % 8]), 0.3, 'triangle', 0.25, 1, nextT, musGain);
      if (i % 4 === 2) { var s = ac.createBufferSource(); s.buffer = noiseBuf; var g = ac.createGain(); g.gain.setValueAtTime(0.05, nextT); g.gain.exponentialRampToValueAtTime(0.0001, nextT + 0.05); var f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000; s.connect(f); f.connect(g); g.connect(musGain); s.start(nextT); s.stop(nextT + 0.06); }
      nextT += beat; step++;
    }
  }
  var Sfx = {
    unlock: function () { if (!ensure()) return; if (ac.state === 'suspended') ac.resume(); if (S.music) Sfx.music(true); },
    play: function (name, arg) { if (!S.sound || !ac || ac.state !== 'running' || !FX[name]) return; try { FX[name](arg); played++; } catch (e) {} },
    music: function (on) {
      musicOn = !!on && S.music;
      if (!ac) return;
      if (musicOn && !musTimer) { nextT = ac.currentTime + 0.1; musTimer = setInterval(schedule, 100); }
      if (!musicOn && musTimer) { clearInterval(musTimer); musTimer = null; }
    },
    set: function (k, v) { S[k] = v; if (k === 'music') Sfx.music(v); },
    get: function (k) { return S[k]; },
    status: function () { return { ctx: ac ? ac.state : 'none', played: played, music: !!musTimer }; }
  };
  root.Sfx = Sfx;
})(window);
