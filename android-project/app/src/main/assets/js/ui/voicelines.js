// Funny Tunisian voice lines: "imchi marznik", "hedhi tris lil 3ris", "quatro ija khoudh b khatrou".
// Each line uses the phone's text-to-speech by default, or a clip the player recorded.
import { idb } from './store.js';

export const LINES = {
  marznik: { label: 'Imchi marznik! 🐢', tts: 'إمشي، ما رزنك!' },
  tris: { label: 'Hedhi tris lil 3ris! 💍', tts: 'هاذي تريس للعريس!' },
  quatro: { label: 'Quatro, ija khoudh b khatrou! 🃏', tts: 'كواترو، إيجا خوذ بخاطرو!' },
};

const cfg = JSON.parse(localStorage.getItem('rami.lines') || '{"on":true}');
const recorded = {};
let volume = 1;

export const voicelines = {
  get on() { return cfg.on; },
  setOn(v) { cfg.on = v; localStorage.setItem('rami.lines', JSON.stringify(cfg)); },
  hasRecording: k => !!recorded[k],
  setVolume(v) { volume = v; },
  async load() {
    try { for (const r of await idb.all('voices')) recorded[r.id] = r.blob; } catch { /* no storage */ }
  },
  play(k, force = false) {
    if ((!cfg.on && !force) || !LINES[k]) return;
    if (recorded[k]) {
      const a = new Audio(URL.createObjectURL(recorded[k]));
      a.volume = volume;
      a.play().catch(() => {});
      return;
    }
    const text = LINES[k].tts;
    try {
      if (window.AndroidBridge && window.AndroidBridge.speak) { window.AndroidBridge.speak(text); return; }
      if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(text);
        const v = speechSynthesis.getVoices().find(x => /^ar/i.test(x.lang));
        if (v) u.voice = v;
        u.lang = v ? v.lang : 'ar';
        u.rate = 1.05; u.pitch = 1.15; u.volume = volume;
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      }
    } catch { /* no voice available */ }
  },
  /** Records up to 4 seconds from the mic. Resolves when saved. */
  async record(k, onState) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    const chunks = [];
    rec.ondataavailable = e => chunks.push(e.data);
    const done = new Promise(res => { rec.onstop = res; });
    rec.start();
    onState && onState('rec');
    setTimeout(() => rec.state === 'recording' && rec.stop(), 4000);
    this._stop = () => rec.state === 'recording' && rec.stop();
    await done;
    stream.getTracks().forEach(t => t.stop());
    const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
    recorded[k] = blob;
    await idb.put('voices', { id: k, blob });
    onState && onState('done');
  },
  stopRecording() { this._stop && this._stop(); },
  async reset(k) { delete recorded[k]; await idb.del('voices', k); },
};
