import { useState } from 'react';
import {
  Dialog,
  Button,
  Textarea,
  Callout,
  CopyButton,
  Icon,
} from '@/components/ui';
import { NO_LOCKS } from '../../lib/locks';
import { themeEdits, themeFiles, themeText } from '../../lib/theme-css';
import { useStudio } from '../../contexts/StudioContext';
import './ThemeCSSDialog.css';

interface ThemeCSSDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The whole custom theme as the CSS a project gets, theme.css then
 * overrides.css, in one text field to read, edit and copy. Apply takes only
 * the edits made to the text (`themeEdits`). Mounted afresh on every open
 * (StudioLayout keys it), so the text starts from the custom theme as it is.
 */
export function ThemeCSSDialog({ open, onClose }: ThemeCSSDialogProps) {
  const {
    values,
    shadowComponents,
    customCSS,
    lockedValues,
    locksAvailable,
    importValues,
    setShadowComponents,
    setCustomCSS,
  } = useStudio();
  const current = { values, shadowComponents, customCSS };
  // What the text showed when it was last applied, or when the dialog opened.
  const [shown, setShown] = useState(() => themeText(current));
  const [draft, setDraft] = useState(shown);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const files = themeFiles(current);
  const edited = draft !== shown;

  const apply = () => {
    const edits = themeEdits(
      shown,
      draft,
      locksAvailable ? lockedValues : NO_LOCKS
    );
    if (edits.errors.length > 0) {
      setErrors(edits.errors);
      return;
    }
    importValues(edits.values);
    if (edits.shadowComponents) setShadowComponents(edits.shadowComponents);
    if (edits.customCSS !== undefined) setCustomCSS(edits.customCSS);
    if (edits.warnings.length === 0) {
      onClose();
      return;
    }
    // Stay open to say what was not taken; the next Apply takes only new edits.
    setWarnings(edits.warnings);
    setShown(draft);
  };

  return (
    <Dialog
      open={open}
      label="Theme CSS"
      onHide={onClose}
      className="theme-css-dialog"
    >
      <div className="theme-css-dialog__content">
        <p className="theme-css-dialog__description">
          The custom theme as a project gets it: <code>theme.css</code> with the
          values, then <code>overrides.css</code> with the custom CSS, which
          wins. Edit either part, or paste a whole theme over the text; Apply
          takes what you changed.
        </p>

        <Textarea
          className="theme-css-dialog__editor"
          label="Theme CSS"
          rows={18}
          resize="vertical"
          spellcheck={false}
          value={draft}
          onInput={(event) => {
            setDraft((event.target as HTMLTextAreaElement).value);
            setErrors([]);
            setWarnings([]);
          }}
        />

        {errors.length > 0 && (
          <Callout variant="danger" appearance="outlined" size="small">
            <Icon name="circle-exclamation" slot="icon" />
            Not applied: the CSS does not parse.
            <ul className="theme-css-dialog__list">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </Callout>
        )}

        {warnings.length > 0 && (
          <Callout variant="warning" appearance="outlined" size="small">
            <Icon name="triangle-exclamation" slot="icon" />
            Applied, except:
            <ul className="theme-css-dialog__list">
              {warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </Callout>
        )}
      </div>

      <div slot="footer" className="theme-css-dialog__footer wa-split">
        <div className="wa-cluster wa-gap-s wa-align-items-center">
          <span className="theme-css-dialog__copy">
            theme.css
            <CopyButton
              value={files.theme}
              disabled={edited || !files.theme}
              copy-label="Copy theme.css"
              success-label="Copied"
            />
          </span>
          <span className="theme-css-dialog__copy">
            overrides.css
            <CopyButton
              value={files.overrides}
              disabled={edited || !files.overrides}
              copy-label="Copy overrides.css"
              success-label="Copied"
            />
          </span>
          {edited && (
            <span className="theme-css-dialog__hint">
              Apply to copy your edits
            </span>
          )}
        </div>
        <div className="wa-cluster wa-gap-s">
          <Button
            variant="neutral"
            appearance="outlined"
            size="small"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="brand"
            size="small"
            disabled={!edited}
            onClick={apply}
          >
            Apply
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
