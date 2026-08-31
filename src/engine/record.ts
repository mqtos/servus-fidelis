import { fillTemplate } from './character';
import { STAGE_LABELS, STAGE_ORDER } from './types';
import type {
  CharacterState,
  EndingCategory,
  EndingContent,
  OriginContent,
  StageId,
} from './types';

// GDD 2, pillar 1: the player should be able to describe a run to a friend in one
// sentence. This clause is the verb of that sentence.
const OUTCOME_CLAUSE: Record<EndingCategory, string> = {
  pointless_death: 'died without particular notice',
  glorious_death: 'died and was commended for it',
  quiet_survival: 'was discharged intact',
  disgrace: 'ended in disgrace',
  legend: 'ended a legend',
  corruption: 'was declared Excommunicate Traitoris',
  ascended: 'ascended',
};

export interface RecordChapter {
  stage: StageId;
  label: string;
  beats: string[];
}

export interface RecordTally {
  decisions: number;
  checks: number;
  passed: number;
  criticals: number;
}

export interface ServiceRecordView {
  headline: string;
  precis: string;
  citation: string;
  dossier: { label: string; value: string }[];
  chapters: RecordChapter[];
  annotations: string[];
  tally: RecordTally;
}

// Characters who die during recruitment never reach a set_regiment, so every consumer
// of a regiment needs this rather than an empty slot.
function regimentOf(character: CharacterState): string | null {
  return character.regiment;
}

function buildPrecis(character: CharacterState, origin: OriginContent | undefined): string {
  const home = origin?.record_phrase ?? origin?.name ?? character.originId;
  const regiment = regimentOf(character);
  const outcome = character.endingCategory
    ? OUTCOME_CLAUSE[character.endingCategory]
    : 'left no record';

  const service = regiment
    ? `served with ${regiment}`
    : 'never served, and was never entered on a roll';

  return `Taken from ${home}, ${service}, ${outcome} at ${character.age}.`;
}

function buildChapters(character: CharacterState): RecordChapter[] {
  const byStage = new Map<StageId, string[]>();
  for (const entry of character.history) {
    const beats = byStage.get(entry.stageAtTime);
    if (beats) beats.push(entry.resultText);
    else byStage.set(entry.stageAtTime, [entry.resultText]);
  }

  return STAGE_ORDER.flatMap((stage) => {
    const beats = byStage.get(stage);
    if (!beats) return [];
    return [{ stage, label: STAGE_LABELS[stage], beats }];
  });
}

function buildTally(character: CharacterState): RecordTally {
  let checks = 0;
  let passed = 0;
  let criticals = 0;
  for (const entry of character.history) {
    if (!entry.checkResult) continue;
    checks += 1;
    if (entry.checkResult === 'success' || entry.checkResult === 'critical_success') passed += 1;
    if (entry.checkResult === 'critical_success' || entry.checkResult === 'critical_failure') {
      criticals += 1;
    }
  }
  return { decisions: character.history.length, checks, passed, criticals };
}

export function buildServiceRecord(
  character: CharacterState,
  ending: EndingContent,
  origin: OriginContent | undefined,
): ServiceRecordView {
  const regiment = regimentOf(character);

  return {
    headline: ending.headline,
    precis: buildPrecis(character, origin),
    citation: fillTemplate(ending.summary_template, {
      name: character.name,
      age: character.age,
      age_at_death: character.age,
      regiment: regiment ?? 'no regiment of record',
      final_rank: character.rank,
    }),
    dossier: [
      { label: 'Name', value: character.name },
      { label: 'Homeworld', value: origin?.name ?? character.originId },
      { label: 'Regiment', value: regiment ?? 'None of record' },
      { label: 'Final rank', value: regiment ? character.rank : 'None of record' },
      { label: 'Age at resolution', value: String(character.age) },
      {
        label: 'Disposition',
        value: character.status.charAt(0).toUpperCase() + character.status.slice(1),
      },
    ],
    chapters: buildChapters(character),
    annotations: character.tags,
    tally: buildTally(character),
  };
}
