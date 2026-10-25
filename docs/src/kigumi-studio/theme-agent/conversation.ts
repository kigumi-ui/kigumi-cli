import {
  describeLocks,
  NO_LOCKS,
  parseLocks,
  SHADOW_COMPONENTS_LOCK,
  valueLock,
  withLocks,
  type LockedValues,
} from '../lib/locks';
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
import {
  applyProposal,
  splitLocked,
  validateProposal,
  type ThemeProposal,
} from './proposal';

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
      /** The proposed value per locked mode it would change. */
      proposed: Partial<Record<ThemeAgentMode, string>>;
      /** The value in those modes when the answer arrived. */
      was: Partial<Record<ThemeAgentMode, string>>;
    }
  | { kind: 'shadowComponents'; proposed: string[]; was: string[] };

/**
 * What became of a held change: still `held` and offered to unlock and
 * apply; `applied` by the user; `changed` since the answer, so not applied;
 * or `kept` locked because the user sent the next message.
 */
export type HeldState = 'held' | 'applied' | 'changed' | 'kept';

export interface HeldEntry {
  change: HeldChange;
  state: HeldState;
}

export type AnswerOutcome =
  | {
      applied: true;
      /** `current` with every change on top that touches no locked value. */
      theme: CustomTheme;
      /** What is still held for the user to unlock and apply. */
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
   * Studio did with the last answer. Every change still held is kept locked
   * from here on: the next message moves the conversation past it.
   */
  messageSent(theme: CustomTheme, locked: LockedValues): ThemeAgentSnapshot;
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
    locked: LockedValues
  ): AnswerOutcome;
  /** What `answerId` held back because it was locked, and what became of it. */
  heldChanges(answerId: string): HeldEntry[];
  /**
   * "Unlock and apply" for the held change at `index`, or every held one
   * without it: `current` with them on top, to apply, and the locks to lift.
   * A value changed since the answer stays as it is and its lock stays too.
   * `undefined` when nothing is held.
   */
  applyHeld(
    answerId: string,
    current: CustomTheme,
    index?: number
  ):
    | {
        theme: CustomTheme;
        unlock: LockedValues;
        applied: number;
        changed: number;
      }
    | undefined;
  /**
   * `current` with the values `answerId` wrote put back as they were before
   * it, held changes it applied included, to apply, and the locks "Unlock and
   * apply" lifted, to lock again. A value changed since, by the user or a
   * later answer, stays as it is. `undefined` when there is nothing to undo.
   */
  undo(
    answerId: string,
    current: CustomTheme
  ): { theme: CustomTheme; relock: LockedValues } | undefined;
  answerStatus(answerId: string): AnswerStatus | undefined;
  /** Why Studio refused an answer; none when it did not. */
  answerErrors(answerId: string): string[];
  /** The contrast violations an applied answer left; none once it is undone. */
  answerViolations(answerId: string): ContrastViolation[];
}

/** What one answer did to the custom theme. */
interface AnswerEffect {
  /** The values it wrote per mode, directly or by unlock and apply. */
  wrote: Record<ThemeAgentMode, Map<string, string>>;
  /** The shadow component list it wrote, if it wrote one. */
  wroteShadowComponents?: string[];
  /** What it proposed for locked values, and what became of each. */
  held: HeldEntry[];
}

