import { Round } from '../public/js/core/game.js';
import { botAction, autoAction } from '../public/js/core/bot.js';
import { validateMeld } from '../public/js/core/rules.js';
import assert from 'node:assert/strict';

// unit checks
const C = (r, s, id = r + s) => ({ id, r, s });
const J = (id = 'j') => ({ id, r: 0, s: 'J' });
assert.equal(validateMeld([C(7,'S'),C(7,'H'),C(7,'D')]).points, 21);
assert.equal(validateMeld([C(1,'S'),C(1,'H'),C(1,'D'),C(1,'C')]).points, 44);
assert.equal(validateMeld([C(7,'S'),C(7,'S','x'),C(7,'D')]), null);
assert.equal(validateMeld([C(12,'H'),C(13,'H'),C(1,'H')]).points, 31);
assert.equal(validateMeld([C(1,'H'),C(2,'H'),C(3,'H')]).points, 6);
assert.equal(validateMeld([C(13,'H'),C(1,'H'),C(2,'H')]), null);
assert.equal(validateMeld([C(5,'H'),J(),C(7,'H')]).cards[1].as.r, 6);
assert.equal(validateMeld([C(5,'H'),J(),J('k')]), null);
assert.equal(validateMeld([C(9,'C'),C(10,'C'),C(11,'C'),C(12,'C'),J()]).points, 9+10+10+10+10);
assert.equal(validateMeld([C(5,'H'),C(5,'S'),J()]).kind, 'set');
console.log('rules ok');

let rounds = 0, wins = 0, totalTurns = 0, errors = 0, ramis = 0, stuck = 0;
for (let seed = 1; seed <= 300; seed++) {
  const n = 2 + (seed % 3);
  const players = Array.from({ length: n }, (_, i) => ({ id: 'p' + i, name: 'P' + i }));
  const g = new Round({ players, seed, starter: seed % n });
  let steps = 0;
  while (!g.over && steps < 5000) {
    const v = g.viewFor(g.current);
    let a = botAction(v, 'pro');
    try { g.act(g.current, a); } catch (e) {
      errors++; if (errors < 5) console.log('ERR', seed, e.message, JSON.stringify(a));
      g.act(g.current, autoAction(g.viewFor(g.current)));
    }
    steps++;
  }
  if (!g.over) { stuck++; continue; }
  // invariant: card count
  const total = g.stock.length + g.discard.length + Object.values(g.hands).reduce((s, h) => s + h.length, 0) + g.melds.reduce((s, m) => s + m.cards.length, 0);
  assert.equal(total, 108, 'card count');
  for (const m of g.melds) assert.ok(validateMeld(m.cards), 'meld valid');
  rounds++; if (g.over.winner) wins++; if (g.over.rami) ramis++;
  totalTurns += g.turnNo;
}
console.log({ rounds, wins, ramis, avgTurns: (totalTurns / rounds).toFixed(1), errors, stuck });

// ---- Tunisian house rules ----
{
  const players = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  // decide: "le" redeals, "nal3bou" commits the starter
  const g = new Round({ players, seed: 7, starter: 0 });
  assert.equal(g.phase, 'decide');
  const before = g.hands.a.map(c => c.id).join();
  g.act('a', { type: 'decide', play: false });
  assert.equal(g.current, 'b'); assert.equal(g.redeals, 0);
  g.act('b', { type: 'decide', play: false });
  g.act('c', { type: 'decide', play: false });
  assert.equal(g.redeals, 1); assert.equal(g.current, 'a'); assert.equal(g.phase, 'decide'); assert.equal(g.hands.a.length, 15);
  assert.notEqual(g.hands.a.map(c => c.id + c.r + c.s).join(), before);
  assert.throws(() => g.act('a', { type: 'discard', card: g.hands.a[0].id }));
  g.act('a', { type: 'decide', play: false });
  g.act('b', { type: 'decide', play: true });
  assert.equal(g.accepted, 'b'); assert.equal(g.current, 'a'); assert.equal(g.phase, 'play');

  // opening without a clean run: rejected, +50, cards stay
  const C = (r, s, id) => ({ id, r, s });
  g.hands.a = [C(13,'S','k1'),C(13,'H','k2'),C(13,'D','k3'),C(12,'S','q1'),C(12,'H','q2'),C(12,'D','q3'),C(11,'S','j1'),C(11,'H','j2'),C(0,'J','jk'),C(2,'C','x')];
  const ev = g.act('a', { type: 'meld', groups: [['k1','k2','k3'],['q1','q2','q3'],['j1','j2','jk']] });
  assert.equal(ev.type, 'penalty'); assert.equal(g.penalties.a, 50); assert.equal(g.opened.a, false); assert.equal(g.hands.a.length, 10);

  // frich with the card b threw: b pays 100 + 50, c pays 100, a (accepted, not opened, but a is not winner here)
  const h = new Round({ players, seed: 9, starter: 0, options: { frich: false } });
  h.hands.a = [C(4,'S','s4'),C(9,'D','d9'),...h.hands.a.slice(2)];
  h.act('a', { type: 'discard', card: 'd9' });                       // a -> b
  h.hands.b = [C(5,'S','s5'),C(7,'S','s7'),C(13,'H','h13'),C(13,'D','d13'),C(13,'C','c13'),C(12,'H','h12'),C(12,'D','d12'),C(12,'C','c12'),C(3,'C','c3')];
  h.act('b', { type: 'draw', from: 'stock' });
  h.act('b', { type: 'discard', card: 'c3' });                        // b -> c
  h.hands.c = [C(4,'C','c4'),C(5,'C','c5'),C(13,'S','s13'),C(13,'H','h13b'),C(13,'D','d13b'),C(1,'S','sA'),C(1,'H','hA'),C(1,'D','dA'),C(8,'H','h8')];
  h.act('c', { type: 'draw', from: 'discard' });                      // takes b's 3♣
  h.act('c', { type: 'meld', groups: [['c3','c4','c5'],['s13','h13b','d13b'],['sA','hA','dA']] });
  h.act('c', { type: 'discard', card: 'h8' });
  assert.ok(h.over && h.over.frich);
  assert.equal(h.over.scores.c, -20);
  assert.equal(h.over.scores.b, 150);
  assert.equal(h.over.scores.a, 100);
  console.log('house rules ok');
}
