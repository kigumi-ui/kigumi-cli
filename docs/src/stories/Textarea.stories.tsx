import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Textarea } from '@/components/ui';

/**
 * Textarea is a multi-line text entry field with configurable row count and resize modes:
 * none, vertical, horizontal, both, or auto-grow. It supports the same appearance styles
 * and sizes as Input, plus a character count via `maxlength`, a hint line, read-only and
 * disabled states, and native form participation.
 */
const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    value: { control: 'text' },
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
    rows: { control: 'number', table: { defaultValue: { summary: '4' } } },
    resize: {
      control: 'select',
      options: ['none', 'vertical', 'horizontal', 'both', 'auto'],
      table: { defaultValue: { summary: 'vertical' } },
    },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    required: { control: 'boolean' },
    maxlength: { control: 'number' },
    onInput: { action: 'input' },
    onChange: { action: 'change' },
    onBlur: { action: 'blur' },
    onFocus: { action: 'focus' },
    onInvalid: { action: 'invalid' },
  },
  args: {
    label: 'Message',
    placeholder: 'Enter your message...',
    onInput: fn(),
    onChange: fn(),
    onBlur: fn(),
    onFocus: fn(),
    onInvalid: fn(),
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A multi-line textarea with a label and placeholder. */
export const Default: Story = {
  args: { label: 'Bio', placeholder: 'Tell us about yourself...' },
};

/** Compares filled, outlined, and filled-outlined styles. */
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
      <Textarea appearance="outlined" label="Outlined" placeholder="Outlined" />
      <Textarea appearance="filled" label="Filled" placeholder="Filled" />
      <Textarea
        appearance="filled-outlined"
        label="Filled Outlined"
        placeholder="Filled Outlined"
      />
    </div>
  ),
};

/** Shows small, medium, and large textarea sizes. */
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
      <Textarea size="small" label="Small" rows={2} />
      <Textarea size="medium" label="Medium" rows={3} />
      <Textarea size="large" label="Large" rows={4} />
    </div>
  ),
};

/** Demonstrates auto-grow, vertical-only, and fixed resize modes. */
export const ResizeModes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxWidth: '400px',
      }}
    >
      <Textarea
        label="Auto resize"
        resize="auto"
        placeholder="Grows as you type"
        rows={2}
      />
      <Textarea
        label="Vertical only"
        resize="vertical"
        placeholder="Drag bottom edge"
      />
      <Textarea label="No resize" resize="none" placeholder="Fixed size" />
    </div>
  ),
};

/** Adds a character counter when maxlength is set. */
export const WithCharacterCount: Story = {
  args: {
    label: 'Tweet',
    placeholder: "What's happening?",
    maxlength: 280,
    hint: 'Max 280 characters',
    rows: 3,
  },
};

/** A non-interactive disabled textarea. */
export const Disabled: Story = {
  args: {
    label: 'Read-only note',
    value: 'This content cannot be changed.',
    disabled: true,
  },
};

/** Shows a hint line below the textarea for user guidance. */
export const WithHint: Story = {
  args: {
    label: 'Cover letter',
    placeholder: 'Describe your experience...',
    hint: 'Keep it concise, 3 to 5 paragraphs recommended',
    rows: 6,
  },
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
      <Textarea label="Default" placeholder="Enter text..." />
      <Textarea label="With Value" value="Some existing text content." />
      <Textarea
        label="Help Text"
        hint="Max 500 characters"
        placeholder="Enter description..."
      />
      <Textarea label="Disabled" disabled value="Disabled textarea" />
      <Textarea label="Invalid" hint="This field is required." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Textarea size="small" placeholder="Small" rows={2} />
        <Textarea size="medium" placeholder="Medium" rows={3} />
        <Textarea size="large" placeholder="Large" rows={4} />
      </div>
    </div>
  ),
};
