/**
 * Color utilities for generating Web Awesome brand palette steps from a single brand color.
 *
 * Web Awesome uses OKLCH-based lightness steps (05, 10, 20, ..., 95) where each step
 * has a target lightness value. The hue and a scaled chroma are preserved from the base color.
 *
 * This module converts hex -> sRGB -> OKLab -> OKLCH, adjusts lightness per step,
 * scales chroma to avoid out-of-gamut colors, then converts back to hex.
 */

// ── Target OKLCH lightness for each palette step ──
// Derived from Web Awesome's rudimentary palette (consistent across all hues)
const STEP_LIGHTNESS: Record<string, number> = {
  '05': 0.19,
  '10': 0.245,
  '20': 0.335,
  '30': 0.41,
  '40': 0.49,
  '50': 0.59,
  '60': 0.69,
  '70': 0.77,
  '80': 0.845,
  '90': 0.925,
  '95': 0.965,
};

export const PALETTE_STEPS = [
  '05',
  '10',
  '20',
  '30',
  '40',
  '50',
  '60',
  '70',
  '80',
  '90',
  '95',
] as const;
export type PaletteStep = (typeof PALETTE_STEPS)[number];

// ── sRGB <-> Linear RGB ──

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

// ── Hex <-> RGB ──

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  let r: number, g: number, b: number;

  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16) / 255;
    g = parseInt(clean[1] + clean[1], 16) / 255;
    b = parseInt(clean[2] + clean[2], 16) / 255;
  } else {
    r = parseInt(clean.slice(0, 2), 16) / 255;
    g = parseInt(clean.slice(2, 4), 16) / 255;
    b = parseInt(clean.slice(4, 6), 16) / 255;
  }

  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const clamped = Math.max(0, Math.min(1, c));
    const val = Math.round(clamped * 255);
    return val.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ── sRGB <-> OKLab ──
// Based on Björn Ottosson's OKLab implementation

function srgbToOklab(
  r: number,
  g: number,
  b: number
): [number, number, number] {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l_ = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  );
  const m_ = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  );
  const s_ = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
  );

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bv = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  return [L, a, bv];
}

function oklabToSrgb(
  L: number,
  a: number,
  b: number
): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const lr = l_ * l_ * l_;
  const mg = m_ * m_ * m_;
  const sb = s_ * s_ * s_;

  const r = +4.0767416621 * lr - 3.3077115913 * mg + 0.2309699292 * sb;
  const g = -1.2684380046 * lr + 2.6097574011 * mg - 0.3413193965 * sb;
  const bv = -0.0041960863 * lr - 0.7034186147 * mg + 1.707614701 * sb;

  return [linearToSrgb(r), linearToSrgb(g), linearToSrgb(bv)];
}

// ── OKLab <-> OKLCH ──

function oklabToOklch(
  L: number,
  a: number,
  b: number
): [number, number, number] {
  const C = Math.sqrt(a * a + b * b);
  let h = Math.atan2(b, a) * (180 / Math.PI);
  if (h < 0) h += 360;
  return [L, C, h];
}

function oklchToOklab(
  L: number,
  C: number,
  h: number
): [number, number, number] {
  const hRad = h * (Math.PI / 180);
  return [L, C * Math.cos(hRad), C * Math.sin(hRad)];
}

// ── Hex <-> OKLCH ──

export function hexToOklch(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  const [L, a, bv] = srgbToOklab(r, g, b);
  return oklabToOklch(L, a, bv);
}

function oklchToHex(L: number, C: number, h: number): string {
  const [labL, labA, labB] = oklchToOklab(L, C, h);
  const [r, g, b] = oklabToSrgb(labL, labA, labB);
  return rgbToHex(r, g, b);
}

// ── Gamut clipping ──
// Reduce chroma until the color fits in sRGB gamut

function isInGamut(r: number, g: number, b: number): boolean {
  return (
    r >= -0.001 &&
    r <= 1.001 &&
    g >= -0.001 &&
    g <= 1.001 &&
    b >= -0.001 &&
    b <= 1.001
  );
}

