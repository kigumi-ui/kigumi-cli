import {
  stepCountIs,
  tool,
  type LanguageModel,
  type ModelMessage,
  type streamText as aiStreamText,
} from 'ai';
import { THEME_AGENT_PROPOSE_TOOL } from '../src/kigumi-studio/theme-agent/constants.js';
import type { ThemeAgentSnapshot } from '../src/kigumi-studio/theme-agent/custom-theme.js';
import {
  themeProposalSchema,
  validateProposal,
  type ProposeThemeOutput,
} from '../src/kigumi-studio/theme-agent/proposal.js';
import { PROPERTY_DEFINITIONS } from '../src/kigumi-studio/lib/property-definitions.js';
import { AVAILABLE_FONTS } from '../src/kigumi-studio/lib/font-definitions.js';
import { SHADOW_COMPONENTS } from '../src/kigumi-studio/lib/shadow-components.js';

/** Proposals the model may make per answer, the first included. */
export const MAX_PROPOSAL_ATTEMPTS = 3;

/** Per-step output ceiling, one of the Theme Agent's cost limits. */
export const MAX_OUTPUT_TOKENS = 2048;

const proposeTheme = tool({
  description: [
    'Propose changes to the custom theme. Name only the values to change.',
    'Studio validates the proposal; when it returns accepted: false, correct',
    'every listed error and propose again.',
  ].join(' '),
  inputSchema: themeProposalSchema,
  execute: async (input): Promise<ProposeThemeOutput> => {
    const validation = validateProposal(input);
    return validation.valid
      ? { accepted: true, errors: [] }
      : { accepted: false, errors: validation.errors };
  },
});

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
    '- Keep text readable: normal, quiet and link text need 4.5:1 contrast on every surface.',
    `- If ${THEME_AGENT_PROPOSE_TOOL} returns accepted: false, fix every listed error and call it again.`,
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
  abortSignal?: AbortSignal;
}

/**
 * One Theme Agent answer: the model proposes through `propose_theme`, every
 * proposal is validated, and a rejected one goes back to the model with its
 * errors until it is accepted or the attempts run out.
 */
export function themeAgentTurn({
  streamText,
  model,
  messages,
  snapshot,
  abortSignal,
}: ThemeAgentTurnOptions) {
  return streamText({
    model,
    system: themeAgentSystemPrompt(snapshot),
    messages,
    tools: { [THEME_AGENT_PROPOSE_TOOL]: proposeTheme },
    // Each attempt is a step; one more lets the model explain after the last.
    stopWhen: stepCountIs(MAX_PROPOSAL_ATTEMPTS + 1),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal,
  });
}
