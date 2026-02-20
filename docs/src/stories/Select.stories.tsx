import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Select, Option, Icon } from '@/components/ui';

const meta = {
  title: 'Inputs/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    appearance: {
      control: 'select',
      options: ['filled', 'outlined', 'filled-outlined'],
      table: { defaultValue: { summary: 'outlined' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      table: { defaultValue: { summary: 'medium' } },
    },
    placement: {
      control: 'select',
      options: ['top', 'bottom'],
      table: { defaultValue: { summary: 'bottom' } },
    },
    pill: { control: 'boolean' },
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    'with-clear': { control: 'boolean' },
    onChange: { action: 'change' },
    onShow: { action: 'show' },
    onHide: { action: 'hide' },
    onClear: { action: 'clear' },
    onInvalid: { action: 'invalid' },
    // hide open — managed internally
    open: { table: { disable: true } },
  },
  args: {
    label: 'Select an option',
    onChange: fn(),
    onShow: fn(),
    onHide: fn(),
    onClear: fn(),
    onInvalid: fn(),
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

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

export const Disabled: Story = {
  args: { label: 'Disabled', disabled: true, value: 'react' },
  render: (args) => (
    <Select {...args} style={{ maxWidth: '400px' }}>
      <Option value="react">React</Option>
      <Option value="vue">Vue</Option>
    </Select>
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
