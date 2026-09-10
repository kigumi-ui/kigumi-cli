import { usePatternSync } from '@/hooks/usePatternSync';
import { Card } from '@/components/ui/Card/Card';
import { TabGroup } from '@/components/ui/TabGroup/TabGroup';
import { Tab } from '@/components/ui/Tab/Tab';
import { TabPanel } from '@/components/ui/TabPanel/TabPanel';
import { CopyButton } from '@/components/ui/CopyButton/CopyButton';
import '@/components/FlushCodeBlock.css';

interface PatternSnippet {
  code: string;
  filename?: string;
}

interface MonorepoPatternBlockProps {
  snippets: {
    apps: PatternSnippet;
    packages: PatternSnippet;
  };
}

export function MonorepoPatternBlock({ snippets }: MonorepoPatternBlockProps) {
  const [pattern, setPattern] = usePatternSync();

  return (
    <Card appearance="outlined" style={{ '--spacing': '0' }}>
      <TabGroup
        activation="auto"
        active={pattern}
        onTabShow={(e: CustomEvent) => {
          const name = e.detail.name;
          if (name === 'apps' || name === 'packages') {
            setPattern(name);
          }
        }}
      >
        <Tab panel="apps">In Apps</Tab>
        <Tab panel="packages">UI Packages</Tab>

        <TabPanel name="apps" style={{ '--padding': '0' }}>
          <CodePane snippet={snippets.apps} />
        </TabPanel>
        <TabPanel name="packages" style={{ '--padding': '0' }}>
          <CodePane snippet={snippets.packages} />
        </TabPanel>
      </TabGroup>
    </Card>
  );
}

function CodePane({ snippet }: { snippet: PatternSnippet }) {
  return (
    <div>
      {snippet.filename && (
        <div
          className="wa-caption-xs"
          style={{
            padding: 'var(--wa-space-xs) var(--wa-space-m)',
            borderBottom: '1px solid var(--wa-color-border)',
            color: 'var(--wa-color-text-subdued)',
          }}
        >
          {snippet.filename}
        </div>
      )}
      <div
        className="wa-flank:end wa-align-items-start wa-gap-xs"
        style={{ position: 'relative' }}
      >
        <pre className="flush-code flush-code--below-divider">
          <code>{snippet.code}</code>
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
          <CopyButton value={snippet.code} />
        </span>
      </div>
    </div>
  );
}
