import { Card, CopyButton } from '@/components/ui';

interface CodeBlockProps {
  /** The command or code to display */
  value: string;
  /** Override the value copied to clipboard (useful when display contains <placeholders>) */
  copyValue?: string;
  /** Position CopyButton at top-right instead of vertically centered (for tall blocks) */
  multiline?: boolean;
}

export function CodeBlock({ value, copyValue, multiline }: CodeBlockProps) {
  const copyText = copyValue ?? value;

  if (multiline) {
    return (
      <Card appearance="outlined" style={{ '--spacing': '0' }}>
        <div style={{ position: 'relative' }}>
          <pre style={{ margin: 0 }}>
            <code>{value}</code>
          </pre>
          <span
            style={{
              position: 'absolute',
              right: 'var(--wa-space-xs)',
              top: 'var(--wa-space-xs)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CopyButton value={copyText} />
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card appearance="outlined" style={{ '--spacing': '0' }}>
      <div
        className="wa-flank:end wa-align-items-center wa-gap-xs"
        style={{ position: 'relative' }}
      >
        <pre style={{ margin: 0 }}>
          <code>{value}</code>
        </pre>
        <span
          style={{
            position: 'absolute',
            right: 'var(--wa-space-xs)',
            top: '0',
            bottom: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CopyButton value={copyText} />
        </span>
      </div>
    </Card>
  );
}
