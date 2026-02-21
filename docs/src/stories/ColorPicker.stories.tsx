import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ColorPicker } from '@/components/ui';

/**
 * Color Picker provides a comprehensive color selection UI with a hue/saturation canvas,
 * hue and optional opacity sliders, a hex/RGB/HSL input, and a swatch grid for preset
 * colors. It can operate inline (always visible) or as a dropdown triggered by a preview
 * swatch.
 */
const meta = {
  title: 'Components/Color Picker',
  component: ColorPicker,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'color' },
    format: {
      control: 'select',
      options: ['hex', 'rgb', 'hsl', 'hsv'],
      table: { defaultValue: { summary: 'hex' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      table: { defaultValue: { summary: 'medium' } },
    },
    opacity: { control: 'boolean', description: 'Enables alpha channel' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    hint: { control: 'text' },
    uppercase: { control: 'boolean' },
    'without-format-toggle': { control: 'boolean' },
    onShow: { action: 'show' },
    onHide: { action: 'hide' },
    onInvalid: { action: 'invalid' },
    open: { table: { disable: true } },
  },
  args: {
    label: 'Pick a color',
    value: '#0066cc',
    onShow: fn(),
    onHide: fn(),
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
  // tags: ['!dev', '!autodocs'],
  parameters: { chromatic: { pauseAnimationAtEnd: true } },
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
