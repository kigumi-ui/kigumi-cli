import { useStudio } from '../contexts/StudioContext';
import type { ThemeMode } from '../lib/defaults';
import {
  isLocked,
  lockModes,
  SHADOW_COMPONENTS_LOCK,
  THEME_MODES,
  valueLock,
} from '../lib/locks';

/** One value's lock against the Theme Agent, for its row in the sidebar. */
export interface ValueLock {
  /** Only with the Theme Agent's access cookie. */
  available: boolean;
  locked: boolean;
  /** The modes the switch locks: the edited one for a value set per mode. */
  modes: ThemeMode[];
  setLocked: (locked: boolean) => void;
}

/**
 * A property's lock in the mode the sidebar edits: a value set per mode
 * locks in that mode only, a mode-independent one in both.
 */
export function useValueLock(cssVar: string): ValueLock {
  const { editMode, lockedValues, setLocked, locksAvailable } = useStudio();
  const modes = lockModes(cssVar, editMode);
  return {
    available: locksAvailable,
    locked: locksAvailable && isLocked(lockedValues, cssVar, modes),
    modes,
    setLocked: (locked) => setLocked(valueLock(cssVar, modes), locked),
  };
}

/** The lock of the list of components that get a shadow. */
export function useShadowComponentsLock(): ValueLock {
  const { lockedValues, setLocked, locksAvailable } = useStudio();
  return {
    available: locksAvailable,
    locked: locksAvailable && lockedValues.shadowComponents,
    modes: [...THEME_MODES],
    setLocked: (locked) => setLocked(SHADOW_COMPONENTS_LOCK, locked),
  };
}
