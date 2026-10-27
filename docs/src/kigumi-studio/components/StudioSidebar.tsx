import clsx from 'clsx';
import { Accordion, Button, Icon, Divider, ButtonGroup } from '@/components/ui';
import { PanelToggle } from './PanelToggle';
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
  onThemeCSS?: () => void;
}

export function StudioSidebar({
  collapsed,
  onToggle,
  onThemeCSS,
}: StudioSidebarProps) {
  const { editMode, setEditMode, setPreviewMode } = useStudio();

  const handleModeChange = (mode: 'light' | 'dark') => {
    setEditMode(mode);
    setPreviewMode(mode);
  };

  return (
    <div
      className={clsx(
        'studio-sidebar-wrapper',
        collapsed && 'studio-sidebar-wrapper--collapsed'
      )}
    >
      <aside className="studio-sidebar" aria-label="Styles">
        <div className="studio-panel-header wa-cluster wa-align-items-center">
          <span className="wa-heading-s wa-cluster wa-gap-xs">
            <Icon name="palette" />
            Styles
          </span>
        </div>
        <div className="studio-sidebar__body">
          <div className="studio-sidebar__toolbar">
            <div className="wa-stack wa-gap-2xs">
              <span className="wa-caption-xs">Theme preset</span>
              <PresetSelector />
            </div>
            <div className="wa-cluster wa-gap-m">
              <div className="wa-stack wa-gap-2xs">
                <span className="wa-caption-xs">Theme mode</span>
                <div className="wa-cluster wa-gap-xs wa-align-items-center">
                  <ButtonGroup>
                    <Button
                      size="small"
                      variant={editMode === 'light' ? 'brand' : 'neutral'}
                      appearance={editMode === 'light' ? 'accent' : 'outlined'}
                      onClick={() => handleModeChange('light')}
                    >
                      <Icon name="sun" label="Light" slot="start" /> Light
                    </Button>
                    <Button
                      size="small"
                      variant={editMode === 'dark' ? 'brand' : 'neutral'}
                      appearance={editMode === 'dark' ? 'accent' : 'outlined'}
                      onClick={() => handleModeChange('dark')}
                    >
                      <Icon name="moon" label="Dark" slot="start" /> Dark
                    </Button>
                  </ButtonGroup>
                </div>
              </div>
              <div className="wa-stack wa-gap-2xs">
                <span className="wa-caption-xs">Theme CSS</span>
                <div className="wa-cluster wa-gap-xs wa-align-items-center">
                  <Button variant="brand" size="small" onClick={onThemeCSS}>
                    <Icon name="wrench" slot="start" />
                    Customize
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <Divider />
          {/* One accordion: each editor renders its sections as its items. */}
          <Accordion>
            <ColorEditor />
            <TypographyEditor />
            <SpacingEditor />
            <BorderEditor />
            <ShadowEditor />
            <FormControlEditor />
            <FocusEditor />
            <TransitionEditor />
          </Accordion>
        </div>
      </aside>
      <PanelToggle
        side="start"
        open={!collapsed}
        icon="palette"
        label="Styles"
        onToggle={onToggle}
      />
    </div>
  );
}
