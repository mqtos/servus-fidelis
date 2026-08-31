# Art Direction Brief
## Servus Fidelis

## 1. Visual Target

Reference points: Imperial propaganda posters (bold, iconic, high-contrast, slightly
worn), illuminated manuscript / religious-icon framing (gold leaf borders, aquila
motifs, Gothic architecture), and the specific texture of *official military
documentation that has clearly seen combat* (stamps, redactions, coffee-stains,
punch-holes). Think less "video game splash art," more "a dossier the Departmento
Munitorum would actually produce, if the Departmento Munitorum had a graphic design
department with taste."

Palette: bone/parchment, faded red and gold, gunmetal, ink-black. Avoid overly clean
sci-fi blues/neons, that's a different (more Rogue Trader / Eldar) visual language than
the grounded Guard-life tone we're going for.

## 2. Generated Art: Exploring the Options

You flagged wanting to explore this rather than commit blind, here's the real tradeoff
space, worth testing a couple approaches in the Claude Code session before locking in.

### Option A — Pre-generate a curated art set, ship as static assets

**What it means:** During development (or in an early Claude Code session), generate a
fixed library of images, portrait sets per origin/archetype, scene art for major
branch/ending moments, maybe a dozen "generic stage transition" backdrops. Ship these
as static files in the build.

**Pros:** Zero runtime cost or complexity, totally reliable (no API downtime/rate
limits during actual play), consistent art style since you can iterate on prompts
until they match, works completely offline once built.

**Cons:** Finite variety, if the pool is small, replays will start recycling the same
images. Requires image-gen API access at *build/dev* time (still needs a key
somewhere, just not shipped to end users).

**Best fit if:** you want maximum reliability and don't mind a curated-but-finite art
set, most sustainable for a "for me and my friends" project since nobody's paying
per-image at runtime.

### Option B — Hybrid: pre-gen for big moments, procedural/CSS for small stuff

**What it means:** Reserve actual generated art for the moments that matter most
(stage transitions, career-branch reveals, the final Service Record hero image), and
use CSS/SVG-driven design (heraldry generators, damage overlays, rank insignia,
parchment textures) for the frequent small stuff (every single event card doesn't need
bespoke art).

**Pros:** Best cost/effort ratio, the game *feels* consistently art-directed even
though only ~15-25% of moments have bespoke generated art, and procedural elements
(e.g. a programmatically-assembled regiment crest based on origin+branch tags) are
actually a fun, very on-theme design idea, real militaries and Chapters love their
heraldry.

**Cons:** More build complexity than pure Option A (two art systems instead of one),
requires actual design work on the procedural side (not just prompting).

**Best fit if:** you want the visual highs to feel special (a big illustrated moment
at your character's death hits harder than yet-another-illustration-at-every-step),
and you're willing to invest some of the "cool factor" budget into procedural/generative
design work alongside AI art. **This is my recommendation** given the stated visual
quality priority, it gets the most visual impact per unit of effort.

### Option C — Runtime generation via user-provided API key

**What it means:** Player enters their own OpenAI/Stability/etc key, art generates
live and can be genuinely unique per playthrough (e.g. a portrait that reflects your
specific accumulated tags and scars).

**Pros:** Maximum novelty and personalization, no pre-gen labor.

**Cons:** Real friction (a friend has to go get an API key just to play), latency
during play, ongoing cost falls on whoever's key is used, generation can fail/produce
weird results live with no chance to curate. For a "me and my friends" project this is
probably more hassle than payoff, unless one of you specifically wants to hack on the
live-generation UX as its own fun subproject.

**Best fit if:** novelty/personalization matters more than reliability and you're
fine with the setup friction, this is really a "cool tech demo" choice more than a
"best player experience" choice.

## 3. Recommendation

Go with **Option B (hybrid)**, revisit Option C later as a fun add-on if the core game
is working well and someone wants to tinker with live generation as its own feature.
Concretely for v1:

- Generated art for: origin selection screens (a handful per origin), the 7 stage
  transition cards, each ending category's Service Record hero image, and the
  Astartes-branch mini-arc (it's rare and should feel like a completely different
  visual event when it happens).
- Procedural/CSS/SVG for: event card frames, stat displays, tag "medal" icons,
  regiment heraldry, damage/scar overlays on the character's dossier photo over time.

## 4. Practical Note on Generating the Art Itself

I can generate imagery directly (via the image tools available to me) during this
planning phase or in the build session, that's likely the actual path rather than
wiring up a separate external API purely for one-time asset generation. We should
timebox an early Claude Code session step to: pick the final visual style via a few
test generations, lock the "look," then batch-produce the curated set. Flagging this
now so it's in the roadmap rather than a surprise later.

## 5. Typography & UI Chrome

- Display/header font: something Gothic/blackletter-adjacent but still legible, avoid
  going full illegible-metal-band-logo.
  - Note: cannot use actual Warhammer 40k trademarked fonts/logos (IP concerns), but
    can capture the *feeling* with an appropriately licensed Gothic display font
    (there are good open-source options, e.g. via Fontsource, matches existing
    workflow patterns).
- Body font: clean serif for readability, event text is meant to be read comfortably,
  not squinted at.
- UI chrome: framed panels resembling parchment/vellum, brass/gunmetal corner
  ornaments, torn-edge or burn-mark texture accents used sparingly (not on every
  element, that gets old fast).

## 6. IP Caution

This is a fan project for personal use, not for distribution/sale, which is the right
posture given Games Workshop's well-known protectiveness over the 40k IP. Recommend:
avoid direct reproduction of GW's actual logos/wordmarks/exact heraldry designs even
though we're taking heavy inspiration from the setting and terminology, keep it
clearly "inspired by" in the visual execution even while being unapologetically 40k in
tone and content, since this never leaves your friend group.
