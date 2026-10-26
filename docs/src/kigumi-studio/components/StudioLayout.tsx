import { lazy, Suspense, useState } from 'react';
import clsx from 'clsx';
import { StudioHeader } from './StudioHeader';
import { StudioSidebar } from './StudioSidebar';
import { StudioPreview } from './StudioPreview';
import { CustomCSSDialog } from './toolbar/CustomCSSDialog';
import { ExportDialog } from './toolbar/ExportDialog';
import { PanelToggle } from './PanelToggle';
import { hasThemeAgentAccess } from '../theme-agent/access';
import './StudioLayout.css';

// Its own chunk: only fetched when the access cookie is present.
const ThemeAgentSidebar = lazy(() =>
  import('./theme-agent/ThemeAgentSidebar').then((module) => ({
    default: module.ThemeAgentSidebar,
  }))
);

export function StudioLayout() {
  const [customCSSOpen, setCustomCSSOpen] = useState(false);
  // A fresh dialog on every open, so its editor starts from the custom CSS
  // as it is now (a preset may have changed it since).
  const [customCSSKey, setCustomCSSKey] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
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
    <div className="studio-layout">
      <StudioHeader />
      <div className="studio-layout__body">
        <StudioSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onCustomCSS={() => {
            setCustomCSSKey((key) => key + 1);
            setCustomCSSOpen(true);
          }}
          onExport={() => setExportOpen(true)}
        />
        <StudioPreview />
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
      <CustomCSSDialog
        key={customCSSKey}
        open={customCSSOpen}
        onClose={() => setCustomCSSOpen(false)}
      />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
