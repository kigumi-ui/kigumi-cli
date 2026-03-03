/**
 * Story Overrides
 *
 * Per-component overrides for special cases that can't be derived
 * from registry + component-metadata alone.
 */

import type { StoryArgType } from './story-data.js';

export interface StoryOverride {
  /** Custom Storybook title (overrides auto-derived "Components/{Name}") */
  title?: string;
  /** Props to hide from Storybook controls (table.disable: true) */
  hiddenProps?: string[];
  /** Default value for children arg */
  childrenDefault?: string;
  /** Extra argTypes not in registry/metadata */
  extraArgTypes?: Record<string, StoryArgType>;
  /** Extra args not derived from events/children */
  extraArgs?: Record<string, string>;
  /** Meta-level parameters (e.g., layout: 'fullscreen') */
  parameters?: Record<string, string>;
}

/**
 * Overrides keyed by registry component key (kebab-case).
 *
 * These were extracted from the existing 62 story files.
 */
export const STORY_OVERRIDES: Record<string, StoryOverride> = {
  // ── Multi-word component titles ──────────────────────────────────────────
  'animated-image': {
    title: 'Components/Animated Image',
    extraArgs: {
      src: "'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnkwcmtjdjByZHloZXUzcmoyb2s4Z2I0N2NtZDdmaGlsMGM5NXF1NiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyM/giphy.gif'",
      alt: "'Animated example'",
    },
  },
  'breadcrumb-item': {
    title: 'Components/Breadcrumb Item',
  },
  'button-group': {
    title: 'Components/Button Group',
    hiddenProps: ['children'],
  },
  'carousel-item': {
    title: 'Components/Carousel Item',
  },
  'color-picker': {
    title: 'Components/Color Picker',
    hiddenProps: ['open'],
  },
  'copy-button': {
    title: 'Components/Copy Button',
  },
  'dropdown-item': {
    title: 'Components/Dropdown Item',
  },
  'file-input': {
    title: 'Components/File Input',
  },
  'format-bytes': {
    title: 'Components/Format Bytes',
  },
  'format-date': {
    title: 'Components/Format Date',
  },
  'format-number': {
    title: 'Components/Format Number',
  },
  'intersection-observer': {
    title: 'Components/Intersection Observer',
  },
  'mutation-observer': {
    title: 'Components/Mutation Observer',
  },
  'number-input': {
    title: 'Components/Number Input',
  },
  'progress-bar': {
    title: 'Components/Progress Bar',
  },
  'progress-ring': {
    title: 'Components/Progress Ring',
  },
  'qr-code': {
    title: 'Components/QR Code',
  },
  'radio-group': {
    title: 'Components/Radio Group',
  },
  'relative-time': {
    title: 'Components/Relative Time',
  },
  'resize-observer': {
    title: 'Components/Resize Observer',
  },
  'split-panel': {
    title: 'Components/Split Panel',
  },
  'tab-group': {
    title: 'Components/Tab Group',
  },
  'tab-panel': {
    title: 'Components/Tab Panel',
  },
  'tree-item': {
    title: 'Components/Tree Item',
  },
  'zoomable-frame': {
    title: 'Components/Zoomable Frame',
  },

  // ── Hidden props (managed by useState or render logic) ───────────────────
  combobox: {
    hiddenProps: ['open'],
  },
  dialog: {
    hiddenProps: ['open'],
  },
  drawer: {
    hiddenProps: ['open'],
  },
  dropdown: {
    hiddenProps: ['open'],
  },
  popover: {
    hiddenProps: ['open', 'for'],
  },
  popup: {
    hiddenProps: ['anchor'],
  },
  select: {
    hiddenProps: ['open'],
  },

  // ── Children defaults ────────────────────────────────────────────────────
  badge: {
    childrenDefault: 'New',
  },
  button: {
    childrenDefault: 'Button',
  },
  callout: {
    childrenDefault: 'This is a callout message.',
  },
  checkbox: {
    childrenDefault: 'Accept terms and conditions',
  },
  details: {
    childrenDefault: 'This is the expanded content.',
  },
  switch: {
    childrenDefault: 'Enable feature',
  },
  tag: {
    childrenDefault: 'Tag',
  },

  // ── Slot-based components (hide children, complex slot usage) ────────────
  card: {
    hiddenProps: ['children'],
  },

  // ── Special parameters ───────────────────────────────────────────────────
  page: {
    parameters: { layout: 'fullscreen' },
  },
};
