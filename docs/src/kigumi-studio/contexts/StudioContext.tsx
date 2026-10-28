import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import {
  PROPERTIES_BY_GROUP,
  PROPERTIES_BY_VAR,
  type PropertyGroup,
} from '../lib/property-definitions';
import {
  loadLocks,
  saveLocks,
  withLocks,
  type LockedValues,
} from '../lib/locks';
import { hasThemeAgentAccess } from '../theme-agent/access';
import {
  DEFAULT_VALUES,
  type ThemeMode,
  type ThemeValue,
} from '../lib/defaults';
import { storedCustomCSS } from '../lib/custom-css';
import { modifiedProperties } from '../lib/css-generator';
import { withImportedValues } from '../lib/theme-css';
import { AVAILABLE_FONTS } from '../lib/font-definitions';
import { buildPreviewStyle } from '../lib/preview-style';
import { withDerivedBrandFillUnset } from '../lib/brand-fill';

const STORAGE_KEY = 'kigumi-studio-state';
// 2.1 stores the values the user changed; 2.0 stored the export, derived
// values included, and still loads.
const STORAGE_VERSION = '2.1';
const EXPORT_STORAGE_VERSION = '2.0';

interface PersistedState {
  version: string;
  editMode: ThemeMode;
  previewMode: ThemeMode;
  /** The values the user changed, per mode (2.0: the export). */
  modifiedProperties: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  shadowComponents: string[];
  customCSS: string | null;
  selectedPreset: string | null;
  timestamp: number;
}

interface StudioContextType {
  values: Record<string, ThemeValue>;
  editMode: ThemeMode;
  previewMode: ThemeMode;
  shadowComponents: string[];
  customCSS: string | null;
  selectedPreset: string | null;

  setProperty: (cssVar: string, value: string) => void;
  setEditMode: (mode: ThemeMode) => void;
  setPreviewMode: (mode: ThemeMode) => void;
  setShadowComponents: (components: string[]) => void;
  setCustomCSS: (css: string | null) => void;
  setSelectedPreset: (preset: string | null) => void;
  resetAll: () => void;
  /**
   * Call `listener` whenever the whole custom theme is replaced: a preset,
   * Default or an import, all through `resetAll`. A Theme Agent conversation
   * ends then. Edits and a section reset do not count. Returns unsubscribe.
   */
  onThemeReplaced: (listener: () => void) => () => void;
  resetGroup: (group: PropertyGroup) => void;
  /** Values the Theme Agent may not change, per mode (lib/locks.ts). */
  lockedValues: LockedValues;
  setLocked: (change: LockedValues, locked: boolean) => void;
  /**
   * Whether locks apply: only with the Theme Agent's access cookie. Without
   * it there is no switch to unlock with, so a stored lock must not leave a
   * value disabled.
   */
  locksAvailable: boolean;
  importValues: (
    imported: Record<string, { light?: string; dark?: string }>
  ) => void;

