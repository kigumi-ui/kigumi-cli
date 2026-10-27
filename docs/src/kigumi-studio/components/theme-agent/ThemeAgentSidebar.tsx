import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Button, Icon } from '@/components/ui';
import { useThemeAgentStudio } from '../../theme-agent/use-theme-agent-studio';
import {
  ThemeAgentChat,
  type ConversationStart,
  type ThemeAgentChatHandle,
  type ThemeAgentTransport,
} from './ThemeAgentChat';
import './ThemeAgentSidebar.css';

interface ThemeAgentSidebarProps {
  open: boolean;
  /** A canned transport for every conversation, for the interaction story. */
  transport?: ThemeAgentTransport;
}

/**
 * The Theme Agent chat, in a sidebar to the right of the preview. Loaded only
 * when the access cookie is present (see StudioLayout), so visitors never
 * download the AI SDK. Stays mounted while closed to keep the conversation.
 *
 * Owns the conversation's lifecycle: "New chat" and a replaced theme
 * (a preset, Default, an import) end it and mount a fresh chat; the draft
 * message survives. A reload keeps it: the chat restores what the tab saved
 * (ADR 0014).
 */
export function ThemeAgentSidebar({ open, transport }: ThemeAgentSidebarProps) {
  const { onThemeReplaced } = useThemeAgentStudio();
  const [conversation, setConversation] = useState<{
    key: number;
    startedBy?: ConversationStart;
  }>({ key: 0 });
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');
  const chatRef = useRef<ThemeAgentChatHandle>(null);

  const restart = useCallback((startedBy: ConversationStart) => {
    if (!chatRef.current?.end()) return false;
    setConversation((current) => ({ key: current.key + 1, startedBy }));
    return true;
  }, []);

  useEffect(
    () =>
      onThemeReplaced(() => {
        if (restart('theme-replaced')) {
          setNotice(
            'The custom theme was replaced, so the conversation ended.'
          );
        }
      }),
    [onThemeReplaced, restart]
  );

  useEffect(() => {
    if (open) chatRef.current?.focus();
  }, [open]);

  // The fresh chat focuses its own message field (`startedBy: 'new'`).
  const newConversation = () => {
    if (restart('new')) {
      setNotice('New chat started.');
    } else {
      chatRef.current?.focus();
    }
  };

  return (
    <aside
      className={clsx('theme-agent', !open && 'theme-agent--closed')}
      aria-label="Theme Agent"
      hidden={!open}
    >
      <div className="studio-panel-header wa-split wa-align-items-center">
        <span className="wa-heading-s wa-cluster wa-gap-xs">
          <Icon name="robot" />
          Theme Agent
        </span>
        <Button
          size="small"
          appearance="outlined"
          variant="neutral"
          onClick={newConversation}
        >
          <Icon slot="start" name="plus" />
          New chat
        </Button>
      </div>
      <div className="wa-visually-hidden" aria-live="polite">
        {notice}
      </div>
      <ThemeAgentChat
        key={conversation.key}
        ref={chatRef}
        startedBy={conversation.startedBy}
        draft={draft}
        onDraftChange={setDraft}
        onActivity={() => setNotice('')}
        transport={transport}
      />
    </aside>
  );
}
