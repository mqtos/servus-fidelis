import { create } from 'zustand';
import {
  AGE_BY_STAGE,
  advanceToStage,
  applyConsequence,
  createCharacter,
  statusForEndingCategory,
} from '../engine/character';
import { consequenceFor, resolveCheck, rollD100 } from '../engine/checks';
import type { CheckOutcome } from '../engine/checks';
import { endings, eventsByStage, originsById } from '../engine/content';
import { filterEligible, pickWeighted } from '../engine/eligibility';
import type { EligibilityContext } from '../engine/eligibility';
import { useProgressStore } from './progressStore';
import { useSectorStore } from './sectorStore';
import { STAGE_ORDER } from '../engine/types';
import type {
  CharacterState,
  Consequence,
  EndingCategory,
  EndingContent,
  EventCardContent,
  StageId,
} from '../engine/types';

// The game boots on the title, then opens on the chart, not on a character. Choosing where
// to serve before choosing who serves is what makes the sector the game's home rather than
// a screen you visit: the question is which war, and the person is what the Munitorum
// sends to it. The title is not part of that loop, which is why it is a one-way door: it
// is the true boot screen but never a reset target, so `reset`/`confirmDeployment`/
// `startRun` all still land back on the chart, not on the title, once a life has begun.
export type Screen =
  | 'title'
  | 'deployment_select'
  | 'origin_select'
  | 'event'
  | 'stage_transition'
  | 'service_record';

// How many event cards each stage draws. Provisional pacing numbers; Phase 1 sets these
// against real content volume.
const EVENTS_PER_STAGE: Record<StageId, number> = {
  origin: 0,
  childhood: 3,
  recruitment: 1,
  training: 3,
  deployment: 3,
  career_branch: 2,
  long_war: 4,
  endgame: 0,
};

interface PendingOutcome {
  consequence: Consequence;
  check: CheckOutcome | null;
}

interface GameState {
  screen: Screen;
  character: CharacterState | null;
  currentEvent: EventCardContent | null;
  pending: PendingOutcome | null;
  transition: { from: StageId; to: StageId } | null;
  ending: EndingContent | null;
  seenEventIds: string[];
  remainingInStage: number;

  enterSector: () => void;
  confirmDeployment: (campaignId: string) => void;
  startRun: (originId: string, name: string) => void;
  choose: (choiceId: string) => void;
  acknowledge: () => void;
  continueFromTransition: () => void;
  reset: () => void;
}

function eligibilityContext(character: CharacterState): EligibilityContext {
  return {
    tags: character.tags,
    stats: character.stats,
    playerLevel: useProgressStore.getState().progress.playerLevel,
  };
}

// Drawn one at a time rather than pre-queued for the stage, so a tag granted by an early
// event can make a later event in the same stage eligible.
function drawEvent(character: CharacterState, seen: string[]): EventCardContent | null {
  const pool = filterEligible(eventsByStage[character.stage], eligibilityContext(character)).filter(
    (event) => !seen.includes(event.id),
  );
  return pickWeighted(pool, Math.random());
}

function nextStageWithContent(character: CharacterState): StageId {
  const start = STAGE_ORDER.indexOf(character.stage);
  for (let i = start + 1; i < STAGE_ORDER.length; i += 1) {
    const stage = STAGE_ORDER[i];
    if (!stage || stage === 'endgame') return 'endgame';
    if (EVENTS_PER_STAGE[stage] > 0 && drawEvent({ ...character, stage }, []) !== null) return stage;
  }
  return 'endgame';
}

function missingEnding(category: EndingCategory): EndingContent {
  return {
    id: `missing_ending_${category}`,
    category,
    headline: `NO ENDING AUTHORED: ${category}`,
    summary_template: `TODO author an ending with category "${category}" under /content/endings.`,
  };
}

function resolveEnding(character: CharacterState, category: EndingCategory): EndingContent {
  const matching = endings.filter((ending) => ending.category === category);
  const eligible = filterEligible(matching, eligibilityContext(character));
  return (
    pickWeighted(eligible, Math.random()) ??
    pickWeighted(matching, Math.random()) ??
    missingEnding(category)
  );
}

