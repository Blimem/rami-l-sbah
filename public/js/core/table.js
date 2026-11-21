// A table (room): seats, bots, timers and a match of several rounds.
// Runs on the server for online rooms, and in the browser for games against the bots.
import { Round, RuleError } from './game.js';
import { botAction, autoAction } from './bot.js';

const BOT_NAMES = ['Hamadi', 'Fatma', 'Lassaad', 'Monia', 'Chedly', 'Najet', 'Taoufik', 'Sonia', 'Mongi', 'Rym'];
const BOT_AVATARS = ['🦅', '🌙', '🐪', '🌶️', '🫖', '🐟', '🌿', '🍋'];
const QUICK = ['Sa77a!', 'Brabbi zarbou', 'Yezzi mel hbal 😅', '3ychek', 'Mabrouk!', '😂', '🔥', '👏', '😤', '🤝'];
const uid = () => Math.random().toString(36).slice(2, 10);

// Score limit: 0 = match by number of rounds. Otherwise whoever reaches the limit is out (spectator);
// the others keep playing and the last one left wins.
export const clampLimit = v => { v = Math.round(Number(v) || 0); return v <= 0 ? 0 : Math.min(10000, Math.max(100, v)); };
export const clampOpen = v => Math.min(201, Math.max(21, Math.round(Number(v) || 71)));
const MAX_ROUNDS = 60;
const cleanLevel = l => (['easy', 'normal', 'pro'].includes(l) ? l : 'normal');
// Rebuy ("tgaji"): who gets the offer when knocked out. 'first' = only the first player knocked out, once.
export const REBUY = 'first';

export class Table {
  constructor({ id, name, host, maxPlayers = 4, rounds = 3, limit = 0, openMin = 71, turnTime = 40, isPublic = true, botLevel = 'normal', emit, clock }) {
    this.id = id;
    this.name = name;
    this.host = host;
    this.maxPlayers = Math.min(4, Math.max(2, maxPlayers | 0));
    this.rounds = Math.min(9, Math.max(1, rounds | 0));
    this.limit = clampLimit(limit);
    this.openMin = clampOpen(openMin);
    this.turnTime = Math.min(120, Math.max(0, turnTime | 0));
    this.isPublic = !!isPublic;
    this.botLevel = cleanLevel(botLevel);
    this.emit = emit;
    this.clock = clock || { now: () => Date.now(), set: (f, ms) => setTimeout(f, ms), clear: t => clearTimeout(t) };
    this.seats = [];
    this.state = 'waiting';
    this.round = null;
    this.roundNo = 0;
    this.history = [];
    this.timer = null;
    this.deadline = 0;
    this.nextAt = 0;
    this.ready = new Set();
    this.botSteps = 0;
    this.createdAt = this.clock.now();
    this.voice = new Set();          // players in the voice chat
  }

  // ---------- seats ----------
  seat(pid) { return this.seats.find(s => s.id === pid); }
  humans() { return this.seats.filter(s => !s.bot); }
  active() { return this.seats.filter(s => !s.out); }
  isEmpty() { return !this.humans().some(s => s.connected); }

  join(p) {
    const existing = this.seat(p.id);
    if (existing) {
      Object.assign(existing, { connected: true, name: p.name, avatar: p.avatar });
      if (existing.replaced) { existing.bot = false; existing.replaced = false; }
      this.broadcast();
      return existing;
    }
    if (this.state !== 'waiting') {
      // take over a bot that replaced a player who left
      const free = this.seats.find(s => s.bot && s.replaced);
      if (!free) throw new RuleError('e.startedNoSeat');
      Object.assign(free, { id: this.renameSeat(free.id, p.id), name: p.name, avatar: p.avatar, bot: false, replaced: false, connected: true });
      this.broadcast({ type: 'info', key: 'i.replacedBot', params: { name: p.name } });
      return free;
    }
    if (this.seats.length >= this.maxPlayers) throw new RuleError('e.full');
    const s = { id: p.id, name: p.name, avatar: p.avatar, bot: false, connected: true, score: 0 };
    this.seats.push(s);
    if (!this.host || !this.seat(this.host)) this.host = p.id;
    this.broadcast({ type: 'info', key: 'i.joined', params: { name: p.name } });
    return s;
  }

