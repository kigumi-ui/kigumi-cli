import { Button, Icon, Divider, ButtonGroup } from '@/components/ui';
import { ColorEditor } from './editor/ColorEditor';
import { TypographyEditor } from './editor/TypographyEditor';
import { SpacingEditor } from './editor/SpacingEditor';
import { BorderEditor } from './editor/BorderEditor';
import { ShadowEditor } from './editor/ShadowEditor';
import { FormControlEditor } from './editor/FormControlEditor';
import { FocusEditor } from './editor/FocusEditor';
import { TransitionEditor } from './editor/TransitionEditor';
import './StudioSidebar.css';
import { PresetSelector } from './toolbar/PresetSelector';

interface StudioSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onImport?: () => void;
  onExport?: () => void;
}

export function StudioSidebar({
  collapsed,
  onToggle,
  onImport,
  onExport,
}: StudioSidebarProps) {
  return (
    <div
      className={`studio-sidebar-wrapper ${collapsed ? 'studio-sidebar-wrapper--collapsed' : ''}`}
    >
      <aside className="studio-sidebar wa-gap-xs wa-stack wa-justify-content-stretch">
        <PresetSelector />
        <ButtonGroup>
          <Button
            variant="neutral"
            appearance="outlined"
            size="small"
            onClick={onImport}
          >
            <Icon name="download" slot="start" />
            Import
          </Button>
          <Button variant="brand" size="small" onClick={onExport}>
            <Icon name="upload" slot="start" />
            Export
          </Button>
        </ButtonGroup>
        <Divider />
        <ColorEditor />
        <TypographyEditor />
        <SpacingEditor />
        <BorderEditor />
        <ShadowEditor />
        <FormControlEditor />
        <FocusEditor />
        <TransitionEditor />
      </aside>
      <button
        className="studio-sidebar__toggle"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {/* Desktop: horizontal chevrons */}
        <span className="studio-sidebar__toggle-icon--desktop">
          <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} />
        </span>
        {/* Mobile: vertical chevrons (sidebar is at bottom) */}
        <span className="studio-sidebar__toggle-icon--mobile">
          <Icon name={collapsed ? 'chevron-up' : 'chevron-down'} />
        </span>
      </button>
    </div>
  );
}
