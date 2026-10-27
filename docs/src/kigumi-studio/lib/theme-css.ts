// The Theme CSS dialog's text: the whole custom theme as the CSS a project
// gets, theme.css first, then overrides.css (ADR 0009). Studio writes it from
// the custom theme and reads the user's edits to it back.
import { generateThemeCSS, modifiedProperties } from './css-generator';
import { parseComponentOverrides, parseThemeCSS } from './css-parser';
import { validateCustomCSS } from './custom-css';
import { DEFAULT_VALUES, type ThemeValue } from './defaults';
import { NO_LOCKS, THEME_MODES, type LockedValues } from './locks';
import { PROPERTIES_BY_VAR } from './property-definitions';

/** The custom theme as Studio holds it. */
export interface CustomThemeState {
  values: Record<string, ThemeValue>;
  shadowComponents: string[];
  customCSS: string | null;
}

const THEME_HEADER = `/* theme.css
   The custom theme's values: :root for light mode, .wa-dark for dark mode,
   and the components that get a shadow. Studio writes this part from the
   values, so comments in it are not kept. */`;

const OVERRIDES_HEADER = `/* overrides.css
   Custom CSS, for what the values cannot express. A project loads it after
   theme.css, so its rules win. */`;

/** The two files a project gets; `overrides` is empty without custom CSS. */
export function themeFiles(theme: CustomThemeState): {
  theme: string;
  overrides: string;
} {
  const { light, dark } = modifiedProperties(theme.values);
  const css = theme.customCSS?.trim();
  return {
    theme: generateThemeCSS(light, dark, {
      shadowComponents: theme.shadowComponents,
    }),
    overrides: css ? `${css}\n` : '',
  };
}

const NO_THEME_CHANGES = '/* No changes from the default theme yet. */';
const NO_CUSTOM_CSS = '/* No custom CSS yet. */';

/** The comments Studio writes into the text; they never become custom CSS. */
const STUDIO_COMMENTS = [
  THEME_HEADER,
  OVERRIDES_HEADER,
  NO_THEME_CHANGES,
  NO_CUSTOM_CSS,
  '/* Component Shadows */',
];

/** Both files in one text, each under a header that says what it is. */
export function themeText(theme: CustomThemeState): string {
  const files = themeFiles(theme);
  return (
    [
      THEME_HEADER,
      files.theme.trim() || NO_THEME_CHANGES,
      OVERRIDES_HEADER,
      files.overrides.trim() || NO_CUSTOM_CSS,
    ].join('\n\n') + '\n'
  );
}

/** The files the dialog downloads, each never empty: a file says when it has nothing. */
export function themeDownloads(
  theme: CustomThemeState
): Array<{ name: 'theme.css' | 'overrides.css'; content: string }> {
  const files = themeFiles(theme);
  return [
    { name: 'theme.css', content: files.theme || `${NO_THEME_CHANGES}\n` },
    {
      name: 'overrides.css',
      content: files.overrides || `${NO_CUSTOM_CSS}\n`,
    },
  ];
}

type ImportedValues = Record<string, { light?: string; dark?: string }>;

/**
 * A value as Studio stores it: without the unit the export appends ("75ms"
 * is stored as "75"), and a mode-independent value named only for light
 * copied to dark.
 */
function storedValue(
  cssVar: string,
  modes: { light?: string; dark?: string }
): { light?: string; dark?: string } {
  const prop = PROPERTIES_BY_VAR.get(cssVar);
  const suffix = prop?.unit;
  const strip = (v: string | undefined): string | undefined => {
    if (!v || !suffix) return v;
    return v.endsWith(suffix) ? v.slice(0, -suffix.length) : v;
  };
  const light = strip(modes.light);
  const dark = strip(modes.dark);
  return {
    light,
    dark: !prop?.modeDependent && light && !dark ? light : dark,
  };
}

/** `values` with `imported` on top, each stored as Studio stores values. */
export function withImportedValues(
  values: Record<string, ThemeValue>,
  imported: ImportedValues
): Record<string, ThemeValue> {
  const next = { ...values };
  for (const [cssVar, modes] of Object.entries(imported)) {
    if (!next[cssVar]) continue;
    const stored = storedValue(cssVar, modes);
    next[cssVar] = {
      light: stored.light ?? next[cssVar].light,
      dark: stored.dark ?? next[cssVar].dark,
    };
  }
  return next;
}

