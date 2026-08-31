# PROJECT SERVUS FIDELIS
## Warhammer 40,000 Career Simulator — Game Design Document

*"In the grim darkness of the far future, there is only paperwork."*

---

## 1. Concept

A single-player, browser-based, narrative career simulator set in the Warhammer 40,000
universe. The player begins as a child on an Imperial world and makes a series of
life-defining choices across distinct **life stages**. Choices, random events, and stat
thresholds shape which paths open up, culminating in one of dozens of possible endings,
from "died face-down in a trench on turn one" to "ascended to Lord Commissar" to
(vanishingly rarely) "recruited into the Adeptus Astartes."

Inspired by Copero's football career simulator (`copero.com.ar/juegos/simulador-carrera`):
short punchy decision screens, visible stat consequences, a life that unfolds turn by
turn, and a shareable summary at the end. We're taking that skeleton and building
something with far more narrative texture, true to the setting.

This is a passion project for the designer and friends — not a commercial product.
That means: prioritize *cool* and *replayable* over broad or monetizable. It's fine to be
niche, dense with lore jokes, and unapologetically for people who already love 40k.

---

## 2. Design Pillars

1. **Every playthrough is a story, not a stat sheet.** The player should be able to
   describe their run to a friend in a sentence ("I got press-ganged as a kid, survived
   three campaigns as a heavy weapons trooper, and died holding a bridge on a planet
   nobody's heard of") and have it feel specific and earned.
2. **Grimdark, but the '40k' kind of grimdark.** Bleak, absurd, bureaucratic, and
   darkly funny, not edgy for its own sake. The Imperium is horrifying largely because
   it's horrifyingly *mundane* about the horror. Outcomes should range wildly: pointless
   death, glorious death, quiet survival, unlikely triumph, corruption, disgrace,
   legend.
3. **Stats matter, but aren't the point.** Nine Only-War-style characteristics
   (WS/BS/S/T/Ag/Int/Per/WP/Fel) drive which choices are available and which random
   events resolve well or badly, but the writing carries the experience, not a
   spreadsheet.
4. **Every ending is an ending, not a failure state.** Death, discharge, disgrace,
   glory: all of them resolve into a full "Service Record" summary. Nothing is a game
   over screen. The Emperor doesn't grade on a curve; He just wants the paperwork
   filed.
5. **Visually striking, not visually generic.** Imperial propaganda-poster aesthetic,
   parchment and ironwork, illuminated-manuscript energy. This should look like it
   belongs on a shelf next to the actual RPG books, not like a generic web quiz.

---

## 3. Core Loop

```
CHARACTER ORIGIN  →  LIFE STAGE  →  EVENTS/DECISIONS  →  STAT CHANGES  →
   (loop through remaining stages, branching based on stats/choices/RNG)  →
FINAL OUTCOME  →  SERVICE RECORD SUMMARY  →  (replay)
```

Each **life stage** is a discrete chapter (see Section 5). Within a stage, the player
faces a sequence of **event cards**: a short narrative beat with 2-4 choices. Choices:

- Adjust one or more of the 9 characteristics (small, medium, or large shifts)
- Grant/remove **Tags** (see Section 6) that gate later content
- Sometimes trigger an immediate **stat check** (see Section 7) with pass/fail branches
- Occasionally end the run outright (death, discharge, desertion)

At the end of a stage, the player's accumulated stats/tags determine which **path**
they move into for the next stage (e.g., which regiment they're assigned to, whether
they're flagged for Commissar attention, whether Inquisitorial acolytes have taken
notice).

---

## 4. Character Model

### 4.1 The Nine Characteristics

Adapted directly from Only War / Dark Heresy, values roughly 0-100, starting around
20-40 depending on origin:

| Stat | Governs | Narrative flavor |
|---|---|---|
| **WS** — Weapon Skill | Melee combat | Knife-fighting, bayonet charges, close-quarters survival |
| **BS** — Ballistic Skill | Ranged combat | Marksmanship, suppressing fire, sniping |
| **S** — Strength | Physical power | Melee damage, carrying capacity, breaking things (and people) |
| **T** — Toughness | Physical resilience | Surviving wounds, disease, deprivation, torture |
| **Ag** — Agility | Speed & reflexes | Dodging, climbing, piloting, reaction time |
| **Int** — Intelligence | Technical/tactical thinking | Tech-use, tactics, cryptography, noticing patterns |
| **Per** — Perception | Awareness | Spotting ambushes, reading people, finding contraband |
| **WP** — Willpower | Mental fortitude | Resisting fear, corruption, psychic assault, interrogation |
| **Fel** — Fellowship | Charisma/social standing | Command presence, requisitioning favors, making friends (or enemies) |

### 4.2 Tags

Binary/small-set flags that don't fit a numeric stat but gate content and endings.
Examples: `Orphan`, `Hive-Born`, `Feral-World`, `Noted-by-Commissariat`,
`Psyker-Latent`, `Decorated`, `Marked-for-Corruption`, `Inquisition-Contact`,
`Astartes-Candidate`, `Deserter-Record`, `Faith-Zealous`, `Faith-Wavering`.

Tags are the primary mechanism for **branching between career tracks** (soldier →
officer → Commissar → Inquisition acolyte → the rare Astartes fork) without needing a
combinatorial explosion of stat thresholds.

### 4.3 Wounds / Corruption / Fate (stretch, not required for v1)

Only War has Wounds (HP), Corruption, and Fate Points as separate tracks. Recommend
v1 collapses survival into stat checks + narrative death events rather than a full
wound-tracking subsystem, that's real tactical-RPG territory and would bloat scope.
Corruption as a hidden tag-driven meter (not shown numerically to the player) is a nice
lightweight way to gesture at Chaos-related endings without full psychic/daemon
mechanics.

---

## 5. Life Stages

Turn-based by stage, matching the confirmed direction. Each stage is a self-contained
content module (own file in the content bible) so writing can happen incrementally.

| # | Stage | Age (approx) | Purpose |
|---|---|---|---|
| 1 | **Origin** | Birth / early childhood | Sets homeworld type + starting stat biases + starting tags. Not really "played," more a character-creation wrapper dressed as narrative. |
| 2 | **Childhood** | ~5-14 | Formative events on the homeworld. Establishes personality tags (Zealous/Wavering, Hive-Born survival instincts, etc.) |
| 3 | **Recruitment / Conscription** | ~15-18 | The pivot point: drafted, volunteered, press-ganged, or (rare) noticed by outside forces. This is where the "soldier vs. path-to-officer vs. golden branch" fork begins to open. |
| 4 | **Basic Training** | ~18-19 | Stat-building stage. Drill instructors, washouts, first taste of Imperial discipline. Officer-track candidates get flagged here if Fel/Int/WP are high enough. |
| 5 | **First Deployment** | ~19-21 | First real combat. High variance, this is where a lot of "died on turn one" runs happen. Establishes veteran tags. |
| 6 | **Career Branch** | ~21-30 (spans multiple in-narrative years, compressed into one stage) | The big fork: continue as line infantry, pursue officer commission, get pulled into Commissariat, get flagged by Inquisition, or (rare) Astartes recruitment triggers here if tags/stats are exceptional. |
| 7 | **The Long War** | ~30-45 | The bulk of a career. Multiple campaigns, each a shorter event chain. Repeatable/proceduralized more than earlier stages (see Section 8) since this stage covers the most in-fiction time. |
| 8 | **Endgame** | Variable | Triggered either by death, by reaching a rank ceiling, by age/attrition, or by player choice to "muster out." Leads directly into the Service Record. |

Stretch stage: **Legacy** (post-v1) — if the player survived and had notable
achievements, offer a coda about their regiment's reputation or a "start next
generation" hook into a dynasty/regiment-builder mode. Not required for v1 but the data
model should not actively prevent it later (see tech doc).

---

## 6. Career Branches (from Stage 6 onward)

Confirmed direction: Guard-centric core, with mid-career forks, plus a rare top-end
branch.

1. **Line Infantry / NCO track** — the default, most common path. Deepest content,
   most replayable, most "ordinary soldier's life" flavor.
2. **Officer track** — unlocked by Fel/Int/WP thresholds + tags from Basic Training.
   Command-flavored events, responsibility for other soldiers' lives (narrative weight,
   not a full unit-management sim in v1).
