import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { CopyButton } from '@/components/ui';

const meta = {
  title: 'Inputs/CopyButton',
  component: CopyButton,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text', description: 'The text to copy to clipboard' },
    'copy-label': {
      control: 'text',
      description: 'Tooltip shown before copying',
      table: { defaultValue: { summary: 'Copy' } },
    },
    'success-label': {
      control: 'text',
      description: 'Tooltip shown after copying',
      table: { defaultValue: { summary: 'Copied!' } },
    },
    'error-label': {
      control: 'text',
      description: 'Tooltip shown on copy failure',
      table: { defaultValue: { summary: 'Error' } },
    },
    'feedback-duration': {
      control: 'number',
      description: 'Duration to show success feedback (ms)',
      table: { defaultValue: { summary: '1000' } },
    },
    'tooltip-placement': {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left'],
      table: { defaultValue: { summary: 'top' } },
    },
    disabled: { control: 'boolean' },
    onCopy: { action: 'copy' },
    onError: { action: 'error' },
  },
  args: {
    value: 'Hello, World!',
    onCopy: fn(),
    onError: fn(),
  },
} satisfies Meta<typeof CopyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 'Hello, World!' },
};

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

export const CustomLabels: Story = {
  args: {
    value: 'Custom copy text',
    'copy-label': 'Click to copy',
    'success-label': 'Done! ✓',
    'feedback-duration': 3000,
  },
};

export const Disabled: Story = {
  args: { value: 'Cannot copy', disabled: true },
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
      <CopyButton value="Hello, World!" />
      <CopyButton
        value="npm install @web-awesome/core"
        copy-label="Copy install command"
        success-label="Copied!"
      />
    </div>
  ),
};
