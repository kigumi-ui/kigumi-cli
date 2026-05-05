import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent } from 'storybook/test';
import { Textarea } from '@/components/ui';
import { installEventProbe, waitForCalled } from '@/test-utils/play-helpers';

/** Textareas collect multi-line text data from the user */
const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text', description: 'Form field name' },
    value: { control: 'text', description: 'Current value' },
    appearance: {
      control: 'select',
      options: ['filled', 'outlined', 'filled-outlined'],
      description: 'Visual appearance',
      table: { defaultValue: { summary: 'outlined' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Textarea size',
      table: { defaultValue: { summary: 'medium' } },
    },
    label: { control: 'text', description: 'Label text' },
    hint: { control: 'text', description: 'Hint text' },
    placeholder: { control: 'text', description: 'Placeholder text' },
    rows: {
      control: 'number',
      description: 'Visible rows',
      table: { defaultValue: { summary: '4' } },
    },
    resize: {
      control: 'select',
      options: ['none', 'vertical', 'horizontal', 'both', 'auto'],
      description: 'Resize behavior',
      table: { defaultValue: { summary: 'vertical' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the textarea',
      table: { defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      description: 'Makes it readonly',
      table: { defaultValue: { summary: 'false' } },
    },
    required: {
      control: 'boolean',
      description: 'Makes it required',
      table: { defaultValue: { summary: 'false' } },
    },
    minlength: { control: 'number', description: 'Minimum length' },
    maxlength: { control: 'number', description: 'Maximum length' },
    spellcheck: {
      control: 'boolean',
      description: 'Enable spell checking',
      table: { defaultValue: { summary: 'true' } },
    },
    'with-count': {
      control: 'boolean',
      description: 'Shows character count when maxlength is set',
    },
    onBlur: {
      action: 'blur',
      description: 'Emitted when the control loses focus.',
      table: { category: 'Events' },
    },
    onChange: {
      action: 'change',
      description:
        "Emitted when an alteration to the control's value is committed by the user.",
      table: { category: 'Events' },
    },
    onFocus: {
      action: 'focus',
      description: 'Emitted when the control gains focus.',
      table: { category: 'Events' },
    },
    onInput: {
      action: 'input',
      description: 'Emitted when the control receives input.',
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
    onBlur: fn(),
    onChange: fn(),
    onFocus: fn(),
    onInput: fn(),
    onInvalid: fn(),
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A multi-line textarea with a label and placeholder. */
export const Default: Story = {
  tags: ['interaction'],
  args: { label: 'Bio', placeholder: 'Tell us about yourself...' },
  play: async ({ args, canvasElement }) => {
    const host = canvasElement.querySelector<HTMLElement>('wa-textarea');
    if (!host) throw new Error('wa-textarea not found');
    const cleanup = installEventProbe(host, 'input', args.onInput);
    // wa-textarea wraps a native <textarea> in shadow DOM; user-event needs
    // the focusable inner element to dispatch composed events upward.
    const inner =
      host.shadowRoot?.querySelector<HTMLTextAreaElement>('textarea');
    if (!inner) throw new Error('wa-textarea shadow textarea not found');
    inner.focus();
    await userEvent.keyboard('hello');
    await waitForCalled(args, 'onInput');
    cleanup();
  },
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
