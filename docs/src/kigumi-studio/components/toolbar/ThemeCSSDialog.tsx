import { useEffect, useEffectEvent, useState } from 'react';
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
  withImportedValues,
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

/** How long the text rests after the last keystroke before it is saved. */
const SAVE_DELAY_MS = 1000;
/** The least time Save shows as saving, so the save can be seen. */
const SAVING_MIN_MS = 400;
/** How long Save shows "Saved" before it reads Save again. */
const SAVED_SHOWN_MS = 1000;

type SaveStatus = 'idle' | 'saving' | 'saved';

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
 * edit, and to download as the two files. An edit saves itself a second
 * after the last keystroke, and Save, Close and a download save it at once;
 * a save takes only the edits made to the text (`themeEdits`), and text that
 * does not parse is never saved. Mounted afresh on every open (StudioLayout
 * keys it), so the text starts from the custom theme as it is.
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
  // What the text showed when it was last saved, or when the dialog opened.
  const [shown, setShown] = useState(() => themeText(current));
  const [draft, setDraft] = useState(shown);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  /**
   * Save the text's edits, and return the theme as saved; null when the
   * text does not parse. The theme is built here, since the Studio's state
   * shows the save only on the next render.
   */
  const save = (): CustomThemeState | null => {
    if (draft === shown) return current;
    const edits = themeEdits(
      shown,
      draft,
      locksAvailable ? lockedValues : NO_LOCKS
    );
    if (edits.errors.length > 0) {
      setErrors(edits.errors);
      return null;
    }
    importValues(edits.values);
    if (edits.shadowComponents) setShadowComponents(edits.shadowComponents);
    if (edits.customCSS !== undefined) setCustomCSS(edits.customCSS);
    setWarnings(edits.warnings);
    setShown(draft);
    setStatus('saving');
    return {
      values: withImportedValues(values, edits.values),
      shadowComponents: edits.shadowComponents ?? shadowComponents,
      customCSS: edits.customCSS !== undefined ? edits.customCSS : customCSS,
    };
  };

  // An effect event reads the latest `save`, so a re-render (a Theme Agent
  // answer arriving) does not restart the delay; only a keystroke does.
  const saveAfterDelay = useEffectEvent(() => save());
  useEffect(() => {
    if (draft === shown) return;
    const timer = setTimeout(saveAfterDelay, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft, shown]);

  useEffect(() => {
    if (status === 'idle') return;
    const timer =
      status === 'saving'
        ? setTimeout(() => setStatus('saved'), SAVING_MIN_MS)
        : setTimeout(() => setStatus('idle'), SAVED_SHOWN_MS);
    return () => clearTimeout(timer);
  }, [status]);

  const requestDownload = (which: Download) => {
    const theme = save();
    if (theme) download(theme, which);
  };

  /** Save; with nothing to save, still say the text is saved. */
  const saveNow = () => {
    if (draft === shown) setStatus('saved');
    else save();
  };

  /**
   * Close, saving the text first. Text that does not parse is dropped, but
   * only once its error has been seen: when this Close is what finds it, the
   * dialog stays open to show why (`event` is Escape's or the overlay's hide
   * request, refused), and the next Close drops it.
   */
  const close = (event?: Event) => {
    const errorShown = errors.length > 0;
    if (!save() && !errorShown) {
      event?.preventDefault();
      return;
    }
    onClose();
  };

  // What the status region says, for a screen reader: the button and the
  // callouts change without moving focus.
  const announcement =
    errors.length > 0
      ? 'Not saved: the CSS does not parse.'
      : status !== 'saved'
        ? ''
        : warnings.length > 0
          ? `Saved, except: ${warnings.join(' ')}`
          : 'Saved';

  const onDownloadSelect: NonNullable<DropdownProps['onSelect']> = (event) => {
    // Web Awesome types `detail.item` as `Element`; the value is the
    // DropdownItem's, narrowed below to the two file names.
    const { item } = event.detail;
    const value = 'value' in item ? item.value : undefined;
    if (value === 'theme.css' || value === 'overrides.css') {
      requestDownload(value);
    }
  };

  return (
    <Dialog
      open={open}
      label="Customize theme CSS"
      onHide={close}
      className="theme-css-dialog"
    >
      <div className="theme-css-dialog__content">
        <p className="theme-css-dialog__description">
          The custom theme as a project gets it: <code>theme.css</code> with the
          values, then <code>overrides.css</code> with the custom CSS, which
          wins. Edit either part, or paste a whole theme over the text; what you
          changed saves itself a second after you stop typing.
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
            setStatus('idle');
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
          <Callout variant="danger" appearance="filled" size="small">
            <Icon name="circle-exclamation" slot="icon" />
            Not saved: the CSS does not parse.
            <ul className="theme-css-dialog__list">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </Callout>
        )}

        {warnings.length > 0 && (
          <Callout variant="warning" appearance="filled" size="small">
            <Icon name="triangle-exclamation" slot="icon" />
            Saved, except:
            <ul className="theme-css-dialog__list">
              {warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </Callout>
        )}
      </div>

      <div slot="footer" className="theme-css-dialog__footer wa-split">
        {/* A download saves the text first, so it holds every edit. */}
        <ButtonGroup label="Download">
          <Button
            variant="neutral"
            appearance="outlined"
            size="small"
            onClick={() => requestDownload('all')}
          >
            <Icon name="download" slot="start" />
            Download all
          </Button>
          <Dropdown
            size="small"
            placement="top-end"
            onSelect={onDownloadSelect}
          >
            <Button
              slot="trigger"
              variant="neutral"
              appearance="outlined"
              size="small"
            >
              <Icon name="chevron-down" label="More downloads" />
            </Button>
            <DropdownItem value="theme.css">Download theme.css</DropdownItem>
            <DropdownItem value="overrides.css">
              Download overrides.css
            </DropdownItem>
          </Dropdown>
        </ButtonGroup>
        <div className="wa-cluster wa-gap-s">
          <Button
            variant="neutral"
            appearance="outlined"
            size="small"
            onClick={() => close()}
          >
            Close
          </Button>
          <Button
            variant="brand"
            size="small"
            loading={status === 'saving'}
            onClick={saveNow}
          >
            {status === 'saved' && <Icon name="check" slot="start" />}
            {status === 'saved' ? 'Saved' : 'Save'}
          </Button>
          <span role="status" className="wa-visually-hidden">
            {announcement}
          </span>
        </div>
      </div>
    </Dialog>
  );
}
