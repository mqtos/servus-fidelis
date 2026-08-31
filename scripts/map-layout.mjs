// Calibration of the sector onto the painted chart. Authoring-time only.
//
//   node scripts/map-layout.mjs           render art-raw/map/layout.png to check by eye
//   node scripts/map-layout.mjs --apply   write the coordinates into the content YAML
//
// The painting is the source of truth for where things are, and it was generated before
// any of these numbers existed, so every coordinate below was read off the image and then
// checked by rendering it back onto the image. Placing forty markers on a painting by
// arithmetic alone does not work: an island is a shape, not a bounding box.
//
// Coordinates are percentages of the chart, x then y, matching the content schema and the
// percentage anchoring in SectorMap. They are meaningless against any other painting: if
// sector_chart.webp is ever regenerated, this file has to be redone against the new one.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'node:fs';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHART = join(ROOT, 'art-raw', 'map_chart_b.png');

// Bounds are the region's footprint on the paper. They are what the sealed-region veil is
// drawn from, so they want to be generous enough to cover the whole island group with a
// margin of water: a veil that stops exactly at a coastline looks like a cut-out.
const REGIONS = {
  // The big ragged crescent filling the lower left. The largest landmass on the chart,
  // which is right for the six hive worlds the rest of the sector is recruited from.
  region_gathral_sprawl: { x: 6, y: 44, width: 38, height: 49 },
  // The mountainous arrowhead island in the upper left, drawn with the heaviest relief
  // hatching on the chart. Forge worlds want ore under them.
  region_hesperine_forgeworks: { x: 12, y: 9, width: 22, height: 29 },
  // The long broken chain running diagonally through the middle. Nine islands for six
  // worlds, so the belt reads as a belt and not as a row.
  region_varn_belt: { x: 32, y: 19, width: 25, height: 48 },
  // The scatter of small jagged isles across the top right.
  region_ambrosian_reach: { x: 55, y: 8, width: 22, height: 23 },
  // The broad rounded mass low and right of centre, plus the islet off its south coast.
  region_kolvar_deeps: { x: 48, y: 59, width: 31, height: 32 },
  // One island and a great deal of nothing. This is not an oversight in the calibration:
  // four of its six worlds are a salvage, a last survey and two other dead things, and a
  // region called The Silent Marches earns the empty water it sits in.
  region_silent_marches: { x: 61, y: 32, width: 20, height: 29 },
  // The far right, where the painting simply stops drawing. No land at all, which is the
  // point: the Cartography Corps ran out of chart, and the four positions holding the
  // sector's doorway are marks on blank vellum.
  region_blank_chart: { x: 81, y: 28, width: 13, height: 35 },
};

// Void stations, and anything the fiction says is a hulk, a gate or an anchorage, sit in
// open water on purpose. A station painted onto an island is a town.
const WORLDS = {
  // Gathral Sprawl. Horn at the top, long body down the west, arm running east along the
  // bottom, and the bay in the middle of the crescent is water.
  campaign_01_gathral_secundus: { x: 15, y: 64 },
  campaign_02_orvine_tertius: { x: 22, y: 51 },
  campaign_03_calpurn_reduction: { x: 13, y: 57 },
  campaign_04_shale_concessions: { x: 36, y: 84 },
  campaign_05_ippolit_majoris: { x: 26, y: 82 },
  campaign_06_ninth_cordon: { x: 31, y: 66 },

  // Hesperine Forgeworks. The island is an arrowhead: narrow at the top, widening to a
  // west-pointing tip at y 21, so nothing sits left of x 21 above y 18.
  campaign_07_hesperine_forge: { x: 21, y: 22 },
  campaign_08_anvil_nine: { x: 24, y: 13.5 },
  campaign_09_tal_voren: { x: 27, y: 18 },
  campaign_10_pellucid_cut: { x: 16.5, y: 21 },
  campaign_11_slagfall_station: { x: 31, y: 12 },
  campaign_12_machris_compliance: { x: 24, y: 27 },

  // Varn Belt, north-east end down to the south-west end.
  campaign_13_varn_agri_belt: { x: 50, y: 32 },
  campaign_14_pellun_threshing: { x: 47, y: 41 },
  campaign_15_ostmere_fields: { x: 36, y: 56 },
  campaign_16_bellick_reach: { x: 41.5, y: 54 },
  campaign_17_kethis_minor: { x: 38, y: 63 },
  campaign_18_granary_vekh: { x: 55, y: 40 },

  // Ambrosian Reach. The cluster is nine small isles with a lot of water between them, so
  // these are one to an island rather than spread over a mass.
  campaign_19_saint_ambrose: { x: 57.5, y: 15 },
  campaign_20_candlemarch: { x: 64, y: 12 },
  campaign_21_ossuary_vess: { x: 69, y: 16 },
  campaign_22_saint_iolanthe: { x: 65, y: 21.5 },
  campaign_23_sanctus_vool: { x: 70, y: 26 },
  campaign_24_corvain_exhumation: { x: 58, y: 26.5 },

  // Kolvar Deeps.
  campaign_25_kolvar_deeps: { x: 60, y: 72 },
  campaign_26_brannoch_claim: { x: 55, y: 66 },
  campaign_27_tessaly_nine: { x: 65, y: 67 },
  campaign_28_orrenhal_descent: { x: 63, y: 78 },
  campaign_29_freehold_tarrant: { x: 74, y: 84 },
  campaign_30_marrow_reclamation: { x: 54, y: 76 },

  // Silent Marches. One island, and it is small: only the two feral worlds are on it, at
  // opposite ends, and Bell Coast sits against its south-west shore. The other three are
  // marks on open water, which is what the region is.
  campaign_31_ushanek: { x: 71.5, y: 53 },
  campaign_33_ekkard_wold: { x: 74, y: 57.5 },
  campaign_34_bell_coast: { x: 70.5, y: 59.5 },
  campaign_32_ashlin_salvage: { x: 65, y: 44 },
  campaign_35_sarnhold_ambit: { x: 65, y: 36 },
  campaign_36_last_survey_of_ildrash: { x: 77, y: 45 },

  // Blank Chart.
  campaign_37_cadence_gate: { x: 86, y: 33 },
  campaign_38_irrec_bastion: { x: 90, y: 44 },
  campaign_39_quillon_anchorage: { x: 84, y: 49 },
  campaign_40_thennik_vaults: { x: 88, y: 58 },
};

