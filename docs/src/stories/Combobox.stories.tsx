import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Combobox, Option } from '@/components/ui';

const fruits = [
  'Apple',
  'Apricot',
  'Banana',
  'Blueberry',
  'Cherry',
  'Grape',
  'Kiwi',
  'Lemon',
  'Mango',
  'Orange',
  'Peach',
  'Pear',
  'Pineapple',
  'Plum',
  'Raspberry',
  'Strawberry',
  'Watermelon',
];

const meta = {
  title: 'Inputs/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  argTypes: {
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
    autocomplete: {
      control: 'select',
      options: ['list', 'none'],
      table: { defaultValue: { summary: 'list' } },
    },
    'allow-custom-value': { control: 'boolean' },
    multiple: { control: 'boolean' },
    'with-clear': { control: 'boolean' },
    pill: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    placeholder: { control: 'text' },
    label: { control: 'text' },
    hint: { control: 'text' },
    onShow: { action: 'show' },
    onHide: { action: 'hide' },
    onClear: { action: 'clear' },
    open: { table: { disable: true } },
  },
  args: {
    placeholder: 'Search fruits...',
    label: 'Fruit',
    onShow: fn(),
    onHide: fn(),
    onClear: fn(),
  },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div style={{ maxWidth: '300px' }}>
      <Combobox {...args}>
        {fruits.map((f) => (
          <Option key={f} value={f.toLowerCase()}>
            {f}
          </Option>
        ))}
      </Combobox>
    </div>
  ),
};

export const WithClear: Story = {
  args: { 'with-clear': true, value: 'apple' },
  render: (args) => (
    <div style={{ maxWidth: '300px' }}>
      <Combobox {...args}>
        {fruits.map((f) => (
          <Option key={f} value={f.toLowerCase()}>
            {f}
          </Option>
        ))}
      </Combobox>
    </div>
  ),
};

export const AllowCustomValue: Story = {
  args: { 'allow-custom-value': true, placeholder: 'Type or select...' },
  render: (args) => (
    <div style={{ maxWidth: '300px' }}>
      <Combobox {...args}>
        {fruits.map((f) => (
          <Option key={f} value={f.toLowerCase()}>
            {f}
          </Option>
        ))}
      </Combobox>
    </div>
  ),
};

export const Multiple: Story = {
  args: { multiple: true, placeholder: 'Select multiple fruits...' },
  render: (args) => (
    <div style={{ maxWidth: '300px' }}>
      <Combobox {...args}>
        {fruits.map((f) => (
          <Option key={f} value={f.toLowerCase()}>
            {f}
          </Option>
        ))}
      </Combobox>
    </div>
  ),
};

export const Appearances: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxWidth: '300px',
      }}
    >
      {(['filled', 'outlined', 'filled-outlined'] as const).map((a) => (
        <Combobox key={a} appearance={a} label={a} placeholder="Search...">
          {fruits.slice(0, 5).map((f) => (
            <Option key={f} value={f.toLowerCase()}>
              {f}
            </Option>
          ))}
        </Combobox>
      ))}
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
        maxWidth: '300px',
      }}
    >
      {(['small', 'medium', 'large'] as const).map((s) => (
        <Combobox key={s} size={s} label={s} placeholder="Search...">
          {fruits.slice(0, 5).map((f) => (
            <Option key={f} value={f.toLowerCase()}>
              {f}
            </Option>
          ))}
        </Combobox>
      ))}
    </div>
  ),
};

export const WithHint: Story = {
  args: { hint: 'Start typing to filter the list', label: 'Favorite Fruit' },
  render: (args) => (
    <div style={{ maxWidth: '300px' }}>
      <Combobox {...args}>
        {fruits.map((f) => (
          <Option key={f} value={f.toLowerCase()}>
            {f}
          </Option>
        ))}
      </Combobox>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, value: 'apple', label: 'Fruit (disabled)' },
  render: (args) => (
    <div style={{ maxWidth: '300px' }}>
      <Combobox {...args}>
        {fruits.map((f) => (
          <Option key={f} value={f.toLowerCase()}>
            {f}
          </Option>
        ))}
      </Combobox>
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
      <Combobox label="Fruit" placeholder="Select a fruit">
        <Option value="apple">Apple</Option>
        <Option value="banana">Banana</Option>
        <Option value="cherry">Cherry</Option>
      </Combobox>
      <Combobox label="Disabled" disabled>
        <Option value="a">Option A</Option>
      </Combobox>
    </div>
  ),
};