  renameSeat(oldId, newId) {
    if (this.round) {
      const r = this.round;
      r.players = r.players.map(x => (x === oldId ? newId : x));
      for (const obj of [r.hands, r.opened]) { obj[newId] = obj[oldId]; delete obj[oldId]; }
      r.melds.forEach(m => { if (m.owner === oldId) m.owner = newId; });
    }
    return newId;
  }

  leave(pid) {
    const s = this.seat(pid);
    if (!s) return;
    this.voice.delete(pid);
    if (this.state === 'waiting') {
      this.seats = this.seats.filter(x => x !== s);
    } else {
      // a bot keeps the seat so the others can finish
      s.bot = true; s.replaced = true; s.level = 'normal';
      s.name = s.name + ' 🤖';
      this.schedule();
    }
    if (this.host === pid) this.host = (this.humans()[0] || {}).id || null;
    this.broadcast({ type: 'info', key: 'i.left', params: { name: s.name.replace(' 🤖', '') } });
  }

  disconnect(pid) {
    const s = this.seat(pid);
    if (!s) return;
    s.connected = false;
    this.voice.delete(pid);
    this.broadcast();
    if (this.round && this.round.current === pid) this.schedule();
  }

  addBot(pid, level) {
    if (pid !== this.host) throw new RuleError('e.hostOnly');
    if (this.state !== 'waiting') throw new RuleError('e.started');
    if (this.seats.length >= this.maxPlayers) throw new RuleError('e.full');
    const used = new Set(this.seats.map(s => s.name));
    const name = BOT_NAMES.find(n => !used.has(n)) || 'Bot';
    this.seats.push({ id: 'bot-' + uid(), name, avatar: BOT_AVATARS.find(a => !this.seats.some(x => x.avatar === a)) || '🤖', bot: true, level: level ? cleanLevel(level) : this.botLevel, connected: true, score: 0 });
    this.broadcast();
  }

  kick(pid, seatId) {
    if (pid !== this.host || this.state !== 'waiting') throw new RuleError('e.forbidden');
    const s = this.seat(seatId);
    if (!s || s.id === this.host) return;
    this.seats = this.seats.filter(x => x !== s);
    if (!s.bot) this.emit(s.id, { type: 'kicked' });
    this.broadcast();
  }

  configure(pid, o) {
    if (pid !== this.host || this.state !== 'waiting') throw new RuleError('e.hostOnly');
    if (o.rounds) this.rounds = Math.min(9, Math.max(1, o.rounds | 0));
    if (o.limit !== undefined) this.limit = clampLimit(o.limit);
    if (o.openMin !== undefined) this.openMin = clampOpen(o.openMin);
    if (o.turnTime !== undefined) this.turnTime = Math.min(120, Math.max(0, o.turnTime | 0));
    if (o.maxPlayers) this.maxPlayers = Math.max(this.seats.length, Math.min(4, Math.max(2, o.maxPlayers | 0)));
    if (o.botLevel) this.botLevel = cleanLevel(o.botLevel);
    this.broadcast();
  }

  // ---------- match flow ----------
  start(pid) {
    if (pid !== this.host) throw new RuleError('e.hostOnly');
    if (this.state !== 'waiting' && this.state !== 'matchEnd') throw new RuleError('e.started');
    if (this.seats.length < 2) throw new RuleError('e.twoPlayers');
    this.seats.forEach(s => { s.score = 0; s.out = false; s.offer = false; s.rebuys = 0; });
    this.history = [];
    this.roundNo = 0;
    this.firstOut = null;
    this.startCount = this.seats.length;
    this.nextRound();
  }

  /** Score-limit match: stop when 2 players are left (or 1 in a 2-player match). */
  limitDone() {
    if (this.roundNo >= MAX_ROUNDS) return true;
    return this.active().length <= ((this.startCount || this.seats.length) >= 3 ? 2 : 1);
  }

