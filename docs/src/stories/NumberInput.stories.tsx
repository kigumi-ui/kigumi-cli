import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { NumberInput } from '@/components/ui';

/** Number inputs allow users to enter numeric values with optional step controls */
const meta = {
  title: 'Components/Number Input',
  component: NumberInput,
  tags: ['autodocs', 'pro'],
  argTypes: {
    label: { control: 'text', description: 'Accessible label' },
    hint: { control: 'text', description: 'Descriptive hint text' },
    value: { control: 'number', description: 'Current value' },
    min: { control: 'number', description: 'Minimum value' },
    max: { control: 'number', description: 'Maximum value' },
    step: {
      control: 'number',
      description: 'Step increment',
      table: { defaultValue: { summary: '1' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the input',
      table: { defaultValue: { summary: 'false' } },
    },
    required: {
      control: 'boolean',
      description: 'Makes field mandatory',
      table: { defaultValue: { summary: 'false' } },
    },
    placeholder: { control: 'text', description: 'Placeholder text' },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Input size',
      table: { defaultValue: { summary: 'medium' } },
    },
    appearance: {
      control: 'select',
      options: ['filled', 'outlined', 'filled-outlined'],
      description: 'Visual appearance',
      table: { defaultValue: { summary: 'outlined' } },
    },
    'without-steppers': {
      control: 'boolean',
      description: 'Hides the stepper buttons',
      table: { defaultValue: { summary: 'false' } },
    },
    onInput: {
      action: 'input',
      description: 'Emitted when the control receives input.',
      table: { category: 'Events' },
    },
    onChange: {
      action: 'change',
      description:
        "Emitted when an alteration to the control's value is committed by the user.",
      table: { category: 'Events' },
    },
    onBlur: {
      action: 'blur',
      description: 'Emitted when the control loses focus.',
      table: { category: 'Events' },
    },
    onFocus: {
      action: 'focus',
      description: 'Emitted when the control gains focus.',
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
    onInput: fn(),
    onChange: fn(),
    onBlur: fn(),
    onFocus: fn(),
    onInvalid: fn(),
  },
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A basic number input with a label and default value. */
export const Default: Story = {
  args: { label: 'Quantity', value: 1 },
};

/** Constrains input to a specific numeric range. */
export const WithMinMax: Story = {
  args: {
    label: 'Age',
    min: 0,
    max: 120,
    value: 25,
    hint: 'Enter a value between 0 and 120.',
  },
};

/** Increments and decrements by a custom step amount. */
export const WithStep: Story = {
  args: {
    label: 'Percentage',
    min: 0,
    max: 100,
    step: 5,
    value: 50,
    hint: 'Steps by 5.',
  },
};

/** Hides the stepper buttons for a plain numeric field. */
export const WithoutSteppers: Story = {
  args: { label: 'Value', 'without-steppers': true, value: 42 },
};

/** Compares filled, outlined, and filled-outlined visual styles. */
export const Appearances: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxWidth: '400px',
      }}
    >
      <NumberInput appearance="outlined" label="Outlined" value={10} />
      <NumberInput appearance="filled" label="Filled" value={10} />
      <NumberInput
        appearance="filled-outlined"
        label="Filled Outlined"
        value={10}
      />
    </div>
  ),
};

/** Shows all three available sizes. */
export const Sizes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxWidth: '400px',
      }}
    >
      <NumberInput size="small" label="Small" value={10} />
      <NumberInput size="medium" label="Medium" value={10} />
      <NumberInput size="large" label="Large" value={10} />
    </div>
  ),
};

/** Displays a hint line below the input for user guidance. */
export const WithHint: Story = {
  args: {
    label: 'Daily steps goal',
    hint: 'Enter a value between 1000 and 20000.',
    min: 1000,
    max: 20000,
    step: 500,
    value: 8000,
  },
};

/** A non-interactive disabled field. */
export const Disabled: Story = {
  args: { label: 'Fixed value', value: 42, disabled: true },
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
        gap: '1.5rem',
        padding: '1.5rem',
        maxWidth: '400px',
      }}
    >
      <NumberInput label="Default" value={1} />
      <NumberInput label="With range" min={0} max={100} value={50} />
      <NumberInput label="Step of 5" min={0} max={100} step={5} value={25} />
      <NumberInput
        label="Without steppers"
        {...{ 'without-steppers': true }}
        value={42}
      />
      <NumberInput
        label="With hint"
        value={8000}
        hint="Enter a value between 1000 and 20000."
      />
      <NumberInput label="Disabled" value={42} disabled />
      <NumberInput label="Small" size="small" value={10} />
      <NumberInput label="Large" size="large" value={10} />
    </div>
  ),
};
