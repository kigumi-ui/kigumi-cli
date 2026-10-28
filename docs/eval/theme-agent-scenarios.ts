import type { ModelMessage } from 'ai';
import { THEME_AGENT_PROPOSE_TOOL } from '../src/kigumi-studio/theme-agent/constants';
import {
  checkContrast,
  paintedStyle,
  summarizeViolation,
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
import { CUSTOM_CSS_LOCK, NO_LOCKS } from '../src/kigumi-studio/lib/locks';

// The Theme Agent prompt eval (issue #203): fixed snapshots and messages for
// the real model, each judged in code from the answer's accepted proposals
// and the snapshot's locks, never from the reply text. The runner is
// theme-agent.eval.ts; these judges are proven in the unit tests.

const BRAND = '--wa-color-brand';
const FILL = '--wa-color-brand-fill-loud';
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
 * the browser validates them before it applies them, against the custom CSS
 * the answer was written for.
 */
export function acceptedProposals(
  toolResults: AnswerToolResult[],
  currentCSS = ''
): ThemeProposal[] {
  return toolResults.flatMap((result) => {
    if (result.toolName !== THEME_AGENT_PROPOSE_TOOL) return [];
    const output = result.output;
    if (typeof output !== 'object' || output === null) return [];
    if (!('accepted' in output) || output.accepted !== true) return [];
    const validation = validateProposal(result.input, currentCSS);
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
  if (proposal.customCSS !== undefined) values.push('customCSS');
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

/**
 * A mood leaves the brand alone, since it is the user's, and the unset
 * brand fill too, which would stop following the brand once set.
 */
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
  const fill = merged.light[FILL] ?? merged.dark[FILL];
  if (fill !== undefined) {
    return {
      pass: false,
      reason: `${FILL} was set to ${fill} for a mood; unset, it follows the brand`,
    };
  }
  return {
    pass: true,
    reason: `${BRAND} left alone; proposed: ${describeProposal(merged)}`,
  };
}

/**
 * A failing brand fill the user set is corrected like any other value: by
 * a new fill that carries white text in both modes, never by the brand.
 */
function setFillCorrected(
  proposals: ThemeProposal[],
  snapshot: ThemeAgentSnapshot
): Verdict {
  if (proposals.length === 0) return NO_PROPOSAL;
  const { merged, applied } = asStudioTakesIt(proposals, snapshot);
  const brand = merged.light[BRAND] ?? merged.dark[BRAND];
  if (brand !== undefined) {
    return {
      pass: false,
      reason: `${BRAND} was proposed as ${brand} to fix the brand fill; the brand is the user's, the fill is the value to change`,
    };
  }
  const left = checkContrast(applied).filter(
    (violation) => violation.background === FILL
  );
  if (left.length > 0) {
    return {
      pass: false,
      reason: `applied, it still fails: ${left.map(summarizeViolation).join('; ')}; proposed: ${describeProposal(merged)}`,
    };
  }
  return {
    pass: true,
    reason: `the brand fill is now ${applied.light[FILL]} in light mode and ${applied.dark[FILL]} in dark mode`,
  };
}

/** Custom CSS that names the card, by Kigumi wrapper class or tag. */
const NAMES_CARD = /\.Card\b|wa-card\b/;

/** Custom CSS that removes a border. */
const REMOVES_BORDER = /border(-width|-style)?\s*:\s*(none|0)/;

/**
 * Why `css` is not a bottom rule on the card's header part with the card's
 * own border gone, or `undefined` when it is. Read loosely: the model picks
 * the selectors (a Kigumi wrapper class or the tag) and the property names.
 */
function headerRuleMissing(css: string | undefined): string | undefined {
  if (!css) return 'no custom CSS was proposed';
  if (!NAMES_CARD.test(css)) return 'the custom CSS names no card';
  if (!/::part\(\s*header\s*\)/.test(css)) {
    return 'the custom CSS does not style the header part';
  }
  if (!/border-(bottom|block-end)/.test(css)) {
    return 'the custom CSS sets no bottom border';
  }
  if (!REMOVES_BORDER.test(css)) {
    return 'the custom CSS does not remove the card border';
  }
  return undefined;
}

/** The request no value can express is answered with custom CSS that lands. */
function headerRuleApplied(
  proposals: ThemeProposal[],
  snapshot: ThemeAgentSnapshot
): Verdict {
  if (proposals.length === 0) return NO_PROPOSAL;
  const { applied } = asStudioTakesIt(proposals, snapshot);
  const missing = headerRuleMissing(
    applied.customCSS === snapshot.theme.customCSS
      ? undefined
      : applied.customCSS
  );
  if (missing) return { pass: false, reason: missing };
  return { pass: true, reason: 'custom CSS applied: header rule, no border' };
}

/**
 * With the custom CSS locked, the same request is proposed anyway, as the
 * complete custom CSS, so Studio holds it for Unlock and apply.
 */
function headerRuleHeld(
  proposals: ThemeProposal[],
  snapshot: ThemeAgentSnapshot
): Verdict {
  if (proposals.length === 0) return NO_PROPOSAL;
  const { held } = asStudioTakesIt(proposals, snapshot);
  const missing = headerRuleMissing(held.customCSS);
  if (missing) {
    return {
      pass: false,
      reason: `${missing}, so Studio holds no custom CSS to unlock and apply`,
    };
  }
  if (!held.customCSS?.includes('text-transform')) {
    return {
      pass: false,
      reason:
        'the held custom CSS drops the rule the user wrote; a proposal is the complete custom CSS',
    };
  }
  return { pass: true, reason: 'complete custom CSS proposed and held' };
}

/**
 * A request with a part custom CSS can do (no card border) and a part it
 * may not (a pattern drawn with + signs needs an image): the answer still
 * lands, with custom CSS that removes the card border. On a preview it ran
 * out of output while thinking and answered nothing.
 */
function cardBorderRemoved(
  proposals: ThemeProposal[],
  snapshot: ThemeAgentSnapshot
): Verdict {
  if (proposals.length === 0) return NO_PROPOSAL;
  const { applied } = asStudioTakesIt(proposals, snapshot);
  const css = applied.customCSS;
  if (!css || css === snapshot.theme.customCSS) {
    return { pass: false, reason: 'no custom CSS was applied' };
  }
  if (!NAMES_CARD.test(css)) {
    return { pass: false, reason: 'the custom CSS names no card' };
  }
  if (!REMOVES_BORDER.test(css)) {
    return {
      pass: false,
      reason: 'the custom CSS does not remove the card border',
    };
  }
  return { pass: true, reason: 'custom CSS applied: card border removed' };
}

/**
 * A pattern on the page background is custom CSS on the page itself: body,
 * html or :root. On a preview the agent first tried Studio's own
 * .component-showcase, which no project has.
 */
function pagePatternApplied(
  proposals: ThemeProposal[],
  snapshot: ThemeAgentSnapshot
): Verdict {
  if (proposals.length === 0) return NO_PROPOSAL;
  const { applied } = asStudioTakesIt(proposals, snapshot);
  const css = applied.customCSS;
  if (!css || css === snapshot.theme.customCSS) {
    return { pass: false, reason: 'no custom CSS was applied' };
  }
  const pageRule =
    /(^|[},\s])(body|html|:root)\s*[,{][^}]*background[^}]*gradient/;
  if (!pageRule.test(css)) {
    return {
      pass: false,
      reason: 'no background gradient on body, html or :root',
    };
  }
  return { pass: true, reason: 'custom CSS applied: a pattern on the page' };
}

/**
 * Motion no value expresses is custom CSS with @keyframes, run on the
 * skeleton by its wrapper class or tag. The validator already holds every
 * animation to the reduced-motion query, so an applied one respects it.
 */
function skeletonShimmerApplied(
  proposals: ThemeProposal[],
  snapshot: ThemeAgentSnapshot
): Verdict {
  if (proposals.length === 0) return NO_PROPOSAL;
  const { applied } = asStudioTakesIt(proposals, snapshot);
  const css = applied.customCSS;
  if (!css || css === snapshot.theme.customCSS) {
    return { pass: false, reason: 'no custom CSS was applied' };
  }
  // Only [\w-] characters, so each name goes into a RegExp as it is.
  const names = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]);
  if (names.length === 0) {
    return { pass: false, reason: 'the custom CSS defines no @keyframes' };
  }
  const animatesSkeleton = names.some((name) =>
    new RegExp(
      `(\\.Skeleton\\b|wa-skeleton\\b)[^{}]*\\{[^}]*animation(-name)?\\s*:[^;}]*(?<![\\w-])${name}(?![\\w-])`
    ).test(css)
  );
  if (!animatesSkeleton) {
    return {
      pass: false,
      reason: `no skeleton rule runs ${names.join(', ')}`,
    };
  }
  return {
    pass: true,
    reason: 'custom CSS applied: a keyframes animation on skeletons',
  };
}

