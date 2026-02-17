import { PROPERTIES_BY_VAR } from './property-definitions';

export interface ParseResult {
  light: Record<string, string>;
  dark: Record<string, string>;
  warnings: string[];
}

/**
 * Extract CSS custom property declarations from a block body string.
 * Handles values with parentheses (oklch(), calc(), var(), etc.)
 */
function extractProperties(blockBody: string): Record<string, string> {
  const props: Record<string, string> = {};

  // Remove comments
  const cleaned = blockBody.replace(/\/\*[\s\S]*?\*\//g, '');

  // Match --property: value; patterns
  // Value can contain parentheses (oklch(), calc(), var(), color-mix(), etc.)
  const regex = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(cleaned)) !== null) {
    const varName = match[1].trim();
    const value = match[2].trim();
    props[varName] = value;
  }

  return props;
}

/**
 * Find the body content of a CSS rule block by its selector.
 * Handles nested parentheses but not nested blocks.
 */
function findBlockBody(css: string, selector: string): string | null {
  // Escape special regex characters in selector
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escaped}\\s*\\{`, 'g');
  const match = pattern.exec(css);

  if (!match) return null;

  const start = match.index + match[0].length;
  let depth = 1;
  let i = start;

  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    i++;
  }

  if (depth !== 0) return null;

  return css.slice(start, i - 1);
}

/**
 * Parse a CSS theme string containing :root {} and/or .wa-dark {} blocks.
 * Extracts --wa-* custom properties and maps them to known property definitions.
 */
export function parseThemeCSS(css: string): ParseResult {
  const warnings: string[] = [];
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};

  // Extract :root block
  const rootBody = findBlockBody(css, ':root');
  if (rootBody) {
    const rootProps = extractProperties(rootBody);
    for (const [varName, value] of Object.entries(rootProps)) {
      if (!varName.startsWith('--wa-')) continue;
      if (PROPERTIES_BY_VAR.has(varName)) {
        light[varName] = value;
      } else {
        warnings.push(`Unknown property: ${varName}`);
      }
    }
  }

  // Extract .wa-dark block
  const darkBody = findBlockBody(css, '.wa-dark');
  if (darkBody) {
    const darkProps = extractProperties(darkBody);
    for (const [varName, value] of Object.entries(darkProps)) {
      if (!varName.startsWith('--wa-')) continue;
      if (PROPERTIES_BY_VAR.has(varName)) {
        dark[varName] = value;
      } else {
        warnings.push(`Unknown property: ${varName}`);
      }
    }
  }

  return { light, dark, warnings };
}

/**
 * Remove a top-level block (e.g. :root or .wa-dark) from CSS.
 */
function removeBlock(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escaped}\\s*\\{`);
  const match = pattern.exec(css);
  if (!match) return css;

  const bodyStart = match.index + match[0].length;
  let depth = 1;
  let i = bodyStart;
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    i++;
  }
  const end = i;
  return css.slice(0, match.index) + css.slice(end);
}

/**
 * Extract component override rules from preset CSS (all blocks except :root and .wa-dark).
 * Each selector is prefixed with scopeSelector so overrides only apply within the preview.
 */
export function extractComponentOverrides(
  css: string,
  scopeSelector: string
): string {
  let remaining = removeBlock(css, ':root');
  remaining = removeBlock(remaining, '.wa-dark');

  const result: string[] = [];
  const blockRegex = /([^{}\s][^{]*?)\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(remaining)) !== null) {
    const selector = match[1].trim();
    if (selector.startsWith('@')) continue;

    const start = match.index + match[0].length;
    let depth = 1;
    let i = start;
    while (i < remaining.length && depth > 0) {
      if (remaining[i] === '{') depth++;
      else if (remaining[i] === '}') depth--;
      i++;
    }
    const body = remaining.slice(start, i - 1);

    const scopedSelectors = selector
      .split(',')
      .map((s) => `${scopeSelector} ${s.trim()}`)
      .join(', ');
    result.push(`${scopedSelectors} {\n${body}\n}`);
  }

  return result.length > 0 ? result.join('\n\n') : '';
}

interface ParsedOverrides {
  shadowComponents: string[];
  customCSS: string;
}

/**
 * Parse component overrides from imported CSS into shadow components and custom CSS.
 *
 * Shadow rules are simple `.ClassName { box-shadow: var(--wa-shadow-*); }` blocks
 * that map to the shadowComponents system. Everything else is treated as custom CSS
 * and scoped with scopeSelector for the preview.
 */
export function parseComponentOverrides(
  css: string,
  scopeSelector: string
): ParsedOverrides {
  let remaining = removeBlock(css, ':root');
  remaining = removeBlock(remaining, '.wa-dark');

  // Remove @import and comments at top level
  remaining = remaining.replace(/@import\s+url\([^)]*\)\s*;/g, '');
  remaining = remaining.replace(/\/\*[\s\S]*?\*\//g, '');

  const shadowComponents: string[] = [];
  const customRules: string[] = [];

  const blockRegex = /([^{}\s][^{]*?)\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(remaining)) !== null) {
    const selector = match[1].trim();
    if (selector.startsWith('@')) continue;

    const start = match.index + match[0].length;
    let depth = 1;
    let i = start;
    while (i < remaining.length && depth > 0) {
      if (remaining[i] === '{') depth++;
      else if (remaining[i] === '}') depth--;
      i++;
    }
    // Advance regex past the closing brace so next exec() starts after this block
    blockRegex.lastIndex = i;

    const body = remaining.slice(start, i - 1).trim();

    // Detect simple shadow-adding rules: .ClassName { box-shadow: var(--wa-shadow-*); }
    // These are single-selector, single-property rules that add a shadow via WA tokens.
    const isSingleClassSelector = /^\.[A-Z][\w-]*$/.test(selector);
    const isShadowOnly =
      /^\s*box-shadow\s*:\s*var\(--wa-shadow-[\w-]+\)\s*;?\s*$/.test(body);

    if (isSingleClassSelector && isShadowOnly) {
      // Extract class name without the leading dot
      shadowComponents.push(selector.slice(1));
    } else {
      const scopedSelectors = selector
        .split(',')
        .map((s) => `${scopeSelector} ${s.trim()}`)
        .join(', ');
      customRules.push(`${scopedSelectors} {\n  ${body}\n}`);
    }
  }

  return {
    shadowComponents,
    customCSS: customRules.length > 0 ? customRules.join('\n\n') : '',
  };
}
