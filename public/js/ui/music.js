// Background music: original procedural tracks in a Tunisian cha3bi / mezoued spirit
// (darbouka, bendir, qraqeb, mezoued-like reed, drone), plus the player's own audio files.
import { idb } from './store.js';

const SCALES = {
  hijaz: [0, 1, 4, 5, 7, 8, 10, 12],   // D Eb F# G A Bb C D
  kurd: [0, 1, 3, 5, 7, 8, 10, 12],
  nahawand: [0, 2, 3, 5, 7, 8, 11, 12],
  penta: [0, 3, 5, 7, 10, 12, 15, 17],
};

// rhythm: D = doum, T = tek, k = soft ka, B = bendir, q = qraqeb, c = clap, - = rest
export const TRACKS = [
  { id: 'mezoued', name: 'Sahrit Mezoued', bpm: 118, steps: 16, rhythm: 'D-kTD-T-D-kTD-Tk', clap: '----c-------c---', scale: 'hijaz', root: 62, lead: 'reed', seed: 11 },
  { id: 'sahel', name: 'Zarda fil Sahel', bpm: 100, steps: 12, rhythm: 'D--T-TD-kT-T', clap: '---c-----c--', scale: 'kurd', root: 60, lead: 'reed', seed: 23 },
  { id: 'stambeli', name: 'Lilet Stambeli', bpm: 126, steps: 12, rhythm: 'B--B-kB--BTk', qraqeb: 'q-qq-qq-qq-q', scale: 'penta', root: 55, lead: 'gumbri', seed: 37 },
  { id: 'qahwa', name: '9ahwa fil Medina', bpm: 86, steps: 16, rhythm: 'D---T-k-D-D-T---', scale: 'nahawand', root: 62, lead: 'oud', seed: 51 },
];

const midi = n => 440 * 2 ** ((n - 69) / 12);
function rnd(seed) { let a = seed >>> 0; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; }

/** 4-bar melody: [{step, len, deg}] built from a seeded random walk on the maqam. */
function compose(t) {
  const r = rnd(t.seed);
  const phrase = () => {
    const out = [];
    let deg = 4, s = 0;
    const total = t.steps * 2;
    while (s < total) {
      const len = [1, 2, 2, 3, 4][Math.floor(r() * 5)];
      deg = Math.max(0, Math.min(7, deg + [-2, -1, -1, 0, 1, 1, 2][Math.floor(r() * 7)]));
      if (r() > 0.15) out.push({ step: s, len, deg, grace: r() < 0.3 });
      s += len;
    }
    out.push({ step: total - 2, len: 2, deg: 0 });
    return out;
  };
  const a = phrase(), b = phrase();
  // A A B A, each phrase is 2 bars
  return [a, a, b, a].flatMap((p, i) => p.map(n => ({ ...n, step: n.step + i * t.steps * 2 })));
}

class Engine {
  constructor() { this.ctx = null; this.timer = null; this.track = null; }

  init() {
    if (this.ctx) return;
    const C = window.AudioContext || window.webkitAudioContext;
    this.ctx = new C();
    this.out = this.ctx.createGain();
    this.out.connect(this.ctx.destination);
    this.verb = this.makeVerb();
    this.verb.connect(this.out);
    const len = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  makeVerb() {
    const c = this.ctx, conv = c.createConvolver(), n = c.sampleRate * 1.6;
    const b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3; }
    conv.buffer = b;
    const g = c.createGain(); g.gain.value = 0.18;
    conv.connect(g);
    g.connect = g.connect.bind(g);
    conv._out = g;
    return { connect: dst => g.connect(dst), input: conv };
  }

