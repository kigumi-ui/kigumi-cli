import {
  Fragment,
  useCallback,
  useEffect,
  useImperativeHandle,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent,
  type Ref,
} from 'react';
import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { useTriggerChatTransport } from '@trigger.dev/sdk/chat/react';
import clsx from 'clsx';
import {
  Button,
  Callout,
  Card,
  Icon,
  Spinner,
  Textarea,
  type TextareaRef,
} from '@/components/ui';
import {
  THEME_AGENT_PROPOSE_TOOL,
  THEME_AGENT_TASK_ID,
} from '../../theme-agent/constants';
import {
  lockedSources,
  summarizeViolation,
  violationKey,
  type ContrastViolation,
} from '../../theme-agent/contrast';
import {
  createThemeAgentConversation,
  type AnswerStatus,
  type HeldEntry,
  type HeldReason,
} from '../../theme-agent/conversation';
import { lockedValueLabel } from '../../theme-agent/describe-held-change';
import { hasLocks, type LockedValues } from '../../lib/locks';
import type {
  ProposeThemeOutput,
  ThemeProposalInput,
} from '../../theme-agent/proposal';
import {
  closeThemeAgentSession,
  requestThemeAgentToken,
} from '../../theme-agent/session-client';
import { useThemeAgentStudio } from '../../theme-agent/use-theme-agent-studio';
import { LockedChangesCallouts, UnlockAndApply } from './LockedChanges';

/** Why the conversation on screen started: the user asked, or the theme was replaced. */
export type ConversationStart = 'new' | 'theme-replaced';

export interface ThemeAgentChatHandle {
  focus(): void;
  /**
   * End the conversation: nothing its run still sends reaches the theme, a
   * running answer stops, and its trigger.dev session closes. `false`, and
   * nothing done, when no message was sent: there is nothing to end.
   */
  end(): boolean;
}

type ThemeAgentMessage = UIMessage<
  unknown,
  { status: { step: string } },
  {
    [THEME_AGENT_PROPOSE_TOOL]: {
      input: ThemeProposalInput;
      output: ProposeThemeOutput;
    };
  }
>;

function messageText(message: ThemeAgentMessage): string {
  return message.parts
    .map((part) => (part.type === 'text' ? part.text.trim() : ''))
    .filter(Boolean)
    .join('\n\n');
}

/** Why no proposal in this answer was accepted, from its last attempt. */
function refusalReasons(message: ThemeAgentMessage, cutOff: boolean): string[] {
  if (cutOff) {
    return [
      'The answer hit its length limit before the proposal was complete.',
    ];
  }
  for (const part of [...message.parts].reverse()) {
    if (part.type !== `tool-${THEME_AGENT_PROPOSE_TOOL}`) continue;
    if (part.state === 'output-error') return [part.errorText];
    if (part.state === 'output-available' && !part.output.accepted) {
      return part.output.errors;
    }
    // A call that never finished, for example one cut off mid-input.
    return [`The proposal ended in state "${part.state}".`];
  }
  return [];
}

/**
 * The proposals the task accepted in this answer, in order: a contrast
 * correction names only its fixes and applies on top of the one before.
 * `null` when every proposal was refused, `undefined` when the answer made
 * none.
 */
function acceptedProposals(
  message: ThemeAgentMessage
): ThemeProposalInput[] | null | undefined {
  let proposed = false;
  const accepted: ThemeProposalInput[] = [];
  for (const part of message.parts) {
    if (part.type !== `tool-${THEME_AGENT_PROPOSE_TOOL}`) continue;
    proposed = true;
    if (part.state === 'output-available' && part.output.accepted) {
      accepted.push(part.input);
    }
  }
  if (!proposed) return undefined;
  return accepted.length > 0 ? accepted : null;
}

function closeSession(chatId: string, keepalive = false) {
  closeThemeAgentSession(chatId, { keepalive }).catch((error: unknown) => {
    // Not the user's problem: the run still ends after turnTimeout.
    console.warn('Theme Agent session close failed:', error);
  });
}

interface ThemeAgentChatProps {
  ref: Ref<ThemeAgentChatHandle>;
  startedBy: ConversationStart | undefined;
  draft: string;
  onDraftChange: (draft: string) => void;
  /** The user sent a message: the shell's lifecycle notice is stale. */
  onActivity: () => void;
}

