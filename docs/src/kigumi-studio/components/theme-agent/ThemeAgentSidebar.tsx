import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { LanguageModel } from 'ai';
import clsx from 'clsx';
import { Button, Icon, Tooltip } from '@/components/ui';
import { useThemeAgentStudio } from '../../theme-agent/use-theme-agent-studio';
import {
  loadOwnKey,
  loadOwnKeyAnswer,
  ownKeyTransport,
  removeOwnKey,
  saveOwnKey,
} from '../../theme-agent/own-key';
import {
  ThemeAgentChat,
  type ConversationStart,
  type ThemeAgentChatHandle,
  type ThemeAgentTransport,
} from './ThemeAgentChat';
import { OwnKeySettingsDialog } from './OwnKeySettingsDialog';
import './ThemeAgentSidebar.css';

interface ThemeAgentSidebarProps {
  open: boolean;
  /** Whether the access cookie is present; the layout reads it. */
  accessCookie: boolean;
  /** A canned transport for every conversation, for the interaction story. */
  transport?: ThemeAgentTransport;
  /**
   * Replaces the Anthropic model on the own-key path, for the interaction
   * stories. Production never passes it.
   */
  ownKeyModel?: LanguageModel;
}

/**
 * Where the Theme Agent answers: in the browser with the own key, which
 * wins over the cookie (ADR 0017), on the trigger.dev task with the cookie,
 * or nowhere.
 */
type AccessState = 'own-key' | 'hosted' | 'locked';

/**
 * The Theme Agent chat, in a sidebar to the right of the preview. Loaded only
 * on first open (see StudioLayout), so visitors who never open it never
 * download the AI SDK. Stays mounted while closed to keep the conversation.
 *
 * Owns the conversation's lifecycle: "New chat" and a replaced theme
 * (a preset, Default, an import) end it and mount a fresh chat; the draft
 * message survives. A reload keeps it: the chat restores what the tab saved
 * (ADR 0014). Saving or removing an own key changes where the Theme Agent
 * runs and ends it too; replacing one own key with another does not.
 */
export function ThemeAgentSidebar({
  open,
  accessCookie,
  transport,
  ownKeyModel,
}: ThemeAgentSidebarProps) {
  const { onThemeReplaced } = useThemeAgentStudio();
  const [conversation, setConversation] = useState<{
    key: number;
    startedBy?: ConversationStart;
  }>({ key: 0 });
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');
  const chatRef = useRef<ThemeAgentChatHandle>(null);
  const [ownKey, setOwnKey] = useState(loadOwnKey);
  const ownKeyChatTransport = useMemo(
    () => ownKeyTransport({ model: ownKeyModel }),
    [ownKeyModel]
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsId = useId();

  const access: AccessState = ownKey
    ? 'own-key'
    : accessCookie
      ? 'hosted'
      : 'locked';

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

  // Fetch the answer's chunk as soon as there is a key, not on the first send.
  useEffect(() => {
    if (!ownKey) return;
    loadOwnKeyAnswer().catch((error: unknown) => {
      // Sending imports it again and reports a failure in the chat.
      console.warn('Theme Agent own-key chunk not loaded:', error);
    });
  }, [ownKey]);

  // The fresh chat focuses its own message field (`startedBy: 'new'`).
  const newConversation = () => {
    if (restart('new')) {
      setNotice('New chat started.');
    } else {
      chatRef.current?.focus();
    }
  };

  /**
   * The Theme Agent now runs elsewhere: the agent's context does not carry
   * across, so the conversation ends as with "New chat", and the fresh chat
   * takes the other transport.
   */
  const restartOnAccessChange = () => {
    const ended = chatRef.current?.end() ?? false;
    setConversation((current) => ({ key: current.key + 1 }));
    if (ended) {
      setNotice(
        'The Theme Agent now runs elsewhere, so a new conversation started.'
      );
    }
  };

  const saveKey = (key: string) => {
    if (!saveOwnKey(key)) return false;
    setOwnKey(key);
    setSettingsOpen(false);
    if (ownKey === null) restartOnAccessChange();
    return true;
  };

  const removeKey = () => {
    removeOwnKey();
    setOwnKey(null);
    setSettingsOpen(false);
    restartOnAccessChange();
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
        <span className="wa-cluster wa-gap-xs wa-align-items-center">
          {access !== 'locked' && (
            <Button
              size="small"
              appearance="outlined"
              variant="neutral"
              onClick={newConversation}
            >
              <Icon slot="start" name="plus" />
              New chat
            </Button>
          )}
          <Button
            id={settingsId}
            size="small"
            appearance="plain"
            variant="neutral"
            onClick={() => setSettingsOpen(true)}
          >
            {/* The icon names the button: an aria-label on wa-button's host
                is not exposed to the accessibility tree. */}
            <Icon name="gear" label="Settings" />
          </Button>
        </span>
      </div>
      <Tooltip for={settingsId}>Settings</Tooltip>
      <div className="wa-visually-hidden" aria-live="polite">
        {notice}
      </div>
      {access === 'locked' ? (
        <p className="theme-agent__empty">
          Add your Anthropic API key in the settings to use the Theme Agent.
        </p>
      ) : (
        <ThemeAgentChat
          key={conversation.key}
          ref={chatRef}
          startedBy={conversation.startedBy}
          draft={draft}
          onDraftChange={setDraft}
          onActivity={() => setNotice('')}
          transport={access === 'own-key' ? ownKeyChatTransport : transport}
        />
      )}
      <OwnKeySettingsDialog
        open={settingsOpen}
        hasKey={ownKey !== null}
        onSave={saveKey}
        onRemove={removeKey}
        onClose={() => setSettingsOpen(false)}
      />
    </aside>
  );
}
