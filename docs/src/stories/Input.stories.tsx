import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Input, Icon } from '@/components/ui';

/**
 * Input is a single-line text entry field that supports all standard HTML input types
 * (text, email, password, search, tel, URL, date, etc.). It exposes prefix/suffix icon
 * slots, a clearable option, password visibility toggle, pill corners, three appearance
 * styles, three sizes, and a hint line, all without additional wrapper components.
 */
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
      table: { defaultValue: { summary: 'text' } },
    },
    label: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    value: { control: 'text' },
    appearance: {
      control: 'select',
      options: ['filled', 'filled-outlined', 'outlined'],
      table: { defaultValue: { summary: 'outlined' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      table: { defaultValue: { summary: 'medium' } },
    },
    pill: { control: 'boolean' },
    disabled: { control: 'boolean' },
    'with-clear': {
      control: 'boolean',
      description: 'Adds a clear button when input has content',
    },
    'password-toggle': {
      control: 'boolean',
      description: 'Adds visibility toggle for password type',
    },
    onInput: { action: 'input' },
    onChange: { action: 'change' },
    onBlur: { action: 'blur' },
    onFocus: { action: 'focus' },
    onClear: { action: 'clear' },
    onInvalid: { action: 'invalid' },
  },
  args: {
    label: 'Label',
    placeholder: 'Enter text...',
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
  args: { label: 'Full name', placeholder: 'Jane Doe' },
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
