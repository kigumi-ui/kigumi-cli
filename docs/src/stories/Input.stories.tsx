import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent } from 'storybook/test';
import { Input, Icon } from '@/components/ui';
import { installEventProbe, waitForCalled } from '@/test-utils/play-helpers';

/** Inputs collect data from the user */
const meta = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: [
        'text',
        'email',
        'password',
        'number',
        'date',
        'tel',
        'url',
        'search',
      ],
      description: 'Input type',
      table: { defaultValue: { summary: 'text' } },
    },
    label: { control: 'text', description: 'Accessible label for the input' },
    hint: { control: 'text', description: 'Descriptive hint text' },
    placeholder: { control: 'text', description: 'Placeholder text' },
    value: { control: 'text', description: 'Input value' },
    appearance: {
      control: 'select',
      options: ['filled', 'filled-outlined', 'outlined'],
      description: 'Visual appearance style',
      table: { defaultValue: { summary: 'outlined' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large', 'xs', 's', 'm', 'l', 'xl'],
      description: 'Input size',
      table: { defaultValue: { summary: 'medium' } },
    },
    pill: {
      control: 'boolean',
      description: 'Gives the input rounded edges',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the input',
      table: { defaultValue: { summary: 'false' } },
    },
    'with-clear': {
      control: 'boolean',
      description: 'Adds a clear button when input has content',
      table: { defaultValue: { summary: 'false' } },
    },
    'password-toggle': {
      control: 'boolean',
      description: 'Adds a toggle button for password visibility',
      table: { defaultValue: { summary: 'false' } },
    },
    'password-visible': {
      control: 'boolean',
      description: 'Shows the password as plain text when set',
      table: { defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      description: 'Makes the input readonly',
      table: { defaultValue: { summary: 'false' } },
    },
    required: {
      control: 'boolean',
      description: 'Makes the input required',
      table: { defaultValue: { summary: 'false' } },
    },
    name: {
      control: 'text',
      description: 'The name of the input for form submission',
    },
    pattern: {
      control: 'text',
      description: 'A regular expression pattern the value must match',
    },
    minlength: { control: 'number', description: 'Minimum string length' },
    maxlength: { control: 'number', description: 'Maximum string length' },
    min: {
      control: 'text',
      description: 'Minimum value for numeric and date types',
    },
    max: {
      control: 'text',
      description: 'Maximum value for numeric and date types',
    },
    step: { control: 'text', description: 'Step increment for numeric types' },
    'without-spin-buttons': {
      control: 'boolean',
      description: "Hides the browser's built-in spin buttons",
      table: { defaultValue: { summary: 'false' } },
    },
    autocomplete: {
      control: 'text',
      description: 'Hint for autocomplete behavior',
    },
    autocapitalize: {
      control: 'select',
      options: ['off', 'none', 'on', 'sentences', 'words', 'characters'],
      description: 'Controls automatic capitalization',
    },
    autocorrect: {
      control: 'boolean',
      description: 'Enable autocorrect',
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
      description: 'Hint for virtual keyboard type',
    },
    enterkeyhint: {
      control: 'select',
      options: ['enter', 'done', 'go', 'next', 'previous', 'search', 'send'],
      description: 'Hint for Enter key label on virtual keyboards',
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
    onClear: {
      action: 'clear',
      description: 'Emitted when the clear button is activated.',
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
    onClear: fn(),
    onInvalid: fn(),
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A basic text input with a label. */
export const Default: Story = {
  tags: ['interaction'],
  args: { label: 'Full name', placeholder: 'Jane Doe' },
  play: async ({ args, canvasElement }) => {
    const host = canvasElement.querySelector<HTMLElement>('wa-input');
    if (!host) throw new Error('wa-input not found');
    const cleanup = installEventProbe(host, 'input', args.onInput);
    // wa-input renders the native <input> in its shadow root; user-event needs
    // the actual focusable inner element to dispatch composed events upward.
    const innerInput =
      host.shadowRoot?.querySelector<HTMLInputElement>('input');
    if (!innerInput) throw new Error('wa-input shadow input not found');
    innerInput.focus();
    await userEvent.keyboard('kigumi');
    await waitForCalled(args, 'onInput');
    cleanup();
  },
};

/** Shows email, tel, URL, and date input types. */
export const Types: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxWidth: '400px',
      }}
    >
      <Input type="text" label="Text" placeholder="Enter text" />
      <Input type="email" label="Email" placeholder="name@example.com" />
      <Input type="tel" label="Phone" placeholder="+1 (555) 000-0000" />
      <Input type="url" label="Website" placeholder="https://example.com" />
      <Input type="number" label="Amount" placeholder="0.00" />
      <Input type="date" label="Date" />
      <Input type="search" label="Search" placeholder="Search..." />
    </div>
  ),
};

/** An input with a show/hide password toggle button. */
export const Password: Story = {
  args: {
    type: 'password',
    label: 'Password',
    placeholder: 'Enter your password',
    'password-toggle': true,
  },
};

/** Adds a clear button that resets the field value. */
export const WithClear: Story = {
  args: {
    label: 'Search',
    placeholder: 'Type to search...',
    'with-clear': true,
    value: 'Hello World',
  },
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
      <Input appearance="outlined" label="Outlined" placeholder="Outlined" />
      <Input appearance="filled" label="Filled" placeholder="Filled" />
      <Input
        appearance="filled-outlined"
        label="Filled Outlined"
        placeholder="Filled Outlined"
      />
    </div>
  ),
};

/** Shows small, medium, and large input sizes. */
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
      <Input size="small" label="Small" placeholder="Small input" />
      <Input size="medium" label="Medium" placeholder="Medium input" />
      <Input size="large" label="Large" placeholder="Large input" />
    </div>
  ),
};

/** Renders the input with fully rounded pill corners. */
export const Pill: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search...',
    pill: true,
    'with-clear': true,
  },
};

/** A non-interactive disabled input field. */
export const Disabled: Story = {
  args: { label: 'Disabled field', value: 'Read-only value', disabled: true },
};

/** Displays hint text below the input for guidance. */
export const WithHint: Story = {
  args: {
    label: 'Username',
    placeholder: 'Choose a username',
    hint: 'Must be 3 to 20 characters, letters and numbers only',
  },
};

/** Shows prefix and suffix icon usage. */
export const WithIcons: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxWidth: '400px',
      }}
    >
      <Input label="Search" placeholder="Search...">
        <Icon slot="start" name="magnifying-glass" />
      </Input>
      <Input label="Email" placeholder="name@example.com" type="email">
        <Icon slot="start" name="envelope" />
        <Icon
          slot="end"
          name="circle-check"
          style={{ color: 'var(--wa-color-success-fill-loud)' }}
        />
      </Input>
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
        maxWidth: '400px',
      }}
    >
      <Input label="Default" placeholder="Enter text" />
      <Input
        label="With Help"
        hint="This is help text"
        placeholder="Enter email"
        type="email"
      />
      <Input label="With Value" value="Prefilled value" />
      <Input label="Required" required />
      <Input label="Disabled" disabled value="Disabled input" />
      <Input label="Invalid" hint="This field is required" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Input size="small" placeholder="Small" />
        <Input size="medium" placeholder="Medium" />
        <Input size="large" placeholder="Large" />
      </div>
      <Input label="With Icons" placeholder="Search...">
        <Icon name="magnifying-glass" slot="start" />
        <Icon name="xmark" slot="end" />
      </Input>
      <Input label="Password" type="password" value="secret" password-toggle />
    </div>
  ),
};
