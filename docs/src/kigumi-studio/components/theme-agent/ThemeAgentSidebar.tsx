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

/**
 * The proposal the task accepted last in this answer, `null` when every
 * proposal was refused, `undefined` when the answer made none.
 */
/** Why the task refused the proposals in this answer, last attempt first. */
function refusalReasons(message: ThemeAgentMessage): string[] {
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

function acceptedProposal(
  message: ThemeAgentMessage
): ThemeProposalInput | null | undefined {
  let found: ThemeProposalInput | null | undefined;
  for (const part of message.parts) {
    if (part.type !== `tool-${THEME_AGENT_PROPOSE_TOOL}`) continue;
    found =
      part.state === 'output-available' && part.output.accepted
        ? part.input
        : (found ?? null);
  }
  return found;
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

  const { messages, sendMessage, status, error } = useChat<ThemeAgentMessage>({
    id: chatId,
    transport,
    onData: (part) => {
      if (part.type === 'data-status') setStatusStep(part.data.step);
    },
    onFinish: ({ message, isAbort, isDisconnect, isError }) => {
      setStatusStep(null);
      // Only a finished answer is applied, never part of one.
      if (isAbort || isDisconnect || isError) return;
      const proposal = acceptedProposal(message);
      if (!proposal) return;
      // Validated again here: an invalid proposal is never applied.
      const outcome = conversation.answerReceived(
        message.id,
        proposal,
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
  const lastOutcome =
    lastMessage && conversation.answerStatus(lastMessage.id) === 'applied'
      ? ' Applied to the theme.'
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
        {messages.map((message) => (
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
            {messageText(message)}
            {message.role === 'assistant' && (
              <AnswerOutcome
                message={message}
                status={conversation.answerStatus(message.id)}
                finished={!running || message.id !== lastMessage?.id}
                onUndo={() => undo(message.id)}
              />
            )}
          </Card>
        ))}
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

interface AnswerOutcomeProps {
  message: ThemeAgentMessage;
  status: AnswerStatus | undefined;
  finished: boolean;
  onUndo: () => void;
}

/** What an answer did to the custom theme, and its undo. */
function AnswerOutcome({
  message,
  status,
  finished,
  onUndo,
}: AnswerOutcomeProps) {
  if (status === 'applied') {
    return (
      <div className="theme-agent__outcome wa-cluster wa-gap-xs wa-align-items-center">
        <span className="theme-agent__outcome-text">Applied to the theme.</span>
        <Button size="small" appearance="outlined" onClick={onUndo}>
          <Icon slot="start" name="arrow-rotate-left" />
          Undo
        </Button>
      </div>
    );
  }
  if (status === 'undone') {
    return (
      <div className="theme-agent__outcome">
        <span className="theme-agent__outcome-text">Undone.</span>
      </div>
    );
  }
  if (status === 'rejected') {
    return (
      <Callout variant="danger" size="small" className="theme-agent__outcome">
        <Icon slot="icon" name="circle-exclamation" />
        Studio refused this proposal. Nothing was applied.
      </Callout>
    );
  }
  if (finished && acceptedProposal(message) === null) {
    const reasons = refusalReasons(message);
    return (
      <Callout variant="warning" size="small" className="theme-agent__outcome">
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
  return null;
}
