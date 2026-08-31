import { STAT_IDS } from './types';
import type { Requires, StatBlock, StatId } from './types';

export interface EligibilityContext {
  tags: string[];
  stats: StatBlock;
  // Account-wide, from MetaProgressState. Phase 2 feeds the real value; until the meta
  // layer exists every level gate is open.
  playerLevel: number;
}

export function meetsRequires(requires: Requires | undefined, ctx: EligibilityContext): boolean {
  if (!requires) return true;

  if (requires.tags_any && !requires.tags_any.some((tag) => ctx.tags.includes(tag))) return false;
  if (requires.tags_none && requires.tags_none.some((tag) => ctx.tags.includes(tag))) return false;

  for (const stat of STAT_IDS) {
    const min = requires.stat_min?.[stat];
    if (min !== undefined && ctx.stats[stat] < min) return false;
    const max = requires.stat_max?.[stat];
    if (max !== undefined && ctx.stats[stat] > max) return false;
  }

  return true;
}

export interface Eligible {
  requires?: Requires;
  min_player_level?: number;
  weight?: number;
}

export function isEligible(item: Eligible, ctx: EligibilityContext): boolean {
  if (item.min_player_level !== undefined && ctx.playerLevel < item.min_player_level) return false;
  return meetsRequires(item.requires, ctx);
}

export function filterEligible<T extends Eligible>(items: T[], ctx: EligibilityContext): T[] {
  return items.filter((item) => isEligible(item, ctx));
}

export function pickWeighted<T extends Eligible>(items: T[], roll: number): T | null {
  if (items.length === 0) return null;
  const total = items.reduce((sum, item) => sum + (item.weight ?? 1), 0);
  let cursor = roll * total;
  for (const item of items) {
    cursor -= item.weight ?? 1;
    if (cursor < 0) return item;
  }
  return items[items.length - 1] ?? null;
}

export function describeStats(stats: StatId[]): string {
  return stats.join(' + ');
}
