import { Button, Icon, Divider, ButtonGroup } from '@/components/ui';
import { useStudio } from '../contexts/StudioContext';
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
  const { editMode, setEditMode, setPreviewMode } = useStudio();

  const handleModeChange = (mode: 'light' | 'dark') => {
    setEditMode(mode);
    setPreviewMode(mode);
  };

  return (
    <div
      className={`studio-sidebar-wrapper ${collapsed ? 'studio-sidebar-wrapper--collapsed' : ''}`}
    >
      <aside className="studio-sidebar wa-gap-xs wa-stack wa-justify-content-stretch">
        <div className="studio-sidebar__toolbar">
          <div className="wa-cluster wa-gap-xs">
            <div className="wa-stack wa-gap-2xs">
              <span className="wa-caption-xs">Theme preset</span>
              <PresetSelector />
            </div>
            <div className="wa-stack wa-gap-2xs">
              <span className="wa-caption-xs">Theme mode</span>
              <ButtonGroup>
                <Button
                  size="small"
                  variant={editMode === 'light' ? 'brand' : 'neutral'}
                  appearance={editMode === 'light' ? 'accent' : 'outlined'}
                  onClick={() => handleModeChange('light')}
                >
                  <Icon name="sun" label="Light" />
                </Button>
                <Button
                  size="small"
                  variant={editMode === 'dark' ? 'brand' : 'neutral'}
                  appearance={editMode === 'dark' ? 'accent' : 'outlined'}
                  onClick={() => handleModeChange('dark')}
                >
                  <Icon name="moon" label="Dark" />
                </Button>
              </ButtonGroup>
            </div>
          </div>
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
        </div>
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
      <Button
        className="studio-sidebar__toggle"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        appearance="filled"
        size="small"
      >
        <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} />
      </Button>
    </div>
  );
}
