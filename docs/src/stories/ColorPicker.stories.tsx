import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ColorPicker } from '@/components/ui';

/** Color pickers allow the user to select a color */
const meta = {
  title: 'Components/Color Picker',
  component: ColorPicker,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text', description: 'The current color value' },
    format: {
      control: 'select',
      options: ['hex', 'rgb', 'hsl', 'hsv'],
      description: 'Color format',
      table: { defaultValue: { summary: 'hex' } },
    },
    opacity: {
      control: 'boolean',
      description: 'Enables opacity slider',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the color picker',
      table: { defaultValue: { summary: 'false' } },
    },
    required: {
      control: 'boolean',
      description: 'Makes field mandatory',
      table: { defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Color picker size',
      table: { defaultValue: { summary: 'medium' } },
    },
    label: { control: 'text', description: 'Label text' },
    hint: { control: 'text', description: 'Hint text' },
    name: { control: 'text', description: 'Form field name' },
    open: {
      control: 'boolean',
      description: 'Whether the panel is open',
      table: { disable: true, defaultValue: { summary: 'false' } },
    },
    placement: {
      control: 'select',
      options: [
        'top',
        'top-start',
        'top-end',
        'bottom',
        'bottom-start',
        'bottom-end',
        'right',
        'right-start',
        'right-end',
        'left',
        'left-start',
        'left-end',
      ],
      description: 'Panel placement',
    },
    swatches: { control: 'text', description: 'Predefined color swatches' },
    uppercase: {
      control: 'boolean',
      description: 'Displays hex values in uppercase',
      table: { defaultValue: { summary: 'false' } },
    },
    'without-format-toggle': {
      control: 'boolean',
      description: 'Hides the format toggle button',
      table: { defaultValue: { summary: 'false' } },
    },
    inline: {
      control: 'boolean',
      description: 'Renders the color picker inline instead of in a dropdown',
      table: { defaultValue: { summary: 'false' } },
    },
    onChange: {
      action: 'change',
      description: "Emitted when the color picker's value changes.",
      table: { category: 'Events' },
    },
    onInput: {
      action: 'input',
      description: 'Emitted when the color picker receives input.',
      table: { category: 'Events' },
    },
    onShow: { action: 'show', table: { category: 'Events' } },
    onAfterShow: { action: 'after-show', table: { category: 'Events' } },
    onHide: { action: 'hide', table: { category: 'Events' } },
    onAfterHide: { action: 'after-hide', table: { category: 'Events' } },
    onBlur: {
      action: 'blur',
      description: 'Emitted when the color picker loses focus.',
      table: { category: 'Events' },
    },
    onFocus: {
      action: 'focus',
      description: 'Emitted when the color picker receives focus.',
      table: { category: 'Events' },
    },
    onInvalid: {
      action: 'invalid',
      description:
        "Emitted when the form control has been checked for validity and its constraints aren't satisfied.",
      table: { category: 'Events' },
    },
  },
  args: {
    onChange: fn(),
    onInput: fn(),
    onShow: fn(),
    onAfterShow: fn(),
    onHide: fn(),
    onAfterHide: fn(),
    onBlur: fn(),
    onFocus: fn(),
    onInvalid: fn(),
  },
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The color picker in dropdown mode with default hex format. */
export const Default: Story = {
  args: { label: 'Brand color', value: '#0066cc' },
};

/** Enables the opacity channel for RGBA/HSLA color selection. */
export const WithOpacity: Story = {
  args: { label: 'Color with opacity', value: '#0066ccaa', opacity: true },
};

/** Switches between hex, RGB, and HSL input formats. */
export const Formats: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <ColorPicker label="HEX" format="hex" value="#ff6b35" />
      <ColorPicker label="RGB" format="rgb" value="#ff6b35" />
      <ColorPicker label="HSL" format="hsl" value="#ff6b35" />
    </div>
  ),
};

/** Compares the available sizes. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <ColorPicker label="Small" size="small" value="#22c55e" />
      <ColorPicker label="Medium" size="medium" value="#22c55e" />
      <ColorPicker label="Large" size="large" value="#22c55e" />
    </div>
  ),
};

/** Pre-populates the swatch strip with a custom palette. */
export const WithSwatches: Story = {
  args: {
    label: 'Theme color',
    swatches: [
      '#ef4444',
      '#f97316',
      '#eab308',
      '#22c55e',
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
      '#6b7280',
    ],
  },
};

/** Shows the color picker in a non-interactive disabled state. */
export const Disabled: Story = {
  args: { label: 'Fixed color', value: '#6366f1', disabled: true },
};

/** Static snapshot for visual regression testing. */
export const ChromaticOnly: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: {
    chromatic: { disableSnapshot: false, pauseAnimationAtEnd: true },
  },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        padding: '1.5rem',
      }}
    >
      <ColorPicker value="#4a90d9" inline />
    </div>
  ),
};
