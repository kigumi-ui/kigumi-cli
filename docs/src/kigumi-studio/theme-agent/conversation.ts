import { SHADOW_COMPONENTS_LOCK } from '../lib/locks';
import { PROPERTIES_BY_VAR } from '../lib/property-definitions';
import {
  cloneTheme,
  componentListKey,
  THEME_AGENT_MODES,
  type CustomTheme,
  type PreviousAnswer,
  type ThemeAgentMode,
  type ThemeAgentSnapshot,
} from './custom-theme';
import { checkContrast, type ContrastViolation } from './contrast';
import { validateProposal, type ThemeProposal } from './proposal';

// The Theme Agent conversation: the single home of what an answer may do to
// the custom theme. No React, no network, no model. Studio stays the source
// of truth for the custom theme and its locked values, and passes both in
// with every event.
//
// Locked values are protected here, in code, not by the prompt (ADR 0007,
// ADR 0010): an answer never changes a locked value; what it would change is
// held, and only the user's "Unlock and apply" applies it.

/** A change an answer proposed to a locked value, held back. */
export type HeldChange =
  | {
      kind: 'value';
      cssVar: string;
      /** The proposed value per mode it would change. */
      proposed: Partial<Record<ThemeAgentMode, string>>;
    }
  | { kind: 'shadowComponents'; proposed: string[] };

export type AnswerOutcome =
  | {
      applied: true;
      /** `current` with every change on top that touches no locked value. */
      theme: CustomTheme;
      held: HeldChange[];
      /** WCAG 2.1 AA contrast the applied theme still fails, both modes. */
      violations: ContrastViolation[];
    }
  | { applied: false; errors: string[] };

/**
 * `applied` when the answer changed the custom theme, directly or through
 * "Unlock and apply"; `unchanged` when it was valid but changed nothing, for
 * example because every change it proposed is to a locked value.
 */
export type AnswerStatus = 'applied' | 'unchanged' | 'undone' | 'rejected';

export interface ThemeAgentConversation {
  /**
   * The snapshot that travels with a message, taken as it is now, with what
   * Studio did with the last answer.
   */
  messageSent(
    theme: CustomTheme,
    locked: readonly string[]
  ): ThemeAgentSnapshot;
  /**
   * Validate an answer's proposals and, if every one is valid, return the
   * custom theme to apply: `current` with the proposals on top, in order (a
   * contrast correction names only the values it fixes), except for locked
   * values, which are held. Also the contrast violations that theme still
   * has; it is applied with them. An invalid proposal is never applied.
   * Receiving the same answer again returns the first outcome and records
   * nothing new.
   */
  answerReceived(
    answerId: string,
    proposals: unknown[],
    current: CustomTheme,
    locked: readonly string[]
  ): AnswerOutcome;
  /** What `answerId` held back because it was locked, and whether it still is. */
  heldChanges(answerId: string): { changes: HeldChange[]; held: boolean };
  /**
   * "Unlock and apply": `current` with the answer's held changes on top, to
   * apply, and the lock keys to unlock. `undefined` when nothing is held.
   */
  applyHeld(
    answerId: string,
    current: CustomTheme
  ): { theme: CustomTheme; unlock: string[] } | undefined;
  /**
   * `current` with the values `answerId` wrote put back as they were before
   * it, held changes it applied included, to apply. A value changed since,
   * by the user or a later answer, stays as it is. `undefined` when there is
   * nothing to undo.
   */
  undo(answerId: string, current: CustomTheme): CustomTheme | undefined;
  answerStatus(answerId: string): AnswerStatus | undefined;
  /** Why Studio refused an answer; none when it did not. */
  answerErrors(answerId: string): string[];
  /** The contrast violations an applied answer left; none once it is undone. */
  answerViolations(answerId: string): ContrastViolation[];
}

interface AnswerRecord {
  id: string;
  /** The custom theme just before this answer. */
  before: CustomTheme | undefined;
  outcome: AnswerOutcome;
  /** What this answer wrote, by `mode cssVar`, directly or by unlock and apply. */
  wrote: Map<string, string>;
  /** The shadow component list it wrote, if it wrote one. */
  wroteShadowComponents?: string[];
  held: HeldChange[];
  heldApplied: boolean;
  undone: boolean;
}

function sameList(a: string[], b: string[]): boolean {
  return componentListKey(a) === componentListKey(b);
}

/** An answer's proposals as one: later values win, as a correction intends. */
function mergeProposals(proposals: ThemeProposal[]): ThemeProposal {
  const merged: ThemeProposal = { light: {}, dark: {} };
  for (const proposal of proposals) {
    Object.assign(merged.light, proposal.light);
    Object.assign(merged.dark, proposal.dark);
    if (proposal.shadowComponents) {
      merged.shadowComponents = [...proposal.shadowComponents];
    }
  }
  return merged;
}

/**
 * `current` with `proposal` on top, except what `locked` covers, and what
 * that leaves held. A value proposed equal to what is there is no change.
 */
function applyUnlocked(
  current: CustomTheme,
  proposal: ThemeProposal,
  locked: ReadonlySet<string>
): { theme: CustomTheme; held: HeldChange[] } {
  const theme = cloneTheme(current);
  const heldValues = new Map<string, Partial<Record<ThemeAgentMode, string>>>();
  for (const mode of THEME_AGENT_MODES) {
    for (const [cssVar, value] of Object.entries(proposal[mode])) {
      if (current[mode][cssVar] === value) continue;
      if (!locked.has(cssVar)) {
        theme[mode][cssVar] = value;
        continue;
      }
      heldValues.set(cssVar, { ...heldValues.get(cssVar), [mode]: value });
    }
  }
  const held: HeldChange[] = [...heldValues].map(([cssVar, proposed]) => ({
    kind: 'value',
    cssVar,
    proposed,
  }));
  const list = proposal.shadowComponents;
  if (list && !sameList(current.shadowComponents, list)) {
    if (locked.has(SHADOW_COMPONENTS_LOCK)) {
      held.push({ kind: 'shadowComponents', proposed: [...list] });
    } else {
      theme.shadowComponents = [...list];
    }
  }
  return { theme, held };
}

