// Rami Tounsi server: static files + WebSocket lobby and tables.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { Table, RuleError } from '../public/js/core/table.js';
import { submitStats, leaderboard, verifyGoogle, cloudGet, cloudPut, googleClientId } from './accounts.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const PORT = Number(process.env.PORT) || 8080;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, tables: tables.size, online: clients.size }));
  }
  let file = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname)));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (url.pathname === '/' || !path.extname(file)) file = path.join(ROOT, 'index.html');
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(file);
    res.writeHead(200, {
      'content-type': MIME[ext] || 'application/octet-stream',
      'cache-control': ext === '.woff2' ? 'public, max-age=31536000, immutable' : 'no-cache',
      'x-content-type-options': 'nosniff',
    });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server, maxPayload: 32 * 1024 });
const clients = new Map();   // pid -> { ws, name, avatar, table }
const tokens = new Map();    // token -> pid
const tables = new Map();    // code -> Table
const lobbyWatchers = new Set();

const send = (ws, msg) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); };
const emitTo = (pid, msg) => {
  const c = clients.get(pid);
  if (!c) return;
  if (msg.type === 'kicked') { c.table = null; pushLobby(); }
  send(c.ws, msg);
};
const code = () => {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let c;
  do c = Array.from(crypto.randomBytes(5), b => A[b % A.length]).join(''); while (tables.has(c));
  return c;
};
const cleanName = n => String(n || '').replace(/[<>]/g, '').trim().slice(0, 18) || 'Joueur';
const cleanAvatar = a => (typeof a === 'string' && a.length <= 8 ? a : '🃏');

function lobbyState() {
  const rooms = [...tables.values()].filter(t => t.isPublic).map(t => t.publicInfo())
    .sort((a, b) => (a.state === 'waiting' ? 0 : 1) - (b.state === 'waiting' ? 0 : 1));
  return { type: 'lobby', rooms, online: [...clients.values()].filter(c => c.ws && c.ws.readyState === 1).length };
}
let lobbyTimer = null;
function pushLobby() {
  if (lobbyTimer) return;
  lobbyTimer = setTimeout(() => {
    lobbyTimer = null;
    const st = lobbyState();
    for (const ws of lobbyWatchers) send(ws, st);
  }, 150);
}

function leaveTable(pid) {
  const c = clients.get(pid);
  if (!c || !c.table) return;
  const t = tables.get(c.table);
  c.table = null;
  if (!t) return;
  t.leave(pid);
  if (!t.humans().length) { t.clearTimer(); tables.delete(t.id); }
  pushLobby();
}

function joinTable(pid, t) {
  const c = clients.get(pid);
  if (c.table && c.table !== t.id) leaveTable(pid);
  t.join({ id: pid, name: c.name, avatar: c.avatar });
  c.table = t.id;
  pushLobby();
}

