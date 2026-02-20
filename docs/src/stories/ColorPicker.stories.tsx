import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ColorPicker } from '@/components/ui';

const meta = {
  title: 'Inputs/ColorPicker',
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

export const Default: Story = {
  args: { label: 'Brand color', value: '#0066cc' },
};

export const WithOpacity: Story = {
  args: { label: 'Color with opacity', value: '#0066ccaa', opacity: true },
};

export const Formats: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <ColorPicker label="HEX" format="hex" value="#ff6b35" />
      <ColorPicker label="RGB" format="rgb" value="#ff6b35" />
      <ColorPicker label="HSL" format="hsl" value="#ff6b35" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <ColorPicker label="Small" size="small" value="#22c55e" />
      <ColorPicker label="Medium" size="medium" value="#22c55e" />
      <ColorPicker label="Large" size="large" value="#22c55e" />
    </div>
  ),
};

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

export const Disabled: Story = {
  args: { label: 'Fixed color', value: '#6366f1', disabled: true },
};

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
