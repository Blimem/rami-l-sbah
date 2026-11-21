// Deep tests: house rules, adversarial fuzzing of the engine and the table, invariants.
import assert from 'node:assert/strict';
import { Round, RuleError } from '../public/js/core/game.js';
import { Table } from '../public/js/core/table.js';
import { botAction, autoAction } from '../public/js/core/bot.js';
import { validateMeld, meldProblem } from '../public/js/core/rules.js';

const total = g => g.stock.length + g.discard.length + Object.values(g.hands).reduce((s, h) => s + h.length, 0) + g.melds.reduce((s, m) => s + m.cards.length, 0);
const P3 = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

// 0) a set of two different suits + a joker (2♠ 2♣ JK) is a valid meld, in any order
{
  const c = (r, s, id) => ({ id: id || 'x' + r + s, r, s });
  const JK = { id: 'xJK', r: 0, s: 'J' };
  const two = [c(2, 'S'), c(2, 'C')];
  for (const order of [[...two, JK], [JK, ...two], [two[0], JK, two[1]]]) {
    const m = validateMeld(order);
    assert.equal(m && m.kind, 'set');
    assert.equal(m.points, 6);
    assert.ok(m.cards.find(x => x.s === 'J').as.s === 'H' || m.cards.find(x => x.s === 'J').as.s === 'D');
  }
  for (const r of [1, 7, 11, 12, 13]) assert.equal(validateMeld([c(r, 'H'), c(r, 'D'), JK]).kind, 'set');
  assert.equal(validateMeld([c(2, 'S'), c(2, 'S', 'x2Sb'), JK]), null); // same suit twice
  // and it can really be laid down by a player who already opened
  const g = new Round({ players: P3, seed: 5, starter: 0 });
  g.act('a', { type: 'decide', play: true });
  g.opened.a = true;
  g.hands.a.push(c(2, 'S'), c(2, 'C'), { ...JK });
  const ev = g.act('a', { type: 'meld', groups: [['x2S', 'xJK', 'x2C']] });
  assert.equal(ev.type, 'meld');
  assert.equal(ev.melds[0].kind, 'set');
  assert.equal(meldProblem([c(10, 'H'), c(10, 'C'), c(10, 'D')]), null);
  assert.equal(meldProblem([c(10, 'H'), c(10, 'H', 'b'), c(10, 'D')]), 'why.sameSuit');
  assert.equal(meldProblem([c(10, 'H'), c(10, 'C'), c(10, 'D'), c(11, 'C')]), 'why.mixed');
  assert.equal(meldProblem([c(4, 'H'), c(6, 'H'), c(9, 'H')]), 'why.gap');
  assert.equal(meldProblem([c(4, 'H'), JK, { ...JK, id: 'j2' }]), 'why.jokers');
  console.log('set with joker ok');
}

// 1) taking the discard and putting it back = +50
{
  const g = new Round({ players: P3, seed: 11, starter: 0 });
  g.act('a', { type: 'decide', play: true });
  g.act('a', { type: 'discard', card: g.hands.a[0].id });
  g.act('b', { type: 'draw', from: 'discard' });
  assert.ok(g.viewFor('b').canUndo);
  const ev = g.act('b', { type: 'undoDraw' });
  assert.equal(ev.penalty, 50);
  assert.equal(g.penalties.b, 50);
  assert.equal(g.phase, 'draw');
  assert.equal(g.discard.length, 1);
  assert.ok(g.notes.b.some(n => n.k === 'n.returned'));
  // the penalty ends up in the round score
  g.endRound(null);
  assert.ok(g.over.scores.b >= 50);
  assert.ok(g.over.notes.b.some(n => n.k === 'n.returned'));
  console.log('return penalty ok');
}

// 2) quick discard by the starter = decide yes + discard, works in one go
{
  const g = new Round({ players: P3, seed: 5, starter: 1 });
  assert.equal(g.current, 'b');
  g.act('b', { type: 'decide', play: true });
  g.act('b', { type: 'discard', card: g.hands.b[3].id });
  assert.equal(g.current, 'c'); assert.equal(g.hands.b.length, 14); assert.equal(g.accepted, 'b');
  console.log('quick discard ok');
}