  nextRound() {
    if (this.limit && this.roundNo > 0) {
      for (const s of this.seats) s.offer = false;  // unanswered rebuy = no
      if (this.limitDone()) { this.clearTimer(); this.state = 'matchEnd'; this.nextAt = 0; this.broadcast(); return; }
    }
    this.roundNo++;
    this.state = 'playing';
    this.ready.clear();
    const active = this.active();
    const starter = (this.roundNo - 1) % active.length;
    this.round = new Round({ players: active.map(s => ({ id: s.id, name: s.name })), starter, seed: (Math.random() * 2 ** 32) >>> 0, options: { openMin: this.openMin } });
    this.broadcast({ type: 'deal' });
    this.schedule();
  }

  finishRound() {
    const o = this.round.over;
    for (const s of this.seats) s.score += o.scores[s.id] || 0;
    const outNow = [];
    if (this.limit) {
      for (const s of this.seats) if (!s.out && s.score >= this.limit) { s.out = true; outNow.push(s.id); }
      for (const id of outNow) {
        const s = this.seat(id);
        if (this.firstOut === null || this.firstOut === undefined) this.firstOut = id;
        const eligible = REBUY === 'all' || id === this.firstOut;
        if (eligible && !s.rebuys && !s.bot && this.active().length >= 1) s.offer = true;
      }
    }
    this.history.push({ round: this.roundNo, scores: { ...o.scores }, winner: o.winner, rami: o.rami, notes: o.notes, out: outNow });
    this.clearTimer();
    const done = this.limit ? !this.seats.some(s => s.offer) && this.limitDone() : this.roundNo >= this.rounds;
    if (done) {
      this.state = 'matchEnd';
      this.nextAt = 0;
    } else {
      this.state = 'roundEnd';
      this.nextAt = this.clock.now() + 15000;
      this.timer = this.clock.set(() => this.state === 'roundEnd' && this.nextRound(), 15000);
    }
  }

  /** Answer to "T7eb tgaji?": come back with the highest score among the players still in. */
  rebuy(pid, yes) {
    const s = this.seat(pid);
    if (!s || !s.offer || this.state !== 'roundEnd') return;
    s.offer = false;
    if (yes) {
      const others = this.active().filter(x => x !== s);
      s.score = others.length ? Math.max(...others.map(x => x.score)) : 0;
      s.out = false;
      s.rebuys = (s.rebuys || 0) + 1;
      this.broadcast({ type: 'info', key: 'i.rebuy', params: { name: s.name, n: s.score } });
    }
    this.markReady(pid);
  }

  markReady(pid) {
    if (this.state !== 'roundEnd') return;
    this.ready.add(pid);
    const waiting = this.humans().filter(s => s.connected && (!s.out || s.offer));
    if (waiting.every(s => this.ready.has(s.id) && !s.offer)) {
      this.clearTimer();
      this.nextRound();
    } else this.broadcast();
  }

  backToLobby(pid) {
    if (pid !== this.host || this.state !== 'matchEnd') return;
    this.seats = this.seats.filter(s => !s.replaced);
    this.seats.forEach(s => { s.score = 0; s.out = false; s.offer = false; s.rebuys = 0; });
    this.state = 'waiting';
    this.round = null;
    this.broadcast();
  }

  // ---------- moves ----------
  action(pid, a) {
    if (this.state !== 'playing' || !this.round) throw new RuleError('e.noGame');
    const ev = this.round.act(pid, a);
    if (this.seat(pid) && !this.seat(pid).bot) this.seat(pid).timeouts = 0;
    this.after(ev);
    return ev;
  }

  after(ev) {
    if (this.round.over) this.finishRound();
    this.broadcast(ev);
    if (this.state === 'playing') this.schedule();
  }

  clearTimer() { if (this.timer) this.clock.clear(this.timer); this.timer = null; }

  schedule() {
    this.clearTimer();
    if (this.state !== 'playing') return;
    const r = this.round;
    const s = this.seat(r.current);
    const turnKey = r.turnNo + ':' + r.redeals + ':' + r.log.length;
    if (s.bot || !s.connected) {
      const think = s.bot ? (r.phase === 'draw' ? 900 : r.phase === 'decide' ? 1300 : 700) + Math.random() * 600 : 2500;
      this.deadline = 0;
      this.timer = this.clock.set(() => this.botMove(s, turnKey), think);
      return;
    }
    if (this.turnTime > 0) {
      const key = r.turnNo + ':' + r.redeals + (r.phase === 'decide' ? 'd' : '');
      if (r.phase === 'draw' || this.deadlineKey !== key) {
        this.deadline = this.clock.now() + this.turnTime * 1000;
        this.deadlineKey = key;
      }
      this.timer = this.clock.set(() => this.timeout(s), Math.max(0, this.deadline - this.clock.now()));
    } else this.deadline = 0;
  }

