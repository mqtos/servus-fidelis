# Technical Architecture
## Servus Fidelis

## 1. Stack Recommendation

**React + Vite, static site, no backend for v1.**

Reasoning:
- Audience is "me and my friends," not the general public. No accounts, no
  leaderboards, no server needed. Every requirement (save/replay, art, branching
  content) is servable as static assets.
- React fits the existing skill set already in use (atelier, frontend-design skills
  are React-oriented) and makes the heavy visual-polish requirement easier since
  there's good component/animation tooling available (Framer Motion, GSAP if the
  atelier skill patterns apply here too).
- Vite for fast dev iteration in the Claude Code session.
- Deployable anywhere static (Vercel/Netlify/GitHub Pages), zero hosting cost.

If down the line you want shared leaderboards ("show me everyone's worst deaths") or
persistent accounts, that's a clean v2 addition (Supabase or similar), doesn't require
re-architecting v1.

## 2. Content as Data, Not Code

All origins/events/vignettes/endings live as **structured JSON (or YAML compiled to
JSON at build time)**, matching the schemas in the Content Bible. The game engine is
a generic interpreter that:

1. Loads the content pack
2. Tracks character state (stats, tags, history log, current stage)
3. Resolves eligibility (`requires` blocks) to build the pool of available events per
   stage
4. Renders the current event as a card, handles choice selection, applies
   consequences
5. Progresses stages, eventually resolves to an ending

This means **content authoring and engine building are decoupled**, you (or I, in the
Claude Code session) can keep adding events/vignettes/endings as JSON files without
touching game logic. Recommend a `/content` directory structure mirroring the Content
Bible sections:

```
/content
  /origins/*.json
  /events/childhood/*.json
  /events/recruitment/*.json
  /events/training/*.json
  /vignettes/*.json
  /endings/*.json
```

A build step (or simple runtime fetch/import) aggregates these into the pools the
engine reads from.

## 3. Character State Shape

```ts
interface CharacterState {
  name: string;
  originId: string;
  stats: {
    WS: number; BS: number; S: number; T: number; Ag: number;
    Int: number; Per: number; WP: number; Fel: number;
  };
  tags: Set<string>;
  stage: StageId;
  history: HistoryEntry[];   // log of every choice made, needed for the Service Record
  age: number;
  branch: BranchId | null;
  status: 'alive' | 'dead' | 'discharged' | 'legend' | 'ascended';
}

interface HistoryEntry {
  eventId: string;
  choiceId: string;
  stageAtTime: StageId;
  resultText: string;
}
```

The `history` log is what powers the end-of-run Service Record summary, recommend
generating that summary by walking the history log and picking out the most narratively
significant entries (tag-granting choices, terminal events, branch-fork events) rather
than showing every single childhood event, to keep it readable.

## 4. Save / Persistence

Given no backend for v1:

- **In-progress runs**: `localStorage`, autosave after every choice. Resume on
  reload.
- **Completed runs / Service Records**: exportable as a shareable artifact. Two
  reasonable options, can do both:
  - Export as a JSON blob the player can re-import (lets a friend "replay" your
    exact history read-only, or literally hand you a save file)
  - Export as a **generated shareable image** (the Service Record dossier,
    rendered to canvas/PNG), which is genuinely the more fun option given "for me and
    my friends" and the visual-quality priority. People want to post a screenshot of
    "PRIVATE MARCUS VOSS — DIED HOLDING A BRIDGE NOBODY REMEMBERS THE NAME OF" more
    than they want a JSON file.
- No login, no cloud sync needed for v1.

## 5. Rendering the Life-Stage Flow

