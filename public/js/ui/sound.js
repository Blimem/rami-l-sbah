// Small synthesized sound kit (no audio files), plus haptics.
let ctx = null;
let enabled = localStorage.getItem('rami.sound') !== '0';

function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, { type = 'sine', gain = 0.12, at = 0, slide = 0 } = {}) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + at;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

function noise(dur, { gain = 0.08, at = 0, hp = 1200 } = {}) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + at;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = buf; f.type = 'highpass'; f.frequency.value = hp; g.gain.value = gain;
  s.connect(f).connect(g).connect(a.destination);
  s.start(t);
}

const KIT = {
  tap: () => tone(880, 0.05, { type: 'triangle', gain: 0.05 }),
  select: () => tone(660, 0.06, { type: 'triangle', gain: 0.06, slide: 1.3 }),
  draw: () => noise(0.12, { gain: 0.12, hp: 2200 }),
  deal: () => { for (let i = 0; i < 6; i++) noise(0.06, { gain: 0.07, at: i * 0.07, hp: 2600 }); },
  discard: () => { noise(0.08, { gain: 0.1, hp: 900 }); tone(180, 0.08, { gain: 0.08, type: 'sine' }); },
  meld: () => { tone(523, 0.14, { gain: 0.08 }); tone(784, 0.2, { gain: 0.08, at: 0.08 }); },
  open: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, { gain: 0.08, at: i * 0.07, type: 'triangle' })),
  turn: () => { tone(988, 0.18, { gain: 0.06 }); tone(1319, 0.3, { gain: 0.05, at: 0.1 }); },
  tick: () => tone(1400, 0.03, { type: 'square', gain: 0.025 }),
  error: () => tone(150, 0.16, { type: 'sawtooth', gain: 0.05, slide: 0.8 }),
  win: () => [523, 659, 784, 1046, 1319].forEach((f, i) => tone(f, 0.35, { gain: 0.08, at: i * 0.1, type: 'triangle' })),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, 0.3, { gain: 0.06, at: i * 0.14 })),
  chat: () => tone(1175, 0.08, { gain: 0.04, type: 'triangle' }),
};

export function sfx(name) {
  if (!enabled || !KIT[name]) return;
  try { KIT[name](); } catch { /* audio not ready */ }
}

export function buzz(ms = 20) {
  if (!enabled) return;
  try {
    if (window.AndroidBridge && window.AndroidBridge.vibrate) window.AndroidBridge.vibrate(ms);
    else if (navigator.vibrate) navigator.vibrate(ms);
  } catch { /* ignore */ }
}

export const sound = {
  get on() { return enabled; },
  toggle() { enabled = !enabled; localStorage.setItem('rami.sound', enabled ? '1' : '0'); if (enabled) sfx('tap'); return enabled; },
};
