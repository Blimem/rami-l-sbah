// Voice chat between the players of an online table: WebRTC peer-to-peer audio,
// the game server only relays the connection set-up messages.
const ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];

export class VoiceChat {
  constructor(send, onChange) {
    this.send = send;           // (type, data) to the server
    this.onChange = onChange;   // UI refresh
    this.peers = new Map();     // pid -> { pc, audio, level }
    this.stream = null;
    this.muted = false;
    this.speaking = new Set();
    this.me = null;
  }

  get active() { return !!this.stream; }

  async start(me) {
    this.me = me;
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.watch(me, this.stream);
    this.send('voice', { on: true });
    this.loop = setInterval(() => this.levels(), 150);
    this.onChange();
  }

  stop() {
    if (!this.stream) return;
    this.send('voice', { on: false });
    for (const pid of [...this.peers.keys()]) this.drop(pid);
    this.stream.getTracks().forEach(t => t.stop());
    this.stream = null;
    clearInterval(this.loop);
    this.speaking.clear();
    if (this.ctx) this.ctx.close();
    this.analysers = null;
    this.onChange();
  }

  setMuted(m) {
    this.muted = m;
    if (this.stream) this.stream.getAudioTracks().forEach(t => { t.enabled = !m; });
    this.onChange();
  }

  /** Called with every table snapshot: connect to whoever is in the voice chat. */
  sync(voiceIds) {
    if (!this.stream) return;
    const want = new Set(voiceIds.filter(id => id !== this.me));
    for (const pid of [...this.peers.keys()]) if (!want.has(pid)) this.drop(pid);
    for (const pid of want) if (!this.peers.has(pid) && this.me < pid) this.call(pid);
  }

  peer(pid) {
    let p = this.peers.get(pid);
    if (p) return p;
    const pc = new RTCPeerConnection({ iceServers: ICE });
    const audio = new Audio();
    audio.autoplay = true;
    p = { pc, audio };
    this.peers.set(pid, p);
    this.stream.getTracks().forEach(t => pc.addTrack(t, this.stream));
    pc.onicecandidate = e => e.candidate && this.send('rtc', { to: pid, data: { ice: e.candidate } });
    pc.ontrack = e => { audio.srcObject = e.streams[0]; audio.play().catch(() => {}); this.watch(pid, e.streams[0]); };
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed') { this.drop(pid); this.onChange('failed'); } };
    return p;
  }

  async call(pid) {
    const { pc } = this.peer(pid);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.send('rtc', { to: pid, data: { sdp: pc.localDescription } });
  }

  async signal(from, data) {
    if (!this.stream) return;
    const { pc } = this.peer(from);
    try {
      if (data.sdp) {
        await pc.setRemoteDescription(data.sdp);
        if (data.sdp.type === 'offer') {
          await pc.setLocalDescription(await pc.createAnswer());
          this.send('rtc', { to: from, data: { sdp: pc.localDescription } });
        }
      } else if (data.ice) await pc.addIceCandidate(data.ice);
    } catch (e) { console.warn('rtc', e); }
  }

  drop(pid) {
    const p = this.peers.get(pid);
    if (!p) return;
    p.pc.close();
    p.audio.srcObject = null;
    this.peers.delete(pid);
    if (this.analysers) delete this.analysers[pid];
  }

  watch(pid, stream) {
    try {
      const an = this.ctx.createAnalyser();
      an.fftSize = 512;
      this.ctx.createMediaStreamSource(stream).connect(an);
      this.analysers = this.analysers || {};
      this.analysers[pid] = an;
    } catch { /* ignore */ }
  }

  levels() {
    if (!this.analysers) return;
    const buf = new Uint8Array(256);
    const now = new Set();
    for (const [pid, an] of Object.entries(this.analysers)) {
      if (pid === this.me && this.muted) continue;
      an.getByteTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += (v - 128) ** 2;
      if (Math.sqrt(sum / buf.length) > 6) now.add(pid);
    }
    const changed = now.size !== this.speaking.size || [...now].some(x => !this.speaking.has(x));
    this.speaking = now;
    if (changed) this.onChange('levels');
  }
}