  botMove(s, turnKey) {
    const r = this.round;
    if (this.state !== 'playing' || !r || r.over || r.current !== s.id) return;
    if (r.turnNo + ':' + r.redeals + ':' + r.log.length !== turnKey) return;
    const view = r.viewFor(s.id);
    this.botSteps = r.turnNo === this.botTurn ? this.botSteps + 1 : 0;
    this.botTurn = r.turnNo;
    let a = s.bot && this.botSteps < 25 ? botAction(view, s.level || this.botLevel) : autoAction(view);
    try { this.after(r.act(s.id, a)); } catch (e) {
      try { this.after(r.act(s.id, autoAction(r.viewFor(s.id)))); } catch (e2) { console.error('bot stuck', e2); }
    }
  }

  timeout(s) {
    const r = this.round;
    if (this.state !== 'playing' || !r || r.over || r.current !== s.id) return;
    s.timeouts = (s.timeouts || 0) + 1;
    // play the safe moves until the turn ends
    let guard = 0;
    while (!r.over && r.current === s.id && guard++ < 5) {
      try { r.act(s.id, autoAction(r.viewFor(s.id))); } catch { break; }
    }
    this.emit(s.id, { type: 'toast', key: 't.timeUp' });
    if (r.over) this.finishRound();
    this.broadcast({ type: 'timeout', player: s.id });
    if (this.state === 'playing') this.schedule();
  }

  setVoice(pid, on) {
    if (!this.seat(pid)) return;
    if (on) this.voice.add(pid); else this.voice.delete(pid);
    this.broadcast();
  }

  chat(pid, text) {
    const s = this.seat(pid);
    if (!s) return;
    const clean = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 140);
    if (!clean) return;
    const msg = { type: 'chat', from: pid, name: s.name, avatar: s.avatar, text: clean, at: this.clock.now() };
    for (const x of this.humans()) this.emit(x.id, msg);
  }

  // ---------- views ----------
  publicInfo() {
    return {
      id: this.id, name: this.name, isPublic: this.isPublic, state: this.state,
      players: this.seats.length, humans: this.humans().length, maxPlayers: this.maxPlayers, rounds: this.rounds, limit: this.limit, openMin: this.openMin,
      turnTime: this.turnTime, host: (this.seat(this.host) || {}).name || '',
      seats: this.seats.map(s => ({ name: s.name, avatar: s.avatar, bot: s.bot })),
    };
  }

  snapshot(pid) {
    const r = this.round;
    return {
      type: 'table',
      table: {
        id: this.id, name: this.name, host: this.host, state: this.state, isPublic: this.isPublic,
        maxPlayers: this.maxPlayers, rounds: this.rounds, limit: this.limit, openMin: this.openMin, roundNo: this.roundNo, turnTime: this.turnTime, botLevel: this.botLevel,
        seats: this.seats.map(s => ({ id: s.id, name: s.name, avatar: s.avatar, bot: s.bot, connected: s.connected, score: s.score, out: !!s.out, offer: !!s.offer, rebuys: s.rebuys || 0, ready: this.ready.has(s.id) })),
        voice: [...this.voice],
        history: this.history, nextAt: this.nextAt, deadline: this.deadline, now: this.clock.now(),
      },
      game: r ? r.viewFor(pid) : null,
    };
  }

  sanitize(ev, pid) {
    if (!ev) return null;
    if (ev.type === 'draw' && ev.player !== pid && ev.from === 'stock') return { ...ev, cardId: undefined };
    return ev;
  }

  broadcast(ev) {
    for (const s of this.seats) {
      if (s.bot) continue;
      const snap = this.snapshot(s.id);
      snap.event = this.sanitize(ev, s.id);
      this.emit(s.id, snap);
    }
  }
}

export { QUICK, RuleError };
