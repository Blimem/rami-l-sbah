// Bot player. Works only from what a player can see (its own view), one action at a time.
import { validateMeld, isJoker, penaltyValue, setValue, SUITS } from './rules.js';

const key = c => (isJoker(c) ? 'JK' : c.r + c.s);

/** All meld "shapes" that can be built from these cards. */
function specsFor(cards) {
  const have = new Map();
  let jokers = 0;
  for (const c of cards) {
    if (isJoker(c)) { jokers++; continue; }
    have.set(key(c), (have.get(key(c)) || 0) + 1);
  }
  const specs = [];
  const add = (nat, jk, kind) => {
    const sample = nat.map(k => ({ id: k, r: parseInt(k, 10), s: k.slice(-1) }))
      .concat(Array.from({ length: jk }, (_, i) => ({ id: 'J' + i, r: 0, s: 'J' })));
    const m = validateMeld(sample);
    if (m) specs.push({ nat, jk, points: m.points, size: nat.length + jk, clean: m.kind === 'run' && jk === 0 });
  };
  const maxJ = Math.min(jokers, 2);
  // sets
  for (let r = 1; r <= 13; r++) {
    const suits = SUITS.filter(s => have.has(r + s));
    for (let mask = 1; mask < 1 << suits.length; mask++) {
      const pick = suits.filter((_, i) => mask & (1 << i)).map(s => r + s);
      for (let jk = 0; jk <= Math.min(maxJ, 1); jk++) {
        const size = pick.length + jk;
        if (size >= 3 && size <= 4 && jk < pick.length) add(pick, jk);
      }
    }
  }
  // runs
  for (const s of SUITS) {
    const at = p => have.has((p === 14 ? 1 : p) + s);
    for (let lo = 1; lo <= 13; lo++) {
      if (!at(lo)) continue;
      for (let hi = lo + 1; hi <= 14 && hi - lo <= 12; hi++) {
        if (!at(hi) || (lo === 1 && hi === 14)) continue;
        const nat = [];
        for (let p = lo; p <= hi; p++) if (at(p)) nat.push((p === 14 ? 1 : p) + s);
        const gaps = hi - lo + 1 - nat.length;
        const extra = Math.max(0, 3 - (hi - lo + 1));
        const jk = gaps + extra;
        if (jk <= maxJ && jk < nat.length) add(nat, jk);
      }
    }
  }
  return specs;
}

/**
 * Best set of melds from `cards`.
 * goal 'points' (for the opening) or 'cards' (dump as many cards as possible).
 * Keeps at least `keep` cards in hand. `must` = a card id that has to be used.
 */
export function bestMelds(cards, { goal = 'cards', keep = 1, must = null, clean = false } = {}) {
  const specs = specsFor(cards).sort((a, b) => b.points - a.points);
  const counts = new Map();
  let jokers = 0;
  for (const c of cards) {
    if (isJoker(c)) jokers++;
    else counts.set(key(c), (counts.get(key(c)) || 0) + 1);
  }
  const mustCard = must && cards.find(c => c.id === must);
  const mustKey = mustCard ? key(mustCard) : null;
  const limit = cards.length - keep;
  let best = null, nodes = 0;
  const chosen = [];
  const score = (pts, used) => (goal === 'points' ? pts * 100 + used : used * 1000 + pts);
  const usesMust = () => !mustKey || chosen.some(sp => (mustKey === 'JK' ? sp.jk > 0 : sp.nat.includes(mustKey)));

  function dfs(start, pts, used) {
    if (++nodes > 40000) return;
    if (chosen.length && usesMust() && (!clean || chosen.some(sp => sp.clean))) {
      const sc = score(pts, used);
      if (!best || sc > best.score) best = { score: sc, specs: [...chosen], points: pts, used };
    }
    for (let i = start; i < specs.length; i++) {
      const sp = specs[i];
      if (used + sp.size > limit || sp.jk > jokers) continue;
      if (sp.nat.some(k => !counts.get(k))) continue;
      sp.nat.forEach(k => counts.set(k, counts.get(k) - 1));
      jokers -= sp.jk;
      chosen.push(sp);
      dfs(i, pts + sp.points, used + sp.size);
      chosen.pop();
      jokers += sp.jk;
      sp.nat.forEach(k => counts.set(k, counts.get(k) + 1));
    }
  }
  dfs(0, 0, 0);
  if (!best) return { groups: [], points: 0, used: 0 };

  // turn shapes into real card ids (the `must` card first)
  const pool = new Map();
  const jpool = [];
  const ordered = mustCard ? [mustCard, ...cards.filter(c => c !== mustCard)] : cards;
  for (const c of ordered) {
    if (isJoker(c)) jpool.push(c.id);
    else { if (!pool.has(key(c))) pool.set(key(c), []); pool.get(key(c)).push(c.id); }
  }
  const groups = best.specs.map(sp => [...sp.nat.map(k => pool.get(k).shift()), ...Array.from({ length: sp.jk }, () => jpool.shift())]);
  return { groups, points: best.points, used: best.used };
}

