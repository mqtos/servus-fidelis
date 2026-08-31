# Content Bible
## Servus Fidelis — Event & Content Framework

This doc defines the **schema** every piece of content follows, plus fully-written
example content for a few branches to establish voice and pattern. Everything not
explicitly written out here is a placeholder for the Claude Code content-authoring
pass, follow the schema and the tone guidelines in the GDD.

---

## 1. Content Schema

### 1.1 Origin (Character Creation Wrapper)

```yaml
id: origin_hive_ganger
name: "Hive World — Underhive"
description: >
  Short flavor text shown to the player when this origin is selected/rolled.
stat_modifiers:      # applied once at character creation
  Ag: +5
  Per: +5
  Fel: -5
  T: -5
starting_tags: [Hive-Born, Streetwise]
weight: 1            # relative chance if origins are randomized rather than chosen
```

### 1.2 Event Card

```yaml
id: childhood_003_gang_trouble
stage: childhood
tone: tense           # tense | grim | absurd | quiet | triumphant — helps pacing/art selection
requires:              # ALL must be true for this event to be eligible
  tags_any: [Hive-Born]
  tags_none: [Orphan]
  stat_min: {}
  stat_max: {}
weight: 3               # selection weight among eligible pool for this stage
text: >
  Narrative setup, 2-5 sentences.
choices:
  - id: fight_back
    label: "Fight back"
    stat_check: { stat: [WS, S], difficulty: -10 }   # optional; omit for guaranteed outcomes
    on_success:
      stat_changes: { WS: +3, Fel: +2 }
      add_tags: [Known-Brawler]
      result_text: >
        Outcome text.
    on_failure:
      stat_changes: { T: +2 }               # "toughened by adversity" even on failure, common 40k beat
      add_tags: [Marked-by-Gang]
      result_text: >
        Outcome text.
  - id: report_to_enforcers
    label: "Report it to the Enforcers"
    stat_changes: { Fel: -3, Int: +2 }
    add_tags: [Informant-Record]
    result_text: >
      Outcome text. No stat check needed, this is a guaranteed-outcome choice.
  - id: walk_away
    label: "Walk away"
    stat_changes: { WP: -2 }
    result_text: >
      Outcome text.
next_stage_hint: null   # optional override; usually stage progression is automatic
terminal: false          # true only for death/discharge/end-of-run events
```

### 1.3 Vignette (Stage 7 "Long War" pool item)

