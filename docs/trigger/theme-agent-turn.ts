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
  lockedSources,
  violationFeedback,
  violationKey,
} from '../src/kigumi-studio/theme-agent/contrast.js';
import type {
  PreviousAnswer,
  ThemeAgentSnapshot,
} from '../src/kigumi-studio/theme-agent/custom-theme.js';
import {
  applyProposal,
  emptyProposal,
  locksOf,
  mergeProposals,
  splitLocked,
  themeProposalSchema,
  validateProposal,
  type ProposeThemeOutput,
} from '../src/kigumi-studio/theme-agent/proposal.js';
import { PROPERTY_DEFINITIONS } from '../src/kigumi-studio/lib/property-definitions.js';
import { AVAILABLE_FONTS } from '../src/kigumi-studio/lib/font-definitions.js';
import { describeLocks } from '../src/kigumi-studio/lib/locks.js';
import { SHADOW_COMPONENTS } from '../src/kigumi-studio/lib/shadow-components.js';

/** The model the task answers with; the prompt eval (docs/eval) uses it too. */
export const THEME_AGENT_MODEL = 'claude-sonnet-5-5';

/** Invalid proposals per answer before the answer ends without one. */
export const MAX_PROPOSAL_ATTEMPTS = 3;

/** Rounds in which the model corrects contrast violations, per answer. */
export const MAX_CONTRAST_CORRECTIONS = 2;

/**
 * Steps per answer: every invalid attempt, the first accepted proposal, its
 * corrections, and one step to explain.
 */
export const MAX_STEPS = MAX_PROPOSAL_ATTEMPTS + MAX_CONTRAST_CORRECTIONS + 2;

/** Per-step output ceiling, one of the Theme Agent's cost limits. */
export const MAX_OUTPUT_TOKENS = 4096;

const PROPOSE_DESCRIPTION = [
  'Propose changes to the custom theme. Name only the values to change.',
  'Studio validates the proposal; when it returns accepted: false, correct',
  'every listed error and propose again. An accepted proposal is checked for',
  'contrast; when it returns correctContrast: true, propose again with only',
  'the values that fix every pair listed in contrast. When contrast still',
  'lists pairs and correctContrast is false, do not propose again: name the',
  'pairs that still fail in your explanation. Values listed in locked are',
  'locked by the user: Studio holds them instead of applying them, and the',
  'user decides with Unlock and apply. Never say you changed them; say they',
  'are locked and wait for the user. Pairs also listed in lockedContrast',
  'fail because of locked values: fix them by proposing the locked values',
  'anyway, so Studio holds the fix for the user.',
].join(' ');

const NO_CONTRAST = {
  contrast: [],
  correctContrast: false,
  lockedContrast: [],
};

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
  // What the answer's proposals hold back for the user, merged in order.
  let heldSoFar = emptyProposal();
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
          ...NO_CONTRAST,
          locked: [],
        };
      }
      const validation = validateProposal(input);
      if (!validation.valid) {
        rejections += 1;
        return {
          accepted: false,
          errors: validation.errors,
          ...NO_CONTRAST,
          locked: [],
        };
      }
      onStatus(THEME_AGENT_STATUS.checking);
      // Locked values stay as they are in the browser; check what lands.
      const { free, held } = splitLocked(validation.proposal, snapshot.locked);
      theme = applyProposal(theme, free);
      heldSoFar = mergeProposals([heldSoFar, held]);
      const violations = checkContrast(theme);
      const contrast = violations.map(violationFeedback);
      // A pair the held values fix is fixed once the user applies them.
      const fixedByHeld = new Set(violations.map(violationKey));
      for (const left of checkContrast(applyProposal(theme, heldSoFar))) {
        fixedByHeld.delete(violationKey(left));
      }
      // A pair set by another value is the brand fill: Studio derives it
      // from the brand at a fixed lightness, so the only fix is another
      // brand hue, and the brand is the user's. It is reported, never
      // corrected.
      const correctable = violations.filter(
        (violation) =>
          !violation.setBy && !fixedByHeld.has(violationKey(violation))
      );
      // Every value behind these is locked: the model proposes the fix all
      // the same, and Studio holds it.
      const lockedContrast = correctable.flatMap((violation) => {
        const sources = lockedSources(violation, snapshot.locked);
        return sources.length > 0
          ? [`${violationFeedback(violation)}; locked: ${sources.join(', ')}`]
          : [];
      });
      const correctContrast =
        correctable.length > 0 && corrections < MAX_CONTRAST_CORRECTIONS;
      if (correctContrast) {
        corrections += 1;
        onStatus(THEME_AGENT_STATUS.fixing);
      } else if (correctable.length > 0) {
        settled = true;
      }
      return {
        accepted: true,
        errors: [],
        contrast,
        correctContrast,
        lockedContrast,
        locked: describeLocks(locksOf(held)),
      };
    },
  });

  const outOfAttempts: StopCondition<ToolSet> = () =>
    rejections >= MAX_PROPOSAL_ATTEMPTS;

  return { proposeTheme, outOfAttempts };
}

