import { AVAILABLE_FONTS } from './font-definitions';

export interface GenerateOptions {
  shadowComponents?: string[];
  customCSS?: string | null;
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
 * Generate CSS rules for components that should receive box-shadow.
 */
function formatShadowRules(classNames: string[]): string {
  if (classNames.length === 0) return '';

  const rules = classNames
    .map((className) => `.${className} {\n  box-shadow: var(--wa-shadow-m);\n}`)
    .join('\n\n');

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
 * Remove the ".studio-preview " scope prefix from custom CSS selectors.
 * The scope is used for preview isolation but should not appear in exported CSS.
 */
function unscopeCSS(scopedCSS: string): string {
  return scopedCSS.replace(/\.studio-preview\s+/g, '');
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
 * Generate a CSS theme string from modified light and dark properties.
 * Only includes properties that differ from defaults.
 *
 * Output order:
 * 1. Font imports
 * 2. Header comment
 * 3. :root {} (light mode tokens)
 * 4. .wa-dark {} (dark mode tokens)
 * 5. Shadow component rules
 * 6. Custom CSS (from preset .css file)
 */
export function generateThemeCSS(
  light: Record<string, string>,
  dark: Record<string, string>,
  options: GenerateOptions = {}
): string {
  const { shadowComponents = [], customCSS = null } = options;

  const fontImports = extractFontImports(light, dark);
  const processedLight = sortProperties(processShadowProperties(light));
  const processedDark = sortProperties(processShadowProperties(dark));

  const rootBlock = formatBlock(':root', processedLight);
  const darkBlock = formatBlock('.wa-dark', processedDark);
  const shadowBlock = formatShadowRules(shadowComponents);

  // Unscope custom CSS for export (remove .studio-preview prefix)
  const unscopedCustomCSS = customCSS ? unscopeCSS(customCSS).trim() : '';

  if (
    !rootBlock &&
    !darkBlock &&
    !shadowBlock &&
    !unscopedCustomCSS &&
    fontImports.length === 0
  ) {
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

  // 5. Custom CSS (from preset .css file, unscoped)
  if (unscopedCustomCSS) {
    parts.push(`/* Custom Styles */\n${unscopedCustomCSS}`);
  }

  return parts.filter((part) => part.trim()).join('\n\n') + '\n';
}
