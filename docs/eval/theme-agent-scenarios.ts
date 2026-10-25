import type { ModelMessage } from 'ai';
import { THEME_AGENT_PROPOSE_TOOL } from '../src/kigumi-studio/theme-agent/constants';
import {
  checkContrast,
  paintedStyle,
  summarizeViolation,
  violationFeedback,
} from '../src/kigumi-studio/theme-agent/contrast';
import type {
  CustomTheme,
  ThemeAgentSnapshot,
} from '../src/kigumi-studio/theme-agent/custom-theme';
import {
  applyProposal,
  mergeProposals,
  splitLocked,
  validateProposal,
  type ThemeProposal,
} from '../src/kigumi-studio/theme-agent/proposal';
import { hexToOklch } from '../src/kigumi-studio/lib/color-utils';
import { DEFAULT_VALUES } from '../src/kigumi-studio/lib/defaults';
import { NO_LOCKS } from '../src/kigumi-studio/lib/locks';

// The Theme Agent prompt eval (issue #203): fixed snapshots and messages for
// the real model, each judged in code from the answer's accepted proposals
// and the snapshot's locks, never from the reply text. The runner is
// theme-agent.eval.ts; these judges are proven in the unit tests.

const BRAND = '--wa-color-brand';
const SURFACE = '--wa-color-surface-default';
const LIGHT_SURFACES = [
  '--wa-color-surface-raised',
  SURFACE,
  '--wa-color-surface-lowered',
];

export interface Verdict {
  pass: boolean;
  reason: string;
}

export interface EvalScenario {
  id: string;
  /** What the user does and what must happen, for the report. */
  description: string;
  snapshot: ThemeAgentSnapshot;
  messages: ModelMessage[];
  /** The verdict on an answer's accepted proposals, in the order accepted. */
  judge: (proposals: ThemeProposal[], snapshot: ThemeAgentSnapshot) => Verdict;
}

/** A tool result of one answer, as the AI SDK's steps report it. */
export interface AnswerToolResult {
  toolName: string;
  input: unknown;
  output: unknown;
}

/**
 * The proposals `propose_theme` accepted in one answer, validated the way
 * the browser validates them before it applies them.
 */
export function acceptedProposals(
  toolResults: AnswerToolResult[]
): ThemeProposal[] {
  return toolResults.flatMap((result) => {
    if (result.toolName !== THEME_AGENT_PROPOSE_TOOL) return [];
    const output = result.output;
    if (typeof output !== 'object' || output === null) return [];
    if (!('accepted' in output) || output.accepted !== true) return [];
    const validation = validateProposal(result.input);
    return validation.valid ? [validation.proposal] : [];
  });
}

/** Every value a proposal names, e.g. "light --wa-color-brand #dc2626". */
function describeProposal(proposal: ThemeProposal): string {
  const values = (['light', 'dark'] as const).flatMap((mode) =>
    Object.entries(proposal[mode]).map(
      ([cssVar, value]) => `${mode} ${cssVar} ${value}`
    )
  );
  if (proposal.shadowComponents) values.push('shadowComponents');
  return values.length > 0 ? values.join(', ') : 'nothing';
}

const NO_PROPOSAL: Verdict = {
  pass: false,
  reason: 'no accepted proposal: the answer changed nothing and held nothing',
};

/** What the browser does with an answer: apply what is free, hold the rest. */
function asStudioTakesIt(
  proposals: ThemeProposal[],
  snapshot: ThemeAgentSnapshot
) {
  const merged = mergeProposals(proposals);
  const { free, held } = splitLocked(merged, snapshot.locked);
  return { merged, free, held, applied: applyProposal(snapshot.theme, free) };
}

/** The brand is proposed and, since it is locked, held for the user. */
function brandHeld(
  proposals: ThemeProposal[],
  snapshot: ThemeAgentSnapshot
): Verdict {
  if (proposals.length === 0) return NO_PROPOSAL;
  const { merged, held } = asStudioTakesIt(proposals, snapshot);
  const brand = held.light[BRAND] ?? held.dark[BRAND];
  if (brand === undefined) {
    return {
      pass: false,
      reason: `${BRAND} was not proposed, so Studio holds nothing and offers no Unlock and apply; proposed: ${describeProposal(merged)}`,
    };
  }
  return {
    pass: true,
    reason: `${BRAND} ${brand} was proposed and Studio holds it`,
  };
}

