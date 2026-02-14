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
  PROPERTY_DEFINITIONS,
  PROPERTIES_BY_GROUP,
  PROPERTIES_BY_VAR,
  type PropertyGroup,
} from '../lib/property-definitions';
import { DEFAULT_VALUES, type ThemeValue } from '../lib/defaults';
import { AVAILABLE_FONTS } from '../lib/font-definitions';
import {
  generateBrandVariables,
  generateSemanticVariables,
  type SemanticColorGroup,
} from '../lib/color-utils';

const STORAGE_KEY = 'kigumi-studio-state';
const STORAGE_VERSION = '1.0';

interface PersistedState {
  version: string;
  editMode: ThemeMode;
  previewMode: ThemeMode;
  modifiedProperties: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  shadowComponents: string[];
  timestamp: number;
}

type ThemeMode = 'light' | 'dark';

interface StudioContextType {
  values: Record<string, ThemeValue>;
  editMode: ThemeMode;
  previewMode: ThemeMode;
  shadowComponents: string[];

  setProperty: (cssVar: string, value: string) => void;
  setEditMode: (mode: ThemeMode) => void;
  setPreviewMode: (mode: ThemeMode) => void;
  setShadowComponents: (components: string[]) => void;
  resetAll: () => void;
  resetGroup: (group: PropertyGroup) => void;
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

export function StudioProvider({ children }: { children: ReactNode }) {
  const [values, setValues] =
    useState<Record<string, ThemeValue>>(cloneDefaults);
  const [editMode, setEditMode] = useState<ThemeMode>('light');
  const [previewMode, setPreviewMode] = useState<ThemeMode>('light');
  const [shadowComponents, setShadowComponents] = useState<string[]>([]);
  const hasLoadedFromStorage = useRef(false);

  const setProperty = useCallback(
    (cssVar: string, value: string) => {
      setValues((prev) => {
        const current = prev[cssVar];
        if (!current) return prev;
        return {
          ...prev,
          [cssVar]: {
            ...current,
            [editMode]: value,
          },
        };
      });
    },
    [editMode]
  );

  const resetAll = useCallback(() => {
    setValues(cloneDefaults());
    setShadowComponents([]);
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
      setValues((prev) => {
        const next = { ...prev };
        for (const [cssVar, modes] of Object.entries(imported)) {
          if (!next[cssVar]) continue;
          // Strip unit suffix for properties that store raw numbers (e.g. "75ms" -> "75")
          const prop = PROPERTIES_BY_VAR.get(cssVar);
          const suffix = prop?.unit;
          const strip = (v: string | undefined): string | undefined => {
            if (!v || !suffix) return v;
            return v.endsWith(suffix) ? v.slice(0, -suffix.length) : v;
          };
          next[cssVar] = {
            light: strip(modes.light) ?? next[cssVar].light,
            dark: strip(modes.dark) ?? next[cssVar].dark,
          };
        }
        return next;
      });
    },
    []
  );

  const getStyleObject = useCallback(
    (mode: ThemeMode): Record<string, string> => {
      const style: Record<string, string> = {};
      for (const prop of PROPERTY_DEFINITIONS) {
        const raw = values[prop.cssVar]?.[mode] ?? prop.defaultLight;
        // Append unit suffix (e.g. "ms") for properties that have one
        style[prop.cssVar] = prop.unit ? `${raw}${prop.unit}` : raw;
      }

      // Generate derived brand palette variables from --wa-color-brand.
      // WA components use --wa-color-brand-fill-loud, --wa-color-brand-50, etc.
      // which are set by the palette/brand system and NOT derived from --wa-color-brand.
      // We must explicitly generate and inject them so inline styles override the theme.
      const brandValue = style['--wa-color-brand'];
      if (brandValue) {
        const derivedVars = generateBrandVariables(brandValue, mode);
        // Merge derived vars, but keep --wa-color-brand as the user-set value
        for (const [key, val] of Object.entries(derivedVars)) {
          if (key === '--wa-color-brand') continue;
          style[key] = val;
        }
      }

      // Generate derived semantic color variables for success, warning, danger, neutral
      const semanticGroups: SemanticColorGroup[] = [
        'success',
        'warning',
        'danger',
        'neutral',
      ];
      for (const group of semanticGroups) {
        const baseValue = style[`--wa-color-${group}`];
        if (baseValue) {
          const derivedVars = generateSemanticVariables(baseValue, group, mode);
          for (const [key, val] of Object.entries(derivedVars)) {
            if (key === `--wa-color-${group}`) continue;
            style[key] = val;
          }
        }
      }

      return style;
    },
    [values]
  );

  const getModifiedProperties = useCallback(() => {
    const light: Record<string, string> = {};
    const dark: Record<string, string> = {};

    for (const prop of PROPERTY_DEFINITIONS) {
      const current = values[prop.cssVar];
      const defaults = DEFAULT_VALUES[prop.cssVar];
      if (!current || !defaults) continue;

      const suffix = prop.unit ?? '';
      if (current.light !== defaults.light) {
        light[prop.cssVar] = `${current.light}${suffix}`;
      }
      if (current.dark !== defaults.dark) {
        dark[prop.cssVar] = `${current.dark}${suffix}`;
      }
    }

    return { light, dark };
  }, [values]);

  const isModified = useCallback(
    (cssVar: string): boolean => {
      const current = values[cssVar];
      const defaults = DEFAULT_VALUES[cssVar];
      if (!current || !defaults) return false;
      return current.light !== defaults.light || current.dark !== defaults.dark;
    },
    [values]
  );

  // Load from localStorage on mount
  useEffect(() => {
    if (hasLoadedFromStorage.current) return;
    hasLoadedFromStorage.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored) as PersistedState;
      if (parsed.version !== STORAGE_VERSION) return;

      setEditMode(parsed.editMode);
      setPreviewMode(parsed.previewMode);
      setShadowComponents(parsed.shadowComponents ?? []);

      // Import modified properties
      if (parsed.modifiedProperties) {
        const imported: Record<string, { light?: string; dark?: string }> = {};
        for (const [cssVar, value] of Object.entries(
          parsed.modifiedProperties.light
        )) {
          imported[cssVar] = { ...imported[cssVar], light: value };
        }
        for (const [cssVar, value] of Object.entries(
          parsed.modifiedProperties.dark
        )) {
          imported[cssVar] = { ...imported[cssVar], dark: value };
        }
        // Use setValues directly to avoid issues with importValues callback
        setValues((prev) => {
          const next = { ...prev };
          for (const [cssVar, modes] of Object.entries(imported)) {
            if (!next[cssVar]) continue;
            const prop = PROPERTIES_BY_VAR.get(cssVar);
            const suffix = prop?.unit;
            const strip = (v: string | undefined): string | undefined => {
              if (!v || !suffix) return v;
              return v.endsWith(suffix) ? v.slice(0, -suffix.length) : v;
            };
            next[cssVar] = {
              light: strip(modes.light) ?? next[cssVar].light,
              dark: strip(modes.dark) ?? next[cssVar].dark,
            };
          }
          return next;
        });
      }
    } catch (err) {
      console.warn('Failed to load theme from localStorage:', err);
    }
  }, []);

  // Save to localStorage on change (debounced)
  useEffect(() => {
    // Skip initial render before loading from storage
    if (!hasLoadedFromStorage.current) return;

    const timeoutId = setTimeout(() => {
      try {
        const modified = getModifiedProperties();
        const hasModifications =
          Object.keys(modified.light).length > 0 ||
          Object.keys(modified.dark).length > 0 ||
          shadowComponents.length > 0;

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
          timestamp: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (err) {
        console.warn('Failed to save theme to localStorage:', err);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [values, editMode, previewMode, shadowComponents, getModifiedProperties]);

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
      setProperty,
      setEditMode,
      setPreviewMode,
      setShadowComponents,
      resetAll,
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
      setProperty,
      resetAll,
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
