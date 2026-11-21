// Card rendering (original artwork: suit glyphs, monogram faces, Tunisian-blue backs).
import { isJoker, rankLabel, RED } from '../core/rules.js';

export const SUIT_SVG = {
  H: '<svg viewBox="0 0 100 100"><path d="M50 90C22 68 4 52 4 31 4 16 15 6 28.5 6 38 6 45.5 11.5 50 20 54.5 11.5 62 6 71.5 6 85 6 96 16 96 31 96 52 78 68 50 90Z"/></svg>',
  D: '<svg viewBox="0 0 100 100"><path d="M50 3 86 50 50 97 14 50Z"/></svg>',
  S: '<svg viewBox="0 0 100 100"><path d="M50 4C61 22 95 38 95 61 95 75 84 83 72 83 63.5 83 57 79 53.5 72.5 54.5 83 58.5 90 67 96H33C41.5 90 45.5 83 46.5 72.5 43 79 36.5 83 28 83 16 83 5 75 5 61 5 38 39 22 50 4Z"/></svg>',
  C: '<svg viewBox="0 0 100 100"><circle cx="50" cy="27" r="20"/><circle cx="27" cy="57" r="20"/><circle cx="73" cy="57" r="20"/><path d="M45 52C45 76 40 88 31 96H69C60 88 55 76 55 52Z"/></svg>',
};
const STAR = '<svg viewBox="0 0 100 100"><path d="M50 2 61 25 86 14 75 39 98 50 75 61 86 86 61 75 50 98 39 75 14 86 25 61 2 50 25 39 14 14 39 25Z" fill="currentColor"/><circle cx="50" cy="50" r="17" fill="#fff6dc"/><circle cx="50" cy="50" r="9" fill="#d8322c"/></svg>';
export const SUIT_NAME = { S: 'Pique', H: 'Coeur', D: 'Carreau', C: 'Trèfle' };

export function cardHTML(c, extra = '') {
  if (!c) return '';
  if (c.back) return `<div class="card back ${extra}"></div>`;
  if (isJoker(c)) {
    const as = c.as ? `<span class="as ${RED[c.as.s] ? 'red' : ''}">${rankLabel(c.as.r)}${suitChar(c.as.s)}</span>` : '';
    return `<div class="card joker ${extra}" data-id="${c.id}"><div class="ix tl"><b>JOKER</b></div><div class="jk">${STAR}</div><div class="ix br"><b>JOKER</b></div>${as}</div>`;
  }
  const red = RED[c.s] ? 'red' : '';
  const lab = rankLabel(c.r);
  const center = c.r >= 11
    ? `<div class="face"><b>${lab}</b>${SUIT_SVG[c.s]}</div>`
    : `<div class="pip">${SUIT_SVG[c.s]}</div>`;
  return `<div class="card ${red} ${extra}" data-id="${c.id}"><div class="ix tl"><b>${lab}</b>${SUIT_SVG[c.s]}</div>${center}<div class="ix br"><b>${lab}</b>${SUIT_SVG[c.s]}</div></div>`;
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
