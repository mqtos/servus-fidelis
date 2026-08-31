// Shared across every prompt so the batch reads as one art-directed set rather than
// fifteen unrelated images. Art Direction 1 for the palette and reference points,
// Art Direction 6 for the IP caution.
export const STYLE_CONTRACT = [
  'Extremely high production value, crisp and clean, sharp focus, highly detailed,',
  'dramatic cinematic lighting with strong atmosphere and depth. Epic imposing scale.',
  'Dominant palette of tarnished gold, oxblood red, bone, deep gunmetal and black, but',
  'richly lit and full colour, not desaturated and not monochrome. No neon, no teal-and-orange.',
  'Absolutely no text, no lettering, no numerals, and no heraldry, crest, coat of arms or',
  'emblem of any kind on banners, walls or armour: banners must be plain coloured cloth.',
  'Composed as full-bleed widescreen key art with a clearly readable focal point.',
  // Both locked styles invite annotation: a render gets watermarked, a matte painting gets
  // a title block. Refused explicitly because roughly one image in seven came back covered
  // in handwriting before this paragraph existed.
  'The image must be completely free of any written mark: no handwritten annotations,',
  'no margin notes, no labels, no captions, no arrows pointing at anything, no title',
  'block, no signature, no date stamp, no catalogue or reference numbers anywhere.',
].join(' ');

// A hero subject rather than a genre scene: the probe has to answer "does this feel epic
// and imposing on a title screen", which a muster yard cannot.
export const PROBE_SUBJECT = [
  'A colossal gothic fortress-cathedral of a far-future human empire rising out of an',
  'industrial city at dusk. Buttresses, spires, immense statues of armoured figures and',
  'banners hundreds of metres long. Shafts of light break through heavy cloud onto a',
  'processional causeway where a column of soldiers is dwarfed to near-invisibility.',
].join(' ');

export const PROBE_STYLES = [
  {
    id: 'probe_e_painterly_keyart',
    label: 'E: Painterly fantasy key art',
    style: [
      'Stylised painterly digital key art in the tradition of blockbuster fantasy game',
      'splash screens. Confident visible brushwork, heroic exaggerated proportions and',
      'silhouettes, rich saturated colour, warm rim lighting against cool shadow, romantic',
      'and grand rather than gritty. Immaculately finished and readable.',
    ].join(' '),
  },
  {
    id: 'probe_f_ingame_ultra',
    label: 'F: In-engine, ultra settings',
    style: [
      'A screenshot from a modern AAA game running at maximum graphics settings. Stylised',
      'but pristine real-time rendering, physically based materials, volumetric god rays and',
      'atmospheric fog, ambient occlusion, crisp clean edges, strong cinematic colour grade.',
      'Not photoreal: slightly heightened, sculpted, game-engine forms.',
    ].join(' '),
  },
  {
    id: 'probe_g_gothic_oil',
    label: 'G: Gothic oil painting',
    style: [
      'Museum-quality gothic oil painting. Deep chiaroscuro, glazed luminous shadows, gold',
      'leaf highlights, baroque religious grandeur and ornament, opulent and severe.',
      'Rendered with old-master finish and precision, dramatic and reverent.',
    ].join(' '),
  },
  {
    id: 'probe_h_matte_cinematic',
    label: 'H: Cinematic matte painting',
    style: [
      'Feature-film concept matte painting. Vast atmospheric perspective with many layers of',
      'depth receding into haze, epic establishing-shot framing, immaculate detail, dramatic',
      'volumetric shafts of light, anamorphic cinematic composition and colour grading.',
    ].join(' '),
  },
];

export function probeJobs() {
  return PROBE_STYLES.map((entry) => ({
    id: entry.id,
    label: entry.label,
    aspectRatio: '16:9',
    prompt: `${entry.style} Subject: ${PROBE_SUBJECT} ${STYLE_CONTRACT}`,
  }));
}

