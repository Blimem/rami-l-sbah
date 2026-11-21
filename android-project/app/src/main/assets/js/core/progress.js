// Player progression: XP, levels, ranks, virtual coins (no real money), daily gift, missions, themes.
// Shared by the server (online accounts) and the browser (offline profile).

export const START_COINS = 1000;

export const RANKS = [
  { id: 'bronze', min: 1, color: '#cd8a52' },
  { id: 'argent', min: 5, color: '#c9d3dc' },
  { id: 'or', min: 10, color: '#f1c76b' },
  { id: 'platine', min: 15, color: '#8fe3d6' },
  { id: 'diamant', min: 20, color: '#9ad0ff' },
];

/** XP needed to reach `level` (level 1 = 0 XP). */
export const xpFor = level => 60 * (level - 1) * level;
export function levelOf(xp) { let l = 1; while (xpFor(l + 1) <= xp) l++; return l; }
export const rankOf = level => [...RANKS].reverse().find(r => level >= r.min);

export const THEMES = {
  felt: [
    { id: 'sidi', level: 1, a: '#0f5a63', b: '#08343b' },
    { id: 'vert', level: 1, a: '#1f7a45', b: '#0b3b1f' },
    { id: 'carthage', level: 1, a: '#8a2a22', b: '#3d1410' },
    { id: 'noir', level: 1, a: '#2a2a31', b: '#08080b' },
    { id: 'bois', level: 1, a: '#8a5a2e', b: '#3b220f' },
    { id: 'sahara', level: 6, a: '#9a6a32', b: '#4e3214' },
    { id: 'jasmin', level: 10, a: '#2f4f8a', b: '#141f3d' },
    { id: 'nuit', level: 15, a: '#4a2a6a', b: '#1d0f2e' },
  ],
  back: [
    { id: 'zellij', level: 1 },
    { id: 'jasmin', level: 2 },
    { id: 'kairouan', level: 5 },
    { id: 'or', level: 8 },
  ],
};

export const MISSIONS = [
  { id: 'play3', goal: 3, stat: 'rounds', coins: 150, xp: 40 },
  { id: 'win1', goal: 1, stat: 'wins', coins: 200, xp: 60 },
  { id: 'win3', goal: 3, stat: 'wins', coins: 450, xp: 120 },
  { id: 'open3', goal: 3, stat: 'opens', coins: 150, xp: 40 },
  { id: 'frich1', goal: 1, stat: 'frich', coins: 500, xp: 150 },
  { id: 'online2', goal: 2, stat: 'online', coins: 200, xp: 60 },
];

export const day = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);

export function newProfile(name = '', avatar = '🃏') {
  return {
    name, avatar, xp: 0, coins: START_COINS,
    stats: { rounds: 0, wins: 0, frich: 0, opens: 0, matches: 0, matchWins: 0, online: 0 },
    gift: { last: '', streak: 0 },
    missions: { day: '', list: [] },
    theme: { felt: 'sidi', back: 'zellij' },
  };
}

function seeded(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 13), 1597334677)) >>> 0) / 4294967296; }

/** Today's 3 missions (same 3 for everyone on a given day). */
export function refreshMissions(p, now = Date.now()) {
  const d = day(now);
  if (p.missions.day === d) return false;
  const r = seeded(d);
  const pool = [...MISSIONS];
  const list = [];
  while (list.length < 3) list.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  p.missions = { day: d, list: list.map(m => ({ id: m.id, progress: 0, claimed: false })) };
  return true;
}

export function giftAvailable(p, now = Date.now()) { return p.gift.last !== day(now); }

export function claimGift(p, now = Date.now()) {
  if (!giftAvailable(p, now)) return 0;
  const yesterday = day(now - 86400000);
  p.gift.streak = p.gift.last === yesterday ? Math.min(7, p.gift.streak + 1) : 1;
  p.gift.last = day(now);
  const coins = 150 + 50 * p.gift.streak;
  p.coins += coins;
  return coins;
}

export function claimMission(p, id) {
  const m = p.missions.list.find(x => x.id === id);
  const def = MISSIONS.find(x => x.id === id);
  if (!m || !def || m.claimed || m.progress < def.goal) return null;
  m.claimed = true;
  p.coins += def.coins;
  p.xp += def.xp;
  return def;
}

/**
 * Apply one finished round to a profile.
 * r: { won, frich, opened, online, matchOver, matchWon }
 * Returns { xp, coins, levelUp } for the UI.
 */
export function applyRound(p, r, now = Date.now()) {
  refreshMissions(p, now);
  const before = levelOf(p.xp);
  let xp = 10, coins = 0;
  p.stats.rounds++;
  if (r.opened) { p.stats.opens++; xp += 5; }
  if (r.won) { p.stats.wins++; xp += 40; coins += r.online ? 60 : 20; }
  if (r.frich) { p.stats.frich++; xp += 30; coins += r.online ? 60 : 20; }
  if (r.online) p.stats.online++;
  if (r.matchOver) { p.stats.matches++; if (r.matchWon) { p.stats.matchWins++; xp += 60; coins += r.online ? 150 : 50; } }
  p.xp += xp;
  p.coins += coins;
  const inc = { rounds: 1, wins: r.won ? 1 : 0, opens: r.opened ? 1 : 0, frich: r.frich ? 1 : 0, online: r.online ? 1 : 0 };
  for (const m of p.missions.list) {
    const def = MISSIONS.find(x => x.id === m.id);
    if (def && !m.claimed) m.progress = Math.min(def.goal, m.progress + (inc[def.stat] || 0));
  }
  return { xp, coins, levelUp: levelOf(p.xp) > before ? levelOf(p.xp) : 0 };
}

export function setTheme(p, kind, id) {
  const item = (THEMES[kind] || []).find(x => x.id === id);
  if (!item || levelOf(p.xp) < item.level) return false;
  p.theme[kind] = id;
  return true;
}

/** What other players may see. */
export function publicCard(p) {
  const level = levelOf(p.xp);
  return { name: p.name, avatar: p.avatar, level, rank: rankOf(level).id, stats: p.stats };
}