/** What Studio did with the last answer, which only the browser knows. */
function previousAnswerLines(previous: PreviousAnswer | undefined): string[] {
  if (!previous) return [];
  const lines = ['What Studio did with your last answer:'];
  switch (previous.status) {
    case 'applied':
      lines.push('- Applied to the theme.');
      break;
    case 'unchanged':
      lines.push('- Nothing was applied.');
      break;
    case 'rejected':
      lines.push(
        '- Studio refused it and applied nothing. Do not treat those changes as made; propose again if the request still stands.',
        ...previous.errors.map((error) => `  - ${error}`)
      );
      break;
    case 'undone':
      lines.push('- The user undid it.');
      break;
  }
  if (previous.held.length > 0) {
    lines.push(
      `- Locked, so not changed, and kept locked now that the user wrote again: ${previous.held.join(', ')}. Propose them again if the user still wants them.`
    );
  }
  if (previous.edited?.length) {
    lines.push(
      `- Changed by the user while you answered, so not changed, and the user's values stay now that the user wrote again: ${previous.edited.join(', ')}. Propose them again only if the user still wants them.`
    );
  }
  return [...lines, ''];
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
  const locked = describeLocks(snapshot.locked);
  return [
    'You are the Theme Agent in Kigumi Studio, the visual theme builder of Kigumi.',
    'You help the user build a custom Kigumi theme for light and dark mode.',
    'Speak of Kigumi and Kigumi themes only; never name the libraries Kigumi is built on.',
    '',
    'How you answer:',
    `- To change the theme, call ${THEME_AGENT_PROPOSE_TOOL} once with only the values to change. A new theme covers brand, surfaces, text, form controls and shadow in both modes, plus fonts, radius and spacing where they fit the request.`,
    '- Keep the theme readable in both modes (WCAG 2.1 AA): normal, quiet and link text need 4.5:1 on the raised, default and lowered surfaces; the form control border needs 3:1 on the form control background; white text on the brand fill needs 4.5:1.',
    "- The brand colour is the user's: change --wa-color-brand only when the latest message asks about the brand or asks to fix a failing brand fill pair (such as the accessibility warning; a short request to improve or fix, such as 'improve' or 'fix it', right after an answer that reported a failing brand fill pair asks for that fix), never as part of a mood such as warmer or calmer, and never on your own to fix contrast. Studio derives the brand fill from it at a fixed lightness, so only another hue or saturation fixes that pair; unless the user asks, a failing brand fill pair is reported, not corrected. A surface or text colour left at its Studio default is derived from --wa-color-neutral.",
    `- If ${THEME_AGENT_PROPOSE_TOOL} returns accepted: false, fix every listed error and call it again.`,
    `- If it returns correctContrast: true, call it again with only the values that fix the listed contrast pairs. A pair also in lockedContrast fails because of locked values: propose the locked value that fixes it anyway; Studio holds it, and your explanation says it is locked and that applying it fixes the pair. If contrast still lists pairs with correctContrast: false, stop proposing and name those pairs in your explanation.`,
    '- After the proposal is accepted, explain in two or three short sentences what changed and why. Do not list the values.',
    '- If the message needs no change to the theme, answer without calling the tool.',
    '- Reply in the language the user wrote in.',
    '- The current custom theme below is the truth. It may contain edits the user made by hand since your last answer; never rely on values from earlier in the conversation.',
    '',
    "Locked values (the user locked these in the sidebar; a name without a mode is locked in both modes). Leave them out of a proposal unless the latest message asks to change one of them. When it does, propose that change anyway: Studio does not apply it, it holds it, and the user applies it with Unlock and apply under your answer. Then say it is locked and waits for the user; never say you changed it. Unlock and apply is offered only under your latest answer: once the user writes again, what an earlier answer held stays locked and cannot be applied from the chat, so if the user still wants it, propose it again. The user can also turn off a value's Lock value switch in the sidebar:",
    ...(locked.length > 0 ? locked.map((line) => `- ${line}`) : ['- none']),
    '',
    ...previousAnswerLines(snapshot.previous),
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
    stopWhen: [stepCountIs(MAX_STEPS), outOfAttempts],
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal,
  });
}