// ---------------------------------------------------------------------------
// Locked styles
// ---------------------------------------------------------------------------

// Probe F. Every screen that carries interface on top of the art, because the in-engine
// render holds up under a scrim and keeps its edges when text sits over it.
const HERO_STYLE = PROBE_STYLES[1].style;

// Probe H. The stage transition plates only, which are full-bleed with a single line of
// text. The matte painting's weakness is a busy frame, which stops mattering when there
// is almost no interface to fit around, and its depth is what sells the passage of time.
const PLATE_STYLE = PROBE_STYLES[3].style;

// Scale is the whole point of the register, so every subject is framed to put something
// enormous against something human.
const FRAMING = [
  'Wide cinematic establishing shot with a strong foreground element, a layered midground',
  'and a luminous hazy distance. Any human figures are tiny against the architecture.',
].join(' ');

// The start screen. Not keyed to any content id: it is the first thing the game shows.
const TITLE = {
  id: 'title_screen',
  subject: PROBE_SUBJECT,
};

const ORIGINS = [
  {
    id: 'origin_hive_ganger',
    subject: [
      'The floor of a colossal enclosed industrial canyon kilometres below the open sky.',
      'Stacked scrap habitation climbs both walls into darkness, thousands of tiny window',
      'lights receding upward. Sodium lamps and burning drums pool orange on wet rockcrete,',
      'steam vents from broken pipework overhead, and one pale shaft of daylight falls from',
      'an impossibly distant roof onto the crowd below.',
    ].join(' '),
  },
  {
    id: 'origin_feral_world',
    subject: [
      'A vast high moor at first light under an enormous open sky. A ring of weathered',
      'standing stones crowns a ridge above a river valley, with hide tents and a banked fire',
      'beside them. Snow on distant mountains, herds moving far below, low gold sun burning',
      'through ground mist. No machinery of any kind anywhere in the scene.',
    ].join(' '),
  },
  {
    id: 'origin_spire_born',
    subject: [
      'The upper terrace of an immense gothic tower breaking through a flat deck of cloud',
      'that glows orange from beneath, lit by the industry buried under it. Ornamental',
      'stonework, colossal statuary and a formal garden. The tips of other spires pierce the',
      'cloud layer to the horizon at sunset.',
    ].join(' '),
  },
];

// Keyed to StageId. `origin` is the start screen and `endgame` never renders: the store
// resolves the run the moment that stage is entered, so no plate is generated for it.
const STAGES = [
  {
    id: 'childhood',
    subject: [
      'A canyon-like industrial street at shift change, walled by kilometres of soot-black',
      'manufactory frontage. A dense river of workers moves between furnace mouths that throw',
      'orange light across the crowd. Thin children wait at a ration shutter in the',
      'foreground, holding tins, while the machinery towers over everything behind them.',
    ].join(' '),
  },
  {
    id: 'recruitment',
    subject: [
      'An enormous muster field at dawn seen from a low rise. Tens of thousands of civilians',
      'in ragged blocks stretch to the haze, funnelled between rows of idling transports',
      'toward distant processing sheds. Vast plain banners hang from gantries and dust hangs',
      'gold in the early light.',
    ].join(' '),
  },
  {
    id: 'training',
    subject: [
      'A vast parade ground under driving rain, ranks of recruits in shapeless fatigues',
      'stretching away in perfect grid formation across flooded rockcrete. An immense',
      'fortress-barracks of black stone looms behind them, floodlit through the downpour.',
    ].join(' '),
  },
  {
    id: 'deployment',
    subject: [
      'A beachhead under bombardment at dusk. Dozens of enormous landing craft are grounded',
      'in the surf with their ramps down, disgorging columns of soldiers into smoke.',
      'Explosions light the cliffs beyond and a fleet of drop-ships crosses a burning sky.',
    ].join(' '),
  },
  {
    id: 'career_branch',
    subject: [
      'An immense rear-area staging depot at golden hour. Armoured columns, artillery parks',
      'and supply stacks divide the ground into corridors running off in different',
      'directions, each toward a different horizon. Small groups of soldiers walk between',
      'them carrying kit bags, dwarfed by the machinery.',
    ].join(' '),
  },
  {
    id: 'long_war',
    subject: [
      'Kilometres of waterlogged siege trench cut across a churned plain under a low sky,',
      'revetted with scrap plate and lit by distant artillery flashes. A shattered',
      'fortress-city burns on the horizon. Exhausted soldiers hold the firing bays in the',
      'foreground and the ground behind them is treeless and cratered to the haze.',
    ].join(' '),
  },
];

