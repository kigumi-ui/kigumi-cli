import React, { useCallback } from 'react';
import { Select, Option } from '@/components/ui';
import { useStudio } from '../../contexts/StudioContext';
import type {
  PropertyDefinition,
  PropertyOption,
} from '../../lib/property-definitions';
import './PropertyRow.css';

interface PropertyRowProps {
  property: PropertyDefinition;
}

export function PropertyRow({ property }: PropertyRowProps) {
  const { values, editMode, setProperty, isModified } = useStudio();
  const currentValue = values[property.cssVar]?.[editMode] ?? '';
  const modified = isModified(property.cssVar);

  return (
    <div className="property-row">
      <div className="property-row__header">
        <label className="property-row__label">
          {property.label}
          {modified && <span className="property-row__modified-dot" />}
        </label>
        <code className="property-row__var">{property.cssVar}</code>
      </div>
      <div className="property-row__control">
        <PropertyControl
          property={property}
          value={currentValue}
          onChange={(val) => setProperty(property.cssVar, val)}
        />
      </div>
    </div>
  );
}

interface PropertyControlProps {
  property: PropertyDefinition;
  value: string;
  onChange: (value: string) => void;
}

function PropertyControl({ property, value, onChange }: PropertyControlProps) {
  switch (property.inputType) {
    case 'color':
      return <ColorControl value={value} onChange={onChange} />;
    case 'slider':
      return (
        <SliderInputControl
          value={value}
          onChange={onChange}
          min={property.min ?? 0}
          max={property.max ?? 1}
          step={property.step ?? 0.1}
          unit={property.unit}
        />
      );
    case 'select':
      return (
        <SelectControl
          value={value}
          onChange={onChange}
          options={property.options ?? []}
        />
      );
    case 'text':
      return <TextControl value={value} onChange={onChange} />;
    default:
      return null;
  }
}

// ── Color Control ──
// Native <input type="color"> + <input type="text"> for reliable events

function ColorControl({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const handlePicker = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      onChange(e.currentTarget.value);
    },
    [onChange]
  );

  const handleText = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  // Ensure the color picker always gets a valid 7-char hex (native requires #rrggbb)
  const pickerValue = value.match(/^#[0-9a-fA-F]{6}$/) ? value : '#000000';

  return (
    <div className="property-row__color-control">
      <input
        type="color"
        className="property-row__color-picker"
        value={pickerValue}
        onInput={handlePicker}
      />
      <input
        type="text"
        className="property-row__color-text"
        value={value}
        onChange={handleText}
        spellCheck={false}
      />
    </div>
  );
}

// ── Slider + Input Control (shadcn-style) ──
// Native <input type="range"> + <input type="number"> — guaranteed reliable events

function SliderInputControl({
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
}) {
  // Determine decimal precision from step (e.g. step=0.1 -> 1, step=0.05 -> 2, step=25 -> 0)
  const precision = String(step).includes('.')
    ? String(step).split('.')[1].length
    : 0;

  const numValue = Number(value) || 0;
  const sliderValue = Math.min(max, Math.max(min, numValue));

  const handleSlider = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const rounded = Number(Number(e.currentTarget.value).toFixed(precision));
      onChange(String(rounded));
    },
    [onChange, precision]
  );

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      onChange(e.currentTarget.value);
    },
    [onChange]
  );

  return (
    <div className="property-row__slider-input">
      <input
        type="range"
        className="property-row__range"
        min={min}
        max={max}
        step={step}
        value={sliderValue}
        onInput={handleSlider}
      />
      <div className="property-row__number-wrapper">
        <input
          type="number"
          className="property-row__number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleInput}
        />
        {unit && <span className="property-row__unit">{unit}</span>}
      </div>
    </div>
  );
}

// ── Select Control ──

function SelectControl({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: PropertyOption[];
}) {
  const handleChange = useCallback(
    (e: Event) => {
      const target = e.target as HTMLElement & { value?: string };
      if (target.value !== undefined) onChange(target.value);
    },
    [onChange]
  );

  // Check if options have categories
  const hasCategories = options.some((opt) => opt.category);

  if (hasCategories) {
    // Group options by category and create flat list with disabled headers
    const grouped = options.reduce(
      (acc, opt) => {
        const cat = opt.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(opt);
        return acc;
      },
      {} as Record<string, PropertyOption[]>
    );

    const categories = Object.keys(grouped);
    const flatOptions: Array<{
      label: string;
      value: string;
      disabled?: boolean;
    }> = [];

    categories.forEach((category) => {
      // Add category header as disabled option
      flatOptions.push({
        label: category,
        value: `__category_${category}`,
        disabled: true,
      });
      // Add actual options with indentation
      grouped[category].forEach((opt) => {
        flatOptions.push({ label: `  ${opt.label}`, value: opt.value });
      });
    });

    return (
      <Select value={value} size="small" onChange={handleChange}>
        {flatOptions.map((opt) => (
          <Option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </Option>
        ))}
      </Select>
    );
  }

  // Web Awesome Select for non-categorized options
  return (
    <Select value={value} size="small" onChange={handleChange}>
      {options.map((opt) => (
        <Option key={opt.value} value={opt.value}>
          {opt.label}
        </Option>
      ))}
    </Select>
  );
}

// ── Text Control (font families) ──
// Uses native <input type="text"> for reliability

function TextControl({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <input
      type="text"
      className="property-row__text-input"
      value={value}
      onChange={handleChange}
    />
  );
}
