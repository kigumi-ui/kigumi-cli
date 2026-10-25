import {
  describeLocks,
  NO_LOCKS,
  parseLocks,
  SHADOW_COMPONENTS_LOCK,
  THEME_MODES,
  valueLock,
  withLocks,
  type LockedValues,
} from '../lib/locks';
import type { ThemeMode } from '../lib/defaults';
import {
  cloneTheme,
  componentListKey,
  type CustomTheme,
  type PreviousAnswer,
  type ThemeAgentSnapshot,
} from './custom-theme';
import {
  checkContrast,
  violationKey,
  type ContrastViolation,
} from './contrast';
import {
  applyProposal,
  emptyProposal,
  mergeProposals,
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
// held, and only the user's "Unlock and apply" applies it. Nor does an answer
// overwrite a value the user changed while it was being written (ADR 0011):
// that is held too, and the user's "Apply" applies it.

/**
 * Why a change is held: the value is `locked`, or the user `edited` it while
 * the answer was being written. A locked value needs unlocking to apply.
 */
export type HeldReason = 'locked' | 'edited';

/** A change an answer proposed to a value it may not change, held back. */
export type HeldChange =
  | {
      kind: 'value';
      reason: HeldReason;
      cssVar: string;
      /** The proposed value per held mode it would change. */
      proposed: Partial<Record<ThemeMode, string>>;
      /** The value in those modes when the answer arrived. */
      was: Partial<Record<ThemeMode, string>>;
    }
  | {
      kind: 'shadowComponents';
      reason: HeldReason;
      proposed: string[];
      was: string[];
    };

/**
 * What became of a held change: still `held` and offered to unlock and
 * apply; `applied` by the user; `changed` since the answer, so not applied;
 * or `kept` locked because the user sent the next message.
 */
export type HeldState = 'held' | 'applied' | 'changed' | 'kept';

export interface HeldEntry {
  change: HeldChange;
  state: HeldState;
  /**
   * The contrast violations of the applied theme that applying this change
   * alone would fix, so a locked colour that fails contrast is named with
   * the change that fixes it. Kept up to date while the change is held.
   */
  resolves: ContrastViolation[];
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
  /**
   * Every finished answer, with a proposal or without one. The next
   * message's snapshot reports what Studio did with the last answer only
   * when that answer proposed something: otherwise there is nothing to say,
   * and an older answer's outcome is not presented as the last one's.
   */
  answerFinished(answerId: string): void;
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
   * later answer, stays as it is and is not locked again. `undefined` when
   * there is nothing to undo.
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
  /**
   * End the conversation: "New chat", or the custom theme replaced
   * as a whole (a preset, Default, an import). Its run may still finish an
   * answer, but nothing it does reaches the theme on screen any more: a late
   * answer is not applied, and no answer of it offers apply or Undo.
   */
  end(): void;
}

/** What one answer did to the custom theme. */
interface AnswerEffect {
  /** The values it wrote per mode, directly or by unlock and apply. */
  wrote: Record<ThemeMode, Map<string, string>>;
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

/** The changes `held` would make to `current`; equal values are none. */
function heldFrom(
  held: ThemeProposal,
  current: CustomTheme,
  reason: HeldReason
): HeldChange[] {
  const changes: HeldChange[] = [];
  const cssVars = new Set([
    ...Object.keys(held.light),
    ...Object.keys(held.dark),
  ]);
  for (const cssVar of cssVars) {
    const proposed: Partial<Record<ThemeMode, string>> = {};
    const was: Partial<Record<ThemeMode, string>> = {};
    for (const mode of THEME_MODES) {
      const value = held[mode][cssVar];
      if (value === undefined || current[mode][cssVar] === value) continue;
      proposed[mode] = value;
      was[mode] = current[mode][cssVar];
    }
    if (Object.keys(proposed).length > 0) {
      changes.push({ kind: 'value', reason, cssVar, proposed, was });
    }
  }
  const list = held.shadowComponents;
  if (list && !sameList(current.shadowComponents, list)) {
    changes.push({
      kind: 'shadowComponents',
      reason,
      proposed: [...list],
      was: [...current.shadowComponents],
    });
  }
  return changes;
}

/** The values a held change names, as locks. */
function namedValues(change: HeldChange): LockedValues {
  return change.kind === 'shadowComponents'
    ? SHADOW_COMPONENTS_LOCK
    : valueLock(
        change.cssVar,
        THEME_MODES.filter((mode) => mode in change.proposed)
      );
}

/** The locks a held change sits behind: none for a value edited during the run. */
function heldLock(change: HeldChange): LockedValues {
  return change.reason === 'locked' ? namedValues(change) : NO_LOCKS;
}

/** Whether `current` still has what the answer found when it held `change`. */
function unchangedSince(change: HeldChange, current: CustomTheme): boolean {
  if (change.kind === 'shadowComponents') {
    return sameList(current.shadowComponents, change.was);
  }
  return THEME_MODES.every(
    (mode) =>
      !(mode in change.proposed) ||
      current[mode][change.cssVar] === change.was[mode]
  );
}

/**
 * The lock undo puts back on an applied held change: where `current` still
 * has the applied value, so undo restores it. A value changed since stays as
 * it is, and unlocked.
 */
function restoredLock(change: HeldChange, current: CustomTheme): LockedValues {
  if (change.reason !== 'locked') return NO_LOCKS;
  if (change.kind === 'shadowComponents') {
    return sameList(current.shadowComponents, change.proposed)
      ? SHADOW_COMPONENTS_LOCK
      : NO_LOCKS;
  }
  return valueLock(
    change.cssVar,
    THEME_MODES.filter(
      (mode) =>
        mode in change.proposed &&
        current[mode][change.cssVar] === change.proposed[mode]
    )
  );
}

/**
 * The values `current` has that differ from `sent`, the theme the message
 * carried: what the user changed while the answer was being written. A value
 * changed and set back counts as unchanged: the answer was written for it.
 */
function editedSince(sent: CustomTheme, current: CustomTheme): LockedValues {
  const changed = (mode: ThemeMode) =>
    Object.keys(current[mode]).filter(
      (cssVar) => current[mode][cssVar] !== sent[mode][cssVar]
    );
  return {
    light: changed('light'),
    dark: changed('dark'),
    shadowComponents: !sameList(
      sent.shadowComponents,
      current.shadowComponents
    ),
  };
}

/** `theme` with `change` applied. */
function withChange(theme: CustomTheme, change: HeldChange): CustomTheme {
  const next = cloneTheme(theme);
  if (change.kind === 'shadowComponents') {
    next.shadowComponents = [...change.proposed];
    return next;
  }
  for (const mode of THEME_MODES) {
    const value = change.proposed[mode];
    if (value !== undefined) next[mode][change.cssVar] = value;
  }
  return next;
}

/** The `violations` of `theme` that applying `change` alone would fix. */
function resolvedBy(
  change: HeldChange,
  theme: CustomTheme,
  violations: ContrastViolation[]
): ContrastViolation[] {
  if (violations.length === 0) return [];
  const left = new Set(
    checkContrast(withChange(theme, change)).map(violationKey)
  );
  return violations.filter((violation) => !left.has(violationKey(violation)));
}

/** What `theme` holds that `before` did not, per mode. */
function written(
  before: CustomTheme,
  theme: CustomTheme
): Record<ThemeMode, Map<string, string>> {
  const wrote = {
    light: new Map<string, string>(),
    dark: new Map<string, string>(),
  };
  for (const mode of THEME_MODES) {
    for (const [cssVar, value] of Object.entries(theme[mode])) {
      if (before[mode][cssVar] !== value) wrote[mode].set(cssVar, value);
    }
  }
  return wrote;
}

function valuesOfEntries(entries: HeldEntry[]): LockedValues {
  return entries.reduce(
    (locks, entry) => withLocks(locks, namedValues(entry.change), true),
    NO_LOCKS
  );
}

export function createThemeAgentConversation(): ThemeAgentConversation {
  const answers: AnswerRecord[] = [];
  const find = (id: string) => answers.find((answer) => answer.id === id);
  // What can still change the theme on screen: nothing once it has ended.
  const findLive = (id: string) => (ended ? undefined : find(id));
  let lastAnswerId: string | undefined;
  // The theme the latest message carried, which its answer was written for.
  let sentTheme: CustomTheme | undefined;
  let ended = false;

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
    if (!last || last.id !== lastAnswerId) return undefined;
    const status = statusOf(last);
    const notApplied = (reason: HeldReason) =>
      status === 'undone'
        ? []
        : describeLocks(
            valuesOfEntries(
              last.effect.held.filter(
                (entry) =>
                  entry.state !== 'applied' && entry.change.reason === reason
              )
            )
          );
    const edited = notApplied('edited');
    return {
      status,
      held: notApplied('locked'),
      ...(edited.length > 0 ? { edited } : {}),
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
      sentTheme = cloneTheme(theme);
      return {
        theme: cloneTheme(theme),
        locked: parseLocks(locked),
        ...(previous ? { previous } : {}),
      };
    },

    answerReceived(answerId, proposals, current, locked) {
      const known = find(answerId);
      if (known) return known.outcome;
      if (ended) {
        return {
          applied: false,
          errors: ['conversation: ended before the answer arrived'],
        };
      }
      lastAnswerId = answerId;

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

      const { free: unlocked, held: lockedPart } = splitLocked(
        mergeProposals(valid),
        locked
      );
      const { free, held: editedPart } = sentTheme
        ? splitLocked(unlocked, editedSince(sentTheme, current))
        : { free: unlocked, held: emptyProposal() };
      const theme = applyProposal(current, free);
      const violations = checkContrast(theme);
      const held = [
        ...heldFrom(lockedPart, current, 'locked'),
        ...heldFrom(editedPart, current, 'edited'),
      ];
      const outcome: AnswerOutcome = {
        applied: true,
        theme,
        held,
        violations,
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
          held: held.map((change) => ({
            change,
            state: 'held',
            resolves: resolvedBy(change, theme, violations),
          })),
        },
        undone: false,
      });
      return outcome;
    },

    answerFinished(answerId) {
      lastAnswerId = answerId;
    },

    heldChanges(answerId) {
      const answer = findLive(answerId);
      if (!answer || answer.undone) return [];
      return answer.effect.held;
    },

    applyHeld(answerId, current, index) {
      const answer = findLive(answerId);
      if (!answer || answer.undone || !answer.outcome.applied) return undefined;
      const { effect } = answer;
      const chosen = effect.held.filter(
        (entry, i) =>
          entry.state === 'held' && (index === undefined || i === index)
      );
      if (chosen.length === 0) return undefined;

      let theme = cloneTheme(current);
      let unlock = NO_LOCKS;
      let applied = 0;
      for (const entry of chosen) {
        const { change } = entry;
        if (!unchangedSince(change, current)) {
          entry.state = 'changed';
          continue;
        }
        theme = withChange(theme, change);
        if (change.kind === 'shadowComponents') {
          effect.wroteShadowComponents = [...change.proposed];
        } else {
          for (const mode of THEME_MODES) {
            const value = change.proposed[mode];
            if (value !== undefined)
              effect.wrote[mode].set(change.cssVar, value);
          }
        }
        unlock = withLocks(unlock, heldLock(change), true);
        entry.state = 'applied';
        applied += 1;
      }
      // The theme changed, so its contrast is checked again, and the outcome
      // keeps only what is still held.
      const violations = checkContrast(theme);
      const stillHeld = effect.held.filter((entry) => entry.state === 'held');
      for (const entry of stillHeld) {
        entry.resolves = resolvedBy(entry.change, theme, violations);
      }
      answer.outcome = {
        ...answer.outcome,
        held: stillHeld.map((entry) => entry.change),
        violations,
      };
      return { theme, unlock, applied, changed: chosen.length - applied };
    },

    undo(answerId, current) {
      const answer = findLive(answerId);
      if (!answer || !answer.before || answer.undone) return undefined;
      const { before, effect } = answer;
      const theme = cloneTheme(current);
      for (const mode of THEME_MODES) {
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
      const relock = effect.held
        .filter((entry) => entry.state === 'applied')
        .reduce(
          (locks, entry) =>
            withLocks(locks, restoredLock(entry.change, current), true),
          NO_LOCKS
        );
      return { theme, relock };
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

    end() {
      ended = true;
    },
  };
}
