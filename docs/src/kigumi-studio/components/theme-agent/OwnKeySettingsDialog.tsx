import { useRef, useState, type FormEvent } from 'react';
import {
  Button,
  Callout,
  Checkbox,
  Dialog,
  Icon,
  Input,
  type DialogRef,
  type InputRef,
} from '@/components/ui';
import { KIGUMI_REPO_URL } from '@/lib/repository';
import {
  maskOwnKey,
  ownKeyProblem,
  type SavedOwnKey,
} from '../../theme-agent/own-key';

const THEME_AGENT_SOURCE_URL = `${KIGUMI_REPO_URL}/tree/main/docs/src/kigumi-studio/theme-agent`;
const ANTHROPIC_CONSOLE_URL = 'https://console.anthropic.com/settings/keys';

interface OwnKeySettingsDialogProps {
  open: boolean;
  /** The saved own key: the dialog shows it masked and offers Remove key. */
  saved: SavedOwnKey | null;
  /**
   * A key shaped like an Anthropic API key, trimmed, and where to keep it.
   * `false` when it could not be kept: the browser blocks storage.
   */
  onSave: (key: SavedOwnKey) => boolean;
  onRemove: () => void;
  /** The dialog closed, by any of its actions, Escape or its close button. */
  onClose: () => void;
  /** It has finished closing: focus can go back to what opened it. */
  onClosed: () => void;
}

/**
 * The Theme Agent's settings: the own key (ADR 0017), where it is kept, and
 * what a visitor needs to trust Studio with it. Only the key's form is
 * checked; Anthropic decides whether it is a key. Nothing is kept until
 * Save: Cancel, Escape and closing leave the saved key and where it is kept
 * as they were, and the next opening starts with an empty field, so neither
 * a typed key nor a refused value outlives the dialog.
 */
export function OwnKeySettingsDialog({
  open,
  saved,
  onSave,
  onRemove,
  onClose,
  onClosed,
}: OwnKeySettingsDialogProps) {
  const [draft, setDraft] = useState('');
  const [problem, setProblem] = useState<string>();
  const [remember, setRemember] = useState(saved?.remembered ?? false);
  const [wasOpen, setWasOpen] = useState(open);
  // A fresh key field per opening: wa-input keeps a value React cleared.
  const [opening, setOpening] = useState(0);
  const dialog = useRef<DialogRef>(null);
  const keyField = useRef<InputRef>(null);

  // Each opening starts from what is saved, whatever an earlier one left.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setOpening((count) => count + 1);
      setDraft('');
      setProblem(undefined);
      setRemember(saved?.remembered ?? false);
    }
  }

  // Close as Escape does, so Web Awesome hands focus back to the cog.
  const close = () => dialog.current?.requestClose();

  const save = (event?: FormEvent) => {
    event?.preventDefault();
    // With a key saved and the field empty, Save only moves the saved key.
    const key = draft.trim() || saved?.key || '';
    const found = ownKeyProblem(key);
    if (found) {
      setProblem(found);
      return;
    }
    if (onSave({ key, remembered: remember })) {
      close();
    } else {
      setProblem(
        'This browser does not let Studio keep the key. Allow storage for this site and try again.'
      );
    }
  };

  const keyHint = saved
    ? `Saved key ${maskOwnKey(saved.key)}, kept ${
        saved.remembered ? 'on this device' : 'in this tab'
      }. Enter another key to replace it.`
    : 'Sent only to api.anthropic.com.';

  return (
    <Dialog
      ref={dialog}
      open={open}
      label="Theme Agent settings"
      // `autofocus` would not do: React sets it as wa-input's property, and
      // the dialog looks for the attribute.
      onAfterShow={() => keyField.current?.focus({ preventScroll: true })}
      onHide={onClose}
      onAfterHide={onClosed}
    >
      <form className="wa-stack wa-gap-m" onSubmit={save}>
        <Input
          key={opening}
          type="password"
          password-toggle
          label="Anthropic API key"
          ref={keyField}
          hint={keyHint}
          autocomplete="off"
          spellcheck={false}
          value={draft}
          onInput={(event) => {
            setDraft((event.target as HTMLInputElement).value);
            setProblem(undefined);
          }}
        />
        {problem && (
          <Callout variant="danger" size="small" role="alert">
            <Icon slot="icon" name="circle-exclamation" />
            {problem}
          </Callout>
        )}
        <Checkbox
          checked={remember}
          hint="Keeps the key for every tab. Any script on this page can read a remembered key; without this, closing the tab forgets it."
          onChange={(event) =>
            setRemember((event.target as HTMLInputElement).checked)
          }
        >
          Remember on this device
        </Checkbox>
        <Callout variant="brand" size="small">
          <Icon slot="icon" name="circle-info" />
          <p className="wa-body-s">
            Your key is sent only to api.anthropic.com, never to Kigumi or
            trigger.dev, and Studio records no telemetry. To check, open your
            browser&rsquo;s developer tools and watch the Network tab while the
            Theme Agent answers: every request goes to api.anthropic.com.{' '}
            <a
              href={THEME_AGENT_SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the source on GitHub
            </a>
            .
          </p>
        </Callout>
        <p className="wa-body-s">
          Use a dedicated key with a spend limit, so a leaked key cannot cost
          you much. Create one in the{' '}
          <a
            href={ANTHROPIC_CONSOLE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Anthropic Console
          </a>
          .
        </p>
        <div className="wa-cluster wa-gap-s">
          {saved && (
            <Button
              variant="danger"
              appearance="outlined"
              size="small"
              onClick={() => {
                onRemove();
                close();
              }}
            >
              Remove key
            </Button>
          )}
          <Button
            variant="neutral"
            appearance="outlined"
            size="small"
            onClick={close}
          >
            Cancel
          </Button>
          <Button variant="brand" size="small" onClick={() => save()}>
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