function gamutClipOklch(
  L: number,
  C: number,
  h: number
): [number, number, number] {
  if (C <= 0) return [L, 0, h];

  let lo = 0;
  let hi = C;

  // Binary search for max chroma in gamut
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const [labL, labA, labB] = oklchToOklab(L, mid, h);
    const [r, g, b] = oklabToSrgb(labL, labA, labB);
    if (isInGamut(r, g, b)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return [L, lo, h];
}

// ── Palette Generation ──

/**
 * Generate a single palette step color from a base OKLCH color.
 * Adjusts lightness to the target step and scales chroma proportionally,
 * then gamut-clips to ensure valid sRGB output.
 */
function generateStep(
  baseL: number,
  baseC: number,
  baseH: number,
  targetL: number
): string {
  // Scale chroma based on lightness distance from extremes.
  // At very light or very dark ends, chroma must decrease to stay in gamut.
  // Use a simple parabolic curve: max chroma at L=0.5, zero at L=0 and L=1
  const chromaScale = (l: number) => Math.max(0, 4 * l * (1 - l));
  const baseFactor = chromaScale(baseL) || 0.001;
  const targetFactor = chromaScale(targetL);
  const scaledC = baseC * (targetFactor / baseFactor);

  const [clippedL, clippedC, clippedH] = gamutClipOklch(
    targetL,
    scaledC,
    baseH
  );
  return oklchToHex(clippedL, clippedC, clippedH);
}

/**
 * Generate all 11 palette step hex colors from a base brand color.
 * Returns a record mapping step names ('05', '10', ..., '95') to hex colors.
 */
export function generateBrandPalette(
  brandHex: string
): Record<PaletteStep, string> {
  const [L, C, H] = hexToOklch(brandHex);

  const palette = {} as Record<PaletteStep, string>;
  for (const step of PALETTE_STEPS) {
    const targetL = STEP_LIGHTNESS[step];
    palette[step] = generateStep(L, C, H, targetL);
  }

  return palette;
}

// ── Semantic Variable Generation ──
// The theme maps semantic variables to palette steps.
// Light and dark modes have different mappings.
// These mappings follow the WA default theme (direct step references, no color-mix).

interface SemanticMapping {
  /** Direct reference to a palette step */
  step?: PaletteStep;
  /** Literal value (e.g. 'white') */
  literal?: string;
}

// Matches WA default.css light mode semantic mappings
const LIGHT_SEMANTICS: Record<string, SemanticMapping> = {
  'fill-quiet': { step: '95' },
  'fill-normal': { step: '90' },
  'fill-loud': { step: '50' },
  'border-quiet': { step: '90' },
  'border-normal': { step: '80' },
  'border-loud': { step: '60' },
  'on-quiet': { step: '40' },
  'on-normal': { step: '30' },
  'on-loud': { literal: 'white' },
};

// Matches WA default.css dark mode semantic mappings
const DARK_SEMANTICS: Record<string, SemanticMapping> = {
  'fill-quiet': { step: '10' },
  'fill-normal': { step: '20' },
  'fill-loud': { step: '50' },
  'border-quiet': { step: '20' },
  'border-normal': { step: '30' },
  'border-loud': { step: '40' },
  'on-quiet': { step: '60' },
  'on-normal': { step: '70' },
  'on-loud': { literal: 'white' },
};

// Neutral has different fill-loud and on-loud values than other color groups
const LIGHT_NEUTRAL_OVERRIDES: Record<string, SemanticMapping> = {
  'fill-loud': { step: '20' },
};

const DARK_NEUTRAL_OVERRIDES: Record<string, SemanticMapping> = {
  'fill-loud': { step: '90' },
  'on-loud': { step: '05' },
};

function resolveSemanticValue(
  mapping: SemanticMapping,
  palette: Record<PaletteStep, string>
): string {
  if (mapping.literal) return mapping.literal;
  if (mapping.step) return palette[mapping.step];
  return '';
}

/**
 * Generate all derived --wa-color-brand-* CSS custom properties from a brand hex color.
 * Returns a record of CSS variable name -> value for a given mode (light or dark).
 *
 * This includes:
 * - 11 palette steps: --wa-color-brand-05 through --wa-color-brand-95
 * - --wa-color-brand (the base color, mapped to step 50)
 * - 9 semantic variables: fill-quiet/normal/loud, border-quiet/normal/loud, on-quiet/normal/loud
 * - --wa-color-focus
 */
export function generateBrandVariables(
  brandHex: string,
  mode: 'light' | 'dark'
): Record<string, string> {
  const palette = generateBrandPalette(brandHex);
  const semantics = mode === 'light' ? LIGHT_SEMANTICS : DARK_SEMANTICS;

  const vars: Record<string, string> = {};

  // Palette steps
  for (const step of PALETTE_STEPS) {
    vars[`--wa-color-brand-${step}`] = palette[step];
  }

  // Base brand (use the step-50 generated color for consistency, or the original hex)
  vars['--wa-color-brand'] = brandHex;

  // Semantic variables
  for (const [key, mapping] of Object.entries(semantics)) {
    vars[`--wa-color-brand-${key}`] = resolveSemanticValue(mapping, palette);
  }

  // Focus color (step-60 for both modes, per WA default.css)
  vars['--wa-color-focus'] = palette['60'];

  return vars;
}

export type SemanticColorGroup = 'success' | 'warning' | 'danger' | 'neutral';

/**
 * Generate all derived --wa-color-{group}-* CSS custom properties from a base hex color.
 * Returns a record of CSS variable name -> value for a given mode (light or dark).
 *
 * This generates:
 * - 11 palette steps: --wa-color-{group}-05 through --wa-color-{group}-95
 * - --wa-color-{group} (the base color)
 * - 9 semantic variables: fill-quiet/normal/loud, border-quiet/normal/loud, on-quiet/normal/loud
 */
export function generateSemanticVariables(
  baseHex: string,
  group: SemanticColorGroup,
  mode: 'light' | 'dark'
): Record<string, string> {
  const palette = generateBrandPalette(baseHex);
  const baseSemantics = mode === 'light' ? LIGHT_SEMANTICS : DARK_SEMANTICS;

  // Apply neutral-specific overrides
  const neutralOverrides =
    group === 'neutral'
      ? mode === 'light'
        ? LIGHT_NEUTRAL_OVERRIDES
        : DARK_NEUTRAL_OVERRIDES
      : {};
  const semantics = { ...baseSemantics, ...neutralOverrides };

  const vars: Record<string, string> = {};

  // Palette steps
  for (const step of PALETTE_STEPS) {
    vars[`--wa-color-${group}-${step}`] = palette[step];
  }

  // Base color
  vars[`--wa-color-${group}`] = baseHex;

  // Semantic variables
  for (const [key, mapping] of Object.entries(semantics)) {
    vars[`--wa-color-${group}-${key}`] = resolveSemanticValue(mapping, palette);
  }

  return vars;
}

// ── Surface and Text Color Generation ──
// Surface colors derive from the neutral palette, text colors from neutral + brand.
// Follows WA default.css mappings.

/**
 * Darken a hex color by mixing with black in OKLab space.
 * Equivalent to `color-mix(in oklab, hex, black amount)`.
 */
export function darkenHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [L, a, bv] = srgbToOklab(r, g, b);
  // Mix with black (L=0, a=0, b=0) by the given amount
  const mixedL = L * (1 - amount);
  const mixedA = a * (1 - amount);
  const mixedB = bv * (1 - amount);
  const [outR, outG, outB] = oklabToSrgb(mixedL, mixedA, mixedB);
  return rgbToHex(outR, outG, outB);
}

