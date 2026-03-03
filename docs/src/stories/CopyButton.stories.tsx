import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { CopyButton } from '@/components/ui';

/** Copies text data to the clipboard when clicked */
const meta = {
  title: 'Components/Copy Button',
  component: CopyButton,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text', description: 'The text to copy' },
    from: {
      control: 'text',
      description: 'Element selector to copy text from',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
      table: { defaultValue: { summary: 'false' } },
    },
    'copy-label': {
      control: 'text',
      description: 'Tooltip label for copy state',
    },
    'success-label': {
      control: 'text',
      description: 'Tooltip label for success state',
    },
    'error-label': {
      control: 'text',
      description: 'Tooltip label for error state',
    },
    'feedback-duration': {
      control: 'number',
      description: 'Duration of feedback state in milliseconds',
      table: { defaultValue: { summary: '1000' } },
    },
    'tooltip-placement': {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left'],
      description: 'Tooltip position',
      table: { defaultValue: { summary: 'top' } },
    },
    onCopy: {
      action: 'copy',
      description: 'Emitted when the data has been copied.',
      table: { category: 'Events' },
    },
    onError: {
      action: 'error',
      description: 'Emitted when the data could not be copied.',
      table: { category: 'Events' },
    },
    'slot:copy-icon': {
      control: false,
      description:
        'The icon to show in the default copy state. Works best with `<wa-icon>`.',
      table: { category: 'Slots' },
    },
    'slot:success-icon': {
      control: false,
      description:
        'The icon to show when the content is copied. Works best with `<wa-icon>`.',
      table: { category: 'Slots' },
    },
    'slot:error-icon': {
      control: false,
      description:
        'The icon to show when a copy error occurs. Works best with `<wa-icon>`.',
      table: { category: 'Slots' },
    },
  },
  args: {
    onCopy: fn(),
    onError: fn(),
  },
} satisfies Meta<typeof CopyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A basic copy button with a simple text value. */
export const Default: Story = {
  args: { value: 'Hello, World!' },
};

/** Presents a copy button alongside a styled code block. */
export const CodeSnippet: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'var(--wa-color-neutral-fill-quiet)',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        fontFamily: 'monospace',
      }}
    >
      <code style={{ flex: 1 }}>npx kigumi init</code>
      <CopyButton value="npx kigumi init" />
    </div>
  ),
};

/** Shows a masked API key with a copy button for easy retrieval. */
export const ApiKey: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        maxWidth: '400px',
      }}
    >
      <code
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '0.875rem',
        }}
      >
        sk_live_abc123def456ghi789jkl012mno345
      </code>
      <CopyButton
        value="sk_live_abc123def456ghi789jkl012mno345"
        copy-label="Copy API key"
        success-label="Copied!"
      />
    </div>
  ),
};

/** Overrides the default copy/copied/error tooltip labels. */
export const CustomLabels: Story = {
  args: {
    value: 'Custom copy text',
    'copy-label': 'Click to copy',
    'success-label': 'Done! ✓',
    'feedback-duration': 3000,
  },
};

/** A non-interactive disabled copy button. */
export const Disabled: Story = {
  args: { value: 'Cannot copy', disabled: true },
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
      <CopyButton value="Hello, World!" />
      <CopyButton
        value="npx kigumi init"
        copy-label="Copy install command"
        success-label="Copied!"
      />
    </div>
  ),
};
