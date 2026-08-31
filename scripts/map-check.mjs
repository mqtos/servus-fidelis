// Authoring aid. Crops a small square of the painting around every world position and
// tiles them, so each marker can be checked against what is actually under it. Reading
// forty pins off one full-size overview does not work: the pin is four pixels wide by the
// time the whole chart fits on screen, and "is this ochre land or grey-green water" is
// exactly the distinction that disappears first.
//
//   node scripts/map-check.mjs 0     first half
//   node scripts/map-check.mjs 1     second half

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// map-layout writes this out alongside its preview, so the coordinate table has exactly
// one definition and this script cannot drift from it.
const layout = JSON.parse(readFileSync(join(ROOT, 'art-raw', 'map', 'layout.json'), 'utf8'));

const half = Number(process.argv[2] ?? 0);
const SPAN = 9; // percent of chart width covered by each tile
const TILE = 210;
const COLS = 5;

const CHART = join(ROOT, 'art-raw', 'map_chart_b.png');
const meta = await sharp(CHART).metadata();

const ids = Object.keys(layout.worlds);
const slice = ids.slice(half * 20, half * 20 + 20);
const rows = Math.ceil(slice.length / COLS);

const tiles = [];
const marks = [];
for (const [index, id] of slice.entries()) {
  const p = layout.worlds[id];
  const w = Math.round((meta.width * SPAN) / 100);
  const h = w;
  const left = Math.round((meta.width * p.x) / 100 - w / 2);
  const top = Math.round((meta.height * p.y) / 100 - h / 2);
  const buffer = await sharp(CHART)
    .extract({
      left: Math.max(0, Math.min(left, meta.width - w)),
      top: Math.max(0, Math.min(top, meta.height - h)),
      width: w,
      height: h,
    })
    .resize({ width: TILE, height: TILE })
    .toBuffer();
  const cx = (index % COLS) * TILE;
  const cy = Math.floor(index / COLS) * TILE;
  tiles.push({ input: buffer, left: cx, top: cy });
  const mx = cx + TILE / 2;
  const my = cy + TILE / 2;
  marks.push(
    `<line x1="${mx - 16}" y1="${my}" x2="${mx + 16}" y2="${my}" stroke="#ff1f6b" stroke-width="3"/>`,
    `<line x1="${mx}" y1="${my - 16}" x2="${mx}" y2="${my + 16}" stroke="#ff1f6b" stroke-width="3"/>`,
    `<circle cx="${mx}" cy="${my}" r="5" fill="none" stroke="#ff1f6b" stroke-width="3"/>`,
    `<rect x="${cx}" y="${cy}" width="${TILE}" height="${TILE}" fill="none" stroke="#00b7ff" stroke-width="2"/>`,
    `<text x="${cx + 6}" y="${cy + 20}" font-size="17" font-family="monospace" stroke="#ffffff" stroke-width="4" paint-order="stroke" fill="#0a2f4a">${id.replace(/^campaign_\d+_/, '')}</text>`,
  );
}

const W = COLS * TILE;
const H = rows * TILE;
const svg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${marks.join('')}</svg>`);
const out = join(ROOT, 'art-raw', 'map', `check_${half}.png`);
await sharp({ create: { width: W, height: H, channels: 3, background: '#000' } })
  .composite([...tiles, { input: svg }])
  .png()
  .toFile(out);
console.log(out, `${W}x${H}`);
