// Score limit with elimination: whoever reaches the limit becomes a spectator, last one left wins.
import assert from 'node:assert';
import { Table } from '../public/js/core/table.js';

let now = 0; const timers = [];
const clock = { now: () => now, set: (f, ms) => { const t = { at: now + ms, f }; timers.push(t); return t; }, clear: t => { const i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); } };
const run = (maxSteps = 200000) => {
  for (let i = 0; i < maxSteps && timers.length; i++) {
    timers.sort((a, b) => a.at - b.at);
    const t = timers.shift(); now = t.at; t.f();
  }
};
const seen = [];
const tb = new Table({ id: 'T', name: 'T', host: 'me', maxPlayers: 4, limit: 300, openMin: 51, turnTime: 0, emit: (pid, m) => { if (m.type === 'table') seen.push(m); }, clock });
tb.join({ id: 'me', name: 'Me', avatar: 'x' });
for (let i = 0; i < 3; i++) tb.addBot('me', 'pro');
tb.start('me');
assert.equal(tb.round.opts.openMin, 51);
tb.disconnect('me');
run();
assert.equal(tb.state, 'matchEnd', 'match should end');
const active = tb.seats.filter(s => !s.out);
assert.ok(active.length <= 2, 'stops when two are left');
for (const s of tb.seats.filter(s => s.out)) assert.ok(s.score >= 300);
// eliminated players were not dealt in later rounds
const outRound = {};
tb.history.forEach(h => (h.out || []).forEach(id => { outRound[id] = h.round; }));
for (const h of tb.history) for (const id of Object.keys(h.scores)) assert.ok(!(outRound[id] < h.round), 'out player played again');
const snap = seen[seen.length - 1].table;
assert.ok(snap.seats.some(s => s.out) && snap.limit === 300 && snap.openMin === 51);
console.log('limit ok', tb.roundNo, 'rounds', tb.seats.map(s => `${s.name}:${s.score}${s.out ? '(out)' : ''}`).join(' '));

// --- 4 players: stops when 2 are left; first one out gets the rebuy offer ---
{
  timers.length = 0; now = 0;
  const t2 = new Table({ id: 'U', name: 'U', host: 'me', maxPlayers: 4, limit: 200, turnTime: 0, emit: () => {}, clock });
  t2.join({ id: 'me', name: 'Me', avatar: 'x' }); t2.join({ id: 'p2', name: 'P2', avatar: 'y' });
  t2.addBot('me', 'pro'); t2.addBot('me', 'pro');
  t2.start('me'); t2.disconnect('me'); t2.disconnect('p2');
  // force "me" to be knocked out first
  t2.seats[0].score = 199;
  let offered = false;
  for (let i = 0; i < 200000 && timers.length; i++) {
    timers.sort((a, b) => a.at - b.at); const tm = timers.shift(); now = tm.at; tm.f();
    const me = t2.seat('me');
    if (me.offer && !offered) {
      offered = true;
      assert.equal(t2.state, 'roundEnd');
      t2.seat('me').connected = true;
      const max = Math.max(...t2.active().map(s => s.score));
      t2.rebuy('me', true);
      assert.equal(me.out, false); assert.equal(me.score, max); assert.equal(me.rebuys, 1);
      t2.seat('me').connected = false;
    }
  }
  assert.ok(offered, 'first out got the offer');
  assert.equal(t2.state, 'matchEnd');
  assert.ok(t2.active().length <= 2);
  const firstOut = t2.firstOut;
  for (const s of t2.seats) if (s.id !== firstOut) assert.ok(!s.rebuys);
  console.log('rebuy ok', t2.roundNo, 'rounds', t2.seats.map(s => `${s.name}:${s.score}${s.out ? '(out)' : ''}`).join(' '));
}
