// Rami Tounsi — UI controller.
import { validateMeld, isJoker, sortBySuit, sortByRank, isCleanRun, rankLabel } from '../core/rules.js';
import { cardHTML, el, LOGO } from './cards.js';
import { sfx, buzz, sound } from './sound.js';
import { OnlineNet, LocalNet } from './net.js';
import { t, lang, setLang, LANGS, applyI18n, quickLines, meldName } from './i18n.js';
import { music, TRACKS } from './music.js';
import { voicelines, LINES } from './voicelines.js';
import { VoiceChat } from './voice.js';
import { newProfile, levelOf, rankOf, xpFor, THEMES, MISSIONS, refreshMissions, giftAvailable, claimGift, claimMission, applyRound, setTheme, publicCard } from '../core/progress.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const AVATARS = ['🦁', '🐪', '🦅', '🐬', '🌶️', '🫖', '🌙', '⭐', '🍊', '🌿', '🎩', '😎', '🧔', '👩', '👳', '🧕'];
const SEAT_COLORS = ['#f1c76b', '#ff7a6b', '#6cc4ff', '#4fd1a5'];
const MARZNIK_MS = 30000;

// ---------------- state ----------------
const S = {
  profile: migrateProfile(JSON.parse(localStorage.getItem('rami.profile') || 'null')),
  online: null, net: null, status: 'offline',
  rooms: [], onlineCount: 0,
  table: null, game: null, skew: 0,
  order: [], sel: new Set(), staged: [],
  sortMode: localStorage.getItem('rami.sort') || 'suit',
  roundSeen: 0, resultsShown: '', chat: [], unread: 0, bubbles: {},
  solo: JSON.parse(localStorage.getItem('rami.solo') || '{"bots":3,"level":"normal","rounds":3}'),
  screen: 'home',
  turnKey: '', turnStart: 0, marzFired: '',
  voice: null,
};
function migrateProfile(old) {
  const base = newProfile('', AVATARS[Math.floor(Math.random() * 8)]);
  const p = { ...base, ...(old || {}) };
  p.stats = { ...base.stats, ...(p.stats || {}) };
  p.gift = { ...base.gift, ...(p.gift || {}) };
  p.theme = { ...base.theme, ...(p.theme || {}) };
  if (!p.missions || !Array.isArray(p.missions.list)) p.missions = base.missions;
  if (!p.uid) {
    p.uid = 'p_' + Array.from(crypto.getRandomValues(new Uint8Array(8)), b => b.toString(16).padStart(2, '0')).join('');
  }
  if (refreshMissions(p) || !old || !old.uid) { if (old && old.name) localStorage.setItem('rami.profile', JSON.stringify(p)); }
  return p;
}
const saveProfile = () => localStorage.setItem('rami.profile', JSON.stringify(S.profile));
const isApp = () => location.host === 'app.rami';

function serverUrl() {
  if (window.RAMI_OFFLINE) return null;
  const custom = localStorage.getItem('rami.server') || window.RAMI_SERVER || '';
  if (custom) return custom.replace(/^http/, 'ws').replace(/\/$/, '');
  if (isApp()) return null;
  if (location.protocol === 'http:' || location.protocol === 'https:') return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host;
  return null;
}

// ---------------- helpers ----------------
function toast(text, kind = '') {
  const n = el(`<div class="toast ${kind}">${esc(text)}</div>`);
  $('.toasts').append(n);
  setTimeout(() => { n.style.transition = 'opacity .3s, transform .3s'; n.style.opacity = 0; n.style.transform = 'translateY(-8px)'; }, 2600);
  setTimeout(() => n.remove(), 3000);
}
function banner(text) {
  const b = el(`<div class="banner">${esc(text)}</div>`);
  document.body.append(b);
  setTimeout(() => b.remove(), 1500);
}
function modal(html, { wide = false, onClose } = {}) {
  closeModal();
  const m = el(`<div class="modal"><div class="sheet panel ${wide ? 'wide' : ''}">${html}</div></div>`);
  m.addEventListener('click', e => { if (e.target === m && onClose !== false) { closeModal(); onClose && onClose(); } });
  document.body.append(m);
  return m;
}
function closeModal() { $$('.modal').forEach(m => m.remove()); }
function show(screen) {
  if (S.screen === screen) return;
  S.screen = screen;
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === screen));
}
const seatColor = id => {
  const i = S.table ? S.table.seats.findIndex(s => s.id === id) : 0;
  return SEAT_COLORS[(i < 0 ? 0 : i) % 4];
};
const seatOf = id => (S.table && S.table.seats.find(s => s.id === id)) || { name: '?', avatar: '🃏' };
const me = () => (S.net ? S.net.pid : null);
const avatar = (a, c, extra = '') => `<div class="avatar ${extra}" style="--c:${c}">${esc(a)}</div>`;
const now = () => Date.now() + S.skew;
const levelName = l => t('level.' + l);

// ---------------- boot ----------------
async function boot() {
  document.body.insertAdjacentHTML('afterbegin', '<div class="backdrop"></div><div class="toasts"></div>');
  $$('[data-logo]').forEach(n => { n.innerHTML = LOGO; });
  applyI18n();
  bindHome();
  bindGame();
  applyTheme();
  renderProfileChip();
  renderSolo();
  renderHeroFan();
  connectOnline();
  if (!S.profile.name) setTimeout(() => editProfile(true), 400);
  else if (giftAvailable(S.profile)) setTimeout(() => toast(t('pro.giftReady')), 1200);
  setInterval(tick, 250);
  window.addEventListener('resize', () => S.screen === 'game' && layoutHand());
  document.addEventListener('visibilitychange', () => music.pauseForBackground(document.hidden));
  window.handleBack = () => {
    if ($('.modal')) { closeModal(); return true; }
    if ($('.drawer.open')) { $('.drawer').classList.remove('open'); return true; }
    if (S.screen === 'game' || S.screen === 'wait') { confirmLeave(); return true; }
    return false;
  };
  const code = new URLSearchParams(location.search).get('t');
  if (code) S.pendingJoin = code.toUpperCase();
  await Promise.all([music.load(), voicelines.load()]);
  music.armAutostart();
}

function connectOnline() {
  const url = serverUrl();
  if (S.online) S.online.close();
  S.online = null;
  if (!url) { setStatus('none'); return; }
  S.online = new OnlineNet(url, S.profile, m => onMessage(m, 'online'), setStatus);
}

function setStatus(st) {
  const changed = S.status !== st;
  S.status = st;
  paintStatus();
  if (changed && st === 'online') {
    S.online.send('lobby');
    if (S.pendingJoin) { S.online.send('join', { id: S.pendingJoin }); S.pendingJoin = null; }
  }
}

function paintStatus() {
  const st = S.status;
  const cls = st === 'online' ? 'live' : 'off';
  const txt = st === 'online' ? t('st.online', { n: S.onlineCount || 1 }) : t('st.' + st);
  $$('[data-status]').forEach(n => { n.className = 'chip ' + cls; n.textContent = txt; });
  renderRooms();
  if (S.net && S.net.kind === 'online' && S.screen !== 'home') {
    const c = $('.conn');
    if (st !== 'online' && !c) document.body.append(el(`<div class="conn chip off">${t('st.reconnecting')}</div>`));
    if (st === 'online' && c) c.remove();
  }
}

// ---------------- messages ----------------
function onMessage(m, from) {
  if (from === 'online' && S.net && S.net.kind === 'local' && !['lobby', 'welcome', 'error', 'board', 'google'].includes(m.type)) return;
  switch (m.type) {
    case 'lobby':
      S.rooms = m.rooms; S.onlineCount = m.online;
      paintStatus();
      break;
    case 'table':
      if (from === 'online') S.net = S.online;
      onTable(m);
      break;
    case 'chat': onChat(m); break;
    case 'error': toast(t(m.key || 'e.server', m.params), 'err'); sfx('error'); buzz(40); if (S.screen === 'game') renderGame(); break;
    case 'toast': toast(m.key ? t(m.key, m.params) : m.text); break;
    case 'kicked': toast(t('t.kicked'), 'err'); goHome(); break;
    case 'left': goHome(); break;
    case 'replaced': toast(t('t.replaced'), 'err'); break;
    case 'rtc': S.voice && S.voice.signal(m.from, m.data); break;
    case 'welcome': onWelcome(m); break;
    case 'board': renderBoard(m); break;
    case 'google': onGoogle(m); break;
    default: break;
  }
}

function goHome() {
  if (S.net && S.net.kind === 'local') S.net.close();
  if (S.voice) { S.voice.stop(); S.voice = null; }
  S.net = null; S.table = null; S.game = null; S.chat = []; S.staged = []; S.sel.clear(); S.resultsShown = '';
  closeModal();
  $('.conn')?.remove();
  $('.drawer')?.classList.remove('open');
  show('home');
  if (S.online && S.status === 'online') S.online.send('lobby');
  history.replaceState(null, '', location.pathname);
}

function onTable(m) {
  const prev = S.game;
  S.table = m.table;
  S.game = m.game;
  S.skew = m.table.now - Date.now();
  if (S.voice) S.voice.sync(m.table.voice || []);
  const st = m.table.state;
  if (st === 'waiting') {
    closeModal();
    show('wait');
    renderWait();
    if (S.net.kind === 'online') history.replaceState(null, '', '?t=' + m.table.id);
    return;
  }
  if (!S.game) return;
  const newRound = S.roundSeen !== m.table.roundNo;
  const redeal = m.event && m.event.type === 'redeal';
  if (newRound || redeal) {
    S.roundSeen = m.table.roundNo;
    S.order = []; S.sel.clear(); S.staged = [];
    if (newRound) closeModal();
  }
  // who is playing, and since when (for "imchi marznik")
  const key = `${m.table.roundNo}:${S.game.turnNo}:${S.game.redeals}:${S.game.turn}`;
  if (key !== S.turnKey) { S.turnKey = key; S.turnStart = Date.now(); }
  announceOut(m.table);
  const before = handRects();
  show('game');
  syncHand();
  renderGame();
  animateEvent(m.event, prev, before, newRound || redeal);
  if ((st === 'roundEnd' || st === 'matchEnd') && S.game.over) {
    const rk = m.table.roundNo + st;
    const offer = !!seatOf(me()).offer;
    if (S.resultsShown !== rk) { S.resultsShown = rk; S.offerShown = offer; recordRound(st); setTimeout(() => showResults(), 900); }
    else if (S.offerShown !== offer) { S.offerShown = offer; showResults(); }
    else updateResultsReady();
  }
}

// ---------------- home ----------------
function bindHome() {
  $$('[data-train]').forEach(b => { b.onclick = () => { S.solo.bots = +b.dataset.train; localStorage.setItem('rami.solo', JSON.stringify(S.solo)); startSolo(); }; });
  $('#btn-quick').onclick = quickPlay;
  $('#btn-create').onclick = () => createTableDialog();
  $$('[data-rules]').forEach(b => { b.onclick = showRules; });
  $$('[data-settings]').forEach(b => { b.onclick = () => settingsDialog(); });
  $('#profile-chip').onclick = () => S.profile.name ? profileDialog() : editProfile(false);
  $('#join-form').onsubmit = e => {
    e.preventDefault();
    const code = $('#join-code').value.trim().toUpperCase();
    if (code.length < 4) return toast(t('t.codeShort'), 'err');
    if (!requireOnline()) return;
    S.online.send('join', { id: code });
  };
  $('#rooms').onclick = e => {
    const b = e.target.closest('[data-join]');
    if (b && requireOnline()) S.online.send('join', { id: b.dataset.join });
  };
}

