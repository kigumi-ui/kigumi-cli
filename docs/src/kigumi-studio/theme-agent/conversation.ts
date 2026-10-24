import {
  cloneTheme,
  type CustomTheme,
  type ThemeAgentSnapshot,
} from './custom-theme';
import { checkContrast, type ContrastViolation } from './contrast';
import {
  applyProposal,
  validateProposal,
  type ThemeProposal,
} from './proposal';

// The Theme Agent conversation: the single home of what an answer may do to
// the custom theme. No React, no network, no model. Studio stays the source
// of truth for the custom theme and passes it in with every event.

export type AnswerOutcome =
  | {
      applied: true;
      theme: CustomTheme;
      /** WCAG 2.1 AA contrast the applied theme still fails, both modes. */
      violations: ContrastViolation[];
    }
  | { applied: false; errors: string[] };

export type AnswerStatus = 'applied' | 'undone' | 'rejected';

export interface ThemeAgentConversation {
  /** The snapshot that travels with a message, taken from `theme` as it is now. */
  messageSent(theme: CustomTheme): ThemeAgentSnapshot;
  /**
   * Validate an answer's proposals and, if every one is valid, return the
   * custom theme to apply: `current` with the proposals on top, in order (a
   * contrast correction names only the values it fixes), and the contrast
   * violations that theme still has. It is applied with them; an invalid
   * proposal is never applied. Receiving the same answer again returns the
   * first outcome and records nothing new.
   */
  answerReceived(
    answerId: string,
    proposals: unknown[],
    current: CustomTheme
  ): AnswerOutcome;
  /**
   * The custom theme as it was before `answerId`, to apply. Undoing an answer
   * also undoes every answer applied after it. `undefined` when there is
   * nothing to undo.
   */
  undo(answerId: string): CustomTheme | undefined;
  answerStatus(answerId: string): AnswerStatus | undefined;
  /** The contrast violations an applied answer left; none once it is undone. */
  answerViolations(answerId: string): ContrastViolation[];
}

interface AnswerRecord {
  id: string;
  /** The custom theme just before this answer was applied. */
  before: CustomTheme | undefined;
  outcome: AnswerOutcome;
  undone: boolean;
}

export function createThemeAgentConversation(): ThemeAgentConversation {
  const answers: AnswerRecord[] = [];
  const find = (id: string) => answers.find((answer) => answer.id === id);

  return {
    messageSent(theme) {
      return { theme: cloneTheme(theme) };
    },

    answerReceived(answerId, proposals, current) {
      const known = find(answerId);
      if (known) return known.outcome;

      const valid: ThemeProposal[] = [];
      const errors: string[] = [];
      for (const proposal of proposals) {
        const validation = validateProposal(proposal);
        if (validation.valid) valid.push(validation.proposal);
        else errors.push(...validation.errors);
      }
      if (proposals.length === 0) errors.push('proposal: none in the answer');

      let outcome: AnswerOutcome;
      if (errors.length > 0) {
        outcome = { applied: false, errors };
      } else {
        const theme = valid.reduce(applyProposal, current);
        outcome = { applied: true, theme, violations: checkContrast(theme) };
      }
      answers.push({
        id: answerId,
        before: outcome.applied ? cloneTheme(current) : undefined,
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

    answerViolations(answerId) {
      const answer = find(answerId);
      if (!answer || answer.undone || !answer.outcome.applied) return [];
      return answer.outcome.violations;
    },
  };
}
