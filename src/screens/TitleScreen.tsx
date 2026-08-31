import { Action, Backdrop, Eyebrow, Lockup, Rule } from '../components/Scene';
import { artFor } from '../engine/art';
import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';

// The true boot screen. It is a one-way door into the run: "Begin a life" opens the sector
// chart to pick a front, not a character, because the war is chosen before the person is.
// "The sector chart" here is the read-only Cartography Corps overview, the same overlay
// reachable later from the Service Record, kept for anyone who wants to read the whole
// board before committing to anything.
export default function TitleScreen() {
  const enterSector = useGameStore((state) => state.enterSector);
  const openSector = useUiStore((state) => state.openSector);

  return (
    <>
      <Backdrop src={artFor('title_screen')} scrim="soft" />
      <div className="flex min-h-screen flex-col justify-end overflow-hidden px-6 pb-16 sm:px-14 sm:pb-24">
        <Lockup className="max-w-2xl">
          <div className="rise-stagger">
            <Eyebrow>In the grim darkness of the far future</Eyebrow>
            <h1 className="font-display mt-4 text-hero leading-[0.95] font-bold text-bone">
              Servus
              <br />
              Fidelis
            </h1>
            <div className="mt-7 max-w-sm">
              <Rule />
            </div>
            <p className="mt-6 max-w-md text-xl leading-relaxed text-parchment/85">
              One life, from the hab-block to whatever ground finally takes you. Every choice
              is entered in the record. The record is all that survives.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Action onClick={enterSector}>Begin a life</Action>
              <Action variant="ghost" onClick={openSector}>
                The sector chart
              </Action>
            </div>
          </div>
        </Lockup>
      </div>
    </>
  );
}