function requireOnline() {
  if (!S.online) { settingsDialog('server'); toast(t('t.needServer'), 'err'); return false; }
  if (S.status !== 'online') { toast(t('t.connecting'), 'err'); return false; }
  if (!S.profile.name) { editProfile(true); return false; }
  return true;
}

function renderProfileChip() {
  const p = S.profile, lv = levelOf(p.xp);
  const dot = giftAvailable(p) || claimableMissions() ? '<i class="dot"></i>' : '';
  $('#profile-chip').innerHTML = `${avatar(p.avatar, rankOf(lv).color, 'framed')}<span class="pc-txt"><b>${esc(p.name || t('profile'))}</b><small>${t('pro.lv', { n: lv })} · ${fmt(p.coins)} 🪙</small></span>${dot}`;
}

function renderHeroFan() {
  const cards = [{ r: 1, s: 'S' }, { r: 7, s: 'H' }, { r: 0, s: 'J' }, { r: 13, s: 'D' }, { r: 12, s: 'C' }];
  $('#fan').innerHTML = cards.map((c, i) => {
    const a = (i - 2) * 13;
    return cardHTML({ ...c, id: 'f' + i }, '').replace('class="card', `style="transform: translate(-50%,-50%) rotate(${a}deg) translateY(${Math.abs(i - 2) * 8}px); animation-delay:${i * -1.1}s" class="card`);
  }).join('');
}

function renderRooms() {
  const box = $('#rooms');
  if (!box) return;
  if (S.status === 'none') {
    box.innerHTML = `<div class="empty"><div class="big">🛰️</div><b>${t('rooms.noServer')}</b><span>${t('rooms.noServerHint')}</span><button class="btn sm" id="cfg-srv">${t('settings')}</button></div>`;
    $('#cfg-srv').onclick = () => settingsDialog('server');
    return;
  }
  if (S.status !== 'online') { box.innerHTML = `<div class="empty"><div class="big">⏳</div>${t('t.connecting')}</div>`; return; }
  if (!S.rooms.length) {
    box.innerHTML = `<div class="empty"><div class="big">🃏</div><b>${t('rooms.empty')}</b><span>${t('rooms.emptyHint')}</span></div>`;
    return;
  }
  box.innerHTML = S.rooms.map(r => {
    const seats = Array.from({ length: r.maxPlayers }, (_, i) => r.seats[i] ? `<i class="full" title="${esc(r.seats[i].name)}">${esc(r.seats[i].avatar)}</i>` : '<i></i>').join('');
    const playing = r.state !== 'waiting';
    const full = r.players >= r.maxPlayers && !playing;
    return `<div class="room">
      <div class="room-icon">${playing ? '🎴' : '🪑'}</div>
      <div><div class="name">${esc(r.name)}</div><div class="meta">${playing ? t('rooms.playing') : t('rooms.waiting')} · ${r.limit ? t('rooms.limit', { n: r.limit }) : t('rooms.rounds', { n: r.rounds })} · ${t('rooms.open', { n: r.openMin || 71 })} · ${r.turnTime ? r.turnTime + 's' : '∞'} · <span class="code">${r.id}</span></div></div>
      <div class="seats">${seats}</div>
      <button class="btn sm ${playing || full ? '' : 'gold'}" data-join="${r.id}" ${full || playing ? 'disabled' : ''}>${playing ? t('rooms.inGame') : full ? t('rooms.full') : t('rooms.join')}</button>
    </div>`;
  }).join('');
}

