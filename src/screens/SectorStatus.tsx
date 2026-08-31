import { Action, Backdrop, Eyebrow } from '../components/Scene';
import SectorView from '../components/SectorView';
import { artFor } from '../engine/art';
import { campaigns, sectorName } from '../engine/content';
import { useSectorStore } from '../store/sectorStore';
import { useUiStore } from '../store/uiStore';

export default function SectorStatus() {
  const sector = useSectorStore((state) => state.sector);
  const close = useUiStore((state) => state.closeSector);

  const decided = sector.campaigns.filter(
    (entry) => entry.status === 'won' || entry.status === 'lost',
  ).length;

  return (
    <div className="fixed inset-0 z-20 flex flex-col overflow-hidden">
      <Backdrop src={artFor('sector_map')} />

      <div className="flex h-full flex-col px-6 py-6 sm:px-14 sm:py-8">
        <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow>Cartography Corps / Sector chart</Eyebrow>
              <h1 className="font-display mt-3 text-scene leading-tight text-bone">{sectorName}</h1>
            </div>
            {/* Pushed right explicitly: once the header wraps on a phone, justify-between
                has nothing to space against and would drop this against the left edge. */}
            <Action variant="ghost" onClick={close} className="ml-auto">
              Close
            </Action>
          </div>

          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-parchment/80">
            {campaigns.length === 0
              ? 'No campaigns are on file. The sector chart is blank.'
              : `${decided} of ${campaigns.length} worlds decided. ${sector.runsTotal} lives on file against the whole sector.`}
          </p>

          <SectorView className="mt-6 min-h-0 flex-1" />
        </div>
      </div>
    </div>
  );
}