Recommend a simple state machine / router-less SPA (no need for React Router, this
isn't a multi-page site): a single `<GameScreen>` that swaps between:

- `OriginSelect`
- `EventCard` (used for every stage's individual decision beats, including vignette
  beats)
- `StageTransition` (a short beat/animation between stages, good place for stage-title
  card art)
- `ServiceRecord` (final summary screen)

Animation-heavy transitions between these are a good target for the visual-polish
priority, this is exactly what GSAP/Framer Motion are good at, and it's a natural fit
for the atelier skill's design sensibilities if that skill's patterns apply to
game-like UIs as well as marketing sites (worth checking when we get to build).

## 6. Stat Check Resolution (engine logic)

Small pure function, no external dependency needed:

```ts
function resolveCheck(stats: CharacterState['stats'], check: StatCheck): CheckResult {
  const relevantStats = check.stat.map(s => stats[s]);
  const avg = relevantStats.reduce((a,b) => a+b, 0) / relevantStats.length;
  const target = avg + (check.difficulty ?? 0);
  const roll = Math.floor(Math.random() * 100) + 1;
  if (roll <= target * 0.2) return 'critical_success';
  if (roll <= target) return 'success';
  if (roll >= 96) return 'critical_failure';
  return 'failure';
}
```
(Illustrative, not final, exact thresholds are a tuning pass once real content exists
and we can playtest pacing. Worth flagging now: this needs playtesting to avoid
either "you basically never die" or "everyone dies in childhood," should be an early
Claude Code task to build a quick simulation harness that runs thousands of fake
playthroughs and reports outcome distribution.)

## 7a. War Effort Meta-Progression (Section 10 of GDD)

Solo, local-only, per the confirmed direction, no backend needed.

### Data shape

```ts
interface SectorState {
  campaigns: CampaignState[];
  activeCampaignIndex: number;
}

interface CampaignState {
  id: string;              // matches content file id
  contributionSoFar: number;
  status: 'pending' | 'active' | 'won' | 'lost';
}
```

Stored in `localStorage` as a sibling key to run-state, e.g. `sector_state`. This is
deliberately separate from any single `CharacterState`, it persists *across* runs
and outlives any individual character's death/discharge.

### Flow

1. On app load, hydrate `SectorState` from localStorage (or initialize fresh: all
   campaigns `pending` except campaign at `order: 1`, which starts `active`).
2. On every run's terminal event (death/discharge/ascension/etc.), look up
   `contribution_weights[ending_category]` from the global config (Content Bible
   Section 7.5), add it to the active campaign's `contributionSoFar`.
3. If `contributionSoFar >= threshold`, resolve the campaign: mark `won` (if net
   positive) or `lost` (if a soft ceiling was hit without reaching threshold, see
   Content Bible note on forced resolution), show the resolution summary, advance
   `activeCampaignIndex`, mark the next campaign `active`.
4. Persist `SectorState` back to localStorage after every run.

### UI surfaces needed

- **Sector Status screen** (GDD 10.4): reads `SectorState`, renders the campaign
  list/map, progress bar for the active campaign, resolved-campaign log.
- **Service Record screen**: needs one additional line showing this run's
  contribution and to which campaign, small addition to the existing summary
  logic (Section 3, `history`-log-based summary generation).

### Note on eventual multiplayer/shared version

If a shared/friend-group war ever becomes desired later (explicitly deferred per the
confirmed solo-only direction), the clean upgrade path is: same `CampaignState`
shape, just persisted server-side instead of localStorage, with contribution writes
becoming API calls instead of local writes. Nothing in this design blocks that later
addition, flagging only so Claude Code doesn't need to redesign the shape if that
comes up.

## 7b. Relics, Medal Wall, Regiment Reputation & Player Level (Section 12 of GDD)

All account-wide (persist across runs, not per-character), all local-only, stored
alongside `SectorState` in localStorage.

### Data shape

```ts
interface MetaProgressState {
  playerXP: number;
  playerLevel: number;               // derived from playerXP via a threshold table
  unlockedRelics: string[];          // relic ids earned, ever
  collectedMedals: string[];         // medal ids earned, ever
  regimentReputation: number;        // single scalar, nudged per run ending
  runHistory: RunSummary[];          // lightweight log, one entry per completed run
}

interface RunSummary {
  characterName: string;
  endingCategory: string;
  tagsEarned: string[];
  timestamp: number;
}
```

### Flow (on every run's terminal event)

1. Look up `xp_by_ending_category[endingCategory]` (Content Bible Section 7.6), add
   to `playerXP`, recompute `playerLevel` from the threshold table.
2. Check each Relic's `trigger` condition (Content Bible Section 7.6) against the
   character's final tags/ending; any newly satisfied relic gets added to
   `unlockedRelics` if not already present (relics don't re-trigger once owned).
3. Check the curated medal-tag mapping; any new tag-to-medal matches get added to
   `collectedMedals`.
4. Nudge `regimentReputation` by a small signed amount based on ending category
   (glory-adjacent endings positive, disgrace-adjacent negative, most others neutral
   or a small positive baseline for simply completing a life).
5. Append a `RunSummary` to `runHistory` (used by the Medal Wall / Chapter Archive
   screens to show "which run earned this").
6. Feed the same terminal event into the War Effort flow (Section 7a), these two
   updates happen together, not as separate passes.
7. Persist `MetaProgressState` to localStorage.

### UI surfaces needed

- **Chapter Archive** screen: lists unlocked Relics with flavor text and which run
  earned them.
- **Medal Wall** screen: grid of medals, collected (full icon) vs. uncollected
  (silhouette), per GDD 12.2.
- **Player Level** indicator: small persistent UI element (not intrusive, this is a
  background meta-stat, not the main focus of any given run) plus a small "+X XP"
  beat on the Service Record screen.
- Relic effects that modify origin/recruitment flavor text (Content Bible
  `origin_flavor_override`) need the content-eligibility resolver (Tech Architecture
  Section 2/Content Bible Section 1) to also check `unlockedRelics`, not just the
  current character's own tags, this is the one place cross-run state feeds back into
  in-run content selection.
- **Level-gated content**: the same content eligibility resolver also checks each
  content file's optional `min_player_level` field (Content Bible "Level Gate Tiers")
  against `MetaProgressState.playerLevel`. This is a single additional comparison
  alongside existing `requires` checks, not a separate system, campaigns, vignettes,
  relics, and origins can all carry this field.

## 7. Data Model Note for Future "Legacy" Mode

Not building this in v1, but to avoid painting ourselves into a corner: keep
`CharacterState` as a standalone record keyed by a run ID, rather than assuming
exactly one character ever exists. That's the only forward-compatibility tax worth
paying now, a future regiment/dynasty mode would just mean storing an array of past
`CharacterState` records and referencing them, no need to design further than that
today.

## 8. Recommended Libraries

- **React + Vite** — core
- **Framer Motion** — card transitions, stage transitions
- **Zustand** (or plain React context, given the state shape is small) — game state
- **html-to-image** or canvas-based rendering — for the Service Record shareable image
  export
- Tailwind — likely, given atelier/frontend-design skill patterns, confirm when
  entering the build session

## 9. What This Doc Deliberately Does Not Cover

- Art pipeline (separate doc, decision still open)
- Full content (separate doc, content bible)
- Deployment specifics (trivial once built, decide at build time: Vercel is the path
  of least resistance)
