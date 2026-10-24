import { PROPERTIES_BY_VAR } from '../lib/property-definitions';
import {
  cloneTheme,
  componentListKey,
  THEME_AGENT_MODES,
  type CustomTheme,
  type ThemeAgentMode,
  type ThemeAgentSnapshot,
  type ThemeValueSet,
} from './custom-theme';
import { checkContrast, type ContrastViolation } from './contrast';
import { namedValues } from './naming';
import {
  SHADOW_COMPONENTS_KEY,
  validateProposal,
  type ThemeProposal,
} from './proposal';

// The Theme Agent conversation: the single home of what an answer may do to
// the custom theme. No React, no network, no model. Studio stays the source
// of truth for the custom theme and passes it in with every event.
//
// Hand-set values are protected here, in code, not by the prompt (ADR 0007):
// an answer never changes a value the user set by hand during the
// conversation; it raises a change request the user keeps or overwrites.

export type ChangeRequestStatus = 'open' | 'kept' | 'overwritten' | 'undone';

interface ChangeRequestBase {
  id: string;
  answerId: string;
  /** The agent's reason, when it gave one. */
  reason?: string;
  status: ChangeRequestStatus;
}

/** An answer would change a hand-set value; the user keeps or overwrites it. */
export type ChangeRequest =
  | (ChangeRequestBase & {
      kind: 'value';
      cssVar: string;
      /** One mode, or both for a mode-independent value. */
      modes: ThemeAgentMode[];
      current: string;
      proposed: string;
    })
  | (ChangeRequestBase & {
      kind: 'shadowComponents';
      current: string[];
      proposed: string[];
    });

export type AnswerOutcome =
  | {
      applied: true;
      /** `current` with every change on top that touches no hand-set value. */
      theme: CustomTheme;
      changeRequests: ChangeRequest[];
      /** WCAG 2.1 AA contrast the applied theme still fails, both modes. */
      violations: ContrastViolation[];
    }
  | { applied: false; errors: string[] };

/**
 * `applied` when the answer changed the custom theme, directly or through an
 * overwritten change request; `unchanged` when it was valid but every change
 * it proposed is held as a change request, kept, or already in place.
 */
export type AnswerStatus = 'applied' | 'unchanged' | 'undone' | 'rejected';

export interface ThemeAgentConversation {
  /**
   * The snapshot that travels with a message, taken from `theme` as it is
   * now. The first message starts the conversation: only edits after it are
   * hand-set. Open change requests are resolved as kept.
   */
  messageSent(theme: CustomTheme, text: string): ThemeAgentSnapshot;
  /** The user changed `cssVar` in `mode` in the sidebar. */
  userEdited(cssVar: string, mode: ThemeAgentMode): void;
  /** The user changed the list of components that get a shadow. */
  userEditedShadowComponents(): void;
  /**
   * Validate an answer's proposals and, if every one is valid, return the
   * custom theme to apply: `current` with the proposals on top, in order (a
   * contrast correction names only the values it fixes), except for
   * hand-set values, which come back as change requests. Also the contrast
   * violations that theme still has; it is applied with them. An invalid
   * proposal is never applied. Receiving the same answer again returns the
   * first outcome and records nothing new.
   */
  answerReceived(
    answerId: string,
    proposals: unknown[],
    current: CustomTheme
  ): AnswerOutcome;
  /** Leave the value as it is and do not ask about it again. */
  keep(changeRequestId: string): void;
  keepAll(): void;
  /**
   * The custom theme with the proposed value, to apply; the value stops being
   * hand-set. `undefined` when the request is not open.
   */
  overwrite(
    changeRequestId: string,
    current: CustomTheme
  ): CustomTheme | undefined;
  overwriteAll(current: CustomTheme): CustomTheme | undefined;
  /** Every change request still waiting for keep or overwrite. */
  openChangeRequests(): ChangeRequest[];
  changeRequests(answerId: string): ChangeRequest[];
  /**
   * The custom theme as it was before `answerId`, to apply. Hand-set and
   * kept values go back to how they were then too. Undoing an answer also
   * undoes every answer applied after it. `undefined` when there is nothing
   * to undo.
   */
  undo(answerId: string): CustomTheme | undefined;
  answerStatus(answerId: string): AnswerStatus | undefined;
  /** The contrast violations an applied answer left; none once it is undone. */
  answerViolations(answerId: string): ContrastViolation[];
}

/** A hand-set unit: one value in one mode, a mode-independent value, or the shadow list. */
type HandSetUnit =
  | {
      kind: 'value';
      cssVar: string;
      modes: ThemeAgentMode[];
      /** The mode the user last edited it in; it holds their value. */
      editedMode: ThemeAgentMode;
    }
  | { kind: 'shadowComponents' };

