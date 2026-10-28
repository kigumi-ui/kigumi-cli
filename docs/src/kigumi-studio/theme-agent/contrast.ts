import { hexToRgb, oklchToSrgb, relativeLuminance } from '../lib/color-utils';
import {
  DEFAULT_VALUES,
  type ThemeMode,
  type ThemeValue,
} from '../lib/defaults';
import type { LockedValues } from '../lib/locks';
import { buildPreviewStyle } from '../lib/preview-style';
import { PROPERTIES_BY_VAR } from '../lib/property-definitions';
import type { CustomTheme } from './custom-theme';

// Shared by the browser and the trigger.dev task (docs/trigger): the task
// sends violations back to the model to correct, the browser checks what it
// applies again and reports what is left. WCAG 2.1 AA, both modes.

interface ContrastPair {
  foreground: string;
  background: string;
  /** How the chat names the pair, e.g. "quiet text on the lowered surface". */
  label: string;
  minimum: number;
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
  // What the preview paints for brand-filled controls: the brand fill the
  // user set, else what Studio derives from the brand colour; its text is
  // the on-colour. The fill fixes the pair, never the brand (ADR 0015).
  {
    foreground: '--wa-color-brand-on-loud',
    background: '--wa-color-brand-fill-loud',
    label: 'text on the brand fill',
    minimum: 4.5,
  },
];

export interface ContrastViolation {
  mode: ThemeMode;
  foreground: string;
  background: string;
  label: string;
  /** The colours as the preview paints them. */
  foregroundColor: string;
  backgroundColor: string;
  /** `null` when a colour could not be resolved, which never passes. */
  ratio: number | null;
  minimum: number;
}

interface Rgba {
  rgb: [number, number, number];
  alpha: number;
}

const NAMED: Record<string, Rgba> = {
  white: { rgb: [1, 1, 1], alpha: 1 },
  black: { rgb: [0, 0, 0], alpha: 1 },
};

/** A colour channel: a CSS number, a percentage of `percentOf`, or `none`. */
function parseChannel(token: string, percentOf: number): number {
  if (token === 'none') return 0;
  if (token.endsWith('%'))
    return (Number(token.slice(0, -1)) / 100) * percentOf;
  // Number(), not parseFloat(): "12px" is NaN, not 12.
  return Number(token);
}

const DEGREES_PER_UNIT: Record<string, number> = {
  deg: 1,
  grad: 0.9,
  rad: 180 / Math.PI,
  turn: 360,
};

