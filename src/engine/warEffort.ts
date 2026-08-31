import type {
  CampaignContent,
  CampaignState,
  CampaignStatus,
  EndingCategory,
  RegionContent,
  SectorState,
} from './types';

// GDD Section 10. The whole layer is pure: given a sector, a campaign set and an ending,
// produce the next sector. The store owns persistence and nothing here touches it, so the
// resolution rules can be exercised without a browser.
//
// The sector is no longer a queue with one active world. Any world whose region has opened
// is contested, the player deploys to one of them, and the rest of the front does not wait
// politely while they are away: see DRIFT_INTERVAL.

const DEFAULT_RUNS_CEILING = 12;

// A contested world the player is not on still burns through its ceiling, at half the rate
// of one they are. This is the whole cost of choosing: a front you ignore is a front you
// are slowly losing. Full rate would mean saving one world per region and watching every
// other one fall no matter what you did, which is not a choice, it is a formality.
const DRIFT_INTERVAL = 2;

// Drift is capped at a fixed number of worlds a tick, and it is not spread across the map.
// Letting every contested world drift meant the pressure scaled with how much of the sector
// had opened: six live fronts early is a threat, thirty live fronts at grade 50 is an
// evaporation, and simulating it the whole sector burned out at 86 lives with the level
// cap still ten grades away. Constant pressure regardless of map size is both better
// arithmetic and better fiction. The enemy has a finite push too.
const DRIFT_WORLDS = 3;

export function initialSector(campaigns: CampaignContent[]): SectorState {
  return {
    campaigns: campaigns.map((campaign) => ({
      id: campaign.id,
      contributionSoFar: 0,
      status: 'garrison',
      runsSpent: 0,
    })),
    runsTotal: 0,
  };
}

export function isSectorState(value: unknown): value is SectorState {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<SectorState>;
  if (!Array.isArray(candidate.campaigns)) return false;
  if (typeof candidate.runsTotal !== 'number') return false;
  return candidate.campaigns.every((entry: unknown) => {
    if (typeof entry !== 'object' || entry === null) return false;
    const campaign = entry as Partial<CampaignState>;
    return (
      typeof campaign.id === 'string' &&
      typeof campaign.contributionSoFar === 'number' &&
      typeof campaign.runsSpent === 'number' &&
      ['garrison', 'contested', 'won', 'lost'].includes(campaign.status as string)
    );
  });
}

// Stored progress is matched to the campaign set by id, not by position. Authoring a new
// campaign or reordering the sector would otherwise silently reassign a player's history
// to the wrong worlds. Unknown ids are dropped and new campaigns arrive as garrisons,
// which `openFronts` will contest if the account has the level for them.
export function reconcile(state: SectorState, campaigns: CampaignContent[]): SectorState {
  const byId = new Map(state.campaigns.map((campaign) => [campaign.id, campaign]));
  return {
    campaigns: campaigns.map((campaign) => {
      const stored = byId.get(campaign.id);
      return stored
        ? { ...stored, id: campaign.id }
        : { id: campaign.id, contributionSoFar: 0, status: 'garrison' as const, runsSpent: 0 };
    }),
    runsTotal: state.runsTotal,
  };
}

export function openRegions(regions: RegionContent[], playerLevel: number): RegionContent[] {
  return regions.filter((region) => playerLevel >= region.min_player_level);
}

// Level gates are re-evaluated rather than latched, so a change to a region's threshold
// takes effect on the next load instead of leaving accounts on the old map. Resolved
// worlds are never touched: history does not reopen.
export function openFronts(
  state: SectorState,
  campaigns: CampaignContent[],
  regions: RegionContent[],
  playerLevel: number,
): SectorState {
  const openIds = new Set(openRegions(regions, playerLevel).map((region) => region.id));
  const contentById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));

  return {
    ...state,
    campaigns: state.campaigns.map((entry) => {
      if (entry.status !== 'garrison') return entry;
      const content = contentById.get(entry.id);
      if (!content) return entry;
      const reachable =
        openIds.has(content.region) && playerLevel >= (content.min_player_level ?? 1);
      return reachable ? { ...entry, status: 'contested' as const } : entry;
    }),
  };
}

// Every world the player could deploy to right now, in sector order.
export function availableFronts(
  state: SectorState,
  campaigns: CampaignContent[],
): CampaignContent[] {
  const contested = new Set(
    state.campaigns.filter((entry) => entry.status === 'contested').map((entry) => entry.id),
  );
  return campaigns.filter((campaign) => contested.has(campaign.id));
}

