// Card rendering: classic-looking playing cards with original artwork
// (standard pip layouts, illustrated double-headed court cards, a jester joker).
// All drawings are SVG symbols injected once in the page and reused with <use>.
import { isJoker, rankLabel, RED } from '../core/rules.js';

export const SUIT_PATH = {
  H: 'M50 90C22 68 4 52 4 31 4 16 15 6 28.5 6 38 6 45.5 11.5 50 20 54.5 11.5 62 6 71.5 6 85 6 96 16 96 31 96 52 78 68 50 90Z',
  D: 'M50 3 86 50 50 97 14 50Z',
  S: 'M50 4C61 22 95 38 95 61 95 75 84 83 72 83 63.5 83 57 79 53.5 72.5 54.5 83 58.5 90 67 96H33C41.5 90 45.5 83 46.5 72.5 43 79 36.5 83 28 83 16 83 5 75 5 61 5 38 39 22 50 4Z',
  C: 'M50 6a20 20 0 0 1 15.8 32.3A20 20 0 1 1 55 72c1 9 5 16 13 24H32c8-8 12-15 13-24a20 20 0 1 1-10.8-33.7A20 20 0 0 1 50 6Z',
};
export const SUIT_SVG = Object.fromEntries(Object.entries(SUIT_PATH).map(([k, d]) => [k, `<svg viewBox="0 0 100 100"><path d="${d}"/></svg>`]));
export const SUIT_NAME = { S: 'Pique', H: 'Coeur', D: 'Carreau', C: 'Trèfle' };

// pip positions (x %, y %) for 2..10, standard layouts; pips below the middle are drawn upside down
const PIPS = {
  2: [[50, 19], [50, 81]],
  3: [[50, 19], [50, 50], [50, 81]],
  4: [[31, 19], [69, 19], [31, 81], [69, 81]],
  5: [[31, 19], [69, 19], [50, 50], [31, 81], [69, 81]],
  6: [[31, 19], [69, 19], [31, 50], [69, 50], [31, 81], [69, 81]],
  7: [[31, 19], [69, 19], [50, 34.5], [31, 50], [69, 50], [31, 81], [69, 81]],
  8: [[31, 19], [69, 19], [50, 34.5], [31, 50], [69, 50], [50, 65.5], [31, 81], [69, 81]],
  9: [[31, 19], [69, 19], [31, 39.5], [69, 39.5], [50, 50], [31, 60.5], [69, 60.5], [31, 81], [69, 81]],
  10: [[31, 19], [69, 19], [50, 29.5], [31, 39.5], [69, 39.5], [31, 60.5], [69, 60.5], [50, 70.5], [31, 81], [69, 81]],
};

