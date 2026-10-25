import { z } from 'zod';
import {
  PROPERTIES_BY_VAR,
  type PropertyDefinition,
} from '../lib/property-definitions';
import { SHADOW_COMPONENTS_LOCK } from '../lib/locks';
import { SHADOW_COMPONENTS } from '../lib/shadow-components';
import { cloneTheme, type CustomTheme } from './custom-theme';

// Shared by the browser and the trigger.dev task (docs/trigger): the task
// rejects an invalid proposal and lets the model retry, the browser checks
// again before applying. Neither applies anything this module refuses.

/**
 * The shape of a Theme Agent proposal: the values to change per mode and,
 * optionally, the full list of components that get a shadow. Like
 * `PresetJSON` without custom CSS; any other key is refused.
 */
export const themeProposalSchema = z.strictObject({
  light: z
    .record(z.string(), z.string())
    .describe('Values to change in light mode, keyed by CSS custom property'),
  dark: z
    .record(z.string(), z.string())
    .describe('Values to change in dark mode, keyed by CSS custom property'),
  shadowComponents: z
    .array(z.string())
    .optional()
    .describe(
      'The complete list of components that get a shadow; omit to keep the current list'
    ),
});

export type ThemeProposalInput = z.infer<typeof themeProposalSchema>;

/** A proposal that passed validation, with mode-independent values in both modes. */
export interface ThemeProposal {
  light: Record<string, string>;
  dark: Record<string, string>;
  shadowComponents?: string[];
}

export type ProposalValidation =
  { valid: true; proposal: ThemeProposal } | { valid: false; errors: string[] };

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const NUMBER = /^-?\d+(\.\d+)?$/;
const SHADOW_CLASS_NAMES = new Set(SHADOW_COMPONENTS.map((c) => c.className));

/** Why `value` is not one the sidebar offers for `property`, or `undefined`. */
function valueError(
  property: PropertyDefinition,
  value: string
): string | undefined {
  switch (property.inputType) {
    case 'color':
      // The sidebar's colour picker, the brand palette and the shadow colour
      // all work in #rrggbb.
      return HEX_COLOR.test(value)
        ? undefined
        : `"${value}" is not a colour written #rrggbb`;
    case 'select': {
      const options = property.options ?? [];
      if (options.some((option) => option.value === value)) return undefined;
      if (property.group === 'typography-families') {
        return `"${value}" is not a font from Studio's font list`;
      }
      return `"${value}" is not one of: ${options
        .map((o) => o.value)
        .join(', ')}`;
    }
    case 'slider': {
      if (!NUMBER.test(value)) return `"${value}" is not a number`;
      const number = Number(value);
      const min = property.min ?? 0;
      const max = property.max ?? 1;
      const step = property.step ?? 0.1;
      if (number < min || number > max) {
        return `${value} is outside ${min} to ${max}`;
      }
      const steps = (number - min) / step;
      if (Math.abs(steps - Math.round(steps)) > 1e-6) {
        return `${value} is not a multiple of ${step} from ${min}`;
      }
      return undefined;
    }
    case 'text':
      return value.trim() === '' || /[;{}<>]/.test(value)
        ? `"${value}" is not a plain value`
        : undefined;
  }
}

/** Sliders are stored without their unit; accept "150ms" as "150". */
function withoutUnit(property: PropertyDefinition, value: string): string {
  const unit = property.unit;
  return unit && value.endsWith(unit) ? value.slice(0, -unit.length) : value;
}

/**
 * Check a proposal against what the Studio sidebar offers: keys must be
 * Studio properties, fonts must come from Studio's font list, shadow
 * components from Studio's list, and values must parse for their property
 * type. The errors are written for the model to correct its proposal.
 */
