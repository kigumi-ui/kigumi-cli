import { lazy, Suspense, useState } from 'react';
import clsx from 'clsx';
import { StudioHeader } from './StudioHeader';
import { StudioSidebar } from './StudioSidebar';
import { StudioPreview } from './StudioPreview';
import { ImportDialog } from './toolbar/ImportDialog';
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
  const [importOpen, setImportOpen] = useState(false);
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
          onImport={() => setImportOpen(true)}
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
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
