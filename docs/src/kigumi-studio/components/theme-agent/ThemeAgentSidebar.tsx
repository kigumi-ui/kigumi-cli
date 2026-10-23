import {
  useEffect,
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
  Icon,
  Spinner,
  Textarea,
  type TextareaRef,
} from '@/components/ui';
import { THEME_AGENT_TASK_ID } from '../../theme-agent/constants';
import { requestThemeAgentToken } from '../../theme-agent/session-client';
import './ThemeAgentSidebar.css';

interface ThemeAgentSidebarProps {
  open: boolean;
  onClose: () => void;
}

function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === 'text' ? part.text : ''))
    .join('');
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
  const { messages, sendMessage, status, error } = useChat({
    id: chatId,
    transport,
  });

  const [draft, setDraft] = useState('');
  const textareaRef = useRef<TextareaRef>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const running = status === 'submitted' || status === 'streaming';

  // Empty while a reply streams, so the polite live region announces the
  // finished reply once instead of every token.
  const lastMessage = messages.at(-1);
  const announcement =
    status === 'error'
      ? 'The Theme Agent could not answer.'
      : status === 'ready' && lastMessage?.role === 'assistant'
        ? `Theme Agent: ${messageText(lastMessage)}`
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
    void sendMessage({ text });
    setDraft('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
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

      <div ref={messagesRef} className="theme-agent__messages wa-stack wa-gap-s">
        {messages.length === 0 && (
          <p className="theme-agent__empty">
            Describe the theme you want, for example “calm fintech, brand
            #0891b2, rounded”.
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={clsx(
              'theme-agent__message',
              `theme-agent__message--${message.role}`
            )}
          >
            <span className="wa-visually-hidden">
              {message.role === 'user' ? 'You:' : 'Theme Agent:'}
            </span>
            {messageText(message)}
          </div>
        ))}
        {status === 'submitted' && (
          <div className="wa-cluster wa-gap-xs theme-agent__pending">
            <Spinner />
            Thinking…
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
        <Button
          variant="brand"
          size="small"
          loading={running}
          onClick={send}
        >
          <Icon slot="start" name="paper-plane" />
          Send
        </Button>
      </div>
    </aside>
  );
}