// Keyed to EndingCategory. Only the four categories Phase 1 can actually reach.
const ENDINGS = [
  {
    id: 'pointless_death',
    subject: [
      'A discarded helmet half sunk in mud in the foreground of an anonymous stretch of',
      'churned ground. Wreckage smoulders far behind under flat grey daylight. No body, no',
      'monument, no witness, and nothing about the place is significant.',
    ].join(' '),
  },
  {
    id: 'glorious_death',
    subject: [
      'A military funeral on the steps of a colossal gothic cathedral in the rain. An honour',
      'guard stands with rifles reversed around a single flag-draped bier, immense plain',
      'banners hanging above them, the architecture rising far out of frame. The ceremony is',
      'correct and sparsely attended.',
    ].join(' '),
  },
  {
    id: 'quiet_survival',
    subject: [
      'An older soldier in a shabby discharge coat standing alone on the platform of an',
      'immense vaulted transit terminus, a kit bag at his feet. Enormous shafts of light fall',
      'through a high glazed roof onto empty benches and empty track.',
    ].join(' '),
  },
  {
    id: 'disgrace',
    subject: [
      'A bare rockcrete execution wall in an enclosed fortress yard at first light, pocked',
      'with impact scarring at chest height and a drainage channel at its base. Sheer black',
      'walls rise on every side. The yard is entirely empty of people.',
    ].join(' '),
  },
];

// Ids match the content id (origins) or the StageId / EndingCategory they key off, so
// the UI can resolve an asset without a lookup table.
function job(id, style, subject) {
  return {
    id,
    aspectRatio: '16:9',
    prompt: `${style} Subject: ${subject} ${FRAMING} ${STYLE_CONTRACT}`,
  };
}

export function phase1Jobs() {
  return [
    job(TITLE.id, HERO_STYLE, TITLE.subject),
    ...ORIGINS.map((entry) => job(entry.id, HERO_STYLE, entry.subject)),
    ...STAGES.map((entry) => job(`stage_${entry.id}`, PLATE_STYLE, entry.subject)),
    ...ENDINGS.map((entry) => job(`ending_${entry.id}`, HERO_STYLE, entry.subject)),
  ];
}

// ---------------------------------------------------------------------------
// The sector chart
// ---------------------------------------------------------------------------

// This set does not use STYLE_CONTRACT. Everything above is a dark, richly lit photograph
// of a place; the chart is a flat lit object made of paper, and inheriting "dramatic
// cinematic lighting, deep gunmetal and black" would fight the one thing it has to be,
// which is the brightest surface on the screen.
//
// It does inherit, and considerably strengthens, the refusal of lettering. Every other
// subject in the batch merely tolerated a caption. A map actively invites one: the model
// has seen a hundred thousand charts and every single one of them had names written on it.
// Ours cannot, because all forty world names and seven region names are live DOM text that
// has to stay selectable, restyleable and translatable, and because painted names would be
// wrong the moment a world is lost.
const NO_LETTERING = [
  'CRITICAL CONSTRAINT: the image must contain no writing of any kind whatsoever. No place',
  'names, no labels, no captions, no title, no cartouche text, no legend, no key, no scale',
  'bar with numbers, no latitude or longitude figures, no compass letters, no signature, no',
  'date, no catalogue number, no marginal notes, no calligraphy, no lettering, no numerals,',
  'no runes, no glyphs that resemble writing, and no decorative script anywhere including',
  'inside banners, ribbons, scrolls, plaques and cartouches. Any scroll, ribbon, plaque or',
  'cartouche that appears must be completely blank. This is the single most important',
  'requirement of the image and overrides every convention of antique map illustration.',
].join(' ');

