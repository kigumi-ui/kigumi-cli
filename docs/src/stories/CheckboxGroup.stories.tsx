import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckboxGroup, Checkbox } from '@/components/ui';

/**
 * Checkbox groups label and group a set of checkboxes so they share hint text and
 * validation
 */
const meta = {
  title: 'Components/CheckboxGroup',
  component: CheckboxGroup,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text', description: 'Group label' },
    hint: { control: 'text', description: 'Hint text shown below the label' },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Layout direction of the grouped checkboxes',
      table: { defaultValue: { summary: 'vertical' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large', 'xs', 's', 'm', 'l', 'xl'],
      description: 'Size applied to all checkboxes in the group',
      table: { defaultValue: { summary: 'medium' } },
    },
    required: {
      control: 'boolean',
      description: 'Requires at least one option to be selected',
      table: { defaultValue: { summary: 'false' } },
    },
    'with-label': {
      control: 'boolean',
      description:
        'Only required for SSR. Renders the label slot on the server',
      table: { defaultValue: { summary: 'false' } },
    },
    'with-hint': {
      control: 'boolean',
      description: 'Only required for SSR. Renders the hint slot on the server',
      table: { defaultValue: { summary: 'false' } },
    },
  },
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A labelled group of checkboxes sharing a single hint. */
export const Default: Story = {
  args: { label: 'Toppings', hint: 'Choose as many as you like' },
  render: (args) => (
    <CheckboxGroup {...args}>
      <Checkbox value="cheese">Cheese</Checkbox>
      <Checkbox value="mushrooms">Mushrooms</Checkbox>
      <Checkbox value="olives">Olives</Checkbox>
    </CheckboxGroup>
  ),
};

/** Lays the checkboxes out in a row. */
export const Horizontal: Story = {
  args: { label: 'Notifications', orientation: 'horizontal' },
  render: (args) => (
    <CheckboxGroup {...args}>
      <Checkbox value="email">Email</Checkbox>
      <Checkbox value="sms">SMS</Checkbox>
      <Checkbox value="push">Push</Checkbox>
    </CheckboxGroup>
  ),
};

/** Requires at least one option before the form can submit. */
export const Required: Story = {
  args: {
    label: 'Accept terms',
    hint: 'You must select at least one option',
    required: true,
  },
  render: (args) => (
    <CheckboxGroup {...args}>
      <Checkbox value="terms">I accept the terms of service</Checkbox>
      <Checkbox value="privacy">I accept the privacy policy</Checkbox>
    </CheckboxGroup>
  ),
};

/** Shows the group at small, medium, and large sizes. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <CheckboxGroup label="Small" size="small">
        <Checkbox value="a">Option A</Checkbox>
        <Checkbox value="b">Option B</Checkbox>
      </CheckboxGroup>
      <CheckboxGroup label="Medium" size="medium">
        <Checkbox value="a">Option A</Checkbox>
        <Checkbox value="b">Option B</Checkbox>
      </CheckboxGroup>
      <CheckboxGroup label="Large" size="large">
        <Checkbox value="a">Option A</Checkbox>
        <Checkbox value="b">Option B</Checkbox>
      </CheckboxGroup>
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
      <CheckboxGroup label="Default" hint="Pick any that apply">
        <Checkbox value="1">Option 1</Checkbox>
        <Checkbox value="2">Option 2</Checkbox>
        <Checkbox value="3">Option 3</Checkbox>
      </CheckboxGroup>
      <CheckboxGroup label="Horizontal" orientation="horizontal">
        <Checkbox value="a">A</Checkbox>
        <Checkbox value="b">B</Checkbox>
        <Checkbox value="c">C</Checkbox>
      </CheckboxGroup>
      <CheckboxGroup label="Required" required hint="Select at least one">
        <Checkbox value="p">P</Checkbox>
        <Checkbox value="q">Q</Checkbox>
      </CheckboxGroup>
    </div>
  ),
};
