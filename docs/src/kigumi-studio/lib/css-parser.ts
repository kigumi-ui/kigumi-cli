import { splitStylesheet } from './custom-css';
import { PROPERTIES_BY_VAR } from './property-definitions';
import { shadowComponent, shadowSelector } from './shadow-components';

export interface ParseResult {
  light: Record<string, string>;
  dark: Record<string, string>;
  warnings: string[];
}

/**
 * Check if a CSS variable is a derived color variable that gets auto-generated
 * from a base color (e.g. --wa-color-brand-50, --wa-color-brand-fill-loud).
 * These are silently skipped during import since they'll be regenerated from the base color.
 */
const DERIVED_COLOR_PATTERN =
  /^--wa-color-(brand|success|warning|danger|neutral)-(0[5]|[1-9]0|95|fill-(?:quiet|normal|loud)|border-(?:quiet|normal|loud)|on-(?:quiet|normal|loud)|on)$/;

function isDerivedColorVar(varName: string): boolean {
  if (varName === '--wa-color-focus') return true;
  return DERIVED_COLOR_PATTERN.test(varName);
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
 * Parse a CSS theme string containing :root {} and/or .wa-dark {} blocks,
 * as many as it has. Extracts --wa-* custom properties and maps them to
 * known property definitions.
 */
export function parseThemeCSS(css: string): ParseResult {
  const warnings: string[] = [];
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};
  const modes = { ':root': light, '.wa-dark': dark } as const;

  // Every :root and .wa-dark block, wherever it stands; a later one wins.
  for (const node of splitStylesheet(css)) {
    if (node.kind !== 'rule') continue;
    if (node.selector !== ':root' && node.selector !== '.wa-dark') continue;
    const target = modes[node.selector];
    for (const [varName, value] of Object.entries(
      extractProperties(node.body)
    )) {
      if (!varName.startsWith('--wa-')) continue;
      if (PROPERTIES_BY_VAR.has(varName)) {
        target[varName] = value;
      } else if (isDerivedColorVar(varName)) {
        // Silently skip derived vars -- they'll be regenerated from the base color
      } else {
        warnings.push(`Unknown property: ${varName}`);
      }
    }
  }

  splitShadowColor(light);
  splitShadowColor(dark);
  return { light, dark, warnings };
}

/**
 * The export writes the shadow colour and opacity as one value,
 * `rgb(r g b / a)` (`processShadowProperties`); Studio keeps them apart, a
 * hex colour and an opacity. Undo that, unless the opacity is named too.
 */
function splitShadowColor(props: Record<string, string>): void {
  const color = props['--wa-color-shadow'];
  if (!color || props['--wa-shadow-opacity'] !== undefined) return;
  const match =
    /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*[/,]\s*([\d.]+)\s*\)$/i.exec(
      color
    );
  if (!match) return;
  const hex = match
    .slice(1, 4)
    .map((channel) => Number(channel).toString(16).padStart(2, '0'))
    .join('');
  props['--wa-color-shadow'] = `#${hex}`;
  props['--wa-shadow-opacity'] = match[4];
}

/**
 * The shadow component a shadow rule's selector stands for: the selector
 * the export writes for it (`shadowSelector`), or the bare class an older
 * export wrote for every component, so importing it upgrades the rule.
 */
function shadowComponentOf(selector: string): string | undefined {
  const host = /^\.([A-Z][\w-]*)/.exec(selector);
  const comp = host ? shadowComponent(host[1]) : undefined;
  if (!comp) return undefined;
  const matches =
    selector === shadowSelector(comp) || selector === `.${comp.className}`;
  return matches ? comp.className : undefined;
}

interface ParsedOverrides {
  shadowComponents: string[];
  customCSS: string;
}

/**
 * Parse component overrides from imported CSS into shadow components and
 * custom CSS. The `:root` and `.wa-dark` blocks are the values (see
 * `parseThemeCSS`) and `@import` lines the fonts, which the export writes
 * again from the values.
 *
 * Shadow rules are single `box-shadow: var(--wa-shadow-*)` blocks on the
 * selector the export writes for a shadow component (`.Card`,
 * `.Button::part(base)`), or on its bare class as older exports wrote it;
 * they map to the shadowComponents system. Everything else, at-rule
 * blocks included, is custom CSS, kept as written with the comments before
 * each rule, and unscoped: the preview scopes it (`scopeCustomCSS`).
 * `ignoreComments` are comments Studio writes itself, never custom CSS.
 */
export function parseComponentOverrides(
  css: string,
  { ignoreComments = [] }: { ignoreComments?: string[] } = {}
): ParsedOverrides {
  const shadowComponents: string[] = [];
  const customRules: string[] = [];
  // A rule's comments go with it, except the ones Studio writes itself.
  const withComments = (comments: string[], text: string) =>
    [...comments.filter((c) => !ignoreComments.includes(c)), text]
      .filter(Boolean)
      .join('\n');

  for (const node of splitStylesheet(css)) {
    if (node.kind === 'comment') {
      const text = withComments(node.comments, '');
      if (text) customRules.push(text);
      continue;
    }
    if (node.kind === 'statement') {
      if (!/^@import\b/i.test(node.text)) {
        customRules.push(withComments(node.comments, node.text));
      }
      continue;
    }
    if (node.kind === 'at-rule') {
      customRules.push(
        withComments(node.comments, `${node.prelude} {${node.body}}`)
      );
      continue;
    }
    if (node.selector === ':root' || node.selector === '.wa-dark') continue;

    const body = node.body.trim();
    const isShadowOnly =
      /^\s*box-shadow\s*:\s*var\(--wa-shadow-[\w-]+\)\s*;?\s*$/.test(body);
    const shadowComponent = isShadowOnly
      ? shadowComponentOf(node.selector)
      : undefined;

    if (shadowComponent) {
      shadowComponents.push(shadowComponent);
    } else {
      customRules.push(
        withComments(node.comments, `${node.selector} {\n  ${body}\n}`)
      );
    }
  }

  return {
    shadowComponents,
    customCSS: customRules.join('\n\n'),
  };
}
