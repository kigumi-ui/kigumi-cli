import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent,
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
  summarizeViolation,
  type ContrastViolation,
} from '../../theme-agent/contrast';
import {
  createThemeAgentConversation,
  type AnswerStatus,
} from '../../theme-agent/conversation';
import type {
  ProposeThemeOutput,
  ThemeProposalInput,
} from '../../theme-agent/proposal';
import { requestThemeAgentToken } from '../../theme-agent/session-client';
import { useThemeAgentStudio } from '../../theme-agent/use-theme-agent-studio';
import './ThemeAgentSidebar.css';

interface ThemeAgentSidebarProps {
  open: boolean;
  onClose: () => void;
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

/**
 * The Theme Agent chat, in a sidebar to the right of the preview. Loaded only
 * when the access cookie is present (see StudioLayout), so visitors never
 * download the AI SDK. Stays mounted while closed to keep the conversation.
 */
export function ThemeAgentSidebar({ open, onClose }: ThemeAgentSidebarProps) {
  const [chatId] = useState(() => crypto.randomUUID());
  const transport = useTriggerChatTransport({
    task: THEME_AGENT_TASK_ID,
    startSession: async ({ chatId: id }) => ({
      publicAccessToken: await requestThemeAgentToken('start', id),
    }),
    accessToken: ({ chatId: id }) => requestThemeAgentToken('refresh', id),
  });
  const [conversation] = useState(createThemeAgentConversation);
  const { currentTheme, applyTheme } = useThemeAgentStudio();
  // The conversation module is plain state; re-render after each event.
  const [, conversationChanged] = useReducer((n: number) => n + 1, 0);
  const [statusStep, setStatusStep] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  // Answers that hit the per-step output limit.
  const [cutOff, setCutOff] = useState<ReadonlySet<string>>(() => new Set());

  const { messages, sendMessage, status, error } = useChat<ThemeAgentMessage>({
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
      // Only a finished answer is applied, never part of one.
      if (isAbort || isDisconnect || isError) return;
      const proposals = acceptedProposals(message);
      if (!proposals) return;
      // Validated and checked for contrast again here: an invalid proposal
      // is never applied, and what fails contrast is applied with a warning.
      const outcome = conversation.answerReceived(
        message.id,
        proposals,
        currentTheme()
      );
      if (outcome.applied) applyTheme(outcome.theme);
      conversationChanged();
    },
    onError: () => setStatusStep(null),
  });

  const [draft, setDraft] = useState('');
  const textareaRef = useRef<TextareaRef>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const running = status === 'submitted' || status === 'streaming';

  // Empty while a reply streams, so the polite live region announces the
  // finished reply once instead of every token.
  const lastMessage = messages.at(-1);
  const lastWarnings = lastMessage
    ? conversation.answerViolations(lastMessage.id).length
    : 0;
  const lastOutcome =
    lastMessage && conversation.answerStatus(lastMessage.id) === 'applied'
      ? lastWarnings > 0
        ? ` Applied to the theme with ${lastWarnings} accessibility ${
            lastWarnings === 1 ? 'warning' : 'warnings'
          }.`
        : ' Applied to the theme.'
      : '';
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

  useEffect(() => {
    if (open) textareaRef.current?.focus({ preventScroll: true });
  }, [open]);

  const send = () => {
    const text = draft.trim();
    if (!text || running) return;
    setNotice('');
    setStatusStep(null);
    void sendMessage(
      { text },
      { metadata: conversation.messageSent(currentTheme()) }
    );
    setDraft('');
  };

