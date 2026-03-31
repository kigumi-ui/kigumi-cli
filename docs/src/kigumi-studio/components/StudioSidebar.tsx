import { useState } from 'react';
import { Button, Icon, Divider, ButtonGroup, Dialog } from '@/components/ui';
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
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleModeChange = (mode: 'light' | 'dark') => {
    setEditMode(mode);
    setPreviewMode(mode);
  };

  const sourceMode = editMode === 'dark' ? 'light' : 'dark';

  const handleGenerate = () => {
    // Read the OPPOSITE mode's colors as source, generate for the CURRENT mode
    const neutralHex =
      values['--wa-color-neutral']?.[sourceMode] ??
      values['--wa-color-neutral']?.light ??
      '#6b7280';
    const brandHex =
      values['--wa-color-brand']?.[sourceMode] ??
      values['--wa-color-brand']?.light ??
      '#0071ec';

    // Collect source mode's mode-dependent values for context (shadow opacity etc.)
    const sourceColors: Record<string, string> = {};
    for (const prop of PROPERTY_DEFINITIONS) {
      if (!prop.modeDependent) continue;
      const val = values[prop.cssVar]?.[sourceMode];
      if (val) sourceColors[prop.cssVar] = val;
    }

    // Generate current mode colors from source mode using WA palette architecture
    const generated = generateOppositeMode(
      neutralHex,
      brandHex,
      editMode,
      sourceColors
    );

    // Apply generated values to the current edit mode
    const importRecord: Record<string, { light?: string; dark?: string }> = {};
    for (const [cssVar, val] of Object.entries(generated)) {
      importRecord[cssVar] =
        editMode === 'light' ? { light: val } : { dark: val };
    }

    // Sync mode-independent color properties from source to current mode
    const modeIndependentColors = [
      '--wa-color-brand',
      '--wa-color-success',
      '--wa-color-warning',
      '--wa-color-danger',
      '--wa-color-neutral',
    ];
    for (const cssVar of modeIndependentColors) {
      const sourceVal = values[cssVar]?.[sourceMode];
      if (sourceVal) {
        importRecord[cssVar] = {
          ...importRecord[cssVar],
          [editMode]: sourceVal,
        };
      }
    }

    importValues(importRecord);
  };

  return (
    <div
      className={`studio-sidebar-wrapper ${collapsed ? 'studio-sidebar-wrapper--collapsed' : ''}`}
    >
      <aside className="studio-sidebar wa-justify-content-stretch">
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
            <div className="wa-stack wa-gap-2xs">
              <span className="wa-caption-xs">Color mode</span>
              <div className="wa-cluster wa-gap-xs wa-align-items-center">
                <Button
                  variant="neutral"
                  appearance="outlined"
                  size="small"
                  onClick={() => setConfirmOpen(true)}
                  title={`Generate ${editMode} mode colors from ${sourceMode} mode`}
                >
                  <Icon name="wand-magic-sparkles" slot="start" />
                  Generate from {sourceMode}
                </Button>
              </div>
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
      <Dialog
        open={confirmOpen}
        label={`Override ${editMode} mode colors?`}
        onHide={() => setConfirmOpen(false)}
      >
        <p>
          This will replace all {editMode} color tokens with values generated
          from your {sourceMode} mode, adjusted for {editMode} contrast and
          readability.
        </p>
        <div
          slot="footer"
          className="wa-cluster wa-gap-xs wa-justify-content-end"
        >
          <Button
            variant="neutral"
            appearance="outlined"
            size="small"
            onClick={() => setConfirmOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="brand"
            size="small"
            onClick={() => {
              handleGenerate();
              setConfirmOpen(false);
            }}
          >
            Generate
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