Same shape as Event Card but tagged additionally with `branch` (which career track(s)
it's eligible for) and usually 3-6 sequential beats rather than a single card, since
these represent a whole mini-campaign, not one decision.

```yaml
id: vignette_siege_of_kalmyr
branch: [line_infantry, officer]
min_stats: { T: 30 }
tone: grim
beats: [ ... sequence of event-card-shaped objects ... ]
outcomes:
  - condition: "survived_all_beats"
    result: { tags_add: [Siege-Veteran], stat_changes: { WP: +5 } }
  - condition: "died_beat_3"
    terminal: true
    ending_category: pointless_death
```

### 1.4 Ending / Service Record Template

```yaml
id: ending_glorious_last_stand
category: glorious_death
requires: { tags_any: [Decorated, Siege-Veteran], stat_min: { WP: 60 } }
headline: "KILLED IN ACTION — COMMENDED"
summary_template: >
  Templated summary text with {name}, {regiment}, {final_rank}, {age_at_death}
  slotted in, plus 2-3 sentences pulling from the player's tag history.
tone: triumphant
```

---

## 2. Origins — Fully Authored Examples (write more later, same pattern)

### 2.1 Hive World — Underhive
See schema example above (`origin_hive_ganger`). Flavor: scarcity, gang culture,
street-smarts over book-smarts. High Ag/Per, low Fel/T.

### 2.2 Feral World
```yaml
id: origin_feral_world
name: "Feral World — Tribal Warrior Culture"
description: >
  You were born beneath a sky your world's priests said belonged to the God-Emperor
  alone, though you would not see His light with your own eyes for another decade.
  Your people hunted with blades their grandfathers forged, and the Imperium was a
  rumor in the shape of a ship that sometimes crossed the night sky.
stat_modifiers: { S: +5, T: +5, Int: -5, Fel: -5 }
starting_tags: [Feral-World, Superstitious]
weight: 1
```

### 2.3 Hive World — Upper Spire (contrast option)
```yaml
id: origin_spire_born
name: "Hive World — Upper Spire"
description: >
  You were born in the recycled sunlight of the spire tops, where the air is filtered
  twice before anyone important breathes it. Your family had a name that meant
  something. It will mean considerably less once you are standing in a trench.
stat_modifiers: { Fel: +5, Int: +5, S: -5, T: -5 }
starting_tags: [Spire-Born, Well-Educated]
weight: 1
```

Placeholder list for later: **Death World**, **Forge World**, **Shrine World**,
**Void-Born (ship life)**, **Penal Colony**, **Agri World**. Each should bias a
distinct stat pair and grant a flavor tag, follow the pattern above.

---

## 3. Childhood Stage — Fully Authored Example Chain

Full example (`childhood_003_gang_trouble`) given in schema section above, this
establishes the pattern: 2-4 choices, at least one with a stat check, at least one
guaranteed-outcome choice, tags matter more than raw stat magnitude at this stage since
childhood stats moves should be small (+/-2 to +/-5 range).

**Additional worked example**, showing a non-combat childhood beat:

```yaml
id: childhood_007_the_preacher
stage: childhood
tone: quiet
requires: { tags_none: [Atheist-Tendency] }
weight: 2
text: >
  An itinerant Ecclesiarchy preacher passed through, the kind who arrives every few
  years to remind everyone that the Emperor watches, judges, and expects tithes paid
  on time. He singled you out from the crowd, for reasons he did not explain, and
  asked you a single question: did you believe?
choices:
  - id: fervent_yes
    label: "\"With everything I have.\""
    stat_changes: { WP: +4, Fel: +1 }
    add_tags: [Faith-Zealous]
    result_text: >
      He smiled the way men smile when they have found what they were looking for,
      and gave you a small brass aquila. You have never taken it off since.
  - id: uncertain
    label: "\"I... don't know.\""
    stat_changes: { Int: +2 }
    add_tags: [Faith-Wavering]
    result_text: >
      He did not seem angry, only tired, as though he had heard this answer a
      thousand times and would hear it a thousand more. "Good," he said, oddly.
      "Doubt is honest. The Emperor has enough liars."
  - id: silence
    label: "Say nothing at all"
    stat_changes: { WP: -1, Per: +2 }
    result_text: >
      He waited a long moment, then moved on to the next child without a word.
      You never found out what he would have said.
terminal: false
```

Placeholder count target for Childhood stage: **~15-20 event cards**, enough that a
replay doesn't feel repetitive quickly, weighted so tag-gated content occasionally
surfaces.

---

## 4. Recruitment Stage — Fork Point (partially authored)

This stage needs special design attention since it's where branch-eligibility tags
start getting seeded. Recommend at minimum these authored entry points:

```yaml
id: recruitment_001_the_draft
stage: recruitment
tone: tense
requires: {}   # default/common path, always eligible
weight: 5
text: >
  The Munitorum officials arrived on the same trucks that had, a generation earlier,
  taken your parents' harvest quota. This time, they had come for people.
choices:
  - id: go_quietly
    label: "Go quietly"
    stat_changes: { WP: +2 }
    result_text: "You did not resist. Resisting rarely improved anyone's paperwork."
  - id: try_to_run
    label: "Try to run"
    stat_check: { stat: [Ag], difficulty: -20 }
    on_success:
      stat_changes: { Ag: +3 }
      add_tags: [Nearly-Deserted]
      result_text: >
        You made it three streets before they caught you. They did not ask again.
    on_failure:
      terminal: true
      ending_category: disgrace
      result_text: >
        They shot you in the street as an example to the others. Your name was
        never recorded. The quota was filled by someone else's child instead.
  - id: volunteer_enthusiasm
    label: "Step forward and volunteer"
    stat_changes: { Fel: +3 }
    add_tags: [Volunteer, Noted-Early]
    result_text: >
      An officer with tired eyes wrote your name at the top of a very long list.
      "Eager ones don't usually last," he said, not unkindly, "but you might."
```

Placeholder additional entries (write later): a **press-gang / penal legion** variant
for Feral/Penal origins, an **Inquisition-Contact seed event** (rare, sets up the
Inquisition branch much later), and an **Astartes-scout-notices-you** ultra-rare seed
event (sets up the golden branch, should have very low weight and strict stat
requirements even at this early stage).

---

## 5. Basic Training — Officer/Commissariat Fork (framework only)

Design intent, not yet authored: this stage should contain a handful of "flagged for
X" trigger events, gated on stat thresholds reached during Childhood/Recruitment, that
set the tags branches 2-4 in the GDD check for at Stage 6. E.g.:

```yaml
id: training_officer_candidacy_flag
stage: training
requires: { stat_min: { Fel: 45, Int: 40 } }
# ...authored later; sets add_tags: [Officer-Candidate]
```

Recommend drafting ~8-10 of these flag events, one or two per branch, when doing the
full content pass.

---

## 6. Stage 7 "Long War" Vignette Pool (framework only, one worked example)

```yaml
id: vignette_trench_line_gathral
branch: [line_infantry]
min_stats: {}
tone: grim
beats:
  - text: >
      The trenches of Gathral Secundus had not moved in eleven months. Neither
      had most of the men who first dug them.
    choices:
      - id: hold_the_line
        label: "Hold your position"
        stat_check: { stat: [WP, T], difficulty: 0 }
        on_success: { stat_changes: { WP: +3 }, result_text: "You held." }
        on_failure: { terminal: true, ending_category: pointless_death,
          result_text: "You did not." }
outcomes:
  - condition: survived
    result: { add_tags: [Trench-Veteran], stat_changes: { T: +2 } }
```

Target for launch: **10-15 vignettes** spread across the branches, enough variety
that Stage 7 doesn't feel like the same three missions on repeat. This is the single
biggest content-authoring task and the best candidate for incremental post-launch
additions.

---

## 7. Endings (partial list, framework established)

| Category | Example headline | Trigger sketch |
|---|---|---|
| Pointless Death | "KILLED IN ACTION — UNREMARKABLE" | Failed a crit-fail stat check with no notable tags |
| Glorious Death | "KILLED IN ACTION — COMMENDED" | Died with Decorated/Veteran tags, high WP |
| Quiet Survival | "HONOURABLE DISCHARGE" | Reached endgame age without major tag triggers |
| Disgrace | "DISHONOURABLE DISCHARGE" / "EXECUTED FOR COWARDICE" | Deserter-Record tag, or failed Commissariat-adjacent check |
| Legend | "RETIRED AS LORD MARSHAL" | Extremely high stat + tag thresholds across officer track |
| Corruption | "DECLARED EXCOMMUNICATE TRAITORIS" | Marked-for-Corruption tag accumulation crosses threshold |
| Astartes | "ASCENDED" | Survived the Aspirant trials mini-arc |

Write 1-2 fully authored variants per category for launch (per GDD Section 8), expand
later. Each needs a `summary_template` per Section 1.4 schema.

---

## 7.5 War Effort / Campaign Content Schema

Per GDD Section 10. Each sector campaign is authored content, same discipline as
everything else.

```yaml
id: campaign_01_gathral_secundus
name: "The Siege of Gathral Secundus"
order: 1                     # position in the sector sequence
threshold: 1000               # total contribution points needed to resolve
flavor_intro: >
  Short flavor text shown when this campaign becomes active, sets the stakes.
win_summary: >
  Resolution text if threshold is crossed with net-positive contribution.
loss_summary: >
  Resolution text if the campaign times out / resolves negative (design decision:
  recommend campaigns always eventually resolve one way or another rather than
  stalling forever, e.g. a soft time/run-count ceiling that forces resolution).
recapture_of: null            # optional; references an earlier lost campaign's id
```

Contribution weight per ending category (referenced by the engine, not per-campaign):

```yaml
# global config, not per-campaign
contribution_weights:
  pointless_death: 10
  glorious_death: 25
  quiet_survival: 40
  disgrace: 0
  corruption: -15
  legend: 100
  ascended: 400
```

(Illustrative starting values only, tune per GDD Section 10.2 during Phase 2
playtesting.)

Placeholder target: **5-8 campaigns fully authored** (flavor/win/loss text) for
launch, per the framework-plus-examples scope. Write at minimum campaign 1 in full as
the worked pattern, remainder can follow directly from it.

## 7.6 Relics, Medals, and Player XP Schema

Per GDD Section 12.

### Relic

```yaml
id: relic_vex_bolter
name: "The Vex Bolter"
flavor: >
  Recovered from a fallen hero at the Siege of Gathral Secundus, its casing scarred
  with the names of those who carried it before you.
trigger:                        # what earns this relic, checked at run resolution
  tags_any: [Siege-Veteran, Decorated]
  ending_category: [glorious_death, legend]
effects:
  war_contribution_bonus: 0.05   # +5% contribution when this relic is "active"
  origin_flavor_override: >
    Optional flavor text injected into origin/recruitment stage if held.
rarity: rare                     # rare | very_rare — purely for UI display/sorting
```

Target: **8-12 relics at launch**, each with a real, specific, rare trigger. Resist
the urge to pad this list, the whole point is that owning one should feel notable.

### Medal (Medal Wall entry)

```yaml
id: medal_void_sworn
name: "Void-Sworn"
tag_source: Void-Born-Veteran     # the underlying tag that earns this medal
icon: void_sworn_icon             # references the procedural/heraldry art system
description: >
  Short flavor text shown on the Medal Wall, earned or not.
```

Curated subset of tags become medals, not every internal tag needs one. Target:
**20-30 medals at launch**, spanning common-to-rare so the wall has a real spread
(some earned in your first few runs, some that take dozens of attempts).

### Player XP Table

```yaml
# global config
xp_by_ending_category:
  pointless_death: 5
  disgrace: 5
  glorious_death: 15
  quiet_survival: 15
  corruption: 10
  legend: 40
  ascended: 100
```

(Illustrative starting values, tune during Phase 2/3 alongside War Effort
contribution weights, these two tables are related and should be reviewed together.)

### Level Gate Tiers (confirmed)

Content is authored in three tiers, tagged with a `min_player_level` field on the
relevant content file (campaigns, vignettes, relics, and optionally origins):

| Tier | Unlocks at | Content |
|---|---|---|
| 1 (base) | Level 1 | Default sector campaigns, base origin pool, base vignette pool |
| 2 | Level 30 | Second-tier sector campaigns (harder), wider origin pool |
| 3 | Level 50 | Third-tier campaigns, rarer/tougher Stage 7 vignettes |
| 4 (endgame) | Level 70 | Hardest campaigns, rarest Relic triggers become reachable |

```yaml
# example addition to a campaign/vignette/relic content file
min_player_level: 30
```

The content eligibility resolver (Content Bible Section 1, Tech Architecture Section
7b) checks `min_player_level` against current `playerLevel` alongside the existing
`requires` tag/stat checks, same mechanism, one more field. Exact level-to-XP
thresholds (what XP total equals level 30/50/70) are a Phase 2/3 tuning task, not
specified here, tune alongside the XP table above once real playtesting data exists.

## 8. Authoring Checklist (for Claude Code content passes)

When adding any new content item:
- [ ] Follows the correct schema shape for its type (origin/event/vignette/ending)
- [ ] Has a unique `id`
- [ ] Tone tag set appropriately (affects art/music selection downstream)
- [ ] At least one choice has a real tradeoff, no pure "correct answer" choices
- [ ] Stat changes are small (single-digit) except at major branch/ending moments
- [ ] Written in past tense, second person, dry/bureaucratic-with-dark-humor voice
- [ ] If terminal, has an `ending_category` that maps to a Section 7 category
- [ ] If it's an ending, confirm its `ending_category` has a corresponding entry in
  `contribution_weights` (Section 7.5) so it correctly feeds the War Effort layer
- [ ] If it's an ending, confirm its `ending_category` also has an entry in
  `xp_by_ending_category` (Section 7.6) so it correctly feeds Player Level
