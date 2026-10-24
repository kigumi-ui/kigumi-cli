import {
  stepCountIs,
  tool,
  type StopCondition,
  type ToolSet,
  type LanguageModel,
  type ModelMessage,
  type streamText as aiStreamText,
} from 'ai';
import {
  THEME_AGENT_PROPOSE_TOOL,
  THEME_AGENT_STATUS,
} from '../src/kigumi-studio/theme-agent/constants.js';
import {
  checkContrast,
  describeViolation,
} from '../src/kigumi-studio/theme-agent/contrast.js';
import type { ThemeAgentSnapshot } from '../src/kigumi-studio/theme-agent/custom-theme.js';
import {
  applyProposal,
  themeProposalSchema,
  validateProposal,
  type ProposeThemeOutput,
} from '../src/kigumi-studio/theme-agent/proposal.js';
import { PROPERTY_DEFINITIONS } from '../src/kigumi-studio/lib/property-definitions.js';
import { AVAILABLE_FONTS } from '../src/kigumi-studio/lib/font-definitions.js';
import { SHADOW_COMPONENTS } from '../src/kigumi-studio/lib/shadow-components.js';

/** Invalid proposals per answer before the answer ends without one. */
export const MAX_PROPOSAL_ATTEMPTS = 3;

/** Rounds in which the model corrects contrast violations, per answer. */
export const MAX_CONTRAST_CORRECTIONS = 2;

/** Per-step output ceiling, one of the Theme Agent's cost limits. */
export const MAX_OUTPUT_TOKENS = 4096;

const PROPOSE_DESCRIPTION = [
  'Propose changes to the custom theme. Name only the values to change.',
  'Studio validates the proposal; when it returns accepted: false, correct',
  'every listed error and propose again. An accepted proposal is checked for',
  'contrast; when it returns correctContrast: true, propose again with only',
  'the values that fix every pair listed in contrast. When contrast still',
  'lists pairs and correctContrast is false, do not propose again: name the',
  'pairs that still fail in your explanation.',
].join(' ');

/**
 * The `propose_theme` tool for one answer. It keeps the custom theme as the
 * answer's accepted proposals leave it, so a correction that names only its
 * fixes is checked together with the proposal it corrects.
 */
function proposeThemeTool(
  snapshot: ThemeAgentSnapshot,
  onStatus: (step: string) => void
) {
  let theme = snapshot.theme;
  let corrections = 0;
  let rejections = 0;
  // Set once a theme went back with violations and no correction left.
  let settled = false;

  const proposeTheme = tool({
    description: PROPOSE_DESCRIPTION,
    inputSchema: themeProposalSchema,
    execute: async (input): Promise<ProposeThemeOutput> => {
      if (settled) {
        return {
          accepted: false,
          errors: [
            'No contrast corrections are left in this answer; explain the pairs that still fail instead.',
          ],
          contrast: [],
          correctContrast: false,
        };
      }
      const validation = validateProposal(input);
      if (!validation.valid) {
        rejections += 1;
        return {
          accepted: false,
          errors: validation.errors,
          contrast: [],
          correctContrast: false,
        };
      }
      onStatus(THEME_AGENT_STATUS.checking);
      theme = applyProposal(theme, validation.proposal);
      const contrast = checkContrast(theme).map(describeViolation);
      const correctContrast =
        contrast.length > 0 && corrections < MAX_CONTRAST_CORRECTIONS;
      if (correctContrast) {
        corrections += 1;
        onStatus(THEME_AGENT_STATUS.fixing);
      } else if (contrast.length > 0) {
        settled = true;
      }
      return { accepted: true, errors: [], contrast, correctContrast };
    },
  });

  const outOfAttempts: StopCondition<ToolSet> = () =>
    rejections >= MAX_PROPOSAL_ATTEMPTS;

  return { proposeTheme, outOfAttempts };
}

function propertyLine(property: (typeof PROPERTY_DEFINITIONS)[number]): string {
  const modes = property.modeDependent
    ? 'one value per mode'
    : 'same in both modes, name it in light';
  let values: string;
  switch (property.inputType) {
    case 'color':
      values = 'colour #rrggbb';
      break;
    case 'slider':
      values = `number ${property.min} to ${property.max} in steps of ${
        property.step
      }${property.unit ? `, in ${property.unit}` : ''}`;
      break;
    case 'select':
      values =
        property.group === 'typography-families'
          ? 'a font value from the font list'
          : `one of ${(property.options ?? [])
              .map((o) => o.value)
              .join(' | ')}`;
      break;
    case 'text':
      values = 'plain value';
      break;
  }
  return `- ${property.cssVar} (${property.label}): ${values}; ${modes}`;
}