/** What `theme` holds that `before` did not, by `mode cssVar`. */
function written(before: CustomTheme, theme: CustomTheme): Map<string, string> {
  const wrote = new Map<string, string>();
  for (const mode of THEME_AGENT_MODES) {
    for (const [cssVar, value] of Object.entries(theme[mode])) {
      if (before[mode][cssVar] !== value) wrote.set(`${mode} ${cssVar}`, value);
    }
  }
  return wrote;
}

function heldKey(change: HeldChange): string {
  return change.kind === 'shadowComponents'
    ? SHADOW_COMPONENTS_LOCK
    : change.cssVar;
}

export function createThemeAgentConversation(): ThemeAgentConversation {
  const answers: AnswerRecord[] = [];
  const find = (id: string) => answers.find((answer) => answer.id === id);

  const statusOf = (answer: AnswerRecord): AnswerStatus => {
    if (!answer.outcome.applied) return 'rejected';
    if (answer.undone) return 'undone';
    return answer.wrote.size > 0 || answer.wroteShadowComponents
      ? 'applied'
      : 'unchanged';
  };

  const previousAnswer = (): PreviousAnswer | undefined => {
    const last = answers.at(-1);
    if (!last) return undefined;
    const status = statusOf(last);
    return {
      status,
      held:
        status === 'undone' || last.heldApplied ? [] : last.held.map(heldKey),
      errors: last.outcome.applied ? [] : [...last.outcome.errors],
    };
  };

  return {
    messageSent(theme, locked) {
      const previous = previousAnswer();
      return {
        theme: cloneTheme(theme),
        locked: locked.filter(
          (key) => key === SHADOW_COMPONENTS_LOCK || PROPERTIES_BY_VAR.has(key)
        ),
        ...(previous ? { previous } : {}),
      };
    },

    answerReceived(answerId, proposals, current, locked) {
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
      if (errors.length > 0) {
        const outcome: AnswerOutcome = { applied: false, errors };
        answers.push({
          id: answerId,
          before: undefined,
          outcome,
          wrote: new Map(),
          held: [],
          heldApplied: false,
          undone: false,
        });
        return outcome;
      }

      const { theme, held } = applyUnlocked(
        current,
        mergeProposals(valid),
        new Set(locked)
      );
      const outcome: AnswerOutcome = {
        applied: true,
        theme,
        held,
        violations: checkContrast(theme),
      };
      answers.push({
        id: answerId,
        before: cloneTheme(current),
        outcome,
        wrote: written(current, theme),
        ...(sameList(theme.shadowComponents, current.shadowComponents)
          ? {}
          : { wroteShadowComponents: [...theme.shadowComponents] }),
        held,
        heldApplied: false,
        undone: false,
      });
      return outcome;
    },

    heldChanges(answerId) {
      const answer = find(answerId);
      if (!answer || answer.undone) return { changes: [], held: false };
      return { changes: answer.held, held: !answer.heldApplied };
    },

    applyHeld(answerId, current) {
      const answer = find(answerId);
      if (
        !answer ||
        answer.undone ||
        answer.heldApplied ||
        answer.held.length === 0 ||
        !answer.outcome.applied
      ) {
        return undefined;
      }
      const theme = cloneTheme(current);
      const unlock: string[] = [];
      for (const change of answer.held) {
        if (change.kind === 'shadowComponents') {
          theme.shadowComponents = [...change.proposed];
          answer.wroteShadowComponents = [...change.proposed];
          unlock.push(SHADOW_COMPONENTS_LOCK);
          continue;
        }
        for (const mode of THEME_AGENT_MODES) {
          const value = change.proposed[mode];
          if (value === undefined) continue;
          theme[mode][change.cssVar] = value;
          answer.wrote.set(`${mode} ${change.cssVar}`, value);
        }
        unlock.push(change.cssVar);
      }
      answer.heldApplied = true;
      // The theme changed, so its contrast is checked again.
      answer.outcome = { ...answer.outcome, violations: checkContrast(theme) };
      return { theme, unlock };
    },

    undo(answerId, current) {
      const answer = find(answerId);
      if (!answer || !answer.before || answer.undone) return undefined;
      const before = answer.before;
      const next = cloneTheme(current);
      for (const [key, value] of answer.wrote) {
        const [mode, cssVar] = key.split(' ') as [ThemeAgentMode, string];
        // Changed since, by the user or a later answer: theirs stays.
        if (current[mode][cssVar] !== value) continue;
        next[mode][cssVar] = before[mode][cssVar];
      }
      const list = answer.wroteShadowComponents;
      if (list && sameList(current.shadowComponents, list)) {
        next.shadowComponents = [...before.shadowComponents];
      }
      answer.undone = true;
      return next;
    },

    answerStatus(answerId) {
      const answer = find(answerId);
      return answer ? statusOf(answer) : undefined;
    },

    answerErrors(answerId) {
      const outcome = find(answerId)?.outcome;
      return outcome && !outcome.applied ? [...outcome.errors] : [];
    },

    answerViolations(answerId) {
      const answer = find(answerId);
      if (!answer || answer.undone || !answer.outcome.applied) return [];
      return answer.outcome.violations;
    },
  };
}