  env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }

  noise(t, dur, type, freq, q, peak) {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
    s.connect(f).connect(g).connect(this.out);
    this.env(g, t, 0.002, peak, dur);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }

  drum(kind, t) {
    const c = this.ctx;
    if (kind === 'D' || kind === 'B') {
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(kind === 'B' ? 120 : 105, t);
      o.frequency.exponentialRampToValueAtTime(kind === 'B' ? 60 : 52, t + 0.18);
      o.connect(g).connect(this.out);
      this.env(g, t, 0.004, kind === 'B' ? 0.55 : 0.7, 0.32);
      o.start(t); o.stop(t + 0.4);
      this.noise(t, 0.06, 'lowpass', kind === 'B' ? 700 : 400, 1, 0.12);
    } else if (kind === 'T') {
      this.noise(t, 0.07, 'bandpass', 3600, 1.4, 0.38);
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.value = 820; o.connect(g).connect(this.out);
      this.env(g, t, 0.001, 0.12, 0.05); o.start(t); o.stop(t + 0.1);
    } else if (kind === 'k') {
      this.noise(t, 0.045, 'bandpass', 2600, 1.2, 0.16);
    } else if (kind === 'q') {
      this.noise(t, 0.03, 'highpass', 6500, 0.7, 0.22);
      this.noise(t + 0.035, 0.03, 'highpass', 7000, 0.7, 0.16);
    } else if (kind === 'c') {
      for (let i = 0; i < 3; i++) this.noise(t + i * 0.008, 0.05, 'bandpass', 1500, 0.9, 0.18);
    }
  }

  note(lead, freq, t, dur) {
    const c = this.ctx, g = c.createGain();
    if (lead === 'reed') {
      // two slightly detuned pipes + nasal band-pass, like a mezoued
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1700; f.Q.value = 1.1;
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 6.2; lg.gain.value = freq * 0.006;
      lfo.connect(lg);
      for (const det of [-6, 7]) {
        const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq; o.detune.value = det;
        lg.connect(o.frequency); o.connect(f); o.start(t); o.stop(t + dur + 0.1);
      }
      lfo.start(t); lfo.stop(t + dur + 0.1);
      f.connect(g);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.11, t + 0.03);
      g.gain.setValueAtTime(0.1, t + Math.max(0.04, dur - 0.05));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
    } else {
      // plucked (oud / gumbri)
      const o = c.createOscillator(); o.type = lead === 'gumbri' ? 'square' : 'triangle'; o.frequency.value = freq;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(lead === 'gumbri' ? 900 : 2400, t); f.frequency.exponentialRampToValueAtTime(300, t + 0.4);
      o.connect(f).connect(g);
      this.env(g, t, 0.004, lead === 'gumbri' ? 0.16 : 0.2, Math.min(1.2, dur + 0.4));
      o.start(t); o.stop(t + dur + 0.6);
    }
    g.connect(this.out);
    g.connect(this.verb.input);
  }

  drone(t, dur) {
    const c = this.ctx, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = 'sawtooth'; o.frequency.value = midi(this.track.root - 12);
    f.type = 'lowpass'; f.frequency.value = 380;
    o.connect(f).connect(g).connect(this.out);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.035, t + 0.3); g.gain.setValueAtTime(0.035, t + dur - 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.05);
  }

  play(track, volume) {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.stop();
    this.track = track;
    this.melody = compose(track);
    this.loopSteps = track.steps * 8;
    this.stepDur = 60 / track.bpm / 4;
    this.step = 0;
    this.next = this.ctx.currentTime + 0.1;
    this.setVolume(volume);
    this.timer = setInterval(() => this.tickSched(), 30);
  }

  tickSched() {
    const t0 = this.ctx.currentTime;
    while (this.next < t0 + 0.15) {
      const tr = this.track, st = this.step % this.loopSteps, bar = st % tr.steps, t = this.next;
      const swing = (st % 2) ? this.stepDur * 0.08 : 0;
      const ch = tr.rhythm[bar];
      if (ch && ch !== '-') this.drum(ch, t + swing);
      if (tr.clap && tr.clap[bar] === 'c' && st >= tr.steps * 2) this.drum('c', t);
      if (tr.qraqeb && tr.qraqeb[bar] === 'q') this.drum('q', t + swing);
      if (st % (tr.steps * 2) === 0) this.drone(t, this.stepDur * tr.steps * 2);
      const scale = SCALES[tr.scale];
      for (const n of this.melody) {
        if (n.step !== st) continue;
        const f = midi(tr.root + scale[n.deg]);
        if (n.grace && tr.lead === 'reed') this.note('reed', midi(tr.root + scale[Math.min(7, n.deg + 1)]), t, this.stepDur * 0.35);
        this.note(tr.lead, f, t + (n.grace ? this.stepDur * 0.3 : 0), this.stepDur * n.len * 0.95);
      }
      this.step++;
      this.next += this.stepDur;
    }
  }

  setVolume(v) { if (this.out) this.out.gain.setTargetAtTime(v * 0.9, this.ctx.currentTime, 0.05); }
  stop() { clearInterval(this.timer); this.timer = null; }
}

const engine = new Engine();
const audioEl = new Audio();
audioEl.loop = true;

const cfg = JSON.parse(localStorage.getItem('rami.music') || '{"on":false,"track":"mezoued","volume":0.5}');
const save = () => localStorage.setItem('rami.music', JSON.stringify(cfg));
let userTracks = [];
let currentUrl = null;

export const music = {
  get on() { return cfg.on; },
  get track() { return cfg.track; },
  get volume() { return cfg.volume; },
  get userTracks() { return userTracks; },
  async load() {
    try { userTracks = await idb.all('tracks'); } catch { userTracks = []; }
  },
  start() {
    if (!cfg.on) return;
    const user = userTracks.find(u => u.id === cfg.track);
    engine.stop(); audioEl.pause();
    if (user) {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      currentUrl = URL.createObjectURL(user.blob);
      audioEl.src = currentUrl;
      audioEl.volume = cfg.volume;
      audioEl.play().catch(() => {});
    } else {
      engine.play(TRACKS.find(t => t.id === cfg.track) || TRACKS[0], cfg.volume);
    }
  },
  stop() { engine.stop(); audioEl.pause(); },
  setOn(on) { cfg.on = on; save(); if (on) this.start(); else this.stop(); },
  pick(id) { cfg.track = id; cfg.on = true; save(); this.start(); },
  setVolume(v) { cfg.volume = v; save(); engine.setVolume(v); audioEl.volume = v; },
  async addFiles(files) {
    for (const f of files) {
      if (!f.type.startsWith('audio/') && !/\.(mp3|m4a|ogg|wav|aac|opus)$/i.test(f.name)) continue;
      const item = { id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: f.name.replace(/\.[^.]+$/, '').slice(0, 40), blob: f };
      await idb.put('tracks', item);
      userTracks.push(item);
    }
  },
  async remove(id) {
    await idb.del('tracks', id);
    userTracks = userTracks.filter(u => u.id !== id);
    if (cfg.track === id) { cfg.track = TRACKS[0].id; save(); if (cfg.on) this.start(); }
  },
  // browsers only allow audio after a tap: start on the first one
  armAutostart() {
    const go = () => { if (cfg.on) this.start(); document.removeEventListener('pointerdown', go, true); };
    document.addEventListener('pointerdown', go, true);
  },
  pauseForBackground(hidden) { if (hidden) this.stop(); else if (cfg.on) this.start(); },
};
