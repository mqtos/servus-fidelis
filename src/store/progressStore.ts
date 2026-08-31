import { create } from 'zustand';
import { load, save } from '../engine/persistence';
import { award, initialProgress, isMetaProgressState } from '../engine/progression';
import type { LevelAward } from '../engine/progression';
import type { EndingCategory, MetaProgressState } from '../engine/types';

// Tech Architecture 7b. The account, not the character. Kept apart from the sector store
// because they answer different questions: the sector is what the war has done, this is
// what the player has seen, and a future Legacy mode could reset one without the other.

const STORAGE_KEY = 'meta_progress';

interface ProgressStore {
  progress: MetaProgressState;
  // The award from the run just finished, for the Service Record. Cleared when the next
  // run starts so a stale level-up cannot be shown twice.
  lastAward: LevelAward | null;

  recordEnding: (endingCategory: EndingCategory) => LevelAward;
  clearAward: () => void;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressStore>((set) => ({
  progress: load(STORAGE_KEY, isMetaProgressState) ?? initialProgress(),
  lastAward: null,

  // Returns the award as well as storing it, because the caller has to open the sector's
  // new fronts with the level this produced, and reading it back out of the store would
  // race against React's own scheduling.
  recordEnding: (endingCategory) => {
    const result = award(useProgressStore.getState().progress, endingCategory);
    save(STORAGE_KEY, result.progress);
    set({ progress: result.progress, lastAward: result });
    return result;
  },

  clearAward: () => set({ lastAward: null }),

  resetProgress: () => {
    const fresh = initialProgress();
    save(STORAGE_KEY, fresh);
    set({ progress: fresh, lastAward: null });
  },
}));

export function usePlayerLevel(): number {
  return useProgressStore((state) => state.progress.playerLevel);
}
