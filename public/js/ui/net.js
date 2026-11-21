// Two transports with the same shape: the online server, or a table running in this browser vs bots.
import { Table, RuleError } from '../core/table.js';

export class OnlineNet {
  constructor(url, profile, onMsg, onStatus) {
    this.kind = 'online';
    this.url = url;
    this.profile = profile;
    this.onMsg = onMsg;
    this.onStatus = onStatus;
    this.queue = [];
    this.tries = 0;
    this.ready = false;
    this.closed = false;
    this.connect();
  }

  connect() {
    if (this.closed) return;
    this.onStatus('connecting');
    let ws;
    try { ws = new WebSocket(this.url); } catch { return this.retry(); }
    this.ws = ws;
    ws.onopen = () => {
      this.tries = 0;
      ws.send(JSON.stringify({ type: 'hello', token: localStorage.getItem('rami.token'), name: this.profile.name, avatar: this.profile.avatar }));
    };
    ws.onmessage = e => {
      let m;
      try { m = JSON.parse(e.data); } catch { return; }
      if (m.type === 'welcome') {
        localStorage.setItem('rami.token', m.token);
        this.pid = m.pid;
        this.ready = true;
        this.onStatus('online');
        const q = this.queue; this.queue = [];
        q.forEach(x => ws.send(x));
      }
      if (m.type === 'pong') { this.latency = Date.now() - m.t; return; }
      this.onMsg(m);
    };
    ws.onclose = () => {
      this.ready = false;
      if (this.ws === ws) this.retry();
    };
    ws.onerror = () => {};
    clearInterval(this.pinger);
    this.pinger = setInterval(() => this.ready && this.ws.send(JSON.stringify({ type: 'ping', t: Date.now() })), 15000);
  }

  retry() {
    if (this.closed) return;
    this.onStatus('offline');
    const wait = Math.min(8000, 600 * 2 ** this.tries++);
    clearTimeout(this.rt);
    this.rt = setTimeout(() => this.connect(), wait);
  }

  send(type, data = {}) {
    const msg = JSON.stringify({ type, ...data });
    if (this.ready && this.ws.readyState === 1) this.ws.send(msg);
    else this.queue.push(msg);
  }

  close() {
    this.closed = true;
    clearInterval(this.pinger);
    clearTimeout(this.rt);
    if (this.ws) this.ws.close();
  }
}

export class LocalNet {
  constructor(profile, opts, onMsg) {
    this.kind = 'local';
    this.pid = 'me';
    this.onMsg = onMsg;
    this.table = new Table({
      id: 'SOLO', name: 'Contre l\'ordi', host: 'me', maxPlayers: opts.bots + 1, rounds: opts.rounds, limit: opts.limit ?? 500, openMin: opts.openMin ?? 71,
      turnTime: 0, isPublic: false, botLevel: opts.level,
      emit: (pid, msg) => { if (pid === 'me') setTimeout(() => !this.closed && this.onMsg(msg), 0); },
    });
    this.table.join({ id: 'me', name: profile.name, avatar: profile.avatar });
    for (let i = 0; i < opts.bots; i++) this.table.addBot('me', opts.level);
    setTimeout(() => this.table.start('me'), 30);
  }

  send(type, data = {}) {
    const t = this.table;
    try {
      switch (type) {
        case 'act': t.action('me', data.action); break;
        case 'ready': t.markReady('me'); break;
        case 'rebuy': t.rebuy('me', !!data.yes); break;
        case 'start': t.start('me'); break;
        case 'backToLobby': t.start('me'); break; // solo: "3awed" starts a new match directly
        case 'chat': t.chat('me', data.text); this.botReply(data.text); break;
        default: break;
      }
    } catch (e) {
      if (e instanceof RuleError) this.onMsg({ type: 'error', key: e.key, params: e.params, for: type });
      else { console.error(e); this.onMsg({ type: 'error', key: 'e.server' }); }
    }
  }

  botReply(text) {
    const bots = this.table.seats.filter(s => s.bot);
    if (!bots.length || Math.random() < 0.4) return;
    const b = bots[Math.floor(Math.random() * bots.length)];
    const lines = /sa77a|bravo|mabrouk|👏/i.test(text) ? ['Ya3tik essa77a 🤝', 'Merci!', '😄'] : ['Hhh', 'Zid al3ab ya m3allem', '😏', 'Yezzi mel klem, al3ab!', 'Nchoufou ba3d'];
    setTimeout(() => !this.closed && this.table.chat(b.id, lines[Math.floor(Math.random() * lines.length)]), 900 + Math.random() * 1200);
  }

  close() { this.closed = true; this.table.clearTimer(); this.table.state = 'closed'; }
}