/** The system prompt for one turn, built around the snapshot sent with it. */
export function themeAgentSystemPrompt(snapshot: ThemeAgentSnapshot): string {
  return [
    'You are the Theme Agent in Kigumi Studio, the visual theme builder of Kigumi.',
    'You help the user build a custom Kigumi theme for light and dark mode.',
    'Speak of Kigumi and Kigumi themes only; never name the libraries Kigumi is built on.',
    '',
    'How you answer:',
    `- To change the theme, call ${THEME_AGENT_PROPOSE_TOOL} once with only the values to change. A new theme covers brand, surfaces, text, form controls and shadow in both modes, plus fonts, radius and spacing where they fit the request.`,
    '- Keep the theme readable in both modes (WCAG 2.1 AA): normal, quiet and link text need 4.5:1 on the raised, default and lowered surfaces; the form control border needs 3:1 on the form control background; white text on the brand fill needs 4.5:1.',
    '- Studio derives the brand fill from --wa-color-brand at a fixed lightness, so only its hue and saturation change that contrast. A surface or text colour left at its Studio default is derived from --wa-color-neutral.',
    `- If ${THEME_AGENT_PROPOSE_TOOL} returns accepted: false, fix every listed error and call it again.`,
    `- If it returns correctContrast: true, call it again with only the values that fix the listed contrast pairs. If contrast still lists pairs with correctContrast: false, stop proposing and name those pairs in your explanation.`,
    '- After the proposal is accepted, explain in two or three short sentences what changed and why. Do not list the values.',
    '- If the message needs no change to the theme, answer without calling the tool.',
    '- Reply in the language the user wrote in.',
    '- The current custom theme below is the truth. It may contain edits the user made by hand since your last answer; never rely on values from earlier in the conversation.',
    '',
    'Values you may set (nothing else, no custom CSS):',
    ...PROPERTY_DEFINITIONS.map(propertyLine),
    '',
    'Font list (use the value exactly):',
    ...AVAILABLE_FONTS.map((font) => `- ${font.name}: ${font.value}`),
    '',
    `Components that can get a shadow (shadowComponents): ${SHADOW_COMPONENTS.map(
      (c) => c.className
    ).join(', ')}`,
    '',
    'Current custom theme:',
    JSON.stringify(snapshot.theme),
  ].join('\n');
}

interface ThemeAgentTurnOptions {
  /** The chat.agent's managed `streamText`, or the AI SDK's in tests. */
  streamText: typeof aiStreamText;
  model: LanguageModel;
  messages: ModelMessage[];
  snapshot: ThemeAgentSnapshot;
  /** Status steps for the chat, such as "Checking contrast…". */
  onStatus?: (step: string) => void;
  abortSignal?: AbortSignal;
}

/**
 * One Theme Agent answer: the model proposes through `propose_theme`, every
 * proposal is validated, and a rejected one goes back to the model with its
 * errors until it is accepted or the attempts run out. An accepted proposal
 * is checked for contrast; its violations go back to the model for at most
 * `MAX_CONTRAST_CORRECTIONS` rounds, after which the theme is accepted with
 * them and the browser reports them.
 */
export function themeAgentTurn({
  streamText,
  model,
  messages,
  snapshot,
  onStatus = () => {},
  abortSignal,
}: ThemeAgentTurnOptions) {
  const { proposeTheme, outOfAttempts } = proposeThemeTool(snapshot, onStatus);
  return streamText({
    model,
    system: themeAgentSystemPrompt(snapshot),
    messages,
    tools: { [THEME_AGENT_PROPOSE_TOOL]: proposeTheme },
    // Each proposal is a step: the invalid attempts, the first accepted one
    // and its corrections, then one step to explain.
    stopWhen: [
      stepCountIs(MAX_PROPOSAL_ATTEMPTS + MAX_CONTRAST_CORRECTIONS + 2),
      outOfAttempts,
    ],
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal,
  });
}
