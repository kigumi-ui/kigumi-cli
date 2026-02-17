import { useState, useEffect, useCallback } from 'react';
import { Select, Option } from '@/components/ui';
import { loadPresets, type ThemePreset } from '../../lib/preset-loader';
import { useStudio } from '../../contexts/StudioContext';

export function PresetSelector() {
  const {
    importValues,
    resetAll,
    setShadowComponents,
    setCustomCSS,
    selectedPreset,
    setSelectedPreset,
  } = useStudio();
  const [presets, setPresets] = useState<ThemePreset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadPresets()
      .then((loaded) => {
        if (!cancelled) {
          setPresets(loaded);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = useCallback(
    (e: Event) => {
      const target = e.target as HTMLSelectElement;
      const value = target.value;

      if (!value) {
        return;
      }

      if (value === '__default__') {
        resetAll();
        return;
      }

      const preset = presets.find((p) => p.filename === value);
      if (!preset) return;

      // First reset to defaults, then apply preset values
      resetAll();
      const merged: Record<string, { light?: string; dark?: string }> = {};
      for (const [cssVar, val] of Object.entries(preset.values.light)) {
        merged[cssVar] = { ...merged[cssVar], light: val };
      }
      for (const [cssVar, val] of Object.entries(preset.values.dark)) {
        merged[cssVar] = { ...merged[cssVar], dark: val };
      }
      importValues(merged);
      setShadowComponents(preset.shadowComponents);
      setCustomCSS(preset.customCSS || null);
      setSelectedPreset(preset.filename);
    },
    [
      presets,
      importValues,
      resetAll,
      setShadowComponents,
      setCustomCSS,
      setSelectedPreset,
    ]
  );

  if (loading || presets.length === 0) {
    return null;
  }

  return (
    <Select
      size="small"
      value={selectedPreset ?? '__default__'}
      onChange={handleChange}
    >
      <Option value="__default__">Default</Option>
      <wa-divider />
      {presets.map((preset) => (
        <Option key={preset.filename} value={preset.filename}>
          {preset.name}
        </Option>
      ))}
    </Select>
  );
}
