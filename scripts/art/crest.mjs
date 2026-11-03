// Generates the Fairway Atelier crest as a vector SVG (redrawn from the brand sheet).
// Usage: node crest.mjs <repoRoot> <out.svg>
import fs from 'node:fs';
import opentype from 'opentype.js';

const [root, out] = process.argv.slice(2);
const font = opentype.loadSync(`${root}/node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff`);

const BRASS = '#A07B47';
const BRASS_DEEP = '#86653A';
const GREEN = '#5F735B';
const GREEN_LIGHT = '#7A8B68';
const INK = '#2F3133';
const CREAM = '#FBF8F1';
const f = (n) => Math.round(n * 100) / 100;

// Shield
const shield = 'M98 54 H202 V126 C202 158 180 180 150 198 C120 180 98 158 98 126 Z';
const shieldInner = 'M104.5 60.5 H195.5 V125.5 C195.5 154 175.5 173.5 150 189.5 C124.5 173.5 104.5 154 104.5 125.5 Z';

// Crown: band with three fleuron points
const peaks = [[127, 33, 2.4], [138.5, 28, 2.6], [150, 20, 3.2], [161.5, 28, 2.6], [173, 33, 2.4]];
const crownPath = 'M125 46 ' + peaks.map(([x, y], i) => {
  const nx = peaks[i + 1]?.[0];
  return `L${x} ${y + 2.5}` + (nx ? ` Q${(x + nx) / 2} ${y + 13} ${nx} ${peaks[i + 1][1] + 2.5}` : '');
}).join(' ') + ' L175 46 Z';
const crown = [
  `<path d="${crownPath}" fill="${BRASS}"/>`,
  `<path d="M123.5 45 H176.5 V50.5 Q150 53 123.5 50.5 Z" fill="${BRASS_DEEP}"/>`,
  ...peaks.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${BRASS}"/>`),
  ...[133, 141.5, 150, 158.5, 167].map((x, i) => `<circle cx="${x}" cy="48" r="${i === 2 ? 1.5 : 1.1}" fill="${CREAM}"/>`),
].join('');

// Laurel branch: a curved stem with alternating leaves, mirrored for the right side.
function laurel(side) {
  const s = side === 'left' ? -1 : 1;
  // Quadratic stem from the base near the fleur-de-lis up and out around the shield.
  const P0 = [150 + s * 18, 212], P1 = [150 + s * 84, 200], P2 = [150 + s * 70, 66];
  const at = (t) => [(1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0], (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1]];
  const tangent = (t) => [2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]), 2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1])];
  const parts = [`<path d="M${P0} Q${P1} ${P2}" fill="none" stroke="${GREEN}" stroke-width="1.6" stroke-linecap="round"/>`];
  const n = 11;
  for (let i = 0; i < n; i++) {
    const t = 0.1 + (i / (n - 1)) * 0.86;
    const [x, y] = at(t);
    const [dx, dy] = tangent(t);
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    const size = 1 - t * 0.38; // leaves get smaller towards the tip
    for (const k of [-1, 1]) {
      const rot = ang + k * 38;
      const len = 9.5 * size;
      // Leaf: pointed ellipse offset from the stem along its direction.
      const ox = x + Math.cos((rot * Math.PI) / 180) * len * 0.95;
      const oy = y + Math.sin((rot * Math.PI) / 180) * len * 0.95;
      const fill = (i + (k > 0 ? 1 : 0)) % 2 ? GREEN : GREEN_LIGHT;
      parts.push(
        `<path transform="translate(${f(ox)} ${f(oy)}) rotate(${f(rot)})" d="M${f(-len)} 0 Q0 ${f(-len * 0.42)} ${f(len)} 0 Q0 ${f(len * 0.42)} ${f(-len)} 0 Z" fill="${fill}"/>`,
      );
    }
  }
  // Tip leaf
  const [tx, ty] = at(1);
  const [dx, dy] = tangent(1);
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  parts.push(`<path transform="translate(${f(tx)} ${f(ty)}) rotate(${f(ang)})" d="M-2 0 Q4 -3.2 9 0 Q4 3.2 -2 0 Z" fill="${GREEN}"/>`);
  return parts.join('');
}

// Fleur-de-lis under the shield
const fleur = `<g transform="translate(150 214)" fill="${BRASS}">
  <path d="M0 -15 C5 -9 5.5 -3 0 3 C-5.5 -3 -5 -9 0 -15 Z"/>
  <path d="M-1.5 2 C-6 -1 -11 -1 -12 -6 C-13.5 -10 -9 -12 -7 -9 C-8.5 -8.6 -9 -6.8 -7.6 -5.4 C-5.4 -3.4 -3 -1 -1.5 2 Z"/>
  <path d="M1.5 2 C6 -1 11 -1 12 -6 C13.5 -10 9 -12 7 -9 C8.5 -8.6 9 -6.8 7.6 -5.4 C5.4 -3.4 3 -1 1.5 2 Z"/>
  <rect x="-7" y="2.2" width="14" height="2.6" rx="1.3"/>
  <path d="M-2 4.8 C-2.5 8 -4.5 10 -7 10.5 L0 13 L7 10.5 C4.5 10 2.5 8 2 4.8 Z"/>
</g>`;

// Monogram: F above-left, A below-right, overlapping like the brand sheet.
const glyph = (ch, x, y, size) => font.getPath(ch, x, y, size).toPathData(2);
const monogram = `<path d="${glyph('F', 113, 132, 66)}" fill="${INK}"/><path d="${glyph('A', 131, 166, 66)}" fill="${INK}"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 8 220 222" width="220" height="222" role="img" aria-label="Fairway Atelier crest">
${laurel('left')}${laurel('right')}
<path d="${shield}" fill="${CREAM}" stroke="${BRASS}" stroke-width="3.2" stroke-linejoin="round"/>
<path d="${shieldInner}" fill="none" stroke="${BRASS}" stroke-width="0.9" opacity="0.75"/>
${crown}
${monogram}
${fleur}
</svg>
`;
fs.writeFileSync(out, svg);
console.log('wrote', out, svg.length, 'bytes');
