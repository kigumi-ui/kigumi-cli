import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Badge, Button, Icon, Tab, TabGroup, TabPanel } from '@/components/ui';
import { useAccessibilityTab } from './use-accessibility-tab';
import { useStudioConsole, type ConsoleTab } from './studio-console';
import './StudioConsole.css';

/**
 * The panel along the bottom of the preview, for every visitor. Collapsed it
 * is a bar with an icon and a count per kind of finding, like a browser's
 * DevTools; a count opens it on its tab. Inside a `StudioConsoleProvider`.
 */
export function StudioConsole() {
  const studioConsole = useStudioConsole();
  // One entry per tab, each tab's hook called unconditionally and always in
  // this order (the rules of hooks): a later tab adds its call here.
  const tabs: ConsoleTab[] = [useAccessibilityTab()];
  const panelRef = useRef<HTMLDivElement>(null);

  const focusRequest = studioConsole?.focusRequest ?? 0;
  useEffect(() => {
    if (focusRequest > 0) panelRef.current?.focus();
  }, [focusRequest]);

  if (!studioConsole) return null;
  const { open, active, show, setOpen, setActive } = studioConsole;

  return (
    <section
      className={clsx('studio-console', open && 'studio-console--open')}
      aria-label="Studio console"
    >
      <div className="wa-cluster wa-gap-xs wa-align-items-center studio-console__bar">
        {tabs.map((tab) => (
          <Button
            key={tab.name}
            className="studio-console__count"
            appearance="plain"
            size="small"
            variant={tab.count > 0 ? 'danger' : 'neutral'}
            title={`${tab.label}: ${tab.count} ${tab.countLabel}`}
            onClick={() => show(tab.name)}
          >
            <Icon slot="start" name={tab.icon} />
            {tab.count}
            <span className="wa-visually-hidden"> {tab.countLabel}</span>
          </Button>
        ))}
        <Button
          className="studio-console__toggle"
          appearance="plain"
          size="small"
          onClick={() => setOpen(!open)}
        >
          {/* The icon names the button: an aria-label on wa-button's host is
              not exposed to the accessibility tree. */}
          <Icon
            name={open ? 'xmark' : 'chevron-up'}
            label={open ? 'Hide console' : 'Show console'}
          />
        </Button>
      </div>
      {open && (
        <div ref={panelRef} className="studio-console__panel" tabIndex={-1}>
          <TabGroup
            active={active}
            onTabShow={(event) => {
              const tab = tabs.find(
                (entry) => entry.name === event.detail.name
              );
              if (tab) setActive(tab.name);
            }}
          >
            {tabs.map((tab) => (
              <Tab key={tab.name} slot="nav" panel={tab.name}>
                {tab.label}
                <Badge
                  className="studio-console__tab-count"
                  variant={tab.count > 0 ? 'danger' : 'neutral'}
                  pill
                >
                  {tab.count}
                  <span className="wa-visually-hidden"> {tab.countLabel}</span>
                </Badge>
              </Tab>
            ))}
            {tabs.map((tab) => (
              <TabPanel key={tab.name} name={tab.name}>
                {tab.content}
              </TabPanel>
            ))}
          </TabGroup>
        </div>
      )}
    </section>
  );
}
