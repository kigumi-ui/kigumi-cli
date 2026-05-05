import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent } from 'storybook/test';
import { Combobox, Option } from '@/components/ui';
import { installEventProbe, waitForCalled } from '@/test-utils/play-helpers';

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
  tags: ['autodocs', 'pro', 'beta'],
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
    'allow-create': {
      control: 'boolean',
      description: 'Allows creating new options not in the list',
    },
    autocapitalize: {
      control: 'select',
      options: ['off', 'none', 'on', 'sentences', 'words', 'characters'],
      description: 'Controls autocapitalization',
    },
    autocorrect: {
      control: 'boolean',
      description: 'Enable or disable autocorrect',
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
    enterkeyhint: {
      control: 'select',
      options: ['enter', 'done', 'go', 'next', 'previous', 'search', 'send'],
      description: 'Keyboard Enter key label',
    },
    inputmode: {
      control: 'select',
      options: [
        'none',
        'text',
        'decimal',
        'numeric',
        'tel',
        'search',
        'email',
        'url',
      ],
      description: 'Virtual keyboard type',
    },
    spellcheck: {
      control: 'boolean',
      description: 'Enable or disable spellchecking',
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
    onCreate: {
      action: 'wa-create',
      description: 'Emitted when creating new option via allow-create',
      table: { category: 'Events' },
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
    onCreate: fn(),
  },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A basic single-select combobox with filterable options. */
export const Default: Story = {
  tags: ['interaction'],
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
  play: async ({ args, canvasElement }) => {
    const host = canvasElement.querySelector<HTMLElement>('wa-combobox');
    if (!host) throw new Error('wa-combobox not found');
    const cleanup = installEventProbe(host, 'change', args.onChange);
    // wa-combobox keeps its trigger input in shadow root; show() opens the
    // listbox programmatically without driving the popup-positioning logic.
    (host as HTMLElement & { show?: () => void }).show?.();
    const option = host.querySelector<HTMLElement>('wa-option[value="apple"]');
    if (!option) throw new Error('wa-option for Apple not found');
    await userEvent.click(option);
    await waitForCalled(args, 'onChange');
    cleanup();
  },
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
