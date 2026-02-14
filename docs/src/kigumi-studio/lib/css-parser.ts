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