interface AnswerRecord {
  id: string;
  /** The custom theme just before this answer. */
  before: CustomTheme | undefined;
  outcome: AnswerOutcome;
  effect: AnswerEffect;
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

/** The changes `held` would make to `current`; equal values are none. */
function heldFrom(held: ThemeProposal, current: CustomTheme): HeldChange[] {
  const changes: HeldChange[] = [];
  const cssVars = new Set([
    ...Object.keys(held.light),
    ...Object.keys(held.dark),
  ]);
  for (const cssVar of cssVars) {
    const proposed: Partial<Record<ThemeAgentMode, string>> = {};
    const was: Partial<Record<ThemeAgentMode, string>> = {};
    for (const mode of THEME_AGENT_MODES) {
      const value = held[mode][cssVar];
      if (value === undefined || current[mode][cssVar] === value) continue;
      proposed[mode] = value;
      was[mode] = current[mode][cssVar];
    }
    if (Object.keys(proposed).length > 0) {
      changes.push({ kind: 'value', cssVar, proposed, was });
    }
  }
  const list = held.shadowComponents;
  if (list && !sameList(current.shadowComponents, list)) {
    changes.push({
      kind: 'shadowComponents',
      proposed: [...list],
      was: [...current.shadowComponents],
    });
  }
  return changes;
}

/** The locks a held change sits behind. */
function heldLock(change: HeldChange): LockedValues {
  return change.kind === 'shadowComponents'
    ? SHADOW_COMPONENTS_LOCK
    : valueLock(
        change.cssVar,
        THEME_AGENT_MODES.filter((mode) => mode in change.proposed)
      );
}

/** Whether `current` still has what the answer found when it held `change`. */
function unchangedSince(change: HeldChange, current: CustomTheme): boolean {
  if (change.kind === 'shadowComponents') {
    return sameList(current.shadowComponents, change.was);
  }
  return THEME_AGENT_MODES.every(
    (mode) =>
      !(mode in change.proposed) ||
      current[mode][change.cssVar] === change.was[mode]
  );
}

/** What `theme` holds that `before` did not, per mode. */
function written(
  before: CustomTheme,
  theme: CustomTheme
): Record<ThemeAgentMode, Map<string, string>> {
  const wrote = {
    light: new Map<string, string>(),
    dark: new Map<string, string>(),
  };
  for (const mode of THEME_AGENT_MODES) {
    for (const [cssVar, value] of Object.entries(theme[mode])) {
      if (before[mode][cssVar] !== value) wrote[mode].set(cssVar, value);
    }
  }
  return wrote;
}

function locksOfEntries(entries: HeldEntry[]): LockedValues {
  return entries.reduce(
    (locks, entry) => withLocks(locks, heldLock(entry.change), true),
    NO_LOCKS
  );
}

export function createThemeAgentConversation(): ThemeAgentConversation {
  const answers: AnswerRecord[] = [];
  const find = (id: string) => answers.find((answer) => answer.id === id);

  const statusOf = (answer: AnswerRecord): AnswerStatus => {
    if (!answer.outcome.applied) return 'rejected';
    if (answer.undone) return 'undone';
    const { wrote, wroteShadowComponents } = answer.effect;
    return wrote.light.size > 0 || wrote.dark.size > 0 || wroteShadowComponents
      ? 'applied'
      : 'unchanged';
  };

  const previousAnswer = (): PreviousAnswer | undefined => {
    const last = answers.at(-1);
    if (!last) return undefined;
    const status = statusOf(last);
    const notApplied = last.effect.held.filter(
      (entry) => entry.state !== 'applied'
    );
    return {
      status,
      held:
        status === 'undone' ? [] : describeLocks(locksOfEntries(notApplied)),
      errors: last.outcome.applied ? [] : [...last.outcome.errors],
    };
  };

  return {
    messageSent(theme, locked) {
      const previous = previousAnswer();
      for (const answer of answers) {
        for (const entry of answer.effect.held) {
          if (entry.state === 'held') entry.state = 'kept';
        }
        if (answer.outcome.applied) {
          answer.outcome = { ...answer.outcome, held: [] };
        }
      }
      return {
        theme: cloneTheme(theme),
        locked: parseLocks(locked),
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
          effect: { wrote: { light: new Map(), dark: new Map() }, held: [] },
          undone: false,
        });
        return outcome;
      }

      const { free, held: lockedPart } = splitLocked(
        mergeProposals(valid),
        locked
      );
      const theme = applyProposal(current, free);
      const held = heldFrom(lockedPart, current);
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
        effect: {
          wrote: written(current, theme),
          ...(sameList(theme.shadowComponents, current.shadowComponents)
            ? {}
            : { wroteShadowComponents: [...theme.shadowComponents] }),
          held: held.map((change) => ({ change, state: 'held' })),
        },
        undone: false,
      });
      return outcome;
    },

    heldChanges(answerId) {
      const answer = find(answerId);
      if (!answer || answer.undone) return [];
      return answer.effect.held;
    },

    applyHeld(answerId, current, index) {
      const answer = find(answerId);
      if (!answer || answer.undone || !answer.outcome.applied) return undefined;
      const { effect } = answer;
      const chosen = effect.held.filter(
        (entry, i) =>
          entry.state === 'held' && (index === undefined || i === index)
      );
      if (chosen.length === 0) return undefined;

      const theme = cloneTheme(current);
      let unlock = NO_LOCKS;
      let applied = 0;
      for (const entry of chosen) {
        const { change } = entry;
        if (!unchangedSince(change, current)) {
          entry.state = 'changed';
          continue;
        }
        if (change.kind === 'shadowComponents') {
          theme.shadowComponents = [...change.proposed];
          effect.wroteShadowComponents = [...change.proposed];
        } else {
          for (const mode of THEME_AGENT_MODES) {
            const value = change.proposed[mode];
            if (value === undefined) continue;
            theme[mode][change.cssVar] = value;
            effect.wrote[mode].set(change.cssVar, value);
          }
        }
        unlock = withLocks(unlock, heldLock(change), true);
        entry.state = 'applied';
        applied += 1;
      }
      // The theme changed, so its contrast is checked again, and the outcome
      // keeps only what is still held.
      answer.outcome = {
        ...answer.outcome,
        held: effect.held
          .filter((entry) => entry.state === 'held')
          .map((entry) => entry.change),
        violations: checkContrast(theme),
      };
      return { theme, unlock, applied, changed: chosen.length - applied };
    },

    undo(answerId, current) {
      const answer = find(answerId);
      if (!answer || !answer.before || answer.undone) return undefined;
      const { before, effect } = answer;
      const theme = cloneTheme(current);
      for (const mode of THEME_AGENT_MODES) {
        for (const [cssVar, value] of effect.wrote[mode]) {
          // Changed since, by the user or a later answer: theirs stays.
          if (current[mode][cssVar] !== value) continue;
          theme[mode][cssVar] = before[mode][cssVar];
        }
      }
      const list = effect.wroteShadowComponents;
      if (list && sameList(current.shadowComponents, list)) {
        theme.shadowComponents = [...before.shadowComponents];
      }
      answer.undone = true;
      return {
        theme,
        relock: locksOfEntries(
          effect.held.filter((entry) => entry.state === 'applied')
        ),
      };
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