function segHTML(name, opts, val) {
  return `<div class="seg" data-seg="${name}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${String(v) === String(val) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
}
function bindSegs(root, onChange) {
  $$('[data-seg]', root).forEach(seg => seg.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    $$('button', seg).forEach(x => x.classList.toggle('on', x === b));
    sfx('tap');
    onChange(seg.dataset.seg, isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v);
  }));
}
const levelOpts = () => [['easy', levelName('easy')], ['normal', levelName('normal')], ['pro', levelName('pro')]];

// ---- match setup: players, end of match (score limit or rounds), opening points ----
const LIMITS = [300, 500, 1000, 1500], OPENS = [51, 71, 81, 101];
function matchRowsHTML(o, playersKey, noPlayers = false) {
  const byScore = o.limit > 0;
  const lim = byScore ? o.limit : 500;
  return `
    ${noPlayers ? '' : `<div class="row between"><span>${t('players')}</span>${segHTML(playersKey, [[2, '2'], [3, '3'], [4, '4']], o.players)}</div>`}
    <div class="row between"><span>${t('create.mode')}</span>${segHTML('mode', [['score', t('mode.score')], ['rounds', t('mode.rounds')]], byScore ? 'score' : 'rounds')}</div>
    <div class="row between mrow" data-show="score" ${byScore ? '' : 'hidden'}><span>${t('create.limit')}</span>
      <div class="numbox"><input class="input num" type="number" inputmode="numeric" min="100" max="10000" step="50" data-num="limit" value="${lim}">
      <div class="quick">${LIMITS.map(v => `<button type="button" data-set="limit" data-v="${v}" class="${v === lim ? 'on' : ''}">${v}</button>`).join('')}</div></div></div>
    <div class="row between mrow" data-show="rounds" ${byScore ? 'hidden' : ''}><span>${t('rounds')}</span>${segHTML('rounds', [[1, '1'], [3, '3'], [5, '5'], [7, '7']], o.rounds)}</div>
    <div class="row between"><span>${t('create.openMin')}</span>
      <div class="numbox"><input class="input num" type="number" inputmode="numeric" min="21" max="201" step="1" data-num="openMin" value="${o.openMin}">
      <div class="quick">${OPENS.map(v => `<button type="button" data-set="openMin" data-v="${v}" class="${v === o.openMin ? 'on' : ''}">${v}</button>`).join('')}</div></div></div>
    <p class="muted small mhint">${byScore ? t('create.limitHint', { n: lim }) : t('create.roundsHint')}</p>`;
}
/** Wires the number inputs, quick buttons and mode toggle. onChange(key, value): limit (0 = by rounds), openMin, rounds, players… */
function bindMatchRows(root, onChange) {
  const setNum = (k, v) => {
    const inp = $(`[data-num="${k}"]`, root);
    const n = k === 'limit' ? Math.min(10000, Math.max(100, Math.round(+v || 500))) : Math.min(201, Math.max(21, Math.round(+v || 71)));
    inp.value = n;
    $$(`[data-set="${k}"]`, root).forEach(b => b.classList.toggle('on', +b.dataset.v === n));
    if (k === 'limit') $('.mhint', root).textContent = t('create.limitHint', { n });
    onChange(k, n);
  };
  $$('[data-num]', root).forEach(inp => inp.addEventListener('change', () => setNum(inp.dataset.num, inp.value)));
  $$('[data-set]', root).forEach(b => { b.onclick = () => { sfx('tap'); setNum(b.dataset.set, b.dataset.v); }; });
  bindSegs(root, (k, v) => {
    if (k === 'mode') {
      $$('.mrow', root).forEach(r => { r.hidden = r.dataset.show !== v; });
      const lim = +$('[data-num="limit"]', root).value || 500;
      $('.mhint', root).textContent = v === 'score' ? t('create.limitHint', { n: lim }) : t('create.roundsHint');
      onChange('limit', v === 'score' ? lim : 0);
    } else onChange(k, v);
  });
}
function rebuyHTML() {
  const s = seatOf(me());
  if (!s.offer) return '';
  const others = S.table.seats.filter(x => !x.out && x.id !== s.id);
  const n = others.length ? Math.max(...others.map(x => x.score)) : 0;
  return `<div class="rebuy"><div class="big">🔁</div><div class="grow"><b>${t('rebuy.ask')}</b><div class="muted small">${t('rebuy.hint', { n, limit: S.table.limit })}</div></div>
    <div class="row"><button class="btn ghost" id="rb-no">${t('rebuy.no')}</button><button class="btn gold" id="rb-yes">${t('rebuy.yes')}</button></div></div>`;
}
function bindRebuy() {
  $('#rb-yes') && ($('#rb-yes').onclick = () => { sfx('tap'); S.net.send('rebuy', { yes: true }); });
  $('#rb-no') && ($('#rb-no').onclick = () => { sfx('tap'); S.net.send('rebuy', { yes: false }); });
}

function announceOut(tb) {
  if (!tb.limit) { S.outSeen = new Set(); return; }
  if (!S.outSeen || !tb.seats.some(s => s.out)) S.outSeen = new Set();
  for (const s of tb.seats) {
    if (!s.out || S.outSeen.has(s.id)) continue;
    S.outSeen.add(s.id);
    if (s.id === me()) setTimeout(() => banner(t('out.banner')), 1200);
    else toast(t('t.out', { name: s.name, n: tb.limit }));
  }
}
const matchLabel = tb => (tb.limit ? t('round.limit', { n: tb.roundNo, limit: tb.limit }) : t('round.of', { n: tb.roundNo, total: tb.rounds }));

function renderSolo() {
  const box = $('#solo-form');
  const so = S.solo;
  if (so.limit === undefined) so.limit = 500;
  if (!so.openMin) so.openMin = 71;
  box.innerHTML = matchRowsHTML({ players: so.bots + 1, limit: so.limit, rounds: so.rounds, openMin: so.openMin }, 'players', true);
  const lv = $('#train-level');
  if (lv) {
    lv.innerHTML = segHTML('level', [['easy', '🙂 ' + levelName('easy')], ['normal', '😏 ' + levelName('normal')], ['pro', '🔥 ' + levelName('pro')]], so.level);
    bindSegs(lv, (k, v) => { so.level = v; localStorage.setItem('rami.solo', JSON.stringify(so)); });
  }
  bindMatchRows(box, (k, v) => {
    if (k === 'players') so.bots = v - 1; else so[k] = v;
    localStorage.setItem('rami.solo', JSON.stringify(so));
  });
}

function startSolo() {
  if (!S.profile.name) return editProfile(true, startSolo);
  sfx('tap');
  if (S.net && S.net.kind === 'local') S.net.close();
  S.roundSeen = 0; S.resultsShown = ''; S.chat = [];
  S.net = new LocalNet(S.profile, S.solo, m => onMessage(m, 'local'));
}

/** Online quick play: join an open public table, or open one with the usual settings. */
function quickPlay() {
  if (!requireOnline()) return;
  const open = S.rooms.find(r => r.state === 'waiting' && r.players < r.maxPlayers);
  if (open) { S.online.send('join', { id: open.id }); return; }
  S.online.send('create', { name: t('create.defaultName', { name: S.profile.name }), maxPlayers: 4, limit: 500, openMin: 71, turnTime: 40, isPublic: true });
}

function createTableDialog() {
  if (!requireOnline()) return;
  const o = { maxPlayers: 4, rounds: 3, limit: 500, openMin: 71, turnTime: 40, isPublic: true };
  const m = modal(`
    <div class="eyebrow">Online</div><h3>${t('create.title')}</h3><p class="muted">${t('create.hint')}</p>
    <form class="settings" id="ct">
      <div class="field"><label>${t('create.name')}</label><input class="input" name="name" maxlength="28" value="${esc(t('create.defaultName', { name: S.profile.name }))}"></div>
      ${matchRowsHTML({ players: 4, limit: 500, rounds: 3, openMin: 71 }, 'maxPlayers')}
      <div class="row between"><span>${t('turnTime')}</span>${segHTML('turnTime', [[20, '20s'], [40, '40s'], [60, '60s'], [0, '∞']], 40)}</div>
      <div class="row"><span>${t('visibility')}</span>${segHTML('isPublic', [['1', t('public')], ['0', t('private')]], '1')}</div>
      <div class="row" style="justify-content:flex-end;margin-top:6px"><button type="button" class="btn ghost" id="ct-x">${t('cancel')}</button><button class="btn gold">${t('create.go')}</button></div>
    </form>`);
  bindSegs(m, (k, v) => { o[k] = k === 'isPublic' ? String(v) === '1' : v; });
  $('#ct-x', m).onclick = closeModal;
  $('#ct', m).onsubmit = e => {
    e.preventDefault();
    S.online.send('create', { ...o, name: e.target.name.value });
    closeModal();
  };
}

function editProfile(first, then) {
  let pick = S.profile.avatar;
  const m = modal(`
    <div class="eyebrow">${first ? t('profile.welcome') : t('profile')}</div><h3>${first ? t('profile.ask') : t('profile.edit')}</h3>
    <p class="muted">${t('profile.hint')}</p>
    <form class="settings" id="pf">
      <input class="input" name="name" maxlength="18" placeholder="${t('profile.name')}" value="${esc(S.profile.name)}" required autocomplete="nickname">
      <div class="avatars">${AVATARS.map(a => `<button type="button" class="${a === pick ? 'on' : ''}" data-a="${a}">${a}</button>`).join('')}</div>
      ${first ? `<div class="row between"><span>🌐</span>${langSeg()}</div>` : ''}
      <div class="row" style="justify-content:flex-end"><button class="btn gold">${t('save')}</button></div>
    </form>`, { onClose: first ? false : undefined });
  $('.avatars', m).onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    pick = b.dataset.a; $$('.avatars button', m).forEach(x => x.classList.toggle('on', x === b)); sfx('tap');
  };
  bindSegs(m, (k, v) => { if (k === 'lang') { const name = $('input', m).value; changeLang(v); editProfile(first, then); $('.modal input').value = name; } });
  setTimeout(() => $('input', m).focus(), 50);
  $('#pf', m).onsubmit = e => {
    e.preventDefault();
    const name = e.target.name.value.trim().slice(0, 18);
    if (!name) return;
    S.profile.name = name; S.profile.avatar = pick;
    saveProfile();
    sendStats();
    renderProfileChip();
    if (S.online) { S.online.profile = S.profile; if (S.status === 'online') S.online.send('profile', S.profile); }
    closeModal();
    then && then();
  };
}

const langSeg = () => segHTML('lang', LANGS.map(l => [l.id, l.name]), lang());

function changeLang(l) {
  setLang(l);
  applyI18n();
  renderProfileChip(); renderSolo(); paintStatus();
  if (S.screen === 'wait') renderWait();
  if (S.screen === 'game') renderGame();
}

// ---------------- settings ----------------
function settingsDialog(focus) {
  const cur = localStorage.getItem('rami.server') || window.RAMI_SERVER || '';
  const tracks = [...TRACKS.map(x => ({ id: x.id, name: x.name, own: false })), ...music.userTracks.map(u => ({ id: u.id, name: u.name, own: true }))];
  const lineRows = Object.keys(LINES).map(k => `
    <div class="line-row"><div><b>${esc(t('line.' + k))}</b><div class="muted small">${t('line.' + k + '.when')} · ${voicelines.hasRecording(k) ? t('lines.mine') : t('lines.tts')}</div></div>
      <div class="row"><button type="button" class="btn sm icon" data-line-play="${k}" title="${t('lines.test')}">▶</button>
      <button type="button" class="btn sm" data-line-rec="${k}">🎙️ ${t('lines.record')}</button>
      ${voicelines.hasRecording(k) ? `<button type="button" class="btn sm ghost" data-line-reset="${k}" title="${t('lines.reset')}">↺</button>` : ''}</div></div>`).join('');
  const m = modal(`
    <div class="eyebrow">${t('settings')}</div><h3>${t('settings.title')}</h3>
    <div class="settings set-sections">
      <section><h4>🌐 ${t('set.lang')}</h4>${langSeg()}</section>
      <section><h4>🎨 ${t('set.felt')}</h4><div class="felt-pick">${THEMES.felt.map(f => `<button type="button" data-felt-pick="${f.id}" title="${esc(t('felt.' + f.id))}${levelOf(S.profile.xp) < f.level ? ' · ' + t('pro.locked', { n: f.level }) : ''}" class="${S.profile.theme.felt === f.id ? 'on' : ''}" style="background:radial-gradient(ellipse at center, ${f.a}, ${f.b} 85%)" ${levelOf(S.profile.xp) < f.level ? 'disabled' : ''}></button>`).join('')}</div></section>
      <section><h4>🎵 ${t('set.music')}</h4>
        <div class="row between"><span>${t('set.musicOn')}</span><button type="button" class="switch ${music.on ? 'on' : ''}" data-music-on></button></div>
        <div class="row between"><span>${t('set.volume')}</span><input type="range" min="0" max="1" step="0.05" value="${music.volume}" data-music-vol class="range"></div>
        <div class="tracks">${tracks.map(x => `<div class="track ${music.track === x.id ? 'on' : ''}" data-track="${x.id}"><span>${x.own ? '📁' : '🥁'} ${esc(x.name)}</span>${x.own ? `<button type="button" class="btn sm icon ghost" data-track-del="${x.id}">✕</button>` : ''}</div>`).join('')}</div>
        <label class="btn sm" style="cursor:pointer">＋ ${t('set.addMusic')}<input type="file" accept="audio/*" multiple hidden data-music-file></label>
        <div class="muted small">${t('set.musicHint')}</div>
      </section>
      <section><h4>🔊 ${t('set.sfx')}</h4>
        <div class="row between"><span>${t('set.sfxOn')}</span><button type="button" class="switch ${sound.on ? 'on' : ''}" data-sfx-on></button></div>
        <div class="row between"><span>${t('set.linesOn')}</span><button type="button" class="switch ${voicelines.on ? 'on' : ''}" data-lines-on></button></div>
        ${lineRows}
      </section>
      <section id="sec-server"><h4>🛰️ ${t('set.server')}</h4>
        <p class="muted small">${t('set.serverHint')}</p>
        <form class="row" id="sf"><input class="input" name="url" placeholder="https://…" value="${esc(cur)}" style="flex:1"><button class="btn gold">${t('save')}</button></form>
      </section>
    </div>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>${t('close')}</button></div>`, { wide: true });
  const reopen = () => { const sc = $('.modal .sheet').scrollTop; settingsDialog(); $('.modal .sheet').scrollTop = sc; };
  bindSegs(m, (k, v) => { if (k === 'lang') { changeLang(v); reopen(); } });
  $('[data-close]', m).onclick = closeModal;
  $$('[data-felt-pick]', m).forEach(btn => { btn.onclick = () => {
    if (!setTheme(S.profile, 'felt', btn.dataset.feltPick)) return;
    saveProfile(); applyTheme(); sfx('tap');
    $$('[data-felt-pick]', m).forEach(x => x.classList.toggle('on', x === btn));
  }; });
  $('[data-music-on]', m).onclick = e => { music.setOn(!music.on); e.currentTarget.classList.toggle('on', music.on); };
  $('[data-music-vol]', m).oninput = e => music.setVolume(+e.target.value);
  $('.tracks', m).onclick = async e => {
    const del = e.target.closest('[data-track-del]');
    if (del) { await music.remove(del.dataset.trackDel); reopen(); return; }
    const tr = e.target.closest('[data-track]');
    if (tr) { music.pick(tr.dataset.track); $$('.track', m).forEach(x => x.classList.toggle('on', x === tr)); $('[data-music-on]', m).classList.add('on'); }
  };
  $('[data-music-file]', m).onchange = async e => {
    const n = music.userTracks.length;
    await music.addFiles([...e.target.files]);
    if (music.userTracks.length > n) { music.pick(music.userTracks[music.userTracks.length - 1].id); toast(t('t.musicAdded'), 'ok'); }
    reopen();
  };
  $('[data-sfx-on]', m).onclick = e => { sound.toggle(); e.currentTarget.classList.toggle('on', sound.on); paintSoundButtons(); };
  $('[data-lines-on]', m).onclick = e => { voicelines.setOn(!voicelines.on); e.currentTarget.classList.toggle('on', voicelines.on); };
  $$('[data-line-play]', m).forEach(b => { b.onclick = () => voicelines.play(b.dataset.linePlay, true); });
  $$('[data-line-reset]', m).forEach(b => { b.onclick = async () => { await voicelines.reset(b.dataset.lineReset); reopen(); }; });
  $$('[data-line-rec]', m).forEach(b => {
    b.onclick = async () => {
      if (b.dataset.state === 'rec') { voicelines.stopRecording(); return; }
      try {
        await voicelines.record(b.dataset.lineRec, st => {
          b.dataset.state = st;
          b.innerHTML = st === 'rec' ? `⏺ ${t('lines.stop')}` : '✓';
          b.classList.toggle('danger', st === 'rec');
        });
        toast(t('t.recorded'), 'ok');
        reopen();
      } catch { toast(t('t.noMic'), 'err'); }
    };
  });
  $('#sf', m).onsubmit = e => {
    e.preventDefault();
    const v = e.target.url.value.trim();
    if (v) localStorage.setItem('rami.server', v); else localStorage.removeItem('rami.server');
    toast(t('saved'), 'ok');
    connectOnline();
  };
  if (focus === 'server') setTimeout(() => $('#sec-server', m)?.scrollIntoView({ block: 'center' }), 50);
}

function paintSoundButtons() { $$('[data-sound]').forEach(x => { x.innerHTML = sound.on ? '🔊' : '🔇'; }); }

function showRules() {
  modal(`<div class="eyebrow">${t('rules.eyebrow')}</div><h3>Rami Tounsi</h3><div class="rules">${t('rules.html')}</div>
  <div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn gold" data-close>${t('rules.ok')}</button></div>`, { wide: true });
  $('.modal [data-close]').onclick = closeModal;
}