/** Every sidebar value, as the browser sends the custom theme. */
function studioTheme(overrides: Partial<CustomTheme> = {}): CustomTheme {
  const theme: CustomTheme = {
    light: {},
    dark: {},
    shadowComponents: [],
    customCSS: '',
  };
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
    customCSS: overrides.customCSS ?? theme.customCSS,
  };
}

/** A brand fill the user set, under white text at about 2.3:1. */
const FAILING_FILL = '#22c55e';

const CARD_HEADER_RULE =
  'No border on cards, only a bottom rule on the header part.';

const BRAND_LOCKED = { ...NO_LOCKS, light: [BRAND], dark: [BRAND] };

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
      'Brand locked, a failing brand fill the user set, "improve": the fill is corrected, the locked brand not proposed',
    snapshot: {
      theme: studioTheme({
        light: { [FILL]: FAILING_FILL },
        dark: { [FILL]: FAILING_FILL },
      }),
      locked: BRAND_LOCKED,
    },
    messages: [{ role: 'user', content: 'improve' }],
    judge: setFillCorrected,
  },
  {
    id: 'locked-dark-surface-warmer',
    description:
      'Dark surface locked, "make it warmer": the light surface changes, the dark surface is held or left alone',
    snapshot: {
      theme: studioTheme({ dark: { [SURFACE]: '#1c1917' } }),
      locked: { ...NO_LOCKS, dark: [SURFACE] },
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
  {
    id: 'set-fill-corrected',
    description:
      'Nothing locked, a failing brand fill the user set, "make the corners rounder": the fill is corrected in both modes, the brand left alone',
    snapshot: {
      theme: studioTheme({
        light: { [FILL]: FAILING_FILL },
        dark: { [FILL]: FAILING_FILL },
      }),
      locked: NO_LOCKS,
    },
    messages: [{ role: 'user', content: 'Make the corners rounder.' }],
    judge: setFillCorrected,
  },
  {
    id: 'card-header-rule',
    description:
      'Nothing locked, a change no value can express: answered with custom CSS that is applied',
    snapshot: { theme: studioTheme(), locked: NO_LOCKS },
    messages: [{ role: 'user', content: CARD_HEADER_RULE }],
    judge: headerRuleApplied,
  },
  {
    id: 'locked-custom-css-header-rule',
    description:
      'Custom CSS locked, the same request: the complete custom CSS is proposed and held',
    snapshot: {
      theme: studioTheme({
        customCSS: '.Button { text-transform: uppercase; }',
      }),
      locked: CUSTOM_CSS_LOCK,
    },
    messages: [{ role: 'user', content: CARD_HEADER_RULE }],
    judge: headerRuleHeld,
  },
  {
    id: 'card-border-plus-pattern',
    description:
      'Nothing locked, no card border plus a + pattern: the answer lands with custom CSS instead of running out of output',
    snapshot: { theme: studioTheme(), locked: NO_LOCKS },
    messages: [
      {
        role: 'user',
        content: 'no border on cards and a dot gradient with + as dots',
      },
    ],
    judge: cardBorderRemoved,
  },
  {
    id: 'page-dot-pattern',
    description:
      'Nothing locked, a dot pattern on the page background: custom CSS on body, html or :root',
    snapshot: { theme: studioTheme(), locked: NO_LOCKS },
    messages: [
      {
        role: 'user',
        content: 'Give the page background a subtle dot pattern.',
      },
    ],
    judge: pagePatternApplied,
  },
  {
    id: 'skeleton-shimmer',
    description:
      'Nothing locked, a subtle shimmer on skeletons: @keyframes run on the skeleton, inside the reduced-motion query',
    snapshot: { theme: studioTheme(), locked: NO_LOCKS },
    messages: [{ role: 'user', content: 'Add a subtle shimmer on skeletons.' }],
    judge: skeletonShimmerApplied,
  },
];
