// Authoring-time asset generation. Never runs in the browser and never ships: the app
// only ever loads the resulting files out of /public/art.
//
//   node scripts/generate-art.mjs --set phase1            generate the Phase 1 batch
//   node scripts/generate-art.mjs --set phase1 --dry-run  print planned spend, call nothing
//   node scripts/generate-art.mjs --set phase1 --force    regenerate files that exist
//
// A running total is kept in scripts/art-spend.json and the script refuses to start a
// request that would push the total past the cap, so a bad loop cannot drain the budget.
//
// The model returns multi-megabyte PNGs. Those are kept out of the bundle in art-raw/
// so a re-encode never costs another API call, and only the WebP derivative ships.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { mapJobs, phase1Jobs, probeJobs } from './art-manifest.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Shipped art lives in src/ rather than public/ so Vite hashes it and a missing file
// is a build error instead of a 404 at runtime.
const OUT_DIR = join(ROOT, 'src', 'assets', 'art');
const RAW_DIR = join(ROOT, 'art-raw');
const LEDGER = join(ROOT, 'scripts', 'art-spend.json');

// Full-bleed on a 1440p display, and still sharp on a 2x laptop panel.
const SHIP_WIDTH = 2560;
const WEBP_QUALITY = 80;

const MODEL = 'gemini-3-pro-image';
// Full-bleed backgrounds are the whole presentation now, so the batch is generated at
// 4K and downsampled on the way out rather than generated at display size.
const IMAGE_SIZE = process.env.ART_SIZE ?? '4K';

// USD per generated image, from ai.google.dev/gemini-api/docs/pricing, checked 2026-08-24.
// Verify before switching model: these are the numbers the budget cap is built on.
const PRICE_PER_IMAGE = {
  'gemini-3-pro-image': { '1K': 0.134, '2K': 0.134, '4K': 0.24 },
  'gemini-3.1-flash-image': { '1K': 0.067, '2K': 0.101, '4K': 0.151 },
  'gemini-3.1-flash-lite-image': { '1K': 0.0336 },
  'gemini-2.5-flash-image': { '1K': 0.039 },
};

// EUR 20 at a deliberately pessimistic rate, so the cap binds before the wallet does.
const BUDGET_USD = Number(process.env.ART_BUDGET_USD ?? 22);

const SETS = { probe: probeJobs, phase1: phase1Jobs, map: mapJobs };

// Sets that produce candidates to choose between rather than assets to ship. Their WebPs
// stay out of src/ so import.meta.glob does not bundle every rejected direction into the
// build; the winner is copied across by hand once it has been picked.
const SCRATCH_SETS = new Set(['probe', 'map']);

function readKey() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) throw new Error('.env not found');
  const match = readFileSync(envPath, 'utf8').match(/^GEMINI_API_KEY=(.*)$/m);
  const key = match?.[1]?.trim();
  if (!key) throw new Error('GEMINI_API_KEY is empty in .env');
  return key;
}

function readLedger() {
  if (!existsSync(LEDGER)) return { spentUsd: 0, images: 0, runs: [] };
  return JSON.parse(readFileSync(LEDGER, 'utf8'));
}

function writeLedger(ledger) {
  writeFileSync(LEDGER, `${JSON.stringify(ledger, null, 2)}\n`);
}

function unitPrice() {
  const price = PRICE_PER_IMAGE[MODEL]?.[IMAGE_SIZE];
  if (price === undefined) throw new Error(`No price known for ${MODEL} at ${IMAGE_SIZE}`);
  return price;
}

async function generate(key, job) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: job.prompt }] }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: { aspectRatio: job.aspectRatio ?? '16:9', imageSize: IMAGE_SIZE },
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status}: ${body.replaceAll(key, '[REDACTED]').slice(0, 400)}`);
  }

  const payload = await response.json();
  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  const image = parts.find((part) => part.inlineData?.data);
  if (!image) {
    const reason = payload.candidates?.[0]?.finishReason ?? 'no inlineData in response';
    throw new Error(`No image returned (${reason})`);
  }
  return Buffer.from(image.inlineData.data, 'base64');
}

async function encode(id, outDir) {
  const info = await sharp(join(RAW_DIR, `${id}.png`))
    .resize({ width: SHIP_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toFile(join(outDir, `${id}.webp`));
  return Math.round(info.size / 1024);
}

async function main() {
  const args = process.argv.slice(2);
  const setName = args[args.indexOf('--set') + 1];
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const onlyArg = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
  const only = onlyArg ? new Set(onlyArg.split(',').map((s) => s.trim())) : null;

  const build = SETS[setName];
  if (!build) throw new Error(`Unknown --set. Available: ${Object.keys(SETS).join(', ')}`);

  const outDir = SCRATCH_SETS.has(setName) ? join(RAW_DIR, setName) : OUT_DIR;

  const price = unitPrice();
  const ledger = readLedger();
  mkdirSync(outDir, { recursive: true });
  mkdirSync(RAW_DIR, { recursive: true });

  const all = build();
  if (only) {
    const unknown = [...only].filter((id) => !all.some((job) => job.id === id));
    if (unknown.length) throw new Error(`--only: no such job: ${unknown.join(', ')}`);
  }

  const jobs = all.filter((job) => {
    if (only) return only.has(job.id);
    const exists = existsSync(join(RAW_DIR, `${job.id}.png`));
    if (exists && !force) console.log(`skip   ${job.id} (already generated)`);
    return force || !exists;
  });

  console.log(
    `\n${MODEL} @ ${IMAGE_SIZE}, $${price.toFixed(3)}/image\n` +
      `already spent $${ledger.spentUsd.toFixed(2)} across ${ledger.images} images\n` +
      `this run: ${jobs.length} images, $${(jobs.length * price).toFixed(2)}\n` +
      `cap: $${BUDGET_USD.toFixed(2)}\n`,
  );

  if (dryRun) return console.log('dry run, nothing called.');
  if (!jobs.length) return console.log('nothing to do.');

  const key = readKey();
  let generated = 0;

  for (const job of jobs) {
    if (ledger.spentUsd + price > BUDGET_USD) {
      console.error(`\nSTOPPED: next image would exceed the $${BUDGET_USD} cap.`);
      break;
    }
    process.stdout.write(`gen    ${job.id} ... `);
    try {
      const bytes = await generate(key, job);
      writeFileSync(join(RAW_DIR, `${job.id}.png`), bytes);
      ledger.spentUsd += price;
      ledger.images += 1;
      generated += 1;
      const shipped = await encode(job.id, outDir);
      console.log(`ok (${Math.round(bytes.length / 1024)} KB raw -> ${shipped} KB webp)`);
    } catch (error) {
      console.log(`FAILED: ${error.message}`);
    }
  }

  ledger.runs.push({ at: new Date().toISOString(), set: setName, generated, model: MODEL });
  writeLedger(ledger);
  console.log(`\ndone. ${generated} generated. total spent $${ledger.spentUsd.toFixed(2)}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
