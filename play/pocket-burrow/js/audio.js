/* Audio: MP3 files made by tools/make-audio.py, played through Web Audio. Never blocks the game; silent if anything fails. */
(function (root) {
  'use strict';
  var FILES = ['tap', 'dig', 'dig-done', 'pop', 'collect', 'coin', 'chime', 'arrive', 'knock', 'build', 'levelup', 'gift', 'error', 'critter1', 'critter2', 'critter3'];
  var ctx = null, master, sfxG, musG, buf = {}, bgm = null, night = null, sfxOn = true, musOn = true, started = false, loading = {};
  function ac() {
    if (ctx) return ctx; var AC = root.AudioContext || root.webkitAudioContext; if (!AC) return null;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = .9; master.connect(ctx.destination);
    sfxG = ctx.createGain(); sfxG.gain.value = .85; sfxG.connect(master); musG = ctx.createGain(); musG.gain.value = .0; musG.connect(master); return ctx;
  }
  function load(name, url) {
    if (buf[name]) return Promise.resolve(buf[name]); if (loading[name]) return loading[name];
    return (loading[name] = fetch(url).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(function (ab) { return new Promise(function (ok, no) { ac().decodeAudioData(ab, ok, no); }); }).then(function (b) { buf[name] = b; return b; }).catch(function () { return null; }));
  }
  function loop(name, vol) {
    return load(name, 'assets/audio/' + name + '.mp3').then(function (b) {
      if (!b || !ctx) return null; var s = ctx.createBufferSource(); s.buffer = b; s.loop = true; var g = ctx.createGain(); g.gain.value = vol; s.connect(g); g.connect(musG); s.start(0); return { src: s, gain: g };
    });
  }
  var Audio = {
    /** call from a user gesture */
    unlock: function () {
      if (!ac()) return; if (ctx.state === 'suspended') ctx.resume();
      if (started) return; started = true;
      FILES.forEach(function (n) { load(n, 'assets/audio/' + n + '.mp3'); });
      loop('bgm', .9).then(function (x) { bgm = x; Audio._apply(); });
      loop('night', .0).then(function (x) { night = x; Audio._apply(); });
    },
    play: function (name, o) {
      if (!sfxOn || !ctx || !buf[name]) return; o = o || {};
      var s = ctx.createBufferSource(); s.buffer = buf[name]; s.playbackRate.value = (o.rate || 1) * (1 + (Math.random() - .5) * .04);
      var g = ctx.createGain(); g.gain.value = o.vol == null ? 1 : o.vol; s.connect(g); g.connect(sfxG); s.start(0);
    },
    setSfx: function (on) { sfxOn = !!on; }, setMusic: function (on) { musOn = !!on; Audio._apply(); },
    /** 0..1 how night-like the surface is: crossfades the quiet night ambience */
    setNight: function (n) { Audio._night = n; Audio._apply(); },
    _apply: function () {
      if (!ctx) return; musG.gain.setTargetAtTime(musOn ? .36 : 0, ctx.currentTime, .3);
      if (bgm) bgm.gain.gain.setTargetAtTime(1 - .55 * (Audio._night || 0), ctx.currentTime, 1);
      if (night) night.gain.gain.setTargetAtTime(.9 * (Audio._night || 0), ctx.currentTime, 1);
    },
    pause: function () { if (ctx && ctx.state === 'running') ctx.suspend(); }, resume: function () { if (ctx && ctx.state === 'suspended' && started) ctx.resume(); },
    get ready() { return !!ctx && started; }, get loaded() { return Object.keys(buf).length; }
  };
  root.PB_AUDIO = Audio;
})(typeof self !== 'undefined' ? self : this);
