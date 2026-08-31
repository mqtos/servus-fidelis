export const STAT_IDS = ['WS', 'BS', 'S', 'T', 'Ag', 'Int', 'Per', 'WP', 'Fel'] as const;
export type StatId = (typeof STAT_IDS)[number];
export type StatBlock = Record<StatId, number>;

export const STAT_LABELS: Record<StatId, string> = {
  WS: 'Weapon Skill',
  BS: 'Ballistic Skill',
  S: 'Strength',
  T: 'Toughness',
  Ag: 'Agility',
  Int: 'Intelligence',
  Per: 'Perception',
  WP: 'Willpower',
  Fel: 'Fellowship',
};

export const STAGE_ORDER = [
  'origin',
  'childhood',
  'recruitment',
  'training',
  'deployment',
  'career_branch',
  'long_war',
  'endgame',
] as const;
export type StageId = (typeof STAGE_ORDER)[number];

export const STAGE_LABELS: Record<StageId, string> = {
  origin: 'Origin',
  childhood: 'Childhood',
  recruitment: 'Recruitment',
  training: 'Basic Training',
  deployment: 'First Deployment',
  career_branch: 'Career Branch',
  long_war: 'The Long War',
  endgame: 'Endgame',
};

export type BranchId = 'line_infantry' | 'officer' | 'commissariat' | 'inquisition' | 'astartes';

export type EndingCategory =
  | 'pointless_death'
  | 'glorious_death'
  | 'quiet_survival'
  | 'disgrace'
  | 'legend'
  | 'corruption'
  | 'ascended';

export type Tone = 'tense' | 'grim' | 'absurd' | 'quiet' | 'triumphant';

export type CharacterStatus = 'alive' | 'dead' | 'discharged' | 'legend' | 'ascended';

// Content Bible 1.2 `requires`. Every present clause must hold for the item to be eligible.
export interface Requires {
  tags_any?: string[];
  tags_none?: string[];
  stat_min?: Partial<StatBlock>;
  stat_max?: Partial<StatBlock>;
}

export interface StatCheck {
  stat: StatId[];
  difficulty?: number;
}

export type CheckResult = 'critical_success' | 'success' | 'failure' | 'critical_failure';

export interface Consequence {
  stat_changes?: Partial<StatBlock>;
  add_tags?: string[];
  remove_tags?: string[];
  result_text: string;
  terminal?: boolean;
  ending_category?: EndingCategory;
  // The Content Bible's ending templates slot {regiment} and {final_rank}, but nothing
  // in the schema ever supplied them. Content sets them at the moment the fiction does:
  // the regiment at recruitment, the rank on promotion.
  set_regiment?: string;
  set_rank?: string;
  set_branch?: BranchId;
}

// A choice is either guaranteed (Consequence fields inline, per the Content Bible's
// `report_to_enforcers` example) or checked (`stat_check` plus outcome branches).
// The crit branches are optional: GDD 7 mandates four tiers, but content may collapse
// them to pass/fail, in which case crits fall back to on_success / on_failure.
export interface Choice extends Partial<Consequence> {
  id: string;
  label: string;
  stat_check?: StatCheck;
  on_success?: Consequence;
  on_failure?: Consequence;
  on_critical_success?: Consequence;
  on_critical_failure?: Consequence;
}

export interface EventCardContent {
  id: string;
  stage: StageId;
  tone?: Tone;
  requires?: Requires;
  min_player_level?: number;
  weight?: number;
  text: string;
  choices: Choice[];
  terminal?: boolean;
}

// Extends the Content Bible 1.1 origin schema. Name pools live on the origin rather than
// in the engine so adding a world in Phase 3 stays a content-only change, and because an
// underhive ganger and a spire heir should not draw from the same pool.
export interface NamePools {
  forenames: string[];
  surnames: string[];
  format?: string;
}

export interface OriginContent {
  id: string;
  name: string;
  description: string;
  // The display name reads as a heading ("Hive World: Underhive") and badly mid-sentence,
  // so origins supply a prose form for the Service Record precis.
  record_phrase?: string;
  stat_modifiers?: Partial<StatBlock>;
  starting_tags?: string[];
  name_pools?: NamePools;
  min_player_level?: number;
  weight?: number;
}