/**
 * Generate surface color CSS variables from a neutral base color.
 * Surfaces derive from the neutral palette per WA default.css.
 */
export function generateSurfaceVariables(
  neutralHex: string,
  mode: 'light' | 'dark'
): Record<string, string> {
  const palette = generateBrandPalette(neutralHex);
  const vars: Record<string, string> = {};

  if (mode === 'light') {
    vars['--wa-color-surface-raised'] = '#ffffff';
    vars['--wa-color-surface-default'] = '#ffffff';
    vars['--wa-color-surface-lowered'] = palette['95'];
    vars['--wa-color-surface-border'] = palette['90'];
  } else {
    vars['--wa-color-surface-raised'] = palette['10'];
    vars['--wa-color-surface-default'] = palette['05'];
    vars['--wa-color-surface-lowered'] = darkenHex(palette['05'], 0.2);
    vars['--wa-color-surface-border'] = palette['20'];
  }

  return vars;
}

/**
 * Generate text color CSS variables from neutral and brand palettes.
 * Text colors derive from neutral (normal, quiet) and brand (link) per WA default.css.
 */
export function generateTextVariables(
  neutralHex: string,
  brandHex: string,
  mode: 'light' | 'dark'
): Record<string, string> {
  const neutralPalette = generateBrandPalette(neutralHex);
  const brandPalette = generateBrandPalette(brandHex);
  const vars: Record<string, string> = {};

  if (mode === 'light') {
    vars['--wa-color-text-normal'] = neutralPalette['10'];
    vars['--wa-color-text-quiet'] = neutralPalette['40'];
    vars['--wa-color-text-link'] = brandPalette['40'];
  } else {
    vars['--wa-color-text-normal'] = neutralPalette['95'];
    vars['--wa-color-text-quiet'] = neutralPalette['60'];
    vars['--wa-color-text-link'] = brandPalette['70'];
  }

  return vars;
}

// ── Light/Dark Mode Conversion ──
// OKLCH-based color inversion for generating one mode from the other.
// Preserves hue, inverts lightness, adjusts chroma for perceptual consistency.

/**
 * WCAG 2.1 relative luminance from sRGB [0-1] values.
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/**
 * WCAG 2.1 contrast ratio between two hex colors.
 */
export function contrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const l1 = relativeLuminance(r1, g1, b1);
  const l2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Format an OKLCH color as a CSS oklch() value.
 * More precise than hex and natively supported in modern browsers.
 */
export function formatOklch(L: number, C: number, H: number): string {
  const pct = (L * 100).toFixed(2);
  const chroma = C.toFixed(4);
  const hue = H.toFixed(2);
  return `oklch(${pct}% ${chroma} ${hue})`;
}

