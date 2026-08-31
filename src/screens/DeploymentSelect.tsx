import { Action, Backdrop, Eyebrow, Panel, Rule } from '../components/Scene';
import SectorView from '../components/SectorView';
import { artFor } from '../engine/art';
import { regions, sectorName } from '../engine/content';
import { MAX_LEVEL, levelProgress } from '../engine/progression';
import { useGameStore } from '../store/gameStore';
import { useProgressStore } from '../store/progressStore';
import { useAvailableFronts, useSectorStore } from '../store/sectorStore';

// The game opens here rather than on a character. Choosing where before choosing who is
// what makes the sector the thing you are playing: the person is what the Munitorum sends
// to the choice you already made, and they will not outlast it.

function Standing() {
  const progress = useProgressStore((state) => state.progress);
  const bar = levelProgress(progress);
  const next = regions.find((region) => region.min_player_level > progress.playerLevel);

  return (
    <Panel className="p-6 sm:p-7">
      <div className="flex items-baseline justify-between gap-4">
        <Eyebrow>Service standing</Eyebrow>
        <p className="font-display text-2xl text-bone">
          {progress.playerLevel}
          <span className="text-base text-parchment/60"> / {MAX_LEVEL}</span>
        </p>
      </div>

      <div className="mt-5 h-1.5 w-full border border-brass/30 bg-ink/60">
        <div className="h-full bg-brass-lit/70" style={{ width: `${bar.fraction * 100}%` }} />
      </div>
      <p className="mt-3 font-mono text-xs text-parchment/60">
        {progress.playerXP} commendation on file
        {bar.needed > 0 ? ` / ${bar.needed - bar.into} to the next grade` : ' / at grade'}
      </p>

      {next && (
        <>
          <Rule className="mt-6" />
          <p className="mt-6 leading-relaxed text-parchment/80">{next.survey}</p>
          <p className="mt-3 font-mono text-xs tracking-[0.2em] text-parchment/55 uppercase">
            {next.name} opens at grade {next.min_player_level}
          </p>
        </>
      )}
    </Panel>
  );
}

// Reachable, and the simulation says at about two hundred lives: every world in every
// region resolved one way or the other, and no order left to give. Without this the screen
// simply offers nothing and says nothing, which reads as a broken build rather than as an
// ending. The Munitorum does not congratulate anyone, so neither does this.
function SectorDecided() {
  const sector = useSectorStore((state) => state.sector);
  const resetSector = useSectorStore((state) => state.resetSector);
  const held = sector.campaigns.filter((entry) => entry.status === 'won').length;
  const lost = sector.campaigns.filter((entry) => entry.status === 'lost').length;

  return (
    <Panel className="p-6 sm:p-7">
      <Eyebrow>Sector closed</Eyebrow>
      <p className="mt-6 leading-relaxed text-parchment/85">
        Every world in the Aurelian Reach has been resolved. {held} held, {lost} lost, across{' '}
        {sector.runsTotal} lives. The Cartography Corps has redrawn the sector and the
        Departmento has closed the file.
      </p>
      <Rule className="mt-7" />
      <p className="mt-7 font-mono text-xs leading-relaxed text-parchment/60">
        A new war can be opened over the same ground. Your service standing is on the account
        and does not reset with it.
      </p>
      <Action className="mt-7 w-full" onClick={resetSector}>
        Open a new war
      </Action>
    </Panel>
  );
}

export default function DeploymentSelect() {
  const confirmDeployment = useGameStore((state) => state.confirmDeployment);
  const fronts = useAvailableFronts();
  const decided = fronts.length === 0;

  return (
    <>
      <Backdrop src={artFor('sector_map')} />

      {/* Fixed to the viewport height rather than min-h-screen, so the map screen never
          becomes a page that scrolls: the header takes what it needs and the chart takes
          the rest. */}
      <div className="flex h-dvh flex-col overflow-hidden px-6 py-6 sm:px-14 sm:py-8">
        <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col">
          <Eyebrow>Departmento Munitorum / Assignment</Eyebrow>
          <h1 className="font-display mt-3 text-scene leading-tight text-bone">{sectorName}</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-parchment/80">
            {decided
              ? 'There is nothing left to assign. The chart below is the record of what happened to it.'
              : 'Drag the chart. Lean in to read it. Pick the front this life will be spent on, knowing that the ones you do not pick are not waiting.'}
          </p>

          {/* The chart fills what's left of the screen and the paperwork rides beside it,
              so the standing panel is handed to SectorView rather than parked in a column
              of its own. */}
          <SectorView
            className="mt-6 min-h-0 flex-1"
            action={(entry) =>
              entry.state.status === 'contested' ? (
                <Action className="mt-8 w-full" onClick={() => confirmDeployment(entry.content.id)}>
                  Deploy here
                </Action>
              ) : (
                <p className="mt-8 font-mono text-xs tracking-[0.2em] text-parchment/55 uppercase">
                  Decided. No further orders will be issued for this world.
                </p>
              )
            }
            aside={
              <div className="grid gap-6">
                {decided && <SectorDecided />}
                <Standing />
              </div>
            }
          />
        </div>
      </div>
    </>
  );
}