// ---------------- waiting room ----------------
function renderWait() {
  const tb = S.table;
  const isHost = tb.host === me();
  const seats = Array.from({ length: tb.maxPlayers }, (_, i) => {
    const s = tb.seats[i];
    if (!s) return `<div class="seat empty"><div class="avatar" style="--c:rgba(255,255,255,.15)">·</div><div>${t('wait.free')}</div>${isHost ? `<button class="btn sm" data-addbot>＋ ${t('wait.bot')}</button>` : `<span class="tag">${t('wait.waiting')}</span>`}</div>`;
    return `<div class="seat">${tb.host === s.id ? '<span class="crown" title="Host">👑</span>' : ''}${isHost && s.id !== me() ? `<button class="btn icon sm x" data-kick="${s.id}" title="${t('wait.kick')}">✕</button>` : ''}
      ${avatar(s.avatar, SEAT_COLORS[i])}<div class="nm">${esc(s.name)}${s.id === me() ? ` (${t('you')})` : ''}${(tb.voice || []).includes(s.id) ? ' 🎙️' : ''}</div><div class="tag">${s.bot ? t('wait.bot') + ' · ' + levelName(tb.botLevel) : s.connected ? t('wait.ready') : t('wait.offline')}</div></div>`;
  }).join('');
  $('#wait-main').innerHTML = `
    <div class="row between">
      <div><div class="eyebrow">${tb.isPublic ? t('wait.public') : t('wait.private')}</div><h2 style="margin:6px 0 0;font-size:28px;letter-spacing:-.02em">${esc(tb.name)}</h2></div>
      <button class="btn ghost danger" id="w-leave">${t('leave')}</button>
    </div>
    <div class="codebox panel" style="padding:16px 18px;background:rgba(0,0,0,.2)">
      <div><div class="muted" style="font-size:13px">${t('wait.code')}</div><div class="code">${tb.id}</div></div>
      <div class="spacer"></div>
      <button class="btn" id="w-copy">📋 ${t('wait.copy')}</button>
      ${navigator.share ? `<button class="btn blue" id="w-share">${t('wait.share')}</button>` : ''}
    </div>
    <div class="seats-grid">${seats}</div>
    <div class="settings">
      ${matchRowsHTML({ players: tb.maxPlayers, limit: tb.limit, rounds: tb.rounds, openMin: tb.openMin }, 'maxPlayers')}
      <div class="row"><span>${t('turnTime')}</span>${segHTML('turnTime', [[20, '20s'], [40, '40s'], [60, '60s'], [0, '∞']], tb.turnTime)}</div>
      <div class="row"><span>${t('botLevel')}</span>${segHTML('botLevel', levelOpts(), tb.botLevel)}</div>
    </div>
    <div class="row" style="justify-content:flex-end">
      ${voiceButtonHTML('btn')}
      ${isHost ? `<button class="btn gold lg" id="w-start" ${tb.seats.length < 2 ? 'disabled' : ''}>${t('wait.start')} ▸</button>` : `<span class="muted">${t('wait.hostStarts')}</span>`}
    </div>`;
  const w = $('#wait-main');
  if (!isHost) {
    $$('[data-seg], .numbox', w).forEach(n => n.setAttribute('disabled', ''));
    $$('.numbox input', w).forEach(i => { i.disabled = true; });
  }
  bindMatchRows(w, (k, v) => S.net.send('config', { [k]: v }));
  $$('[data-addbot]', w).forEach(b => { b.onclick = () => S.net.send('addBot'); });
  $$('[data-kick]', w).forEach(b => { b.onclick = () => S.net.send('kick', { seat: b.dataset.kick }); });
  $('#w-leave').onclick = confirmLeave;
  $('#w-start') && ($('#w-start').onclick = () => S.net.send('start'));
  bindVoiceButtons(w);
  const link = inviteLink();
  $('#w-copy').onclick = () => { navigator.clipboard?.writeText(link).then(() => toast(t('t.copied'), 'ok'), () => toast(link)); };
  $('#w-share') && ($('#w-share').onclick = () => navigator.share({ title: 'Rami Tounsi', text: t('wait.shareText', { code: tb.id }), url: link }).catch(() => {}));
  renderChat();
}

function inviteLink() {
  const base = location.protocol.startsWith('http') && !isApp() ? location.origin + location.pathname : (localStorage.getItem('rami.server') || window.RAMI_SERVER || '');
  return `${base.replace(/\/$/, '')}/?t=${S.table.id}`;
}

function confirmLeave() {
  const playing = S.table && S.table.state === 'playing';
  const m = modal(`<h3>${t('leave.q')}</h3><p class="muted">${playing && S.net.kind === 'online' ? t('leave.botTakes') : t('leave.lost')}</p>
    <div class="row" style="justify-content:flex-end"><button class="btn ghost" id="l-no">${t('leave.no')}</button><button class="btn gold" id="l-yes">${t('leave.yes')}</button></div>`);
  $('#l-no', m).onclick = closeModal;
  $('#l-yes', m).onclick = () => {
    closeModal();
    if (S.net && S.net.kind === 'online') S.net.send('leave');
    goHome();
  };
}

// ---------------- voice chat ----------------
function voiceButtonHTML(cls) {
  if (!S.net || S.net.kind !== 'online') return '';
  const on = S.voice && S.voice.active;
  return `<button class="${cls} ${on ? 'gold' : ''}" data-voice title="${t('voice.title')}">${on ? '🎙️ ' + t('voice.leave') : '🎙️ ' + t('voice.join')}</button>${on ? `<button class="${cls} ${S.voice.muted ? 'danger' : ''}" data-mute>${S.voice.muted ? '🔇 ' + t('voice.unmute') : '🔈 ' + t('voice.mute')}</button>` : ''}`;
}
function bindVoiceButtons(root) {
  $$('[data-voice]', root).forEach(b => { b.onclick = toggleVoice; });
  $$('[data-mute]', root).forEach(b => { b.onclick = () => S.voice && S.voice.setMuted(!S.voice.muted); });
}
async function toggleVoice() {
  if (S.voice && S.voice.active) { S.voice.stop(); S.voice = null; refreshVoiceUI(); return; }
  if (!navigator.mediaDevices || !window.RTCPeerConnection) { toast(t('voice.unsupported'), 'err'); return; }
  S.voice = new VoiceChat((type, data) => S.net.send(type, data), why => { if (why === 'failed') toast(t('voice.failed'), 'err'); refreshVoiceUI(); });
  try {
    await S.voice.start(me());
    toast(t('voice.on'), 'ok');
    S.voice.sync(S.table.voice || []);
  } catch { S.voice = null; toast(t('t.noMic'), 'err'); }
  refreshVoiceUI();
}
function refreshVoiceUI() {
  if (S.screen === 'wait') { renderWait(); return; }
  if (S.screen === 'game') {
    const box = $('#g-voice');
    box.innerHTML = S.net && S.net.kind === 'online' ? voiceButtonHTML('btn icon sm ghost').replace(/🎙️ [^<]+/, '🎙️').replace(/🔇 [^<]+/, '🔇').replace(/🔈 [^<]+/, '🔈') : '';
    bindVoiceButtons(box);
    $$('[data-pod]').forEach(p => p.classList.toggle('speaking', !!(S.voice && S.voice.speaking.has(p.dataset.pod))));
  }
}

// ---------------- chat ----------------
function onChat(m) {
  S.chat.push(m);
  if (S.chat.length > 80) S.chat.shift();
  if (m.from !== me()) {
    sfx('chat');
    if (!$('.drawer.open') && S.screen === 'game') S.unread++;
  }
  S.bubbles[m.from] = { text: m.text, until: Date.now() + 3500 };
  renderChat();
  if (S.screen === 'game') { renderPods(); renderHudBadge(); }
}

