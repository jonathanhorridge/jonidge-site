/* Web Audio: decoded SFX buffers, a wind bed that follows airspeed, and a soft music loop.
 * All sounds are synthesised by tools/make-audio.py (no third-party audio). Silent if audio can't load. */
(function (root) {
  'use strict';
  var NAMES = ['wind', 'music', 'gust', 'updraft', 'ring', 'hit', 'zap', 'skid', 'count', 'go', 'finish', 'click', 'best'];
  var ctx = null, bufs = {}, master, sfxGain, musicGain, windSrc = null, windGain = null, musicSrc = null, loading = null;
  var sfxOn = true, musicOn = true;
  var ext = (function () { var a = document.createElement('audio'); return a.canPlayType && a.canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'mp3'; })();
  function load() {
    if (loading) return loading;
    loading = Promise.all(NAMES.map(function (n) {
      return fetch('assets/audio/' + n + '.' + ext).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
        .then(function (ab) { return new Promise(function (res, rej) { ctx.decodeAudioData(ab, res, rej); }); })
        .then(function (b) { bufs[n] = b; }).catch(function () {});
    }));
    return loading;
  }
  var Sfx = {
    unlock: function () {
      if (!ctx) {
        var AC = root.AudioContext || root.webkitAudioContext; if (!AC) return;
        ctx = new AC(); master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
        sfxGain = ctx.createGain(); sfxGain.gain.value = sfxOn ? 0.8 : 0; sfxGain.connect(master);
        musicGain = ctx.createGain(); musicGain.gain.value = musicOn ? 0.32 : 0; musicGain.connect(master);
        load().then(function () { Sfx.music(true); });
      }
      if (ctx.state === 'suspended') ctx.resume();
    },
    play: function (n, vol, rate) {
      if (!ctx || !bufs[n]) return;
      var s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = bufs[n]; s.playbackRate.value = rate || 1;
      g.gain.value = vol == null ? 1 : vol; s.connect(g); g.connect(sfxGain); s.start();
    },
    music: function (on) {
      if (!ctx || !bufs.music) return;
      if (on && !musicSrc) { musicSrc = ctx.createBufferSource(); musicSrc.buffer = bufs.music; musicSrc.loop = true; musicSrc.connect(musicGain); musicSrc.start(); }
      if (!on && musicSrc) { musicSrc.stop(); musicSrc = null; }
    },
    wind: function (speed01, on) {
      if (!ctx || !bufs.wind) return;
      if (on && !windSrc) { windSrc = ctx.createBufferSource(); windSrc.buffer = bufs.wind; windSrc.loop = true; windGain = ctx.createGain(); windGain.gain.value = 0; windSrc.connect(windGain); windGain.connect(sfxGain); windSrc.start(); }
      if (!on && windSrc) { windSrc.stop(); windSrc = null; return; }
      if (windSrc) { var t = ctx.currentTime; windGain.gain.setTargetAtTime(0.15 + 0.6 * speed01, t, 0.08); windSrc.playbackRate.setTargetAtTime(0.75 + 0.7 * speed01, t, 0.1); }
    },
    /** Independent sound-effect and music switches (settings screen). */
    configure: function (sfx, music) { sfxOn = !!sfx; musicOn = !!music; if (sfxGain) sfxGain.gain.value = sfxOn ? 0.8 : 0; if (musicGain) musicGain.gain.value = musicOn ? 0.32 : 0; },
    status: function () { return { ctx: ctx ? ctx.state : 'none', loaded: Object.keys(bufs).length, music: !!musicSrc }; }
  };
  root.Sfx = Sfx;
})(this);
