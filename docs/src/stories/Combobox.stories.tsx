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

/** Combines a text input with a listbox for filtering and selecting options */
const meta = {
  title: 'Components/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  argTypes: {
    'allow-custom-value': {
      control: 'boolean',
      description: 'Allows entering custom values',
      table: { defaultValue: { summary: 'false' } },
    },
    appearance: {
      control: 'select',
      options: ['filled', 'outlined', 'filled-outlined'],
      description: 'Visual appearance style',
      table: { defaultValue: { summary: 'outlined' } },
    },
    autocomplete: {
      control: 'select',
      options: ['list', 'none'],
      description: 'Autocomplete behavior',
      table: { defaultValue: { summary: 'list' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the combobox',
      table: { defaultValue: { summary: 'false' } },
    },
    hint: { control: 'text', description: 'Hint text' },
    label: { control: 'text', description: 'Label text' },
    'max-options-visible': {
      control: 'number',
      description: 'Maximum visible options before scrolling',
      table: { defaultValue: { summary: '3' } },
    },
    multiple: {
      control: 'boolean',
      description: 'Allows multiple selections',
      table: { defaultValue: { summary: 'false' } },
    },
    name: { control: 'text', description: 'Form field name' },
    open: {
      control: 'boolean',
      description: 'Whether the listbox is open',
      table: { disable: true, defaultValue: { summary: 'false' } },
    },
    pill: {
      control: 'boolean',
      description: 'Rounded edges style',
      table: { defaultValue: { summary: 'false' } },
    },
    placeholder: { control: 'text', description: 'Placeholder text' },
    placement: {
      control: 'select',
      options: ['top', 'bottom'],
      description: 'Listbox placement',
      table: { defaultValue: { summary: 'bottom' } },
    },
    required: {
      control: 'boolean',
      description: 'Makes field mandatory',
      table: { defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Combobox size',
      table: { defaultValue: { summary: 'medium' } },
    },
    'with-clear': {
      control: 'boolean',
      description: 'Shows clear button',
      table: { defaultValue: { summary: 'false' } },
    },
    value: { control: 'text', description: 'Current value of the combobox' },
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
      description: "Emitted when the combobox's menu opens.",
      table: { category: 'Events' },
    },
    onAfterShow: {
      action: 'after-show',
      description:
        "Emitted after the combobox's menu opens and all animations are complete.",
      table: { category: 'Events' },
    },
    onHide: {
      action: 'hide',
      description: "Emitted when the combobox's menu closes.",
      table: { category: 'Events' },
    },
    onAfterHide: {
      action: 'after-hide',
      description:
        "Emitted after the combobox's menu closes and all animations are complete.",
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
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A basic single-select combobox with filterable options. */
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

/** Adds a clear button to reset the selection. */
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

/** Enables free-text entry when no matching option exists. */
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

/** Allows selecting more than one option at a time. */
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

/** Compares filled, outlined, and filled-outlined styles. */
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

/** Shows small, medium, and large combobox sizes. */
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

/** Displays hint text beneath the control for user guidance. */
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

/** A non-interactive disabled combobox. */
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