/** A held brand that is red: OKLCH hue from 350 to 35 degrees, not grey. */
function redBrandHeld(
  proposals: ThemeProposal[],
  snapshot: ThemeAgentSnapshot
): Verdict {
  const verdict = brandHeld(proposals, snapshot);
  if (!verdict.pass) return verdict;
  const { held } = asStudioTakesIt(proposals, snapshot);
  const brand = held.light[BRAND] ?? held.dark[BRAND];
  const [, chroma, hue] = hexToOklch(brand);
  const red = chroma >= 0.1 && (hue >= 350 || hue <= 35);
  return red
    ? verdict
    : {
        pass: false,
        reason: `${verdict.reason}, but it is not red (OKLCH hue ${Math.round(hue)}, chroma ${chroma.toFixed(2)})`,
      };
}

/**
 * The brand is proposed and held. Whether the held brand fixes the brand
 * fill is reported, not judged: Studio derives the fill at a fixed
 * lightness, so some hues cannot pass at all, and the task gives the model
 * no feedback on a held value.
 */
function brandFillFixHeld(
  proposals: ThemeProposal[],
  snapshot: ThemeAgentSnapshot
): Verdict {
  const verdict = brandHeld(proposals, snapshot);
  if (!verdict.pass) return verdict;
  const { held, applied } = asStudioTakesIt(proposals, snapshot);
  const brand = held.light[BRAND] ?? held.dark[BRAND];
  if (brand.toLowerCase() === snapshot.theme.light[BRAND].toLowerCase()) {
    return {
      pass: false,
      reason: `${verdict.reason}, but it is the brand it already has`,
    };
  }
  const left = checkContrast(applyProposal(applied, held)).filter(
    (violation) => violation.setBy === BRAND
  );
  return {
    pass: true,
    reason:
      left.length > 0
        ? `${verdict.reason}; applied, it still fails: ${left
            .map(summarizeViolation)
            .join('; ')}`
        : `${verdict.reason}; applied, it fixes the brand fill`,
  };
}

/**
 * A light surface the preview paints changes; the locked dark surface does
 * not, whether the model left it out or Studio held it. Any light surface
 * counts: Studio paints the default and raised ones white whatever the
 * neutral colour, so warming through the neutral colour shows on the
 * lowered one.
 */
function lightSurfaceChanged(
  proposals: ThemeProposal[],
  snapshot: ThemeAgentSnapshot
): Verdict {
  if (proposals.length === 0) return NO_PROPOSAL;
  const { merged, held, applied } = asStudioTakesIt(proposals, snapshot);
  const darkBefore = paintedStyle(snapshot.theme, 'dark')[SURFACE];
  const darkAfter = paintedStyle(applied, 'dark')[SURFACE];
  if (darkAfter !== darkBefore) {
    return {
      pass: false,
      reason: `the dark surface is locked, but the preview now paints it ${darkAfter} instead of ${darkBefore}; proposed: ${describeProposal(merged)}`,
    };
  }
  const lightBefore = paintedStyle(snapshot.theme, 'light');
  const lightAfter = paintedStyle(applied, 'light');
  const changed = LIGHT_SURFACES.filter(
    (cssVar) => lightAfter[cssVar] !== lightBefore[cssVar]
  );
  if (changed.length === 0) {
    return {
      pass: false,
      reason: `no light surface changes; proposed: ${describeProposal(merged)}`,
    };
  }
  const darkFate =
    held.dark[SURFACE] !== undefined
      ? `held at ${held.dark[SURFACE]}`
      : 'left out';
  return {
    pass: true,
    reason: `${changed
      .map(
        (cssVar) =>
          `light ${cssVar} ${lightBefore[cssVar]} to ${lightAfter[cssVar]}`
      )
      .join(
        ', '
      )}; the dark surface stays ${darkBefore}, its change ${darkFate}`,
  };
}

