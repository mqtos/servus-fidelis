import { useMemo } from 'react';
import { create } from 'zustand';
import { campaigns, contributionWeights, regions } from '../engine/content';
import { load, save } from '../engine/persistence';
import {
  availableFronts,
  contribute,
  initialSector,
  isSectorState,
  openFronts,
  reconcile,
} from '../engine/warEffort';
import type { Contribution } from '../engine/warEffort';
import { useProgressStore } from './progressStore';
import type { CampaignContent, EndingCategory, SectorState } from '../engine/types';

const STORAGE_KEY = 'sector_state';

function hydrate(): SectorState {
  const stored = load(STORAGE_KEY, isSectorState);
  // Reconciled on every load, not just on a miss, because the campaign set is content and
  // content changes between builds while a player's sector does not. Fronts are then
  // opened against the stored level, so a level earned in a previous session has its
  // regions available the moment the game boots rather than after the next death.
  const base = stored ? reconcile(stored, campaigns) : initialSector(campaigns);
  return openFronts(base, campaigns, regions, useProgressStore.getState().progress.playerLevel);
}

interface SectorStore {
  sector: SectorState;
  // The world this life is being spent on. Chosen before the character exists, so it is
  // held here rather than on the character, and it survives the character's death long
  // enough for the Service Record to name the place.
  deployedTo: string | null;
  // The contribution from the run just finished. Held here rather than in the game store
  // because it is produced by this layer, and cleared when the next run starts so the
  // Service Record cannot show a stale one.
  lastContribution: Contribution | null;

  deploy: (campaignId: string) => void;
  recordRun: (endingCategory: EndingCategory, playerLevel: number) => void;
  clearContribution: () => void;
  syncFronts: (playerLevel: number) => void;
  resetSector: () => void;
}

export const useSectorStore = create<SectorStore>((set, get) => ({
  sector: hydrate(),
  deployedTo: null,
  lastContribution: null,

  deploy: (campaignId) => {
    const { sector } = get();
    const front = sector.campaigns.find((entry) => entry.id === campaignId);
    // Silently ignores a world that is not contested, so a stale link or a map left open
    // across a resolution cannot deploy a life somewhere the war has already finished.
    if (!front || front.status !== 'contested') return;
    set({ deployedTo: campaignId });
  },

  // The level is passed in rather than read, because the XP for this same death has just
  // been awarded and the new regions have to open against the new level, not the old one.
  recordRun: (endingCategory, playerLevel) => {
    const { sector, deployedTo } = get();
    const outcome = contribute(
      sector,
      campaigns,
      deployedTo,
      endingCategory,
      contributionWeights,
    );
    const next = openFronts(outcome.sector, campaigns, regions, playerLevel);
    save(STORAGE_KEY, next);
    set({ sector: next, lastContribution: outcome.contribution, deployedTo: null });
  },

  clearContribution: () => set({ lastContribution: null }),

  syncFronts: (playerLevel) => {
    const next = openFronts(get().sector, campaigns, regions, playerLevel);
    save(STORAGE_KEY, next);
    set({ sector: next });
  },

  resetSector: () => {
    const fresh = openFronts(
      initialSector(campaigns),
      campaigns,
      regions,
      useProgressStore.getState().progress.playerLevel,
    );
    save(STORAGE_KEY, fresh);
    set({ sector: fresh, deployedTo: null, lastContribution: null });
  },
}));

// Every world that can be deployed to right now. Memoised on the sector rather than
// selected directly: the selector builds a new array on every call, and zustand v5
// compares snapshots by identity, so returning it raw would re-render without end.
export function useAvailableFronts(): CampaignContent[] {
  const sector = useSectorStore((state) => state.sector);
  return useMemo(() => availableFronts(sector, campaigns), [sector]);
}

// The world this life is being spent on, or null before one is chosen.
export function useDeployment(): CampaignContent | null {
  return useSectorStore((state) =>
    state.deployedTo ? (campaigns.find((c) => c.id === state.deployedTo) ?? null) : null,
  );
}
