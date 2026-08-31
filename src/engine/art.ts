import type { EndingCategory, StageId } from './types';

// Vite resolves these to hashed, cache-busted URLs at build time. Globbing rather than
// importing each file by name keeps adding art a drop-in: generate the file with the
// id the manifest already assigns and it is picked up without touching this module.
const modules = import.meta.glob<string>('../assets/art/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

const byId = new Map<string, string>();
for (const [path, url] of Object.entries(modules)) {
  const id = path.split('/').pop()?.replace(/\.webp$/, '');
  if (id) byId.set(id, url);
}

// Art is generated in batches and lags content, so every lookup can miss. Callers render
// nothing rather than a broken image: the run must stay playable with no art at all.
export function artFor(id: string): string | undefined {
  return byId.get(id);
}

export function stageArt(stage: StageId): string | undefined {
  return artFor(`stage_${stage}`);
}

export function endingArt(category: EndingCategory): string | undefined {
  return artFor(`ending_${category}`);
}
