import { PROPERTY_DEFINITIONS } from './property-definitions';

// Locked values: what the user does not want the Theme Agent to change. Kept
// apart from the theme itself, so a reset or a preset leaves them as they
// are, and never exported: they mean something to the Theme Agent only.

/** The lock key of the list of components that get a shadow. */
export const SHADOW_COMPONENTS_LOCK = 'shadowComponents';

const STORAGE_KEY = 'kigumi-studio-locks';

/** Every value that can be locked: each custom property, and the shadow list. */
const ALL_LOCK_KEYS: readonly string[] = [
  ...PROPERTY_DEFINITIONS.map((property) => property.cssVar),
  SHADOW_COMPONENTS_LOCK,
];

/**
 * `locked` with `keys` locked or unlocked, in the order of `ALL_LOCK_KEYS`;
 * a key that is not a Studio value is dropped.
 */
export function withLocks(
  locked: readonly string[],
  keys: readonly string[],
  lock: boolean
): string[] {
  const next = new Set(locked);
  for (const key of keys) {
    if (lock) next.add(key);
    else next.delete(key);
  }
  return ALL_LOCK_KEYS.filter((key) => next.has(key));
}

export function loadLocks(): string[] {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '[]'
    );
    if (!Array.isArray(stored)) return [];
    return withLocks(
      [],
      stored.filter((key): key is string => typeof key === 'string'),
      true
    );
  } catch {
    // Unreadable or blocked storage: nothing is locked.
    return [];
  }
}

export function saveLocks(locked: readonly string[]): void {
  try {
    if (locked.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(locked));
  } catch {
    // Storage unavailable: the locks last until the page is reloaded.
  }
}
