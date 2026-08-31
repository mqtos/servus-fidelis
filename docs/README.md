# Servus Fidelis — Project Docs

A Warhammer 40,000 military career simulator. Text-based, decision-driven, stat-based
narrative game in the spirit of Copero's football career sim, built with real 40k
flavor (Only War-derived stats and setting), aiming for striking visual design over
raw scope.

## Reading order

1. **01-game-design-document.md** — vision, core loop, character model, life stages,
   branches, tone. Read this first.
2. **02-content-bible.md** — the schema for all content (origins/events/vignettes/
   endings) plus fully-written examples establishing voice and pattern.
3. **03-technical-architecture.md** — stack, data model, save system, engine logic.
4. **04-art-direction.md** — visual target, exploration of art-generation approaches
   (recommendation: hybrid pre-gen + procedural), IP caution note.
5. **05-build-roadmap.md** — phased plan for the Claude Code build session.

## Status

Planning complete, ready to move to a Claude Code session for Phase 0 (scaffold).

## Key decisions locked in

- RPG-style single-life career (kid → soldier/officer/etc), with a data model that
  doesn't preclude a future Legacy/dynasty mode
- Only War-flavored 9-stat system (WS/BS/S/T/Ag/Int/Per/WP/Fel), lightweight tag
  system for branching, simplified stat checks (no full opposed-roll subsystem)
- Guard-centric setting with mid-career forks (Officer/Commissariat/Inquisition) and
  a rare Astartes golden branch
- Tone: mix, outcomes range wildly, grimdark-with-40k's-own-dark-humor, never a "game
  over," every ending is a Service Record
- Turn-based by life stage (8 stages), Stage 7 "Long War" uses a semi-procedural
  vignette pool for replayability without infinite hand-authoring
- React + Vite, static site, no backend for v1, localStorage saves, shareable Service
  Record image export
- Art: hybrid approach, generated art for big moments, procedural/CSS for frequent
  small elements, style locked via test generations early in the build
- Scope: framework + example content fully authored now, breadth filled in
  incrementally (see roadmap Phases 1-3)
- **War Effort meta-layer**: solo, local-only (no backend) sector map of 5-8
  campaigns; every run contributes to the active campaign regardless of ending; wins/
  losses resolve and the sector advances; this is the core "one more run" hook and is
  built in Phase 2, not deferred as a stretch goal
- **Reward systems** (also Phase 2, no loot/inventory): **Relics** (rare, narratively-
  loaded, mechanically-relevant unlocks, ~8-12 at launch), **Medal Wall** (broad,
  low-stakes achievement checklist, ~20-30 medals, no mechanical effect), **Regiment
  Reputation** (single persistent score reflavoring future runs' text; pulled into
  Phase 2 alongside the rest, reuses the same plumbing), and **Player Level**
  (account-wide, flat XP per ending category, explicitly NOT per-character, to avoid
  death-as-progress-loss undercutting the "every ending is valid" pillar) — **Player
  Level gates content in three confirmed tiers: Level 30, 50, and 70 (endgame)**,
  content files carry an optional `min_player_level` field checked by the same
  eligibility resolver as everything else

## Open items to revisit during build

- Exact stat check difficulty tuning (needs playtesting/simulation, see roadmap Phase 2)
- Final font/typography choices (needs actual visual testing)
- Whether Tailwind + Zustand are the final call vs. alternatives (low-stakes, decide
  at build time)
