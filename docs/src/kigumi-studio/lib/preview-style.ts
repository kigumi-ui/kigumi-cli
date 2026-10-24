import { PROPERTY_DEFINITIONS } from './property-definitions';
import { DEFAULT_VALUES, type ThemeValue } from './defaults';
import {
  generateBrandVariables,
  generateSemanticVariables,
  generateSurfaceVariables,
  generateTextVariables,
  type SemanticColorGroup,
} from './color-utils';

/**
 * The CSS custom properties the Studio preview sets for one mode: every
 * sidebar value plus the variables Studio derives from them (brand and
 * semantic palettes, surfaces and text from neutral, the shadow colour).
 * Shared by the preview and the Theme Agent's contrast check, so the check
 * reads the colours the preview paints.
 */
export function buildPreviewStyle(
  values: Record<string, ThemeValue>,
  mode: 'light' | 'dark'
): Record<string, string> {
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
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(shadowHex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      style['--wa-color-shadow'] = `rgb(${r} ${g} ${b} / ${shadowOpacity})`;
    }
    delete style['--wa-shadow-opacity'];
  }

  // Neutralize WA built-in shadows: shadows are opt-in via shadowComponents only.
  // Components like Card have box-shadow: var(--wa-shadow-m) in their Shadow DOM.
  // Setting these to 'none' disables all native shadows; the shadowComponents system
  // uses filter: drop-shadow() independently and is NOT affected.
  style['--wa-shadow-s'] = 'none';
  style['--wa-shadow-m'] = 'none';
  style['--wa-shadow-l'] = 'none';
  style['--wa-shadow-xl'] = 'none';

  return style;
}
