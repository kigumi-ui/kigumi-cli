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
import { generateOppositeMode } from '../lib/color-utils';
import { PROPERTY_DEFINITIONS } from '../lib/property-definitions';

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
  const { editMode, setEditMode, setPreviewMode, values, importValues } =
    useStudio();

  const handleModeChange = (mode: 'light' | 'dark') => {
    setEditMode(mode);
    setPreviewMode(mode);
  };

  const targetMode = editMode === 'dark' ? 'light' : 'dark';

  const handleGenerate = () => {
    // Use the CURRENT edit mode's values as source (user may have edited in one mode only)
    const neutralHex =
      values['--wa-color-neutral']?.[editMode] ??
      values['--wa-color-neutral']?.light ??
      '#6b7280';
    const brandHex =
      values['--wa-color-brand']?.[editMode] ??
      values['--wa-color-brand']?.light ??
      '#0071ec';

    // Collect current mode's mode-dependent values for context (shadow opacity etc.)
    const sourceColors: Record<string, string> = {};
    for (const prop of PROPERTY_DEFINITIONS) {
      if (!prop.modeDependent) continue;
      const val = values[prop.cssVar]?.[editMode];
      if (val) sourceColors[prop.cssVar] = val;
    }

    // Generate opposite mode using WA palette architecture
    const generated = generateOppositeMode(
      neutralHex,
      brandHex,
      targetMode,
      sourceColors
    );

    // Apply generated values to the target mode
    const importRecord: Record<string, { light?: string; dark?: string }> = {};
    for (const [cssVar, val] of Object.entries(generated)) {
      importRecord[cssVar] =
        targetMode === 'light' ? { light: val } : { dark: val };
    }

    // Sync mode-independent color properties to the target mode
    // (brand, semantic colors may have been edited in only one mode)
    const modeIndependentColors = [
      '--wa-color-brand',
      '--wa-color-success',
      '--wa-color-warning',
      '--wa-color-danger',
      '--wa-color-neutral',
    ];
    for (const cssVar of modeIndependentColors) {
      const currentVal = values[cssVar]?.[editMode];
      if (currentVal) {
        importRecord[cssVar] = {
          ...importRecord[cssVar],
          [targetMode]: currentVal,
        };
      }
    }

    importValues(importRecord);
  };

  return (
    <div
      className={`studio-sidebar-wrapper ${collapsed ? 'studio-sidebar-wrapper--collapsed' : ''}`}
    >
      <aside className="studio-sidebar wa-gap-xs wa-stack wa-justify-content-stretch">
        <div className="studio-sidebar__toolbar">
          <div className="wa-stack wa-gap-2xs">
            <span className="wa-caption-xs">Theme preset</span>
            <PresetSelector />
          </div>
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
              <Button
                variant="neutral"
                appearance="outlined"
                size="small"
                onClick={handleGenerate}
                title={`Auto-fill ${targetMode} mode colors from current ${editMode} mode`}
              >
                <Icon name="wand-magic-sparkles" slot="start" />
                Auto-fill {targetMode}
              </Button>
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
