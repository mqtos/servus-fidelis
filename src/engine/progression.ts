import type { EndingCategory, MetaProgressState } from './types';

// Tech Architecture 7b / Content Bible 7.6. Account-wide, never per-character: GDD 12.4 is
// explicit that a per-character level would make dying read as lost progress, which
// contradicts pillar 4. So XP is flat per ending category and every life pays out,
// including the pointless ones.

export const MAX_LEVEL = 70;

// The Bible leaves the level-to-XP thresholds as a Phase 2 tuning task. This is that
// decision, and the reasoning matters more than the constants because both will move.
//
// A flat cost per level would make the last stretch trivial and a steep exponential would
// put the cap out of reach, so the cost of a level grows linearly, which makes the
// cumulative curve quadratic.
//
// The constants are fitted against the sector, not against a guess. The binding number is
// how many lives the sector can absorb before every world is decided: simulating the whole
// campaign set with mixed endings, the forty worlds resolve in about 114 lives at roughly
// 15 XP a life. An earlier fit put the cap at ~170 lives, which sounded generous and was
// in fact unreachable: the player hit grade 60 with nothing left to deploy to, and The
// Blank Chart, gated at 70, could never open at all.
//
// So the cap is fitted below the sector's supply rather than above it. At these values the
// gates land at level 8 after ~4 lives, 30 after ~23, 50 after ~57, and the 70 cap after
// ~95, which leaves the Blank Chart's four worlds as the endgame they were written to be.
const BASE_COST = 5;
const COST_GROWTH = 0.46;

// XP to go from `level` to `level + 1`.
function costOfLevel(level: number): number {
  return Math.round(BASE_COST + COST_GROWTH * (level - 1));
}

// Cumulative XP required to have reached each level. Index 0 is unused so the table can be
// read by level directly; level 1 costs nothing because everyone starts there.
const THRESHOLDS: number[] = (() => {
  const table = [0, 0];
  for (let level = 1; level < MAX_LEVEL; level += 1) {
    table.push((table[level] ?? 0) + costOfLevel(level));
  }
  return table;
})();

export function xpForLevel(level: number): number {
  return THRESHOLDS[Math.min(Math.max(level, 1), MAX_LEVEL)] ?? 0;
}

export function levelForXP(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level += 1;
  return level;
}

// Content Bible 7.6 `xp_by_ending_category`. Held here rather than in config because
// unlike the war effort weights these are not a knob the sector's fiction turns: they are
// the account's payout table, and every category must be present.
export const DEFAULT_XP_BY_ENDING: Record<EndingCategory, number> = {
  pointless_death: 5,
  disgrace: 5,
  glorious_death: 15,
  quiet_survival: 15,
  corruption: 10,
  legend: 40,
  ascended: 100,
};

export function initialProgress(): MetaProgressState {
  return { playerXP: 0, playerLevel: 1 };
}

export function isMetaProgressState(value: unknown): value is MetaProgressState {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<MetaProgressState>;
  return typeof candidate.playerXP === 'number' && typeof candidate.playerLevel === 'number';
}

export interface LevelAward {
  progress: MetaProgressState;
  gained: number;
  levelsGained: number;
  // Set only when the run crossed into a new level, so the Service Record can say so.
  newLevel: number | null;
}

// The level is always recomputed from total XP rather than incremented, so a change to the
// curve re-derives every existing account correctly instead of leaving stored levels that
// no longer match the table they came from.
export function award(
  progress: MetaProgressState,
  category: EndingCategory,
  table: Record<EndingCategory, number> = DEFAULT_XP_BY_ENDING,
): LevelAward {
  const gained = table[category] ?? 0;
  const playerXP = Math.max(0, progress.playerXP + gained);
  const playerLevel = levelForXP(playerXP);
  const levelsGained = Math.max(0, playerLevel - progress.playerLevel);
  return {
    progress: { playerXP, playerLevel },
    gained,
    levelsGained,
    newLevel: levelsGained > 0 ? playerLevel : null,
  };
}

// Progress through the current level, for the bar on the Service Record. At the cap there
// is nothing left to fill, so it reads as full rather than as a division by zero.
export function levelProgress(progress: MetaProgressState): {
  into: number;
  needed: number;
  fraction: number;
} {
  if (progress.playerLevel >= MAX_LEVEL) return { into: 0, needed: 0, fraction: 1 };
  const floor = xpForLevel(progress.playerLevel);
  const ceiling = xpForLevel(progress.playerLevel + 1);
  const needed = ceiling - floor;
  const into = progress.playerXP - floor;
  return { into, needed, fraction: needed <= 0 ? 1 : into / needed };
}