// Every path that ends a run funnels through here, which is what makes this the one safe
// place to tell the war about it. GDD 10.2: every ending contributes something, including
// the pointless ones, so there is no category this is skipped for.
//
// XP is awarded before the sector is told, because the level this death earns is the level
// the sector's regions have to open against. Doing it the other way round would hold a
// newly unlocked region shut until the life after the one that earned it.
function finishRun(character: CharacterState, category: EndingCategory): Partial<GameState> {
  const earned = useProgressStore.getState().recordEnding(category);
  useSectorStore.getState().recordRun(category, earned.progress.playerLevel);
  const finished: CharacterState = {
    ...character,
    stage: 'endgame',
    age: character.status === 'alive' ? AGE_BY_STAGE.endgame : character.age,
    status: character.status === 'alive' ? statusForEndingCategory(category) : character.status,
    endingCategory: category,
  };
  return {
    screen: 'service_record',
    character: finished,
    ending: resolveEnding(finished, category),
    currentEvent: null,
    pending: null,
    transition: null,
  };
}

function openStage(character: CharacterState): Partial<GameState> {
  const event = drawEvent(character, []);
  if (!event) return finishRun(character, 'quiet_survival');
  return {
    character,
    screen: 'event',
    currentEvent: event,
    seenEventIds: [event.id],
    remainingInStage: EVENTS_PER_STAGE[character.stage] - 1,
    pending: null,
    transition: null,
  };
}

const INITIAL = {
  screen: 'deployment_select' as Screen,
  character: null,
  currentEvent: null,
  pending: null,
  transition: null,
  ending: null,
  seenEventIds: [],
  remainingInStage: 0,
};

export const useGameStore = create<GameState>((set, get) => ({
  ...INITIAL,
  // The one override of INITIAL's own screen: the true cold boot is the title, but nothing
  // else that reuses INITIAL (reset, confirmDeployment, startRun) should ever land there.
  screen: 'title',

  enterSector: () => set({ screen: 'deployment_select' }),

  confirmDeployment: (campaignId) => {
    // The previous life's figures are cleared at the start of the new life rather than on
    // the Service Record, so leaving that screen by any route cannot carry them forward.
    useSectorStore.getState().clearContribution();
    useProgressStore.getState().clearAward();
    useSectorStore.getState().deploy(campaignId);
    // deploy refuses a world that is not contested, so the screen only advances if the
    // order actually took.
    if (useSectorStore.getState().deployedTo !== campaignId) return;
    set({ ...INITIAL, screen: 'origin_select' });
  },

  startRun: (originId, name) => {
    const origin = originsById.get(originId);
    if (!origin) return;
    set({ ...INITIAL, ...openStage(createCharacter(origin, name)) });
  },

  choose: (choiceId) => {
    const { character, currentEvent, pending } = get();
    if (!character || !currentEvent || pending) return;

    const choice = currentEvent.choices.find((option) => option.id === choiceId);
    if (!choice) return;

    let check: CheckOutcome | null = null;
    let consequence: Consequence | null;

    if (choice.stat_check) {
      check = resolveCheck(character.stats, choice.stat_check, rollD100());
      consequence = consequenceFor(choice, check.result);
    } else {
      consequence = choice.result_text === undefined ? null : (choice as Consequence);
    }
    if (!consequence) return;

    const updated = applyConsequence(character, consequence, {
      eventId: currentEvent.id,
      choiceId,
      ...(check ? { checkResult: check.result } : {}),
    });

    set({ character: updated, pending: { consequence, check } });
  },

  acknowledge: () => {
    const { character, pending, seenEventIds, remainingInStage } = get();
    if (!character || !pending) return;

    if (pending.consequence.terminal) {
      set(finishRun(character, pending.consequence.ending_category ?? 'pointless_death'));
      return;
    }

    if (remainingInStage > 0) {
      const event = drawEvent(character, seenEventIds);
      if (event) {
        set({
          currentEvent: event,
          seenEventIds: [...seenEventIds, event.id],
          remainingInStage: remainingInStage - 1,
          pending: null,
        });
        return;
      }
    }

    const to = nextStageWithContent(character);
    if (to === 'endgame') {
      set(finishRun(character, 'quiet_survival'));
      return;
    }
    set({
      screen: 'stage_transition',
      transition: { from: character.stage, to },
      currentEvent: null,
      pending: null,
    });
  },

  continueFromTransition: () => {
    const { character, transition } = get();
    if (!character || !transition) return;
    set(openStage(advanceToStage(character, transition.to)));
  },

  reset: () => set({ ...INITIAL }),
}));
