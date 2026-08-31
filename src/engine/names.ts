import type { NamePools, OriginContent } from './types';

// Used only when an origin ships without name_pools, so a newly authored world still
// produces a playable character instead of an empty string.
const FALLBACK: NamePools = {
  forenames: ['Tovan', 'Dren', 'Kaspa', 'Yelen', 'Bekk', 'Sarn'],
  surnames: ['Voss', 'Kell', 'Harrow', 'Duin', 'Vance', 'Orsk'],
};

const DEFAULT_FORMAT = '{forename} {surname}';

function pick(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)] ?? '';
}

export function generateName(origin: OriginContent): string {
  const pools = origin.name_pools ?? FALLBACK;
  const forenames = pools.forenames?.length ? pools.forenames : FALLBACK.forenames;
  const surnames = pools.surnames?.length ? pools.surnames : FALLBACK.surnames;

  return (pools.format ?? DEFAULT_FORMAT)
    .replace('{forename}', pick(forenames))
    .replace('{surname}', pick(surnames));
}
