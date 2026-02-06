import { useState } from 'react';
import { Card } from '@/components/ui/Card/Card';
import { TabGroup } from '@/components/ui/TabGroup/TabGroup';
import { Tab } from '@/components/ui/Tab/Tab';
import { TabPanel } from '@/components/ui/TabPanel/TabPanel';
import { CopyButton } from '@/components/ui/CopyButton/CopyButton';

const PACKAGE_MANAGERS = {
  npm: 'npx kigumi init',
  pnpm: 'pnpm dlx kigumi init',
  yarn: 'yarn dlx kigumi init',
  bun: 'bunx kigumi init',
} as const;

type PackageManager = keyof typeof PACKAGE_MANAGERS;

export function InstallCommandExample() {
  const [activeTab, setActiveTab] = useState<PackageManager>('npm');

  return (
    <Card appearance="outlined" style={{ '--spacing': '0' }}>
      <TabGroup
        activation="auto"
        without-scroll-controls={true}
        active={activeTab}
        onTabShow={(e: CustomEvent) => setActiveTab(e.detail.name)}
      >
        {(Object.keys(PACKAGE_MANAGERS) as PackageManager[]).map((pm) => (
          <Tab key={pm} panel={pm}>
            {pm}
          </Tab>
        ))}

        {(Object.entries(PACKAGE_MANAGERS) as [PackageManager, string][]).map(
          ([pm, command]) => (
            <TabPanel key={pm} name={pm} style={{ '--padding': '0' }}>
              <div
                className="wa-flank:end wa-align-items-center wa-gap-xs"
                style={{ position: 'relative' }}
              >
                <pre>
                  <code>
                    <span
                      style={{
                        opacity: 0.6,
                        pointerEvents: 'none',
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 'inherit',
                        zIndex: 1,
                        userSelect: 'none',
                      }}
                      aria-hidden="true"
                    >
                      ${' '}
                    </span>
                    <span
                      style={{
                        paddingLeft: 'var(--wa-space-m)',
                        display: 'inline-block',
                      }}
                    >
                      {/* command will render here as normal */}
                    </span>
                    {command}
                  </code>
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
                  <CopyButton value={command} />
                </span>
              </div>
            </TabPanel>
          )
        )}
      </TabGroup>
    </Card>
  );
}
