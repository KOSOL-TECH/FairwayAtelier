// Pencil-style line drawing of a coastal Belle Époque villa, for the Home hero.
// Usage: node villa.mjs <repoRoot> <outDir>  → villa-right.svg, villa-left.svg
// The left version mirrors the drawing but keeps the signature readable.
import fs from 'node:fs';
import opentype from 'opentype.js';

const [root, outDir] = process.argv.slice(2);
const serif = opentype.loadSync(`${root}/node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff`);
const sans = opentype.loadSync(`${root}/node_modules/@fontsource/montserrat/files/montserrat-latin-500-normal.woff`);

const W = 420, H = 380;
const INK = '#6F6A5E';
const BRASS = '#A07B47';
const r2 = (n) => Math.round(n * 10) / 10;

// Seeded PRNG so the drawing is stable between runs.
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const j = (amt) => (rnd() - 0.5) * amt;

const lines = [];
/** A hand-drawn line: slightly wobbly, drawn once (or twice for emphasis). */
function line(x1, y1, x2, y2, w = 0.9, passes = 1) {
  for (let p = 0; p < passes; p++) {
    const mx = (x1 + x2) / 2 + j(1.2), my = (y1 + y2) / 2 + j(1.2);
    lines.push({ d: `M${r2(x1 + j(0.8))} ${r2(y1 + j(0.8))} Q${r2(mx)} ${r2(my)} ${r2(x2 + j(0.8))} ${r2(y2 + j(0.8))}`, w: w * (p ? 0.6 : 1) });
  }
}
const path = (d, w = 0.9) => lines.push({ d, w });
const rect = (x, y, w, h, sw = 0.9) => { line(x, y, x + w, y, sw); line(x + w, y, x + w, y + h, sw); line(x + w, y + h, x, y + h, sw); line(x, y + h, x, y, sw); };
/** Arched window with a few shading strokes inside. */
function archWindow(x, y, w, h, shade = true) {
  const r = w / 2;
  path(`M${x} ${y + h} V${y + r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h}`, 0.8);
  line(x - 1.5, y + h, x + w + 1.5, y + h, 0.9);
  if (shade) for (let k = 1; k < 4; k++) line(x + (w * k) / 4, y + r * 0.6 + j(2), x + (w * k) / 4 - 1, y + h - 1, 0.45);
}
function hatch(x, y, w, h, step = 4, slope = 0.6, sw = 0.4) {
  for (let i = 0; i < w + h * slope; i += step) {
    const x1 = x + i, y1 = y + h;
    const x2 = x1 - h * slope, y2 = y;
    line(Math.max(x, Math.min(x + w, x1)), x1 > x + w ? y + h - (x1 - x - w) / slope : y1, Math.max(x, x2), x2 < x ? y + (x - x2) / slope : y2, sw);
  }
}
/** Cypress: tall flame silhouette with inner strokes. */
function cypress(cx, base, height, width) {
  const top = base - height;
  path(`M${cx} ${top} C${cx + width * 0.55} ${top + height * 0.25} ${cx + width * 0.6} ${base - height * 0.2} ${cx + width * 0.25} ${base} L${cx - width * 0.25} ${base} C${cx - width * 0.6} ${base - height * 0.2} ${cx - width * 0.55} ${top + height * 0.25} ${cx} ${top} Z`, 0.9);
  for (let k = 0; k < height / 6; k++) {
    const y = top + 8 + k * 6, half = width * 0.45 * Math.sin(Math.min(1, (y - top) / height) * Math.PI * 0.9);
    line(cx - half * 0.7 + j(2), y + 2, cx + half * 0.5 + j(2), y - 2, 0.45);
  }
  line(cx, base, cx, base + 6, 0.8);
}
/** Foliage: a dense scribble of small leaf-arcs, shaded towards the lower right. */
function shrub(cx, cy, rx, ry, density = 1) {
  const n = Math.round(rx * ry * 0.09 * density);
  for (let k = 0; k < n; k++) {
    const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd());
    const x = cx + Math.cos(a) * rx * rr, y = cy + Math.sin(a) * ry * rr;
    const shade = (x - cx) / rx * 0.5 + (y - cy) / ry * 0.5; // -1..1, lower right is darker
    if (rnd() < 0.35 - shade * 0.3) continue;
    const sz = 2.2 + rnd() * 2.2;
    path(`M${r2(x - sz)} ${r2(y)} q${r2(sz)} ${r2(-sz * (0.8 + rnd() * 0.5))} ${r2(sz * 2)} 0`, 0.45 + Math.max(0, shade) * 0.25);
  }
  // Soft outline along the top edge
  path(`M${r2(cx - rx)} ${r2(cy + ry * 0.3)} C${r2(cx - rx)} ${r2(cy - ry * 1.1)} ${r2(cx + rx)} ${r2(cy - ry * 1.1)} ${r2(cx + rx)} ${r2(cy + ry * 0.3)}`, 0.35);
}

// --- Background: sea horizon and distant headland
line(0, 96, 150, 96, 0.6);
path('M0 96 C30 84 60 80 92 86 C110 89 124 92 140 96', 0.6);
for (let k = 0; k < 6; k++) line(8 + k * 22, 104 + j(3), 26 + k * 22, 104 + j(3), 0.35);