/**
 * Map lightness from one mode to the other using asymmetric scaling.
 *
 * Light and dark mode use different lightness ranges:
 * - Light mode surfaces: L 0.90-1.00 (near-white)
 * - Dark mode surfaces: L 0.05-0.25 (near-black)
 * - Light mode text: L 0.10-0.45 (dark)
 * - Dark mode text: L 0.60-0.95 (light)
 *
 * Simple 1-L inversion maps dark surfaces (0.18) to medium gray (0.82),
 * not to near-white where light surfaces belong. This piecewise mapping
 * handles the asymmetry correctly.
 */
function mapLightness(L: number, targetMode: 'light' | 'dark'): number {
  if (targetMode === 'light') {
    // Dark -> Light: dark colors become very light, mid-tones shift up
    if (L < 0.35) {
      // Dark surfaces/backgrounds (0.05-0.35) -> light surfaces (0.90-1.00)
      return 0.9 + ((0.35 - L) / 0.35) * 0.1;
    }
    // Mid to light range: scale proportionally
    return Math.min(0.98, 0.45 + (L - 0.35) * 0.85);
  } else {
    // Light -> Dark: light colors become very dark, mid-tones shift down
    if (L > 0.85) {
      // Light surfaces/backgrounds (0.85-1.00) -> dark surfaces (0.05-0.25)
      return 0.05 + ((1.0 - L) / 0.15) * 0.2;
    }
    // Mid to dark range: scale proportionally
    return Math.max(0.05, L * 0.55 + 0.03);
  }
}

/**
 * Convert a hex color to its opposite-mode equivalent using OKLCH.
 *
 * Algorithm:
 * 1. Convert to OKLCH
 * 2. Map lightness using asymmetric scaling (not simple inversion)
 * 3. Adjust chroma: dark mode gets ~15% less saturation (perceptual compensation)
 * 4. Preserve hue exactly (brand recognition)
 *
 * Returns an oklch() CSS value string for maximum precision.
 */
export function invertColorForMode(
  hex: string,
  targetMode: 'light' | 'dark'
): string {
  const [L, C, H] = hexToOklch(hex);

  const mappedL = mapLightness(L, targetMode);

  // Adjust chroma: dark mode needs less saturation for readability,
  // light mode can handle more saturation
  const chromaFactor = targetMode === 'dark' ? 0.85 : 1 / 0.85;
  const adjustedC = C * chromaFactor;

  // Gamut-clip to ensure valid sRGB
  const [clippedL, clippedC] = gamutClipOklch(mappedL, adjustedC, H);

  return formatOklch(clippedL, clippedC, H);
}

/**
 * Generate opposite-mode color values following Web Awesome's architecture.
 *
 * WA's approach: the palette (11 OKLCH steps per hue) is IDENTICAL between light
 * and dark mode. Only the MAPPING of steps to semantic roles changes.
 * This means "generating the other mode" uses the existing palette steps,
 * mapped through WA's light/dark semantic system.
 *
 * Requires the actual neutral and brand base hex colors to generate correct palettes.
 * Do NOT try to extract these from surface colors -- pass them from the values state.
 */
export function generateOppositeMode(
  neutralHex: string,
  brandHex: string,
  targetMode: 'light' | 'dark',
  sourceColors: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};

  // Generate palette from the neutral base color
  const neutralPalette = generateBrandPalette(neutralHex);

  // Surfaces from neutral palette (WA default.css architecture)
  const surfaceVars = generateSurfaceVariables(neutralHex, targetMode);
  Object.assign(result, surfaceVars);

  // Text from neutral + brand palettes
  const textVars = generateTextVariables(neutralHex, brandHex, targetMode);
  Object.assign(result, textVars);

  // Form controls derive from surfaces and neutral palette
  if (targetMode === 'light') {
    result['--wa-form-control-background-color'] = '#ffffff';
    result['--wa-form-control-border-color'] = neutralPalette['60'];
    result['--wa-form-control-placeholder-color'] = neutralPalette['50'];
  } else {
    result['--wa-form-control-background-color'] = neutralPalette['05'];
    result['--wa-form-control-border-color'] = neutralPalette['40'];
    result['--wa-form-control-placeholder-color'] = neutralPalette['50'];
  }

  // Shadow: dark mode needs stronger shadows for depth perception
  const sourceOpacity = sourceColors['--wa-shadow-opacity'];
  if (sourceOpacity) {
    const opacity = parseFloat(sourceOpacity);
    if (!isNaN(opacity)) {
      result['--wa-shadow-opacity'] =
        targetMode === 'dark'
          ? String(Math.min(0.6, Math.max(0.3, opacity * 2.5)))
          : String(Math.max(0.1, Math.min(0.3, opacity / 2.5)));
    }
  }

  result['--wa-color-shadow'] = '#000000';

  return result;
}
