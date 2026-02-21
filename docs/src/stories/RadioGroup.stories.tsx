import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { RadioGroup, Radio } from '@/components/ui';

/**
 * Radio Group manages a set of mutually exclusive Radio options, handling selection state
 * and accessibility roles (radiogroup, radio) automatically. It supports horizontal and
 * vertical layouts, button-appearance children for segmented controls, a pre-selected
 * default value, and a disabled state that locks the entire group.
 */
const meta = {
  title: 'Components/Radio Group',
  component: RadioGroup,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    value: { control: 'text', description: 'Currently selected value' },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      table: { defaultValue: { summary: 'horizontal' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      table: { defaultValue: { summary: 'medium' } },
    },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    onChange: { action: 'changed' },
    onInvalid: { action: 'invalid' },
  },
  args: {
    label: 'Select an option',
    onChange: fn(),
    onInvalid: fn(),
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A horizontal group of three radio options. */
export const Default: Story = {
  args: { label: 'Preferred contact method' },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="email">Email</Radio>
      <Radio value="phone">Phone</Radio>
      <Radio value="mail">Mail</Radio>
    </RadioGroup>
  ),
};

/** Stacks radio options vertically. */
export const Vertical: Story = {
  args: { label: 'Subscription plan', orientation: 'vertical' },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="free">Free – Basic features</Radio>
      <Radio value="pro">Pro – Advanced features</Radio>
      <Radio value="enterprise">Enterprise – Full access</Radio>
    </RadioGroup>
  ),
};

/** One option is checked by default via the value prop. */
export const WithPreselected: Story = {
  args: { label: 'Delivery speed', value: 'standard' },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="express">Express (1-2 days)</Radio>
      <Radio value="standard">Standard (3-5 days)</Radio>
      <Radio value="economy">Economy (7-10 days)</Radio>
    </RadioGroup>
  ),
};

/** Renders all options as buttons for a segmented control. */
export const ButtonAppearance: Story = {
  args: { label: 'View mode' },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="grid" appearance="button">
        Grid
      </Radio>
      <Radio value="list" appearance="button">
        List
      </Radio>
      <Radio value="table" appearance="button">
        Table
      </Radio>
    </RadioGroup>
  ),
};

/** Locks the entire group in a non-interactive state. */
export const Disabled: Story = {
  args: { label: 'Locked option', disabled: true, value: 'standard' },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="express">Express</Radio>
      <Radio value="standard">Standard</Radio>
      <Radio value="economy">Economy</Radio>
    </RadioGroup>
  ),
};

/** Shows the group at small, medium, and large sizes. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <RadioGroup label="Small" size="small">
        <Radio value="a">Option A</Radio>
        <Radio value="b">Option B</Radio>
      </RadioGroup>
      <RadioGroup label="Medium" size="medium">
        <Radio value="a">Option A</Radio>
        <Radio value="b">Option B</Radio>
      </RadioGroup>
      <RadioGroup label="Large" size="large">
        <Radio value="a">Option A</Radio>
        <Radio value="b">Option B</Radio>
      </RadioGroup>
    </div>
  ),
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
      <RadioGroup label="Default" value="1">
        <Radio value="1">Option 1</Radio>
        <Radio value="2">Option 2</Radio>
        <Radio value="3">Option 3</Radio>
      </RadioGroup>
      <RadioGroup label="Horizontal" orientation="horizontal" value="a">
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
        <Radio value="c">C</Radio>
      </RadioGroup>
      <RadioGroup label="Disabled" disabled value="x">
        <Radio value="x">X</Radio>
        <Radio value="y">Y</Radio>
      </RadioGroup>
      <RadioGroup label="Invalid" invalid help-text="Please select an option.">
        <Radio value="p">P</Radio>
        <Radio value="q">Q</Radio>
      </RadioGroup>
    </div>
  ),
};