// `file` is relative to the repo root. globSync hands back OS-native separators, so
// nothing here may assume a forward slash.
function patch(file, key, value) {
  const path = join(ROOT, file);
  const before = readFileSync(path, 'utf8');
  const line = `${key}: { ${Object.entries(value)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')} }`;
  const after = before.replace(new RegExp(`^${key}:.*$`, 'm'), line);
  if (after === before) throw new Error(`${file}: no ${key} line changed`);
  writeFileSync(path, after);
}

if (process.argv.includes('--apply')) {
  const regionFiles = globSync('content/regions/*.yaml', { cwd: ROOT });
  const campaignFiles = globSync('content/campaigns/*.yaml', { cwd: ROOT });

  for (const [id, bounds] of Object.entries(REGIONS)) {
    const file = regionFiles.find((f) => readFileSync(join(ROOT, f), 'utf8').includes(`id: ${id}\n`));
    if (!file) throw new Error(`no region file for ${id}`);
    patch(file, 'bounds', bounds);
  }
  for (const [id, position] of Object.entries(WORLDS)) {
    const file = campaignFiles.find((f) => f.includes(id));
    if (!file) throw new Error(`no campaign file for ${id}`);
    patch(file, 'position', position);
  }
  console.log(
    `applied ${Object.keys(REGIONS).length} region bounds and ${Object.keys(WORLDS).length} world positions.`,
  );
} else {
  const W = 1500;
  const meta = await sharp(CHART).metadata();
  const H = Math.round((W * meta.height) / meta.width);
  const px = (v) => (v / 100) * W;
  const py = (v) => (v / 100) * H;

  const parts = [];
  for (const [id, b] of Object.entries(REGIONS)) {
    parts.push(
      `<rect x="${px(b.x)}" y="${py(b.y)}" width="${px(b.width)}" height="${py(b.height)}" fill="#00b7ff" fill-opacity="0.10" stroke="#00b7ff" stroke-width="2"/>`,
      `<text x="${px(b.x) + 6}" y="${py(b.y) + 22}" font-size="19" font-family="monospace" fill="#0077aa">${id.replace('region_', '')}</text>`,
    );
  }
  for (const [id, p] of Object.entries(WORLDS)) {
    const short = id.replace(/^campaign_\d+_/, '');
    parts.push(
      `<circle cx="${px(p.x)}" cy="${py(p.y)}" r="7" fill="#ff1f6b" stroke="#ffffff" stroke-width="2"/>`,
      `<text x="${px(p.x) + 11}" y="${py(p.y) + 5}" font-size="16" font-family="monospace" stroke="#ffffff" stroke-width="3.5" paint-order="stroke" fill="#c40040">${short}</text>`,
    );
  }

  // Emitted so map-check can tile the same coordinates without a second copy of them.
  writeFileSync(
    join(ROOT, 'art-raw', 'map', 'layout.json'),
    `${JSON.stringify({ regions: REGIONS, worlds: WORLDS }, null, 2)}\n`,
  );

  const svg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`);
  const out = join(ROOT, 'art-raw', 'map', 'layout.png');
  await sharp(await sharp(CHART).resize({ width: W }).toBuffer())
    .composite([{ input: svg }])
    .png()
    .toFile(out);
  console.log(out);
}
