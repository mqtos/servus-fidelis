// Cross-run state, per Tech Architecture 7a. This outlives every character, so it is the
// one place in the game where bad data is permanent: a value written by an older build is
// still there twenty runs later. Everything here therefore fails soft. A read that cannot
// be trusted returns null and the caller starts fresh, because losing a sector's progress
// is a disappointment and refusing to boot is a broken game.

const PREFIX = 'servus_fidelis';

// Bumped when a stored shape changes incompatibly. Old versions are discarded rather than
// migrated: there is no released version to migrate from yet, and pretending otherwise
// would mean writing migrations that have never been run against real data.
// Bumped to 2 when the sector stopped being a queue with one active campaign: a v1 sector
// carries an activeCampaignIndex and statuses that no longer exist.
const VERSION = 2;

interface Envelope<T> {
  version: number;
  data: T;
}

function key(name: string): string {
  return `${PREFIX}:${name}`;
}

// Storage access itself can throw, not just return null: Safari private mode and any
// browser with site data blocked throw on access to localStorage. The game has to run
// without persistence at all, so every entry point here is wrapped.
function storage(): Storage | null {
  try {
    const probe = '__probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

const store = typeof window === 'undefined' ? null : storage();

export const persistenceAvailable = store !== null;

export function load<T>(name: string, isValid: (value: unknown) => value is T): T | null {
  if (!store) return null;
  try {
    const raw = store.getItem(key(name));
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      (parsed as Envelope<unknown>).version !== VERSION
    ) {
      return null;
    }
    const { data } = parsed as Envelope<unknown>;
    return isValid(data) ? data : null;
  } catch {
    return null;
  }
}

export function save<T>(name: string, data: T): void {
  if (!store) return;
  try {
    const envelope: Envelope<T> = { version: VERSION, data };
    store.setItem(key(name), JSON.stringify(envelope));
  } catch {
    // Quota exceeded, or storage revoked mid-session. The run continues either way.
  }
}

export function clear(name: string): void {
  if (!store) return;
  try {
    store.removeItem(key(name));
  } catch {
    // Nothing to do: the caller's intent was to be rid of it, and it is unreachable.
  }
}
