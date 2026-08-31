import { STAT_IDS } from './types';
import type {
  CharacterState,
  CharacterStatus,
  CheckResult,
  Consequence,
  EndingCategory,
  OriginContent,
  StageId,
  StatBlock,
} from './types';

// GDD 4.1: stats run 0-100 and start "around 20-40 depending on origin", so origins
// modify this baseline rather than defining absolute values.
export const BASE_STAT = 30;
export const MIN_STAT = 0;
export const MAX_STAT = 100;

export const AGE_BY_STAGE: Record<StageId, number> = {
  origin: 0,
  childhood: 6,
  recruitment: 16,
  training: 18,
  deployment: 19,
  career_branch: 21,
  long_war: 30,
  endgame: 45,
};

const STATUS_BY_ENDING_CATEGORY: Record<EndingCategory, CharacterStatus> = {
  pointless_death: 'dead',
  glorious_death: 'dead',
  quiet_survival: 'discharged',
  disgrace: 'discharged',
  corruption: 'dead',
  legend: 'legend',
  ascended: 'ascended',
};

export function statusForEndingCategory(category: EndingCategory): CharacterStatus {
  return STATUS_BY_ENDING_CATEGORY[category];
}

function clampStat(value: number): number {
  return Math.max(MIN_STAT, Math.min(MAX_STAT, value));
}

export function createCharacter(origin: OriginContent, name: string): CharacterState {
  const stats = {} as StatBlock;
  for (const stat of STAT_IDS) {
    stats[stat] = clampStat(BASE_STAT + (origin.stat_modifiers?.[stat] ?? 0));
  }

  return {
    runId: crypto.randomUUID(),
    name,
    originId: origin.id,
    stats,
    tags: [...(origin.starting_tags ?? [])],
    stage: 'childhood',
    history: [],
    age: AGE_BY_STAGE.childhood,
    branch: null,
    regiment: null,
    rank: 'Guardsman',
    status: 'alive',
    endingCategory: null,
  };
}

export interface ApplyContext {
  eventId: string;
  choiceId: string;
  checkResult?: CheckResult;
}

export function applyConsequence(
  character: CharacterState,
  consequence: Consequence,
  ctx: ApplyContext,
): CharacterState {
  const stats = { ...character.stats };
  for (const stat of STAT_IDS) {
    const delta = consequence.stat_changes?.[stat];
    if (delta !== undefined) stats[stat] = clampStat(stats[stat] + delta);
  }

  const removed = new Set(consequence.remove_tags ?? []);
  const tags = character.tags.filter((tag) => !removed.has(tag));
  for (const tag of consequence.add_tags ?? []) {
    if (!tags.includes(tag)) tags.push(tag);
  }

  const endingCategory = consequence.terminal ? (consequence.ending_category ?? null) : null;

  return {
    ...character,
    stats,
    tags,
    regiment: consequence.set_regiment ?? character.regiment,
    rank: consequence.set_rank ?? character.rank,
    branch: consequence.set_branch ?? character.branch,
    status: endingCategory ? STATUS_BY_ENDING_CATEGORY[endingCategory] : character.status,
    endingCategory: endingCategory ?? character.endingCategory,
    history: [
      ...character.history,
      {
        eventId: ctx.eventId,
        choiceId: ctx.choiceId,
        stageAtTime: character.stage,
        resultText: consequence.result_text,
        ...(ctx.checkResult ? { checkResult: ctx.checkResult } : {}),
      },
    ],
  };
}

export function advanceToStage(character: CharacterState, stage: StageId): CharacterState {
  return { ...character, stage, age: AGE_BY_STAGE[stage] };
}

// Unresolved tokens are left verbatim so a missing slot is visible on screen and
// greppable, rather than silently rendering as an empty string.
export function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (token, key: string) =>
    key in values ? String(values[key]) : token,
  );
}
