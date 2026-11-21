// Exhaustive check of set / run validation against an independent reference.
import assert from 'node:assert/strict';
import { validateMeld, meldProblem } from '../public/js/core/rules.js';

const SUITS = ['S', 'H', 'D', 'C'];
let uid = 0;
const C = (r, s) => ({ id: 'k' + uid++, r, s });
const J = () => ({ id: 'j' + uid++, r: 0, s: 'J' });

// --- independent reference -------------------------------------------------
function refSet(cards) {
  const nat = cards.filter(c => c.s !== 'J');
  const jk = cards.length - nat.length;
  if (cards.length < 3 || cards.length > 4 || nat.length < 2 || jk >= nat.length) return false;
  if (!nat.every(c => c.r === nat[0].r)) return false;
  return new Set(nat.map(c => c.s)).size === nat.length;
}
function refRun(cards) {
  const nat = cards.filter(c => c.s !== 'J');
  const jk = cards.length - nat.length;
  const L = cards.length;
  if (L < 3 || nat.length < 2 || jk >= nat.length) return false;
  if (!nat.every(c => c.s === nat[0].s)) return false;
  // try every window [lo, lo+L-1] inside 1..14 that doesn't hold both 1 and 14
  for (let lo = 1; lo + L - 1 <= 14; lo++) {
    const hi = lo + L - 1;
    if (lo === 1 && hi === 14) continue;
    const used = new Set();
    let ok = true;
    for (const c of nat) {
      const opts = c.r === 1 ? [1, 14] : [c.r];
      const p = opts.find(x => x >= lo && x <= hi && !used.has(x));
      if (p === undefined) { ok = false; break; }
      used.add(p);
    }
    if (ok) return true;
  }
  return false;
}
const ref = cards => refSet(cards) || refRun(cards);

let checked = 0, bad = [];
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
function check(cards) {
  for (const order of [cards, [...cards].reverse(), shuffle(cards)]) {
    const got = !!validateMeld(order), want = ref(order);
    checked++;
    if (got !== want && bad.length < 20) bad.push({ cards: order.map(c => c.s === 'J' ? 'JK' : c.r + c.s).join(' '), got, want });
    if (got) {
      const m = validateMeld(order);
      assert.equal(m.cards.length, order.length, 'meld keeps every card');
      assert.ok(m.cards.filter(c => c.s === 'J').every(c => c.as && c.as.r >= 1 && c.as.r <= 13), 'joker gets a value');
    } else assert.ok(typeof meldProblem(order) === 'string');
  }
}

// --- sets: every rank, every multiset of suits (2 decks -> duplicates allowed), 0..2 jokers, size 3..5
for (let r = 1; r <= 13; r++) {
  for (let n = 1; n <= 5; n++) {
    const combos = [];
    const rec = (start, acc) => { if (acc.length === n) { combos.push(acc); return; } for (let i = start; i < 4; i++) rec(i, [...acc, SUITS[i]]); };
    rec(0, []);
    for (const suits of combos) for (let jk = 0; jk <= 2; jk++) {
      if (n + jk < 3 || n + jk > 5) continue;
      check([...suits.map(s => C(r, s)), ...Array.from({ length: jk }, J)]);
    }
  }
}
const setsChecked = checked;

// --- runs: every suit, every subset of ranks (size 2..13), 0..2 jokers
for (const s of SUITS) {
  for (let mask = 1; mask < 1 << 13; mask++) {
    const ranks = [];
    for (let i = 0; i < 13; i++) if (mask & (1 << i)) ranks.push(i + 1);
    if (ranks.length < 2) continue;
    for (let jk = 0; jk <= 2; jk++) {
      if (ranks.length + jk < 3) continue;
      // only test joker variants for small/medium runs to keep it fast
      if (jk && ranks.length > 8 && s !== 'S') continue;
      check([...ranks.map(r => C(r, s)), ...Array.from({ length: jk }, J)]);
    }
  }
}
// --- mixed suits / duplicates (must all be refused unless a set)
for (let i = 0; i < 20000; i++) {
  const n = 3 + Math.floor(Math.random() * 4);
  const cards = Array.from({ length: n }, () => (Math.random() < 0.12 ? J() : C(1 + Math.floor(Math.random() * 13), SUITS[Math.floor(Math.random() * 4)])));
  check(cards);
}

if (bad.length) { console.log('MISMATCH', bad); process.exit(1); }
console.log('exhaustive ok', { sets: setsChecked, total: checked });
