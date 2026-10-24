import { hexToRgb, oklchToSrgb, relativeLuminance } from '../lib/color-utils';
import { DEFAULT_VALUES, type ThemeValue } from '../lib/defaults';
import { buildPreviewStyle } from '../lib/preview-style';
import type { CustomTheme } from './custom-theme';

// Shared by the browser and the trigger.dev task (docs/trigger): the task
// sends violations back to the model to correct, the browser checks what it
// applies again and reports what is left. WCAG 2.1 AA, both modes.

type Mode = 'light' | 'dark';

interface ContrastPair {
  foreground: string;
  background: string;
  /** How the chat names the pair, e.g. "quiet text on the lowered surface". */
  label: string;
  minimum: number;
  /** The Studio value that sets a derived colour, when it is not the pair's own. */
  setBy?: string;
}

const TEXT = [
  ['--wa-color-text-normal', 'normal text'],
  ['--wa-color-text-quiet', 'quiet text'],
  ['--wa-color-text-link', 'link text'],
] as const;

const SURFACES = [
  ['--wa-color-surface-raised', 'raised'],
  ['--wa-color-surface-default', 'default'],
  ['--wa-color-surface-lowered', 'lowered'],
] as const;

/** The checked pairs, in the order violations are reported. */
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  // WCAG 1.4.3: body text on every surface.
  ...TEXT.flatMap(([foreground, text]) =>
    SURFACES.map(([background, surface]) => ({
      foreground,
      background,
      label: `${text} on the ${surface} surface`,
      minimum: 4.5,
    }))
  ),
  // WCAG 1.4.11: a form control's boundary.
  {
    foreground: '--wa-form-control-border-color',
    background: '--wa-form-control-background-color',
    label: 'form control border on its background',
    minimum: 3,
  },
  // What the preview paints for brand-filled controls: Studio derives the
  // fill from the brand colour, and its text is the on-colour.
  {
    foreground: '--wa-color-brand-on-loud',
    background: '--wa-color-brand-fill-loud',
    label: 'text on the brand fill',
    minimum: 4.5,
    setBy: '--wa-color-brand',
  },
];

export interface ContrastViolation {
  mode: Mode;
  foreground: string;
  background: string;
  label: string;
  /** The colours as the preview paints them. */
  foregroundColor: string;
  backgroundColor: string;
  /** `null` when a colour could not be resolved, which never passes. */
  ratio: number | null;
  minimum: number;
  setBy?: string;
}

interface Rgba {
  rgb: [number, number, number];
  alpha: number;
}

const NAMED: Record<string, Rgba> = {
  white: { rgb: [1, 1, 1], alpha: 1 },
  black: { rgb: [0, 0, 0], alpha: 1 },
};

/** A CSS number, a percentage of `percentOf`, or `none`. */
function component(token: string, percentOf: number): number {
  if (token === 'none') return 0;
  if (token.endsWith('%')) return (parseFloat(token) / 100) * percentOf;
  return parseFloat(token.replace(/deg$/, ''));
}

/** `(a b c / d)` or `(a, b, c, d)` into its channels and alpha. */
function functionArgs(body: string): { channels: string[]; alpha: string } {
  const [channelPart, alphaPart] = body.split('/');
  const tokens = channelPart
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
  if (alphaPart !== undefined) {
    return { channels: tokens, alpha: alphaPart.trim() };
  }
  return { channels: tokens.slice(0, 3), alpha: tokens[3] ?? '1' };
}

