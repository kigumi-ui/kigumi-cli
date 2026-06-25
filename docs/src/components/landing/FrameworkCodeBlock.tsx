import { useFrameworkSync } from '@/hooks/useFrameworkSync';
import { Card } from '@/components/ui/Card/Card';
import { TabGroup } from '@/components/ui/TabGroup/TabGroup';
import { Tab } from '@/components/ui/Tab/Tab';
import { TabPanel } from '@/components/ui/TabPanel/TabPanel';
import { CopyButton } from '@/components/ui/CopyButton/CopyButton';
import reactLogo from '@/assets/react-logo.svg';
import vueLogo from '@/assets/vuejs-logo.svg';
import angularLogo from '@/assets/angular-logo.svg';
import nextjsLogo from '@/assets/nextjs-logo.svg';

interface FrameworkSnippet {
  code: string;
  filename?: string;
}

interface FrameworkCodeBlockProps {
  snippets: {
    react: FrameworkSnippet;
    vue: FrameworkSnippet;
    angular: FrameworkSnippet;
    nextjs: FrameworkSnippet;
  };
}

export function FrameworkCodeBlock({ snippets }: FrameworkCodeBlockProps) {
  const [framework, setFramework] = useFrameworkSync();

  return (
    <Card appearance="outlined" style={{ '--spacing': '0' }}>
      <TabGroup
        activation="auto"
        active={framework}
        onTabShow={(e: CustomEvent) => {
          const name = e.detail.name;
          if (
            name === 'react' ||
            name === 'vue' ||
            name === 'angular' ||
            name === 'nextjs'
          ) {
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
        <Tab panel="angular">
          <span className="wa-span-grid wa-justify-content-center wa-align-items-center wa-gap-xs">
            <img
              src={angularLogo}
              alt="Angular logo"
              style={{ width: '16px', height: '16px' }}
            />
            Angular
          </span>
        </Tab>
        <Tab panel="nextjs">
          <span className="wa-span-grid wa-justify-content-center wa-align-items-center wa-gap-xs">
            <img
              src={nextjsLogo}
              alt="Next.js logo"
              style={{ width: '16px', height: '16px' }}
            />
            Next.js
          </span>
        </Tab>

        <TabPanel name="react" style={{ '--padding': '0' }}>
          <CodePane snippet={snippets.react} />
        </TabPanel>
        <TabPanel name="vue" style={{ '--padding': '0' }}>
          <CodePane snippet={snippets.vue} />
        </TabPanel>
        <TabPanel name="angular" style={{ '--padding': '0' }}>
          <CodePane snippet={snippets.angular} />
        </TabPanel>
        <TabPanel name="nextjs" style={{ '--padding': '0' }}>
          <CodePane snippet={snippets.nextjs} />
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