// ---------- court figures (original drawings) ----------
const INK = '#1d1a17', SKIN = '#f6d3ab', GOLD = '#e2a92f', GOLD2 = '#b9831b', CREAM = '#fff8e8';
function half(rank, c1, c2) {
  // upper half of a double-headed court card, viewBox 0 0 64 100 (drawn in 0..50)
  const head = `<circle cx="32" cy="23" r="7.4" fill="${SKIN}" stroke="${INK}" stroke-width=".9"/>
    <circle cx="29.3" cy="22.4" r=".85" fill="${INK}"/><circle cx="34.7" cy="22.4" r=".85" fill="${INK}"/>
    <path d="M30.2 26.6q1.8 1.1 3.6 0" fill="none" stroke="${INK}" stroke-width=".7" stroke-linecap="round"/>`;
  const robe = `<path d="M11 50 13 38q3-6 10-8 9 4 18 0 7 2 10 8l2 12Z" fill="${c1}" stroke="${INK}" stroke-width=".9"/>
    <path d="M27.5 31.5q4.5 1.6 9 0L35 50h-6Z" fill="${c2}" stroke="${INK}" stroke-width=".7"/>
    <path d="M17 50q1-7 5-11M47 50q-1-7-5-11" fill="none" stroke="${INK}" stroke-width=".6"/>
    <path d="M22 30q10 5 20 0l-1 3q-9 4.5-18 0Z" fill="${GOLD}" stroke="${INK}" stroke-width=".6"/>
    <g fill="${GOLD}">${[36, 40, 44, 48].map(y => `<circle cx="32" cy="${y}" r=".9"/>`).join('')}</g>
    <path d="M13 38q4 3 5 12M51 38q-4 3-5 12" fill="none" stroke="${GOLD2}" stroke-width="1.2"/>`;
  if (rank === 13) return `${robe}
    <path d="M24.6 25q-.6 8 7.4 9.6 8-1.6 7.4-9.6-1.6 3.4-7.4 3.4T24.6 25Z" fill="#6b4226" stroke="${INK}" stroke-width=".7"/>${head}
    <path d="M24 17 23 6l4.5 4.5L32 3l4.5 7.5L41 6l-1 11Z" fill="${GOLD}" stroke="${INK}" stroke-width=".9"/>
    <circle cx="32" cy="7.5" r="1.3" fill="${c1}"/><rect x="24" y="15" width="16" height="2.6" fill="${c2}" stroke="${INK}" stroke-width=".6"/>
    <path d="M51 12v32" stroke="#cfd6dd" stroke-width="2.4"/><path d="M51 12v32" stroke="${INK}" stroke-width=".5"/>
    <path d="M47 41h8M51 41v6" stroke="${GOLD}" stroke-width="2"/>`;
  if (rank === 12) return `${robe}
    <path d="M22 30q-2-13 10-16 12 3 10 16-3-9-10-9t-10 9Z" fill="#5a3418" stroke="${INK}" stroke-width=".7"/>${head}
    <path d="M24.5 16.5q7.5-5 15 0l-1.2-5-3 2.4L32 9l-3.3 4.9-3-2.4Z" fill="${GOLD}" stroke="${INK}" stroke-width=".8"/>
    <circle cx="32" cy="12.2" r="1.1" fill="${c2}"/>
    <path d="M13 26q-1-6 3-8" fill="none" stroke="#2f7a3a" stroke-width="1"/>
    <g transform="translate(13 16)">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-3" rx="2" ry="3" transform="rotate(${a})" fill="${c1 === '#c8312b' ? '#1f4e9c' : '#c8312b'}" stroke="${INK}" stroke-width=".4"/>`).join('')}<circle r="1.5" fill="${GOLD}"/></g>`;
  // jack
  return `${robe}
    <path d="M25 22q0-7 7-7.6 7 .6 7 7.6-2-4-7-4.2-5 .2-7 4.2Z" fill="#7b4a22" stroke="${INK}" stroke-width=".6"/>${head}
    <path d="M21 17.5q11-9 22 0-2 1.6-11 1.6T21 17.5Z" fill="${c2}" stroke="${INK}" stroke-width=".8"/>
    <path d="M38 14q8-9 14-6-6 1-10 8" fill="${GOLD}" stroke="${INK}" stroke-width=".6"/>
    <path d="M13 8v38" stroke="#8a5a2b" stroke-width="1.8"/><path d="M13 5l-3.5 6h7Z" fill="#cfd6dd" stroke="${INK}" stroke-width=".6"/>`;
}
function courtSymbol(rank, red) {
  const c1 = red ? '#c8312b' : '#1f4e9c', c2 = red ? '#1f4e9c' : '#c8312b';
  const id = `court-${rank}-${red ? 'r' : 'b'}`;
  return `<symbol id="${id}" viewBox="0 0 64 100">
    <rect x=".5" y=".5" width="63" height="99" rx="3" fill="${CREAM}" stroke="${GOLD2}" stroke-width="1"/>
    <g id="${id}-h">${half(rank, c1, c2)}</g>
    <use href="#${id}-h" transform="rotate(180 32 50)"/>
    <path d="M2 50h60" stroke="${GOLD2}" stroke-width=".8"/>
  </symbol>`;
}
const JOKER = `<symbol id="joker-art" viewBox="0 0 100 140">
  <path d="M50 30 30 8l-2 22M50 30 50 4M50 30 70 8l2 22" fill="none"/>
  <path d="M31 33Q27 14 14 10q10 9 9 25ZM69 33q4-19 17-23-10 9-9 25Z" fill="#2e8b57" stroke="${INK}" stroke-width="1.2"/>
  <path d="M33 33Q40 6 50 2q10 4 17 31Z" fill="#c8312b" stroke="${INK}" stroke-width="1.2"/>
  <circle cx="14" cy="10" r="3.6" fill="${GOLD}" stroke="${INK}"/><circle cx="50" cy="2.8" r="3.6" fill="${GOLD}" stroke="${INK}"/><circle cx="86" cy="10" r="3.6" fill="${GOLD}" stroke="${INK}"/>
  <path d="M29 33h42v5H29Z" fill="${GOLD}" stroke="${INK}"/>
  <circle cx="50" cy="48" r="11" fill="${SKIN}" stroke="${INK}" stroke-width="1.2"/>
  <circle cx="45.5" cy="46" r="1.4" fill="${INK}"/><circle cx="54.5" cy="46" r="1.4" fill="${INK}"/>
  <circle cx="42" cy="51" r="2.2" fill="#f19b8f" opacity=".7"/><circle cx="58" cy="51" r="2.2" fill="#f19b8f" opacity=".7"/>
  <path d="M44 52q6 5.5 12 0" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/>
  <path d="M30 62l5-4 5 4 5-4 5 4 5-4 5 4 5-4 5 4-5 5H35Z" fill="#fff" stroke="${INK}" stroke-width="1"/>
  <path d="M35 67h30l6 40H29Z" fill="#c8312b" stroke="${INK}" stroke-width="1.2"/>
  <path d="M50 67v40M35 67l15 20 15-20M29 107l21-20 21 20" fill="none" stroke="${INK}" stroke-width=".8"/>
  <path d="M35 67l15 20-21 20ZM65 67 50 87l21 20Z" fill="#2e8b57" stroke="${INK}" stroke-width="1"/>
  <path d="M35 70 18 86l4 4 15-12M65 70l17 16-4 4-15-12" fill="#2e8b57" stroke="${INK}" stroke-width="1"/>
  <circle cx="19" cy="89" r="4" fill="${SKIN}" stroke="${INK}"/><circle cx="81" cy="89" r="4" fill="${SKIN}" stroke="${INK}"/>
  <path d="M81 85V64" stroke="#8a5a2b" stroke-width="2"/><circle cx="81" cy="61" r="5" fill="${GOLD}" stroke="${INK}"/>
  <path d="M38 107l-3 22h9l3-22M62 107l3 22h-9l-3-22" fill="#c8312b" stroke="${INK}" stroke-width="1"/>
  <path d="M47 107l-3 22M53 107l3 22" fill="none"/>
  <path d="M33 129q-6 4-10 0 4-2 12-2ZM67 129q6 4 10 0-4-2-12-2Z" fill="${GOLD}" stroke="${INK}"/>
  <path d="M44 129h12" stroke="${INK}"/>
