// Leaderboard + optional Google cloud save, persisted as small JSON files in DATA_DIR.
// Coins are virtual only (no purchase, no cash-out).
import fs from 'node:fs';
import path from 'node:path';

const DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const GOOGLE_ID = process.env.GOOGLE_CLIENT_ID || '';
fs.mkdirSync(DIR, { recursive: true });

function load(name) {
  try { return JSON.parse(fs.readFileSync(path.join(DIR, name), 'utf8')); } catch { return {}; }
}
const files = { 'board.json': load('board.json'), 'cloud.json': load('cloud.json') };
const dirty = new Set();
function save(name) {
  dirty.add(name);
  if (save.t) return;
  save.t = setTimeout(() => {
    save.t = null;
    for (const n of dirty) {
      const tmp = path.join(DIR, n + '.tmp');
      fs.writeFileSync(tmp, JSON.stringify(files[n]));
      fs.renameSync(tmp, path.join(DIR, n));
    }
    dirty.clear();
  }, 1000);
}

const board = files['board.json'];
const cloud = files['cloud.json'];
const clean = (s, n) => String(s || '').replace(/[<>]/g, '').slice(0, n);
const num = (v, max = 1e9) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));

export const googleClientId = () => GOOGLE_ID;

/** Store a player's public card for the leaderboard. uid is the client's id (or g_<sub> for Google). */
export function submitStats(uid, c) {
  uid = clean(uid, 40);
  if (!/^[\w-]{8,40}$/.test(uid) || !c) return;
  const s = c.stats || {};
  board[uid] = {
    name: clean(c.name, 18) || 'Joueur', avatar: clean(c.avatar, 8) || '🃏',
    xp: num(c.xp), level: num(c.level, 999), rank: clean(c.rank, 12),
    wins: num(s.wins), rounds: num(s.rounds), frich: num(s.frich), at: Date.now(),
  };
  save('board.json');
}

export function leaderboard(uid, limit = 30) {
  const all = Object.entries(board).sort((a, b) => b[1].xp - a[1].xp || b[1].wins - a[1].wins);
  const top = all.slice(0, limit).map(([id, e], i) => ({ ...e, pos: i + 1, you: id === uid }));
  const mine = all.findIndex(([id]) => id === uid);
  return { top, you: mine >= 0 ? { ...all[mine][1], pos: mine + 1 } : null, total: all.length };
}

/** Verify a Google Sign-In ID token with Google's tokeninfo endpoint. */
export async function verifyGoogle(credential) {
  if (!GOOGLE_ID) throw new Error('google disabled');
  const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(String(credential).slice(0, 4096)));
  if (!r.ok) throw new Error('bad token');
  const p = await r.json();
  if (p.aud !== GOOGLE_ID) throw new Error('wrong audience');
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(p.iss)) throw new Error('wrong issuer');
  if (Number(p.exp) * 1000 < Date.now()) throw new Error('expired');
  return { sub: p.sub, name: clean(p.given_name || p.name, 18) };
}

export const cloudGet = sub => cloud[sub] || null;
export function cloudPut(sub, profile) {
  const s = JSON.stringify(profile || null);
  if (s.length > 12000) return;
  cloud[sub] = JSON.parse(s);
  save('cloud.json');
}