  getStyleObject: (mode: ThemeMode) => Record<string, string>;
  getModifiedProperties: () => {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  isModified: (cssVar: string) => boolean;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

function cloneDefaults(): Record<string, ThemeValue> {
  const clone: Record<string, ThemeValue> = {};
  for (const [key, val] of Object.entries(DEFAULT_VALUES)) {
    clone[key] = { light: val.light, dark: val.dark };
  }
  return clone;
}

/** The values the user changed from Studio's defaults, per mode, as stored. */
function changedValues(values: Record<string, ThemeValue>): {
  light: Record<string, string>;
  dark: Record<string, string>;
} {
  const changed = {
    light: {} as Record<string, string>,
    dark: {} as Record<string, string>,
  };
  for (const [cssVar, value] of Object.entries(values)) {
    const defaults = DEFAULT_VALUES[cssVar];
    if (!defaults) continue;
    if (value.light !== defaults.light) changed.light[cssVar] = value.light;
    if (value.dark !== defaults.dark) changed.dark[cssVar] = value.dark;
  }
  return changed;
}

function loadPersistedState(): PersistedState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PersistedState;
    if (
      parsed.version !== STORAGE_VERSION &&
      parsed.version !== EXPORT_STORAGE_VERSION
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function loadInitialValues(
  persisted: PersistedState | null
): Record<string, ThemeValue> {
  const base = cloneDefaults();
  if (!persisted?.modifiedProperties) return base;

  let imported: Record<string, { light?: string; dark?: string }> = {};
  for (const [cssVar, value] of Object.entries(
    persisted.modifiedProperties.light
  )) {
    imported[cssVar] = { ...imported[cssVar], light: value };
  }
  for (const [cssVar, value] of Object.entries(
    persisted.modifiedProperties.dark
  )) {
    imported[cssVar] = { ...imported[cssVar], dark: value };
  }

  // A 2.0 state is the export, which writes the derived brand fill with
  // every changed brand: kept as a value, it would stop following it.
  if (persisted.version === EXPORT_STORAGE_VERSION) {
    imported = withDerivedBrandFillUnset(imported);
  }

  for (const [cssVar, modes] of Object.entries(imported)) {
    if (!base[cssVar]) continue;
    const prop = PROPERTIES_BY_VAR.get(cssVar);
    const suffix = prop?.unit;
    const strip = (v: string | undefined): string | undefined => {
      if (!v || !suffix) return v;
      return v.endsWith(suffix) ? v.slice(0, -suffix.length) : v;
    };
    base[cssVar] = {
      light: strip(modes.light) ?? base[cssVar].light,
      dark: strip(modes.dark) ?? base[cssVar].dark,
    };
  }

  return base;
}

// Cache persisted state at module level so it's read once (not on every render)
let _persistedCache: PersistedState | null | undefined;
function getPersistedOnce(): PersistedState | null {
  if (_persistedCache === undefined) {
    _persistedCache = loadPersistedState();
  }
  return _persistedCache;
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<Record<string, ThemeValue>>(() =>
    loadInitialValues(getPersistedOnce())
  );
  const [editMode, setEditMode] = useState<ThemeMode>(
    () => getPersistedOnce()?.editMode ?? 'dark'
  );
  const [previewMode, setPreviewMode] = useState<ThemeMode>(
    () => getPersistedOnce()?.previewMode ?? 'dark'
  );
  const [shadowComponents, setShadowComponents] = useState<string[]>(
    () => getPersistedOnce()?.shadowComponents ?? []
  );
  const [customCSS, setCustomCSS] = useState<string | null>(() =>
    storedCustomCSS(getPersistedOnce()?.customCSS)
  );
  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    () => getPersistedOnce()?.selectedPreset ?? null
  );
  const [lockedValues, setLockedValues] = useState<LockedValues>(loadLocks);
  const themeReplacedListeners = useRef(new Set<() => void>());

  const onThemeReplaced = useCallback((listener: () => void) => {
    const listeners = themeReplacedListeners.current;
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  const [locksAvailable] = useState(() => hasThemeAgentAccess(document.cookie));
  const isFirstRender = useRef(true);

  const setLocked = useCallback((change: LockedValues, locked: boolean) => {
    setLockedValues((prev) => withLocks(prev, change, locked));
  }, []);

  useEffect(() => {
    saveLocks(lockedValues);
  }, [lockedValues]);

  const setProperty = useCallback(
    (cssVar: string, value: string) => {
      setValues((prev) => {
        const current = prev[cssVar];
        if (!current) return prev;
        // A value that is the same in both modes is set in both, whichever
        // mode is being edited; otherwise the other mode keeps a stale value
        // and the export writes the two apart.
        const bothModes =
          PROPERTIES_BY_VAR.get(cssVar)?.modeDependent === false;
        return {
          ...prev,
          [cssVar]: bothModes
            ? { light: value, dark: value }
            : { ...current, [editMode]: value },
        };
      });
    },
    [editMode]
  );

  const resetAll = useCallback(() => {
    setValues(cloneDefaults());
    setShadowComponents([]);
    setCustomCSS(null);
    setSelectedPreset(null);
    for (const listener of themeReplacedListeners.current) listener();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const resetGroup = useCallback((group: PropertyGroup) => {
    const groupProps = PROPERTIES_BY_GROUP.get(group);
    if (!groupProps) return;
    setValues((prev) => {
      const next = { ...prev };
      for (const prop of groupProps) {
        next[prop.cssVar] = {
          light: DEFAULT_VALUES[prop.cssVar].light,
          dark: DEFAULT_VALUES[prop.cssVar].dark,
        };
      }
      return next;
    });
  }, []);

  const importValues = useCallback(
    (imported: Record<string, { light?: string; dark?: string }>) => {
      setValues((prev) => withImportedValues(prev, imported));
    },
    []
  );

  const getStyleObject = useCallback(
    (mode: ThemeMode): Record<string, string> =>
      buildPreviewStyle(values, mode),
    [values]
  );

  const getModifiedProperties = useCallback(
    () => modifiedProperties(values),
    [values]
  );

  const isModified = useCallback(
    (cssVar: string): boolean => {
      const current = values[cssVar];
      const defaults = DEFAULT_VALUES[cssVar];
      if (!current || !defaults) return false;
      return current.light !== defaults.light || current.dark !== defaults.dark;
    },
    [values]
  );

  // Persist state to localStorage. Extracted so it can be called both
  // from the debounced effect and synchronously on unmount.
  const persistState = useCallback(() => {
    try {
      // The user's own values, never the export: a derived value read back
      // as one would stop following what it derives from.
      const modified = changedValues(values);
      const hasModifications =
        Object.keys(modified.light).length > 0 ||
        Object.keys(modified.dark).length > 0 ||
        shadowComponents.length > 0 ||
        customCSS !== null;

      if (!hasModifications) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      const state: PersistedState = {
        version: STORAGE_VERSION,
        editMode,
        previewMode,
        modifiedProperties: modified,
        shadowComponents,
        customCSS,
        selectedPreset,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Failed to save theme to localStorage:', err);
    }
  }, [
    editMode,
    previewMode,
    shadowComponents,
    customCSS,
    selectedPreset,
    values,
  ]);

  // Save to localStorage on change (debounced)
  useEffect(() => {
    // Skip the first render — state already matches localStorage
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeoutId = setTimeout(persistState, 1500);
    return () => clearTimeout(timeoutId);
  }, [values, persistState]);

  // Keep a ref to the latest persistState so the unmount cleanup always
  // calls the most recent version (not the one captured at mount time).
  // Updated after commit: assigning during render is unsafe under React 19.
  const persistRef = useRef(persistState);
  useEffect(() => {
    persistRef.current = persistState;
  }, [persistState]);

  // Flush pending state to localStorage on unmount
  useEffect(() => {
    return () => persistRef.current();
  }, []);

  // Dynamically load Bunny Fonts when font family values change
  useEffect(() => {
    const fontVars = [
      '--wa-font-family-body',
      '--wa-font-family-heading',
      '--wa-font-family-code',
      '--wa-font-family-longform',
    ];

    const neededUrls = new Set<string>();
    for (const cssVar of fontVars) {
      const current = values[cssVar];
      if (!current) continue;
      for (const mode of ['light', 'dark'] as const) {
        const val = current[mode];
        const font = AVAILABLE_FONTS.find((f) => f.value === val);
        if (font?.bunnyUrl) neededUrls.add(font.bunnyUrl);
      }
    }

    // Add <link> tags for fonts not yet loaded, remove stale ones
    const existingLinks = document.querySelectorAll<HTMLLinkElement>(
      `link[data-kigumi-font]`
    );
    const existingUrls = new Set<string>();

    existingLinks.forEach((link) => {
      const url = link.getAttribute('href') ?? '';
      if (neededUrls.has(url)) {
        existingUrls.add(url);
      } else {
        link.remove();
      }
    });

    neededUrls.forEach((url) => {
      if (existingUrls.has(url)) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.setAttribute('data-kigumi-font', 'true');
      document.head.appendChild(link);
    });
  }, [values]);

  const contextValue = useMemo<StudioContextType>(
    () => ({
      values,
      editMode,
      previewMode,
      shadowComponents,
      customCSS,
      selectedPreset,
      lockedValues,
      setLocked,
      locksAvailable,
      setProperty,
      setEditMode,
      setPreviewMode,
      setShadowComponents,
      setCustomCSS,
      setSelectedPreset,
      resetAll,
      onThemeReplaced,
      resetGroup,
      importValues,
      getStyleObject,
      getModifiedProperties,
      isModified,
    }),
    [
      values,
      editMode,
      previewMode,
      shadowComponents,
      customCSS,
      selectedPreset,
      lockedValues,
      setLocked,
      locksAvailable,
      setProperty,
      resetAll,
      onThemeReplaced,
      resetGroup,
      importValues,
      getStyleObject,
      getModifiedProperties,
      isModified,
    ]
  );

  return (
    <StudioContext.Provider value={contextValue}>
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio(): StudioContextType {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
}
