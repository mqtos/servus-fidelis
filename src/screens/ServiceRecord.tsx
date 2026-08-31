import CommendationReport from '../components/CommendationReport';
import ContributionReport from '../components/ContributionReport';
import { Action, Backdrop, Eyebrow, Lockup, Panel, Rule } from '../components/Scene';
import { endingArt } from '../engine/art';
import { originsById } from '../engine/content';
import { buildServiceRecord } from '../engine/record';
import { useGameStore } from '../store/gameStore';
import { useProgressStore } from '../store/progressStore';
import { useSectorStore } from '../store/sectorStore';
import { useUiStore } from '../store/uiStore';

export default function ServiceRecord() {
  const openSector = useUiStore((state) => state.openSector);
  const character = useGameStore((state) => state.character);
  const ending = useGameStore((state) => state.ending);
  const reset = useGameStore((state) => state.reset);
  // Null when the life was never assigned a front, which is a legitimate end state rather
  // than an error, so the block simply does not render.
  const contribution = useSectorStore((state) => state.lastContribution);
  const award = useProgressStore((state) => state.lastAward);

  if (!character || !ending) return null;

  const record = buildServiceRecord(character, ending, originsById.get(character.originId));

  return (
    <>
      <Backdrop src={endingArt(ending.category)} scrim="soft" />

      {/* A full-height title card first, then the paperwork scrolling over the same fixed
          image. The player gets the ending as a moment before they get it as a document. */}
      <section className="flex min-h-screen flex-col justify-end overflow-hidden px-6 pb-16 sm:px-14 sm:pb-24">
        <Lockup className="max-w-3xl">
          <div className="rise-stagger">
            <Eyebrow>{ending.category.replace(/_/g, ' ')}</Eyebrow>
            <h1 className="font-display mt-4 text-scene leading-[1.05] font-bold text-bone">
              {record.headline}
            </h1>
            <div className="mt-7 max-w-sm">
              <Rule />
            </div>
            <p className="mt-7 max-w-2xl text-2xl leading-snug text-parchment/90 italic">
              {record.precis}
            </p>
          </div>
        </Lockup>
      </section>

      <section className="px-6 pb-24 sm:px-14">
        <Panel className="mx-auto w-full max-w-3xl p-7 sm:p-11">
          <Eyebrow>Service record</Eyebrow>
          <p className="mt-6 text-lg leading-relaxed text-parchment/90">{record.citation}</p>

          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-brass/25 pt-8 sm:grid-cols-3">
            {record.dossier.map((field) => (
              <div key={field.label}>
                <dt className="font-mono text-[0.65rem] tracking-[0.3em] text-parchment/60 uppercase">
                  {field.label}
                </dt>
                <dd className="font-display mt-2 text-bone">{field.value}</dd>
              </div>
            ))}
          </dl>

          <Rule className="mt-11" />

          <h2 className="font-display mt-11 text-xl text-bone">Record of Service</h2>
          <div className="mt-8 space-y-9">
            {record.chapters.map((chapter) => (
              <section key={chapter.stage}>
                <h3 className="font-mono text-[0.65rem] tracking-[0.3em] text-brass-lit uppercase">
                  {chapter.label}
                </h3>
                <div className="mt-4 space-y-4 border-l border-brass/30 pl-6">
                  {chapter.beats.map((beat, index) => (
                    <p key={index} className="leading-relaxed text-parchment/85">
                      {beat}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {record.annotations.length > 0 && (
            <>
              <h2 className="font-display mt-12 text-xl text-bone">Annotations on File</h2>
              <ul className="mt-5 flex flex-wrap gap-2">
                {record.annotations.map((tag) => (
                  <li
                    key={tag}
                    className="border border-brass/25 bg-ink/40 px-3 py-1 font-mono text-xs text-parchment/75"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="mt-12 border-t border-brass/25 pt-7 font-mono text-xs leading-relaxed text-parchment/60">
            {record.tally.decisions} decisions recorded / {record.tally.checks} tested against
            characteristic / {record.tally.passed} passed / {record.tally.criticals} resolved
            critically
          </p>

          {contribution && <ContributionReport contribution={contribution} />}
          {award && <CommendationReport award={award} />}

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Action onClick={reset}>Choose the next front</Action>
            <Action variant="ghost" onClick={openSector}>
              The sector chart
            </Action>
          </div>
        </Panel>
      </section>
    </>
  );
}
