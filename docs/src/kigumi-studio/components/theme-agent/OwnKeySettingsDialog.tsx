import { useRef, useState, type FormEvent } from 'react';
import {
  Button,
  Callout,
  Dialog,
  Icon,
  Input,
  type InputRef,
} from '@/components/ui';
import { ownKeyProblem } from '../../theme-agent/own-key';

interface OwnKeySettingsDialogProps {
  open: boolean;
  /** Whether an own key is saved: then the dialog offers Remove key. */
  hasKey: boolean;
  /**
   * A key shaped like an Anthropic API key, trimmed. `false` when it could
   * not be kept: the browser blocks storage.
   */
  onSave: (key: string) => boolean;
  onRemove: () => void;
  onClose: () => void;
}

/**
 * The Theme Agent's settings: the own key (ADR 0017). Only its form is
 * checked; Anthropic decides whether it is a key. Closing empties the field,
 * so neither a typed key nor a refused value outlives it.
 */
export function OwnKeySettingsDialog({
  open,
  hasKey,
  onSave,
  onRemove,
  onClose,
}: OwnKeySettingsDialogProps) {
  const [draft, setDraft] = useState('');
  const [problem, setProblem] = useState<string>();
  const keyField = useRef<InputRef>(null);

  const save = (event?: FormEvent) => {
    event?.preventDefault();
    const found = ownKeyProblem(draft);
    if (found) {
      setProblem(found);
      return;
    }
    if (!onSave(draft.trim())) {
      setProblem(
        'This browser does not let Studio keep the key. Allow storage for this site and try again.'
      );
    }
  };

  return (
    <Dialog
      open={open}
      label="Theme Agent settings"
      // `autofocus` would not do: React sets it as wa-input's property, and
      // the dialog looks for the attribute.
      onAfterShow={() => keyField.current?.focus({ preventScroll: true })}
      onHide={() => {
        setDraft('');
        setProblem(undefined);
        onClose();
      }}
    >
      <form className="wa-stack wa-gap-m" onSubmit={save}>
        <Input
          type="password"
          label="Anthropic API key"
          ref={keyField}
          hint={
            hasKey
              ? 'A key is saved for this tab. Enter another to replace it.'
              : 'Kept in this tab only, and sent only to api.anthropic.com.'
          }
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
        <div className="wa-cluster wa-gap-s">
          {hasKey && (
            <Button
              variant="danger"
              appearance="outlined"
              size="small"
              onClick={onRemove}
            >
              Remove key
            </Button>
          )}
          <Button
            variant="neutral"
            appearance="outlined"
            size="small"
            onClick={onClose}
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