export interface EndingContent {
  id: string;
  category: EndingCategory;
  requires?: Requires;
  headline: string;
  summary_template: string;
  tone?: Tone;
  weight?: number;
}

// Content Bible 7.5. `position` and `world_type` are additions: the Bible describes the
// sector as an ordered list, which is enough to sequence campaigns but not to draw them.
// A map needs somewhere to put each world, and authoring that by hand beats deriving it,
// because a hand-placed sector reads as a place and a generated one reads as a graph.
export const WORLD_TYPES = [
  'hive',
  'forge',
  'agri',
  'shrine',
  'death',
  'void',
  'mining',
  'feral',
  'fortress',
  'dead',
] as const;
export type WorldType = (typeof WORLD_TYPES)[number];

// A named area of the chart. Regions are the unit the level gates act on, per Content
// Bible 7.6: content is tiered at 1/30/50/70 rather than dripped per level, so a region
// opening is a visible chapter break on the map instead of one more world appearing.
export interface RegionContent {
  id: string;
  name: string;
  order: number;
  min_player_level: number;
  // What the Cartography Corps has on the area before it is opened.
  survey: string;
  // Percentages of the sector, giving the region a footprint to draw and to label.
  bounds: { x: number; y: number; width: number; height: number };
}

// Content Bible 7.5. `position`, `world_type` and `region` are additions: the Bible
// describes the sector as an ordered list, which is enough to sequence campaigns but not
// to draw them. A map needs somewhere to put each world, and authoring that by hand beats
// deriving it, because a hand-placed sector reads as a place and a generated one reads as
// a graph.
export interface CampaignContent {
  id: string;
  name: string;
  region: string;
  order: number;
  threshold: number;
  flavor_intro: string;
  win_summary: string;
  loss_summary: string;
  recapture_of?: string | null;
  // The Bible asks for "a soft time/run-count ceiling that forces resolution" without
  // specifying one. Without it a run of disgrace and corruption endings, which contribute
  // zero and negative, can stall a campaign forever. At the ceiling the world falls.
  runs_ceiling?: number;
  // Percentages of the whole sector, not of a panel and not pixels, so the same numbers
  // survive any amount of panning and zooming.
  position: { x: number; y: number };
  world_type?: WorldType;
  min_player_level?: number;
}

// `contested` replaces the old `active`: with the player choosing a front, any number of
// worlds can be in play at once, so there is no longer a single active campaign.
// `garrison` is a world whose region has not opened yet.
export type CampaignStatus = 'garrison' | 'contested' | 'won' | 'lost';

// Tech Architecture 7a.
export interface CampaignState {
  id: string;
  contributionSoFar: number;
  status: CampaignStatus;
  // Not in the Bible's shape. Without it a resolved campaign cannot say how it went, and
  // the sector log is the one screen whose whole job is telling you how it went.
  runsSpent: number;
}

export interface SectorState {
  campaigns: CampaignState[];
  // Lives spent anywhere in the sector, not on any one world. The war's own clock: it is
  // what the drift on unattended fronts is measured against.
  runsTotal: number;
}

// Tech Architecture 7b. Only the two fields Phase 2 actually earns are here; relics,
// medals, reputation and run history are named in the spec but belong to their own slice
// and would be dead weight in storage until something writes them.
export interface MetaProgressState {
  playerXP: number;
  playerLevel: number;
}

export interface HistoryEntry {
  eventId: string;
  choiceId: string;
  stageAtTime: StageId;
  resultText: string;
  checkResult?: CheckResult;
}

// Keyed by runId per Tech Architecture 7, so a future Legacy mode can hold an array of
// these rather than assuming a single character ever exists.
export interface CharacterState {
  runId: string;
  name: string;
  originId: string;
  stats: StatBlock;
  // Tech Architecture 3 specifies Set<string>. Using an array instead: a Set does not
  // survive JSON.stringify, and Phase 3 autosaves this straight into localStorage.
  tags: string[];
  stage: StageId;
  history: HistoryEntry[];
  age: number;
  branch: BranchId | null;
  regiment: string | null;
  rank: string;
  status: CharacterStatus;
  endingCategory: EndingCategory | null;
}
