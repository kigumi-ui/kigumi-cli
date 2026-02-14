import { AVAILABLE_FONTS, FONT_WEIGHTS } from './font-definitions';

export type PropertyInputType = 'color' | 'text' | 'select' | 'slider';

export type PropertyGroup =
  | 'colors-brand'
  | 'colors-surface'
  | 'colors-text'
  | 'colors-semantic'
  | 'typography-families'
  | 'typography-weights'
  | 'typography-sizes'
  | 'typography-line-heights'
  | 'spacing'
  | 'border-radius'
  | 'border-width'
  | 'shadows'
  | 'form-controls'
  | 'focus-ring'
  | 'transitions';

export interface PropertyOption {
  label: string;
  value: string;
  category?: string;
}

export interface PropertyDefinition {
  cssVar: string;
  label: string;
  group: PropertyGroup;
  inputType: PropertyInputType;
  defaultLight: string;
  defaultDark: string;
  modeDependent: boolean;
  options?: PropertyOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
}

export interface PropertyGroupInfo {
  key: PropertyGroup;
  label: string;
  description?: string;
}

export const PROPERTY_GROUPS: PropertyGroupInfo[] = [
  {
    key: 'colors-brand',
    label: 'Brand Color',
    description: 'Primary brand color used across components',
  },
  {
    key: 'colors-surface',
    label: 'Surface Colors',
    description: 'Background and border colors for surfaces',
  },
  {
    key: 'colors-text',
    label: 'Text Colors',
    description: 'Text and link colors',
  },
  {
    key: 'colors-semantic',
    label: 'Semantic Colors',
    description: 'Status and feedback colors',
  },
  {
    key: 'typography-families',
    label: 'Font Families',
    description: 'Typeface selections',
  },
  {
    key: 'typography-weights',
    label: 'Font Weights',
    description: 'Text weight values',
  },
  {
    key: 'typography-sizes',
    label: 'Font Size',
    description: 'Global font size scaling',
  },
  {
    key: 'typography-line-heights',
    label: 'Line Heights',
    description: 'Text line spacing',
  },
  { key: 'spacing', label: 'Spacing', description: 'Global spacing scale' },
  {
    key: 'border-radius',
    label: 'Border Radius',
    description: 'Corner rounding',
  },
  {
    key: 'border-width',
    label: 'Border Width & Style',
    description: 'Border thickness and style',
  },
  { key: 'shadows', label: 'Shadows', description: 'Box shadow configuration' },
  {
    key: 'form-controls',
    label: 'Form Controls',
    description: 'Input, select, and form element styling',
  },
  {
    key: 'focus-ring',
    label: 'Focus Ring',
    description: 'Focus indicator styling',
  },
  { key: 'transitions', label: 'Transitions', description: 'Animation timing' },
];

const BORDER_STYLE_OPTIONS = [
  { label: 'Solid', value: 'solid' },
  { label: 'Dashed', value: 'dashed' },
  { label: 'Dotted', value: 'dotted' },
  { label: 'Double', value: 'double' },
  { label: 'Groove', value: 'groove' },
  { label: 'Ridge', value: 'ridge' },
  { label: 'None', value: 'none' },
];

const EASING_OPTIONS = [
  { label: 'Ease', value: 'ease' },
  { label: 'Ease In', value: 'ease-in' },
  { label: 'Ease Out', value: 'ease-out' },
  { label: 'Ease In-Out', value: 'ease-in-out' },
  { label: 'Linear', value: 'linear' },
];

const FOCUS_STYLE_OPTIONS = [
  { label: 'Solid', value: 'solid' },
  { label: 'Dashed', value: 'dashed' },
  { label: 'Dotted', value: 'dotted' },
  { label: 'Double', value: 'double' },
];

