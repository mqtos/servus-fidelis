# Build Roadmap
## Servus Fidelis — Phased Plan for Claude Code

Goal: get to a genuinely playable, good-looking vertical slice fast, then expand
content breadth. Don't try to author all content before anything is playable, that's
the classic trap.

## Phase 0 — Scaffold
- Vite + React project init
- Tailwind + chosen fonts wired in
- Basic routing-less state machine shell (Origin → EventCard → StageTransition →
  ServiceRecord, per Tech Architecture doc)
- Zustand (or context) store with the `CharacterState` shape
- Content loader that reads `/content/**/*.json`

**Exit criteria:** can click through a hardcoded 3-event fake stage and see stats
change in a debug panel. Nothing pretty yet.

## Phase 1 — Vertical Slice (one full path, real content, real art)
- Author: 3 origins, ~10 childhood events, the recruitment fork event, ~5 training
  events, a first-deployment sequence, ONE full Stage 6 branch (recommend Line
  Infantry, it's the default/most common), 2-3 Stage 7 vignettes, 3-4 endings
  spanning different categories.
- Build the stat check resolver, wire up eligibility filtering (`requires` blocks)
- Build the Service Record summary screen + history-log-to-summary logic
- Lock the visual style: generate test art (Option B approach from Art Direction
  doc), pick the final look, apply to UI chrome
- Generate the first real art batch for this slice's stage transitions + this
  branch's ending(s)

**Exit criteria:** you can play start-to-finish, get a real ending, and it looks
good. This is the "show a friend" milestone.

## Phase 2 — Branch Expansion & War Effort
- Author remaining Stage 6 branches: Officer, Commissariat, Inquisition acolyte
- Author the Astartes golden-branch mini-arc (aspirant trials)
- Expand Stage 7 vignette pool to target (10-15 total across branches)
- Expand endings to cover all 7 categories from the Content Bible
- Playtest-simulate outcome distribution (the simulation harness idea from Tech
  Architecture doc Section 6), tune stat check difficulty so death rates/branch
  rarities feel right (Astartes should be rare-rare, "pointless death" should be
  common enough to be funny/painful, not so common every run ends in 30 seconds)
- **Build the War Effort meta-layer** (GDD Section 10, Tech Architecture Section 7a):
  sector state persistence, contribution-on-run-end logic, Sector Status screen,
  Service Record contribution line
- Author the sector campaign set (5-8 campaigns, Content Bible Section 7.5), tune
  `contribution_weights` alongside the outcome-distribution simulation work above,
  these two tuning passes are related (a rebalance of death/branch rarity affects how
  fast campaigns resolve, do them together)
- **Build the Relic/Medal/Player Level meta-progression layer** (GDD Section 12,
  Tech Architecture Section 7b): `MetaProgressState` persistence, XP/level-up logic,
  Chapter Archive screen, Medal Wall screen, Relic-aware content eligibility (relics
  can reflavor origin/recruitment text)
- Author 8-12 Relics and 20-30 Medals (Content Bible Section 7.6), tune
  `xp_by_ending_category` alongside the other two weight tables in this phase, all
  three (War Effort contribution, Player XP, Relic triggers) key off the same
  `ending_category`/tag data, review them together rather than in isolation
- **Build Regiment Reputation** (GDD Section 12.3, pulled into this phase): single
  persistent scalar nudged per run ending, feeds into origin/recruitment flavor text
  selection, reuses the same run-history plumbing as the systems above, small
  addition once that plumbing exists
- **Tag content with `min_player_level`** for the three confirmed gate tiers (30/50/
  70, see GDD Section 12.4 and Content Bible "Level Gate Tiers"): author at least one
  Tier 2 campaign, one Tier 3 vignette pool addition, and ensure the rarest Relic(s)
  are gated to Tier 4 (level 70) so there's real endgame content, not just a number
  that goes up with nothing behind it

**Exit criteria:** all branches reachable, distribution feels right, replaying
multiple times produces genuinely different stories, AND finishing a run visibly
moves the sector war forward, with a Sector Status screen worth checking between
runs, AND the meta-progression layer (Relics, Medal Wall, Player Level) is live and
gives a reason to keep starting new runs even after seeing most endings once.

## Phase 3 — Content Breadth & Polish
- Fill out remaining origins (Death World, Forge World, Shrine World, Void-Born,
  Penal Colony, Agri World)
- Expand Childhood/Recruitment/Training event pools for more variety per playthrough
- Full art pass: procedural heraldry system, scar/damage overlays, remaining
  transition art
- Shareable Service Record image export (canvas/html-to-image)
- Save/resume via localStorage, polish animations/transitions

**Exit criteria:** feels like a finished, replayable game you'd actually hand to
friends without caveats.

## Phase 4 — Stretch (only if Phase 3 lands and there's appetite)
- Legacy/dynasty mode exploration (per the data-model note in Tech Architecture)
- Runtime art generation experiment (Option C from Art Direction doc)
- Leaderboard/shared-run comparison if you want a lightweight backend

## Sequencing Notes

- Content authoring (Content Bible schemas) and engine building can happen in
  parallel once Phase 0 is done, the schema is the contract between them.
- Recommend doing the outcome-distribution simulation harness *before* Phase 3
  content breadth work, tuning is much easier with a small content set than a large
  one, don't want to author 50 events then discover the difficulty curve is wrong.
- Art generation should happen in batches tied to phases, not all upfront, so style
  lessons from Phase 1 inform Phase 2/3 generations rather than needing redone work.
