import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Checkbox } from '@/components/ui';

const meta = {
  title: 'Inputs/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    indeterminate: {
      control: 'boolean',
      description: 'Mixed/partial selection state',
    },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      table: { defaultValue: { summary: 'medium' } },
    },
    hint: { control: 'text' },
    children: { control: 'text' },
    onInvalid: { action: 'invalid' },
  },
  args: {
    children: 'Accept terms and conditions',
    onInvalid: fn(),
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: 'Remember me' },
};

export const Checked: Story = {
  args: { checked: true, children: 'Already checked' },
};

export const Indeterminate: Story = {
  args: {
    indeterminate: true,
    children: 'Select all (some selected)',
  },
};

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled option' },
};

export const DisabledChecked: Story = {
  args: { disabled: true, checked: true, children: 'Disabled and checked' },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Checkbox size="small">Small</Checkbox>
      <Checkbox size="medium">Medium</Checkbox>
      <Checkbox size="large">Large</Checkbox>
    </div>
  ),
};

export const WithHint: Story = {
  args: {
    children: 'Enable notifications',
    hint: 'We will send you important updates',
  },
};

export const SelectAllPattern: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Checkbox indeterminate>Select all (3 of 5)</Checkbox>
      <div
        style={{
          paddingLeft: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
        }}
      >
        <Checkbox checked>Option 1</Checkbox>
        <Checkbox checked>Option 2</Checkbox>
        <Checkbox checked>Option 3</Checkbox>
        <Checkbox>Option 4</Checkbox>
        <Checkbox>Option 5</Checkbox>
      </div>
    </div>
  ),
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Checkbox>Unchecked</Checkbox>
        <Checkbox checked>Checked</Checkbox>
        <Checkbox indeterminate>Indeterminate</Checkbox>
        <Checkbox disabled>Disabled</Checkbox>
        <Checkbox checked disabled>
          Checked Disabled
        </Checkbox>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Checkbox size="small">Small</Checkbox>
        <Checkbox size="medium">Medium</Checkbox>
        <Checkbox size="large">Large</Checkbox>
      </div>
    </div>
  ),
};
