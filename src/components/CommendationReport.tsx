import { Eyebrow } from './Scene';
import { MAX_LEVEL, levelProgress } from '../engine/progression';
import type { LevelAward } from '../engine/progression';
import { regions } from '../engine/content';

// GDD 12.4. The counterweight to the Contribution Report directly above it: that one says
// the life changed almost nothing, and this one says it still counted for something, to
// the account rather than to the war. Both have to be true at once or the game is either
// pointless or weightless.

export default function CommendationReport({ award }: { award: LevelAward }) {
  const { progress, gained, newLevel, levelsGained } = award;
  const bar = levelProgress(progress);
  // A level that opens a region is the only level worth announcing by name, so the message
  // is looked up rather than fixed: most promotions say nothing except a number.
  //
  // Every gate crossed, not just one landed on exactly. A single life can be worth more
  // than one grade, and matching the gate against the new level alone meant that a run
  // taking the player from 7 to 9 opened The Hesperine Forgeworks at 8 and never mentioned
  // it: the region simply appeared on the chart with no explanation. Verified in the
  // browser, which is the only reason it was found at all.
  const previousLevel = newLevel === null ? progress.playerLevel : newLevel - levelsGained;
  const opened = regions.filter(
    (region) => region.min_player_level > previousLevel && region.min_player_level <= progress.playerLevel,
  );

  return (
    <section className="mt-12 border-t border-brass/25 pt-8">
      <Eyebrow>Commendation</Eyebrow>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <h3 className="font-display text-xl text-bone">
          Grade {progress.playerLevel}
          <span className="text-base text-parchment/60"> / {MAX_LEVEL}</span>
        </h3>
        <p className="font-mono text-2xl text-brass-lit">+{gained}</p>
      </div>

      <div className="mt-5 h-2 w-full border border-brass/30 bg-ink/60">
        <div className="h-full bg-brass-lit/70" style={{ width: `${bar.fraction * 100}%` }} />
      </div>
      <p className="mt-3 font-mono text-xs text-parchment/60">
        {progress.playerXP} on file
        {bar.needed > 0 ? ` / ${bar.needed - bar.into} to grade ${progress.playerLevel + 1}` : ''}
      </p>

      {newLevel !== null && (
        <p className="mt-5 leading-relaxed text-parchment/85">
          The Departmento has advanced your file to grade {newLevel}. Nobody informed you of
          this while you were alive.
        </p>
      )}

      {opened.map((region) => (
        <p key={region.id} className="mt-4 leading-relaxed text-parchment/85">
          {region.name} is now open to assignment. {region.survey}
        </p>
      ))}
    </section>
  );
}