3. **Commissariat track** — unlocked by high WP/Fel + Zealous tag + specific Stage 6
   trigger event. Distinct tone: you are now the person enforcing discipline, sometimes
   at gunpoint. Great tonal contrast opportunity.
4. **Inquisition acolyte track** — unlocked by Int/Per/WP thresholds + an
   "Inquisition-Contact" tag from an earlier stage event. Rarer, weirder events:
   xenos, heresy, things man was not meant to know.
5. **Astartes recruitment (golden branch)** — extremely rare, requires an
   exceptional stat profile across nearly all characteristics plus a specific
   flagged event (being noticed by a Chapter's recruiters, surviving a trial). This
   should feel like winning a lottery: most players will never see it, and that's
   correct. When it triggers, it effectively transplants the player into a
   short, distinct high-intensity mini-arc (Aspirant trials) with its own
   pass/fail/death stakes, since Astartes creation is famously brutal and most
   aspirants don't survive it. Landing this ending should feel legendary.

Design note: branches 2-4 are not mutually exclusive with continuing to see "Long War"
content, they reflavor and reweight which Stage 7 event pools the player draws from.

---

## 7. Stat Checks

Lightweight, not a full d100 opposed-roll system (that's real tabletop crunch and would
slow the pacing badly). Recommend:

- A check references 1-2 characteristics, e.g. "Ag + Per check."
- Roll a d100 (or equivalent), compare against (relevant stat total, averaged if two
  stats, plus/minus situational modifiers from tags).
- Three-tier outcome, not binary: **Critical Success / Success / Failure / Critical
  Failure**, mirroring Only War's degree-of-success flavor without the full subsystem.
  Crit failure is where a lot of death-branch content lives.
- Show the player the stat(s) involved *before* they commit to a risky choice where
  reasonable ("This will test your Willpower") so decisions feel informed, not
  arbitrary, while still leaving room for pure blind-random events (that's realistic:
  a lasgun round doesn't check your character sheet first).

---

## 8. Content Density & Replayability

Given "solid framework + example branches, rest placeholder" scope:

- Stages 1-6 should be closer to fully authored in v1, since they're linear-ish and
  every player passes through them (with branching starting around Stage 3).
- Stage 7 ("The Long War") is the one place recommend a **semi-procedural event
  pool**: author a bank of self-contained campaign/mission vignettes tagged by
  branch/tone/stat-requirements, and the game randomly draws N of them per playthrough
  rather than needing a fully hand-authored tree. This is both easier to write
  incrementally (drop in new vignettes whenever) and naturally gives replay variety.
- Stage 8 (Endgame) should have a good spread of ending *categories* even if each
  category only has 1-2 fully written variants at launch: Glorious Death, Pointless
  Death, Quiet Survival, Disgrace/Discharge, Promotion to legend-tier rank, Corruption
  ending, and the Astartes ending. More can be added later without touching engine
  code.

---

## 9. Tone & Writing Guidelines

- Default voice: dry, bureaucratic, matter-of-fact about horror. Think Imperial
  Munitorum paperwork describing a massacre in the same tone as a supply requisition.
- Humor is allowed and encouraged, 40k's own tabletop lore is full of dark comedy
  (this is a universe where "reasonable" military doctrine includes commissars
  shooting soldiers for retreating). Don't undercut genuinely heavy beats with jokes,
  but plenty of *events* can be absurd.
- Avoid: grimdark-for-shock-value gore descriptions, real-world political analogues
  played straight, anything that reads like it's mocking the player rather than the
  setting.
- Second person, present or past tense (pick one and stay consistent, recommend past
  tense, "you were assigned to..." reads well for a life-summary format).
- Keep individual event text short. This is a card-based decision game, not a visual
  novel, 2-5 sentences of setup per event card, choices are short punchy phrases.

---

## 10. The War Effort (Meta-Progression Layer)

**Why this exists:** without it, the only reason to replay is "see a different
ending," which is fine but thin. A persistent, cross-run meta-goal gives replay a
compounding reason, and it's deeply on-theme: 40k lore is built on the idea that any
single soldier's life is a rounding error in a war that has been going for ten
thousand years and will keep going regardless. That tension (your run matters
enormously to *you*, almost nothing to the war) is more true to the setting than a
straightforward "your choices shape the galaxy" power fantasy, and it's funnier.

### 10.1 Structure

A **sector map**: a sequence of 5-8 campaigns, each representing a contested world or
front. Only one campaign is **active** at a time. Every completed run (regardless of
ending) contributes points toward the active campaign's threshold. When the threshold
is crossed, the campaign **resolves** (Imperium wins or loses the world), a short
dossier-style resolution summary is shown, and the next campaign in the sector
becomes active.

This is solo meta-progression (per player, stored locally), not a shared/multiplayer
war, no backend required (see Tech Architecture Section 9 for the data model).

### 10.2 Contribution Rules

Every run contributes *something*, even a pointless death, because a death-is-a-valid-
ending game shouldn't make short runs feel like wasted meta-progress. Rough scaling
(tune during Phase 2 playtesting, see Roadmap):

| Outcome | Contribution weight | Flavor framing |
|---|---|---|
| Pointless Death | Small (baseline tick) | "His death bought the line four more minutes." |
| Glorious Death / Decorated | Small-medium | Individual heroism matters, but modestly, at scale |
| Quiet Survival / Honourable Discharge | Medium | A soldier who serves a full career, unglamorous but real |
| Disgrace / Desertion / Corruption ending | Zero or slightly negative | The war doesn't care about your shame, but it doesn't help either; a Corruption ending could plausibly *subtract* |
| Officer / Commissariat legend-tier ending | Large | Command-level impact, moving actual units |
| Astartes ascension | Very large, campaign-defining | Should feel like it can single-handedly swing or end a campaign |

The point isn't precise balance, it's that the framing text on the contribution should
always make sense even for a tiny contribution. Every run should get an explicit
"your contribution to [Campaign Name]" line on the Service Record screen, that's the
hook connecting individual runs to the meta-layer.

### 10.3 Resolution & Tone

- **Win**: territory gained, short triumphant-but-still-grim resolution text (this is
  the Imperium; even wins cost something).
- **Loss**: world falls. This should not feel like a punishment screen, more like grim
  inevitability, the Imperium loses worlds constantly and grinds on regardless. Good
  opportunity for dark humor ("Cartography Corps has updated the sector maps
  accordingly.").
- After resolution, the next campaign opens. Consider occasionally letting a lost
  campaign's world reappear later as a *recapture* campaign, ties runs together
  narratively across the whole sector arc.

### 10.4 Sector Status Screen

A persistent screen, accessible between runs, showing the sector map, which campaign
is active, current progress toward threshold, and a log of resolved campaigns
(won/lost) with their dossier summaries. This is the actual "why start another run"
screen, design it with real visual weight, it's doing meta-progression's job.

## 12. Meta-Progression & Rewards

Loot/gear was deliberately excluded (Section 3.3/9), but the underlying player need,
tangible reward for rare achievement, is real and worth serving properly. Three
systems, each aimed at a different part of that need, deliberately kept distinct
rather than overlapping:

### 12.1 Relics

Small pool of rare, narratively-loaded unlocks earned by specific exceptional feats
(surviving a brutal named vignette, an Astartes-adjacent near-miss, certain Decorated/
legend-tier endings). Relics are account-wide and persist across runs in a **Chapter
Archive** screen. Unlike loot, they're not equipped or managed, but a held Relic can:

- Modify future **origin selection** flavor/stats ("you begin with a family heirloom")
- Slightly boost **War Effort contribution** when the run that earns the relevant tag
  occurs ("the Vex Bolter, recovered from a fallen hero, +5% contribution")

Target: a small, curated set (roughly 8-12 at launch), quality over quantity, each
with real flavor text and a clear, rare trigger condition. This is the closest analog
to "finding a legendary weapon" and should feel exactly that rare.

### 12.2 Medal Wall

A broad, low-stakes **achievement checklist**, not mechanically powerful, purely
completionist. Every notable tag a character can earn (Decorated, Siege-Veteran,
Void-Sworn, etc., a curated subset, not literally every internal tag) has a
corresponding medal with small icon art (ties into the heraldry/procedural art system
in the Art Direction doc). Earning it on any run, in any life, marks it permanently
collected account-wide. The Medal Wall screen shows collected vs. uncollected (silhouette
for uncollected, per standard achievement-screen conventions), giving genuine "how many
of these have I gotten" pull across dozens of playthroughs. Cheap to build: mostly a
UI layer reading tag history across saved runs, no new mechanical system.

Distinction from Relics: Medal Wall is broad, common-to-rare spread, no mechanical
effect, pure collection. Relics are narrow, very rare, and have a real effect on
future runs.

### 12.3 Regiment Reputation

A single persistent score, nudged up by glorious/legend-tier run endings and down by
disgrace/desertion/corruption endings, that quietly reflavors future origin and
recruitment text ("Your regiment's name still carries weight after the defense of
Gathral Secundus" vs. "Nobody wants the CCCXXIInd anymore"). No new mechanical
system, it's a read of existing run history fed back into flavor text selection.
**Confirmed: built in Phase 2 alongside War Effort/Relics/Medals/Player Level rather
than deferred to Phase 3**, since it reuses the same run-history data those systems
already read, cheap to add once that plumbing exists.

### 12.4 Player Level (Account-Wide, Not Per-Character)

A single persistent player level (illustrative range 1-70, tune later), separate from
any individual character, since this is a permadeath-flavored single-life game and a
per-character level would directly undercut GDD pillar 4 ("every ending is an ending,
not a failure state"), dying at character-level 3 would read as lost progress, which
is exactly the wrong feeling.

- **XP is awarded flat, per ending category**, not scaled by run length or events
  survived (confirmed direction, keeps the system simple and the signal is already
  encoded in the ending category itself, e.g. legend-tier endings imply a long,
  eventful run anyway).
- A short, pointless-death run still awards XP (its category's flat value), so short
  runs are never "wasted," the number that goes up always goes up.
- Player level is a candidate gate for unlocking things like: rarer origins, later
  sector campaigns' harder content pools, cosmetic UI themes, additional Relic slots.
  Exact unlock curve is a Phase 2/3 tuning task, not decided here.
- **Confirmed: Player Level gates content in three tiers**, aligned to major content
  chapters rather than a smooth per-level drip:
  - **Level 30** — unlocks a second tier of sector campaigns (harder, later-war
    content) and a wider origin pool
  - **Level 50** — unlocks a third tier (higher-stakes campaigns, rarer/tougher
    Stage 7 vignettes)
  - **Level 70** — endgame tier: hardest campaigns, rarest Relic triggers become
    reachable, effectively the "veteran player" content ceiling
  This means content should be authored in three rough tiers from the start (tag
  each campaign/vignette/relic with a `min_player_level` in its content file, per
  Content Bible Section 7.6/7.5) rather than retrofitted later, cheap to do now,
  expensive to bolt on after a flat content pool already exists.
- This sits alongside, not instead of, the War Effort layer (Section 10): War Effort
  is the shared "did the Imperium win" meta-goal, Player Level is the personal "how
  invested am I" meta-goal. Both read from the same run-ending data, different
  purposes.

### 12.5 Variable Run Length

Not a new system, a natural consequence of the existing design: a run can resolve in
under a minute (died in Childhood or on first deployment) or run 15-20+ minutes (a
long Stage 7 vignette chain into a legend-tier or Astartes ending). No special
handling needed beyond making sure early-stage death events are exactly as well
written as late-stage ones (per the Content Bible authoring checklist), a 1-minute
run should still feel like a complete, satisfying story, not a truncated one.

## 13. Open Questions / Decisions Deferred to Later Docs

- Exact art pipeline (pre-gen vs hybrid vs runtime) — see Art Direction doc, decision
  deferred until we've explored options as agreed.
- Exact save/share mechanism — see Tech Architecture doc.
- Whether "Legacy/regiment builder" ever gets built — noted as a data-model
  consideration only, not committed scope.
- Exact contribution-weight tuning for the War Effort layer (Section 10) — deferred
  to Phase 2 playtesting, see Build Roadmap.
- Exact Relic list, Medal Wall curated tag subset, and Player Level XP table/unlock
  curve (Section 12) — deferred to Phase 2/3 authoring, see Content Bible Section 7.6
  and Build Roadmap.
