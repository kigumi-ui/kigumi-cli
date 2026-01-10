/**
 * Component Registry
 *
 * This module handles fetching and managing component definitions.
 * Component definitions include metadata, props, CSS variables, and dependencies.
 */

export interface ComponentProp {
  name: string;
  type: string;
  values?: string[];
  default?: string;
  description?: string;
  required?: boolean;
}

export interface ComponentDefinition {
  name: string;
  tagName: string;
  category: string;
  description: string;
  dependencies: string[];
  files: {
    react?: string[];
    vue?: string[];
    svelte?: string[];
  };
  props: ComponentProp[];
  importPath: string; // e.g., '@awesome.me/webawesome-pro/dist/components/button/button.js'
  tier: 'free' | 'pro'; // Whether component requires Pro tier
}

export interface ComponentRegistry {
  [key: string]: ComponentDefinition;
}

/**
 * Local registry as fallback
 * TODO: Fetch this from a remote source or build from Web Awesome docs
 */
export const LOCAL_REGISTRY: ComponentRegistry = {
  button: {
    name: 'Button',
    tagName: 'wa-button',
    category: 'Actions',
    description: 'Buttons represent actions that are available to the user',
    dependencies: [],
    files: {
      react: ['components/Button.tsx', 'types/button.d.ts'],
      vue: ['components/Button.vue'],
      svelte: ['components/Button.svelte'],
    },
    props: [
      {
        name: 'variant',
        type: 'string',
        values: ['neutral', 'brand', 'success', 'warning', 'danger'],
        default: 'neutral',
        description: 'Semantic variant of the button',
      },
      {
        name: 'appearance',
        type: 'string',
        values: ['accent', 'filled-outlined', 'filled', 'outlined', 'plain'],
        default: 'filled',
        description: 'Visual appearance style',
      },
      {
        name: 'size',
        type: 'string',
        values: ['small', 'medium', 'large'],
        default: 'medium',
        description: 'Button size',
      },
      {
        name: 'pill',
        type: 'boolean',
        default: 'false',
        description: 'Gives the button rounded edges',
      },
      {
        name: 'disabled',
        type: 'boolean',
        default: 'false',
        description: 'Disables the button',
      },
      {
        name: 'loading',
        type: 'boolean',
        default: 'false',
        description: 'Shows a loading indicator',
      },
      {
        name: 'with-caret',
        type: 'boolean',
        default: 'false',
        description: 'Adds a dropdown indicator caret',
        required: false,
      },
      {
        name: 'href',
        type: 'string',
        description: 'Makes the button work like a link',
        required: false,
      },
      {
        name: 'target',
        type: 'string',
        values: ['_blank', '_self', '_parent', '_top'],
        description: 'Link target (when href is set)',
        required: false,
      },
      {
        name: 'download',
        type: 'string',
        description: 'Download filename (when href is set)',
        required: false,
      },
      {
        name: 'rel',
        type: 'string',
        description: 'Link relationship (when href is set)',
        required: false,
      },
    ],
    importPath: '@awesome.me/webawesome/dist/components/button/button.js',
    tier: 'free',
  },
  input: {
    name: 'Input',
    tagName: 'wa-input',
    category: 'Form Controls',
    description: 'Inputs collect data from the user',
    dependencies: [],
    files: {
      react: ['components/Input.tsx', 'types/input.d.ts'],
      vue: ['components/Input.vue'],
      svelte: ['components/Input.svelte'],
    },
    props: [
      {
        name: 'type',
        type: 'string',
        values: [
          'text',
          'email',
          'password',
          'number',
          'date',
          'tel',
          'url',
          'search',
        ],
        default: 'text',
        description: 'Input type',
      },
      {
        name: 'label',
        type: 'string',
        description: 'Accessible label for the input',
        required: false,
      },
      {
        name: 'hint',
        type: 'string',
        description: 'Descriptive hint text',
        required: false,
      },
      {
        name: 'placeholder',
        type: 'string',
        description: 'Placeholder text',
        required: false,
      },
      {
        name: 'value',
        type: 'string',
        description: 'Input value',
        required: false,
      },
      {
        name: 'appearance',
        type: 'string',
        values: ['filled', 'filled-outlined', 'outlined'],
        default: 'outlined',
        description: 'Visual appearance style',
      },
      {
        name: 'size',
        type: 'string',
        values: ['small', 'medium', 'large'],
        default: 'medium',
        description: 'Input size',
      },
      {
        name: 'pill',
        type: 'boolean',
        default: 'false',
        description: 'Gives the input rounded edges',
      },
      {
        name: 'disabled',
        type: 'boolean',
        default: 'false',
        description: 'Disables the input',
      },
      {
        name: 'with-clear',
        type: 'boolean',
        default: 'false',
        description: 'Adds a clear button when input has content',
        required: false,
      },
      {
        name: 'password-toggle',
        type: 'boolean',
        default: 'false',
        description: 'Adds a toggle button for password visibility',
        required: false,
      },
    ],
    importPath: '@awesome.me/webawesome/dist/components/input/input.js',
    tier: 'free',
  },
  card: {
    name: 'Card',
    tagName: 'wa-card',
    category: 'Organization',
    description: 'Cards can be used to group related subjects in a container',
    dependencies: [],
    files: {
      react: ['components/Card.tsx', 'types/card.d.ts'],
      vue: ['components/Card.vue'],
      svelte: ['components/Card.svelte'],
    },
    props: [
      {
        name: 'appearance',
        type: 'string',
        values: ['outlined', 'filled-outlined', 'plain', 'filled', 'accent'],
        default: 'outlined',
        description: 'Visual appearance style',
      },
      {
        name: 'orientation',
        type: 'string',
        values: ['vertical', 'horizontal'],
        default: 'vertical',
        description: 'Card layout orientation',
      },
      {
        name: 'with-header',
        type: 'boolean',
        default: 'false',
        description: 'Adds header section (for SSR)',
        required: false,
      },
      {
        name: 'with-footer',
        type: 'boolean',
        default: 'false',
        description: 'Adds footer section (for SSR)',
        required: false,
      },
      {
        name: 'with-media',
        type: 'boolean',
        default: 'false',
        description: 'Adds media section (for SSR)',
        required: false,
      },
    ],
    importPath: '@awesome.me/webawesome/dist/components/card/card.js',
    tier: 'free',
  },
  dialog: {
    name: 'Dialog',
    tagName: 'wa-dialog',
    category: 'Overlays',
    description: 'Dialogs display important prompts and information',
    dependencies: [],
    files: {
      react: ['components/Dialog.tsx', 'types/dialog.d.ts'],
      vue: ['components/Dialog.vue'],
      svelte: ['components/Dialog.svelte'],
    },
    props: [
      {
        name: 'open',
        type: 'boolean',
        default: 'false',
        description: 'Indicates whether or not the dialog is open',
      },
      {
        name: 'label',
        type: 'string',
        default: "''",
        description: "The dialog's label as displayed in the header",
        required: true,
      },
      {
        name: 'without-header',
        type: 'boolean',
        default: 'false',
        description: 'Disables the header and removes the default close button',
      },
      {
        name: 'light-dismiss',
        type: 'boolean',
        default: 'false',
        description:
          'When enabled, the dialog will be closed when the user clicks outside of it',
      },
    ],
    importPath: '@awesome.me/webawesome/dist/components/dialog/dialog.js',
    tier: 'free',
  },
};

/**
 * Get a component definition by name
 */
export function getComponent(name: string): ComponentDefinition | null {
  return LOCAL_REGISTRY[name.toLowerCase()] ?? null;
}

/**
 * Get all available components
 */
export function getAllComponents(): ComponentRegistry {
  return LOCAL_REGISTRY;
}

/**
 * Get component names
 */
export function getComponentNames(): string[] {
  return Object.keys(LOCAL_REGISTRY);
}

/**
 * Check if a component exists
 */
export function hasComponent(name: string): boolean {
  return name.toLowerCase() in LOCAL_REGISTRY;
}

/**
 * Future: Fetch component definitions from remote registry
 */
export async function fetchRegistry(): Promise<ComponentRegistry> {
  // TODO: Implement remote registry fetch
  // This could fetch from:
  // - NPM package (@kigumi/registry)
  // - CDN (unpkg, jsdelivr)
  // - GitHub (raw.githubusercontent.com)
  return LOCAL_REGISTRY;
}