interface Protection {
  handSet: Map<string, HandSetUnit>;
  kept: Set<string>;
}

interface RequestRecord {
  unitKey: string;
  request: ChangeRequest;
}

interface AnswerRecord {
  id: string;
  /** The custom theme and its protection just before this answer. */
  before: { theme: CustomTheme; protection: Protection } | undefined;
  outcome: AnswerOutcome;
  changed: boolean;
  requests: RequestRecord[];
  undone: boolean;
}

function isModeDependent(cssVar: string): boolean {
  return PROPERTIES_BY_VAR.get(cssVar)?.modeDependent ?? true;
}

/** A mode-independent value is one unit for both modes. */
function valueKey(cssVar: string, mode: ThemeAgentMode): string {
  return isModeDependent(cssVar) ? `${mode} ${cssVar}` : cssVar;
}

function cloneProtection(protection: Protection): Protection {
  return {
    handSet: new Map(protection.handSet),
    kept: new Set(protection.kept),
  };
}

function sameList(a: string[], b: string[]): boolean {
  return componentListKey(a) === componentListKey(b);
}

function sameTheme(a: CustomTheme, b: CustomTheme): boolean {
  const differs = (x: Record<string, string>, y: Record<string, string>) =>
    Object.keys({ ...x, ...y }).some((key) => x[key] !== y[key]);
  return (
    !differs(a.light, b.light) &&
    !differs(a.dark, b.dark) &&
    sameList(a.shadowComponents, b.shadowComponents)
  );
}

function valueSet(
  protection: Protection,
  include: (key: string) => boolean
): ThemeValueSet {
  const set: ThemeValueSet = { light: [], dark: [], shadowComponents: false };
  for (const [key, unit] of protection.handSet) {
    if (!include(key)) continue;
    if (unit.kind === 'shadowComponents') {
      set.shadowComponents = true;
      continue;
    }
    for (const mode of unit.modes) set[mode].push(unit.cssVar);
  }
  return set;
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
    if (proposal.reasons) {
      merged.reasons = { ...merged.reasons, ...proposal.reasons };
    }
  }
  return merged;
}

function applyRequest(theme: CustomTheme, request: ChangeRequest): void {
  if (request.kind === 'shadowComponents') {
    theme.shadowComponents = [...request.proposed];
    return;
  }
  for (const mode of request.modes)
    theme[mode][request.cssVar] = request.proposed;
}

