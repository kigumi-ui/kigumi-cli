/**
 * Components that can receive a shadow in exported CSS. Users select
 * components from this list, and the CSS generator writes one rule per
 * component that puts `var(--wa-shadow-m)` on the element drawing its
 * visible box (`shadowSelector`).
 *
 * The paint target was decided by rendering each component in the pinned
 * Web Awesome version: the host where the host is the visible box (it
 * carries the background, border and radius), otherwise the CSS part that
 * is. A component whose host and parts draw no box of their own (a group,
 * a panel, a positioning wrapper) is not in the list: a shadow on it would
 * paint a rectangle that ignores the shape, or nothing.
 */

export interface ShadowComponent {
  name: string;
  className: string;
  category: ShadowCategory;
  /** The part that draws the visible box; absent when the host does. */
  part?: string;
}

export type ShadowCategory =
  | 'Actions'
  | 'Feedback'
  | 'Form Controls'
  | 'Imagery'
  | 'Organization'
  | 'Utilities';

export const SHADOW_CATEGORIES: ShadowCategory[] = [
  'Actions',
  'Feedback',
  'Form Controls',
  'Imagery',
  'Organization',
  'Utilities',
];

export const SHADOW_COMPONENTS: ShadowComponent[] = [
  // Actions
  { name: 'Button', className: 'Button', category: 'Actions', part: 'base' },
  {
    name: 'Dropdown',
    className: 'Dropdown',
    category: 'Actions',
    part: 'menu',
  },

  // Feedback/Status
  { name: 'Badge', className: 'Badge', category: 'Feedback' },
  { name: 'Callout', className: 'Callout', category: 'Feedback' },
  { name: 'Tag', className: 'Tag', category: 'Feedback' },
  { name: 'Tooltip', className: 'Tooltip', category: 'Feedback', part: 'body' },

  // Form Controls
  {
    name: 'Checkbox',
    className: 'Checkbox',
    category: 'Form Controls',
    part: 'control',
  },
  {
    name: 'Combobox',
    className: 'Combobox',
    category: 'Form Controls',
    part: 'combobox',
  },
  {
    name: 'Date Picker',
    className: 'DatePicker',
    category: 'Form Controls',
    part: 'base',
  },
  {
    name: 'File Input',
    className: 'FileInput',
    category: 'Form Controls',
    part: 'dropzone',
  },
  {
    name: 'Input',
    className: 'Input',
    category: 'Form Controls',
    part: 'base',
  },
  {
    name: 'Radio',
    className: 'Radio',
    category: 'Form Controls',
    part: 'control',
  },
  {
    name: 'Select',
    className: 'Select',
    category: 'Form Controls',
    part: 'combobox',
  },
  {
    name: 'Switch',
    className: 'Switch',
    category: 'Form Controls',
    part: 'control',
  },
  {
    name: 'Textarea',
    className: 'Textarea',
    category: 'Form Controls',
    part: 'base',
  },

  // Imagery
  { name: 'Avatar', className: 'Avatar', category: 'Imagery' },

  // Organization
  { name: 'Card', className: 'Card', category: 'Organization' },
  {
    name: 'Details',
    className: 'Details',
    category: 'Organization',
    part: 'base',
  },
  {
    name: 'Dialog',
    className: 'Dialog',
    category: 'Organization',
    part: 'dialog',
  },
  {
    name: 'Drawer',
    className: 'Drawer',
    category: 'Organization',
    part: 'dialog',
  },

  // Utilities
  {
    name: 'Popover',
    className: 'Popover',
    category: 'Utilities',
    part: 'body',
  },
];

const SHADOW_COMPONENTS_BY_CLASS = new Map(
  SHADOW_COMPONENTS.map((comp) => [comp.className, comp])
);

/** The shadow component with this class name, if it is in the list. */
export function shadowComponent(
  className: string
): ShadowComponent | undefined {
  return SHADOW_COMPONENTS_BY_CLASS.get(className);
}

/** The selector a component's shadow rule targets: its host or its part. */
export function shadowSelector(comp: ShadowComponent): string {
  return comp.part
    ? `.${comp.className}::part(${comp.part})`
    : `.${comp.className}`;
}

/**
 * `names` without the ones not in the list: a preset, a saved state or a
 * stored theme may name a component the list no longer has.
 */
export function knownShadowComponents(names: readonly string[]): string[] {
  return names.filter((name) => SHADOW_COMPONENTS_BY_CLASS.has(name));
}

/** Group components by category for UI display */
export const SHADOW_COMPONENTS_BY_CATEGORY = new Map<
  ShadowCategory,
  ShadowComponent[]
>();
for (const comp of SHADOW_COMPONENTS) {
  const existing = SHADOW_COMPONENTS_BY_CATEGORY.get(comp.category) ?? [];
  existing.push(comp);
  SHADOW_COMPONENTS_BY_CATEGORY.set(comp.category, existing);
}
