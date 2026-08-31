import { useState } from 'react';
import { Action, Backdrop, Eyebrow, Lockup, Panel, Rule } from '../components/Scene';
import { artFor } from '../engine/art';
import { BASE_STAT } from '../engine/character';
import { origins } from '../engine/content';
import { generateName } from '../engine/names';
import { STAT_IDS } from '../engine/types';
import type { OriginContent } from '../engine/types';
import { useGameStore } from '../store/gameStore';

// Origin and dossier are steps of one screen rather than two store screens: the store
// models the run, and neither of these exists once a run has started. The title is its own
// top-level screen now (src/screens/TitleScreen.tsx), reached before the sector chart
// rather than nested inside this one.
type Step = 'origin' | 'dossier';

function modifiers(origin: OriginContent) {
  return STAT_IDS.filter((stat) => origin.stat_modifiers?.[stat]).map((stat) => ({
    stat,
    value: origin.stat_modifiers?.[stat] ?? 0,
  }));
}

function OriginCard({
  origin,
  onSelect,
  onFocus,
}: {
  origin: OriginContent;
  onSelect: () => void;
  onFocus: () => void;
}) {
  const art = artFor(origin.id);
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onFocus}
      onFocus={onFocus}
      className="group cursor-pointer text-left focus-visible:outline-none"
    >
      <Panel className="h-full transition-colors duration-ui ease-cinematic group-hover:border-brass/80 group-focus-visible:border-brass-lit">
        {art && (
          <div className="overflow-hidden">
            <img
              src={art}
              alt=""
              className="w-full object-cover transition-transform duration-ui ease-cinematic group-hover:scale-105"
              style={{ aspectRatio: '16 / 9' }}
            />
          </div>
        )}
        <div className="p-5">
          <h2 className="font-display text-xl text-bone">{origin.name}</h2>
          <p className="mt-3 leading-relaxed text-parchment/80">{origin.description}</p>
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
            {modifiers(origin).map(({ stat, value }) => (
              <span key={stat} className="text-parchment/60">
                {stat}{' '}
                <span className={value > 0 ? 'text-brass-lit' : 'text-blood-lit'}>
                  {value > 0 ? '+' : ''}
                  {value}
                </span>
              </span>
            ))}
          </div>
        </div>
      </Panel>
    </button>
  );
}

export default function OriginSelect() {
  const startRun = useGameStore((state) => state.startRun);
  const [step, setStep] = useState<Step>('origin');
  const [focused, setFocused] = useState<OriginContent | undefined>(origins[0]);
  const [chosen, setChosen] = useState<OriginContent | null>(null);
  const [name, setName] = useState('');

  if (step === 'dossier' && chosen) {
    return (
      <>
        {/* The panel carries its own contrast, so the origin's art is left legible here:
            it is the last look at where this life started before the run buries it. */}
        <Backdrop src={artFor(chosen.id)} scrim="soft" />
        <div className="flex min-h-screen items-center px-6 py-16 sm:px-14">
          <Panel className="rise-in w-full max-w-2xl p-8 sm:p-10">
            <Eyebrow>Stage One / Dossier</Eyebrow>
            <h1 className="font-display mt-3 text-title text-bone">{chosen.name}</h1>

            <Rule className="mt-7" />

            <p className="mt-7 font-mono text-[0.7rem] tracking-[0.35em] text-parchment/60 uppercase">
              Name of record
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <p className="font-display text-3xl text-bone">{name}</p>
              <button
                type="button"
                onClick={() => setName(generateName(chosen))}
                className="cursor-pointer font-mono text-xs tracking-[0.25em] text-brass-lit uppercase transition-colors duration-quick ease-cinematic hover:text-bone"
              >
                Reroll
              </button>
            </div>

            <dl className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {STAT_IDS.map((stat) => {
                const modifier = chosen.stat_modifiers?.[stat] ?? 0;
                return (
                  <div
                    key={stat}
                    className="border border-brass/20 bg-ink/40 px-3 py-2 text-center font-mono"
                  >
                    <dt className="text-[0.65rem] tracking-widest text-parchment/60">{stat}</dt>
                    <dd className="mt-1 text-lg text-bone">
                      {BASE_STAT + modifier}
                      {modifier !== 0 && (
                        <span
                          className={`ml-1 text-xs ${modifier > 0 ? 'text-brass-lit' : 'text-blood-lit'}`}
                        >
                          {modifier > 0 ? '+' : ''}
                          {modifier}
                        </span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Action onClick={() => startRun(chosen.id, name)}>Begin</Action>
              <Action variant="ghost" onClick={() => setStep('origin')}>
                Back
              </Action>
            </div>
          </Panel>
        </div>
      </>
    );
  }

  return (
    <>
      <Backdrop src={artFor(focused?.id ?? '')} />
      <div className="flex min-h-screen flex-col justify-between gap-12 overflow-hidden px-6 py-12 sm:px-14">
        <Lockup className="max-w-2xl">
          <div className="rise-in">
            <Eyebrow>Stage One</Eyebrow>
            <h1 className="font-display mt-3 text-scene leading-tight text-bone">
              Where the record begins
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-parchment/80">
              The Imperium does not ask where you were born. It only asks what you can be made
              into afterwards.
            </p>
          </div>
        </Lockup>

        {origins.length === 0 ? (
          <p className="font-mono text-sm text-blood-lit">
            No origins found under /content/origins.
          </p>
        ) : (
          <div className="rise-stagger grid gap-5 md:grid-cols-3">
            {origins.map((origin) => (
              <OriginCard
                key={origin.id}
                origin={origin}
                onFocus={() => setFocused(origin)}
                onSelect={() => {
                  setChosen(origin);
                  setFocused(origin);
                  setName(generateName(origin));
                  setStep('dossier');
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
