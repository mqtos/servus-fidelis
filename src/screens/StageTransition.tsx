import { Action, Backdrop, Eyebrow, Lockup, Rule } from '../components/Scene';
import { stageArt } from '../engine/art';
import { sectorName } from '../engine/content';
import { STAGE_LABELS } from '../engine/types';
import { useGameStore } from '../store/gameStore';
import { useDeployment } from '../store/sectorStore';

export default function StageTransition() {
  const transition = useGameStore((state) => state.transition);
  const continueFromTransition = useGameStore((state) => state.continueFromTransition);
  const campaign = useDeployment();

  if (!transition) return null;

  // The one point in a run where the character is placed on the sector chart. Before
  // deployment they are a name in a hab-block; after it they are standing on the world the
  // player picked before they existed. Null when the run began without an order, so the
  // beat is skipped rather than faked.
  const locating = transition.to === 'deployment' ? campaign : null;

  return (
    <>
      {/* The only screen with nothing to read, so the art gets the lighter scrim and the
          full frame. It is the game's one moment of pure spectacle between decisions. */}
      <Backdrop src={stageArt(transition.to)} scrim="soft" />
      <div className="flex min-h-screen flex-col justify-end overflow-hidden px-6 pb-16 sm:px-14 sm:pb-24">
        <Lockup className="max-w-3xl">
          <div className="rise-stagger">
            <Eyebrow className="text-parchment/70">{STAGE_LABELS[transition.from]} ends</Eyebrow>
            <h1 className="font-display mt-4 text-hero leading-[0.95] font-bold text-bone">
              {STAGE_LABELS[transition.to]}
            </h1>
            <div className="mt-7 max-w-sm">
              <Rule />
            </div>
            {locating && (
              <div className="mt-8 max-w-xl">
                <p className="font-mono text-[0.7rem] tracking-[0.35em] text-parchment/60 uppercase">
                  Assignment / {sectorName}
                </p>
                <p className="font-display mt-2 text-2xl text-bone">{locating.name}</p>
              </div>
            )}
            <div className="mt-10">
              <Action onClick={continueFromTransition}>Continue</Action>
            </div>
          </div>
        </Lockup>
      </div>
    </>
  );
}