</symbol>`;

let spriteDone = false;
export function ensureSprite() {
  if (spriteDone || typeof document === 'undefined') return;
  spriteDone = true;
  const suits = Object.entries(SUIT_PATH).map(([k, d]) => `<symbol id="suit-${k}" viewBox="0 0 100 100"><path d="${d}"/></symbol>`).join('');
  const courts = [11, 12, 13].flatMap(r => [courtSymbol(r, true), courtSymbol(r, false)]).join('');
  const holder = document.createElement('div');
  holder.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">${suits}${courts}${JOKER}</svg>`;
  document.body.prepend(holder.firstChild);
}
if (typeof document !== 'undefined') {
  if (document.body) ensureSprite(); else document.addEventListener('DOMContentLoaded', ensureSprite);
}

const use = (id, cls = '', style = '') => `<svg class="${cls}" ${style ? `style="${style}"` : ''}><use href="#${id}"/></svg>`;

export function cardHTML(c, extra = '') {
  if (!c) return '';
  if (c.back) return `<div class="card back ${extra}"></div>`;
  // Cartes réalistes: Vectorized Playing Cards 1.3 (Chris Aguilar, LGPL-3, voir img/cards/),
  // joker dessiné pour Rami l Sbah.
  if (isJoker(c)) {
    const as = c.as ? `<span class="as ${RED[c.as.s] ? 'red' : ''}">${rankLabel(c.as.r)}${suitChar(c.as.s)}</span>` : '';
    return `<div class="card real joker ${extra}" data-id="${c.id}"><img src="img/cards/JOKER.svg" alt="Joker" draggable="false">${as}</div>`;
  }
  const red = RED[c.s] ? 'red' : '';
  const f = ({ 1: 'A', 10: 'T', 11: 'J', 12: 'Q', 13: 'K' }[c.r] || c.r) + c.s;
  return `<div class="card real ${red} ${extra}" data-id="${c.id}"><img src="img/cards/${f}.svg" alt="${rankLabel(c.r)}${suitChar(c.s)}" draggable="false"></div>`;
}

export const suitChar = s => ({ S: '♠', H: '♥', D: '♦', C: '♣' }[s] || '');
export const cardText = c => (isJoker(c) ? 'Joker' : rankLabel(c.r) + suitChar(c.s));

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export const LOGO = `<svg class="mark" viewBox="0 0 64 64" aria-hidden="true">
  <defs><linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe7ad"/><stop offset="1" stop-color="#e2ad4c"/></linearGradient>
  <linearGradient id="lg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a8ad3"/><stop offset="1" stop-color="#13508a"/></linearGradient></defs>
  <rect x="10" y="12" width="28" height="40" rx="5" transform="rotate(-14 24 32)" fill="url(#lg2)" stroke="#fff" stroke-width="2"/>
  <rect x="24" y="10" width="28" height="40" rx="5" transform="rotate(10 38 30)" fill="#fffdf8" stroke="url(#lg1)" stroke-width="2"/>
  <path transform="rotate(10 38 30) translate(29 19) scale(.18)" d="M50 4 61 25 86 14 75 39 98 50 75 61 86 86 61 75 50 98 39 75 14 86 25 61 2 50 25 39 14 14 39 25Z" fill="url(#lg1)"/>
  <text x="39" y="45" transform="rotate(10 38 30)" text-anchor="middle" font-family="Outfit, sans-serif" font-weight="800" font-size="11" fill="#d8322c">71</text>
</svg>`;