interface ReadTheme {
  values: ImportedValues;
  shadowComponents: string[];
  customCSS: string;
  warnings: string[];
  errors: string[];
}

/** What a Theme CSS text holds, each rule placed by what it is. */
function readThemeText(text: string): ReadTheme {
  const errors = validateCustomCSS(text);
  if (errors.length > 0) {
    return {
      values: {},
      shadowComponents: [],
      customCSS: '',
      warnings: [],
      errors,
    };
  }
  const parsed = parseThemeCSS(text);
  const overrides = parseComponentOverrides(text, {
    ignoreComments: STUDIO_COMMENTS,
  });
  const values: ImportedValues = {};
  for (const cssVar of new Set([
    ...Object.keys(parsed.light),
    ...Object.keys(parsed.dark),
  ])) {
    values[cssVar] = storedValue(cssVar, {
      light: parsed.light[cssVar],
      dark: parsed.dark[cssVar],
    });
  }
  return {
    values,
    shadowComponents: overrides.shadowComponents,
    customCSS: overrides.customCSS.trim(),
    warnings: parsed.warnings,
    errors: [],
  };
}

/** What a save changes: the user's edits from `before` to `after`. */
export interface ThemeEdits {
  errors: string[];
  warnings: string[];
  /** Values to set; one the text no longer names goes back to its default. */
  values: ImportedValues;
  shadowComponents?: string[];
  customCSS?: string | null;
}

/**
 * The edits the user made to the Theme CSS text, from the text the dialog
 * showed (`before`) to the text at a save (`after`). Only what changed is
 * applied, so the unchanged text changes nothing, and a change elsewhere
 * since the dialog opened (a Theme Agent answer) is not overwritten. A
 * `locked` value, shadow list or custom CSS keeps what it has, with a
 * warning (ADR 0010: what the user locked cannot drift by an edit).
 */
export function themeEdits(
  before: string,
  after: string,
  locked: LockedValues = NO_LOCKS
): ThemeEdits {
  const was = readThemeText(before);
  const now = readThemeText(after);
  if (now.errors.length > 0) {
    return { errors: now.errors, warnings: [], values: {} };
  }
  const values: ImportedValues = {};
  for (const cssVar of new Set([
    ...Object.keys(was.values),
    ...Object.keys(now.values),
  ])) {
    for (const mode of THEME_MODES) {
      const before = was.values[cssVar]?.[mode];
      const after = now.values[cssVar]?.[mode];
      if (before === after) continue;
      values[cssVar] = {
        ...values[cssVar],
        [mode]: after ?? DEFAULT_VALUES[cssVar]?.[mode],
      };
    }
    // A mode-independent value edited in :root holds for dark too, as the
    // sidebar and every import treat it; one named only under .wa-dark stays
    // dark-only, as presets set some.
    const edited = values[cssVar];
    if (
      edited?.light !== undefined &&
      PROPERTIES_BY_VAR.get(cssVar)?.modeDependent === false
    ) {
      values[cssVar] = { light: edited.light, dark: edited.light };
    }
  }
  const warnings = now.warnings.filter((w) => !was.warnings.includes(w));
  for (const [cssVar, modes] of Object.entries(values)) {
    const lockedModes = THEME_MODES.filter(
      (mode) => modes[mode] !== undefined && locked[mode].includes(cssVar)
    );
    if (lockedModes.length === 0) continue;
    for (const mode of lockedModes) delete modes[mode];
    if (modes.light === undefined && modes.dark === undefined) {
      delete values[cssVar];
    }
    const prop = PROPERTIES_BY_VAR.get(cssVar);
    const label = prop?.label ?? cssVar;
    const which =
      prop?.modeDependent === false || lockedModes.length > 1
        ? label
        : `${label} (${lockedModes[0]})`;
    warnings.push(`${which} is locked and keeps its value.`);
  }
  const edits: ThemeEdits = { errors: [], warnings, values };
  if (was.shadowComponents.join() !== now.shadowComponents.join()) {
    if (locked.shadowComponents) {
      warnings.push('The shadow components are locked and keep their list.');
    } else {
      edits.shadowComponents = now.shadowComponents;
    }
  }
  if (was.customCSS !== now.customCSS) {
    if (locked.customCSS) {
      warnings.push('The custom CSS is locked and keeps its rules.');
    } else {
      edits.customCSS = now.customCSS || null;
    }
  }
  return edits;
}
