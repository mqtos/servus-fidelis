// Authoring aid, not shipped. Overlays a numbered percentage grid on a chart candidate so
// region bounds and world positions can be read straight off the painting in the same
// coordinate space the content files use.
//
//   node scripts/map-grid.mjs map_chart_b            whole chart
//   node scripts/map-grid.mjs map_chart_b 0 40 50 50 crop x y w h, in percent

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [id, ...rest] = process.argv.slice(2);
const crop = rest.length === 4 ? rest.map(Number) : null;

const source = join(ROOT, 'art-raw', `${id}.png`);
const meta = await sharp(source).metadata();

const region = crop ?? [0, 0, 100, 100];
const [rx, ry, rw, rh] = region;
const pipeline = sharp(source).extract({
  left: Math.round((meta.width * rx) / 100),
  top: Math.round((meta.height * ry) / 100),
  width: Math.round((meta.width * rw) / 100),
  height: Math.round((meta.height * rh) / 100),
});

const OUT_W = 1500;
const W = OUT_W;
const H = Math.round((OUT_W * meta.height * rh) / (meta.width * rw));

// Every 5 percent of the whole chart, so a crop keeps the same numbers as the overview.
const step = 5;
const marks = [];
for (let v = Math.ceil(rx / step) * step; v <= rx + rw; v += step) {
  const x = ((v - rx) / rw) * W;
  const major = v % 10 === 0;
  marks.push(
    `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#ff1f6b" stroke-width="${major ? 1.8 : 0.7}" stroke-opacity="${major ? 0.9 : 0.4}"/>`,
    major
      ? `<text x="${x + 4}" y="20" font-size="18" font-family="monospace" fill="#ff1f6b">${v}</text>`
      : '',
  );
}
for (let v = Math.ceil(ry / step) * step; v <= ry + rh; v += step) {
  const y = ((v - ry) / rh) * H;
  const major = v % 10 === 0;
  marks.push(
    `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#ff1f6b" stroke-width="${major ? 1.8 : 0.7}" stroke-opacity="${major ? 0.9 : 0.4}"/>`,
    major
      ? `<text x="4" y="${y - 5}" font-size="18" font-family="monospace" fill="#ff1f6b">${v}</text>`
      : '',
  );
}

const svg = Buffer.from(
  `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${marks.join('')}</svg>`,
);

const out = join(ROOT, 'art-raw', 'map', `grid_${id}${crop ? `_${rx}_${ry}` : ''}.png`);
const info = await sharp(await pipeline.resize({ width: W }).toBuffer())
  .composite([{ input: svg }])
  .png()
  .toFile(out);
console.log(`${out} ${info.width}x${info.height}`);
