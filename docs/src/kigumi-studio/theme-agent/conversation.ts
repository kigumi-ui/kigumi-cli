import {
  cloneTheme,
  type CustomTheme,
  type ThemeAgentSnapshot,
} from './custom-theme';
import { validateProposal } from './proposal';

// The Theme Agent conversation: the single home of what an answer may do to
// the custom theme. No React, no network, no model. Studio stays the source
// of truth for the custom theme and passes it in with every event.

export type AnswerOutcome =
  { applied: true; theme: CustomTheme } | { applied: false; errors: string[] };

export type AnswerStatus = 'applied' | 'undone' | 'rejected';

export interface ThemeAgentConversation {
  /** The snapshot that travels with a message, taken from `theme` as it is now. */
  messageSent(theme: CustomTheme): ThemeAgentSnapshot;
  /**
   * Validate an answer's proposal and, if it is valid, return the custom
   * theme to apply: `current` with the proposal on top. An invalid proposal
   * is never applied. Receiving the same answer again returns the first
   * outcome and records nothing new.
   */
  answerReceived(
    answerId: string,
    proposal: unknown,
    current: CustomTheme
  ): AnswerOutcome;
  /**
   * The custom theme as it was before `answerId`, to apply. Undoing an answer
   * also undoes every answer applied after it. `undefined` when there is
   * nothing to undo.
   */
  undo(answerId: string): CustomTheme | undefined;
  answerStatus(answerId: string): AnswerStatus | undefined;
}

interface AnswerRecord {
  id: string;
  /** The custom theme just before this answer was applied. */
  before: CustomTheme | undefined;
  outcome: AnswerOutcome;
  undone: boolean;
}

function applyProposal(
  current: CustomTheme,
  proposal: {
    light: Record<string, string>;
    dark: Record<string, string>;
    shadowComponents?: string[];
  }
): CustomTheme {
  const next = cloneTheme(current);
  Object.assign(next.light, proposal.light);
  Object.assign(next.dark, proposal.dark);
  if (proposal.shadowComponents) {
    next.shadowComponents = [...proposal.shadowComponents];
  }
  return next;
}

export function createThemeAgentConversation(): ThemeAgentConversation {
  const answers: AnswerRecord[] = [];
  const find = (id: string) => answers.find((answer) => answer.id === id);

  return {
    messageSent(theme) {
      return { theme: cloneTheme(theme) };
    },

    answerReceived(answerId, proposal, current) {
      const known = find(answerId);
      if (known) return known.outcome;

      const validation = validateProposal(proposal);
      const outcome: AnswerOutcome = validation.valid
        ? { applied: true, theme: applyProposal(current, validation.proposal) }
        : { applied: false, errors: validation.errors };
      answers.push({
        id: answerId,
        before: validation.valid ? cloneTheme(current) : undefined,
        outcome,
        undone: false,
      });
      return outcome;
    },

    undo(answerId) {
      const index = answers.findIndex((answer) => answer.id === answerId);
      const answer = answers[index];
      if (!answer || !answer.before || answer.undone) return undefined;
      for (const later of answers.slice(index)) later.undone = true;
      return cloneTheme(answer.before);
    },

    answerStatus(answerId) {
      const answer = find(answerId);
      if (!answer) return undefined;
      if (!answer.outcome.applied) return 'rejected';
      return answer.undone ? 'undone' : 'applied';
    },
  };
}
