import type { CheckResult, Choice, Consequence, StatBlock, StatCheck } from './types';

// Tech Architecture 6's illustrative formula, kept verbatim on purpose. GDD 7 wants four
// degrees of success; the exact bands are a Phase 2 tuning pass driven by the simulation
// harness, so every magic number lives here and nowhere else.
export const CHECK_TUNING = {
  criticalSuccessFraction: 0.2,
  criticalFailureRoll: 96,
};

export interface CheckOutcome {
  result: CheckResult;
  roll: number;
  target: number;
}

export function resolveCheck(stats: StatBlock, check: StatCheck, roll: number): CheckOutcome {
  const total = check.stat.reduce((sum, stat) => sum + stats[stat], 0);
  const target = total / check.stat.length + (check.difficulty ?? 0);

  let result: CheckResult;
  if (roll <= target * CHECK_TUNING.criticalSuccessFraction) result = 'critical_success';
  else if (roll <= target) result = 'success';
  else if (roll >= CHECK_TUNING.criticalFailureRoll) result = 'critical_failure';
  else result = 'failure';

  return { result, roll, target };
}

export function rollD100(): number {
  return Math.floor(Math.random() * 100) + 1;
}

// Content may collapse the four tiers to pass/fail, so crits fall back to their
// neighbouring branch rather than requiring every card to author all four.
export function consequenceFor(choice: Choice, result: CheckResult): Consequence | null {
  switch (result) {
    case 'critical_success':
      return choice.on_critical_success ?? choice.on_success ?? null;
    case 'success':
      return choice.on_success ?? null;
    case 'critical_failure':
      return choice.on_critical_failure ?? choice.on_failure ?? null;
    case 'failure':
      return choice.on_failure ?? null;
  }
}
