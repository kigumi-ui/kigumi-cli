import { lazy, Suspense, useState } from 'react';
import clsx from 'clsx';
import { StudioHeader } from './StudioHeader';
import { StudioSidebar } from './StudioSidebar';
import { StudioPreview } from './StudioPreview';
import { ThemeCSSDialog } from './toolbar/ThemeCSSDialog';
import { PanelToggle } from './PanelToggle';
import { StudioConsole } from './console/StudioConsole';
import { StudioConsoleProvider } from './console/StudioConsoleProvider';
import { hasThemeAgentAccess } from '../theme-agent/access';
import './StudioLayout.css';

// Its own chunk: only fetched when the access cookie is present.
const ThemeAgentSidebar = lazy(() =>
  import('./theme-agent/ThemeAgentSidebar').then((module) => ({
    default: module.ThemeAgentSidebar,
  }))
);

export function StudioLayout() {
  const [themeCSSOpen, setThemeCSSOpen] = useState(false);
  // A fresh dialog on every open, so its text starts from the custom theme
  // as it is now.
  const [themeCSSKey, setThemeCSSKey] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [themeAgentAvailable] = useState(() =>
    hasThemeAgentAccess(document.cookie)
  );
  const [themeAgentOpen, setThemeAgentOpen] = useState(false);
  // Mounted on first open and kept, so closing keeps the conversation.
  const [themeAgentMounted, setThemeAgentMounted] = useState(false);

  const toggleThemeAgent = () => {
    setThemeAgentMounted(true);
    setThemeAgentOpen((open) => !open);
  };

  return (
    <StudioConsoleProvider>
      <div className="studio-layout">
        <StudioHeader />
        <div className="studio-layout__body">
          <StudioSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            onThemeCSS={() => {
              setThemeCSSKey((key) => key + 1);
              setThemeCSSOpen(true);
            }}
          />
          {/* The console sits under the preview only, so both side panels
            keep the body's full height. */}
          <div className="studio-layout__main">
            <StudioPreview />
            <StudioConsole />
          </div>
          {/* The panel and its toggle load with Studio; the chat inside
            loads on first open. */}
          {themeAgentAvailable && (
            <div
              className={clsx(
                'theme-agent-panel',
                !themeAgentOpen && 'theme-agent-panel--collapsed'
              )}
            >
              <PanelToggle
                side="end"
                open={themeAgentOpen}
                icon="robot"
                label="Theme Agent"
                onToggle={toggleThemeAgent}
              />
              {themeAgentMounted && (
                <Suspense fallback={null}>
                  <ThemeAgentSidebar open={themeAgentOpen} />
                </Suspense>
              )}
            </div>
          )}
        </div>
        <ThemeCSSDialog
          key={themeCSSKey}
          open={themeCSSOpen}
          onClose={() => setThemeCSSOpen(false)}
        />
      </div>
    </StudioConsoleProvider>
  );
}
