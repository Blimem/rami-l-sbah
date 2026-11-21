import assert from 'node:assert';
import { newProfile, applyRound, levelOf, xpFor, claimGift, giftAvailable, refreshMissions, claimMission, setTheme, publicCard } from '../public/js/core/progress.js';
const p = newProfile('Test', '🦁');
const d0 = Date.parse('2026-11-20T10:00:00Z');
assert.equal(levelOf(0), 1); assert.equal(levelOf(xpFor(3)), 3); assert.equal(levelOf(xpFor(3) - 1), 2);
assert.ok(giftAvailable(p, d0)); assert.equal(claimGift(p, d0), 200); assert.equal(claimGift(p, d0), 0);
assert.equal(claimGift(p, d0 + 86400000), 250); assert.equal(p.gift.streak, 2);
assert.equal(claimGift(p, d0 + 4 * 86400000), 200); // streak broken
refreshMissions(p, d0); assert.equal(p.missions.list.length, 3);
const r = applyRound(p, { won: true, frich: true, opened: true, online: true, matchOver: true, matchWon: true }, d0);
assert.equal(r.xp, 10 + 5 + 40 + 30 + 60); assert.equal(r.coins, 60 + 60 + 150);
assert.equal(p.stats.wins, 1);
const win = p.missions.list.find(m => ['win1', 'frich1'].includes(m.id));
if (win) assert.ok(claimMission(p, win.id)); 
assert.equal(setTheme(p, 'felt', 'nuit'), false); assert.equal(setTheme(p, 'felt', 'sahara'), levelOf(p.xp) >= 6); assert.equal(setTheme(p, 'felt', 'bois'), true);
assert.equal(publicCard(p).name, 'Test');
console.log('progress ok', levelOf(p.xp), p.coins);