  const undo = (answerId: string) => {
    const before = conversation.undo(answerId);
    if (!before) return;
    applyTheme(before);
    conversationChanged();
    setNotice('Undone. The theme is back to how it was before that answer.');
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
    <aside
      className={clsx('theme-agent', !open && 'theme-agent--closed')}
      aria-label="Theme Agent"
      hidden={!open}
    >
      <div className="theme-agent__header wa-split wa-align-items-center">
        <span className="wa-heading-s wa-cluster wa-gap-xs">
          <Icon name="wand-magic-sparkles" />
          Theme Agent
        </span>
        <Button
          size="small"
          appearance="plain"
          variant="neutral"
          onClick={onClose}
        >
          <Icon name="xmark" label="Close Theme Agent" />
        </Button>
      </div>

      <div
        ref={messagesRef}
        className="theme-agent__messages wa-stack wa-gap-s"
      >
        {messages.length === 0 && (
          <p className="theme-agent__empty">
            Describe the theme you want, for example “calm fintech, brand
            #0891b2, rounded”.
          </p>
        )}
        {messages.map((message) => {
          const text = messageText(message);
          const outcome =
            message.role === 'assistant'
              ? answerOutcome(
                  message,
                  conversation.answerStatus(message.id),
                  !running || message.id !== lastMessage?.id
                )
              : undefined;
          // An answer that has only started streaming shows nothing yet;
          // the status step below says the Theme Agent is working.
          if (!text && !outcome) return null;
          return (
            <Card
              key={message.id}
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
              {outcome && (
                <AnswerOutcome
                  outcome={outcome}
                  violations={conversation.answerViolations(message.id)}
                  reasons={
                    outcome === 'refused'
                      ? refusalReasons(message, cutOff.has(message.id))
                      : []
                  }
                  onUndo={() => undo(message.id)}
                />
              )}
            </Card>
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
          readonly={running}
          onInput={(event) =>
            setDraft((event.target as HTMLTextAreaElement).value)
          }
          onKeyDown={handleKeyDown}
        />
        <Button variant="brand" size="small" loading={running} onClick={send}>
          <Icon slot="start" name="paper-plane" />
          Send
        </Button>
      </div>
    </aside>
  );
}

type AnswerOutcomeKind = AnswerStatus | 'refused';

/**
 * What an answer did to the custom theme: applied, undone, refused by the
 * browser (`rejected`) or by the task (`refused`, every attempt failed), or
 * nothing to show yet.
 */
function answerOutcome(
  message: ThemeAgentMessage,
  status: AnswerStatus | undefined,
  finished: boolean
): AnswerOutcomeKind | undefined {
  if (status) return status;
  if (finished && acceptedProposals(message) === null) return 'refused';
  return undefined;
}

interface AnswerOutcomeProps {
  outcome: AnswerOutcomeKind;
  reasons: string[];
  violations: ContrastViolation[];
  onUndo: () => void;
}

/** An answer's outcome, and its undo. */
function AnswerOutcome({
  outcome,
  reasons,
  violations,
  onUndo,
}: AnswerOutcomeProps) {
  switch (outcome) {
    case 'applied':
      return (
        <div className="theme-agent__outcome wa-stack wa-gap-xs">
          {violations.length > 0 && (
            <Callout variant="warning" size="small">
              <Icon slot="icon" name="universal-access" />
              Accessibility warning: applied, but{' '}
              {violations.length === 1
                ? 'this pair falls'
                : `these ${violations.length} pairs fall`}{' '}
              short of WCAG 2.1 AA contrast.
              <ul className="theme-agent__reasons">
                {violations.map((violation) => (
                  <li
                    key={`${violation.mode}${violation.foreground}${violation.background}`}
                  >
                    {summarizeViolation(violation)}
                  </li>
                ))}
              </ul>
            </Callout>
          )}
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
    case 'undone':
      return (
        <div className="theme-agent__outcome">
          <span className="theme-agent__outcome-text">Undone</span>
        </div>
      );
    case 'rejected':
      return (
        <Callout variant="danger" size="small" className="theme-agent__outcome">
          <Icon slot="icon" name="circle-exclamation" />
          Studio refused this proposal. Nothing was applied.
        </Callout>
      );
    case 'refused':
      return (
        <Callout
          variant="warning"
          size="small"
          className="theme-agent__outcome"
        >
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