function chatHTML() {
  return `<div class="chatbox panel">
    <div class="section-head" style="padding:14px 16px 6px"><h2 style="font-size:16px">${t('chat')}</h2><div class="spacer"></div>${S.screen === 'game' ? '<button class="btn icon sm ghost" data-closechat>✕</button>' : ''}</div>
    <div class="chat-log">${S.chat.length ? S.chat.map(c => `<div class="msg">${avatar(c.avatar, seatColor(c.from))}<div><b>${esc(c.name)}</b>${esc(c.text)}</div></div>`).join('') : `<div class="msg sys">${t('chat.empty')}</div>`}</div>
    <div class="quick">${quickLines().map(q => `<button data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
    <form class="chat-input"><input class="input" maxlength="140" placeholder="${t('chat.placeholder')}" style="height:40px"><button class="btn sm gold">↑</button></form>
  </div>`;
}
function renderChat() {
  const boxes = [$('#wait-chat'), $('.drawer')].filter(Boolean);
  for (const box of boxes) {
    const had = $('input', box);
    const val = had ? had.value : '';
    const focused = had && document.activeElement === had;
    box.innerHTML = chatHTML();
    const log = $('.chat-log', box); log.scrollTop = log.scrollHeight;
    const inp = $('input', box); inp.value = val; if (focused) inp.focus();
    $('form', box).onsubmit = e => { e.preventDefault(); if (inp.value.trim()) { S.net.send('chat', { text: inp.value }); inp.value = ''; } };
    $('.quick', box).onclick = e => { const b = e.target.closest('[data-q]'); if (b) S.net.send('chat', { text: b.dataset.q }); };
    const x = $('[data-closechat]', box); if (x) x.onclick = () => box.classList.remove('open');
  }
}

// ---------------- game ----------------
function syncHand() {
  const hand = S.game.hand;
  const ids = new Set(hand.map(c => c.id));
  const known = new Set(S.order);
  if (!S.order.length) S.order = sortCards(hand).map(c => c.id);
  else {
    S.order = S.order.filter(id => ids.has(id));
    for (const c of hand) if (!known.has(c.id)) S.order.push(c.id);
  }
  for (const id of [...S.sel]) if (!ids.has(id)) S.sel.delete(id);
  S.staged = S.staged.map(g => g.filter(id => ids.has(id))).filter(g => g.length >= 3);
  if (!isMyTurn() || S.game.opened[me()]) S.staged = [];
}
const sortCards = cards => (S.sortMode === 'rank' ? sortByRank(cards) : sortBySuit(cards));
const isMyTurn = () => S.game && S.table.state === 'playing' && S.game.turn === me();
const cardById = id => S.game.hand.find(c => c.id === id);
const stagedIds = () => new Set(S.staged.flat());

function renderHudBadge() {
  const cb = $('#g-chat');
  cb.querySelector('.dotbadge')?.remove();
  if (S.unread) cb.append(el('<span class="dotbadge"></span>'));
}

function renderGame() {
  const tb = S.table;
  $('#g-title').innerHTML = `${esc(tb.name === 'SOLO' || tb.id === 'SOLO' ? t('solo.title') : tb.name)} <small>${matchLabel(tb)}${S.net.kind === 'online' ? ' · ' + tb.id : ''}</small>`;
  renderHudBadge();
  renderPods();
  renderMelds();
  renderPiles();
  renderDecide();
  renderMe();
  renderHand();
  refreshVoiceUI();
}

/** "Happy with your cards?" panel on the felt while players decide. */
function renderDecide() {
  const g = S.game, tb = S.table;
  let pop = $('#decide-pop');
  if (g.phase !== 'decide' || tb.state !== 'playing') { if (pop) pop.remove(); return; }
  if (!pop) { pop = el('<div class="decide-pop" id="decide-pop"></div>'); $('.felt').append(pop); }
  const mine = isMyTurn();
  const order = tb.seats.filter(s => !s.out);
  const ring = order.map(s => {
    const st = (g.passed || []).includes(s.id) ? 'no' : g.turn === s.id ? 'now' : '';
    return `<span class="dp-av ${st}" title="${esc(s.name)}">${avatar(s.avatar, seatColor(s.id))}${st === 'no' ? '<i>✕</i>' : ''}</span>`;
  }).join('');
  const n = g.hand.length;
  pop.innerHTML = `<div class="dp-ribbon">⟲ ${t('decide.banner')}</div>
    <h3>${mine ? t('decide.happy') : t('decide.waiting', { name: esc(seatOf(g.turn).name) })}</h3>
    <p class="muted">${mine ? t('decide.look', { n }) : t('decide.othersHint')}</p>
    <div class="dp-ring">${ring}</div>
    ${mine ? `<div class="dp-btns">
      <button class="btn blue lg" data-dp="no"><b>⟲ ${t('decide.redealBtn')}</b><small>${t('decide.redealSub')}</small></button>
      <button class="btn gold lg" data-dp="yes"><b>▶ ${t('decide.keepBtn')}</b><small>${t('decide.keepSub')}</small></button>
    </div>
    <div class="dp-warn">⚠ ${t('decide.warn', { n: 50 })}</div>
    ${canQuickDiscard() ? `<div class="muted small">${t('decide.orThrow')}</div>` : ''}` : ''}`;
  $$('[data-dp]', pop).forEach(b => { b.onclick = () => act({ type: 'decide', play: b.dataset.dp === 'yes' }); });
}

function opponents() {
  const seats = S.table.seats;
  const i = seats.findIndex(s => s.id === me());
  return seats.map((_, k) => seats[(i + 1 + k) % seats.length]).filter(s => s.id !== me());
}

function podHTML(s, mine) {
  const g = S.game, tb = S.table;
  const turn = g.turn === s.id && tb.state === 'playing';
  const c = seatColor(s.id);
  const count = g.counts[s.id] ?? 0;
  const b = S.bubbles[s.id];
  const bubble = b && b.until > Date.now() ? `<div class="bubble">${esc(b.text)}</div>` : '';
  const fan = mine ? '' : `<div class="mini-fan">${Array.from({ length: Math.min(count, 7) }, () => '<div class="card back"></div>').join('')}</div>`;
  const decided = g.phase === 'decide' && (g.passed || []).includes(s.id) ? `<span class="chip">${t('decide.no')}</span>` : '';
  const accepted = g.accepted === s.id && !g.opened[s.id] ? `<span class="chip warn" title="${t('decide.acceptedTip')}">${t('decide.yesShort')}</span>` : '';
  const voice = (tb.voice || []).includes(s.id) ? '<span class="mic">🎙️</span>' : '';
  if (s.out) {
    return `<div class="pod out" style="--c:${c}" data-pod="${s.id}"><div style="position:relative">${avatar(s.avatar, c)}${voice}</div>
      <div class="info"><div class="nm"><s>${esc(s.name)}</s></div><div class="sub"><span>${s.score} ${t('pts')}</span><span class="chip">👁 ${t('out.chip')}</span></div></div>${bubble}</div>`;
  }
  return `<div class="pod ${turn ? 'turn' : ''} ${s.connected === false ? 'off' : ''} ${S.voice && S.voice.speaking.has(s.id) ? 'speaking' : ''}" style="--c:${c}" data-pod="${s.id}">
    <div style="position:relative">${avatar(s.avatar, c)}${turn && tb.deadline ? '<div class="ring" data-ring></div>' : ''}${voice}</div>
    <div class="info"><div class="nm">${esc(s.name)}</div>
      <div class="sub"><span>${s.score} ${t('pts')}</span>${g.opened[s.id] ? `<span class="chip gold">✓ ${t('opened')}</span>` : ''}${accepted}${decided}${s.bot ? `<span class="chip">${t('bot')}</span>` : ''}</div></div>
    ${mine ? '' : `${fan}<div class="count">${count}</div>`}${bubble}</div>`;
}

function renderPods() {
  $('#opps').innerHTML = opponents().map(s => podHTML(s, false)).join('');
  const mp = $('#me-pod'); if (mp) mp.innerHTML = podHTML(seatOf(me()), true);
}

function selectionTargets() {
  const g = S.game;
  const out = new Map();
  if (!isMyTurn() || g.phase !== 'play' || !g.opened[me()] || !S.sel.size) return out;
  const cards = [...S.sel].map(cardById).filter(Boolean);
  if (cards.length >= g.hand.length) return out;
  for (const m of g.melds) {
    if (validateMeld([...m.cards, ...cards])) out.set(m.id, { type: 'layoff', hint: t('hint.addHere') });
    else if (cards.length === 1 && !isJoker(cards[0])) {
      const c = cards[0];
      const j = m.cards.find(x => isJoker(x) && x.as && x.as.r === c.r && x.as.s === c.s);
      if (j && validateMeld(m.cards.map(x => (x === j ? c : x)))) out.set(m.id, { type: 'swap', hint: t('hint.swap') });
    }
  }
  return out;
}

function renderMelds() {
  const g = S.game;
  const box = $('#melds');
  const targets = selectionTargets();
  if (!g.melds.length) {
    box.innerHTML = `<div class="placeholder"><div class="seal">Rami l Sbah</div><div>${t('felt.open', { n: g.openMin })}</div>${g.cleanRun ? `<div class="small">${t('felt.clean')}</div>` : ''}</div>`;
    return;
  }
  const fresh = S.freshMelds || new Set();
  box.innerHTML = g.melds.map(m => {
    const tg = targets.get(m.id);
    return `<div class="meld ${tg ? 'target' : ''} ${fresh.has(m.id) ? 'fresh' : ''}" data-meld="${m.id}" style="--c:${seatColor(m.owner)}" ${tg ? `data-hint="${tg.hint}" data-act="${tg.type}"` : ''} title="${esc(seatOf(m.owner).name)} · ${esc(meldName(m))}">
      ${m.cards.map(c => cardHTML(c)).join('')}<span class="pts">${m.points}</span></div>`;
  }).join('');
  S.freshMelds = null;
}

function renderPiles() {
  const g = S.game;
  const canDraw = isMyTurn() && g.phase === 'draw';
  const top = g.discard.slice(-3);
  $('#piles').innerHTML = `
    <div class="pile ${canDraw && g.stock ? 'can' : ''}" id="pile-stock" title="${t('pile.stockTip')}">
      <div class="stack">${Array.from({ length: Math.min(4, Math.ceil(g.stock / 15) + (g.stock ? 1 : 0)) }, () => '<div class="card back"></div>').join('')}</div>
      <span class="badge">${g.stock}</span><span class="lab">${t('pile.stock')}</span></div>
    <div class="pile discard ${canDraw && g.discard.length ? 'can' : ''}" id="pile-discard" title="${t('pile.discardTip')}">
      <div class="stack">${top.length ? top.map(c => cardHTML(c)).join('') : '<div class="empty-slot"></div>'}</div>
      <span class="badge">${g.discardCount}</span><span class="lab">${t('pile.discard')}</span></div>`;
}

const stagedMelds = () => S.staged.map(grp => validateMeld(grp.map(cardById))).filter(Boolean);
const stagedPoints = () => stagedMelds().reduce((s, m) => s + m.points, 0);

function renderMe() {
  const g = S.game;
  const mine = isMyTurn();
  const opened = g.opened[me()];
  const selCards = [...S.sel].map(cardById).filter(Boolean);
  const meld = selCards.length >= 3 ? validateMeld(selCards) : null;
  let status;
  const iAmOut = !!seatOf(me()).out;
  if (S.table.state !== 'playing') status = `<div class="status">${t('st.roundOver')}</div>`;
  else if (iAmOut) status = `<div class="status out">👁 ${t('out.me', { n: S.table.limit })}</div>`;
  else if (g.phase === 'decide') status = mine ? `<div class="status mine"><span class="dot"></span><span>${t('decide.ask')}</span></div>` : `<div class="status"><span class="dot"></span>${t('decide.waiting', { name: esc(seatOf(g.turn).name) })}</div>`;
  else if (!mine) status = `<div class="status"><span class="dot"></span>${t('st.turnOf', { name: esc(seatOf(g.turn).name) })}</div>`;
  else if (g.phase === 'draw') status = `<div class="status mine"><span class="dot"></span>${t('st.draw')}</div>`;
  else if (g.mustUse) status = `<div class="status mine"><span class="dot"></span>${t('st.mustUse')}</div>`;
  else status = `<div class="status mine"><span class="dot"></span>${opened ? t('st.playOpened') : t('st.playClosed')}</div>`;

  let opening = '';
  if (!opened && !iAmOut && S.table.state === 'playing' && g.phase !== 'decide') {
    const pts = stagedPoints();
    const p = Math.min(1, pts / g.openMin);
    const clean = !g.cleanRun || stagedMelds().some(isCleanRun);
    opening = `<div class="opening ${pts >= g.openMin && clean ? 'ok' : ''}"><span>${t('opening')}</span><div class="bar" style="--p:${p}"><i></i></div><b>${pts}</b>/${g.openMin}${g.cleanRun ? `<span class="chip ${clean ? 'okc' : ''}" title="${t('clean.tip')}">${clean ? '✓' : '✗'} ${t('clean.short')}</span>` : ''}</div>`;
  }
  let hint = '';
  if (selCards.length >= 3) hint = meld ? `<span class="hint ok">✓ ${esc(meldName(meld))} · ${meld.points} ${t('pts')}</span>` : `<span class="hint bad">${t('hint.notMeld')}</span>`;
  else if (selCards.length && mine && g.phase === 'play' && opened && selectionTargets().size) hint = `<span class="hint ok">${t('hint.dropGold')}</span>`;

  const play = mine && g.phase === 'play';
  const stagedTotal = stagedPoints();
  const acts = [];
  if (mine && g.phase === 'decide') {
    if (canQuickDiscard()) acts.push(`<button class="btn blue" data-a="discard" ${selCards.length === 1 ? '' : 'disabled'}>${t('act.discard')} ▸</button>`);
  }
  if (play) {
    if (!opened) {
      acts.push(`<button class="btn ${meld ? 'gold' : ''}" data-a="stage" ${meld ? '' : 'disabled'}>＋ ${t('act.stage')}</button>`);
      if (S.staged.length) acts.push(`<button class="btn ${stagedTotal >= g.openMin ? 'gold' : ''}" data-a="open" ${stagedTotal >= g.openMin ? '' : 'disabled'}>✓ ${t('act.open')} (${stagedTotal})</button>`);
    } else {
      acts.push(`<button class="btn ${meld ? 'gold' : ''}" data-a="meld" ${meld ? '' : 'disabled'}>${t('act.meld')}</button>`);
    }
    acts.push(`<button class="btn blue" data-a="discard" ${selCards.length === 1 && !g.mustUse ? '' : 'disabled'}>${t('act.discard')} ▸</button>`);
    if (g.canUndo) acts.push(`<button class="btn ghost" data-a="undo">↩ ${g.returnPenalty ? t('act.undoPen', { n: g.returnPenalty }) : t('act.undo')}</button>`);
  }
  if (S.sel.size) acts.push(`<button class="btn ghost sm" data-a="clear">${t('act.clear')}</button>`);
  $('#me-bar').innerHTML = `<div id="me-pod">${podHTML(seatOf(me()), true)}</div>${status}${opening}${hint}<div class="spacer"></div>
    <div class="actions">${acts.join('')}
      <div class="seg sortseg" title="${t('sort')}"><span class="lbl">${t('sort.label')}</span>${['rank', 'suit'].map(k => `<button data-sort="${k}" class="${S.sortMode === k ? 'on' : ''}">${k === 'suit' ? '♠♥ ' + t('sort.suit') : '⇅ ' + t('sort.value')}</button>`).join('')}</div></div>`;
  $('#stage').innerHTML = S.staged.map((grp, i) => {
    const m = validateMeld(grp.map(cardById));
    return `<div class="group ${m && isCleanRun(m) ? 'clean' : ''}">${(m ? m.cards : grp.map(cardById)).map(c => cardHTML(c)).join('')}<span class="pts">${m ? m.points : 0}</span><button class="x" data-unstage="${i}">✕</button></div>`;
  }).join('');
}

function renderHand() {
  const box = $('#hand');
  const hidden = stagedIds();
  const g = S.game;
  const ids = S.order.filter(id => !hidden.has(id));
  const existing = new Map($$('.card', box).map(n => [n.dataset.id, n]));
  const frag = document.createDocumentFragment();
  for (const id of ids) {
    const c = cardById(id);
    if (!c) continue;
    let n = existing.get(id);
    if (!n) n = el(cardHTML(c));
    n.classList.toggle('sel', S.sel.has(id));
    n.classList.toggle('must', g.mustUse === id);
    n.dataset.must = t('mustTag');
    frag.append(n);
  }
  box.replaceChildren(frag);
  layoutHand();
}

function layoutHand() {
  const box = $('#hand');
  const cards = $$('.card', box);
  if (!cards.length) return;
  const cw = cards[0].getBoundingClientRect().width || 70;
  const avail = box.clientWidth - 24;
  const n = cards.length;
  let ov = 6;
  if (n * cw + (n - 1) * ov > avail) ov = (avail - cw) / (n - 1) - cw;
  ov = Math.max(-cw * 0.74, Math.min(6, ov));
  box.style.setProperty('--ov', ov + 'px');
}

function handRects() {
  const m = new Map();
  $$('#hand .card').forEach(n => m.set(n.dataset.id, n.getBoundingClientRect()));
  return m;
}

// ---------------- interactions ----------------
function bindGame() {
  $('#g-leave').onclick = confirmLeave;
  $('#g-scores').onclick = showScores;
  $('#g-chat').onclick = () => { const d = $('.drawer'); d.classList.toggle('open'); S.unread = 0; renderChat(); renderHudBadge(); };
  $$('[data-sound]').forEach(b => { b.onclick = () => { sound.toggle(); paintSoundButtons(); }; });
  paintSoundButtons();
  $('#piles').addEventListener('click', e => {
    if (!isMyTurn() || S.game.phase !== 'draw') return;
    const p = e.target.closest('.pile');
    if (!p) return;
    if (p.id === 'pile-discard' && !S.game.discard.length) return;
    act({ type: 'draw', from: p.id === 'pile-discard' ? 'discard' : 'stock' });
  });
  $('#melds').addEventListener('click', e => {
    const m = e.target.closest('.meld.target');
    if (m) dropOnMeld(m.dataset.meld, [...S.sel]);
  });
  $('#me-bar').addEventListener('click', e => {
    const s = e.target.closest('[data-sort]');
    if (s) {
      S.sortMode = s.dataset.sort; localStorage.setItem('rami.sort', S.sortMode);
      const before = handRects();
      S.order = sortCards(S.game.hand).map(c => c.id);
      renderMe(); renderHand(); flip(before); sfx('tap');
      return;
    }
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a;
    if (a === 'clear') { S.sel.clear(); refreshSel(); }
    if (a === 'decide-yes') act({ type: 'decide', play: true });
    if (a === 'decide-no') act({ type: 'decide', play: false });
    if (a === 'discard') discard([...S.sel][0]);
    if (a === 'undo') act({ type: 'undoDraw' });
    if (a === 'meld') act({ type: 'meld', groups: [orderedSel()] });
    if (a === 'stage') { S.staged.push(orderedSel()); S.sel.clear(); sfx('meld'); renderMe(); renderHand(); }
    if (a === 'open') tryOpen();
  });
  $('#stage').addEventListener('click', e => {
    const x = e.target.closest('[data-unstage]');
    if (x) { S.staged.splice(+x.dataset.unstage, 1); renderMe(); renderHand(); sfx('tap'); }
  });
  bindHandDrag();
}

function tryOpen() {
  const g = S.game;
  if (g.cleanRun && !stagedMelds().some(isCleanRun)) {
    const m = modal(`<h3>⚠️ ${t('clean.title')}</h3><p class="muted">${t('clean.warn', { n: 50 })}</p>
      <div class="row" style="justify-content:flex-end"><button class="btn gold" id="o-no">${t('clean.fix')}</button><button class="btn ghost danger" id="o-yes">${t('clean.anyway')}</button></div>`);
    $('#o-no', m).onclick = closeModal;
    $('#o-yes', m).onclick = () => { closeModal(); act({ type: 'meld', groups: S.staged }); };
    return;
  }
  act({ type: 'meld', groups: S.staged });
}

const orderedSel = () => S.order.filter(id => S.sel.has(id));

function act(action) {
  sfx('tap');
  S.net.send('act', { action });
}
/** Starter still deciding "nal3bou wala le?" can throw a card directly: it counts as "nal3bou". */
const canQuickDiscard = () => isMyTurn() && S.game.phase === 'decide' && S.game.starter === me();
const canDiscardNow = () => isMyTurn() && (S.game.phase === 'play' || canQuickDiscard());
function discard(cardId) {
  if (canQuickDiscard()) S.net.send('act', { action: { type: 'decide', play: true } });
  act({ type: 'discard', card: cardId });
}

function dropOnMeld(meldId, ids) {
  const tg = selectionTargets().get(meldId);
  if (!tg) return;
  if (tg.type === 'swap') act({ type: 'swap', card: ids[0], meld: meldId });
  else act({ type: 'layoff', cards: ids, meld: meldId });
}

function refreshSel() {
  $$('#hand .card').forEach(n => n.classList.toggle('sel', S.sel.has(n.dataset.id)));
  renderMe();
  renderMelds();
}

function bindHandDrag() {
  const hand = $('#hand');
  let drag = null;
  hand.addEventListener('pointerdown', e => {
    const n = e.target.closest('.card');
    if (!n || e.button > 0) return;
    drag = { id: n.dataset.id, node: n, x: e.clientX, y: e.clientY, moved: false };
    try { n.setPointerCapture(e.pointerId); } catch { /* synthetic */ }
  });
  hand.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 8) return;
    if (!drag.moved) {
      drag.moved = true;
      const r = drag.node.getBoundingClientRect();
      drag.ox = drag.x - r.left; drag.oy = drag.y - r.top;
      drag.ghost = el(drag.node.outerHTML);
      drag.ghost.classList.add('drag-ghost'); drag.ghost.classList.remove('sel');
      drag.ghost.style.width = r.width + 'px'; drag.ghost.style.setProperty('--cw', r.width + 'px');
      document.body.append(drag.ghost);
      drag.node.classList.add('dragging');
      if (!S.sel.has(drag.id)) { S.sel.clear(); S.sel.add(drag.id); refreshSel(); }
    }
    drag.ghost.style.left = e.clientX - drag.ox + 'px';
    drag.ghost.style.top = e.clientY - drag.oy + 'px';
    const over = document.elementFromPoint(e.clientX, e.clientY);
    $('#pile-discard')?.classList.toggle('drop', !!(over && over.closest('#pile-discard')) && canDiscardNow());
  });
  const end = e => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.moved) {
      if (S.sel.has(d.id)) S.sel.delete(d.id); else S.sel.add(d.id);
      sfx('select'); buzz(8);
      refreshSel();
      return;
    }
    d.ghost.remove();
    d.node.classList.remove('dragging');
    $('#pile-discard')?.classList.remove('drop');
    const over = document.elementFromPoint(e.clientX, e.clientY);
    const ids = S.sel.has(d.id) ? orderedSel() : [d.id];
    if (over && over.closest('#pile-discard') && canDiscardNow()) {
      discard(d.id);
      return;
    }
    const m = over && over.closest('.meld');
    if (m) { dropOnMeld(m.dataset.meld, ids); return; }
    const before = handRects();
    const others = $$('#hand .card').filter(n => n !== d.node);
    let idx = others.findIndex(n => { const r = n.getBoundingClientRect(); return e.clientX < r.left + r.width / 2; });
    if (idx < 0) idx = others.length;
    const visible = others.map(n => n.dataset.id);
    visible.splice(idx, 0, d.id);
    const hidden = S.order.filter(id => !visible.includes(id));
    S.order = [...visible, ...hidden];
    renderHand();
    flip(before);
  };
  hand.addEventListener('pointerup', end);
  hand.addEventListener('pointercancel', end);
}

function flip(before) {
  $$('#hand .card').forEach(n => {
    const a = before.get(n.dataset.id);
    if (!a) return;
    const b = n.getBoundingClientRect();
    const dx = a.left - b.left, dy = a.top - b.top;
    if (!dx && !dy) return;
    n.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
  });
}

function fly(html, from, to, { duration = 480, delay = 0, cw } = {}) {
  if (!from || !to) return;
  const n = el(html);
  n.classList.add('fly');
  const w = cw || from.width;
  n.style.setProperty('--cw', w + 'px');
  n.style.left = from.left + 'px'; n.style.top = from.top + 'px';
  document.body.append(n);
  const sx = to.width / w;
  n.animate([
    { transform: 'translate(0,0) rotate(0deg) scale(1)' },
    { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) rotate(${(Math.random() - 0.5) * 16}deg) scale(${sx})` },
  ], { duration, delay, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'both' }).onfinish = () => n.remove();
}

