/**
 * Components that can receive box-shadow in exported CSS.
 * Users select components from this list, and the CSS generator
 * outputs .ClassName { box-shadow: var(--wa-shadow-m); } rules.
 */

export interface ShadowComponent {
  name: string;
  className: string;
  category: ShadowCategory;
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
  { name: 'Button', className: 'Button', category: 'Actions' },
  { name: 'Button Group', className: 'ButtonGroup', category: 'Actions' },
  { name: 'Dropdown', className: 'Dropdown', category: 'Actions' },
  { name: 'Menu', className: 'Menu', category: 'Actions' },
  { name: 'Menu Item', className: 'MenuItem', category: 'Actions' },
  { name: 'Menu Label', className: 'MenuLabel', category: 'Actions' },

  // Feedback/Status
  { name: 'Alert', className: 'Alert', category: 'Feedback' },
  { name: 'Badge', className: 'Badge', category: 'Feedback' },
  { name: 'Callout', className: 'Callout', category: 'Feedback' },
  { name: 'Tag', className: 'Tag', category: 'Feedback' },
  { name: 'Toast', className: 'Toast', category: 'Feedback' },
  { name: 'Tooltip', className: 'Tooltip', category: 'Feedback' },

  // Form Controls
  { name: 'Checkbox', className: 'Checkbox', category: 'Form Controls' },
  { name: 'Combobox', className: 'Combobox', category: 'Form Controls' },
  { name: 'Date Picker', className: 'DatePicker', category: 'Form Controls' },
  { name: 'File Input', className: 'FileInput', category: 'Form Controls' },
  { name: 'Input', className: 'Input', category: 'Form Controls' },
  { name: 'Radio', className: 'Radio', category: 'Form Controls' },
  { name: 'Radio Group', className: 'RadioGroup', category: 'Form Controls' },
  { name: 'Select', className: 'Select', category: 'Form Controls' },
  { name: 'Switch', className: 'Switch', category: 'Form Controls' },
  { name: 'Textarea', className: 'Textarea', category: 'Form Controls' },

  // Imagery
  { name: 'Avatar', className: 'Avatar', category: 'Imagery' },
  { name: 'Carousel', className: 'Carousel', category: 'Imagery' },
  { name: 'Image Comparer', className: 'ImageComparer', category: 'Imagery' },

  // Organization
  { name: 'Breadcrumb', className: 'Breadcrumb', category: 'Organization' },
  {
    name: 'Breadcrumb Item',
    className: 'BreadcrumbItem',
    category: 'Organization',
  },
  { name: 'Card', className: 'Card', category: 'Organization' },
  { name: 'Details', className: 'Details', category: 'Organization' },
  { name: 'Dialog', className: 'Dialog', category: 'Organization' },
  { name: 'Drawer', className: 'Drawer', category: 'Organization' },
  { name: 'Tab', className: 'Tab', category: 'Organization' },
  { name: 'Tab Group', className: 'TabGroup', category: 'Organization' },
  { name: 'Tab Panel', className: 'TabPanel', category: 'Organization' },
  { name: 'Tree', className: 'Tree', category: 'Organization' },
  { name: 'Tree Item', className: 'TreeItem', category: 'Organization' },

  // Utilities
  { name: 'Popover', className: 'Popover', category: 'Utilities' },
  { name: 'Popup', className: 'Popup', category: 'Utilities' },
];

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
