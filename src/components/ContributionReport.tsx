import { Eyebrow, Rule } from './Scene';
import type { Contribution } from '../engine/warEffort';

// GDD 10.2: the one line that connects a life to the war. It is deliberately understated.
// A soldier is a rounding error, so the bar is meant to barely move, and the number is
// meant to look small next to the threshold it is measured against.

function Bar({ before, after, threshold }: { before: number; after: number; threshold: number }) {
  const pct = (value: number) => Math.min(100, Math.max(0, (value / threshold) * 100));
  const kept = pct(Math.min(before, after));
  const delta = pct(Math.max(before, after)) - kept;
  const lost = after < before;

  return (
    <div className="relative h-2 w-full border border-brass/30 bg-ink/60">
      <div className="absolute inset-y-0 left-0 bg-brass/45" style={{ width: `${kept}%` }} />
      {/* The delta is the only part of this run that is visible, so it is the only part
          that gets a lit colour: brass when the life added, oxblood when it cost. */}
      <div
        className={`absolute inset-y-0 ${lost ? 'bg-blood-lit' : 'bg-brass-lit'}`}
        style={{ left: `${kept}%`, width: `${delta}%` }}
      />
    </div>
  );
}

export default function ContributionReport({ contribution }: { contribution: Contribution }) {
  const { campaign, amount, totalBefore, totalAfter, threshold, resolved } = contribution;
  const signed = amount > 0 ? `+${amount}` : `${amount}`;

  return (
    <section className="mt-12 border-t border-brass/25 pt-8">
      <Eyebrow>Contribution to the war effort</Eyebrow>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <h3 className="font-display text-xl text-bone">{campaign.name}</h3>
        <p
          className={`font-mono text-2xl ${amount < 0 ? 'text-blood-lit' : amount === 0 ? 'text-parchment/60' : 'text-brass-lit'}`}
        >
          {signed}
        </p>
      </div>

      <div className="mt-5">
        <Bar before={totalBefore} after={totalAfter} threshold={threshold} />
      </div>

      <p className="mt-3 font-mono text-xs text-parchment/60">
        {totalAfter} of {threshold} required
      </p>

      {amount === 0 && (
        <p className="mt-5 leading-relaxed text-parchment/75">
          The record is filed. It changes nothing on the front.
        </p>
      )}

      {resolved && contribution.summary && (
        <>
          <Rule className="mt-8" />
          <p className="mt-8 font-mono text-[0.65rem] tracking-[0.3em] text-brass-lit uppercase">
            {resolved === 'won' ? 'Campaign concluded' : 'Campaign abandoned'}
          </p>
          <p className="mt-4 leading-relaxed text-parchment/85">{contribution.summary}</p>
        </>
      )}

      {/* The cost of having been somewhere else. This is the only place the player is told
          that choosing a front was also a choice not to hold the others, and it is stated
          flatly, as a filing, because nobody in the fiction is apologising for it. */}
      {contribution.fellElsewhere.length > 0 && (
        <>
          <Rule className="mt-8" />
          <p className="mt-8 font-mono text-[0.65rem] tracking-[0.3em] text-blood-lit uppercase">
            Lost while you were away
          </p>
          <ul className="mt-4 space-y-2">
            {contribution.fellElsewhere.map((world) => (
              <li key={world.id} className="leading-relaxed text-parchment/85">
                {world.name}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