/** One conversation: its chat id, run, conversation module and messages. */
export function ThemeAgentChat({
  ref,
  startedBy,
  draft,
  onDraftChange,
  onActivity,
}: ThemeAgentChatProps) {
  const [chatId] = useState(() => crypto.randomUUID());
  const transport = useTriggerChatTransport({
    task: THEME_AGENT_TASK_ID,
    startSession: async ({ chatId: id }) => ({
      publicAccessToken: await requestThemeAgentToken('start', id),
    }),
    accessToken: ({ chatId: id }) => requestThemeAgentToken('refresh', id),
  });
  const [conversation] = useState(createThemeAgentConversation);
  const { currentTheme, locked, lockedValues, applyTheme, setLocked } =
    useThemeAgentStudio();
  // The conversation module is plain state; re-render after each event.
  const [, conversationChanged] = useReducer((n: number) => n + 1, 0);
  const [statusStep, setStatusStep] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  // Answers that hit the per-step output limit.
  const [cutOff, setCutOff] = useState<ReadonlySet<string>>(() => new Set());

  const { messages, sendMessage, status, error, stop } =
    useChat<ThemeAgentMessage>({
      id: chatId,
      transport,
      onData: (part) => {
        if (part.type === 'data-status') setStatusStep(part.data.step);
      },
      onFinish: ({ message, isAbort, isDisconnect, isError, finishReason }) => {
        setStatusStep(null);
        if (finishReason === 'length') {
          setCutOff((ids) => new Set(ids).add(message.id));
        }
        // Recorded with or without a proposal, so the next message never
        // reports an older answer's outcome as this one's.
        conversation.answerFinished(message.id);
        // Only a finished answer is applied, never part of one.
        if (isAbort || isDisconnect || isError) return;
        const proposals = acceptedProposals(message);
        if (!proposals) return;
        // Validated and checked for contrast again here: an invalid proposal
        // is never applied, and what fails contrast is applied with a warning.
        const outcome = conversation.answerReceived(
          message.id,
          proposals,
          currentTheme(),
          locked()
        );
        if (outcome.applied) applyTheme(outcome.theme);
        conversationChanged();
      },
      onError: () => setStatusStep(null),
    });

  const textareaRef = useRef<TextareaRef>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const running = status === 'submitted' || status === 'streaming';

  // Empty while a reply streams, so the polite live region announces the
  // finished reply once instead of every token.
  const lastMessage = messages.at(-1);
  const lastStatus = lastMessage && conversation.answerStatus(lastMessage.id);
  const lastWarnings = lastMessage
    ? conversation.answerViolations(lastMessage.id).length
    : 0;
  const lastHeld = lastMessage
    ? conversation
        .heldChanges(lastMessage.id)
        .filter((entry) => entry.state === 'held')
    : [];
  const lastOutcome =
    (lastStatus === 'applied' ? appliedAnnouncement(lastWarnings) : '') +
    heldAnnouncement(lastHeld);
  const announcement = notice
    ? notice
    : status === 'error'
      ? 'The Theme Agent could not answer.'
      : status === 'ready' && lastMessage?.role === 'assistant'
        ? `Theme Agent: ${messageText(lastMessage)}${lastOutcome}`
        : running
          ? (statusStep ?? '')
          : '';

  // Keep the newest text in view without moving focus.
  useEffect(() => {
    const list = messagesRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  // A frame later: a chat mounted just now has not rendered the textarea
  // inside its wa-textarea yet.
  const focusMessage = useCallback(() => {
    requestAnimationFrame(() =>
      textareaRef.current?.focus({ preventScroll: true })
    );
  }, []);

  // Started by "New chat": the user is about to type. Not after a replaced
  // theme, where focus stays on the control that replaced it.
  useEffect(() => {
    if (startedBy === 'new') focusMessage();
  }, [startedBy, focusMessage]);

  useImperativeHandle(
    ref,
    () => ({
      focus: focusMessage,
      end: () => {
        if (messages.length === 0) return false;
        conversation.end();
        if (running) stop();
        if (transport.getSession(chatId)) closeSession(chatId);
        return true;
      },
    }),
    [
      focusMessage,
      messages.length,
      running,
      stop,
      conversation,
      transport,
      chatId,
    ]
  );

  // Leaving the page ends the conversation; one kept in the back/forward
  // cache may come back, so it stays open (turnTimeout ends it otherwise).
  useEffect(() => {
    const onPageHide = (event: PageTransitionEvent) => {
      if (event.persisted || !transport.getSession(chatId)) return;
      closeSession(chatId, true);
    };
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [transport, chatId]);

  const send = () => {
    const text = draft.trim();
    if (!text || running) return;
    setNotice('');
    onActivity();
    setStatusStep(null);
    void sendMessage(
      { text },
      { metadata: conversation.messageSent(currentTheme(), locked()) }
    );
    onDraftChange('');
  };

  const unlockAndApply = (answerId: string, index?: number) => {
    const result = conversation.applyHeld(answerId, currentTheme(), index);
    if (!result) return;
    setLocked(result.unlock, false);
    applyTheme(result.theme);
    conversationChanged();
    setNotice(unlockAnnouncement(result));
    // The button goes away; keep focus in the chat.
    textareaRef.current?.focus({ preventScroll: true });
  };

  const undo = (answerId: string) => {
    const reverted = conversation.undo(answerId, currentTheme());
    if (!reverted) return;
    applyTheme(reverted.theme);
    // What its unlock and apply unlocked is locked again.
    setLocked(reverted.relock, true);
    conversationChanged();
    setNotice(
      "Undone. That answer's changes are reverted; values you changed since stay."
    );
    // The Undo button goes away; keep focus in the chat.
    textareaRef.current?.focus({ preventScroll: true });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (
      event.key !== 'Enter' ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }
    event.preventDefault();
    send();
  };

  return (
    <>
      <div
        ref={messagesRef}
        className="theme-agent__messages wa-stack wa-gap-s"
      >
        {messages.length === 0 && (
          <p className="theme-agent__empty">
            {startedBy === 'theme-replaced' &&
              'The custom theme was replaced, so a new conversation started. '}
            Describe the theme you want, for example “calm fintech, brand
            #0891b2, rounded”.
          </p>
        )}
        {messages.map((message) => {
          const text = messageText(message);
          const outcome =
            message.role === 'assistant'
              ? answerReportKind(
                  message,
                  conversation.answerStatus(message.id),
                  !running || message.id !== lastMessage?.id
                )
              : undefined;
          const heldEntries = conversation.heldChanges(message.id);
          // Unlock and apply belongs to the message while a change is held.
          const action = heldEntries.some(
            (entry) => entry.state === 'held'
          ) && (
            <UnlockAndApply
              entries={heldEntries}
              onApply={(index) => unlockAndApply(message.id, index)}
            />
          );
          // An answer that has only started streaming shows nothing yet;
          // the status step below says the Theme Agent is working.
          if (!text && !outcome) return null;
          // The message and its action in the card; what Studio did with
          // it below the card, as Studio's own report.
          return (
            <Fragment key={message.id}>
              {(text || action) && (
                <Card
                  appearance={message.role === 'user' ? 'filled' : 'outlined'}
                  className={clsx(
                    'theme-agent__message',
                    `theme-agent__message--${message.role}`
                  )}
                >
                  <span className="wa-visually-hidden">
                    {message.role === 'user' ? 'You:' : 'Theme Agent:'}
                  </span>
                  {text}
                  {action}
                </Card>
              )}
              {outcome && (
                <AnswerReport
                  outcome={outcome}
                  violations={conversation.answerViolations(message.id)}
                  reasons={
                    outcome === 'refused'
                      ? refusalReasons(message, cutOff.has(message.id))
                      : outcome === 'rejected'
                        ? conversation.answerErrors(message.id)
                        : []
                  }
                  onUndo={() => undo(message.id)}
                  held={heldEntries}
                  locked={lockedValues}
                />
              )}
            </Fragment>
          );
        })}
        {running && (
          <div className="wa-cluster wa-gap-xs theme-agent__pending">
            <Spinner />
            {statusStep ?? 'Thinking…'}
          </div>
        )}
        {error && (
          <Callout variant="danger" size="small">
            <Icon slot="icon" name="circle-exclamation" />
            {error.message}
          </Callout>
        )}
      </div>

      <div className="wa-visually-hidden" aria-live="polite">
        {announcement}
      </div>

      <div className="theme-agent__composer wa-stack wa-gap-xs">
        <Textarea
          ref={textareaRef}
          label="Message"
          hint="Enter sends, Shift+Enter adds a line"
          rows={3}
          resize="none"
          value={draft}
          onInput={(event) =>
            onDraftChange((event.target as HTMLTextAreaElement).value)
          }
          onKeyDown={handleKeyDown}
        />
        <Button variant="brand" size="small" loading={running} onClick={send}>
          <Icon slot="start" name="paper-plane" />
          Send
        </Button>
      </div>
    </>
  );
}

function appliedAnnouncement(warnings: number): string {
  if (warnings === 0) return ' Applied to the theme.';
  return ` Applied to the theme with ${warnings} accessibility ${
    warnings === 1 ? 'warning' : 'warnings'
  }.`;
}

/** `one` for a count of 1, `many` with the count otherwise; none for 0. */
function countSentence(count: number, one: string, many: string): string {
  if (count === 0) return '';
  return count === 1 ? one : `${count} ${many}`;
}

function unlockAnnouncement({
  applied,
  changed,
  unlock,
}: {
  applied: number;
  changed: number;
  unlock: LockedValues;
}): string {
  const skipped = countSentence(
    changed,
    'One value was not applied: you changed it since.',
    'values were not applied: you changed them since.'
  );
  if (applied === 0) return skipped;
  const done = hasLocks(unlock) ? 'Unlocked and applied.' : 'Applied.';
  return skipped ? `${done} ${skipped}` : done;
}

function heldAnnouncement(held: HeldEntry[]): string {
  const count = (reason: HeldReason) =>
    held.filter((entry) => entry.change.reason === reason).length;
  return [
    countSentence(
      count('locked'),
      'One locked value was not changed.',
      'locked values were not changed.'
    ),
    countSentence(
      count('edited'),
      'One value you changed while it answered was not changed.',
      'values you changed while it answered were not changed.'
    ),
  ]
    .map((sentence) => (sentence ? ` ${sentence}` : ''))
    .join('');
}

/**
 * A violation as the accessibility warning lists it; when every value
 * behind it is locked, so the Theme Agent may not fix it, it names them.
 */
function violationLine(
  violation: ContrastViolation,
  locked: LockedValues
): string {
  const sources = lockedSources(violation, locked).map((cssVar) =>
    lockedValueLabel(cssVar, violation.mode)
  );
  const summary = summarizeViolation(violation);
  return sources.length > 0
    ? `${summary}. Locked: ${sources.join(', ')}`
    : summary;
}

type AnswerReportKind = AnswerStatus | 'refused';

/**
 * What an answer did to the custom theme: applied, undone, refused by the
 * browser (`rejected`) or by the task (`refused`, every attempt failed), or
 * nothing to show yet.
 */
function answerReportKind(
  message: ThemeAgentMessage,
  status: AnswerStatus | undefined,
  finished: boolean
): AnswerReportKind | undefined {
  if (status) return status;
  if (finished && acceptedProposals(message) === null) return 'refused';
  return undefined;
}

interface AnswerReportProps {
  outcome: AnswerReportKind;
  reasons: string[];
  violations: ContrastViolation[];
  onUndo: () => void;
  /** What the answer held, and what became of it. */
  held: HeldEntry[];
  /** The values locked now, named in the accessibility warning. */
  locked: LockedValues;
}

/**
 * Studio's report under an answer: its callouts first (accessibility
 * warning, values held and not changed), then what was applied, with Undo.
 */
function AnswerReport({
  outcome,
  reasons,
  violations,
  onUndo,
  held,
  locked,
}: AnswerReportProps) {
  const lockedCallout = held.length > 0 && (
    <LockedChangesCallouts entries={held} />
  );
  const warning = violations.length > 0 && (
    <Callout variant="warning" size="small">
      <Icon slot="icon" name="universal-access" />
      Accessibility warning: {outcome === 'applied' ? 'applied, but ' : ''}
      {violations.length === 1
        ? 'this pair falls'
        : `these ${violations.length} pairs fall`}{' '}
      short of WCAG 2.1 AA contrast.
      <ul className="theme-agent__reasons">
        {violations.map((violation) => (
          <li key={violationKey(violation)}>
            {violationLine(violation, locked)}
          </li>
        ))}
      </ul>
    </Callout>
  );
  switch (outcome) {
    case 'applied':
      return (
        <div className="wa-stack wa-gap-xs">
          {warning}
          {lockedCallout}
          <div className="wa-cluster wa-gap-xs wa-align-items-center">
            <span className="theme-agent__outcome-text">
              Applied to the theme
            </span>
            <Button size="small" appearance="outlined" onClick={onUndo}>
              <Icon slot="start" name="arrow-rotate-left" />
              Undo
            </Button>
          </div>
        </div>
      );
    case 'unchanged':
      return (
        <div className="wa-stack wa-gap-xs">
          {warning}
          {lockedCallout || (
            <span className="theme-agent__outcome-text">
              No change to the theme
            </span>
          )}
        </div>
      );
    case 'undone':
      return (
        <div>
          <span className="theme-agent__outcome-text">Undone</span>
        </div>
      );
    case 'rejected':
      return (
        <Callout variant="danger" size="small">
          <Icon slot="icon" name="circle-exclamation" />
          Studio refused this proposal. Nothing was applied.
          {reasons.length > 0 && (
            <ul className="theme-agent__reasons">
              {reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          )}
        </Callout>
      );
    case 'refused':
      return (
        <Callout variant="warning" size="small">
          <Icon slot="icon" name="triangle-exclamation" />
          No valid theme came back. Nothing was applied.
          {reasons.length > 0 && (
            <ul className="theme-agent__reasons">
              {reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          )}
        </Callout>
      );
  }
}
