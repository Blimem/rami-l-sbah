// End-to-end: a real server, 2 WebSocket players + 1 bot play a full match.
import { spawn } from 'node:child_process';
import WebSocket from 'ws';
import { botAction } from '../public/js/core/bot.js';

const PORT = 8790;
const srv = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, PORT }, stdio: 'inherit' });
await new Promise(r => setTimeout(r, 600));

function client(name) {
  const ws = new WebSocket(`ws://localhost:${PORT}`);
  const c = { ws, name, last: null, errors: [], send: (type, d = {}) => ws.send(JSON.stringify({ type, ...d })) };
  ws.on('message', raw => {
    const m = JSON.parse(raw);
    if (m.type === 'welcome') c.pid = m.pid;
    if (m.type === 'table') c.last = m;
    if (m.type === 'error') c.errors.push(m.text);
  });
  return new Promise(r => ws.on('open', () => { c.send('hello', { name, avatar: '🐪' }); setTimeout(() => r(c), 100); }));
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const a = await client('Amine'), b = await client('Bilel');
a.send('create', { name: 'Test', maxPlayers: 3, rounds: 2, turnTime: 0 });
await wait(200);
const code = a.last.table.id;
b.send('join', { id: code });
await wait(150);
a.send('addBot');
await wait(150);
if (a.last.table.seats.length !== 3) throw new Error('seats ' + a.last.table.seats.length);
a.send('start');
const t0 = Date.now();
let moves = 0;
while (Date.now() - t0 < 120000) {
  await wait(30);
  const st = a.last.table.state;
  if (st === 'matchEnd') break;
  if (st === 'roundEnd') { a.send('ready'); b.send('ready'); await wait(200); continue; }
  for (const c of [a, b]) {
    const g = c.last && c.last.game;
    if (g && g.turn === c.pid && c.last.table.state === 'playing' && c.pendingFor !== JSON.stringify([g.turnNo, g.phase, g.hand.length, g.melds.length, g.redeals, g.passed, g.penalties])) {
      c.pendingFor = JSON.stringify([g.turnNo, g.phase, g.hand.length, g.melds.length, g.redeals, g.passed, g.penalties]);
      c.send('act', { action: botAction(g, 'pro') }); moves++;
    }
  }
}
const t = a.last.table;
console.log({ state: t.state, rounds: t.history.length, scores: t.seats.map(s => [s.name, s.score]), moves, errors: [...a.errors, ...b.errors].slice(0, 5) });
srv.kill();
if (t.state !== 'matchEnd' || t.history.length !== 2) { console.error('FAIL'); process.exit(1); }
console.log('online ok');
process.exit(0);
