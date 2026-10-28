import { AVAILABLE_FONTS } from './font-definitions';
import {
  generateBrandPalette,
  generateBrandVariables,
  generateSemanticVariables,
  generateSurfaceVariables,
  generateTextVariables,
  type SemanticColorGroup,
} from './color-utils';
import {
  BRAND,
  BRAND_FILL,
  derivedBrandFill,
  userBrandFill,
} from './brand-fill';
import { DEFAULT_VALUES, type ThemeValue } from './defaults';
import { PROPERTY_DEFINITIONS } from './property-definitions';
import { findShadowComponent, shadowSelector } from './shadow-components';

const SEMANTIC_GROUPS: SemanticColorGroup[] = [
  'success',
  'warning',
  'danger',
  'neutral',
];

export interface GenerateOptions {
  shadowComponents?: string[];
}

function formatBlock(
  selector: string,
  properties: Record<string, string>
): string {
  const entries = Object.entries(properties);
  if (entries.length === 0) return '';

  const lines = entries.map(([key, value]) => `  ${key}: ${value};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}

/**
 * The shadow rules for the components that get a shadow, one per component
 * on the element that draws it (`shadowSelector`); a name not in the list
 * gets none. The export writes them and the preview applies them, scoped.
 */
export function formatShadowRules(classNames: string[]): string {
  const rules = classNames
    .map(findShadowComponent)
    .filter((comp) => comp !== undefined)
    .map(
      (comp) =>
        `${shadowSelector(comp)} {\n  box-shadow: var(--wa-shadow-m);\n}`
    )
    .join('\n\n');
  if (!rules) return '';

  return `/* Component Shadows */\n${rules}`;
}

/**
 * Convert hex color to rgb() format with opacity.
 */
function hexToRgb(hex: string, opacity: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgb(0 0 0 / ${opacity})`;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgb(${r} ${g} ${b} / ${opacity})`;
}

/**
 * Extract Bunny Fonts import URLs from font family values.
 * Looks at --wa-font-family-* properties and finds matching Bunny URLs.
 */
function extractFontImports(
  lightProperties: Record<string, string>,
  darkProperties: Record<string, string>
): string[] {
  const imports = new Set<string>();

  const fontVars = [
    '--wa-font-family-body',
    '--wa-font-family-heading',
    '--wa-font-family-code',
    '--wa-font-family-longform',
  ];

  fontVars.forEach((cssVar) => {
    const lightValue = lightProperties[cssVar];
    const darkValue = darkProperties[cssVar];

    [lightValue, darkValue].forEach((value) => {
      if (!value) return;
      const font = AVAILABLE_FONTS.find((f) => f.value === value);
      if (font?.bunnyUrl) {
        imports.add(font.bunnyUrl);
      }
    });
  });

  return Array.from(imports);
}

/**
 * Process properties to combine shadow color + opacity.
 * Web Awesome expects --wa-color-shadow as rgb(r g b / opacity).
 */
function processShadowProperties(
  properties: Record<string, string>
): Record<string, string> {
  const processed = { ...properties };

  if (processed['--wa-color-shadow'] && processed['--wa-shadow-opacity']) {
    const colorHex = processed['--wa-color-shadow'];
    const opacity = parseFloat(processed['--wa-shadow-opacity']);
    processed['--wa-color-shadow'] = hexToRgb(colorHex, opacity);
    delete processed['--wa-shadow-opacity'];
  }

  return processed;
}

/**
 * Sort CSS properties for readable output.
 * Order: base colors -> palette steps -> semantic vars -> focus -> surfaces -> text -> other.
 */
function sortProperties(
  properties: Record<string, string>
): Record<string, string> {
  const orderKey = (key: string): number => {
    // Base color declarations
    if (/^--wa-color-(brand|success|warning|danger|neutral)$/.test(key))
      return 0;
    // Palette steps (e.g. --wa-color-brand-50)
    if (/^--wa-color-[\w]+-\d{2}$/.test(key)) return 1;
    // Semantic color variants (fill, border, on)
    if (/^--wa-color-[\w]+-(fill|border|on)-/.test(key)) return 2;
    // "on" shorthand (e.g. --wa-color-brand-on)
    if (/^--wa-color-[\w]+-on$/.test(key)) return 3;
    // Focus
    if (key === '--wa-color-focus') return 4;
    // Surfaces
    if (key.startsWith('--wa-color-surface-')) return 5;
    // Text
    if (key.startsWith('--wa-color-text-')) return 6;
    // Shadows
    if (key.includes('shadow')) return 7;
    // Form controls
    if (key.startsWith('--wa-form-control-')) return 8;
    // Typography
    if (key.startsWith('--wa-font-')) return 9;
    if (key.startsWith('--wa-line-height-')) return 9;
    // Spacing
    if (key.startsWith('--wa-space-')) return 10;
    // Borders
    if (key.startsWith('--wa-border-')) return 11;
    // Everything else
    return 20;
  };

  const entries = Object.entries(properties);
  entries.sort((a, b) => {
    const oa = orderKey(a[0]);
    const ob = orderKey(b[0]);
    if (oa !== ob) return oa - ob;
    return a[0].localeCompare(b[0]);
  });

  const sorted: Record<string, string> = {};
  for (const [key, val] of entries) {
    sorted[key] = val;
  }
  return sorted;
}

/**
 * Generate a project's theme.css from modified light and dark properties.
 * Only includes properties that differ from defaults. Custom CSS goes into
 * overrides.css, never here (ADR 0009; see `themeFiles`).
 *
 * Output order:
 * 1. Font imports
 * 2. :root {} (light mode tokens)
 * 3. .wa-dark {} (dark mode tokens)
 * 4. Shadow component rules
 */
export function generateThemeCSS(
  light: Record<string, string>,
  dark: Record<string, string>,
  options: GenerateOptions = {}
): string {
  const { shadowComponents = [] } = options;

  const fontImports = extractFontImports(light, dark);
  const processedLight = sortProperties(processShadowProperties(light));
  const processedDark = sortProperties(processShadowProperties(dark));

  const rootBlock = formatBlock(':root', processedLight);
  const darkBlock = formatBlock('.wa-dark', processedDark);
  const shadowBlock = formatShadowRules(shadowComponents);

  if (!rootBlock && !darkBlock && !shadowBlock && fontImports.length === 0) {
    return '';
  }

  const parts: string[] = [];

  // 1. Font Imports (FIRST - must be at top of CSS)
  if (fontImports.length > 0) {
    const importStatements = fontImports
      .map((url) => `@import url('${url}');`)
      .join('\n');
    parts.push(importStatements);
  }

  // 2. :root Block
  if (rootBlock) {
    parts.push(rootBlock);
  }

  // 3. .wa-dark Block
  if (darkBlock) {
    parts.push(darkBlock);
  }

  // 4. Shadow Component Rules
  if (shadowBlock) {
    parts.push(shadowBlock);
  }

  return parts.filter((part) => part.trim()).join('\n\n') + '\n';
}

/**
 * The values the export writes, per mode: every Studio value that differs
 * from its default, with unit, and what Studio derives from the colour
 * groups (palettes, semantic variables, surfaces and text from neutral). A
 * brand fill the user set replaces the derived one in its mode.
 */
export function modifiedProperties(values: Record<string, ThemeValue>): {
  light: Record<string, string>;
  dark: Record<string, string>;
} {
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};

  // 1. Collect explicitly modified base properties, each against what a
  // project paints without its line: Web Awesome's default where Studio's
  // differs from it, so Studio's own is written too.
  for (const prop of PROPERTY_DEFINITIONS) {
    const current = values[prop.cssVar];
    const defaults = DEFAULT_VALUES[prop.cssVar];
    if (!current || !defaults) continue;

    const suffix = prop.unit ?? '';
    const withoutLine = { ...defaults, ...prop.webAwesomeDefault };
    if (current.light !== withoutLine.light) {
      light[prop.cssVar] = `${current.light}${suffix}`;
    }
    if (current.dark !== withoutLine.dark) {
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

  // Brand, then the semantic groups: one generator per group
  const colorGroups: Array<{
    cssVar: string;
    variables: (
      baseHex: string,
      mode: 'light' | 'dark'
    ) => Record<string, string>;
  }> = [
    { cssVar: BRAND, variables: generateBrandVariables },
    ...SEMANTIC_GROUPS.map((group) => ({
      cssVar: `--wa-color-${group}`,
      variables: (baseHex: string, mode: 'light' | 'dark') =>
        generateSemanticVariables(baseHex, group, mode),
    })),
  ];

  for (const { cssVar, variables } of colorGroups) {
    if (!isBaseModified(cssVar)) continue;

    const baseHex = getEffectiveHex(cssVar);
    // Ensure the base color appears in :root even if only dark was edited
    if (!light[cssVar]) {
      light[cssVar] = baseHex;
    }
    for (const [key, val] of Object.entries(variables(baseHex, 'light'))) {
      if (key === cssVar) continue;
      if (key === BRAND_FILL && userBrandFill(values, 'light')) continue;
      light[key] = val;
    }
    // Dark: skip palette steps (already in light/root), only add semantic vars
    for (const [key, val] of Object.entries(variables(baseHex, 'dark'))) {
      if (key === cssVar) continue;
      if (paletteStepRegex.test(key)) continue;
      if (key === BRAND_FILL && userBrandFill(values, 'dark')) continue;
      dark[key] = val;
    }
  }

  // A brand fill set in one mode only: the other mode gets the derived one,
  // or a project's :root fill would paint dark mode too.
  if (!isBaseModified(BRAND) && (BRAND_FILL in light || BRAND_FILL in dark)) {
    const brandHex = values[BRAND].light;
    light[BRAND_FILL] ??= derivedBrandFill(brandHex, 'light');
    dark[BRAND_FILL] ??= derivedBrandFill(brandHex, 'dark');
  }

  // 3. Auto-derive surface/text from neutral (only for unmodified properties)
  const neutralModified = isBaseModified('--wa-color-neutral');
  const brandModified = isBaseModified(BRAND);

  if (neutralModified) {
    const neutralHex = values['--wa-color-neutral'].light;
    const brandHex = values[BRAND].light;

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
    const brandHex = values[BRAND].light;
    const brandPalette = generateBrandPalette(brandHex);

    const isLinkModified = isBaseModified('--wa-color-text-link');
    if (!isLinkModified) {
      light['--wa-color-text-link'] = brandPalette['40'];
      dark['--wa-color-text-link'] = brandPalette['70'];
    }
  }

  return { light, dark };
}