/** A mood leaves the brand alone: it is the user's. */
function brandLeftAlone(
  proposals: ThemeProposal[],
  snapshot: ThemeAgentSnapshot
): Verdict {
  if (proposals.length === 0) return NO_PROPOSAL;
  const { merged } = asStudioTakesIt(proposals, snapshot);
  const brand = merged.light[BRAND] ?? merged.dark[BRAND];
  if (brand !== undefined) {
    return {
      pass: false,
      reason: `${BRAND} was proposed as ${brand} for a mood; the brand is the user's`,
    };
  }
  return {
    pass: true,
    reason: `${BRAND} left alone; proposed: ${describeProposal(merged)}`,
  };
}

/** Every sidebar value, as the browser sends the custom theme. */
function studioTheme(overrides: Partial<CustomTheme> = {}): CustomTheme {
  const theme: CustomTheme = { light: {}, dark: {}, shadowComponents: [] };
  for (const [cssVar, value] of Object.entries(DEFAULT_VALUES)) {
    theme.light[cssVar] = value.light;
    theme.dark[cssVar] = value.dark;
  }
  // Studio's dark form control border falls short of 3:1; a passing one
  // keeps the correction rounds on what each scenario is about.
  theme.dark['--wa-form-control-border-color'] = '#6b7080';
  return {
    light: { ...theme.light, ...overrides.light },
    dark: { ...theme.dark, ...overrides.dark },
    shadowComponents: overrides.shadowComponents ?? theme.shadowComponents,
  };
}

const BRAND_LOCKED = { light: [BRAND], dark: [BRAND], shadowComponents: false };

/** A green whose brand fill falls short of 4.5:1 under white text. */
const FAILING_GREEN = '#22c55e';
const greenTheme = studioTheme({
  light: { [BRAND]: FAILING_GREEN },
  dark: { [BRAND]: FAILING_GREEN },
});

/**
 * The answer that set the green brand: accepted, with the brand fill pair
 * reported (never corrected unasked), as the task's tool returned it.
 */
const greenAnswer: ModelMessage[] = [
  { role: 'user', content: `A fresh green theme, brand ${FAILING_GREEN}.` },
  {
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId: 'call-green',
        toolName: THEME_AGENT_PROPOSE_TOOL,
        input: { light: { [BRAND]: FAILING_GREEN }, dark: {} },
      },
    ],
  },
  {
    role: 'tool',
    content: [
      {
        type: 'tool-result',
        toolCallId: 'call-green',
        toolName: THEME_AGENT_PROPOSE_TOOL,
        output: {
          type: 'json',
          value: {
            accepted: true,
            errors: [],
            contrast: checkContrast(greenTheme).map(violationFeedback),
            correctContrast: false,
            lockedContrast: [],
            locked: [],
          },
        },
      },
    ],
  },
  {
    role: 'assistant',
    content:
      'Your brand is now a fresh green. Text on the brand fill falls short of 4.5:1 in both modes; only another brand hue or saturation fixes that, and the brand is yours, so I left it as it is.',
  },
];

export const SCENARIOS: EvalScenario[] = [
  {
    id: 'locked-brand-red',
    description:
      'Brand locked, "make the brand red": a red brand is proposed and held',
    snapshot: { theme: studioTheme(), locked: BRAND_LOCKED },
    messages: [{ role: 'user', content: 'Make the brand red.' }],
    judge: redBrandHeld,
  },
  {
    id: 'locked-brand-improve-fill',
    description:
      'Brand locked, "improve" after a brand fill contrast warning: the brand is proposed and held',
    snapshot: {
      theme: greenTheme,
      locked: BRAND_LOCKED,
      previous: { status: 'applied', held: [], errors: [] },
    },
    messages: [...greenAnswer, { role: 'user', content: 'improve' }],
    judge: brandFillFixHeld,
  },
  {
    id: 'locked-dark-surface-warmer',
    description:
      'Dark surface locked, "make it warmer": the light surface changes, the dark surface is held or left alone',
    snapshot: {
      theme: studioTheme({ dark: { [SURFACE]: '#1c1917' } }),
      locked: { light: [], dark: [SURFACE], shadowComponents: false },
    },
    messages: [{ role: 'user', content: 'Make it warmer.' }],
    judge: lightSurfaceChanged,
  },
  {
    id: 'unlocked-warmer',
    description:
      'Nothing locked, "make it warmer": the brand is not proposed (it is the user\'s)',
    snapshot: { theme: studioTheme(), locked: NO_LOCKS },
    messages: [{ role: 'user', content: 'Make it warmer.' }],
    judge: brandLeftAlone,
  },
];
