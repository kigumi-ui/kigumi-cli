import { useState } from 'react';
import {
  Dialog,
  Button,
  ButtonGroup,
  Dropdown,
  DropdownItem,
  Textarea,
  Callout,
  Icon,
  type DropdownProps,
} from '@/components/ui';
import { NO_LOCKS } from '../../lib/locks';
import {
  themeDownloads,
  themeEdits,
  themeText,
  type CustomThemeState,
} from '../../lib/theme-css';
import { useStudio } from '../../contexts/StudioContext';
import { useCustomCSSLock } from '../../theme-agent/use-value-lock';
import { LockSwitch } from '../editor/LockSwitch';
import './ThemeCSSDialog.css';

interface ThemeCSSDialogProps {
  open: boolean;
  onClose: () => void;
}

type Download = 'all' | 'theme.css' | 'overrides.css';

/**
 * Hand `content` to the browser as a file named `name`. The link goes into
 * the document for the click, and its URL is freed only later: a browser
 * reads the file name once the download starts, and Safari names a file
 * after the blob id, without its extension, when the URL is already gone.
 */
function saveFile(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/css' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 40_000);
}

function download(theme: CustomThemeState, which: Download) {
  for (const file of themeDownloads(theme)) {
    if (which === 'all' || which === file.name)
      saveFile(file.name, file.content);
  }
}

/**
 * The "Customize theme CSS" dialog: the whole custom theme as the CSS a
 * project gets, theme.css then overrides.css, in one text field to read and
 * edit, and to download as the two files. Apply takes only the edits made to
 * the text (`themeEdits`). Mounted afresh on every open (StudioLayout keys
 * it), so the text starts from the custom theme as it is.
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
  const customCSSLock = useCustomCSSLock();
  const current = { values, shadowComponents, customCSS };
  // What the text showed when it was last applied, or when the dialog opened.
  const [shown, setShown] = useState(() => themeText(current));
  const [draft, setDraft] = useState(shown);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const edited = draft !== shown;

  const onDownloadSelect: NonNullable<DropdownProps['onSelect']> = (event) => {
    // Web Awesome types `detail.item` as `Element`; the value is the
    // DropdownItem's, narrowed below to the two file names.
    const { item } = event.detail;
    const value = 'value' in item ? item.value : undefined;
    if (value === 'theme.css' || value === 'overrides.css') {
      download(current, value);
    }
  };

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
      label="Customize theme CSS"
      onHide={(event) => {
        // wa-hide bubbles: the download menu closing is not the dialog.
        if (event.target === event.currentTarget) onClose();
      }}
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

        {/* Only with the Theme Agent's access cookie; keeps overrides.css
            from the Theme Agent and from edits here. */}
        <LockSwitch
          lock={customCSSLock}
          context="overrides.css"
          label="Lock custom CSS"
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
        {/* The applied theme as files; unapplied edits are not in it. */}
        <div className="wa-cluster wa-gap-s wa-align-items-center">
          <ButtonGroup label="Download">
            <Button
              variant="neutral"
              appearance="outlined"
              size="small"
              disabled={edited}
              onClick={() => download(current, 'all')}
            >
              <Icon name="download" slot="start" />
              Download all
            </Button>
            <Dropdown
              size="small"
              placement="top-end"
              disabled={edited}
              onSelect={onDownloadSelect}
            >
              <Button
                slot="trigger"
                variant="neutral"
                appearance="outlined"
                size="small"
                disabled={edited}
              >
                <Icon name="chevron-down" label="More downloads" />
              </Button>
              <DropdownItem value="theme.css">Download theme.css</DropdownItem>
              <DropdownItem value="overrides.css">
                Download overrides.css
              </DropdownItem>
            </Dropdown>
          </ButtonGroup>
          {edited && (
            <span className="theme-css-dialog__hint">
              Apply to download your edits
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
