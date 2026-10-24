import { z } from 'zod';
import {
  PROPERTIES_BY_VAR,
  type PropertyDefinition,
} from '../lib/property-definitions';
import { SHADOW_COMPONENTS } from '../lib/shadow-components';
import {
  cloneTheme,
  componentListKey,
  THEME_AGENT_MODES,
  type CustomTheme,
  type ThemeAgentSnapshot,
} from './custom-theme';

// Shared by the browser and the trigger.dev task (docs/trigger): the task
// rejects an invalid proposal and lets the model retry, the browser checks
// again before applying. Neither applies anything this module refuses.

/** The `reasons` key for the shadow component list. */
export const SHADOW_COMPONENTS_KEY = 'shadowComponents';

/** Longest reason accepted; it is shown in a change request. */
export const MAX_REASON_LENGTH = 300;

/**
 * The shape of a Theme Agent proposal: the values to change per mode and,
 * optionally, the full list of components that get a shadow, and why
 * hand-set values should change. Like `PresetJSON` without custom CSS; any
 * other key is refused.
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
  reasons: z
    .record(z.string(), z.string())
    .optional()
    .describe(
      `Why each hand-set value you propose should change, keyed by CSS custom property or "${SHADOW_COMPONENTS_KEY}"; one short sentence each`
    ),
});

export type ThemeProposalInput = z.infer<typeof themeProposalSchema>;

/** A proposal that passed validation, with mode-independent values in both modes. */
export interface ThemeProposal {
  light: Record<string, string>;
  dark: Record<string, string>;
  shadowComponents?: string[];
  /** Keyed by CSS custom property or `SHADOW_COMPONENTS_KEY`. */
  reasons?: Record<string, string>;
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

  let reasons: Record<string, string> | undefined;
  if (parsed.data.reasons) {
    reasons = {};
    for (const [key, raw] of Object.entries(parsed.data.reasons)) {
      const proposed =
        key === SHADOW_COMPONENTS_KEY
          ? shadowComponents !== undefined
          : key in parsed.data.light || key in parsed.data.dark;
      const reason = raw.trim();
      if (!proposed) {
        errors.push(`reasons ${key}: not a value this proposal changes`);
      } else if (reason === '') {
        errors.push(`reasons ${key}: empty`);
      } else if (reason.length > MAX_REASON_LENGTH) {
        errors.push(
          `reasons ${key}: longer than ${MAX_REASON_LENGTH} characters`
        );
      } else {
        reasons[key] = reason;
      }
    }
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
  const proposal: ThemeProposal = { light, dark };
  if (shadowComponents) proposal.shadowComponents = shadowComponents;
  if (reasons) proposal.reasons = reasons;
  return { valid: true, proposal };
}

/**
 * The task's extra check: every change to a value the snapshot lists as
 * hand-set and not kept needs a reason, because it becomes a change request
 * that shows it. The browser does not repeat this check; a value the user set while
 * the run was in progress gets a change request without a reason.
 */
export function missingReasons(
  proposal: ThemeProposal,
  snapshot: ThemeAgentSnapshot
): string[] {
  const errors: string[] = [];
  const asked = new Set<string>();
  for (const mode of THEME_AGENT_MODES) {
    for (const [cssVar, value] of Object.entries(proposal[mode])) {
      if (
        asked.has(cssVar) ||
        !snapshot.handSet[mode].includes(cssVar) ||
        // Kept values are not proposed at all unless the message names
        // them; Studio, not this check, decides which reach the user.
        snapshot.kept[mode].includes(cssVar) ||
        snapshot.theme[mode][cssVar] === value ||
        proposal.reasons?.[cssVar]
      ) {
        continue;
      }
      asked.add(cssVar);
      const name = PROPERTIES_BY_VAR.get(cssVar)?.modeDependent
        ? `${mode} ${cssVar}`
        : cssVar;
      errors.push(`reasons ${cssVar}: ${name} is hand-set; give a reason`);
    }
  }
  const list = proposal.shadowComponents;
  if (
    list &&
    snapshot.handSet.shadowComponents &&
    !snapshot.kept.shadowComponents &&
    componentListKey(list) !==
      componentListKey(snapshot.theme.shadowComponents) &&
    !proposal.reasons?.[SHADOW_COMPONENTS_KEY]
  ) {
    errors.push(
      `reasons ${SHADOW_COMPONENTS_KEY}: the shadow component list is hand-set; give a reason`
    );
  }
  return errors;
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

/** What the task's `propose_theme` tool returns to the model and the browser. */
export interface ProposeThemeOutput {
  accepted: boolean;
  /** Why the proposal was refused. */
  errors: string[];
  /** Contrast pairs the theme fails with this proposal applied, one per line. */
  contrast: string[];
  /** `true` while the model is to correct `contrast` and propose again. */
  correctContrast: boolean;
}
