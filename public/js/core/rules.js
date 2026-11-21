// Rami Tounsi: cards, values and meld validation. Shared by the server, the browser and the bots.

export const SUITS = ['S', 'H', 'D', 'C']; // pique, coeur, carreau, trefle
export const RED = { H: true, D: true };
export const JOKER = 'J';
export const RANK_LABEL = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };

export const DEFAULT_OPTIONS = Object.freeze({
  openMin: 71,       // awel hbouta lazem tfout 71
  handSize: 14,      // 14 carta, elli yebda yekhou 15
  jokers: 4,         // 2 jeux, kol jeu fih 2 jokers
  jokerPenalty: 30,  // joker yo93ed fi yeddek
  closedPenalty: 100, // ma hbattech jemla
  cleanRun: true,     // l'ouverture lazemha suite sans joker
  badOpenPenalty: 50, // ouverture bla suite sans joker
  feedPenalty: 50, returnPenalty: 50,    // rmit el carta elli biha el o5er farrach
  frich: true,        // elli yebda y9oul "nal3bou wala le?"
  acceptPenalty: 50,  // 9al nal3bou w ma 7allech
});

/** A run with no joker (needed for the opening). */
export const isCleanRun = m => !!m && m.kind === 'run' && !m.cards.some(c => c.s === JOKER);

export const isJoker = c => c.s === JOKER;
export const rankLabel = r => RANK_LABEL[r] || String(r);
export const cardKey = c => (isJoker(c) ? 'JK' : c.r + c.s);

export function makeDeck(jokers = 4) {
  const cards = [];
  for (let d = 0; d < 2; d++) {
    for (const s of SUITS) for (let r = 1; r <= 13; r++) cards.push({ id: `${r}${s}${d}`, r, s });
  }
  for (let j = 0; j < jokers; j++) cards.push({ id: `JK${j}`, r: 0, s: JOKER });
  return cards;
}

// Seeded RNG so a round can be replayed and tested.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(arr, rand) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Points of a rank when it is part of a meld. pos 14 = ace high, pos 1 = ace low. */
export function posValue(pos) {
  if (pos === 14) return 11;
  if (pos === 1) return 1;
  return pos >= 10 ? 10 : pos;
}

/** Points of a set rank (ace in a set counts 11). */
export function setValue(r) {
  return r === 1 ? 11 : r >= 10 ? 10 : r;
}

/** Penalty of a card left in hand at the end of a round. */
export function penaltyValue(c, opts = DEFAULT_OPTIONS) {
  if (isJoker(c)) return opts.jokerPenalty;
  return setValue(c.r);
}

function validateSet(cards) {
  const nat = cards.filter(c => !isJoker(c));
  const jk = cards.length - nat.length;
  if (cards.length < 3 || cards.length > 4) return null;
  if (nat.length < 2 || jk >= nat.length) return null;
  const r = nat[0].r;
  if (nat.some(c => c.r !== r)) return null;
  const suits = new Set(nat.map(c => c.s));
  if (suits.size !== nat.length) return null;
  const free = SUITS.filter(s => !suits.has(s));
  const order = [...nat].sort((a, b) => SUITS.indexOf(a.s) - SUITS.indexOf(b.s));
  const placed = order.map(c => ({ ...c }));
  let fi = 0;
  for (const c of cards) if (isJoker(c)) placed.push({ ...c, as: { r, s: free[fi++] } });
  return { kind: 'set', cards: placed, points: setValue(r) * cards.length };
}

function runWithAce(nat, jk, aceHigh) {
  const pos = nat.map(c => (c.r === 1 && aceHigh ? 14 : c.r));
  const seen = new Set(pos);
  if (seen.size !== pos.length) return null;
  let lo = Math.min(...pos), hi = Math.max(...pos);
  if (lo === 1 && hi === 14) return null;
  const gaps = hi - lo + 1 - pos.length;
  if (gaps > jk) return null;
  let extra = jk - gaps;
  // free jokers go on the high side first, then low side
  while (extra > 0 && hi < 14 && !(lo === 1 && hi === 13)) { hi++; extra--; }
  while (extra > 0 && lo > 1 && !(hi === 14 && lo === 2)) { lo--; extra--; }
  if (extra > 0) return null;
  return { lo, hi, pos };
}

function validateRun(cards) {
  const nat = cards.filter(c => !isJoker(c));
  const jokers = cards.filter(isJoker);
  if (cards.length < 3 || nat.length < 2 || jokers.length >= nat.length) return null;
  const s = nat[0].s;
  if (nat.some(c => c.s !== s)) return null;
  let best = null;
  for (const aceHigh of [false, true]) {
    if (aceHigh && !nat.some(c => c.r === 1)) continue;
    const fit = runWithAce(nat, jokers.length, aceHigh);
    if (!fit) continue;
    const placed = [];
    let points = 0, ji = 0;
    for (let p = fit.lo; p <= fit.hi; p++) {
      const i = fit.pos.indexOf(p);
      if (i >= 0) placed.push({ ...nat[i] });
      else placed.push({ ...jokers[ji++], as: { r: p === 14 ? 1 : p, s } });
      points += posValue(p);
    }
    if (!best || points > best.points) best = { kind: 'run', cards: placed, points };
  }
  return best;
}

/** Returns {kind, cards (ordered, jokers carry `as`), points} or null if not a valid meld. */
export function validateMeld(cards) {
  if (!cards || cards.length < 3) return null;
  const clean = cards.map(({ as, ...c }) => c);
  return validateSet(clean) || validateRun(clean);
}

export function describeMeld(m) {
  if (!m) return '';
  const nat = m.cards.find(c => !isJoker(c));
  if (m.kind === 'set') return `Trio ${rankLabel(nat.r)}`;
  const a = m.cards[0], b = m.cards[m.cards.length - 1];
  const lab = c => rankLabel(isJoker(c) ? c.as.r : c.r);
  return `Suite ${lab(a)}→${lab(b)}`;
}

/** Sort helpers for the hand. */
export function sortBySuit(cards) {
  const so = { S: 0, H: 1, C: 2, D: 3, J: 4 };
  return [...cards].sort((a, b) => so[a.s] - so[b.s] || a.r - b.r || a.id.localeCompare(b.id));
}
export function sortByRank(cards) {
  const so = { S: 0, H: 1, C: 2, D: 3, J: 4 };
  return [...cards].sort((a, b) => (isJoker(a) - isJoker(b)) || a.r - b.r || so[a.s] - so[b.s]);
}

/** Why a selection is not a meld (i18n key), or null if it is one. */
export function meldProblem(cards) {
  if (!cards || cards.length < 3) return 'why.min3';
  if (validateMeld(cards)) return null;
  const nat = cards.filter(c => !isJoker(c));
  const jk = cards.length - nat.length;
  if (nat.length < 2 || jk >= nat.length) return 'why.jokers';
  if (nat.every(c => c.r === nat[0].r)) {
    if (cards.length > 4) return 'why.set4';
    return 'why.sameSuit';
  }
  if (nat.every(c => c.s === nat[0].s)) {
    if (new Set(nat.map(c => c.r)).size !== nat.length) return 'why.dupRank';
    return 'why.gap';
  }
  return 'why.mixed';
}
