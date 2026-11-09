import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { LanguageModel } from 'ai';
import clsx from 'clsx';
import { Button, Icon, Tooltip, type ButtonRef } from '@/components/ui';
import { useThemeAgentStudio } from '../../theme-agent/use-theme-agent-studio';
import {
  loadOwnKey,
  loadOwnKeyAnswer,
  ownKeyTransport,
  removeOwnKey,
  saveOwnKey,
  type SavedOwnKey,
} from '../../theme-agent/own-key';
import type {
  ConversationStart,
  ThemeAgentChatHandle,
  ThemeAgentTransport,
} from './ThemeAgentChat';
import { OwnKeySettingsDialog } from './OwnKeySettingsDialog';
import './ThemeAgentSidebar.css';

// Its own chunk, with the AI SDK: the empty state needs neither, so a
// visitor without the cookie and without an own key never loads them.
const ThemeAgentChat = lazy(() =>
  import('./ThemeAgentChat').then((module) => ({
    default: module.ThemeAgentChat,
  }))
);

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
 * on first open (see StudioLayout), and the chat inside only with the
 * cookie or an own key: without either the panel shows an empty state that
 * offers to add a key, and no AI SDK is downloaded. Stays mounted while
 * closed to keep the conversation.
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
  const { onThemeReplaced, setOwnKeySaved } = useThemeAgentStudio();
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
  const cog = useRef<ButtonRef>(null);
  // The button that opened the settings, where focus goes back on close.
  const settingsOpener = useRef<HTMLElement | null>(null);

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
  const restartOnAccessChange = (startedBy?: ConversationStart) => {
    const ended = chatRef.current?.end() ?? false;
    setConversation((current) => ({ key: current.key + 1, startedBy }));
    if (ended) {
      setNotice(
        'The Theme Agent now runs elsewhere, so a new conversation started.'
      );
    }
  };

  const saveKey = (key: SavedOwnKey) => {
    if (!saveOwnKey(key)) return false;
    setOwnKey(key);
    setOwnKeySaved(true);
    // From the empty state, the chat that replaces it takes focus once it
    // has loaded, as a new chat does.
    if (ownKey === null)
      restartOnAccessChange(accessCookie ? undefined : 'new');
    return true;
  };

  const removeKey = () => {
    removeOwnKey();
    setOwnKey(null);
    setOwnKeySaved(false);
    restartOnAccessChange();
  };

  /** Open the settings from `opener`, where focus goes back; the cog by default. */
  const openSettings = (opener?: HTMLElement) => {
    settingsOpener.current = opener ?? null;
    setSettingsOpen(true);
  };

  /**
   * Back to the button that opened the settings. Saving a key from the empty
   * state removes that button: focus goes to the chat's message field then.
   */
  const settingsClosed = () => {
    const opener = settingsOpener.current;
    settingsOpener.current = null;
    if (opener?.isConnected) {
      opener.focus({ preventScroll: true });
    } else if (opener) {
      chatRef.current?.focus();
    } else {
      cog.current?.focus({ preventScroll: true });
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
            ref={cog}
            id={settingsId}
            size="small"
            appearance="plain"
            variant="neutral"
            onClick={() => openSettings()}
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
        <ThemeAgentEmptyState onAddKey={openSettings} />
      ) : (
        <Suspense fallback={null}>
          <ThemeAgentChat
            key={conversation.key}
            ref={chatRef}
            path={access === 'own-key' ? 'own-key' : 'hosted'}
            startedBy={conversation.startedBy}
            draft={draft}
            onDraftChange={setDraft}
            onActivity={() => setNotice('')}
            transport={access === 'own-key' ? ownKeyChatTransport : transport}
            onOpenSettings={
              access === 'own-key' ? () => openSettings() : undefined
            }
          />
        </Suspense>
      )}
      <OwnKeySettingsDialog
        open={settingsOpen}
        saved={ownKey}
        onSave={saveKey}
        onRemove={removeKey}
        onClose={() => setSettingsOpen(false)}
        onClosed={settingsClosed}
      />
    </aside>
  );
}

/**
 * The panel without the cookie and without an own key: what the Theme Agent
 * does, that the key stays in the browser, and one way in, the settings.
 */
function ThemeAgentEmptyState({
  onAddKey,
}: {
  onAddKey: (opener: HTMLElement) => void;
}) {
  return (
    <div className="theme-agent__empty-state wa-stack">
      {/* The demo video's place; empty until it is recorded, and an empty
          one takes no room. */}
      <div className="theme-agent__demo" />
      <p className="theme-agent__empty">
        Describe the theme you want, and the Theme Agent sets its colors, fonts
        and shadows in Studio. It checks contrast on every answer and leaves the
        values you lock alone.
      </p>
      <p className="theme-agent__empty">
        It runs on your own Anthropic API key, which stays in this browser and
        goes only to Anthropic.
      </p>
      <Button
        variant="brand"
        onClick={(event) => onAddKey(event.currentTarget)}
      >
        <Icon slot="start" name="key" />
        Add your API key
      </Button>
    </div>
  );
}
