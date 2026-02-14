import { useState, useCallback } from 'react';
import { Dialog, Button, Textarea, Callout, Icon } from '@/components/ui';
import { parseThemeCSS } from '../../lib/css-parser';
import { useStudio } from '../../contexts/StudioContext';
import './ImportDialog.css';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ImportDialog({ open, onClose }: ImportDialogProps) {
  const { importValues } = useStudio();
  const [cssInput, setCssInput] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const handleInput = useCallback((e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    setCssInput(target.value);
    setWarnings([]);
    setError(null);
    setImportedCount(null);
  }, []);

  const handleClose = useCallback(() => {
    setCssInput('');
    setWarnings([]);
    setError(null);
    setImportedCount(null);
    onClose();
  }, [onClose]);

  const handleImport = useCallback(() => {
    const trimmed = cssInput.trim();
    if (!trimmed) {
      setError('Please paste CSS to import.');
      return;
    }

    try {
      const result = parseThemeCSS(trimmed);
      const lightCount = Object.keys(result.light).length;
      const darkCount = Object.keys(result.dark).length;
      const totalCount = lightCount + darkCount;

      if (totalCount === 0) {
        setError(
          'No recognized --wa-* properties found. Make sure your CSS contains :root {} or .wa-dark {} blocks with Web Awesome custom properties.'
        );
        return;
      }

      // Convert ParseResult to the format importValues expects
      const merged: Record<string, { light?: string; dark?: string }> = {};
      for (const [cssVar, value] of Object.entries(result.light)) {
        merged[cssVar] = { ...merged[cssVar], light: value };
      }
      for (const [cssVar, value] of Object.entries(result.dark)) {
        merged[cssVar] = { ...merged[cssVar], dark: value };
      }

      importValues(merged);
      setWarnings(result.warnings);
      setImportedCount(totalCount);

      if (result.warnings.length === 0) {
        // Auto-close after short delay on clean import
        setTimeout(() => {
          handleClose();
        }, 800);
      }
    } catch {
      setError('Failed to parse CSS. Please check your syntax.');
    }
  }, [cssInput, importValues, handleClose]);

  return (
    <Dialog open={open} label="Import Theme CSS" onHide={handleClose}>
      <div className="import-dialog__content">
        <p className="import-dialog__description">
          Paste a <code>theme.css</code> file or CSS snippet containing{' '}
          <code>:root {'{}'}</code> and/or <code>.wa-dark {'{}'}</code> blocks
          with{' '}
          <a
            href="https://webawesome.com/docs/tokens"
            target="_blank"
            rel="noopener noreferrer"
          >
            <code>--wa-*</code> custom properties
          </a>
          .
        </p>

        <Textarea
          placeholder={`:root {\n  --wa-color-brand: #8b5cf6;\n  --wa-border-radius-scale: 1.5;\n}\n\n.wa-dark {\n  --wa-color-surface-default: #1a1a2e;\n}`}
          rows={10}
          resize="vertical"
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
            <strong>Imported with warnings:</strong>
            <ul className="import-dialog__warnings">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </Callout>
        )}

        {importedCount !== null && !error && (
          <Callout variant="success" appearance="outlined" size="small">
            <Icon name="circle-check" slot="icon" />
            Successfully imported {importedCount} properties.
          </Callout>
        )}
      </div>

      <div slot="footer" className="import-dialog__footer">
        <Button
          variant="neutral"
          appearance="outlined"
          size="small"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          variant="brand"
          size="small"
          onClick={handleImport}
          disabled={!cssInput.trim()}
        >
          <Icon name="file-import" slot="start" />
          Import
        </Button>
      </div>
    </Dialog>
  );
}