// 3) adversarial fuzz: random/invalid actions must only ever raise RuleError, invariants must hold
{
  let ruleErrors = 0, done = 0;
  const rnd = (n => () => (n = (n * 1103515245 + 12345) % 2147483648) / 2147483648)(42);
  const pick = a => a[Math.floor(rnd() * a.length)];
  for (let seed = 1; seed <= 150; seed++) {
    const n = 2 + (seed % 3);
    const players = Array.from({ length: n }, (_, i) => ({ id: 'p' + i }));
    const g = new Round({ players, seed, starter: seed % n, options: { openMin: [51, 71, 81, 101][seed % 4] } });
    let steps = 0;
    while (!g.over && steps < 4000) {
      steps++;
      const who = rnd() < 0.15 ? pick(g.players) : g.current;
      const hand = g.hands[who];
      const ids = hand.map(c => c.id);
      const junk = [
        { type: 'draw', from: pick(['stock', 'discard', 'x']) }, { type: 'discard', card: pick([...ids, 'nope', null]) },
        { type: 'meld', groups: [[pick(ids), pick(ids), pick(ids)]] }, { type: 'meld', groups: 'x' }, { type: 'meld' },
        { type: 'layoff', cards: [pick(ids)], meld: g.melds.length ? pick(g.melds).id : 'm0' },
        { type: 'swap', card: pick(ids), meld: g.melds.length ? pick(g.melds).id : 'm0' },
        { type: 'undoDraw' }, { type: 'decide', play: rnd() < 0.5 }, { type: 'bogus' }, {},
      ];
      const a = rnd() < 0.35 ? pick(junk) : botAction(g.viewFor(g.current), 'pro');
      try { g.act(who, a); } catch (e) {
        if (!(e instanceof RuleError)) { console.log('NON-RULE ERROR', seed, JSON.stringify(a), e.stack); throw e; }
        ruleErrors++;
        if (rnd() < 0.3) try { g.act(g.current, autoAction(g.viewFor(g.current))); } catch (e2) { if (!(e2 instanceof RuleError)) throw e2; }
      }
      assert.equal(total(g), 108, `card count seed ${seed}`);
      for (const m of g.melds) assert.ok(validateMeld(m.cards), 'meld valid');
      const ids2 = [...g.stock, ...g.discard, ...Object.values(g.hands).flat(), ...g.melds.flatMap(m => m.cards)].map(c => c.id);
      assert.equal(new Set(ids2).size, 108, 'unique card ids');
    }
    if (g.over) done++;
  }
  console.log('fuzz ok', { done, ruleErrors });
}

// 4) table: config validation, host transfer, leave mid-game, kicks, junk config
{
  let now = 0; const timers = [];
  const clock = { now: () => now, set: (f, ms) => { const t = { at: now + ms, f }; timers.push(t); return t; }, clear: t => { const i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); } };
  const sent = [];
  const t = new Table({ id: 'X', name: 'X', host: 'h', maxPlayers: 9, rounds: 99, limit: -5, openMin: 'abc', turnTime: 40, emit: (pid, m) => sent.push([pid, m]), clock });
  assert.equal(t.maxPlayers, 4); assert.equal(t.rounds, 9); assert.equal(t.limit, 0); assert.equal(t.openMin, 71);
  t.join({ id: 'h', name: 'H', avatar: 'a' });
  assert.throws(() => t.start('h'), RuleError);
  t.join({ id: 'g', name: 'G', avatar: 'b' });
  assert.throws(() => t.configure('g', { limit: 300 }), RuleError);
  t.configure('h', { limit: 50, openMin: 999 });
  assert.equal(t.limit, 100); assert.equal(t.openMin, 201);
  t.configure('h', { limit: 300, openMin: 61 });
  t.addBot('h'); t.addBot('h');
  assert.throws(() => t.addBot('h'), RuleError);
  t.start('h');
  assert.equal(t.round.opts.openMin, 61);
  t.leave('h');
  assert.equal(t.host, 'g');
  assert.ok(t.seat('h').bot && t.seat('h').replaced);
  // run to completion
  for (let i = 0; i < 300000 && timers.length; i++) { timers.sort((a, b) => a.at - b.at); const x = timers.shift(); now = x.at; x.f(); }
  assert.equal(t.state, 'matchEnd');
  t.backToLobby('g');
  assert.equal(t.state, 'waiting');
  assert.ok(!t.seats.some(s => s.replaced));
  console.log('table ok', t.history.length, 'rounds');
}
console.log('deep ok');
