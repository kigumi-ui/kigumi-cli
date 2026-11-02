import { useRef, useState, type FormEvent } from 'react';
import clsx from 'clsx';
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
import './OwnKeySettingsDialog.css';

const THEME_AGENT_SOURCE_URL = `${KIGUMI_REPO_URL}/tree/main/docs/src/kigumi-studio/theme-agent`;
const ANTHROPIC_CONSOLE_URL = 'https://console.anthropic.com/settings/keys';
/**
 * Whether the browser can hide a text field's characters with CSS. Then the
 * key field is a text field: Chrome's password manager wakes up whenever a
 * password field takes focus, and inside a modal dialog that blanks the page
 * for a moment. An API key is no password to save either. Elsewhere it stays
 * a password field.
 */
const MASK_WITH_CSS =
  typeof CSS !== 'undefined' && CSS.supports('-webkit-text-security', 'disc');

const REMEMBER_WITHOUT_KEY = 'Enter an Anthropic API key to remember it.';

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
  const [revealed, setRevealed] = useState(false);
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
      setRevealed(false);
    }
  }

  // Close as Escape does, so Web Awesome hands focus back to the cog.
  const close = () => dialog.current?.requestClose();

  const save = (event?: FormEvent) => {
    event?.preventDefault();
    // With a key saved and the field empty, Save only moves the saved key.
    const key = draft.trim() || saved?.key || '';
    const found = key || !remember ? ownKeyProblem(key) : REMEMBER_WITHOUT_KEY;
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
          type={MASK_WITH_CSS ? 'text' : 'password'}
          password-toggle={!MASK_WITH_CSS}
          className={clsx(
            'own-key-field',
            revealed && 'own-key-field--revealed'
          )}
          label="Anthropic API key"
          ref={keyField}
          autocomplete="off"
          spellcheck={false}
          value={draft}
          onInput={(event) => {
            setDraft((event.target as HTMLInputElement).value);
            setProblem(undefined);
          }}
        >
          {MASK_WITH_CSS && (
            <Button
              slot="end"
              size="small"
              appearance="plain"
              variant="neutral"
              onClick={() => setRevealed((shown) => !shown)}
            >
              <Icon
                name={revealed ? 'eye-slash' : 'eye'}
                label={revealed ? 'Hide key' : 'Show key'}
              />
            </Button>
          )}
          <span slot="hint">
            {saved ? (
              <>Saved key {maskOwnKey(saved.key)}.</>
            ) : (
              <>
                Create one in the{' '}
                <a
                  href={ANTHROPIC_CONSOLE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Anthropic Console
                </a>
                .
              </>
            )}
          </span>
        </Input>
        {problem && (
          <Callout variant="danger" size="small" role="alert">
            <Icon slot="icon" name="circle-exclamation" />
            {problem}
          </Callout>
        )}
        <Checkbox
          checked={remember}
          onChange={(event) => {
            const checked = (event.target as HTMLInputElement).checked;
            setRemember(checked);
            // Only a key can be remembered: say so at once, not on Save.
            setProblem(
              checked && !draft.trim() && !saved
                ? REMEMBER_WITHOUT_KEY
                : undefined
            );
          }}
        >
          Remember on this device
        </Checkbox>
        <Callout variant="brand" size="small">
          <Icon slot="icon" name="circle-info" />
          <p className="wa-body-s">
            Studio never sees your key: it stays in your browser. Check it in
            the Network tab and{' '}
            <a
              href={THEME_AGENT_SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              on GitHub
            </a>
            .
          </p>
        </Callout>
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