const handlers = {
  hello(ws, m) {
    let pid = m.token && tokens.get(m.token);
    let token = m.token;
    if (!pid) {
      pid = 'u_' + crypto.randomBytes(6).toString('hex');
      token = crypto.randomBytes(18).toString('base64url');
      tokens.set(token, pid);
    }
    const prev = clients.get(pid);
    if (prev && prev.ws && prev.ws !== ws) { send(prev.ws, { type: 'replaced' }); prev.ws.close(); }
    const c = { ws, name: cleanName(m.name), avatar: cleanAvatar(m.avatar), table: prev ? prev.table : null };
    clients.set(pid, c);
    ws.pid = pid;
    send(ws, { type: 'welcome', pid, token, google: googleClientId() || null });
    const t = c.table && tables.get(c.table);
    if (t && t.seat(pid)) { t.join({ id: pid, name: c.name, avatar: c.avatar }); }
    else c.table = null;
    pushLobby();
  },
  lobby(ws) { lobbyWatchers.add(ws); send(ws, lobbyState()); },
  profile(ws, m) {
    const c = clients.get(ws.pid);
    c.name = cleanName(m.name); c.avatar = cleanAvatar(m.avatar);
  },
  create(ws, m) {
    const id = code();
    const t = new Table({
      id, name: cleanName(m.name || clients.get(ws.pid).name + ' — tawla').slice(0, 28) || 'Tawla', host: ws.pid,
      maxPlayers: m.maxPlayers, rounds: m.rounds, limit: m.limit, openMin: m.openMin, turnTime: m.turnTime ?? 40, isPublic: m.isPublic !== false,
      botLevel: m.botLevel || 'normal', emit: emitTo,
    });
    tables.set(id, t);
    joinTable(ws.pid, t);
  },
  join(ws, m) {
    const t = tables.get(String(m.id || '').toUpperCase().trim());
    if (!t) throw new RuleError('e.noTable');
    joinTable(ws.pid, t);
  },
  leave(ws) { leaveTable(ws.pid); send(ws, { type: 'left' }); },
  // progression: the client keeps its profile, the server keeps the public leaderboard
  stats(ws, m) {
    const uid = ws.googleSub ? 'g_' + ws.googleSub : m.uid;
    if (String(uid).startsWith('g_') && !ws.googleSub) return;
    submitStats(uid, m.card);
    ws.uid = uid;
  },
  board(ws) { send(ws, { type: 'board', ...leaderboard(ws.uid) }); },
  google(ws, m) {
    verifyGoogle(m.credential).then(g => {
      ws.googleSub = g.sub;
      ws.uid = 'g_' + g.sub;
      send(ws, { type: 'google', ok: true, uid: ws.uid, name: g.name, profile: cloudGet(g.sub) });
    }).catch(e => send(ws, { type: 'google', ok: false, reason: e.message }));
  },
  cloud(ws, m) { if (ws.googleSub) cloudPut(ws.googleSub, m.profile); },
};
const tableCmds = {
  addBot: (t, pid, m) => t.addBot(pid, m.level),
  kick: (t, pid, m) => t.kick(pid, m.seat),
  config: (t, pid, m) => t.configure(pid, m),
  start: (t, pid) => t.start(pid),
  ready: (t, pid) => t.markReady(pid),
  rebuy: (t, pid, m) => t.rebuy(pid, !!m.yes),
  backToLobby: (t, pid) => t.backToLobby(pid),
  act: (t, pid, m) => t.action(pid, m.action || {}),
  chat: (t, pid, m) => t.chat(pid, m.text),
  voice: (t, pid, m) => t.setVoice(pid, !!m.on),
  // WebRTC signaling, only between people sitting at the same table
  rtc: (t, pid, m) => {
    const to = t.seat(m.to);
    if (!to || to.bot || !t.voice.has(pid)) return;
    emitTo(m.to, { type: 'rtc', from: pid, data: m.data });
  },
};

wss.on('connection', ws => {
  ws.isAlive = true;
  let budget = 60;
  const refill = setInterval(() => { budget = Math.min(60, budget + 20); }, 1000);
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', raw => {
    if (--budget < 0) return;  // flood protection
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m.type !== 'string') return;
    try {
      if (m.type === 'ping') return send(ws, { type: 'pong', t: m.t });
      if (m.type !== 'hello' && !ws.pid) return;
      if (handlers[m.type]) handlers[m.type](ws, m);
      else if (tableCmds[m.type]) {
        const c = clients.get(ws.pid);
        const t = c && c.table && tables.get(c.table);
        if (!t) throw new RuleError('e.notAtTable');
        tableCmds[m.type](t, ws.pid, m);
        if (['addBot', 'kick', 'config', 'start', 'backToLobby'].includes(m.type)) pushLobby();
      }
    } catch (e) {
      if (!(e instanceof RuleError)) console.error(e);
      send(ws, { type: 'error', key: e instanceof RuleError ? e.key : 'e.server', params: e.params || {}, for: m.type });
    }
  });
  ws.on('close', () => {
    clearInterval(refill);
    lobbyWatchers.delete(ws);
    const c = ws.pid && clients.get(ws.pid);
    if (!c || c.ws !== ws) return;
    c.ws = null;
    const t = c.table && tables.get(c.table);
    if (t) t.disconnect(ws.pid);
    // give them 2 minutes to come back, then free the seat
    setTimeout(() => {
      const cc = clients.get(ws.pid);
      if (cc && !cc.ws) { leaveTable(ws.pid); clients.delete(ws.pid); pushLobby(); }
    }, 120000);
    pushLobby();
  });
});

setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 25000);

server.listen(PORT, () => console.log(`Rami Tounsi server on http://localhost:${PORT}`));
