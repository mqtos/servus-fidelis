import { create } from 'zustand';

// The sector map is not part of a run, so it does not belong in the game store: it can be
// opened from the title screen before a character exists and from the Service Record after
// one has died. It is an overlay over whatever screen the run is on, and this holds that
// one bit of chrome state.
interface UiStore {
  sectorOpen: boolean;
  openSector: () => void;
  closeSector: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  sectorOpen: false,
  openSector: () => set({ sectorOpen: true }),
  closeSector: () => set({ sectorOpen: false }),
}));