export interface Contribution {
  campaign: CampaignContent;
  // What this one life was worth. Can be zero (disgrace) or negative (corruption).
  amount: number;
  totalBefore: number;
  totalAfter: number;
  threshold: number;
  resolved: Extract<CampaignStatus, 'won' | 'lost'> | null;
  // Set only when the campaign resolved, so the UI can show the dossier text in place.
  summary: string | null;
  // Worlds that fell elsewhere in the sector during this life. The point of the drift is
  // that the player is told about it, so this is what the Service Record reads from.
  fellElsewhere: CampaignContent[];
}

export interface ContributionOutcome {
  sector: SectorState;
  contribution: Contribution | null;
}

function ceilingFor(content: CampaignContent): number {
  return content.runs_ceiling ?? DEFAULT_RUNS_CEILING;
}

export function contribute(
  state: SectorState,
  campaigns: CampaignContent[],
  targetId: string | null,
  endingCategory: EndingCategory,
  weights: Record<EndingCategory, number>,
): ContributionOutcome {
  const runsTotal = state.runsTotal + 1;
  const contentById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
  const target = state.campaigns.find((entry) => entry.id === targetId);
  const targetContent = targetId ? (contentById.get(targetId) ?? null) : null;

  // A run can end with nowhere to have been: the sector may be decided, or the character
  // may have died before deployment. That is a quiet no-op, not an error.
  if (!target || !targetContent || target.status !== 'contested') {
    return { sector: { ...state, runsTotal }, contribution: null };
  }

  const amount = weights[endingCategory] ?? 0;
  const totalBefore = target.contributionSoFar;
  // Floored at zero. Corruption should cost the sector its momentum, not bury a campaign
  // so deep that the next several lives are spent digging back to nothing.
  const totalAfter = Math.max(0, totalBefore + amount);

  const drifting = runsTotal % DRIFT_INTERVAL === 0;
  const fellElsewhere: CampaignContent[] = [];

  // Which worlds the enemy pushes on this tick: the ones nearest their ceiling first. The
  // war closes out what it has almost taken rather than leaning equally on everything, so
  // losses arrive one at a time and legibly, and a world the player keeps returning to is
  // not quietly decaying in the background at the same rate as one nobody has touched.
  const driftIds = new Set<string>();
  if (drifting) {
    const candidates = state.campaigns
      .filter((entry) => entry.status === 'contested' && entry.id !== target.id)
      .map((entry, index) => {
        const content = contentById.get(entry.id);
        return { id: entry.id, index, left: content ? ceilingFor(content) - entry.runsSpent : Infinity };
      })
      .filter((entry) => Number.isFinite(entry.left))
      .sort((a, b) => a.left - b.left || a.index - b.index)
      .slice(0, DRIFT_WORLDS);
    for (const candidate of candidates) driftIds.add(candidate.id);
  }

  const nextCampaigns = state.campaigns.map((entry): CampaignState => {
    if (entry.id === target.id) {
      const runsSpent = entry.runsSpent + 1;
      const status: CampaignStatus =
        totalAfter >= targetContent.threshold
          ? 'won'
          : runsSpent >= ceilingFor(targetContent)
            ? 'lost'
            : 'contested';
      return { ...entry, contributionSoFar: totalAfter, runsSpent, status };
    }

    if (!driftIds.has(entry.id)) return entry;
    const content = contentById.get(entry.id);
    if (!content) return entry;
    const runsSpent = entry.runsSpent + 1;
    if (runsSpent < ceilingFor(content)) return { ...entry, runsSpent };
    fellElsewhere.push(content);
    return { ...entry, runsSpent, status: 'lost' };
  });

  const resolvedTo = nextCampaigns.find((entry) => entry.id === target.id)?.status;
  const resolved = resolvedTo === 'won' || resolvedTo === 'lost' ? resolvedTo : null;

  return {
    sector: { campaigns: nextCampaigns, runsTotal },
    contribution: {
      campaign: targetContent,
      amount,
      totalBefore,
      totalAfter,
      threshold: targetContent.threshold,
      resolved,
      summary:
        resolved === 'won'
          ? targetContent.win_summary
          : resolved === 'lost'
            ? targetContent.loss_summary
            : null,
      fellElsewhere,
    },
  };
}
