import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Panel, Rule } from './Scene';
import SectorMap, { WORLD_GLYPH, statusLabel } from './SectorMap';
import type { MapEntry } from './SectorMap';
import { campaigns, campaignsById, regions } from '../engine/content';
import { useSectorStore } from '../store/sectorStore';
import { usePlayerLevel } from '../store/progressStore';

// The chart and the dossier beside it. Two screens need exactly this and differ only in
// what they let you do about it, so the difference is a slot rather than a second copy:
// the Cartography Corps view passes nothing, the deployment order passes a button.

function dossier(entry: MapEntry): string {
  const { content, state } = entry;
  if (state.status === 'won') return content.win_summary;
  if (state.status === 'lost') return content.loss_summary;
  return content.flavor_intro;
}

function Progress({ entry }: { entry: MapEntry }) {
  const { content, state } = entry;
  const threshold = content.threshold;
  const ceiling = content.runs_ceiling ?? 12;
  const pct = Math.min(100, Math.max(0, (state.contributionSoFar / threshold) * 100));
  return (
    <>
      <div className="mt-6 h-2 w-full border border-brass/30 bg-ink/60">
        <div className="h-full bg-brass-lit/70" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 font-mono text-xs text-parchment/60">
        {state.contributionSoFar} of {threshold} required / {state.runsSpent} of {ceiling} lives
        spent
      </p>
    </>
  );
}

export default function SectorView({
  action,
  aside,
  className = '',
}: {
  // Rendered inside the dossier panel, under the world's own text.
  action?: (entry: MapEntry) => ReactNode;
  // Rendered in the right rail beside the dossier. The deployment screen puts service
  // standing here; the Cartography Corps view passes nothing and the dossier takes the
  // full width instead.
  aside?: ReactNode;
  className?: string;
}) {
  const sector = useSectorStore((state) => state.sector);
  const playerLevel = usePlayerLevel();

  const entries = useMemo<MapEntry[]>(
    () =>
      sector.campaigns.flatMap((state) => {
        const content = campaignsById.get(state.id);
        return content ? [{ content, state }] : [];
      }),
    [sector],
  );

  const firstOpen =
    entries.find((entry) => entry.state.status === 'contested') ??
    entries.find((entry) => entry.state.status !== 'garrison');
  const [selectedId, setSelectedId] = useState<string | null>(firstOpen?.content.id ?? null);
  const selected =
    entries.find((entry) => entry.content.id === selectedId) ?? firstOpen ?? null;

  return (
    /* The chart fills whatever height the screen hands it and the dossier rides beside it
       rather than under it, so opening the map never turns the page into something that
       scrolls: the frame is fixed by the caller (h-dvh, overflow-hidden) and everything in
       here divides that height instead of adding to it. The dossier rail is the one thing
       allowed to scroll internally, for the rare case the aside content runs long. */
    <div className={`flex min-h-0 flex-col gap-6 lg:flex-row ${className}`}>
      <Panel className="flex min-h-0 flex-1 items-center justify-center p-3 sm:p-4">
        <SectorMap
          entries={entries}
          regions={regions}
          playerLevel={playerLevel}
          selectedId={selected?.content.id ?? null}
          onSelect={setSelectedId}
          className="h-full w-full min-h-[20rem]"
        />
      </Panel>

      <div className="flex min-h-0 w-full flex-col gap-6 overflow-y-auto lg:w-[22rem] lg:shrink-0">
        {selected && (
          <Panel className="p-7 sm:p-8">
            <p className="font-mono text-[0.65rem] tracking-[0.3em] text-parchment/70 uppercase">
              {selected.content.world_type ? `${WORLD_GLYPH[selected.content.world_type]} / ` : ''}
              {statusLabel(selected.state.status)}
            </p>
            <h2 className="font-display mt-3 text-2xl leading-tight text-bone">
              {selected.content.name}
            </h2>

            <Rule className="mt-6" />

            <p className="mt-7 max-w-prose leading-relaxed text-parchment/85">
              {dossier(selected)}
            </p>

            {selected.state.status === 'contested' && <Progress entry={selected} />}
            {action?.(selected)}
          </Panel>
        )}

        {campaigns.length === 0 && (
          <Panel className="p-7">
            <p className="text-parchment/80">
              No campaigns are on file. The sector chart is blank.
            </p>
          </Panel>
        )}

        {aside}
      </div>
    </div>
  );
}