export function createThemeAgentConversation(): ThemeAgentConversation {
  const answers: AnswerRecord[] = [];
  let started = false;
  let protection: Protection = { handSet: new Map(), kept: new Set() };
  /** What the message in flight names; a kept value it names may be asked about. */
  let named = new Set<string>();

  const find = (id: string) => answers.find((answer) => answer.id === id);
  const copy = (record: RequestRecord): ChangeRequest => ({
    ...record.request,
  });
  const openRecords = () =>
    answers
      .filter((answer) => !answer.undone)
      .flatMap((answer) => answer.requests)
      .filter((record) => record.request.status === 'open');

  const keepRecord = (record: RequestRecord) => {
    record.request.status = 'kept';
    protection.kept.add(record.unitKey);
  };

  const overwriteRecords = (
    records: RequestRecord[],
    current: CustomTheme
  ): CustomTheme | undefined => {
    if (records.length === 0) return undefined;
    const next = cloneTheme(current);
    for (const record of records) {
      applyRequest(next, record.request);
      record.request.status = 'overwritten';
      protection.handSet.delete(record.unitKey);
      protection.kept.delete(record.unitKey);
      const answer = find(record.request.answerId);
      if (answer) answer.changed = true;
    }
    return next;
  };

  /** Whether a proposed change to `unitKey` becomes a change request. */
  const asks = (unitKey: string, namedAs: string) =>
    !protection.kept.has(unitKey) || named.has(namedAs);

  const receive = (
    answerId: string,
    proposal: ThemeProposal,
    current: CustomTheme
  ): { theme: CustomTheme; requests: RequestRecord[] } => {
    const theme = cloneTheme(current);
    const requests: RequestRecord[] = [];
    const raised = new Set<string>();

    for (const mode of THEME_AGENT_MODES) {
      for (const [cssVar, proposed] of Object.entries(proposal[mode])) {
        if (current[mode][cssVar] === proposed) continue;
        const unitKey = valueKey(cssVar, mode);
        const unit = protection.handSet.get(unitKey);
        if (!unit || unit.kind !== 'value') {
          theme[mode][cssVar] = proposed;
          continue;
        }
        const handValue = current[unit.editedMode][cssVar];
        if (handValue === proposed) {
          // The answer agrees with the user; nothing to ask.
          for (const m of unit.modes) theme[m][cssVar] = proposed;
          continue;
        }
        if (raised.has(unitKey) || !asks(unitKey, cssVar)) continue;
        raised.add(unitKey);
        requests.push({
          unitKey,
          request: {
            kind: 'value',
            id: `${answerId} ${unitKey}`,
            answerId,
            cssVar,
            modes: [...unit.modes],
            current: handValue,
            proposed,
            reason: proposal.reasons?.[cssVar],
            status: 'open',
          },
        });
      }
    }

    const proposedList = proposal.shadowComponents;
    if (proposedList && !sameList(current.shadowComponents, proposedList)) {
      if (!protection.handSet.has(SHADOW_COMPONENTS_KEY)) {
        theme.shadowComponents = [...proposedList];
      } else if (asks(SHADOW_COMPONENTS_KEY, SHADOW_COMPONENTS_KEY)) {
        requests.push({
          unitKey: SHADOW_COMPONENTS_KEY,
          request: {
            kind: 'shadowComponents',
            id: `${answerId} ${SHADOW_COMPONENTS_KEY}`,
            answerId,
            current: [...current.shadowComponents],
            proposed: [...proposedList],
            reason: proposal.reasons?.[SHADOW_COMPONENTS_KEY],
            status: 'open',
          },
        });
      }
    }

    return { theme, requests };
  };

  return {
    messageSent(theme, text) {
      started = true;
      for (const record of openRecords()) keepRecord(record);
      named = namedValues(text);
      return {
        theme: cloneTheme(theme),
        handSet: valueSet(protection, () => true),
        kept: valueSet(protection, (key) => protection.kept.has(key)),
      };
    },

    userEdited(cssVar, mode) {
      if (!started || !PROPERTIES_BY_VAR.has(cssVar)) return;
      protection.handSet.set(valueKey(cssVar, mode), {
        kind: 'value',
        cssVar,
        modes: isModeDependent(cssVar) ? [mode] : [...THEME_AGENT_MODES],
        editedMode: mode,
      });
    },

    userEditedShadowComponents() {
      if (!started) return;
      protection.handSet.set(SHADOW_COMPONENTS_KEY, {
        kind: 'shadowComponents',
      });
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
      if (errors.length > 0) {
        const outcome: AnswerOutcome = { applied: false, errors };
        answers.push({
          id: answerId,
          before: undefined,
          outcome,
          changed: false,
          requests: [],
          undone: false,
        });
        return outcome;
      }

      const before = {
        theme: cloneTheme(current),
        protection: cloneProtection(protection),
      };
      const { theme, requests } = receive(
        answerId,
        mergeProposals(valid),
        current
      );
      const outcome: AnswerOutcome = {
        applied: true,
        theme,
        changeRequests: requests.map(copy),
        violations: checkContrast(theme),
      };
      answers.push({
        id: answerId,
        before,
        outcome,
        changed: !sameTheme(theme, current),
        requests,
        undone: false,
      });
      return outcome;
    },

    keep(changeRequestId) {
      const record = openRecords().find(
        (r) => r.request.id === changeRequestId
      );
      if (record) keepRecord(record);
    },

    keepAll() {
      for (const record of openRecords()) keepRecord(record);
    },

    overwrite(changeRequestId, current) {
      const record = openRecords().find(
        (r) => r.request.id === changeRequestId
      );
      return overwriteRecords(record ? [record] : [], current);
    },

    overwriteAll(current) {
      return overwriteRecords(openRecords(), current);
    },

    openChangeRequests() {
      return openRecords().map(copy);
    },

    changeRequests(answerId) {
      return (find(answerId)?.requests ?? []).map(copy);
    },

    undo(answerId) {
      const index = answers.findIndex((answer) => answer.id === answerId);
      const answer = answers[index];
      if (!answer || !answer.before || answer.undone) return undefined;
      for (const later of answers.slice(index)) {
        later.undone = true;
        for (const record of later.requests) {
          if (record.request.status === 'open')
            record.request.status = 'undone';
        }
      }
      protection = cloneProtection(answer.before.protection);
      return cloneTheme(answer.before.theme);
    },

    answerViolations(answerId) {
      const answer = find(answerId);
      if (!answer || answer.undone || !answer.outcome.applied) return [];
      return answer.outcome.violations;
    },

    answerStatus(answerId) {
      const answer = find(answerId);
      if (!answer) return undefined;
      if (!answer.outcome.applied) return 'rejected';
      if (answer.undone) return 'undone';
      return answer.changed ? 'applied' : 'unchanged';
    },
  };
}
