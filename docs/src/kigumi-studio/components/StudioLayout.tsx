import { lazy, Suspense, useRef, useState } from 'react';
import { StudioHeader } from './StudioHeader';
import { StudioSidebar } from './StudioSidebar';
import { StudioPreview } from './StudioPreview';
import { ImportDialog } from './toolbar/ImportDialog';
import { ExportDialog } from './toolbar/ExportDialog';
import type { ButtonRef } from '@/components/ui';
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
  const themeAgentButtonRef = useRef<ButtonRef>(null);

  const toggleThemeAgent = () => {
    setThemeAgentMounted(true);
    setThemeAgentOpen((open) => !open);
  };

  const closeThemeAgent = () => {
    setThemeAgentOpen(false);
    themeAgentButtonRef.current?.focus({});
  };

  return (
    <div className="studio-layout">
      <StudioHeader
        onToggleThemeAgent={themeAgentAvailable ? toggleThemeAgent : undefined}
        themeAgentOpen={themeAgentOpen}
        themeAgentButtonRef={themeAgentButtonRef}
      />
      <div className="studio-layout__body">
        <StudioSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onImport={() => setImportOpen(true)}
          onExport={() => setExportOpen(true)}
        />
        <StudioPreview />
        {themeAgentAvailable && themeAgentMounted && (
          <Suspense fallback={null}>
            <ThemeAgentSidebar
              open={themeAgentOpen}
              onClose={closeThemeAgent}
            />
          </Suspense>
        )}
      </div>
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
