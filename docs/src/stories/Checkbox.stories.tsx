import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Checkbox } from '@/components/ui';

/** Checkboxes allow the user to toggle an option on or off */
const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Draws checkbox in checked state',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the checkbox',
      table: { defaultValue: { summary: 'false' } },
    },
    hint: { control: 'text', description: 'Descriptive helper text' },
    indeterminate: {
      control: 'boolean',
      description: 'Mixed/parent selection state',
      table: { defaultValue: { summary: 'false' } },
    },
    name: { control: 'text', description: 'Form submission identifier' },
    required: {
      control: 'boolean',
      description: 'Makes field mandatory',
      table: { defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Adjusts checkbox dimensions',
      table: { defaultValue: { summary: 'medium' } },
    },
    value: { control: 'text', description: 'Form submission value' },
    children: { control: 'text' },
    onChange: {
      action: 'change',
      description: 'Emitted when the checked state changes.',
      table: { category: 'Events' },
    },
    onBlur: {
      action: 'blur',
      description: 'Emitted when the checkbox loses focus.',
      table: { category: 'Events' },
    },
    onFocus: {
      action: 'focus',
      description: 'Emitted when the checkbox gains focus.',
      table: { category: 'Events' },
    },
    onInput: {
      action: 'input',
      description: 'Emitted when the checkbox receives input.',
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
    children: 'Accept terms and conditions',
    onChange: fn(),
    onBlur: fn(),
    onFocus: fn(),
    onInput: fn(),
    onInvalid: fn(),
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An unchecked checkbox with a label. */
export const Default: Story = {
  args: { children: 'Remember me' },
};

/** Shows the checkbox in the checked state. */
export const Checked: Story = {
  args: { checked: true, children: 'Already checked' },
};

/** Demonstrates the indeterminate state used for "select all" patterns. */
export const Indeterminate: Story = {
  args: {
    indeterminate: true,
    children: 'Select all (some selected)',
  },
};

/** A non-interactive disabled checkbox. */
export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled option' },
};

/** A checked checkbox that cannot be changed. */
export const DisabledChecked: Story = {
  args: { disabled: true, checked: true, children: 'Disabled and checked' },
};

/** Compares small, medium, and large checkbox sizes. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Checkbox size="small">Small</Checkbox>
      <Checkbox size="medium">Medium</Checkbox>
      <Checkbox size="large">Large</Checkbox>
    </div>
  ),
};

/** Shows a hint line below the checkbox label for additional context. */
export const WithHint: Story = {
  args: {
    children: 'Enable notifications',
    hint: 'We will send you important updates',
  },
};

/** A "select all / none" pattern using the indeterminate state. */
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
