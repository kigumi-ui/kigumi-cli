import type { ThemeMode } from './defaults';
import {
  PROPERTIES_BY_VAR,
  PROPERTY_DEFINITIONS,
} from './property-definitions';

// Locked values: what the user does not want the Theme Agent to change. Kept
// apart from the theme itself, so a reset or a preset leaves them as they
// are, and never exported: they mean something to the Theme Agent only.

/**
 * What the user locked: CSS custom properties per mode, and whether the list
 * of components that get a shadow is locked. A mode-independent property is
 * locked in both modes or in neither.
 */
export interface LockedValues {
  light: string[];
  dark: string[];
  shadowComponents: boolean;
}

export const NO_LOCKS: LockedValues = {
  light: [],
  dark: [],
  shadowComponents: false,
};

/** The lock of the list of components that get a shadow, for `withLocks`. */
export const SHADOW_COMPONENTS_LOCK: LockedValues = {
  ...NO_LOCKS,
  shadowComponents: true,
};

export const THEME_MODES: readonly ThemeMode[] = ['light', 'dark'];

const STORAGE_KEY = 'kigumi-studio-locks';

/**
 * The modes a property's switch locks while `editMode` is edited: that mode
 * for a value set per mode, both for a mode-independent one.
 */
export function lockModes(cssVar: string, editMode: ThemeMode): ThemeMode[] {
  return PROPERTIES_BY_VAR.get(cssVar)?.modeDependent
    ? [editMode]
    : [...THEME_MODES];
}

/** The lock of one property in `modes`, for `withLocks`. */
export function valueLock(
  cssVar: string,
  modes: readonly ThemeMode[]
): LockedValues {
  return {
    light: modes.includes('light') ? [cssVar] : [],
    dark: modes.includes('dark') ? [cssVar] : [],
    shadowComponents: false,
  };
}

export function isLocked(
  locked: LockedValues,
  cssVar: string,
  modes: readonly ThemeMode[]
): boolean {
  return modes.every((mode) => locked[mode].includes(cssVar));
}

/**
 * `locked` with every lock in `change` added (`lock`) or removed; a lock
 * `change` does not name stays as it is. `change` names values the way
 * `valueLock()` and `SHADOW_COMPONENTS_LOCK` build them, so unlocking the
 * shadow component list takes `SHADOW_COMPONENTS_LOCK`, never `NO_LOCKS`. A
 * mode-independent property changes in both modes, each list keeps sidebar
 * order, and a CSS variable that is not a Studio property is dropped.
 */
export function withLocks(
  locked: LockedValues,
  change: LockedValues,
  lock: boolean
): LockedValues {
  const next = { light: new Set(locked.light), dark: new Set(locked.dark) };
  for (const mode of THEME_MODES) {
    for (const cssVar of change[mode]) {
      for (const target of lockModes(cssVar, mode)) {
        if (lock) next[target].add(cssVar);
        else next[target].delete(cssVar);
      }
    }
  }
  const inOrder = (set: Set<string>) =>
    PROPERTY_DEFINITIONS.map((property) => property.cssVar).filter((cssVar) =>
      set.has(cssVar)
    );
  return {
    light: inOrder(next.light),
    dark: inOrder(next.dark),
    shadowComponents: change.shadowComponents ? lock : locked.shadowComponents,
  };
}

/** Locks read from storage or a message; anything unreadable is unlocked. */
export function parseLocks(value: unknown): LockedValues {
  if (typeof value !== 'object' || value === null) return NO_LOCKS;
  const record = value as Record<string, unknown>;
  const strings = (list: unknown) =>
    Array.isArray(list)
      ? list.filter((item): item is string => typeof item === 'string')
      : [];
  return withLocks(
    NO_LOCKS,
    {
      light: strings(record.light),
      dark: strings(record.dark),
      shadowComponents: record.shadowComponents === true,
    },
    true
  );
}

/**
 * Locks as the Theme Agent reads them: a property name alone is locked in
 * both modes, `(light mode)` or `(dark mode)` names the one it is locked in,
 * and `shadowComponents` is the shadow component list.
 */
export function describeLocks(locked: LockedValues): string[] {
  const lines = PROPERTY_DEFINITIONS.flatMap(({ cssVar }) => {
    const light = locked.light.includes(cssVar);
    const dark = locked.dark.includes(cssVar);
    if (light && dark) return [cssVar];
    if (light) return [`${cssVar} (light mode)`];
    if (dark) return [`${cssVar} (dark mode)`];
    return [];
  });
  if (locked.shadowComponents) lines.push('shadowComponents');
  return lines;
}

export function loadLocks(): LockedValues {
  try {
    return parseLocks(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
  } catch {
    // Unreadable or blocked storage: nothing is locked.
    return NO_LOCKS;
  }
}

export function saveLocks(locked: LockedValues): void {
  try {
    const none =
      locked.light.length === 0 &&
      locked.dark.length === 0 &&
      !locked.shadowComponents;
    if (none) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(locked));
  } catch {
    // Storage unavailable: the locks last until the page is reloaded.
  }
}
