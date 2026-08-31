import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

// Every screen is art first and interface second, so the shared furniture lives here:
// the full-viewport backdrop, the readability scrim, and the framed surfaces that sit
// on top of it. Screens compose these and own nothing about how the art is presented.

type ScrimWeight = 'soft' | 'heavy';

// `soft` is for screens that are mostly art with one line of type over it. `heavy` is for
// anything the player has to read at length. Both are additive over the image: a vignette
// to pull the eye inward, a floor gradient so bottom-anchored type never sits on detail,
// and a flat wash that guarantees a floor on contrast wherever the art happens to be pale.
const SCRIM: Record<ScrimWeight, string> = {
  soft: [
    'radial-gradient(120% 90% at 50% 35%, transparent 30%, rgba(20,17,14,0.72) 100%)',
    'linear-gradient(to top, rgba(20,17,14,0.95) 0%, rgba(20,17,14,0.35) 38%, transparent 62%)',
    'linear-gradient(to bottom, rgba(20,17,14,0.6) 0%, transparent 30%)',
  ].join(', '),
  heavy: [
    'radial-gradient(120% 90% at 50% 35%, transparent 10%, rgba(20,17,14,0.8) 100%)',
    'linear-gradient(to top, rgba(20,17,14,0.97) 0%, rgba(20,17,14,0.7) 45%, rgba(20,17,14,0.3) 80%)',
    'linear-gradient(to bottom, rgba(20,17,14,0.7) 0%, transparent 35%)',
  ].join(', '),
};

export function Backdrop({ src, scrim = 'heavy' }: { src?: string; scrim?: ScrimWeight }) {
  // Two layers so a scene change dissolves rather than cuts. The incoming image fades in
  // over the outgoing one and, once opaque, hides it: nothing has to be torn down on a
  // timer, so an interrupted transition cannot leave the backdrop blank.
  const [layers, setLayers] = useState<string[]>(src ? [src] : []);

  useEffect(() => {
    if (!src) return;
    setLayers((prev) => (prev.at(-1) === src ? prev : [...prev, src].slice(-2)));
  }, [src]);

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-ink">
      {layers.map((layer, index) => (
        <div
          key={`${index}-${layer}`}
          className={index === layers.length - 1 ? 'absolute inset-0 scene-in' : 'absolute inset-0'}
        >
          <img src={layer} alt="" className="h-full w-full object-cover drift" />
        </div>
      ))}
      <div className="absolute inset-0" style={{ background: SCRIM[scrim] }} />
    </div>
  );
}

// Type sitting straight on the art cannot rely on the global scrim: the generated images
// put god rays and blown-out sky in unpredictable places, and a scrim strong enough to
// cover the worst of them would flatten every image. So each block of unpanelled type
// carries its own plate, sized to the text and feathered far enough out that the falloff
// is never visible as an edge.
export function Lockup({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-[14vw] -inset-y-32"
        style={{
          background:
            'radial-gradient(65% 62% at 32% 50%, rgba(20,17,14,0.90) 0%, rgba(20,17,14,0.84) 38%, rgba(20,17,14,0.50) 68%, transparent 100%)',
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

// Brass corner marks. The single cheapest way to make a plain rectangle read as a piece of
// deliberate chrome rather than a div, which is most of the difference between this and
// the flat bordered boxes it replaces.
function Corners() {
  const shared = 'pointer-events-none absolute h-3 w-3 border-brass/70';
  return (
    <>
      <span className={`${shared} -top-px -left-px border-t border-l`} />
      <span className={`${shared} -top-px -right-px border-t border-r`} />
      <span className={`${shared} -bottom-px -left-px border-b border-l`} />
      <span className={`${shared} -right-px -bottom-px border-r border-b`} />
    </>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative border border-brass/25 bg-ink/85 shadow-[0_2rem_4rem_-1rem_rgba(0,0,0,0.85)] backdrop-blur-md ${className}`}
    >
      <Corners />
      {children}
    </div>
  );
}

// A hairline that fades out at both ends instead of stopping dead, so it reads as an
// ornament rather than a table border.
export function Rule({ className = '' }: { className?: string }) {
  return (
    <div
      className={`h-px w-full ${className}`}
      style={{
        background:
          'linear-gradient(to right, transparent, var(--color-brass) 15%, var(--color-brass) 85%, transparent)',
        opacity: 0.8,
      }}
    />
  );
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-mono text-[0.7rem] tracking-[0.35em] text-brass-lit uppercase ${className}`}>
      {children}
    </p>
  );
}

type ActionProps = {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'ghost';
  className?: string;
};

export function Action({ children, onClick, variant = 'primary', className = '' }: ActionProps) {
  const base =
    'font-display cursor-pointer px-8 py-3 text-sm tracking-[0.25em] uppercase transition-colors duration-ui ease-cinematic focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass-lit';
  const look =
    variant === 'primary'
      ? 'border border-brass/70 bg-brass/15 text-brass-lit hover:border-brass-lit hover:bg-brass-lit hover:text-ink'
      : 'border border-transparent text-parchment/75 hover:text-bone';
  return (
    <button type="button" onClick={onClick} className={`${base} ${look} ${className}`}>
      {children}
    </button>
  );
}