const CARTOGRAPH_STYLE = [
  'A hand-painted antique cartographic chart on aged vellum, in the tradition of the great',
  'illustrated fantasy world maps. Warm cream, honey and ochre paper, stained, foxed,',
  'water-marked and scorched to a dark brown at the very edges, with visible fibre and a',
  'soft crease down the middle where it has been folded for years. Land is painted as',
  'irregular masses of ochre, umber and olive with fine dark sepia ink outlines, delicate',
  'hatched relief shading and tiny drawn mountain ridges and forest stipple. Water is a',
  'deep muted sepia-teal with engraved concentric ripple lines around every coast.',
  'Visible watercolour wash and pen work, restrained gold-leaf ornament, immaculate detail,',
  'flat even museum lighting as though the sheet were photographed face-on under glass.',
  'Warm, luminous and inviting rather than dark or grim. Not a photograph of a scene: a',
  'flat document filling the whole frame edge to edge.',
].join(' ');

// The composition is specified this precisely because seven regions and forty worlds have
// to be calibrated onto whatever comes back. A brief that says "islands, scattered" returns
// a beautiful chart that our content cannot sit on. The far right is deliberately empty:
// that is The Blank Chart, sealed until grade 70, and the fiction is that the Cartography
// Corps simply stopped drawing.
const CHART_LAYOUT = [
  'Composition, landscape 4:3, filling the entire frame with no background visible around',
  'it: an ornate painted double-rule border with foliate corner flourishes runs a short way',
  'in from all four edges. Inside it, seven separate island landmasses of clearly different',
  'sizes and shapes float in open water, scattered organically and never aligned to a grid.',
  'A large ragged crescent island in the lower left. A smaller mountainous island above it',
  'in the upper left. A long broken chain of islands running diagonally through the centre.',
  'A broad rounded landmass in the lower middle right. A cluster of small jagged islands in',
  'the upper right. Two further small isolated islands near the right. The far right eighth',
  'of the chart is entirely empty water with nothing drawn in it at all. Fine dotted rhumb',
  'lines run between the islands. An ornate compass rose sits in open water in the lower',
  'right. The open water is faintly stippled with tiny painted stars, as though the sea were',
  'also the night sky.',
].join(' ');

// Three genuinely different briefs rather than three rolls of the same one, so the pick is
// between directions and not between accidents.
const CHART_VARIANTS = [
  {
    id: 'map_chart_a',
    note: 'Warm and ornate, closest to the reference.',
    extra: 'Rich saturated ochres and golds, generous ornament, heavy foxing and age.',
  },
  {
    id: 'map_chart_b',
    note: 'Cooler, more engraved, less painted.',
    extra: [
      'Paler bone-cream paper, more pen-and-ink engraving and less watercolour wash,',
      'finer line weight, sparser ornament, the restraint of a naval survey chart.',
    ].join(' '),
  },
  {
    id: 'map_chart_c',
    note: 'Darker vellum, heavier relief, more dramatic.',
    extra: [
      'Deeper tobacco-brown vellum, stronger contrast, pronounced drawn mountain relief and',
      'dense hatching, burnt and torn edges, gold ornament catching more light.',
    ].join(' '),
  },
];

export function mapJobs() {
  return CHART_VARIANTS.map((variant) => ({
    id: variant.id,
    label: variant.note,
    aspectRatio: '4:3',
    prompt: `${CARTOGRAPH_STYLE} ${variant.extra} ${CHART_LAYOUT} ${NO_LETTERING}`,
  }));
}
