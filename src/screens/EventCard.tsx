import { Action, Backdrop, Eyebrow, Lockup, Panel, Rule } from '../components/Scene';
import { stageArt } from '../engine/art';
import { describeStats } from '../engine/eligibility';
import { STAGE_LABELS } from '../engine/types';
import { useGameStore } from '../store/gameStore';

export default function EventCard() {
  const character = useGameStore((state) => state.character);
  const event = useGameStore((state) => state.currentEvent);
  const pending = useGameStore((state) => state.pending);
  const choose = useGameStore((state) => state.choose);
  const acknowledge = useGameStore((state) => state.acknowledge);

  if (!character || !event) return null;

  return (
    <>
      {/* Keyed to the stage rather than the event, so the backdrop holds steady through a
          run of decisions and only changes when the character's life does. The reading
          panel is opaque enough to carry its own contrast, so the art is left legible. */}
      <Backdrop src={stageArt(character.stage)} scrim="soft" />

      <div className="flex min-h-screen flex-col justify-between gap-10 overflow-hidden px-6 py-10 sm:px-14 sm:py-12">
        <Lockup className="max-w-xs">
          <Eyebrow className="text-parchment/70">{STAGE_LABELS[character.stage]}</Eyebrow>
        </Lockup>

        <Panel className="mx-auto w-full max-w-3xl p-7 sm:p-10">
          <p className="text-xl leading-relaxed text-parchment sm:text-2xl">{event.text}</p>

          {pending ? (
            <div key="outcome" className="rise-in">
              <Rule className="mt-8" />
              <p className="mt-8 text-lg leading-relaxed text-parchment/90">
                {pending.consequence.result_text}
              </p>
              {pending.check && (
                <p className="mt-5 font-mono text-xs tracking-widest text-parchment/60 uppercase">
                  {pending.check.roll} against {Math.round(pending.check.target)} / {' '}
                  {pending.check.result.replace(/_/g, ' ')}
                </p>
              )}
              <div className="mt-9">
                <Action onClick={acknowledge}>
                  {pending.consequence.terminal ? 'File the record' : 'Continue'}
                </Action>
              </div>
            </div>
          ) : (
            <ul className="rise-stagger mt-9 space-y-3">
              {event.choices.map((choice) => (
                <li key={choice.id}>
                  <button
                    type="button"
                    onClick={() => choose(choice.id)}
                    className="group flex w-full cursor-pointer items-baseline gap-4 border border-brass/20 bg-ink/40 px-5 py-4 text-left transition-colors duration-ui ease-cinematic hover:border-brass/70 hover:bg-brass/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-lit"
                  >
                    <span className="font-display text-lg text-parchment transition-colors duration-ui ease-cinematic group-hover:text-bone">
                      {choice.label}
                    </span>
                    {choice.stat_check && (
                      <span className="ml-auto shrink-0 font-mono text-[0.7rem] tracking-widest text-parchment/55 uppercase">
                        {describeStats(choice.stat_check.stat)}
                        {choice.stat_check.difficulty ? ` / ${choice.stat_check.difficulty}` : ''}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
