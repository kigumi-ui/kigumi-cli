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
  generateBrandPalette,
  generateBrandVariables,
  generateSemanticVariables,
  generateSurfaceVariables,
  generateTextVariables,
  type SemanticColorGroup,
} from '../lib/color-utils';

const STORAGE_KEY = 'kigumi-studio-state';
const STORAGE_VERSION = '2.0';

interface PersistedState {
  version: string;
  editMode: ThemeMode;
  previewMode: ThemeMode;
  modifiedProperties: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  shadowComponents: string[];
  customCSS: string | null;
  selectedPreset: string | null;
  timestamp: number;
}

type ThemeMode = 'light' | 'dark';

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

function loadPersistedState(): PersistedState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PersistedState;
    if (parsed.version !== STORAGE_VERSION) return null;
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

  const imported: Record<string, { light?: string; dark?: string }> = {};
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
  const [customCSS, setCustomCSS] = useState<string | null>(
    () => getPersistedOnce()?.customCSS ?? null
  );
  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    () => getPersistedOnce()?.selectedPreset ?? null
  );
  const isFirstRender = useRef(true);

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
    setCustomCSS(null);
    setSelectedPreset(null);
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
          const strippedLight = strip(modes.light);
          const strippedDark = strip(modes.dark);

          // For mode-independent tokens: if only light value is provided,
          // use it for dark too (structural tokens should be identical in both modes)
          const effectiveDark =
            !prop?.modeDependent && strippedLight && !strippedDark
              ? strippedLight
              : strippedDark;

          next[cssVar] = {
            light: strippedLight ?? next[cssVar].light,
            dark: effectiveDark ?? next[cssVar].dark,
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

      // Auto-derive surface colors from neutral palette and text colors from neutral+brand.
      // Only inject if user hasn't manually set them (compare against defaults).
      const neutralValue = style['--wa-color-neutral'];
      if (neutralValue) {
        const surfaceVars = generateSurfaceVariables(neutralValue, mode);
        for (const [key, val] of Object.entries(surfaceVars)) {
          const current = values[key];
          const defaults = DEFAULT_VALUES[key];
          const isUserModified =
            current && defaults && current[mode] !== defaults[mode];
          if (!isUserModified) {
            style[key] = val;
          }
        }

        const textVars = generateTextVariables(
          neutralValue,
          brandValue ?? style['--wa-color-brand'],
          mode
        );
        for (const [key, val] of Object.entries(textVars)) {
          const current = values[key];
          const defaults = DEFAULT_VALUES[key];
          const isUserModified =
            current && defaults && current[mode] !== defaults[mode];
          if (!isUserModified) {
            style[key] = val;
          }
        }
      }

      // Post-processing: combine shadow color + opacity into a single value.
      // WA expects --wa-color-shadow as a full color (e.g. rgb(0 0 0 / 0.2)),
      // not a bare hex. --wa-shadow-opacity is a Studio abstraction, not a real WA var.
      const shadowHex = style['--wa-color-shadow'];
      const shadowOpacity = style['--wa-shadow-opacity'];
      if (shadowHex && shadowOpacity) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
          shadowHex
        );
        if (result) {
          const r = parseInt(result[1], 16);
          const g = parseInt(result[2], 16);
          const b = parseInt(result[3], 16);
          style['--wa-color-shadow'] = `rgb(${r} ${g} ${b} / ${shadowOpacity})`;
        }
        delete style['--wa-shadow-opacity'];
      }

      // Neutralize WA built-in shadows — shadows are opt-in via shadowComponents only.
      // Components like Card have box-shadow: var(--wa-shadow-m) in their Shadow DOM.
      // Setting these to 'none' disables all native shadows; the shadowComponents system
      // uses filter: drop-shadow() independently and is NOT affected.
      style['--wa-shadow-s'] = 'none';
      style['--wa-shadow-m'] = 'none';
      style['--wa-shadow-l'] = 'none';
      style['--wa-shadow-xl'] = 'none';

      return style;
    },
    [values]
  );

  const getModifiedProperties = useCallback(() => {
    const light: Record<string, string> = {};
    const dark: Record<string, string> = {};

    // 1. Collect explicitly modified base properties
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

    // 2. For each modified color group, generate derived palette + semantic vars
    const isBaseModified = (cssVar: string): boolean => {
      const current = values[cssVar];
      const defaults = DEFAULT_VALUES[cssVar];
      if (!current || !defaults) return false;
      return current.light !== defaults.light || current.dark !== defaults.dark;
    };

    // For mode-independent properties (like brand), editing in one mode may leave
    // the other at default. Use the modified value regardless of which mode it's in.
    const getEffectiveHex = (cssVar: string): string => {
      const current = values[cssVar];
      const defaults = DEFAULT_VALUES[cssVar];
      if (!current || !defaults) return current?.light ?? '';
      if (current.light !== defaults.light) return current.light;
      if (current.dark !== defaults.dark) return current.dark;
      return current.light;
    };

    const paletteStepRegex = /--wa-color-[\w]+-\d{2}$/;

    // Brand
    if (isBaseModified('--wa-color-brand')) {
      const baseHex = getEffectiveHex('--wa-color-brand');
      // Ensure the base color appears in :root even if only dark was edited
      if (!light['--wa-color-brand']) {
        light['--wa-color-brand'] = baseHex;
      }
      const lightVars = generateBrandVariables(baseHex, 'light');
      const darkVars = generateBrandVariables(baseHex, 'dark');

      for (const [key, val] of Object.entries(lightVars)) {
        if (key === '--wa-color-brand') continue;
        light[key] = val;
      }
      // Dark: skip palette steps (already in light/root), only add semantic vars
      for (const [key, val] of Object.entries(darkVars)) {
        if (key === '--wa-color-brand') continue;
        if (paletteStepRegex.test(key)) continue;
        dark[key] = val;
      }
    }

    // Semantic groups (success, warning, danger, neutral)
    const semanticGroups: SemanticColorGroup[] = [
      'success',
      'warning',
      'danger',
      'neutral',
    ];
    for (const group of semanticGroups) {
      const cssVar = `--wa-color-${group}`;
      if (!isBaseModified(cssVar)) continue;

      const baseHex = getEffectiveHex(cssVar);
      if (!light[cssVar]) {
        light[cssVar] = baseHex;
      }
      const lightVars = generateSemanticVariables(baseHex, group, 'light');
      const darkVars = generateSemanticVariables(baseHex, group, 'dark');

      for (const [key, val] of Object.entries(lightVars)) {
        if (key === cssVar) continue;
        light[key] = val;
      }
      for (const [key, val] of Object.entries(darkVars)) {
        if (key === cssVar) continue;
        if (paletteStepRegex.test(key)) continue;
        dark[key] = val;
      }
    }

    // 3. Auto-derive surface/text from neutral (only for unmodified properties)
    const neutralModified = isBaseModified('--wa-color-neutral');
    const brandModified = isBaseModified('--wa-color-brand');

    if (neutralModified) {
      const neutralHex = values['--wa-color-neutral'].light;
      const brandHex = values['--wa-color-brand'].light;

      const surfaceLight = generateSurfaceVariables(neutralHex, 'light');
      const surfaceDark = generateSurfaceVariables(neutralHex, 'dark');
      const textLight = generateTextVariables(neutralHex, brandHex, 'light');
      const textDark = generateTextVariables(neutralHex, brandHex, 'dark');

      for (const [key, val] of Object.entries({
        ...surfaceLight,
        ...textLight,
      })) {
        if (!light[key]) light[key] = val;
      }
      for (const [key, val] of Object.entries({
        ...surfaceDark,
        ...textDark,
      })) {
        if (!dark[key]) dark[key] = val;
      }
    } else if (brandModified) {
      // Only brand changed: auto-derive text-link and focus from brand palette
      const brandHex = values['--wa-color-brand'].light;
      const brandPalette = generateBrandPalette(brandHex);

      const isLinkModified = isBaseModified('--wa-color-text-link');
      if (!isLinkModified) {
        light['--wa-color-text-link'] = brandPalette['40'];
        dark['--wa-color-text-link'] = brandPalette['70'];
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

  // Save to localStorage on change (debounced)
  useEffect(() => {
    // Skip the first render — state already matches localStorage
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      try {
        const modified = getModifiedProperties();
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
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [
    values,
    editMode,
    previewMode,
    shadowComponents,
    customCSS,
    selectedPreset,
    getModifiedProperties,
  ]);

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
      setProperty,
      setEditMode,
      setPreviewMode,
      setShadowComponents,
      setCustomCSS,
      setSelectedPreset,
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
      customCSS,
      selectedPreset,
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
