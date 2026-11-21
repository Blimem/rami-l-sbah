// After every redeal / new round, every card shown in the hand must be the card the engine holds.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  p.on('console', m => console.log('PAGE', m.text())); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:8099/?debug');
  await p.evaluate(() => { localStorage.setItem('rami.profile', JSON.stringify({ name: 'T', avatar: '🦁' })); localStorage.setItem('rami.lang', 'tn'); });
  await p.reload(); await p.waitForTimeout(800);
  await p.click('[data-train="3"]');
  await p.waitForTimeout(1500);
  const check = () => p.evaluate(() => {
    const S = window.__S; const bad = [];
    const name = c => (c.s === 'J' ? 'Joker' : ({ 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }[c.r] || c.r) + ({ S: '♠', H: '♥', D: '♦', C: '♣' }[c.s]));
    for (const n of document.querySelectorAll('#hand .card')) {
      const c = S.game.hand.find(x => x.id === n.dataset.id);
      const shown = n.querySelector('img') ? n.querySelector('img').alt : '?';
      if (!c || shown !== name(c)) bad.push(`${n.dataset.id}: shows ${shown}, is ${c ? name(c) : 'none'}`);
    }
    return { n: document.querySelectorAll('#hand .card').length, bad };
  });
  let total = 0;
  for (let k = 0; k < 6; k++) {
    // everybody says "no" -> redeal with fresh ids, same screen
    await p.evaluate(() => {
      const t = window.__S.net.table, r = t.round;
      if (r.phase !== 'decide') return;
      for (let i = 0; i < r.players.length; i++) { const pl = r.players[r.decider]; const id = pl.id || pl; try { t.action(id, { type: 'decide', play: false }); } catch (e) { console.log('act err', id, e.key || e.message); break; } }
    });
    await p.waitForTimeout(900);
    const r = await check();
    total += r.bad.length;
    console.log('redeal', k + 1, await p.evaluate(() => window.__S.net.table.round.redeals + ' ' + window.__S.game.phase + ' ' + window.__S.game.hand.slice(0,3).map(c=>c.id)), 'cards', r.n, 'wrong faces', r.bad.length, r.bad.slice(0, 3).join(' | '));
  }
  await b.close();
  process.exit(total ? 1 : 0);
})();
