import { useState, useCallback } from 'react';
import { Dialog, Button, Textarea, Callout, Icon } from '@/components/ui';
import { parseThemeCSS, parseComponentOverrides } from '../../lib/css-parser';
import { validateCustomCSS } from '../../lib/custom-css';
import { useStudio } from '../../contexts/StudioContext';
import './CustomCSSDialog.css';

interface PasteSummary {
  tokenCount: number;
  shadowCount: number;
  hasCustomCSS: boolean;
}

function formatPasteSummary(summary: PasteSummary): string {
  const parts: string[] = [];
  if (summary.tokenCount > 0) {
    parts.push(
      `${summary.tokenCount} ${
        summary.tokenCount === 1 ? 'property' : 'properties'
      }`
    );
  }
  if (summary.shadowCount > 0) {
    parts.push(
      `${summary.shadowCount} component ${
        summary.shadowCount === 1 ? 'shadow' : 'shadows'
      }`
    );
  }
  if (summary.hasCustomCSS) {
    parts.push('custom CSS');
  }
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts[0]}, ${parts[1]}, and ${parts[2]}`;
}

interface CustomCSSDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The custom theme's custom CSS, as the export writes it, to read and edit; "Paste a theme" replaces the whole custom theme from
 * pasted CSS instead. Mounted afresh on every open (StudioLayout keys it), so
 * the editor starts from the custom CSS as it is now.
 */
export function CustomCSSDialog({ open, onClose }: CustomCSSDialogProps) {
  const [view, setView] = useState<'edit' | 'paste'>('edit');
  return (
    <Dialog
      open={open}
      label={view === 'edit' ? 'Custom CSS' : 'Paste a theme'}
      onHide={onClose}
      className="custom-css-dialog"
    >
      {view === 'edit' ? (
        <CustomCSSEditor onClose={onClose} onPaste={() => setView('paste')} />
      ) : (
        <PasteTheme onClose={onClose} onBack={() => setView('edit')} />
      )}
    </Dialog>
  );
}

function CustomCSSEditor({
  onClose,
  onPaste,
}: {
  onClose: () => void;
  onPaste: () => void;
}) {
  const { customCSS, setCustomCSS } = useStudio();
  const [draft, setDraft] = useState(() => customCSS ?? '');
  const [errors, setErrors] = useState<string[]>([]);

  const apply = () => {
    const found = validateCustomCSS(draft);
    if (found.length > 0) {
      setErrors(found);
      return;
    }
    const css = draft.trim();
    setCustomCSS(css ? css : null);
    onClose();
  };

  return (
    <>
      <div className="custom-css-dialog__content">
        <p className="custom-css-dialog__description">
          Rules for what the values cannot express. The export writes them after
          the theme, unscoped; here they style only the preview.
        </p>

        <Textarea
          className="custom-css-dialog__editor"
          label="Custom CSS"
          placeholder={`.Card > .Card {\n  box-shadow: none;\n}`}
          rows={14}
          resize="vertical"
          spellcheck={false}
          value={draft}
          onInput={(event) => {
            setDraft((event.target as HTMLTextAreaElement).value);
            setErrors([]);
          }}
        />

        {errors.length > 0 && (
          <Callout variant="danger" appearance="outlined" size="small">
            <Icon name="circle-exclamation" slot="icon" />
            Not applied: the CSS does not parse.
            <ul className="custom-css-dialog__list">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </Callout>
        )}
      </div>

      <div slot="footer" className="custom-css-dialog__footer wa-split">
        <Button
          variant="neutral"
          appearance="plain"
          size="small"
          onClick={onPaste}
        >
          <Icon name="paste" slot="start" />
          Paste a theme
        </Button>
        <div className="wa-cluster wa-gap-s">
          <Button
            variant="neutral"
            appearance="outlined"
            size="small"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button variant="brand" size="small" onClick={apply}>
            Apply
          </Button>
        </div>
      </div>
    </>
  );
}

function PasteTheme({
  onClose,
  onBack,
}: {
  onClose: () => void;
  onBack: () => void;
}) {
  const { importValues, resetAll, setCustomCSS, setShadowComponents } =
    useStudio();
  const [cssInput, setCssInput] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pasteSummary, setPasteSummary] = useState<PasteSummary | null>(null);

  const handleInput = useCallback((e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    setCssInput(target.value);
    setWarnings([]);
    setError(null);
    setPasteSummary(null);
  }, []);

  const replaceTheme = useCallback(() => {
    const trimmed = cssInput.trim();
    if (!trimmed) {
      setError('Please paste CSS to import.');
      return;
    }

    const structure = validateCustomCSS(trimmed);
    if (structure.length > 0) {
      setError(`Invalid CSS syntax: ${structure[0]}`);
      return;
    }

    try {
      // Parse both theme tokens and component overrides up front
      const result = parseThemeCSS(trimmed);
      const overrides = parseComponentOverrides(trimmed);

      const tokenCount =
        Object.keys(result.light).length + Object.keys(result.dark).length;
      const shadowCount = overrides.shadowComponents.length;
      const hasCustom = overrides.customCSS.length > 0;

      // Reject only if nothing parseable was found at all
      if (tokenCount === 0 && shadowCount === 0 && !hasCustom) {
        setError(
          'No recognized content found. Paste supports --wa-* properties in :root {} or .wa-dark {} blocks, component shadow rules, and custom CSS.'
        );
        return;
      }

      // The whole custom theme is replaced: what the paste leaves out goes
      // back to its default, custom CSS included.
      const merged: Record<string, { light?: string; dark?: string }> = {};
      for (const [cssVar, value] of Object.entries(result.light)) {
        merged[cssVar] = { ...merged[cssVar], light: value };
      }
      for (const [cssVar, value] of Object.entries(result.dark)) {
        merged[cssVar] = { ...merged[cssVar], dark: value };
      }
      resetAll();
      importValues(merged);
      setShadowComponents(overrides.shadowComponents);
      setCustomCSS(hasCustom ? overrides.customCSS : null);

      setWarnings(result.warnings);
      setPasteSummary({ tokenCount, shadowCount, hasCustomCSS: hasCustom });

      if (result.warnings.length === 0) {
        // Auto-close after short delay on clean import
        setTimeout(onClose, 800);
      }
    } catch {
      // The parsers do not throw on input they cannot read; this is a guard
      // against a bug, reported as unreadable CSS rather than a crash.
      setError('Failed to parse CSS. Please check your syntax.');
    }
  }, [
    cssInput,
    importValues,
    resetAll,
    setShadowComponents,
    setCustomCSS,
    onClose,
  ]);

  return (
    <>
      <div className="custom-css-dialog__content">
        <p className="custom-css-dialog__description">
          Replaces the whole custom theme. Paste a <code>theme.css</code>, with
          its <code>overrides.css</code> after it if it has one, or a snippet
          with <code>:root {'{}'}</code> and/or <code>.wa-dark {'{}'}</code>{' '}
          blocks of{' '}
          <a
            href="https://docs.kigumi.style/?path=/docs/design-tokens-color--docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            <code>--wa-*</code> custom properties
          </a>
          , component shadow rules, or custom CSS.
        </p>

        <Textarea
          className="custom-css-dialog__editor"
          label="Theme CSS"
          placeholder={`:root {\n  --wa-color-brand: #8b5cf6;\n  --wa-border-radius-scale: 1.5;\n}\n\n.wa-dark {\n  --wa-color-surface-default: #1a1a2e;\n}\n\n/* Component shadows */\n.Card {\n  box-shadow: var(--wa-shadow-m);\n}`}
          rows={10}
          resize="vertical"
          spellcheck={false}
          value={cssInput}
          onInput={handleInput}
        />

        {error && (
          <Callout variant="danger" appearance="outlined" size="small">
            <Icon name="circle-exclamation" slot="icon" />
            {error}
          </Callout>
        )}

        {warnings.length > 0 && (
          <Callout variant="warning" appearance="outlined" size="small">
            <Icon name="triangle-exclamation" slot="icon" />
            <strong>Replaced with warnings:</strong>
            <ul className="custom-css-dialog__list">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </Callout>
        )}

        {pasteSummary !== null && !error && (
          <Callout variant="success" appearance="outlined" size="small">
            <Icon name="circle-check" slot="icon" />
            Theme replaced: {formatPasteSummary(pasteSummary)}.
          </Callout>
        )}
      </div>

      <div slot="footer" className="custom-css-dialog__footer wa-split">
        <Button
          variant="neutral"
          appearance="plain"
          size="small"
          onClick={onBack}
        >
          <Icon name="arrow-left" slot="start" />
          Back to custom CSS
        </Button>
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
            onClick={replaceTheme}
            disabled={!cssInput.trim()}
          >
            <Icon name="download" slot="start" />
            Replace theme
          </Button>
        </div>
      </div>
    </>
  );
}
