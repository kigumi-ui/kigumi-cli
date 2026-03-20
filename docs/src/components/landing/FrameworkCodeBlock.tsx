import { useFrameworkSync } from '@/hooks/useFrameworkSync';
import { Card } from '@/components/ui/Card/Card';
import { TabGroup } from '@/components/ui/TabGroup/TabGroup';
import { Tab } from '@/components/ui/Tab/Tab';
import { TabPanel } from '@/components/ui/TabPanel/TabPanel';
import { CopyButton } from '@/components/ui/CopyButton/CopyButton';
import reactLogo from '@/assets/react-logo.svg';
import vueLogo from '@/assets/vuejs-logo.svg';
import angularLogo from '@/assets/angular-logo.svg';
import svelteLogo from '@/assets/svelte-logo.svg';
import { Badge } from '../ui/Badge/Badge';

interface FrameworkSnippet {
  code: string;
  filename?: string;
}

interface FrameworkCodeBlockProps {
  snippets: {
    react: FrameworkSnippet;
    vue: FrameworkSnippet;
  };
}

export function FrameworkCodeBlock({ snippets }: FrameworkCodeBlockProps) {
  const [framework, setFramework] = useFrameworkSync();

  return (
    <Card appearance="outlined" style={{ '--spacing': '0' }}>
      <TabGroup
        activation="auto"
        without-scroll-controls={true}
        active={framework}
        onTabShow={(e: CustomEvent) => {
          const name = e.detail.name;
          if (name === 'react' || name === 'vue') {
            setFramework(name);
          }
        }}
      >
        <Tab panel="react">
          <span className="wa-span-grid wa-justify-content-center wa-align-items-center wa-gap-xs">
            <img
              src={reactLogo}
              alt="React logo"
              style={{ width: '16px', height: '16px' }}
            />
            React
          </span>
        </Tab>
        <Tab panel="vue">
          <span className="wa-span-grid wa-justify-content-center wa-align-items-center wa-gap-xs">
            <img
              src={vueLogo}
              alt="Vue logo"
              style={{ width: '16px', height: '16px' }}
            />
            Vue
          </span>
        </Tab>
        <Tab panel="angular" disabled>
          <span className="wa-span-grid wa-justify-content-center wa-align-items-center wa-gap-xs">
            <img
              src={angularLogo}
              alt="Angular logo"
              style={{
                width: '16px',
                height: '16px',
              }}
            />
            Angular
            <Badge appearance="outlined" variant="neutral" pill>
              Coming soon
            </Badge>
          </span>
        </Tab>
        <Tab panel="svelte" disabled>
          <span className="wa-span-grid wa-justify-content-center wa-align-items-center wa-gap-xs">
            <img
              src={svelteLogo}
              alt="Svelte logo"
              style={{
                width: '16px',
                height: '16px',
              }}
            />
            Svelte
            <Badge appearance="outlined" variant="neutral" pill>
              Coming soon
            </Badge>
          </span>
        </Tab>

        <TabPanel name="react" style={{ '--padding': '0' }}>
          <CodePane snippet={snippets.react} />
        </TabPanel>
        <TabPanel name="vue" style={{ '--padding': '0' }}>
          <CodePane snippet={snippets.vue} />
        </TabPanel>
      </TabGroup>
    </Card>
  );
}

function CodePane({ snippet }: { snippet: FrameworkSnippet }) {
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
        <pre>
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
