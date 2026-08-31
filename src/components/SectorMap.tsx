import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react';
import { artFor } from '../engine/art';
import type {
  CampaignContent,
  CampaignState,
  CampaignStatus,
  RegionContent,
  WorldType,
} from '../engine/types';

// GDD 10.4. Not a strategy map and not a diagram: a painted chart the size of a table,
// which you push around and lean into. The sector is bigger than the window on purpose.
//
// The chart is a single painting, generated once and calibrated against by hand in
// scripts/map-layout.mjs. It carries its own border, compass and rhumb lines, and it
// deliberately carries no lettering at all: every name here is live text, because a name
// painted into the image cannot be selected, cannot be translated, and would still say
// the world was contested after it fell.
//
// Three coordinate systems meet here.
//   Content authors positions as percentages of the chart, which survive any window size.
//   The paper is a fixed 4:3 box, because a painting cannot be stretched to fit a panel.
//   The transform is in pixels, because pan clamping and cursor-anchored zoom are pixel
//   problems and doing them in percentages means converting twice on every frame.
//
// Everything that has to stay legible is counter-scaled by 1/k: at four times zoom a
// world's name should be a name you can read, not a headline. The paper scales, the
// writing on it does not.

// The aspect the chart was generated at. Changing this without regenerating the painting
// stretches it.
const PAPER_ASPECT = 4 / 3;

// 1 is the whole chart on screen. There is nothing useful below it: zooming out past fit
// just puts a smaller painting on a bigger table.
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
// Below this, world names are suppressed. Forty labels at once is not a map, it is a wall
// of type, and the region names carry the chart until you lean in.
const LABEL_ZOOM = 1.45;
// How far past the edge the chart may be dragged. Some slack makes it feel like paper
// rather than a pane bolted to the frame.
const OVERSCROLL = 0.12;
// How far a pointer must travel before the gesture counts as a drag rather than a press.
// A finger on glass never holds still, so without a few pixels of slop every tap on a
// world would be read as a very small pan.
const DRAG_SLOP = 4;

const WORLD_GLYPH: Record<WorldType, string> = {
  hive: 'Hive world',
  forge: 'Forge world',
  agri: 'Agri world',
  shrine: 'Shrine world',
  death: 'Death world',
  void: 'Void station',
  mining: 'Mining world',
  feral: 'Feral world',
  fortress: 'Fortress world',
  dead: 'Dead world',
};

export function statusLabel(status: CampaignStatus): string {
  if (status === 'won') return 'Compliant';
  if (status === 'lost') return 'Lost';
  if (status === 'contested') return 'Contested';
  return 'Beyond survey';
}

export interface MapEntry {
  content: CampaignContent;
  state: CampaignState;
}

interface Transform {
  x: number;
  y: number;
  k: number;
}

interface Box {
  width: number;
  height: number;
}

