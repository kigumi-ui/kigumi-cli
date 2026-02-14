import { useState } from 'react';
import { StudioHeader } from './StudioHeader';
import { StudioSidebar } from './StudioSidebar';
import { StudioPreview } from './StudioPreview';
import { ImportDialog } from './toolbar/ImportDialog';
import { ExportDialog } from './toolbar/ExportDialog';
import './StudioLayout.css';

export function StudioLayout() {
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      </div>
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