/** A CSS hue in degrees: a number, `none`, or a number with an angle unit. */
function parseHue(token: string): number {
  if (token === 'none') return 0;
  const angle = /^([-+]?[\d.]+(?:e[-+]?\d+)?)(deg|grad|rad|turn)?$/.exec(token);
  if (!angle) return NaN;
  return Number(angle[1]) * DEGREES_PER_UNIT[angle[2] ?? 'deg'];
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
    rgb = oklchToSrgb(parseChannel(l, 1), parseChannel(c, 0.4), parseHue(h));
  } else {
    const [r, g, b] = channels.map(
      (channel) => parseChannel(channel, 255) / 255
    );
    rgb = [r, g, b];
  }
  const result: Rgba = {
    // Out-of-gamut colours are clipped, as a browser shows them.
    rgb: rgb.map((channel) => Math.min(1, Math.max(0, channel))) as [
      number,
      number,
      number,
    ],
    alpha: Math.min(1, Math.max(0, parseChannel(alpha, 1))),
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
 * The CSS custom properties the Studio preview paints for `theme` in `mode`,
 * derived ones included. Values the theme leaves out are Studio's defaults.
 */
export function paintedStyle(
  theme: CustomTheme,
  mode: ThemeMode
): Record<string, string> {
  const values: Record<string, ThemeValue> = {};
  for (const [cssVar, value] of Object.entries(DEFAULT_VALUES)) {
    values[cssVar] = {
      light: theme.light[cssVar] ?? value.light,
      dark: theme.dark[cssVar] ?? value.dark,
    };
  }
  return buildPreviewStyle(values, mode);
}

/** One checked pair in one mode, passing or not, as the contrast view shows it. */
export interface ContrastResult extends ContrastViolation {
  passes: boolean;
  /**
   * The colours resolved to what a swatch paints, `#rrggbb` or, when
   * translucent, `rgb()`; `null` when the colour could not be resolved.
   */
  foregroundSwatch: string | null;
  backgroundSwatch: string | null;
}

/** A resolved colour as CSS: `#rrggbb`, or `rgb(r g b / a)` when translucent. */
function swatchOf(color: Rgba | null): string | null {
  if (!color) return null;
  const channels = color.rgb.map((channel) => Math.round(channel * 255));
  if (color.alpha < 1) {
    return `rgb(${channels.join(' ')} / ${Number(color.alpha.toFixed(3))})`;
  }
  return `#${channels
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}

/** One pair measured in one mode: the violation it would be, and the rest. */
interface Measured {
  violation: ContrastViolation;
  passes: boolean;
  foregroundSwatch: string | null;
  backgroundSwatch: string | null;
}

function measurePairs(theme: CustomTheme): Measured[] {
  const measured: Measured[] = [];
  for (const mode of ['light', 'dark'] as const) {
    const style = paintedStyle(theme, mode);
    for (const pair of CONTRAST_PAIRS) {
      const foregroundColor = style[pair.foreground] ?? '';
      const backgroundColor = style[pair.background] ?? '';
      const foreground = parseColor(foregroundColor, style);
      const background = parseColor(backgroundColor, style);
      const ratio =
        foreground && background ? ratioOf(foreground, background) : null;
      measured.push({
        violation: {
          mode,
          foreground: pair.foreground,
          background: pair.background,
          label: pair.label,
          foregroundColor,
          backgroundColor,
          ratio,
          minimum: pair.minimum,
        },
        passes: ratio !== null && ratio >= pair.minimum,
        foregroundSwatch: swatchOf(foreground),
        backgroundSwatch: swatchOf(background),
      });
    }
  }
  return measured;
}

/**
 * Every pair in `CONTRAST_PAIRS` in both modes, light first, read from the
 * colours the Studio preview paints for `theme`, with whether it meets WCAG
 * 2.1 AA. Values the theme leaves out are Studio's defaults. A pair whose
 * colour cannot be resolved, or whose background is translucent, never passes.
 */
export function contrastResults(theme: CustomTheme): ContrastResult[] {
  return measurePairs(theme).map(({ violation, ...rest }) => ({
    ...violation,
    ...rest,
  }));
}

/**
 * Every pair in `CONTRAST_PAIRS` that falls short of WCAG 2.1 AA in either
 * mode: the pairs `contrastResults()` does not pass, as violations.
 */
export function checkContrast(theme: CustomTheme): ContrastViolation[] {
  return measurePairs(theme)
    .filter((measured) => !measured.passes)
    .map((measured) => measured.violation);
}

/** One string per violation: its mode and pair. */
export function violationKey(violation: ContrastViolation): string {
  return `${violation.mode} ${violation.foreground} ${violation.background}`;
}

/**
 * The violations that go back to the model to correct: `violations` less the
 * pairs the held values fix (those not in `leftWithHeld`, the violations of
 * the theme with the held values applied). The brand fill pair is one of
 * them, set or unset: the fill fixes it, never the brand (ADR 0015).
 */
export function correctableViolations(
  violations: ContrastViolation[],
  leftWithHeld: ContrastViolation[]
): ContrastViolation[] {
  const left = new Set(leftWithHeld.map(violationKey));
  return violations.filter((violation) => left.has(violationKey(violation)));
}

/**
 * The locked Studio values behind `violation` when every value behind it is
 * locked in its mode, so the Theme Agent may not fix it; none while one is
 * free to change. Behind a pair are its colours that are Studio values: for
 * the brand fill pair, the fill, set or unset, since its on-colour is no
 * Studio value.
 */
export function lockedSources(
  violation: ContrastViolation,
  locked: LockedValues
): string[] {
  const sources = [violation.foreground, violation.background].filter(
    (cssVar) => PROPERTIES_BY_VAR.has(cssVar)
  );
  const lockedInMode = locked[violation.mode];
  return sources.every((cssVar) => lockedInMode.includes(cssVar))
    ? sources
    : [];
}

/** A ratio as the chat shows it, never rounded up to a pass. */
export function formatRatio(ratio: number): string {
  return `${(Math.floor(ratio * 100) / 100).toFixed(2)}:1`;
}

/**
 * One violation as the model is told it: the chat's summary plus the tokens
 * and colours to fix, e.g. "Dark mode, quiet text on the lowered surface:
 * 3.20:1, needs 4.5:1 (--wa-color-text-quiet #8a8a8a on
 * --wa-color-surface-lowered #2a2a2a)".
 */
export function violationFeedback(violation: ContrastViolation): string {
  const colours = `${violation.foreground} ${violation.foregroundColor} on ${violation.background} ${violation.backgroundColor}`;
  return `${summarizeViolation(violation)} (${colours})`;
}

/** Mode and pair, e.g. "Dark mode, quiet text on the lowered surface". */
export function violationPair(violation: ContrastViolation): string {
  const mode = violation.mode === 'light' ? 'Light mode' : 'Dark mode';
  return `${mode}, ${violation.label}`;
}

/** Mode, pair and ratio, as the chat's accessibility warning lists them. */
export function summarizeViolation(violation: ContrastViolation): string {
  const result =
    violation.ratio === null
      ? 'a colour could not be resolved'
      : `${formatRatio(violation.ratio)}, needs ${violation.minimum}:1`;
  return `${violationPair(violation)}: ${result}`;
}
