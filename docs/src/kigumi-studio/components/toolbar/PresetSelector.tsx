import { useState, useEffect, useCallback, useRef } from 'react';
import { Select, Option } from '@/components/ui';
import { loadPresets, type ThemePreset } from '../../lib/preset-loader';
import { useStudio } from '../../contexts/StudioContext';

export function PresetSelector() {
  const { importValues, resetAll } = useStudio();
  const [presets, setPresets] = useState<ThemePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const selectRef = useRef<HTMLElement>(null);

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

      if (!value || value === '__none__') {
        return;
      }

      if (value === '__reset__') {
        resetAll();
        // Reset the select value
        if (selectRef.current) {
          (selectRef.current as unknown as { value: string }).value =
            '__none__';
        }
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

      // Reset select back to placeholder
      if (selectRef.current) {
        (selectRef.current as unknown as { value: string }).value = '__none__';
      }
    },
    [presets, importValues, resetAll]
  );

  if (loading || presets.length === 0) {
    return null;
  }

  return (
    <Select
      ref={selectRef as React.Ref<never>}
      placeholder="Choose a preset..."
      size="small"
      value="__none__"
      onChange={handleChange}
    >
      {presets.map((preset) => (
        <Option key={preset.filename} value={preset.filename}>
          {preset.name}
        </Option>
      ))}
      <wa-divider />
      <Option value="__reset__">Reset to Defaults</Option>
    </Select>
  );
}
