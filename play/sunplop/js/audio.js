/* Sunplop audio: preloaded ElevenLabs SFX + one looping music track.
 * WebAudio for low-latency SFX and a gapless music loop; falls back to <audio> if WebAudio is missing.
 * Settings live in the app's localStorage db (settings.sound / music / sfxVol / musicVol). */
(function (root) {
  'use strict';
  var BASE = 'audio/';
  var SFX = ['tap_sun', 'tap_dot', 'clear', 'undo', 'error', 'hint', 'line_complete', 'level_solved', 'daily_solved',
    'star', 'coins', 'purchase', 'chapter_unlock', 'ui_click'];
  var MUSIC = 'music_sunny';
  // Files are loudness-matched per category by tools/process-audio.sh (taps -21/-24, feedback -19, rewards -17 LUFS;
  // music -16 LUFS at default volume 0.35 ~ -25 LUFS), so trims are only small taste tweaks.
  var TRIM = { tap_sun: 0.9, tap_dot: 0.9, ui_click: 1, undo: 0.9, clear: 0.9, error: 0.9, hint: 1, line_complete: 0.9,
    level_solved: 1, daily_solved: 1, star: 0.9, coins: 0.9, purchase: 1, chapter_unlock: 1 };
  var JITTER = { tap_sun: 0.04, tap_dot: 0.04, ui_click: 0.03, line_complete: 0.02 };   // tiny pitch variation for sounds heard hundreds of times

  var probe = typeof Audio !== 'undefined' ? new Audio() : null;
  var EXT = probe && probe.canPlayType && probe.canPlayType('audio/ogg; codecs="opus"') ? '.ogg' : '.mp3';

  var settings = { sound: true, music: false, sfxVol: 0.8, musicVol: 0.35 };
  var onChange = function () {};
  var ctx = null, sfxGain = null, musicGain = null, buffers = {}, loading = {}, html = {};
  var musicBuf = null, musicSrc = null, musicLoading = false, musicEl = null, hidden = false, gesture = false, log = [];
  // file:// (zip opened directly) cannot fetch() files: use <audio> elements there; Capacitor/http use WebAudio.
  var HTML_ONLY = typeof location !== 'undefined' && location.protocol === 'file:';

  function AC() { return HTML_ONLY ? null : (root.AudioContext || root.webkitAudioContext); }
  function ensureCtx() {
    if (ctx || !AC()) return ctx;
    try {
      ctx = new (AC())();
      sfxGain = ctx.createGain(); sfxGain.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.connect(ctx.destination);
      applyVolumes();
    } catch (e) { ctx = null; }
    return ctx;
  }
  function applyVolumes() {
    if (sfxGain) sfxGain.gain.value = settings.sound ? settings.sfxVol : 0;
    if (musicGain) musicGain.gain.value = settings.musicVol;
    if (musicEl) musicEl.volume = settings.musicVol;
  }
  function fetchBuf(name) {
    if (buffers[name] || loading[name] || !ensureCtx() || typeof fetch === 'undefined') return loading[name];
    return (loading[name] = fetch(BASE + name + EXT).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(function (ab) { return new Promise(function (res, rej) { ctx.decodeAudioData(ab, res, rej); }); })
      .then(function (b) { buffers[name] = b; return b; })
      .catch(function () { loading[name] = null; }));
  }
  function preload() {
    if (!ensureCtx()) { SFX.forEach(function (n) { var a = new Audio(BASE + n + EXT); a.preload = 'auto'; html[n] = a; }); return; }
    SFX.forEach(fetchBuf);
  }
  // Autoplay policy: the context starts suspended until a user gesture.
  function unlock() {
    gesture = true;
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (settings.music && !hidden) startMusic();
  }

  function play(name, opts) {
    opts = opts || {};
    if (!settings.sound) return;
    // mobile autoplay rules: nothing before the first tap (and no queued burst once the context resumes)
    if (!gesture) { log.push('blocked:' + name); return; }   // strict: even if a webview lets the context run early
    log.push(name); if (log.length > 200) log.shift();
    var vol = (TRIM[name] || 1) * (opts.vol == null ? 1 : opts.vol), rate = (opts.rate || 1) * (1 + (Math.random() * 2 - 1) * (JITTER[name] || 0));
    try {
      if (ctx) {
        var b = buffers[name];
        if (!b) { fetchBuf(name); return; }
        if (ctx.state === 'suspended') ctx.resume();
        var s = ctx.createBufferSource(), g = ctx.createGain();
        s.buffer = b; s.playbackRate.value = rate; g.gain.value = vol;
        s.connect(g); g.connect(sfxGain); s.start(ctx.currentTime + (opts.delay || 0));
        return;
      }
      var a = html[name]; if (!a) return;
      var c = a.cloneNode(); c.volume = Math.min(1, vol * settings.sfxVol); c.playbackRate = rate; c.preservesPitch = false;
      setTimeout(function () { c.play().catch(function () {}); }, (opts.delay || 0) * 1000);
    } catch (e) {}
  }

  function startMusic() {
    if (!settings.music || hidden) return;
    if (ensureCtx()) {
      if (ctx.state === 'suspended') ctx.resume();
      if (musicSrc) return;
      if (!musicBuf) {
        if (musicLoading) return; musicLoading = true;
        fetchBuf(MUSIC).then(function (b) { musicLoading = false; delete buffers[MUSIC]; delete loading[MUSIC]; if (b) { musicBuf = b; startMusic(); } });
        return;
      }
      musicSrc = ctx.createBufferSource(); musicSrc.buffer = musicBuf; musicSrc.loop = true;
      musicSrc.connect(musicGain);
      var now = ctx.currentTime; musicGain.gain.cancelScheduledValues(now);
      musicGain.gain.setValueAtTime(0.0001, now); musicGain.gain.linearRampToValueAtTime(settings.musicVol, now + 1.5);
      musicSrc.start();
      return;
    }
    if (!musicEl) { musicEl = new Audio(BASE + MUSIC + EXT); musicEl.loop = true; }
    musicEl.volume = settings.musicVol; musicEl.play().catch(function () {});
  }
  function stopMusic() {
    if (musicSrc) { try { musicSrc.stop(); } catch (e) {} musicSrc.disconnect(); musicSrc = null; }
    if (musicEl) musicEl.pause();
  }
  function setHidden(h) {
    hidden = h;
    if (h) { stopMusic(); if (ctx && ctx.state === 'running') ctx.suspend(); }
    else { if (ctx && ctx.state === 'suspended') ctx.resume(); startMusic(); }
  }

  function configure(s, changed) {
    if (s.sound != null) settings.sound = !!s.sound;
    if (s.music != null) settings.music = !!s.music;
    if (s.sfxVol != null) settings.sfxVol = Math.max(0, Math.min(1, +s.sfxVol));
    if (s.musicVol != null) settings.musicVol = Math.max(0, Math.min(1, +s.musicVol));
    if (changed) onChange = changed;
    applyVolumes();
    if (settings.music) startMusic(); else stopMusic();
  }

  root.GameAudio = {
    SFX: SFX, EXT: EXT, configure: configure, preload: preload, unlock: unlock, play: play,
    startMusic: startMusic, stopMusic: stopMusic, setHidden: setHidden,
    log: log,
    state: function () { return { gesture: gesture, htmlOnly: HTML_ONLY, musicLen: musicBuf ? musicBuf.length : 0, musicDur: musicBuf ? musicBuf.duration : 0, ctx: ctx ? ctx.state : 'none', loaded: Object.keys(buffers).length, music: !!(musicSrc || (musicEl && !musicEl.paused)), musicLoaded: !!musicBuf, settings: settings, ext: EXT, hidden: hidden }; }
  };
})(typeof self !== 'undefined' ? self : this);
