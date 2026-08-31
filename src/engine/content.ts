import { STAGE_ORDER, STAT_IDS } from './types';
import type {
  CampaignContent,
  EndingCategory,
  EndingContent,
  EventCardContent,
  OriginContent,
  RegionContent,
  StageId,
} from './types';

const originModules = import.meta.glob('../../content/origins/**/*.yaml', { eager: true });
const eventModules = import.meta.glob('../../content/events/**/*.yaml', { eager: true });
const endingModules = import.meta.glob('../../content/endings/**/*.yaml', { eager: true });
const campaignModules = import.meta.glob('../../content/campaigns/**/*.yaml', { eager: true });
const regionModules = import.meta.glob('../../content/regions/**/*.yaml', { eager: true });
const configModules = import.meta.glob('../../content/config/*.yaml', { eager: true });

const ENDING_CATEGORIES = [
  'pointless_death',
  'glorious_death',
  'quiet_survival',
  'disgrace',
  'legend',
  'corruption',
  'ascended',
] as const;

const BRANCH_IDS = ['line_infantry', 'officer', 'commissariat', 'inquisition', 'astartes'] as const;

type Errors = string[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(doc: Record<string, unknown>, key: string, path: string, errors: Errors): string {
  const value = doc[key];
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path}: "${key}" must be a non-empty string.`);
    return '';
  }
  return value;
}

function checkStatKeys(value: unknown, path: string, where: string, errors: Errors): void {
  if (value === undefined) return;
  if (!isRecord(value)) {
    errors.push(`${path}: ${where} must be a mapping of stat to number.`);
    return;
  }
  for (const [key, amount] of Object.entries(value)) {
    if (!(STAT_IDS as readonly string[]).includes(key)) {
      errors.push(`${path}: ${where} references unknown stat "${key}". Valid: ${STAT_IDS.join(', ')}.`);
    }
    if (typeof amount !== 'number') {
      errors.push(`${path}: ${where}.${key} must be a number.`);
    }
  }
}

function checkRequires(value: unknown, path: string, errors: Errors): void {
  if (value === undefined) return;
  if (!isRecord(value)) {
    errors.push(`${path}: "requires" must be a mapping.`);
    return;
  }
  checkStatKeys(value['stat_min'], path, 'requires.stat_min', errors);
  checkStatKeys(value['stat_max'], path, 'requires.stat_max', errors);
  for (const key of ['tags_any', 'tags_none'] as const) {
    const tags = value[key];
    if (tags !== undefined && !Array.isArray(tags)) {
      errors.push(`${path}: requires.${key} must be a list.`);
    }
  }
}

function checkConsequence(value: unknown, path: string, where: string, errors: Errors): void {
  if (!isRecord(value)) {
    errors.push(`${path}: ${where} must be a mapping.`);
    return;
  }
  checkStatKeys(value['stat_changes'], path, `${where}.stat_changes`, errors);
  if (typeof value['result_text'] !== 'string') {
    errors.push(`${path}: ${where} needs a result_text.`);
  }
  const category = value['ending_category'];
  if (value['terminal'] === true && typeof category !== 'string') {
    errors.push(`${path}: ${where} is terminal so it needs an ending_category.`);
  }
  if (category !== undefined && !(ENDING_CATEGORIES as readonly unknown[]).includes(category)) {
    errors.push(`${path}: ${where}.ending_category "${String(category)}" is not a known category.`);
  }
  const branch = value['set_branch'];
  if (branch !== undefined && !(BRANCH_IDS as readonly unknown[]).includes(branch)) {
    errors.push(`${path}: ${where}.set_branch "${String(branch)}" is not a known branch. Valid: ${BRANCH_IDS.join(', ')}.`);
  }
}

function parseEvent(doc: Record<string, unknown>, path: string, errors: Errors): EventCardContent {
  requireString(doc, 'id', path, errors);
  requireString(doc, 'text', path, errors);
  checkRequires(doc['requires'], path, errors);

  const stage = doc['stage'];
  if (typeof stage !== 'string' || !(STAGE_ORDER as readonly string[]).includes(stage)) {
    errors.push(`${path}: "stage" is "${String(stage)}". Valid: ${STAGE_ORDER.join(', ')}.`);
  }

  const choices = doc['choices'];
  if (!Array.isArray(choices) || choices.length === 0) {
    errors.push(`${path}: "choices" must be a non-empty list.`);
  } else {
    choices.forEach((choice, index) => {
      const where = `choice[${index}]`;
      if (!isRecord(choice)) {
        errors.push(`${path}: ${where} must be a mapping.`);
        return;
      }
      const id = requireString(choice, 'id', path, errors) || where;
      requireString(choice, 'label', path, errors);

      if (choice['stat_check'] !== undefined) {
        const check = choice['stat_check'];
        if (!isRecord(check) || !Array.isArray(check['stat']) || check['stat'].length === 0) {
          errors.push(`${path}: choice "${id}" stat_check needs a non-empty "stat" list.`);
        } else {
          for (const stat of check['stat']) {
            if (!(STAT_IDS as readonly unknown[]).includes(stat)) {
              errors.push(`${path}: choice "${id}" stat_check references unknown stat "${String(stat)}".`);
            }
          }
        }
        for (const branch of ['on_success', 'on_failure'] as const) {
          if (choice[branch] === undefined) {
            errors.push(`${path}: choice "${id}" has a stat_check so it needs "${branch}".`);
          } else {
            checkConsequence(choice[branch], path, `choice "${id}".${branch}`, errors);
          }
        }
        for (const branch of ['on_critical_success', 'on_critical_failure'] as const) {
          if (choice[branch] !== undefined) {
            checkConsequence(choice[branch], path, `choice "${id}".${branch}`, errors);
          }
        }
      } else {
        checkConsequence(choice, path, `choice "${id}"`, errors);
      }
    });
  }

  return doc as unknown as EventCardContent;
}

function parseOrigin(doc: Record<string, unknown>, path: string, errors: Errors): OriginContent {
  requireString(doc, 'id', path, errors);
  requireString(doc, 'name', path, errors);
  requireString(doc, 'description', path, errors);
  checkStatKeys(doc['stat_modifiers'], path, 'stat_modifiers', errors);
  return doc as unknown as OriginContent;
}

function parseEnding(doc: Record<string, unknown>, path: string, errors: Errors): EndingContent {
  requireString(doc, 'id', path, errors);
  requireString(doc, 'headline', path, errors);
  requireString(doc, 'summary_template', path, errors);
  checkRequires(doc['requires'], path, errors);

  const category = doc['category'];
  if (!(ENDING_CATEGORIES as readonly unknown[]).includes(category)) {
    errors.push(`${path}: "category" is "${String(category)}". Valid: ${ENDING_CATEGORIES.join(', ')}.`);
  }
  return doc as unknown as EndingContent;
}

function requirePercent(
  value: unknown,
  path: string,
  where: string,
  errors: Errors,
): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
    errors.push(`${path}: ${where} must be a number between 0 and 100.`);
  }
}

function parseRegion(doc: Record<string, unknown>, path: string, errors: Errors): RegionContent {
  requireString(doc, 'id', path, errors);
  requireString(doc, 'name', path, errors);
  requireString(doc, 'survey', path, errors);

  const order = doc['order'];
  if (typeof order !== 'number' || !Number.isFinite(order) || order <= 0) {
    errors.push(`${path}: "order" must be a positive number.`);
  }
  const gate = doc['min_player_level'];
  if (typeof gate !== 'number' || !Number.isInteger(gate) || gate < 1) {
    errors.push(`${path}: "min_player_level" must be an integer of 1 or more.`);
  }

  // A region with no footprint cannot be drawn or labelled, and the map is the screen the
  // regions exist for, so this is an error rather than a default.
  const bounds = doc['bounds'];
  if (!isRecord(bounds)) {
    errors.push(`${path}: "bounds" must be a mapping with x, y, width and height.`);
  } else {
    for (const key of ['x', 'y', 'width', 'height'] as const) {
      requirePercent(bounds[key], path, `bounds.${key}`, errors);
    }
  }

  return doc as unknown as RegionContent;
}

function parseCampaign(doc: Record<string, unknown>, path: string, errors: Errors): CampaignContent {
  requireString(doc, 'id', path, errors);
  requireString(doc, 'name', path, errors);
  requireString(doc, 'region', path, errors);
  requireString(doc, 'flavor_intro', path, errors);
  requireString(doc, 'win_summary', path, errors);
  requireString(doc, 'loss_summary', path, errors);

  for (const key of ['order', 'threshold'] as const) {
    const value = doc[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      errors.push(`${path}: "${key}" must be a positive number.`);
    }
  }

  // A world with no position cannot be drawn, and a map that silently drops a campaign is
  // worse than one that refuses to load, so this is an error rather than a default.
  const position = doc['position'];
  if (!isRecord(position)) {
    errors.push(`${path}: "position" must be a mapping with x and y.`);
  } else {
    for (const axis of ['x', 'y'] as const) {
      requirePercent(position[axis], path, `position.${axis}`, errors);
    }
  }

  return doc as unknown as CampaignContent;
}

function collect<T extends { id: string }>(
  modules: Record<string, unknown>,
  parse: (doc: Record<string, unknown>, path: string, errors: Errors) => T,
  errors: Errors,
  seenIds: Map<string, string>,
): T[] {
  const items: T[] = [];
  for (const path of Object.keys(modules).sort()) {
    const doc = (modules[path] as { default?: unknown } | undefined)?.default;
    if (!isRecord(doc)) {
      errors.push(`${path}: did not parse to a YAML mapping.`);
      continue;
    }
    const item = parse(doc, path, errors);
    const previous = seenIds.get(item.id);
    if (previous) {
      errors.push(`${path}: duplicate id "${item.id}", already defined in ${previous}.`);
    } else if (item.id) {
      seenIds.set(item.id, path);
    }
    items.push(item);
  }
  return items;
}

// Collected rather than thrown: a throw during module evaluation happens before React
// mounts, so no error boundary can catch it and a production build just goes white.
// App blocks on a non-empty contentErrors and renders the list instead.
export const contentErrors: Errors = [];
const seenIds = new Map<string, string>();

export const origins = collect<OriginContent>(originModules, parseOrigin, contentErrors, seenIds);
export const events = collect<EventCardContent>(eventModules, parseEvent, contentErrors, seenIds);
export const endings = collect<EndingContent>(endingModules, parseEnding, contentErrors, seenIds);

// Regions share the id namespace with everything else, so a world and the region holding
// it cannot collide. Sorted by `order`: that is the order they open in, and the order the
// sector log lists them in.
export const regions = collect<RegionContent>(
  regionModules,
  parseRegion,
  contentErrors,
  seenIds,
).sort((a, b) => a.order - b.order);

// Sorted by `order`, which is now a label and a tiebreak rather than a queue position:
// with the player choosing a front, no code walks the array looking for what is next.
export const campaigns = collect<CampaignContent>(
  campaignModules,
  parseCampaign,
  contentErrors,
  seenIds,
).sort((a, b) => a.order - b.order);

const seenOrders = new Map<number, string>();

for (const campaign of campaigns) {
  // A world in no region can never be reached, because reachability is a region gate, so
  // it would load and draw and simply never be deployable. Refuse it instead.
  const home = regions.find((region) => region.id === campaign.region);
  if (campaign.region && !home) {
    contentErrors.push(
      `content/campaigns/${campaign.id}: region "${campaign.region}" does not match any region id.`,
    );
  }
  // A world drawn outside the footprint it belongs to is not a rendering bug, it is a
  // content bug, and it is invisible in a diff. Caught here instead.
  const inside =
    home && campaign.position
      ? campaign.position.x >= home.bounds.x &&
        campaign.position.x <= home.bounds.x + home.bounds.width &&
        campaign.position.y >= home.bounds.y &&
        campaign.position.y <= home.bounds.y + home.bounds.height
      : true;
  if (!inside) {
    contentErrors.push(
      `content/campaigns/${campaign.id}: position sits outside the bounds of region "${campaign.region}".`,
    );
  }
  const clash = seenOrders.get(campaign.order);
  if (clash) {
    contentErrors.push(
      `content/campaigns/${campaign.id}: order ${campaign.order} is already used by "${clash}".`,
    );
  } else {
    seenOrders.set(campaign.order, campaign.id);
  }
  const target = campaign.recapture_of;
  if (target && !campaigns.some((other) => other.id === target)) {
    contentErrors.push(
      `content/campaigns/${campaign.id}: recapture_of "${target}" does not match any campaign id.`,
    );
  }
}

// The first region has to be open at level 1 or a new account boots into a sector with
// nowhere to deploy, which reads as a broken game rather than a locked one.
if (regions.length > 0 && (regions[0]?.min_player_level ?? 1) > 1) {
  contentErrors.push(
    `content/regions: the first region "${regions[0]?.id}" gates at level ${regions[0]?.min_player_level}, so a new account has no front to deploy to.`,
  );
}

// Contribution weight per ending category (Content Bible 7.5). Global rather than
// per-campaign, so it lives in config rather than alongside the sector content.
const DEFAULT_CONTRIBUTION: Record<EndingCategory, number> = {
  pointless_death: 10,
  glorious_death: 25,
  quiet_survival: 40,
  disgrace: 0,
  corruption: -15,
  legend: 100,
  ascended: 400,
};

function loadContributionWeights(): Record<EndingCategory, number> {
  const entry = Object.entries(configModules).find(([path]) => path.endsWith('war_effort.yaml'));
  if (!entry) return DEFAULT_CONTRIBUTION;
  const [path, module] = entry;
  const doc = (module as { default?: unknown } | undefined)?.default;
  if (!isRecord(doc) || !isRecord(doc['contribution_weights'])) {
    contentErrors.push(`${path}: needs a "contribution_weights" mapping.`);
    return DEFAULT_CONTRIBUTION;
  }
  const weights = { ...DEFAULT_CONTRIBUTION };
  for (const [key, value] of Object.entries(doc['contribution_weights'])) {
    if (!(ENDING_CATEGORIES as readonly string[]).includes(key)) {
      contentErrors.push(`${path}: contribution_weights has unknown category "${key}".`);
      continue;
    }
    if (typeof value !== 'number') {
      contentErrors.push(`${path}: contribution_weights.${key} must be a number.`);
      continue;
    }
    weights[key as EndingCategory] = value;
  }
  return weights;
}

export const contributionWeights = loadContributionWeights();

// Falls back rather than erroring: a missing sector name is a cosmetic gap on one screen,
// not a reason to refuse to boot the game.
function loadSectorName(): string {
  const entry = Object.entries(configModules).find(([path]) => path.endsWith('war_effort.yaml'));
  const doc = (entry?.[1] as { default?: unknown } | undefined)?.default;
  const name = isRecord(doc) ? doc['sector_name'] : undefined;
  return typeof name === 'string' && name.trim().length > 0 ? name : 'The Sector';
}

export const sectorName = loadSectorName();

export const originsById = new Map(origins.map((origin) => [origin.id, origin]));
export const endingsById = new Map(endings.map((ending) => [ending.id, ending]));
export const campaignsById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));

export const eventsByStage = STAGE_ORDER.reduce(
  (acc, stage) => {
    acc[stage] = events.filter((event) => event.stage === stage);
    return acc;
  },
  {} as Record<StageId, EventCardContent[]>,
);

export const contentCounts = {
  origins: origins.length,
  events: events.length,
  endings: endings.length,
  campaigns: campaigns.length,
};