function rectOf(sel) { const n = typeof sel === 'string' ? $(sel) : sel; return n ? n.getBoundingClientRect() : null; }
function podRect(pid) {
  const n = $(`[data-pod="${pid}"] .avatar`);
  if (!n) return null;
  const r = n.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width * 0.7, height: r.height };
}

function sayBubble(pid, text, ms = 3000) {
  S.bubbles[pid] = { text, until: Date.now() + ms };
  renderPods();
}

function animateEvent(ev, prev, before, fresh) {
  const g = S.game;
  if (fresh && (!ev || ev.type === 'deal' || ev.type === 'redeal')) {
    sfx('deal');
    $$('#hand .card').forEach((n, i) => n.animate([{ transform: 'translateY(-120px) scale(.6) rotate(-10deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, delay: i * 45, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards' }));
    banner(ev && ev.type === 'redeal' ? t('decide.redeal') : t('round.n', { n: S.table.roundNo }));
  }
  if (!ev) return;
  const mine = ev.player === me();
  const stack = id => rectOf(`#${id} .stack`);
  switch (ev.type) {
    case 'decide':
      if (ev.play) { sfx('turn'); toast(mine ? t('decide.youAccepted', { n: 50 }) : t('decide.accepted', { name: seatOf(ev.player).name })); }
      else { sfx('tap'); sayBubble(ev.player, t('decide.no') + ' ✋'); }
      break;
    case 'draw': {
      sfx('draw');
      const src = stack(ev.from === 'discard' ? 'pile-discard' : 'pile-stock');
      if (mine) {
        const n = $(`#hand .card[data-id="${ev.cardId}"]`);
        if (n) {
          const to = n.getBoundingClientRect();
          n.style.opacity = 0;
          fly(cardHTML(cardById(ev.cardId)), src, to, { cw: src && src.width });
          setTimeout(() => { n.style.opacity = ''; n.classList.add('new'); }, 470);
        }
      } else fly(ev.from === 'discard' ? cardHTML(ev.card) : '<div class="card back"></div>', src, podRect(ev.player), { cw: src && src.width });
      break;
    }
    case 'undoDraw':
      sfx(ev.penalty ? 'error' : 'discard');
      if (ev.penalty) toast(t('t.penalty', { name: ev.player === me() ? t('you') : seatOf(ev.player).name, n: ev.penalty, why: t('n.returned') }), 'err');
      break;
    case 'discard': {
      sfx('discard');
      const to = stack('pile-discard');
      const from = mine ? before.get(ev.card.id) : podRect(ev.player);
      const top = $('#pile-discard .stack .card:last-child');
      if (top) { top.style.opacity = 0; setTimeout(() => { top.style.opacity = ''; }, 460); }
      fly(cardHTML(ev.card), from, to, { cw: from ? from.width : 60 });
      // "tris lil 3ris" for a 3, "quatro" for a 4
      if (ev.card.r === 3 || ev.card.r === 4) {
        const k = ev.card.r === 3 ? 'tris' : 'quatro';
        setTimeout(() => { voicelines.play(k); sayBubble(ev.player, LINES[k].label); }, 350);
      }
      break;
    }
    case 'meld': {
      S.freshMelds = new Set(ev.melds.map(m => m.id));
      renderMelds();
      if (ev.opening) {
        sfx('open');
        if (mine) banner(t('b.opened')); else toast(t('t.opened', { name: seatOf(ev.player).name, n: ev.points }));
      } else sfx('meld');
      if (mine) buzz(25);
      break;
    }
    case 'penalty':
      sfx('error');
      toast(t('t.penalty', { name: mine ? t('you') : seatOf(ev.player).name, n: ev.points, why: t(ev.reason) }), 'err');
      if (mine) { S.staged = []; renderMe(); renderHand(); }
      break;
    case 'layoff': case 'swap': {
      S.freshMelds = new Set([ev.meld.id]);
      renderMelds();
      sfx('meld');
      if (ev.type === 'swap' && !mine) toast(t('t.swapped', { name: seatOf(ev.player).name }));
      break;
    }
    case 'roundOver': {
      const won = ev.winner === me();
      sfx(won ? 'win' : 'lose');
      if (won) { banner(ev.frich ? t('b.frich') : t('b.won')); confetti(); } else if (ev.winner) banner(ev.frich ? t('b.otherFrich', { name: seatOf(ev.winner).name }) : t('b.otherWon', { name: seatOf(ev.winner).name }));
      break;
    }
    case 'timeout': if (ev.player !== me()) toast(t('t.timeout', { name: seatOf(ev.player).name })); break;
    case 'info': if (ev.key) toast(t(ev.key, ev.params)); break;
    default: break;
  }
  if (prev && (prev.turn !== g.turn || prev.phase !== g.phase) && g.turn === me() && S.table.state === 'playing' && (g.phase === 'draw' || g.phase === 'decide' || (g.turnNo === 1 && prev.phase === 'decide'))) {
    setTimeout(() => { banner(g.phase === 'decide' ? t('decide.banner') : t('b.yourTurn')); sfx('turn'); buzz(30); }, 350);
  }
}

function tick() {
  if (S.screen !== 'game' || !S.table) return;
  const tb = S.table, g = S.game;
  const ring = $('[data-pod] [data-ring]');
  if (ring && tb.deadline) {
    const left = Math.max(0, tb.deadline - now());
    ring.style.setProperty('--p', left / (tb.turnTime * 1000));
    ring.classList.toggle('low', left < 8000);
    if (isMyTurn() && left < 6000 && left > 0) {
      const sec = Math.ceil(left / 1000);
      if (sec !== S.lastTick) { S.lastTick = sec; sfx('tick'); }
    }
  }
  // "imchi marznik": a player keeps the table waiting for more than 30 s
  if (g && tb.state === 'playing' && S.marzFired !== S.turnKey && Date.now() - S.turnStart > MARZNIK_MS) {
    const s = seatOf(g.turn);
    if (!s.bot) {
      S.marzFired = S.turnKey;
      voicelines.play('marznik');
      sayBubble(g.turn, LINES.marznik.label, 4000);
    }
  }
  for (const [pid, b] of Object.entries(S.bubbles)) if (b.until < Date.now()) { delete S.bubbles[pid]; renderPods(); }
  const cd = $('#next-in');
  if (cd && tb.nextAt) cd.textContent = Math.max(0, Math.ceil((tb.nextAt - now()) / 1000));
}

// ---------------- results ----------------
const noteText = n => (typeof n === 'string' ? n : `${t(n.k)} (+${n.pts})`);

function resultsTable(scores, hands, winner, notes) {
  const tb = S.table;
  const rows = [...tb.seats].sort((a, b) => a.score - b.score).map(s => {
    const sc = scores ? scores[s.id] : null;
    const left = hands ? (hands[s.id] || []) : [];
    const nt = notes && notes[s.id] && notes[s.id].length ? `<div class="notes">${notes[s.id].map(n => `<span>${esc(noteText(n))}</span>`).join('')}</div>` : '';
    return `<tr class="${s.id === winner ? 'win' : ''} ${s.out ? 'out' : ''}">
      <td><div class="who">${avatar(s.avatar, seatColor(s.id))}<div>${s.out ? `<s>${esc(s.name)}</s> <span class="chip">👁 ${t('out.chip')}</span>` : esc(s.name)}${s.id === me() ? ` <span class="muted">(${t('you')})</span>` : ''}${nt}</div></div></td>
      <td><div class="left">${left.slice(0, 10).map(c => cardHTML(c)).join('')}</div></td>
      <td class="num ${sc < 0 ? 'pos' : sc > 0 ? 'neg' : ''}">${sc == null ? '' : (sc > 0 ? '+' : '') + sc}</td>
      <td class="num">${s.score}</td></tr>`;
  }).join('');
  return `<table class="results"><thead><tr><th>${t('res.player')}</th><th>${t('res.cards')}</th><th style="text-align:end">${t('res.round')}</th><th style="text-align:end">${t('res.total')}</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function showResults() {
  const tb = S.table, o = S.game.over;
  if (!o) return;
  const w = o.winner ? seatOf(o.winner) : null;
  const hero = w ? `<div class="winner-hero">${avatar(w.avatar, seatColor(o.winner))}<div class="eyebrow">${matchLabel(tb)}</div><h3>${o.winner === me() ? t('res.youWon') : t('res.otherWon', { name: esc(w.name) })}</h3>${o.frich ? `<span class="rami">FRICH · 100</span>` : ''}</div>`
    : `<div class="winner-hero"><h3>${t('res.stockEmpty')}</h3><p class="muted">${t('res.stockEmptyHint')}</p></div>`;
  if (tb.state === 'matchEnd') {
    const rank = [...tb.seats].sort((a, b) => a.score - b.score);
    const podium = [rank[1], rank[0], rank[2]].filter(Boolean).map(s => {
      const place = rank.indexOf(s) + 1;
      return `<div class="p">${avatar(s.avatar, seatColor(s.id))}<b>${esc(s.name)}</b><span class="muted">${s.score} ${t('pts')}</span><div class="block" style="height:${place === 1 ? 110 : place === 2 ? 80 : 60}px">${place}</div></div>`;
    }).join('');
    const isHost = tb.host === me();
    const won = rank[0].id === me();
    if (won) setTimeout(confetti, 300);
    modal(`<div class="winner-hero"><div class="eyebrow">${t('res.matchOver')}</div><h3>${won ? t('res.champion') : t('res.matchWinner', { name: esc(rank[0].name) })}</h3></div>
      <div class="podium">${podium}</div>${earnedHTML()}${resultsTable(o.scores, o.hands, o.winner, o.notes)}
      <div class="row" style="justify-content:flex-end">
        <button class="btn ghost" id="r-home">${t('res.home')}</button>
        ${S.net.kind === 'local' ? `<button class="btn gold" id="r-again">${t('res.again')} ▸</button>` : isHost ? `<button class="btn" id="r-lobby">${t('res.backToTable')}</button><button class="btn gold" id="r-again">${t('res.againMatch')} ▸</button>` : `<span class="muted">${t('res.hostCan')}</span>`}
      </div>`, { wide: true, onClose: false });
    $('#r-home').onclick = () => { if (S.net.kind === 'online') S.net.send('leave'); goHome(); };
    $('#r-again') && ($('#r-again').onclick = () => { S.roundSeen = 0; S.net.send('start'); });
    $('#r-lobby') && ($('#r-lobby').onclick = () => S.net.send('backToLobby'));
    return;
  }
  modal(`${hero}${rebuyHTML()}${earnedHTML()}${resultsTable(o.scores, o.hands, o.winner, o.notes)}
    <div class="row between"><span class="muted">${t('res.nextIn')} <b id="next-in">15</b>s</span>
    <div class="row"><button class="btn ghost" id="r-board">${t('res.seeTable')}</button><button class="btn gold" id="r-ready">${t('res.ready')} ✓</button></div></div>`, { wide: true, onClose: false });
  bindRebuy();
  $('#r-ready').onclick = () => { S.net.send('ready'); $('#r-ready').disabled = true; $('#r-ready').textContent = t('res.waitingOthers'); };
  $('#r-board').onclick = () => { closeModal(); toast(t('t.trophy')); };
  updateResultsReady();
}
function updateResultsReady() {
  const m = S.table.seats.find(s => s.id === me());
  const b = $('#r-ready');
  if (b && m && m.ready) { b.disabled = true; b.textContent = t('res.waitingOthers'); }
}

function showScores() {
  const tb = S.table;
  if ((tb.state === 'roundEnd' || tb.state === 'matchEnd') && S.game.over) return showResults();
  const hist = tb.history.map(h => `<tr><td>${t('round.n', { n: h.round })}${h.rami ? ' 🔥' : ''}</td>${tb.seats.map(s => `<td class="num">${h.scores[s.id] ?? '–'}</td>`).join('')}</tr>`).join('');
  modal(`<div class="eyebrow">${t('score')}</div><h3>${matchLabel(tb)}</h3>
    <table class="results"><thead><tr><th></th>${tb.seats.map(s => `<th style="text-align:end">${esc(s.avatar)} ${s.out ? `<s>${esc(s.name)}</s>` : esc(s.name)}</th>`).join('')}</tr></thead>
    <tbody>${hist || `<tr><td colspan="${tb.seats.length + 1}" class="muted">${t('score.first')}</td></tr>`}
    <tr><td><b>${t('res.total')}</b></td>${tb.seats.map(s => `<td class="num"><b>${s.score}</b></td>`).join('')}</tr></tbody></table>
    <p class="muted small">${t('score.hint')}</p>
    <div class="row" style="justify-content:flex-end"><button class="btn gold" data-close>${t('ok')}</button></div>`, { wide: true });
  $('.modal [data-close]').onclick = closeModal;
}

function confetti() {
  const c = el('<canvas class="confetti"></canvas>');
  document.body.append(c);
  const x = c.getContext('2d');
  c.width = innerWidth; c.height = innerHeight;
  const cols = ['#f1c76b', '#ff7a6b', '#6cc4ff', '#4fd1a5', '#ffffff'];
  const P = Array.from({ length: 160 }, () => ({ x: c.width / 2 + (Math.random() - 0.5) * 200, y: c.height * 0.45, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 16 - 4, r: Math.random() * 6 + 3, c: cols[Math.floor(Math.random() * cols.length)], a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3 }));
  let f = 0;
  (function step() {
    x.clearRect(0, 0, c.width, c.height);
    for (const p of P) {
      p.vy += 0.38; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.a += p.va;
      x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore();
    }
    if (++f < 150) requestAnimationFrame(step); else c.remove();
  })();
}


// ---------------- progression: profile, daily, themes, leaderboard, Google ----------------
const fmt = n => Number(n || 0).toLocaleString('fr-FR');
const claimableMissions = () => S.profile.missions.list.some(m => !m.claimed && m.progress >= (MISSIONS.find(x => x.id === m.id) || {}).goal);

function applyTheme() {
  const th = S.profile.theme;
  const f = THEMES.felt.find(x => x.id === th.felt) || THEMES.felt[0];
  document.documentElement.style.setProperty('--felt-1', f.a);
  document.documentElement.style.setProperty('--felt-2', f.b);
  document.body.dataset.back = th.back || 'zellij';
  document.body.dataset.felt = f.id;
}

function sendStats() {
  if (!S.online || S.status !== 'online' || !S.profile.name) return;
  S.online.send('stats', { uid: S.profile.uid, card: { ...publicCard(S.profile), xp: S.profile.xp } });
  if (S.profile.google) S.online.send('cloud', { profile: S.profile });
}

function onWelcome(m) {
  S.googleId = m.google || window.RAMI_GOOGLE_CLIENT_ID || '';
  const cred = sessionStorage.getItem('rami.gcred');
  if (S.profile.google && cred) S.online.send('google', { credential: cred });
  else setTimeout(sendStats, 50);
}

function recordRound(st) {
  const tb = S.table, o = S.game.over, id = me();
  if (!o || !tb.seats.some(s => s.id === id) || o.scores[id] === undefined) return;
  const key = `${tb.id}:${tb.roundNo}:${st}:${JSON.stringify(o.scores)}`;
  if (S.profile.lastRound === key) return;
  const prevKey = `${tb.id}:${tb.roundNo}:roundEnd:${JSON.stringify(o.scores)}`;
  if (st === 'matchEnd' && S.profile.lastRound === prevKey) {
    const p = S.profile, won = [...tb.seats].sort((a, b) => a.score - b.score)[0].id === id;
    p.stats.matches++; if (won) { p.stats.matchWins++; p.xp += 60; p.coins += S.net.kind === 'online' ? 150 : 50; }
    p.lastRound = key; saveProfile(); renderProfileChip(); sendStats();
    return;
  }
  const p = S.profile, rankBefore = rankOf(levelOf(p.xp)).id;
  const rank = [...tb.seats].sort((a, b) => a.score - b.score);
  const won = o.winner === id;
  const r = applyRound(p, {
    won, frich: won && !!o.frich, opened: !!(S.game.opened && S.game.opened[id]),
    online: S.net.kind === 'online', matchOver: st === 'matchEnd', matchWon: st === 'matchEnd' && rank[0].id === id,
  });
  p.lastRound = key;
  saveProfile();
  S.lastEarn = { key: S.resultsShown, ...r };
  renderProfileChip();
  sendStats();
  if (r.levelUp) {
    setTimeout(() => {
      banner(t('pro.levelUp', { n: r.levelUp }));
      const rk = rankOf(r.levelUp).id;
      if (rk !== rankBefore) toast(t('pro.newRank', { r: t('rank.' + rk) }));
      sfx('win');
    }, 1600);
  }
}

function earnedHTML() {
  const e = S.lastEarn;
  if (!e || e.key !== S.resultsShown) return '';
  const lv = levelOf(S.profile.xp), a = S.profile.xp - xpFor(lv), b = xpFor(lv + 1) - xpFor(lv);
  return `<div class="earned"><b>${t('pro.earned', { xp: e.xp, coins: e.coins })}</b><span class="muted">${t('pro.level', { n: lv })}</span><div class="xpbar"><i style="width:${Math.round(100 * a / b)}%"></i></div></div>`;
}

function profileDialog(tab = 'me') {
  const p = S.profile;
  refreshMissions(p);
  const lv = levelOf(p.xp), rk = rankOf(lv), a = p.xp - xpFor(lv), b = xpFor(lv + 1) - xpFor(lv);
  const tabs = ['me', 'daily', 'themes', 'board'].map(k => `<button class="${k === tab ? 'on' : ''}" data-tab="${k}">${t('pro.tab.' + k)}${k === 'daily' && (giftAvailable(p) || claimableMissions()) ? ' <i class="dot"></i>' : ''}</button>`).join('');
  let body = '';
  if (tab === 'me') {
    const st = p.stats;
    const g = !S.online ? '' : isApp() && !p.google ? `<p class="muted small">${t('google.app')}</p>`
      : p.google ? `<div class="row between"><span>${t('google.signed', { name: esc(typeof p.google === 'string' ? p.google : '') })}</span><button class="btn sm ghost" id="g-out">${t('google.out')}</button></div>`
      : S.googleId ? `<p class="muted small">${t('google.hint')}</p><div id="g-btn"></div>` : `<p class="muted small">${t('google.off')}</p>`;
    body = `<div class="pro-head">${avatar(p.avatar, rk.color, 'framed xl')}<div class="grow">
        <h3>${esc(p.name)}</h3>
        <div class="row" style="gap:8px;flex-wrap:wrap"><span class="chip rank" style="--c:${rk.color}">${t('rank.' + rk.id)}</span><span class="chip">${t('pro.level', { n: lv })}</span><span class="chip coins">${fmt(p.coins)} 🪙</span></div>
        <div class="xpbar"><i style="width:${Math.round(100 * a / b)}%"></i></div><span class="muted small">${t('pro.xp', { a: fmt(a), b: fmt(b) })}</span>
      </div></div>
      <div class="eyebrow">${t('pro.stats')}</div>
      <div class="statgrid">${['rounds', 'wins', 'frich', 'opens', 'matches', 'matchWins', 'online'].map(k => `<div><b>${fmt(st[k])}</b><span>${t('stat.' + k)}</span></div>`).join('')}
        <div><b>${st.rounds ? Math.round(100 * st.wins / st.rounds) : 0}%</b><span>${t('stat.wins')} %</span></div></div>
      <div class="eyebrow">${t('google.title')}</div><div class="acct">${p.google ? '' : `<p class="muted small">${t('google.guest')}</p>`}${g}</div>
      <div class="row between"><span class="muted small">${t('pro.virtual')}</span><button class="btn sm" id="pro-edit">${t('pro.edit')}</button></div>`;
  } else if (tab === 'daily') {
    const can = giftAvailable(p);
    const next = Math.min(7, p.gift.last === new Date(Date.now() - 86400000).toISOString().slice(0, 10) ? p.gift.streak + 1 : 1);
    const days = Array.from({ length: 7 }, (_, i) => `<span class="${i < (can ? next - 1 : p.gift.streak) ? 'on' : ''} ${can && i === next - 1 ? 'now' : ''}">${150 + 50 * (i + 1)}</span>`).join('');
    body = `<div class="gift ${can ? 'ready' : ''}"><div class="big">🎁</div><div class="grow"><b>${t('pro.gift')}</b>
        <div class="muted small">${t('pro.streak', { n: can ? next : p.gift.streak })}</div><div class="days">${days}</div></div>
        ${can ? `<button class="btn gold" id="gift">${t('pro.giftBtn', { n: 150 + 50 * next })}</button>` : `<span class="muted small">${t('pro.giftDone')}</span>`}</div>
      <div class="eyebrow">${t('pro.missions')}</div>
      <div class="missions">${p.missions.list.map(m => {
        const d = MISSIONS.find(x => x.id === m.id); if (!d) return '';
        const done = m.progress >= d.goal;
        return `<div class="mission ${m.claimed ? 'claimed' : done ? 'done' : ''}"><div class="grow"><b>${t('mission.' + d.id, { n: d.goal })}</b>
          <div class="xpbar"><i style="width:${Math.round(100 * m.progress / d.goal)}%"></i></div><span class="muted small">${m.progress}/${d.goal} · +${d.coins} 🪙 · +${d.xp} XP</span></div>
          ${m.claimed ? `<span class="chip okc">${t('pro.claimed')}</span>` : `<button class="btn sm ${done ? 'gold' : ''}" data-claim="${d.id}" ${done ? '' : 'disabled'}>${t('pro.claim')}</button>`}</div>`;
      }).join('')}</div>`;
  } else if (tab === 'themes') {
    const item = (kind, x) => {
      const locked = lv < x.level, on = p.theme[kind] === x.id;
      const prev = kind === 'felt' ? `<div class="sw" style="background:radial-gradient(ellipse at center, ${x.a}, ${x.b} 85%)"></div>` : `<div class="sw backsw" data-back="${x.id}"><div class="card back"></div></div>`;
      return `<button class="theme ${on ? 'on' : ''} ${locked ? 'locked' : ''}" data-kind="${kind}" data-id="${x.id}" ${locked ? 'disabled' : ''}>${prev}<span>${t(kind + '.' + x.id)}</span>${locked ? `<small>${t('pro.locked', { n: x.level })}</small>` : ''}</button>`;
    };
    body = `<p class="muted small">${t('pro.themesHint')}</p><div class="eyebrow">${t('pro.felt')}</div><div class="themes">${THEMES.felt.map(x => item('felt', x)).join('')}</div>
      <div class="eyebrow">${t('pro.back')}</div><div class="themes">${THEMES.back.map(x => item('back', x)).join('')}</div>`;
  } else {
    body = `<div id="pro-board" class="board"><p class="muted">${S.online && S.status === 'online' ? t('pro.loading') : t('pro.boardOffline')}</p></div>`;
    if (S.online && S.status === 'online') { sendStats(); S.online.send('board'); }
  }
  const m = modal(`<div class="row between"><div class="eyebrow">${t('profile')}</div><button class="btn icon ghost sm" data-close>✕</button></div>
    <div class="seg tabs">${tabs}</div><div class="pro-body">${body}</div>`, { wide: true });
  $('[data-close]', m).onclick = closeModal;
  $('.tabs', m).onclick = e => { const b = e.target.closest('[data-tab]'); if (b) { sfx('tap'); profileDialog(b.dataset.tab); } };
  $('#pro-edit', m) && ($('#pro-edit', m).onclick = () => editProfile(false, () => profileDialog('me')));
  $('#gift', m) && ($('#gift', m).onclick = () => {
    const n = claimGift(p); if (!n) return;
    saveProfile(); sendStats(); sfx('win'); toast(`+${n} 🪙`); renderProfileChip(); profileDialog('daily');
  });
  $$('[data-claim]', m).forEach(b => { b.onclick = () => {
    const before = levelOf(p.xp), d = claimMission(p, b.dataset.claim); if (!d) return;
    saveProfile(); sendStats(); sfx('win'); toast(`+${d.coins} 🪙 · +${d.xp} XP`); renderProfileChip();
    if (levelOf(p.xp) > before) banner(t('pro.levelUp', { n: levelOf(p.xp) }));
    profileDialog('daily');
  }; });
  $$('.theme', m).forEach(b => { b.onclick = () => {
    if (!setTheme(p, b.dataset.kind, b.dataset.id)) return;
    saveProfile(); applyTheme(); sfx('tap'); profileDialog('themes');
  }; });
  $('#g-out', m) && ($('#g-out', m).onclick = () => {
    delete p.google; p.uid = migrateProfile({ name: p.name }).uid; saveProfile();
    sessionStorage.removeItem('rami.gcred');
    try { window.google && google.accounts.id.disableAutoSelect(); } catch {}
    connectOnline(); profileDialog('me');
  });
  if ($('#g-btn', m)) loadGoogle().then(() => {
    const n = $('#g-btn'); if (!n) return;
    google.accounts.id.renderButton(n, { theme: 'filled_black', size: 'large', shape: 'pill', text: 'signin_with', locale: lang() === 'tn' ? 'ar' : lang() });
  }).catch(() => {});
}

function renderBoard(m) {
  const n = $('#pro-board'); if (!n) return;
  if (!m.top.length) { n.innerHTML = `<p class="muted">${t('pro.boardEmpty')}</p>`; return; }
  n.innerHTML = `${m.you ? `<p class="muted small">${t('pro.pos', { n: m.you.pos, total: m.total })}</p>` : ''}
    <table class="results"><tbody>${m.top.map(e => {
      const rk = rankOf(e.level || 1);
      return `<tr class="${e.you ? 'mine' : ''}"><td class="pos">${e.pos <= 3 ? ['🥇', '🥈', '🥉'][e.pos - 1] : e.pos}</td>
        <td><div class="row" style="gap:8px">${avatar(e.avatar, rk.color, 'framed')}<b>${esc(e.name)}</b>${e.you ? ` <span class="chip">${t('pro.you')}</span>` : ''}</div></td>
        <td><span class="chip rank" style="--c:${rk.color}">${t('pro.lv', { n: e.level })}</span></td><td class="num">${fmt(e.wins)} 🏆</td><td class="num muted">${fmt(e.xp)} XP</td></tr>`;
    }).join('')}</tbody></table>`;
}

let gisLoading = null;
function loadGoogle() {
  if (!gisLoading) gisLoading = new Promise((ok, ko) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
    s.onload = () => {
      google.accounts.id.initialize({ client_id: S.googleId, callback: r => {
        sessionStorage.setItem('rami.gcred', r.credential);
        S.online && S.online.send('google', { credential: r.credential });
      } });
      ok();
    };
    s.onerror = ko;
    document.head.append(s);
  });
  return gisLoading;
}

function onGoogle(m) {
  if (!m.ok) { sessionStorage.removeItem('rami.gcred'); if ($('#g-btn')) toast(t('google.fail'), 'err'); return; }
  const fresh = !S.profile.google;
  if (m.profile && (m.profile.xp || 0) > (S.profile.xp || 0)) S.profile = migrateProfile(m.profile);
  S.profile.uid = m.uid;
  S.profile.google = m.name || true;
  saveProfile(); applyTheme(); renderProfileChip(); sendStats();
  if (fresh) { toast(t('google.ok')); if ($('.pro-body')) profileDialog('me'); }
}

window.addEventListener('DOMContentLoaded', () => { boot(); });
if (new URLSearchParams(location.search).has('debug')) window.__S = S;
export { rankLabel };