function parseColor(
  raw: string,
  style: Record<string, string>,
  depth = 0
): Rgba | null {
  const value = raw.trim().toLowerCase();
  if (NAMED[value]) return NAMED[value];

  const reference = /^var\(\s*(--[\w-]+)\s*\)$/.exec(value);
  if (reference) {
    const target = style[reference[1]];
    return target !== undefined && depth < 8
      ? parseColor(target, style, depth + 1)
      : null;
  }

  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(value);
  if (hex) {
    const digits =
      hex[1].length <= 4 ? [...hex[1]].map((d) => d + d).join('') : hex[1];
    const alpha =
      digits.length === 8 ? parseInt(digits.slice(6, 8), 16) / 255 : 1;
    return { rgb: hexToRgb(`#${digits.slice(0, 6)}`), alpha };
  }

  const fn = /^(rgba?|oklch)\((.*)\)$/.exec(value);
  if (!fn) return null;
  const { channels, alpha } = functionArgs(fn[2]);
  if (channels.length !== 3) return null;
  let rgb: [number, number, number];
  if (fn[1] === 'oklch') {
    const [l, c, h] = channels;
    rgb = oklchToSrgb(component(l, 1), component(c, 0.4), component(h, 1));
  } else {
    const [r, g, b] = channels.map((channel) => component(channel, 255) / 255);
    rgb = [r, g, b];
  }
  const result: Rgba = {
    // Out-of-gamut colours are clipped, as a browser shows them.
    rgb: rgb.map((channel) => Math.min(1, Math.max(0, channel))) as [
      number,
      number,
      number,
    ],
    alpha: Math.min(1, Math.max(0, component(alpha, 1))),
  };
  return result.rgb.every(Number.isFinite) && Number.isFinite(result.alpha)
    ? result
    : null;
}

function ratioOf(foreground: Rgba, background: Rgba): number | null {
  // A translucent background shows whatever lies under it.
  if (background.alpha < 1) return null;
  const a = foreground.alpha;
  const [fr, fg, fb] = foreground.rgb.map(
    (channel, i) => channel * a + background.rgb[i] * (1 - a)
  );
  const lighter = Math.max(
    relativeLuminance(fr, fg, fb),
    relativeLuminance(...background.rgb)
  );
  const darker = Math.min(
    relativeLuminance(fr, fg, fb),
    relativeLuminance(...background.rgb)
  );
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Every pair in `CONTRAST_PAIRS` that falls short of WCAG 2.1 AA in either
 * mode, read from the colours the Studio preview paints for `theme`. Values
 * the theme leaves out are Studio's defaults.
 */
export function checkContrast(theme: CustomTheme): ContrastViolation[] {
  const values: Record<string, ThemeValue> = {};
  for (const [cssVar, value] of Object.entries(DEFAULT_VALUES)) {
    values[cssVar] = {
      light: theme.light[cssVar] ?? value.light,
      dark: theme.dark[cssVar] ?? value.dark,
    };
  }

  const violations: ContrastViolation[] = [];
  for (const mode of ['light', 'dark'] as const) {
    const style = buildPreviewStyle(values, mode);
    for (const pair of CONTRAST_PAIRS) {
      const foregroundColor = style[pair.foreground] ?? '';
      const backgroundColor = style[pair.background] ?? '';
      const foreground = parseColor(foregroundColor, style);
      const background = parseColor(backgroundColor, style);
      const ratio =
        foreground && background ? ratioOf(foreground, background) : null;
      if (ratio !== null && ratio >= pair.minimum) continue;
      violations.push({
        mode,
        foreground: pair.foreground,
        background: pair.background,
        label: pair.label,
        foregroundColor,
        backgroundColor,
        ratio,
        minimum: pair.minimum,
        ...(pair.setBy ? { setBy: pair.setBy } : {}),
      });
    }
  }
  return violations;
}

/** A ratio as the chat shows it, never rounded up to a pass. */
export function formatRatio(ratio: number): string {
  return `${(Math.floor(ratio * 100) / 100).toFixed(2)}:1`;
}

/**
 * One violation in a sentence, for the model and for the chat, e.g. "Dark
 * mode, quiet text on the lowered surface: 3.20:1, needs 4.5:1
 * (--wa-color-text-quiet #8a8a8a on --wa-color-surface-lowered #2a2a2a)".
 */
export function describeViolation(violation: ContrastViolation): string {
  const colours = `${violation.foreground} ${violation.foregroundColor} on ${violation.background} ${violation.backgroundColor}`;
  const setBy = violation.setBy ? `, set by ${violation.setBy}` : '';
  return `${summarizeViolation(violation)} (${colours}${setBy})`;
}

/** Mode, pair and ratio, as the chat's accessibility warning lists them. */
export function summarizeViolation(violation: ContrastViolation): string {
  const mode = violation.mode === 'light' ? 'Light mode' : 'Dark mode';
  const result =
    violation.ratio === null
      ? 'a colour could not be resolved'
      : `${formatRatio(violation.ratio)}, needs ${violation.minimum}:1`;
  return `${mode}, ${violation.label}: ${result}`;
}
