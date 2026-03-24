import { useMemo } from 'react';
import {
  Dialog,
  Button,
  Textarea,
  CopyButton,
  Icon,
  Callout,
} from '@/components/ui';
import { generateThemeCSS } from '../../lib/css-generator';
import { useStudio } from '../../contexts/StudioContext';
import './ExportDialog.css';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ExportDialog({ open, onClose }: ExportDialogProps) {
  const { getModifiedProperties, shadowComponents, customCSS } = useStudio();

  const { css, lightCount, darkCount, shadowCount } = useMemo(() => {
    const { light, dark } = getModifiedProperties();
    const generated = generateThemeCSS(light, dark, {
      shadowComponents,
      customCSS,
    });
    return {
      css: generated,
      lightCount: Object.keys(light).length,
      darkCount: Object.keys(dark).length,
      shadowCount: shadowComponents.length,
    };
  }, [getModifiedProperties, shadowComponents, customCSS]);

  const totalCount = lightCount + darkCount + shadowCount;
  const isEmpty = totalCount === 0;

  return (
    <Dialog open={open} label="Export Theme CSS" onHide={onClose}>
      <div className="export-dialog__content">
        {isEmpty ? (
          <Callout variant="neutral" appearance="outlined" size="small">
            <Icon name="circle-info" slot="icon" />
            No properties have been modified. Change some values in the editor
            to generate CSS output.
          </Callout>
        ) : (
          <>
            <div className="export-dialog__textarea-wrapper">
              <Textarea value={css} rows={14} resize="vertical" readonly />
              <div className="export-dialog__copy-wrapper">
                <CopyButton
                  value={css}
                  copy-label="Copy CSS"
                  success-label="Copied!"
                />
              </div>
            </div>

            <p className="export-dialog__hint">
              Paste this into your project&apos;s <code>theme.css</code> file
              after using <code>npx kigumi init</code>.
            </p>
          </>
        )}
      </div>

      <div slot="footer" className="export-dialog__footer">
        <Button
          variant="neutral"
          appearance="outlined"
          size="small"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </Dialog>
  );
}