export const PROPERTY_DEFINITIONS: PropertyDefinition[] = [
  // ── Colors - Brand ──
  {
    cssVar: '--wa-color-brand',
    label: 'Brand Color',
    group: 'colors-brand',
    inputType: 'color',
    defaultLight: '#0071ec',
    defaultDark: '#0071ec',
    modeDependent: false,
    description: 'Primary brand color used for accents, buttons, and links',
  },

  // ── Colors - Surface ──
  {
    cssVar: '--wa-color-surface-raised',
    label: 'Surface Raised',
    group: 'colors-surface',
    inputType: 'color',
    defaultLight: '#ffffff',
    defaultDark: '#1b1d26',
    modeDependent: true,
    description: 'Elevated surface (cards, popovers)',
  },
  {
    cssVar: '--wa-color-surface-default',
    label: 'Surface Default',
    group: 'colors-surface',
    inputType: 'color',
    defaultLight: '#ffffff',
    defaultDark: '#101219',
    modeDependent: true,
    description: 'Default page background',
  },
  {
    cssVar: '--wa-color-surface-lowered',
    label: 'Surface Lowered',
    group: 'colors-surface',
    inputType: 'color',
    defaultLight: '#f1f2f3',
    defaultDark: '#0a0b10',
    modeDependent: true,
    description: 'Recessed surface (code blocks, wells)',
  },
  {
    cssVar: '--wa-color-surface-border',
    label: 'Surface Border',
    group: 'colors-surface',
    inputType: 'color',
    defaultLight: '#e4e5e9',
    defaultDark: '#2f323f',
    modeDependent: true,
    description: 'Border color for surface elements',
  },

  // ── Colors - Text ──
  {
    cssVar: '--wa-color-text-normal',
    label: 'Text Normal',
    group: 'colors-text',
    inputType: 'color',
    defaultLight: '#1b1d26',
    defaultDark: '#f1f2f3',
    modeDependent: true,
    description: 'Primary text color',
  },
  {
    cssVar: '--wa-color-text-quiet',
    label: 'Text Quiet',
    group: 'colors-text',
    inputType: 'color',
    defaultLight: '#545868',
    defaultDark: '#9194a2',
    modeDependent: true,
    description: 'Secondary/muted text color',
  },
  {
    cssVar: '--wa-color-text-link',
    label: 'Text Link',
    group: 'colors-text',
    inputType: 'color',
    defaultLight: '#0053c0',
    defaultDark: '#6eb3ff',
    modeDependent: true,
    description: 'Link text color',
  },

  // ── Colors - Semantic ──
  {
    cssVar: '--wa-color-success',
    label: 'Success',
    group: 'colors-semantic',
    inputType: 'color',
    defaultLight: '#16a34a',
    defaultDark: '#16a34a',
    modeDependent: false,
    description: 'Base color for success states',
  },
  {
    cssVar: '--wa-color-warning',
    label: 'Warning',
    group: 'colors-semantic',
    inputType: 'color',
    defaultLight: '#d97706',
    defaultDark: '#d97706',
    modeDependent: false,
    description: 'Base color for warning states',
  },
  {
    cssVar: '--wa-color-danger',
    label: 'Danger',
    group: 'colors-semantic',
    inputType: 'color',
    defaultLight: '#dc2626',
    defaultDark: '#dc2626',
    modeDependent: false,
    description: 'Base color for danger/error states',
  },
  {
    cssVar: '--wa-color-neutral',
    label: 'Neutral',
    group: 'colors-semantic',
    inputType: 'color',
    defaultLight: '#6b7280',
    defaultDark: '#6b7280',
    modeDependent: false,
    description: 'Base color for neutral/inactive states',
  },

  // ── Typography - Families ──
  {
    cssVar: '--wa-font-family-body',
    label: 'Body Font',
    group: 'typography-families',
    inputType: 'select',
    defaultLight: 'ui-sans-serif, system-ui, sans-serif',
    defaultDark: 'ui-sans-serif, system-ui, sans-serif',
    modeDependent: false,
    options: AVAILABLE_FONTS.map((font) => ({
      label: font.name,
      value: font.value,
      category: font.category,
    })),
    description: 'Default body text font stack',
  },
  {
    cssVar: '--wa-font-family-heading',
    label: 'Heading Font',
    group: 'typography-families',
    inputType: 'select',
    defaultLight: 'ui-sans-serif, system-ui, sans-serif',
    defaultDark: 'ui-sans-serif, system-ui, sans-serif',
    modeDependent: false,
    options: AVAILABLE_FONTS.map((font) => ({
      label: font.name,
      value: font.value,
      category: font.category,
    })),
    description: 'Heading font (defaults to body font)',
  },
  {
    cssVar: '--wa-font-family-code',
    label: 'Code Font',
    group: 'typography-families',
    inputType: 'select',
    defaultLight: 'ui-monospace, monospace',
    defaultDark: 'ui-monospace, monospace',
    modeDependent: false,
    options: AVAILABLE_FONTS.map((font) => ({
      label: font.name,
      value: font.value,
      category: font.category,
    })),
    description: 'Monospace font for code',
  },
  {
    cssVar: '--wa-font-family-longform',
    label: 'Longform Font',
    group: 'typography-families',
    inputType: 'select',
    defaultLight: 'ui-serif, serif',
    defaultDark: 'ui-serif, serif',
    modeDependent: false,
    options: AVAILABLE_FONTS.map((font) => ({
      label: font.name,
      value: font.value,
      category: font.category,
    })),
    description: 'Serif font for long-form content',
  },

  // ── Typography - Font Weights ──
  {
    cssVar: '--wa-font-weight-light',
    label: 'Light',
    group: 'typography-weights',
    inputType: 'select',
    defaultLight: '300',
    defaultDark: '300',
    modeDependent: false,
    options: FONT_WEIGHTS,
    description: 'Light font weight',
  },
  {
    cssVar: '--wa-font-weight-normal',
    label: 'Normal',
    group: 'typography-weights',
    inputType: 'select',
    defaultLight: '400',
    defaultDark: '400',
    modeDependent: false,
    options: FONT_WEIGHTS,
    description: 'Normal font weight',
  },
  {
    cssVar: '--wa-font-weight-semibold',
    label: 'Semibold',
    group: 'typography-weights',
    inputType: 'select',
    defaultLight: '500',
    defaultDark: '500',
    modeDependent: false,
    options: FONT_WEIGHTS,
    description: 'Semibold font weight',
  },
  {
    cssVar: '--wa-font-weight-bold',
    label: 'Bold',
    group: 'typography-weights',
    inputType: 'select',
    defaultLight: '700',
    defaultDark: '700',
    modeDependent: false,
    options: FONT_WEIGHTS,
    description: 'Bold font weight',
  },

  // ── Typography - Size Scale ──
  {
    cssVar: '--wa-font-size-scale',
    label: 'Font Size Scale',
    group: 'typography-sizes',
    inputType: 'slider',
    defaultLight: '1',
    defaultDark: '1',
    modeDependent: false,
    min: 0.75,
    max: 1.5,
    step: 0.05,
    description: 'Global font size multiplier',
  },

  // ── Typography - Line Heights ──
  {
    cssVar: '--wa-line-height-condensed',
    label: 'Condensed',
    group: 'typography-line-heights',
    inputType: 'slider',
    defaultLight: '1.2',
    defaultDark: '1.2',
    modeDependent: false,
    min: 1,
    max: 3,
    step: 0.1,
    description: 'Condensed line height for headings',
  },
  {
    cssVar: '--wa-line-height-normal',
    label: 'Normal',
    group: 'typography-line-heights',
    inputType: 'slider',
    defaultLight: '1.6',
    defaultDark: '1.6',
    modeDependent: false,
    min: 1,
    max: 3,
    step: 0.1,
    description: 'Normal line height for body text',
  },
  {
    cssVar: '--wa-line-height-expanded',
    label: 'Expanded',
    group: 'typography-line-heights',
    inputType: 'slider',
    defaultLight: '2',
    defaultDark: '2',
    modeDependent: false,
    min: 1,
    max: 3,
    step: 0.1,
    description: 'Expanded line height for readability',
  },

  // ── Spacing ──
  {
    cssVar: '--wa-space-scale',
    label: 'Space Scale',
    group: 'spacing',
    inputType: 'slider',
    defaultLight: '1',
    defaultDark: '1',
    modeDependent: false,
    min: 0.5,
    max: 2,
    step: 0.1,
    description: 'Global spacing multiplier',
  },

  // ── Border Radius ──
  {
    cssVar: '--wa-border-radius-scale',
    label: 'Radius Scale',
    group: 'border-radius',
    inputType: 'slider',
    defaultLight: '1',
    defaultDark: '1',
    modeDependent: false,
    min: 0,
    max: 3,
    step: 0.1,
    description: 'Global border radius multiplier',
  },

  // ── Border Width & Style ──
  {
    cssVar: '--wa-border-width-scale',
    label: 'Width Scale',
    group: 'border-width',
    inputType: 'slider',
    defaultLight: '1',
    defaultDark: '1',
    modeDependent: false,
    min: 0,
    max: 3,
    step: 0.1,
    description: 'Global border width multiplier',
  },
  {
    cssVar: '--wa-border-style',
    label: 'Border Style',
    group: 'border-width',
    inputType: 'select',
    defaultLight: 'solid',
    defaultDark: 'solid',
    modeDependent: false,
    options: BORDER_STYLE_OPTIONS,
    description: 'Default border line style',
  },

  // ── Shadows ──
  // Note: Component selection combobox is rendered first in ShadowEditor.tsx
  {
    cssVar: '--wa-color-shadow',
    label: 'Shadow Color',
    group: 'shadows',
    inputType: 'color',
    defaultLight: '#000000',
    defaultDark: '#000000',
    modeDependent: true,
    description: 'Shadow color',
  },
  {
    cssVar: '--wa-shadow-opacity',
    label: 'Shadow Opacity',
    group: 'shadows',
    inputType: 'slider',
    defaultLight: '0.2',
    defaultDark: '0.5',
    modeDependent: true,
    min: 0,
    max: 1,
    step: 0.05,
    description: 'Shadow opacity (0 = transparent, 1 = opaque)',
  },
  {
    cssVar: '--wa-shadow-offset-x-scale',
    label: 'Shadow X Offset',
    group: 'shadows',
    inputType: 'slider',
    defaultLight: '0',
    defaultDark: '0',
    modeDependent: false,
    min: -2,
    max: 2,
    step: 0.1,
    description: 'Horizontal shadow offset multiplier',
  },
  {
    cssVar: '--wa-shadow-offset-y-scale',
    label: 'Shadow Y Offset',
    group: 'shadows',
    inputType: 'slider',
    defaultLight: '1',
    defaultDark: '1',
    modeDependent: false,
    min: -2,
    max: 2,
    step: 0.1,
    description: 'Vertical shadow offset multiplier',
  },
  {
    cssVar: '--wa-shadow-blur-scale',
    label: 'Shadow Blur',
    group: 'shadows',
    inputType: 'slider',
    defaultLight: '1',
    defaultDark: '1',
    modeDependent: false,
    min: 0,
    max: 5,
    step: 0.1,
    description: 'Shadow blur radius multiplier',
  },
  {
    cssVar: '--wa-shadow-spread-scale',
    label: 'Shadow Spread',
    group: 'shadows',
    inputType: 'slider',
    defaultLight: '-0.5',
    defaultDark: '-0.5',
    modeDependent: false,
    min: -2,
    max: 2,
    step: 0.1,
    description: 'Shadow spread multiplier (negative = inset)',
  },

  // ── Form Controls ──
  {
    cssVar: '--wa-form-control-background-color',
    label: 'Background',
    group: 'form-controls',
    inputType: 'color',
    defaultLight: '#ffffff',
    defaultDark: '#101219',
    modeDependent: true,
    description: 'Form input background color',
  },
  {
    cssVar: '--wa-form-control-border-color',
    label: 'Border Color',
    group: 'form-controls',
    inputType: 'color',
    defaultLight: '#9194a2',
    defaultDark: '#545868',
    modeDependent: true,
    description: 'Form input border color',
  },
  {
    cssVar: '--wa-form-control-border-style',
    label: 'Border Style',
    group: 'form-controls',
    inputType: 'select',
    defaultLight: 'var(--wa-border-style)',
    defaultDark: 'var(--wa-border-style)',
    modeDependent: false,
    options: [
      { label: 'Inherit', value: 'var(--wa-border-style)' },
      ...BORDER_STYLE_OPTIONS,
    ],
    description: 'Form input border line style',
  },
  {
    cssVar: '--wa-form-control-placeholder-color',
    label: 'Placeholder Color',
    group: 'form-controls',
    inputType: 'color',
    defaultLight: '#717584',
    defaultDark: '#717584',
    modeDependent: false,
    description: 'Placeholder text color in form inputs',
  },

  // ── Focus Ring ──
  {
    cssVar: '--wa-focus-ring-style',
    label: 'Ring Style',
    group: 'focus-ring',
    inputType: 'select',
    defaultLight: 'solid',
    defaultDark: 'solid',
    modeDependent: false,
    options: FOCUS_STYLE_OPTIONS,
    description: 'Focus ring outline style',
  },

  // ── Transitions ──
  {
    cssVar: '--wa-transition-fast',
    label: 'Fast',
    group: 'transitions',
    inputType: 'slider',
    defaultLight: '75',
    defaultDark: '75',
    modeDependent: false,
    min: 0,
    max: 1000,
    step: 25,
    unit: 'ms',
    description: 'Fast transition duration',
  },
  {
    cssVar: '--wa-transition-normal',
    label: 'Normal',
    group: 'transitions',
    inputType: 'slider',
    defaultLight: '150',
    defaultDark: '150',
    modeDependent: false,
    min: 0,
    max: 1000,
    step: 25,
    unit: 'ms',
    description: 'Normal transition duration',
  },
  {
    cssVar: '--wa-transition-slow',
    label: 'Slow',
    group: 'transitions',
    inputType: 'slider',
    defaultLight: '300',
    defaultDark: '300',
    modeDependent: false,
    min: 0,
    max: 1000,
    step: 25,
    unit: 'ms',
    description: 'Slow transition duration',
  },
  {
    cssVar: '--wa-transition-easing',
    label: 'Easing',
    group: 'transitions',
    inputType: 'select',
    defaultLight: 'ease',
    defaultDark: 'ease',
    modeDependent: false,
    options: EASING_OPTIONS,
    description: 'Default easing function',
  },
];

/** Map of properties indexed by CSS variable name */
export const PROPERTIES_BY_VAR = new Map(
  PROPERTY_DEFINITIONS.map((p) => [p.cssVar, p])
);

/** Map of properties grouped by PropertyGroup */
export const PROPERTIES_BY_GROUP = new Map<
  PropertyGroup,
  PropertyDefinition[]
>();
for (const prop of PROPERTY_DEFINITIONS) {
  const existing = PROPERTIES_BY_GROUP.get(prop.group) ?? [];
  existing.push(prop);
  PROPERTIES_BY_GROUP.set(prop.group, existing);
}
