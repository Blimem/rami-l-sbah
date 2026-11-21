// Server robustness: junk messages, floods, oversize payloads, wrong-table commands, reconnection.
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import WebSocket from 'ws';

const PORT = 8123;
const srv = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, PORT, DATA_DIR: '/tmp/rami-fuzz-data' }, stdio: ['ignore', 'pipe', 'pipe'] });
let serverErr = '';
srv.stderr.on('data', d => { serverErr += d; });
srv.on('exit', c => { if (c) console.log('SERVER EXIT', c, serverErr); });
await new Promise(r => srv.stdout.once('data', r));
const wait = ms => new Promise(r => setTimeout(r, ms));

function client(name, token) {
  const ws = new WebSocket(`ws://localhost:${PORT}`);
  const c = { ws, msgs: [], name };
  ws.on('error', () => {});
  ws.on('message', d => c.msgs.push(JSON.parse(d)));
  c.open = new Promise(r => ws.on('open', r));
  c.send = m => ws.readyState === 1 && ws.send(typeof m === 'string' ? m : JSON.stringify(m));
  c.last = type => [...c.msgs].reverse().find(m => m.type === type);
  c.hello = async () => { await c.open; c.send({ type: 'hello', name, avatar: '🦁', token }); await wait(150); return c.last('welcome'); };
  return c;
}

try {
  // junk before hello is ignored
  const z = client('Z'); await z.open;
  for (const j of ['', 'x', '{', '[]', 'null', '42', '{"type":5}', '{"type":"act"}', '{"type":"__proto__"}', '{"type":"constructor"}', '{"type":"toString"}']) z.send(j);
  await wait(200);
  assert.equal(z.msgs.length, 0, 'nothing answered before hello');

  const a = client('Amine'); const wa = await a.hello(); assert.ok(wa && wa.pid);
  // prototype-ish handler names must not crash the server
  for (const ty of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf']) a.send({ type: ty });
  // table commands without a table
  for (const ty of ['act', 'chat', 'start', 'ready', 'rebuy', 'kick', 'config', 'voice', 'rtc']) a.send({ type: ty, action: { type: 'draw' } });
  await wait(300);
  assert.ok(a.msgs.filter(m => m.type === 'error' && m.key === 'e.notAtTable').length >= 5);
  // join unknown table
  a.send({ type: 'join', id: 'ZZZZZ' }); a.send({ type: 'join', id: { x: 1 } }); a.send({ type: 'join' });
  await wait(200);
  assert.equal(a.last('error').key, 'e.noTable');
  // create with junk options
  a.send({ type: 'create', name: '<script>x</script>'.repeat(10), maxPlayers: 'lots', rounds: -3, limit: 'abc', openMin: 1e9, turnTime: -1, botLevel: { a: 1 } });
  await wait(300);
  const tb = a.last('table').table;
  assert.ok(!/[<>]/.test(tb.name) && tb.name.length <= 28);
  assert.equal(tb.maxPlayers, 2); assert.equal(tb.openMin, 201); assert.equal(tb.limit, 0);
  assert.ok(tb.turnTime >= 0);
  // second player joins with the code, chat abuse, junk actions
  const b = client('Bilel'); await b.hello();
  b.send({ type: 'join', id: tb.id.toLowerCase() }); await wait(250);
  assert.equal(b.last('table').table.seats.length, 2);
  b.send({ type: 'chat', text: 'x'.repeat(5000) }); b.send({ type: 'chat', text: { a: 1 } }); b.send({ type: 'chat' });
  b.send({ type: 'config', limit: 500 }); // not host
  await wait(200);
  assert.equal(b.last('error').key, 'e.hostOnly');
  a.send({ type: 'config', limit: 300, openMin: 51 }); await wait(200);
  assert.equal(b.last('table').table.limit, 300);
  // rtc relay only for voice members, never to bots/unknown
  b.send({ type: 'rtc', to: 'nobody', data: { x: 1 } }); b.send({ type: 'rtc', to: wa.pid, data: 'x' });
  await wait(150);
  assert.ok(!a.msgs.some(m => m.type === 'rtc'), 'no relay without voice');
  a.send({ type: 'start' }); await wait(400);
  assert.equal(a.last('table').table.state, 'playing');
  // junk game actions from both
  for (const act of [null, 5, 'x', {}, { type: 'meld', groups: [[1, 2, 3]] }, { type: 'discard', card: { $gt: 1 } }, { type: 'draw', from: '../../etc' }]) { a.send({ type: 'act', action: act }); b.send({ type: 'act', action: act }); }
  // stats / leaderboard with junk
  a.send({ type: 'stats', uid: '../../x', card: { name: '<b>', xp: 'NaN' } });
  a.send({ type: 'stats', uid: 'g_fake_google_user', card: { name: 'Hack', xp: 99999999 } });
  a.send({ type: 'stats', uid: 'p_valid_uid_1234', card: { name: '<i>Amine</i>', avatar: 'x'.repeat(50), xp: 1e12, level: -4, stats: { wins: 'a' } } });
  a.send({ type: 'board' });
  a.send({ type: 'cloud', profile: { x: 1 } }); // not signed in: ignored
  a.send({ type: 'google', credential: 'nope' });
  await wait(500);
  const board = a.last('board');
  assert.ok(board && !board.top.some(e => e.name === 'Hack'), 'fake google uid rejected');
  const me = board.top.find(e => e.you);
  assert.ok(me && !/[<>]/.test(me.name) && me.xp <= 1e9 && me.level >= 0 && me.avatar.length <= 8);
  assert.equal(a.last('google').ok, false);
  // flood: 500 messages at once must not kill the server, and the client keeps working afterwards
  for (let i = 0; i < 500; i++) a.send({ type: 'chat', text: 'spam ' + i });
  await wait(1500);
  a.send({ type: 'lobby' }); await wait(300);
  assert.ok(a.last('lobby'), 'still served after flood');
  // oversize payload closes only that socket
  const big = client('Big'); await big.hello();
  big.send(JSON.stringify({ type: 'chat', text: 'y'.repeat(100000) }));
  await wait(300);
  assert.notEqual(big.ws.readyState, 1, 'oversize payload rejected');
  // reconnection with token keeps the seat
  const tokenB = b.last('welcome').token, pidB = b.last('welcome').pid;
  b.ws.close(); await wait(300);
  const b2 = client('Bilel', tokenB); const wb2 = await b2.hello();
  assert.equal(wb2.pid, pidB);
  await wait(300);
  const t2 = b2.last('table');
  assert.ok(t2 && t2.table.seats.some(s => s.id === pidB && s.connected), 'seat kept after reconnect');
  // hands are private: b2 never sees a's cards
  assert.ok(t2.game.hand.length >= 14);
  assert.ok(!('hands' in t2.game) || !t2.game.hands, 'no other hands leaked');
  const res = await fetch(`http://localhost:${PORT}/health`).then(r => r.json());
  assert.ok(res.ok);
  // path traversal on static files
  const tr = await fetch(`http://localhost:${PORT}/..%2f..%2fserver%2findex.js`);
  assert.ok(tr.status === 403 || tr.status === 404 || !(await tr.text()).includes('WebSocketServer'));
  assert.ok(!/TypeError|ReferenceError/.test(serverErr), 'server stderr: ' + serverErr);
  console.log('server fuzz ok');
} finally {
  srv.kill();
}
process.exit(0);