export function validateProposal(input: unknown): ProposalValidation {
  const parsed = themeProposalSchema.safeParse(input);
  if (!parsed.success) {
    return {
      valid: false,
      errors: parsed.error.issues.map(
        (issue) => `${issue.path.join('.') || 'proposal'}: ${issue.message}`
      ),
    };
  }

  const errors: string[] = [];
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};

  for (const mode of ['light', 'dark'] as const) {
    const target = mode === 'light' ? light : dark;
    for (const [cssVar, raw] of Object.entries(parsed.data[mode])) {
      const property = PROPERTIES_BY_VAR.get(cssVar);
      if (!property) {
        errors.push(`${mode} ${cssVar}: not a Studio property`);
        continue;
      }
      const value = withoutUnit(property, raw.trim());
      const error = valueError(property, value);
      if (error) {
        errors.push(`${mode} ${cssVar}: ${error}`);
        continue;
      }
      target[cssVar] = value;
    }
  }

  // A mode-independent value is one value for both modes.
  for (const cssVar of new Set([...Object.keys(light), ...Object.keys(dark)])) {
    const property = PROPERTIES_BY_VAR.get(cssVar);
    if (!property || property.modeDependent) continue;
    const lightValue = light[cssVar];
    const darkValue = dark[cssVar];
    if (
      lightValue !== undefined &&
      darkValue !== undefined &&
      lightValue !== darkValue
    ) {
      errors.push(
        `${cssVar}: the same in both modes, but light is "${lightValue}" and dark is "${darkValue}"`
      );
      continue;
    }
    const value = lightValue ?? darkValue;
    light[cssVar] = value;
    dark[cssVar] = value;
  }

  let shadowComponents: string[] | undefined;
  if (parsed.data.shadowComponents) {
    for (const name of parsed.data.shadowComponents) {
      if (!SHADOW_CLASS_NAMES.has(name)) {
        errors.push(`shadowComponents: "${name}" is not in Studio's list`);
      }
    }
    shadowComponents = [...new Set(parsed.data.shadowComponents)];
  }

  if (
    errors.length === 0 &&
    Object.keys(light).length === 0 &&
    Object.keys(dark).length === 0 &&
    shadowComponents === undefined
  ) {
    errors.push('proposal: changes nothing');
  }

  if (errors.length > 0) return { valid: false, errors };
  return {
    valid: true,
    proposal: shadowComponents
      ? { light, dark, shadowComponents }
      : { light, dark },
  };
}

/** `theme` with a validated proposal on top; `theme` itself is left as it is. */
export function applyProposal(
  theme: CustomTheme,
  proposal: ThemeProposal
): CustomTheme {
  const next = cloneTheme(theme);
  Object.assign(next.light, proposal.light);
  Object.assign(next.dark, proposal.dark);
  if (proposal.shadowComponents) {
    next.shadowComponents = [...proposal.shadowComponents];
  }
  return next;
}

/**
 * `proposal` without what `locked` covers (CSS custom properties, and
 * `SHADOW_COMPONENTS_LOCK` for the shadow list): what the browser will apply
 * of it. The task checks contrast on that, not on values that stay as they
 * are.
 */
export function withoutLocked(
  proposal: ThemeProposal,
  locked: readonly string[]
): ThemeProposal {
  const isLocked = new Set(locked);
  const keep = (values: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(values).filter(([cssVar]) => !isLocked.has(cssVar))
    );
  const result: ThemeProposal = {
    light: keep(proposal.light),
    dark: keep(proposal.dark),
  };
  if (proposal.shadowComponents && !isLocked.has(SHADOW_COMPONENTS_LOCK)) {
    result.shadowComponents = proposal.shadowComponents;
  }
  return result;
}

/** The lock keys `proposal` would change: what Studio will hold back. */
export function lockedIn(
  proposal: ThemeProposal,
  locked: readonly string[]
): string[] {
  const isLocked = new Set(locked);
  const keys = new Set(
    [...Object.keys(proposal.light), ...Object.keys(proposal.dark)].filter(
      (cssVar) => isLocked.has(cssVar)
    )
  );
  if (proposal.shadowComponents && isLocked.has(SHADOW_COMPONENTS_LOCK)) {
    keys.add(SHADOW_COMPONENTS_LOCK);
  }
  return [...keys];
}

/** What the task's `propose_theme` tool returns to the model and the browser. */
export interface ProposeThemeOutput {
  accepted: boolean;
  /** Why the proposal was refused. */
  errors: string[];
  /** Contrast pairs the theme fails with this proposal applied, one per line. */
  contrast: string[];
  /** `true` while the model is to correct `contrast` and propose again. */
  correctContrast: boolean;
  /** Values of the proposal the user locked: Studio will not change them. */
  locked: string[];
}