function canLayoff(card, meld) {
  return !!validateMeld([...meld.cards, card]);
}

function keepScore(c, hand, view, opened, noise) {
  if (isJoker(c)) return 1e6;
  let s = 0;
  const others = hand.filter(o => o !== c && !isJoker(o));
  const sameRank = new Set(others.filter(o => o.r === c.r && o.s !== c.s).map(o => o.s));
  s += sameRank.size * 3;
  for (const o of others) {
    if (o.s !== c.s) continue;
    const d = Math.min(Math.abs(o.r - c.r), c.r === 1 ? Math.abs(o.r - 14) : 99, o.r === 1 ? Math.abs(14 - c.r) : 99);
    if (d === 1) s += 3;
    else if (d === 2) s += 1.4;
  }
  const v = setValue(c.r);
  s += opened ? -v * 0.15 : v * 0.04;
  if (view.melds.some(m => canLayoff(c, m))) s += 2.5; // don't feed the others
  return s + (Math.random() - 0.5) * noise;
}

/** Next single action for the bot whose view this is. */
export function botAction(view, level = 'pro') {
  const hand = view.hand;
  const opened = view.opened[view.you];
  const noise = level === 'easy' ? 6 : level === 'normal' ? 1.5 : 0.2;
  const top = view.discard[view.discard.length - 1];
  const clean = view.cleanRun !== false;

  if (view.phase === 'decide') {
    // play the hand only if an opening looks reachable
    const jokers = hand.filter(isJoker).length;
    const r = bestMelds(hand, { goal: 'points', clean });
    const cleanPart = bestMelds(hand, { goal: 'points', clean: true }).points > 0;
    const keep = level === 'easy' ? Math.random() < 0.8 : (r.points >= 40 || (cleanPart && jokers >= 1) || jokers >= 2 || view.redeals >= 3);
    return { type: 'decide', play: keep };
  }

  if (view.phase === 'draw') {
    if (top && !isJoker(top) && !(level === 'easy' && Math.random() < 0.5)) {
      if (opened) {
        if (hand.length > 1 && view.melds.some(m => canLayoff(top, m))) return { type: 'draw', from: 'discard' };
        const before = bestMelds(hand).used;
        const after = bestMelds([...hand, top], { must: top.id }).used;
        if (after > before + 1) return { type: 'draw', from: 'discard' };
      } else {
        const r = bestMelds([...hand, top], { goal: 'points', must: top.id, clean });
        if (r.points >= view.openMin) return { type: 'draw', from: 'discard' };
      }
    }
    return { type: 'draw', from: 'stock' };
  }

  if (!opened) {
    const r = bestMelds(hand, { goal: 'points', must: view.mustUse, clean });
    if (r.points >= view.openMin && r.groups.length) return { type: 'meld', groups: r.groups };
    if (view.mustUse && view.canUndo) return { type: 'undoDraw' };
  } else {
    const r = bestMelds(hand, { goal: 'cards', must: view.mustUse });
    if (r.groups.length) return { type: 'meld', groups: r.groups };
    if (hand.length > 1) {
      for (const c of [...hand].sort((a, b) => isJoker(a) - isJoker(b))) {
        if (isJoker(c) && hand.length > 2) continue;
        const m = view.melds.find(mm => canLayoff(c, mm));
        if (m) return { type: 'layoff', cards: [c.id], meld: m.id };
      }
    }
    for (const c of hand) {
      if (isJoker(c)) continue;
      for (const m of view.melds) {
        const j = m.cards.find(x => isJoker(x) && x.as && x.as.r === c.r && x.as.s === c.s);
        if (j && validateMeld(m.cards.map(x => (x === j ? c : x)))) return { type: 'swap', card: c.id, meld: m.id };
      }
    }
    if (view.mustUse && view.canUndo) return { type: 'undoDraw' };
  }
  const choices = hand.filter(c => c.id !== view.taken);
  const pick = choices.map(c => [keepScore(c, hand, view, opened, noise), c]).sort((a, b) => a[0] - b[0])[0][1];
  return { type: 'discard', card: pick.id };
}

/** Safe fallback move when a human's timer runs out. */
export function autoAction(view) {
  if (view.phase === 'decide') return { type: 'decide', play: true };
  if (view.phase === 'draw') return { type: 'draw', from: 'stock' };
  if (view.mustUse && view.canUndo) return { type: 'undoDraw' };
  const choices = view.hand.filter(c => c.id !== view.taken && !isJoker(c));
  const list = choices.length ? choices : view.hand.filter(c => c.id !== view.taken);
  const pick = list.sort((a, b) => penaltyValue(b) - penaltyValue(a))[0];
  return { type: 'discard', card: pick.id };
}