const IDENTITY: Transform = { x: 0, y: 0, k: 1 };
const NO_BOX: Box = { width: 0, height: 0 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// The painting is contained in the frame rather than cropped by it, so at fit zoom the
// whole sector is on screen and the leftover frame is dark table around a lit chart.
function paperFor(frame: Box): Box {
  if (frame.width === 0 || frame.height === 0) return NO_BOX;
  const width = Math.min(frame.width, frame.height * PAPER_ASPECT);
  return { width, height: width / PAPER_ASPECT };
}

// Keeps the chart roughly over the frame. When an axis is smaller than the frame it is
// centred on that axis, because a small chart drifting into a corner reads as a bug
// rather than as freedom.
function clampPan(next: Transform, frame: Box, paper: Box): Transform {
  const slackX = frame.width * OVERSCROLL;
  const slackY = frame.height * OVERSCROLL;
  const spanX = paper.width * next.k;
  const spanY = paper.height * next.k;
  const x =
    spanX <= frame.width
      ? (frame.width - spanX) / 2
      : clamp(next.x, frame.width - spanX - slackX, slackX);
  const y =
    spanY <= frame.height
      ? (frame.height - spanY) / 2
      : clamp(next.y, frame.height - spanY - slackY, slackY);
  return { ...next, x, y };
}

// Where the chart opens: filling the frame rather than sitting inside it, centred.
//
// The paper is fitted to the narrower axis, so on a phone a 4:3 chart in a tall frame left
// a 316x237 map in a 316x456 box. Half the panel was empty, and worse, the six open worlds
// were 17.8px apart under 28px targets, so the two closest overlapped by ten pixels and the
// first tap on the sector was partly a guess. Opening filled puts those worlds 34px apart,
// clear of each other, and gives the phone a map worth dragging.
//
// On a desktop the frame is already 4:3, so this resolves to 1 and changes nothing. The Fit
// control is still there for seeing the whole sector at once.
function coverView(frame: Box, paper: Box): Transform {
  if (paper.width === 0 || paper.height === 0) return IDENTITY;
  const k = clamp(
    Math.max(frame.width / paper.width, frame.height / paper.height),
    MIN_ZOOM,
    MAX_ZOOM,
  );
  return clampPan(
    { k, x: (frame.width - paper.width * k) / 2, y: (frame.height - paper.height * k) / 2 },
    frame,
    paper,
  );
}

// The landmark within the mark. Status says what has happened to a world; this says what
// kind of world it was before anything happened to it, which is what the Cartography Corps
// would actually have drawn on a working chart. Ten line-glyphs, one per world type, drawn
// small and bold enough to read as a silhouette rather than as detail: a spire for a hive,
// a hammer for a forge, an arch for a shrine. A struck world carries no glyph, because the
// thing the glyph marked is no longer there to draw.
function WorldGlyph({ type, tone }: { type: WorldType; tone: string }) {
  const stroke = {
    stroke: tone,
    strokeWidth: 1,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  switch (type) {
    case 'hive':
      return <path d="M6 10.5 L8 5.5 L10 10.5" {...stroke} />;
    case 'forge':
      return <path d="M5.5 6.7 H10.5 M8 6.7 V11" {...stroke} />;
    case 'agri':
      return <path d="M8 11 V6.3 M6.2 7.7 L8 6.3 L9.8 7.7" {...stroke} />;
    case 'shrine':
      return <path d="M6 10.2 V7.6 Q6 5.6 8 5.6 Q10 5.6 10 7.6 V10.2" {...stroke} />;
    case 'death':
      return (
        <>
          <circle cx="8" cy="7.5" r="2.1" {...stroke} />
          <circle cx="7.15" cy="7.3" r="0.35" fill={tone} stroke="none" />
          <circle cx="8.85" cy="7.3" r="0.35" fill={tone} stroke="none" />
          <path d="M6.6 9.5 V10.5 M8 9.8 V10.9 M9.4 9.5 V10.5" {...stroke} />
        </>
      );
    case 'void':
      return <circle cx="8" cy="8" r="2.6" {...stroke} />;
    case 'mining':
      return <path d="M6 10.6 L9.6 6.2 M8.3 6.6 L10.6 7.8" {...stroke} />;
    case 'feral':
      return <path d="M6.3 6.6 L7 10.2 M8 6.1 L8.5 10.4 M9.7 6.6 L10.3 10.2" {...stroke} />;
    case 'fortress':
      return (
        <path
          d="M5.6 10.6 H10.4 M6.1 10.6 V8.2 H7.1 V9.5 H8 V8.2 H9 V9.5 H9.9 V8.2"
          {...stroke}
        />
      );
    case 'dead':
      return (
        <>
          <circle cx="8" cy="8" r="2.6" strokeDasharray="1.6 1.3" {...stroke} />
          <path d="M6.9 6.9 L8.2 8.1 L7.3 9.6" {...stroke} />
        </>
      );
    default:
      return null;
  }
}

// The mark itself. Ink on paper, in the register of the painting rather than of the
// interface: a filled lozenge for a world on the record, a hollow one for a world still
// being fought over, and a struck cross for one that is gone. Status is the one thing on
// this screen colour is allowed to encode, because it is state and not decoration.
function Mark({
  status,
  worldType,
  selected,
}: {
  status: CampaignStatus;
  worldType?: WorldType;
  selected: boolean;
}) {
  const halo = 'stroke-vellum/85';
  if (status === 'lost') {
    return (
      <svg viewBox="0 0 16 16" className="h-5 w-5 overflow-visible" aria-hidden>
        <g strokeWidth="4.5" strokeLinecap="round" className={halo} fill="none">
          <path d="M4 4 L12 12 M12 4 L4 12" />
        </g>
        <g
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          stroke="var(--color-chart-blood)"
        >
          <path d="M4 4 L12 12 M12 4 L4 12" />
        </g>
      </svg>
    );
  }

  const contested = status === 'contested';
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 overflow-visible" aria-hidden>
      {selected && contested && (
        <circle
          cx="8"
          cy="8"
          r="6"
          fill="none"
          strokeWidth="1.4"
          stroke="var(--color-chart-blood)"
          className="pulse-ring origin-center"
        />
      )}
      {/* Drawn twice: a fat vellum pass underneath is the halo that keeps the mark
          visible where the painting darkens into its corners. */}
      <path
        d="M8 2.5 L13.5 8 L8 13.5 L2.5 8 Z"
        strokeWidth="4"
        strokeLinejoin="round"
        fill="none"
        className={halo}
      />
      <path
        d="M8 2.5 L13.5 8 L8 13.5 L2.5 8 Z"
        strokeWidth="1.8"
        strokeLinejoin="round"
        stroke={contested ? 'var(--color-chart-blood)' : 'var(--color-chart-ink)'}
        fill={contested ? 'var(--color-vellum)' : 'var(--color-chart-ink)'}
      />
      {/* The glyph reads against whatever the lozenge is filled with: ink on the pale
          fill of a contested world, vellum on the solid ink of one already held. */}
      {worldType && (
        <WorldGlyph type={worldType} tone={contested ? 'var(--color-chart-ink)' : 'var(--color-vellum)'} />
      )}
      {selected && (
        <circle
          cx="8"
          cy="8"
          r="8.5"
          fill="none"
          strokeWidth="1.2"
          stroke="var(--color-chart-ink)"
        />
      )}
    </svg>
  );
}

function Node({
  entry,
  locked,
  selected,
  scale,
  labelled,
  onSelect,
}: {
  entry: MapEntry;
  locked: boolean;
  selected: boolean;
  scale: number;
  labelled: boolean;
  onSelect: () => void;
}) {
  const { content, state } = entry;
  // Anchored at its position, then counter-scaled so the mark is the same size on the
  // screen at every zoom. The chart grows, the pin does not.
  const anchor = {
    left: `${content.position.x}%`,
    top: `${content.position.y}%`,
    transform: `translate(-50%, -50%) scale(${1 / scale})`,
  };

  // A world in an unopened region is a mark under the veil and nothing else. It is drawn
  // so the sector looks like a place from the first life rather than filling in as you
  // go, but it has no name, no dossier and nothing to click.
  if (locked) {
    return (
      <span
        aria-hidden
        className="absolute block h-1.5 w-1.5 rotate-45 border border-chart-ink/40"
        style={anchor}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      /* The mark is 16px and the target around it is not. Measured on a phone the button
         was exactly the size of the mark, which is a 16px target. It is not widened to
         the full 44px because the two feral worlds in the Silent Marches sit 32px apart
         at fit zoom and 44px targets would overlap, so tapping one would select the
         other. 28px is what fits between them; the zoom is there for when it is not. */
      className="absolute flex h-7 w-7 cursor-pointer items-center justify-center focus-visible:outline-none"
      style={anchor}
      aria-current={selected ? 'true' : undefined}
      /* Without this the chart is forty buttons with no accessible name at all. */
      aria-label={`${content.name}, ${statusLabel(state.status).toLowerCase()}`}
    >
      <Mark status={state.status} worldType={content.world_type} selected={selected} />

      {/* The name only exists once you have leaned in far enough that names can fit. It
          gets its own vellum plate rather than sitting on the painting, because the paper
          runs from near-white in the middle to about rgb(102 82 57) in the corners and
          type cannot rely on what happens to be behind it. A working chart has printed
          slips gummed to it anyway. */}
      {labelled && (
        <span className="absolute top-6 left-1/2 w-32 -translate-x-1/2 border border-chart-ink/25 bg-vellum px-1 py-0.5 text-center font-mono text-[0.6rem] leading-tight tracking-[0.1em] text-chart-ink uppercase">
          {content.name}
        </span>
      )}
    </button>
  );
}

export default function SectorMap({
  entries,
  regions,
  playerLevel,
  selectedId,
  onSelect,
  className = '',
}: {
  entries: MapEntry[];
  regions: RegionContent[];
  playerLevel: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Box>(NO_BOX);
  const [view, setView] = useState<Transform>(IDENTITY);
  const [dragging, setDragging] = useState(false);
  // Live pointers, for panning with one and pinching with two. Held in a ref rather than
  // state: they change on every move and none of them should cause a render on their own.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  // Where each pointer went down, so a press can be told from a drag before deciding to
  // capture it. See onPointerMove.
  const origin = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; k: number } | null>(null);
  // Whether the opening view has been chosen. See the effect below.
  const framed = useRef(false);

  const paper = useMemo(() => paperFor(size), [size]);
  const chart = artFor('sector_chart');

  useLayoutEffect(() => {
    const node = frame.current;
    if (!node) return;
    // Measured once here, synchronously, before the observer is trusted for anything. The
    // paper is sized from this, so until a measurement arrives the chart is a 0x0 box and
    // the screen is empty. ResizeObserver only delivers during the rendering steps, so a
    // tab that mounts while occluded gets no callback and used to sit blank until it was
    // touched. A layout effect already runs after layout, so the box is there to be read.
    const first = node.getBoundingClientRect();
    if (first.width > 0 && first.height > 0) {
      setSize({ width: first.width, height: first.height });
    }
    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.contentRect;
      if (box) setSize({ width: box.width, height: box.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Re-clamped whenever the frame changes, so a rotated phone or a resized window cannot
  // leave the chart parked off screen where nothing can drag it back.
  useEffect(() => {
    if (size.width === 0) return;
    const measured = paperFor(size);
    // The opening view is chosen once, on the first real measurement. After that a size
    // change is a rotation or a window resize, and the chart stays where the player put it.
    if (!framed.current) {
      framed.current = true;
      setView(coverView(size, measured));
      return;
    }
    setView((current) => clampPan(current, size, measured));
  }, [size]);

  const zoomAbout = useCallback(
    (factor: number, originX: number, originY: number) => {
      setView((current) => {
        const k = clamp(current.k * factor, MIN_ZOOM, MAX_ZOOM);
        // The point under the cursor stays under the cursor. Without this, zooming walks
        // the chart away from whatever you were looking at, which is the single most
        // common way a pan and zoom surface ends up feeling broken.
        const ratio = k / current.k;
        return clampPan(
          {
            k,
            x: originX - (originX - current.x) * ratio,
            y: originY - (originY - current.y) * ratio,
          },
          size,
          paper,
        );
      });
    },
    [size, paper],
  );

  const onWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const box = frame.current?.getBoundingClientRect();
    if (!box) return;
    // Exponential rather than linear, so one notch of a trackpad and one notch of a mouse
    // wheel both feel like the same proportion of a zoom.
    zoomAbout(Math.exp(-event.deltaY * 0.0016), event.clientX - box.left, event.clientY - box.top);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    origin.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) setDragging(true);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const next = { x: event.clientX, y: event.clientY };

    // Capture is taken on the first real movement, never on pointerdown. Capturing
    // immediately retargets the compatibility click to this frame, which silently ate the
    // click on all forty world buttons: the marker was pressed, the frame got the click,
    // and the dossier never changed. Deferring it means a tap reaches the button, while a
    // drag that started on a marker still pans the chart and still ends without selecting
    // anything, because by then the frame holds the pointer.
    const start = origin.current.get(event.pointerId);
    if (start && !event.currentTarget.hasPointerCapture(event.pointerId)) {
      if (Math.hypot(next.x - start.x, next.y - start.y) < DRAG_SLOP) return;
      // Capture only keeps the drag alive once it leaves the frame, so it must never be
      // able to kill the drag itself. It throws NotFoundError when the pointer is already
      // gone, which happens on a fast flick where the release lands between the move being
      // queued and this running, and an uncaught throw here would abandon the pan mid
      // gesture with the chart stuck under the cursor.
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Panning still works from the frame's own events. Nothing to recover.
      }
    }

    pointers.current.set(event.pointerId, next);

    const live = [...pointers.current.values()];
    if (live.length >= 2) {
      const [a, b] = live as [{ x: number; y: number }, { x: number; y: number }];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const box = frame.current?.getBoundingClientRect();
      if (!pinch.current || distance === 0 || !box) {
        pinch.current = { distance, k: view.k };
        return;
      }
      zoomAbout(
        distance / pinch.current.distance,
        (a.x + b.x) / 2 - box.left,
        (a.y + b.y) / 2 - box.top,
      );
      pinch.current = { distance, k: view.k };
      return;
    }

    setView((current) =>
      clampPan(
        { ...current, x: current.x + (next.x - previous.x), y: current.y + (next.y - previous.y) },
        size,
        paper,
      ),
    );
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    origin.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) setDragging(false);
  };

  const openRegionIds = new Set(
    regions.filter((region) => playerLevel >= region.min_player_level).map((region) => region.id),
  );
  const sealed = regions.filter((region) => !openRegionIds.has(region.id));
  const labelled = view.k >= LABEL_ZOOM;

  return (
    <div
      ref={frame}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      className={`relative touch-none overflow-hidden select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
    >
      <div
        className="absolute top-0 left-0 origin-top-left shadow-[0_0_3rem_rgba(0,0,0,0.75)]"
        style={{
          width: paper.width,
          height: paper.height,
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
        }}
      >
        {chart && (
          <img
            src={chart}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full object-fill select-none"
          />
        )}

        <svg
          aria-hidden
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            {/* The veil is drawn from rectangles and must not look like rectangles. Blur
                is what turns a bounding box into an unsurveyed patch of paper, and it is
                also what merges two adjacent sealed regions into one absence instead of
                two boxes with a seam down the middle. */}
            <filter id="chart-veil" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="2.6" />
            </filter>
          </defs>

          {/* A region you have no standing to enter is not drawn, because the Cartography
              Corps had no reason to draw it. Unlocking one is the chart being filled in
              rather than a border changing colour. Not fully opaque: the land under it
              ghosts through, which is the difference between blank paper and a hole. */}
          <g filter="url(#chart-veil)">
            {sealed.map((region) => (
              <rect
                key={region.id}
                x={region.bounds.x}
                y={region.bounds.y}
                width={region.bounds.width}
                height={region.bounds.height}
                fill="var(--color-vellum)"
                fillOpacity="0.9"
              />
            ))}
          </g>
        </svg>

        {/* Region names sit above their own footprint rather than inside it, because
            inside they land on whichever world happens to occupy that corner. They are
            counter-scaled like everything else that has to be read, and they hug whichever
            vertical edge of the region is nearer the edge of the chart, so a name on the
            far right runs back into the sector instead of off the paper. A closed region
            says what it costs, because a locked thing with no price on it is just an
            absence. */}
        {regions.map((region) => {
          const open = openRegionIds.has(region.id);
          const rightEdge = region.bounds.x + region.bounds.width;
          const hugRight = rightEdge > 85;
          return (
            <div
              key={region.id}
              className={`pointer-events-none absolute whitespace-nowrap border border-chart-ink/25 bg-vellum px-2 py-1 ${hugRight ? 'origin-top-right' : 'origin-top-left'}`}
              style={{
                ...(hugRight ? { right: `${100 - rightEdge}%` } : { left: `${region.bounds.x}%` }),
                top: `${region.bounds.y}%`,
                transform: `translateY(-1.75rem) scale(${1 / view.k})`,
              }}
            >
              <p
                className={`font-display text-[0.7rem] leading-none tracking-[0.2em] uppercase ${open ? 'text-chart-ink' : 'text-chart-ink/75'}`}
              >
                {region.name}
              </p>
              {!open && (
                <p className="mt-1 font-mono text-[0.55rem] leading-none tracking-[0.16em] text-chart-blood uppercase">
                  Sealed / Grade {region.min_player_level}
                </p>
              )}
            </div>
          );
        })}

        {entries.map((entry) => (
          <Node
            key={entry.content.id}
            entry={entry}
            locked={!openRegionIds.has(entry.content.region)}
            selected={entry.content.id === selectedId}
            scale={view.k}
            labelled={labelled}
            onSelect={() => onSelect(entry.content.id)}
          />
        ))}
      </div>

      {/* Controls sit over the chart rather than in it, so they do not pan away. Wheel and
          drag are the real interface; these exist for touch and for anyone who does not
          know that yet. They stay in the interface's palette rather than the chart's,
          because they are not part of the document. */}
      <div className="absolute right-3 bottom-3 flex items-center gap-px">
        {(
          [
            ['Zoom out', '−', () => zoomAbout(1 / 1.4, size.width / 2, size.height / 2)],
            ['Zoom in', '+', () => zoomAbout(1.4, size.width / 2, size.height / 2)],
            ['Fit the whole chart', 'Fit', () => setView(clampPan(IDENTITY, size, paper))],
          ] as const
        ).map(([label, glyph, action]) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={action}
            /* Sized to a finger, not to the glyph. Measured at 390px these were 28 by 25,
               which is under the 44px touch target on the one screen whose entire premise
               is that you drag and pinch it. */
            className="duration-ui ease-cinematic flex h-11 min-w-11 cursor-pointer items-center justify-center border border-brass/40 bg-ink/85 px-3 font-mono text-xs text-parchment/80 uppercase transition-colors hover:border-brass-lit hover:text-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-lit"
          >
            {glyph}
          </button>
        ))}
      </div>
    </div>
  );
}

export { WORLD_GLYPH };
