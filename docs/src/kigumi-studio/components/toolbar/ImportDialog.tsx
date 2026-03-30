import { useState, useCallback } from 'react';
import { Dialog, Button, Textarea, Callout, Icon } from '@/components/ui';
import {
  parseThemeCSS,
  parseComponentOverrides,
  hasValidCSSStructure,
} from '../../lib/css-parser';
import { useStudio } from '../../contexts/StudioContext';
import './ImportDialog.css';

interface ImportSummary {
  tokenCount: number;
  shadowCount: number;
  hasCustomCSS: boolean;
}

function formatImportSummary(summary: ImportSummary): string {
  const parts: string[] = [];
  if (summary.tokenCount > 0) {
    parts.push(
      `${summary.tokenCount} ${summary.tokenCount === 1 ? 'property' : 'properties'}`
    );
  }
  if (summary.shadowCount > 0) {
    parts.push(
      `${summary.shadowCount} component ${summary.shadowCount === 1 ? 'shadow' : 'shadows'}`
    );
  }
  if (summary.hasCustomCSS) {
    parts.push('custom CSS');
  }
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts[0]}, ${parts[1]}, and ${parts[2]}`;
}

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ImportDialog({ open, onClose }: ImportDialogProps) {
  const { importValues, resetAll, setCustomCSS, setShadowComponents } =
    useStudio();
  const [cssInput, setCssInput] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(
    null
  );

  const handleInput = useCallback((e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    setCssInput(target.value);
    setWarnings([]);
    setError(null);
    setImportSummary(null);
  }, []);

  const handleClose = useCallback(() => {
    setCssInput('');
    setWarnings([]);
    setError(null);
    setImportSummary(null);
    onClose();
  }, [onClose]);

  const handleImport = useCallback(() => {
    const trimmed = cssInput.trim();
    if (!trimmed) {
      setError('Please paste CSS to import.');
      return;
    }

    if (!hasValidCSSStructure(trimmed)) {
      setError(
        'Invalid CSS syntax. Check for balanced braces and valid rules.'
      );
      return;
    }

    try {
      // Parse both theme tokens and component overrides up front
      const result = parseThemeCSS(trimmed);
      const overrides = parseComponentOverrides(trimmed, '.studio-preview');

      const tokenCount =
        Object.keys(result.light).length + Object.keys(result.dark).length;
      const shadowCount = overrides.shadowComponents.length;
      const hasCustom = overrides.customCSS.length > 0;

      // Reject only if nothing parseable was found at all
      if (tokenCount === 0 && shadowCount === 0 && !hasCustom) {
        setError(
          'No recognized content found. Import supports --wa-* properties in :root {} or .wa-dark {} blocks, component shadow rules, and custom CSS.'
        );
        return;
      }

      // Apply theme tokens (full replacement: reset then import)
      if (tokenCount > 0) {
        const merged: Record<string, { light?: string; dark?: string }> = {};
        for (const [cssVar, value] of Object.entries(result.light)) {
          merged[cssVar] = { ...merged[cssVar], light: value };
        }
        for (const [cssVar, value] of Object.entries(result.dark)) {
          merged[cssVar] = { ...merged[cssVar], dark: value };
        }
        resetAll();
        importValues(merged);
      }

      // Apply component overrides
      if (shadowCount > 0) {
        setShadowComponents(overrides.shadowComponents);
      }
      if (hasCustom) {
        setCustomCSS(overrides.customCSS);
      }

      setWarnings(result.warnings);
      setImportSummary({ tokenCount, shadowCount, hasCustomCSS: hasCustom });

      if (result.warnings.length === 0) {
        // Auto-close after short delay on clean import
        setTimeout(() => {
          handleClose();
        }, 800);
      }
    } catch {
      setError('Failed to parse CSS. Please check your syntax.');
    }
  }, [
    cssInput,
    importValues,
    resetAll,
    setShadowComponents,
    setCustomCSS,
    handleClose,
  ]);

  return (
    <Dialog open={open} label="Import Theme CSS" onHide={handleClose}>
      <div className="import-dialog__content">
        <p className="import-dialog__description">
          Paste a <code>theme.css</code> file or CSS snippet containing{' '}
          <code>:root {'{}'}</code> and/or <code>.wa-dark {'{}'}</code> blocks
          with{' '}
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
          placeholder={`:root {\n  --wa-color-brand: #8b5cf6;\n  --wa-border-radius-scale: 1.5;\n}\n\n.wa-dark {\n  --wa-color-surface-default: #1a1a2e;\n}\n\n/* Component shadows */\n.Card {\n  box-shadow: var(--wa-shadow-m);\n}`}
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

        {importSummary !== null && !error && (
          <Callout variant="success" appearance="outlined" size="small">
            <Icon name="circle-check" slot="icon" />
            Successfully imported {formatImportSummary(importSummary)}.
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
          <Icon name="download" slot="start" />
          Import
        </Button>
      </div>
    </Dialog>
  );
}
