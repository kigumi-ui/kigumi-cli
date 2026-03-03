import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Select, Option, Icon } from '@/components/ui';

/** Selects allow you to choose items from a menu of predefined options */
const meta = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text', description: 'Form field name' },
    value: { control: 'text', description: 'Selected value(s)' },
    appearance: {
      control: 'select',
      options: ['filled', 'outlined', 'filled-outlined'],
      description: 'Visual appearance',
      table: { defaultValue: { summary: 'outlined' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Select size',
      table: { defaultValue: { summary: 'medium' } },
    },
    placeholder: { control: 'text', description: 'Placeholder text' },
    multiple: {
      control: 'boolean',
      description: 'Allows multiple selections',
      table: { defaultValue: { summary: 'false' } },
    },
    'max-options-visible': {
      control: 'number',
      description: 'Max visible tags (multiple)',
      table: { defaultValue: { summary: '3' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the select',
      table: { defaultValue: { summary: 'false' } },
    },
    'with-clear': {
      control: 'boolean',
      description: 'Shows clear button',
      table: { defaultValue: { summary: 'false' } },
    },
    open: {
      control: 'boolean',
      description: 'Whether listbox is open',
      table: { disable: true, defaultValue: { summary: 'false' } },
    },
    hoist: {
      control: 'boolean',
      description: 'Hoists to body',
      table: { defaultValue: { summary: 'false' } },
    },
    placement: {
      control: 'select',
      options: ['top', 'bottom'],
      description: 'Listbox placement',
      table: { defaultValue: { summary: 'bottom' } },
    },
    pill: {
      control: 'boolean',
      description: 'Rounded edges',
      table: { defaultValue: { summary: 'false' } },
    },
    label: { control: 'text', description: 'Label text' },
    hint: { control: 'text', description: 'Hint text' },
    required: {
      control: 'boolean',
      description: 'Makes selection required',
      table: { defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      description: 'Shows invalid/error state',
      table: { defaultValue: { summary: 'false' } },
    },
    'help-text': {
      control: 'text',
      description: 'Help text below the control',
    },
    onInput: {
      action: 'input',
      description: 'Emitted when the control receives input.',
      table: { category: 'Events' },
    },
    onChange: {
      action: 'change',
      description: "Emitted when the control's value changes.",
      table: { category: 'Events' },
    },
    onFocus: {
      action: 'focus',
      description: 'Emitted when the control gains focus.',
      table: { category: 'Events' },
    },
    onBlur: {
      action: 'blur',
      description: 'Emitted when the control loses focus.',
      table: { category: 'Events' },
    },
    onClear: {
      action: 'clear',
      description: "Emitted when the control's value is cleared.",
      table: { category: 'Events' },
    },
    onShow: {
      action: 'show',
      description: "Emitted when the select's menu opens.",
      table: { category: 'Events' },
    },
    onAfterShow: {
      action: 'after-show',
      description:
        "Emitted after the select's menu opens and all animations are complete.",
      table: { category: 'Events' },
    },
    onHide: {
      action: 'hide',
      description: "Emitted when the select's menu closes.",
      table: { category: 'Events' },
    },
    onAfterHide: {
      action: 'after-hide',
      description:
        "Emitted after the select's menu closes and all animations are complete.",
      table: { category: 'Events' },
    },
    onInvalid: {
      action: 'invalid',
      description:
        "Emitted when the form control has been checked for validity and its constraints aren't satisfied.",
      table: { category: 'Events' },
    },
    'slot:label': {
      control: false,
      description:
        "The input's label. Alternatively, you can use the `label` attribute.",
      table: { category: 'Slots' },
    },
    'slot:start': {
      control: false,
      description:
        'An element, such as `<wa-icon>`, placed at the start of the combobox.',
      table: { category: 'Slots' },
    },
    'slot:end': {
      control: false,
      description:
        'An element, such as `<wa-icon>`, placed at the end of the combobox.',
      table: { category: 'Slots' },
    },
    'slot:clear-icon': {
      control: false,
      description: 'An icon to use in lieu of the default clear icon.',
      table: { category: 'Slots' },
    },
    'slot:expand-icon': {
      control: false,
      description:
        'The icon to show when the control is expanded and collapsed. Rotates on open and close.',
      table: { category: 'Slots' },
    },
    'slot:hint': {
      control: false,
      description:
        'Text that describes how to use the input. Alternatively, you can use the `hint` attribute.',
      table: { category: 'Slots' },
    },
    'method:show': {
      control: false,
      description: 'Shows the listbox.',
      table: { category: 'Methods' },
    },
    'method:hide': {
      control: false,
      description: 'Hides the listbox.',
      table: { category: 'Methods' },
    },
    'method:focus': {
      control: false,
      description: 'Sets focus on the control.',
      table: { category: 'Methods' },
    },
    'method:blur': {
      control: false,
      description: 'Removes focus from the control.',
      table: { category: 'Methods' },
    },
  },
  args: {
    onInput: fn(),
    onChange: fn(),
    onFocus: fn(),
    onBlur: fn(),
    onClear: fn(),
    onShow: fn(),
    onAfterShow: fn(),
    onHide: fn(),
    onAfterHide: fn(),
    onInvalid: fn(),
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A basic single-select dropdown with three options. */
export const Default: Story = {
  args: { label: 'Country', placeholder: 'Choose a country' },
  render: (args) => (
    <Select {...args}>
      <Option value="de">Germany</Option>
      <Option value="fr">France</Option>
      <Option value="jp">Japan</Option>
      <Option value="us">United States</Option>
      <Option value="gb">United Kingdom</Option>
    </Select>
  ),
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
      <Select label="Outlined" appearance="outlined" placeholder="Outlined">
        <Option value="a">Option A</Option>
        <Option value="b">Option B</Option>
      </Select>
      <Select label="Filled" appearance="filled" placeholder="Filled">
        <Option value="a">Option A</Option>
        <Option value="b">Option B</Option>
      </Select>
      <Select
        label="Filled Outlined"
        appearance="filled-outlined"
        placeholder="Filled Outlined"
      >
        <Option value="a">Option A</Option>
        <Option value="b">Option B</Option>
      </Select>
    </div>
  ),
};

/** Shows small, medium, and large select sizes. */
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
      <Select label="Small" size="small" placeholder="Small">
        <Option value="a">Option A</Option>
        <Option value="b">Option B</Option>
      </Select>
      <Select label="Medium" size="medium" placeholder="Medium">
        <Option value="a">Option A</Option>
        <Option value="b">Option B</Option>
      </Select>
      <Select label="Large" size="large" placeholder="Large">
        <Option value="a">Option A</Option>
        <Option value="b">Option B</Option>
      </Select>
    </div>
  ),
};

/** Adds a clear button to reset the selected value. */
export const WithClear: Story = {
  args: { label: 'Framework', 'with-clear': true, value: 'react' },
  render: (args) => (
    <Select {...args} style={{ maxWidth: '400px' }}>
      <Option value="react">React</Option>
      <Option value="vue">Vue</Option>
      <Option value="svelte">Svelte</Option>
      <Option value="angular">Angular</Option>
    </Select>
  ),
};

/** Allows selecting more than one option, shown as tag pills. */
export const Multiple: Story = {
  args: {
    label: 'Frameworks',
    multiple: true,
    placeholder: 'Select frameworks',
  },
  render: (args) => (
    <Select {...args} style={{ maxWidth: '400px' }}>
      <Option value="react">React</Option>
      <Option value="vue">Vue</Option>
      <Option value="svelte">Svelte</Option>
      <Option value="angular">Angular</Option>
      <Option value="solid">SolidJS</Option>
    </Select>
  ),
};

/** Adds prefix icons to each option for visual identification. */
export const WithIcons: Story = {
  args: { label: 'Status', placeholder: 'Select status' },
  render: (args) => (
    <Select {...args} style={{ maxWidth: '400px' }}>
      <Option value="active">
        <Icon
          slot="prefix"
          name="circle-check"
          style={{ color: 'var(--wa-color-success-fill-loud)' }}
        />
        Active
      </Option>
      <Option value="pending">
        <Icon
          slot="prefix"
          name="clock"
          style={{ color: 'var(--wa-color-warning-fill-loud)' }}
        />
        Pending
      </Option>
      <Option value="inactive">
        <Icon
          slot="prefix"
          name="circle-xmark"
          style={{ color: 'var(--wa-color-danger-fill-loud)' }}
        />
        Inactive
      </Option>
    </Select>
  ),
};

/** Some options are disabled and cannot be selected. */
export const WithDisabledOptions: Story = {
  args: { label: 'Plan', placeholder: 'Choose plan' },
  render: (args) => (
    <Select {...args} style={{ maxWidth: '400px' }}>
      <Option value="free">Free</Option>
      <Option value="pro">Pro</Option>
      <Option value="enterprise" disabled>
        Enterprise (Contact sales)
      </Option>
    </Select>
  ),
};

/** The entire select control in a non-interactive disabled state. */
export const Disabled: Story = {
  args: { label: 'Disabled', disabled: true, value: 'react' },
  render: (args) => (
    <Select {...args} style={{ maxWidth: '400px' }}>
      <Option value="react">React</Option>
      <Option value="vue">Vue</Option>
    </Select>
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
        maxWidth: '400px',
      }}
    >
      <Select label="Default" placeholder="Select an option">
        <Option value="1">Option 1</Option>
        <Option value="2">Option 2</Option>
        <Option value="3">Option 3</Option>
      </Select>
      <Select label="With Value" value="2">
        <Option value="1">Option 1</Option>
        <Option value="2">Option 2</Option>
        <Option value="3">Option 3</Option>
      </Select>
      <Select label="Disabled" disabled>
        <Option value="1">Option 1</Option>
      </Select>
      <Select label="Invalid" invalid help-text="Please select an option.">
        <Option value="1">Option 1</Option>
      </Select>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Select size="small" placeholder="Small">
          <Option value="a">A</Option>
        </Select>
        <Select size="medium" placeholder="Medium">
          <Option value="a">A</Option>
        </Select>
        <Select size="large" placeholder="Large">
          <Option value="a">A</Option>
        </Select>
      </div>
    </div>
  ),
};