// --- Main villa
const vx = 150, vy = 132, vw = 150, vh = 108;
rect(vx, vy, vw, vh, 1.1);
// Hipped roof with overhang and cornice
path(`M${vx - 10} ${vy} L${vx + 22} ${vy - 26} L${vx + vw - 22} ${vy - 26} L${vx + vw + 10} ${vy} Z`, 1.1);
line(vx - 10, vy + 4, vx + vw + 10, vy + 4, 0.7);
for (let k = 0; k < 14; k++) line(vx - 4 + k * 11.5, vy, vx + 6 + k * 11.5, vy - 22, 0.35);
// Belvedere tower
const tx = vx + 52, tw = 46;
rect(tx, vy - 62, tw, 36, 1);
path(`M${tx - 6} ${vy - 62} L${tx + tw / 2} ${vy - 80} L${tx + tw + 6} ${vy - 62} Z`, 1);
for (let k = 0; k < 3; k++) archWindow(tx + 6 + k * 13, vy - 55, 8, 22);
// Upper floors: arched windows with shutters
for (let row = 0; row < 2; row++) {
  for (let k = 0; k < 6; k++) {
    const x = vx + 12 + k * 22.5, y = vy + 12 + row * 32;
    archWindow(x, y, 11, 22);
    line(x - 4, y + 4, x - 4, y + 22, 0.5);
    line(x + 15, y + 4, x + 15, y + 22, 0.5);
  }
  line(vx, vy + 40 + row * 32, vx + vw, vy + 40 + row * 32, 0.5);
}
// Ground-floor loggia
for (let k = 0; k < 5; k++) archWindow(vx + 14 + k * 26, vy + 76, 18, 32, true);
// Shadow side
hatch(vx + vw - 18, vy + 6, 18, vh - 6, 3.5, 0.5, 0.35);

// --- Side wing
const wx = 92, wy = 168, ww = 58, wh = 72;
rect(wx, wy, ww, wh, 1);
path(`M${wx - 8} ${wy} L${wx + 14} ${wy - 18} L${wx + ww} ${wy - 18} L${wx + ww} ${wy} Z`, 1);
for (let k = 0; k < 2; k++) { archWindow(wx + 10 + k * 22, wy + 12, 11, 20); archWindow(wx + 10 + k * 22, wy + 42, 11, 22); }
hatch(wx, wy + 2, 10, wh - 2, 3.5, 0.5, 0.35);

// --- Trees
cypress(128, 246, 150, 18);
cypress(320, 250, 168, 20);
cypress(342, 256, 120, 16);
shrub(300, 246, 26, 12, 1.1);

// --- Terrace wall with balustrade
line(60, 250, 360, 250, 1.1);
line(60, 262, 360, 262, 0.8);
for (let x = 66; x < 356; x += 8) line(x, 252, x, 261, 0.45);
line(60, 266, 360, 266, 0.6);

// --- Hillside falling to the sea: irregular garden terraces, stone walls, foliage and stipple
for (let k = 0; k < 4; k++) {
  const y = 284 + k * 21, x1 = 74 + k * 10 + j(8), x2 = 346 - k * 12 + j(8);
  path(`M${r2(x1)} ${r2(y)} C${r2(x1 + 80)} ${r2(y - 4 + j(4))} ${r2(x2 - 80)} ${r2(y + 4 + j(4))} ${r2(x2)} ${r2(y + j(3))}`, 0.55);
  for (let x = x1 + 6; x < x2 - 6; x += 9 + rnd() * 6) line(x, y + 2, x + 3 + j(2), y + 6 + rnd() * 3, 0.3);
}
for (let k = 0; k < 160; k++) { const x = 60 + rnd() * 300, y = 272 + rnd() * 96; lines.push({ d: `M${r2(x)} ${r2(y)} h0.6`, w: 0.6 }); }
shrub(70, 222, 40, 32, 1.2); shrub(372, 236, 34, 28, 1.2);
shrub(118, 300, 30, 14); shrub(258, 318, 34, 15); shrub(176, 346, 38, 15); shrub(318, 340, 26, 12);

// --- Signature: FA monogram and "FAIRWAY ATELIER", in brass, small
function signature(alignRight) {
  const fa = serif.getPath('FA', 0, 0, 15);
  const bbFa = fa.getBoundingBox();
  const word = sans.getPath('FAIRWAY ATELIER', 0, 0, 5.2, { letterSpacing: 0.18 });
  const bbW = word.getBoundingBox();
  const total = (bbFa.x2 - bbFa.x1) + 5 + (bbW.x2 - bbW.x1);
  const x0 = alignRight ? W - 14 - total : 14;
  const y0 = H - 12;
  const faPath = serif.getPath('FA', x0 - bbFa.x1, y0, 15).toPathData(2);
  const wordX = x0 + (bbFa.x2 - bbFa.x1) + 5 - bbW.x1;
  const wordPath = sans.getPath('FAIRWAY ATELIER', wordX, y0 - 4, 5.2, { letterSpacing: 0.18 }).toPathData(2);
  return `<g fill="${BRASS}"><path d="${faPath}"/><path d="${wordPath}"/></g>` +
    `<path d="M${r2(x0 + (bbFa.x2 - bbFa.x1) + 1.5)} ${y0 - 12} V${y0 + 1}" stroke="${BRASS}" stroke-width="0.5"/>`;
}

const strokes = lines.map((l) => `<path d="${l.d}" stroke-width="${l.w}"/>`).join('');
const drawing = `<g fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">${strokes}</g>`;
const svg = (mirror, sig) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">` +
  (mirror ? `<g transform="translate(${W} 0) scale(-1 1)">${drawing}</g>` : drawing) + sig + `</svg>\n`;

// The right-hand copy sits at the page's right edge: signature bottom-right. The left copy mirrors it.
fs.writeFileSync(`${outDir}/villa-right.svg`, svg(false, signature(true)));
fs.writeFileSync(`${outDir}/villa-left.svg`, svg(true, signature(false)));
console.log('villa strokes:', lines.length);
