/**
 * Component Registry
 *
 * PURPOSE: Handles fetching and managing component definitions.
 * Component definitions include metadata, props, CSS variables, and dependencies.
 *
 * EXPORTS:
 * - LOCAL_REGISTRY - Static registry of all available components
 * - getComponent() - Get a single component definition
 * - getAllComponents() - Get all component definitions
 * - getComponentNames() - Get list of component names
 * - hasComponent() - Check if component exists
 *
 * @see AGENTS.md for component template patterns
 */

import { WEB_AWESOME_FREE_PACKAGE } from '../constants.js';

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
 * Local registry - single source of truth for component definitions
 *
 * WHY: Static registry instead of remote fetch for reliability and offline support.
 * Component definitions match Web Awesome documentation.
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
    importPath: `${WEB_AWESOME_FREE_PACKAGE}/dist/components/button/button.js`,
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
    importPath: `${WEB_AWESOME_FREE_PACKAGE}/dist/components/input/input.js`,
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
    importPath: `${WEB_AWESOME_FREE_PACKAGE}/dist/components/card/card.js`,
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
  'animated-image': {
    name: 'AnimatedImage',
    tagName: 'wa-animated-image',
    category: 'Display',
    description:
      'A component for displaying animated GIFs and WEBPs that play and pause on interaction',
    dependencies: ['icon'],
    files: {
      react: ['components/AnimatedImage.tsx', 'types/animated-image.d.ts'],
    },
    props: [
      {
        name: 'src',
        type: 'string',
        description: 'The path to the image to load',
        required: true,
      },
      {
        name: 'alt',
        type: 'string',
        description: 'A description of the image used by assistive devices',
        required: true,
      },
      {
        name: 'play',
        type: 'boolean',
        default: 'false',
        description:
          'Plays the animation. When this attribute is removed, the animation will pause',
      },
    ],
    importPath: `${WEB_AWESOME_FREE_PACKAGE}/dist/components/animated-image/animated-image.js`,
    tier: 'free',
  },
  animation: {
    name: 'Animation',
    tagName: 'wa-animation',
    category: 'Display',
    description:
      'Animate elements declaratively with nearly 100 baked-in presets, or roll your own with custom keyframes',
    dependencies: [],
    files: {
      react: ['components/Animation.tsx', 'types/animation.d.ts'],
    },
    props: [
      {
        name: 'name',
        type: 'string',
        default: 'none',
        description: 'The name of the built-in animation to use',
      },
      {
        name: 'play',
        type: 'boolean',
        default: 'false',
        description:
          'Plays the animation. When omitted, the animation will be paused',
      },
      {
        name: 'delay',
        type: 'number',
        default: '0',
        description:
          'The number of milliseconds to delay the start of the animation',
      },
      {
        name: 'direction',
        type: 'string',
        values: ['normal', 'reverse', 'alternate', 'alternate-reverse'],
        default: 'normal',
        description: 'Determines the direction of playback',
      },
      {
        name: 'duration',
        type: 'number',
        default: '1000',
        description:
          'The number of milliseconds each iteration takes to complete',
      },
      {
        name: 'easing',
        type: 'string',
        default: 'linear',
        description: 'The easing function to use',
      },
      {
        name: 'end-delay',
        type: 'number',
        default: '0',
        description:
          'The number of milliseconds to delay after the active period',
      },
      {
        name: 'fill',
        type: 'string',
        values: ['auto', 'backwards', 'both', 'forwards', 'none'],
        default: 'auto',
        description:
          'Sets how the animation applies styles before and after execution',
      },
      {
        name: 'iterations',
        type: 'number',
        default: 'Infinity',
        description: 'The number of iterations to run before completing',
      },
      {
        name: 'iteration-start',
        type: 'number',
        default: '0',
        description: 'The offset at which to start the animation',
      },
      {
        name: 'playback-rate',
        type: 'number',
        default: '1',
        description: "Sets the animation's playback rate",
      },
    ],
    importPath: `${WEB_AWESOME_FREE_PACKAGE}/dist/components/animation/animation.js`,
    tier: 'free',
  },
  avatar: {
    name: 'Avatar',
    tagName: 'wa-avatar',
    category: 'Display',
    description: 'Avatars are used to represent a person or object',
    dependencies: ['icon'],
    files: {
      react: ['components/Avatar.tsx', 'types/avatar.d.ts'],
    },
    props: [
      {
        name: 'image',
        type: 'string',
        default: "''",
        description: 'The image source to use for the avatar',
      },
      {
        name: 'label',
        type: 'string',
        default: "''",
        description:
          'A label to use to describe the avatar to assistive devices',
        required: true,
      },
      {
        name: 'initials',
        type: 'string',
        default: "''",
        description: 'Initials to use as a fallback when no image is available',
      },
      {
        name: 'loading',
        type: 'string',
        values: ['eager', 'lazy'],
        default: 'eager',
        description: 'Indicates how the browser should load the image',
      },
      {
        name: 'shape',
        type: 'string',
        values: ['circle', 'square', 'rounded'],
        default: 'circle',
        description: 'The shape of the avatar',
      },
    ],
    importPath: `${WEB_AWESOME_FREE_PACKAGE}/dist/components/avatar/avatar.js`,
    tier: 'free',
  },
  badge: {
    name: 'Badge',
    tagName: 'wa-badge',
    category: 'Display',
    description:
      'Badges are used to draw attention and display statuses or counts',
    dependencies: [],
    files: {
      react: ['components/Badge.tsx', 'types/badge.d.ts'],
    },
    props: [
      {
        name: 'variant',
        type: 'string',
        values: ['brand', 'neutral', 'success', 'warning', 'danger'],
        default: 'brand',
        description: "The badge's theme variant",
      },
      {
        name: 'appearance',
        type: 'string',
        values: ['accent', 'filled', 'outlined', 'filled-outlined'],
        default: 'accent',
        description: "The badge's visual appearance",
      },
      {
        name: 'pill',
        type: 'boolean',
        default: 'false',
        description: 'Draws a pill-style badge with rounded edges',
      },
      {
        name: 'attention',
        type: 'string',
        values: ['none', 'pulse', 'bounce'],
        default: 'none',
        description: 'Adds an animation to draw attention to the badge',
      },
    ],
    importPath: `${WEB_AWESOME_FREE_PACKAGE}/dist/components/badge/badge.js`,
    tier: 'free',
  },
  breadcrumb: {
    name: 'Breadcrumb',
    tagName: 'wa-breadcrumb',
    category: 'Navigation',
    description:
      'Breadcrumbs provide a group of links so users can easily navigate a website hierarchy',
    dependencies: ['icon'],
    files: {
      react: ['components/Breadcrumb.tsx', 'types/breadcrumb.d.ts'],
    },
    props: [
      {
        name: 'label',
        type: 'string',
        default: "''",
        description:
          'The label to use for the breadcrumb control for assistive devices',
      },
    ],
    importPath: `${WEB_AWESOME_FREE_PACKAGE}/dist/components/breadcrumb/breadcrumb.js`,
    tier: 'free',
  },
  'breadcrumb-item': {
    name: 'BreadcrumbItem',
    tagName: 'wa-breadcrumb-item',
    category: 'Navigation',
    description:
      'Breadcrumb Items are used inside breadcrumbs to represent different links',
    dependencies: [],
    files: {
      react: ['components/BreadcrumbItem.tsx', 'types/breadcrumb-item.d.ts'],
    },
    props: [
      {
        name: 'href',
        type: 'string',
        description: 'Optional URL to direct the user to when activated',
      },
      {
        name: 'target',
        type: 'string',
        values: ['_blank', '_parent', '_self', '_top'],
        description: 'Tells the browser where to open the link',
      },
      {
        name: 'rel',
        type: 'string',
        default: 'noreferrer noopener',
        description: 'The rel attribute to use on the link',
      },
    ],
    importPath: `${WEB_AWESOME_FREE_PACKAGE}/dist/components/breadcrumb-item/breadcrumb-item.js`,
    tier: 'free',
  },
  icon: {
    name: 'Icon',
    tagName: 'wa-icon',
    category: 'Display',
    description:
      'Icons are symbols that can be used to represent various options within an application',
    dependencies: [],
    files: {
      react: ['components/Icon.tsx', 'types/icon.d.ts'],
    },
    props: [
      {
        name: 'name',
        type: 'string',
        description: 'The name of the icon to draw',
      },
      {
        name: 'library',
        type: 'string',
        default: 'default',
        description: 'The name of a registered custom icon library',
      },
      {
        name: 'src',
        type: 'string',
        description: 'An external URL of an SVG file',
      },
      {
        name: 'label',
        type: 'string',
        default: "''",
        description: 'An alternate description for assistive devices',
      },
      {
        name: 'family',
        type: 'string',
        description:
          'The family of icons (classic, brands, sharp, duotone, sharp-duotone)',
      },
      {
        name: 'variant',
        type: 'string',
        description: "The icon's variant (thin, light, regular, solid)",
      },
      {
        name: 'auto-width',
        type: 'boolean',
        default: 'false',
        description: 'Sets the width to match the cropped SVG viewBox',
      },
      {
        name: 'swap-opacity',
        type: 'boolean',
        default: 'false',
        description: 'Swaps the opacity of duotone icons',
      },
    ],
    importPath: `${WEB_AWESOME_FREE_PACKAGE}/dist/components/icon/icon.js`,
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

// Note: Remote registry fetch has been removed.
// Use LOCAL_REGISTRY directly or getAllComponents() for component data.
