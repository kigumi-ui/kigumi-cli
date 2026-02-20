import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Include } from '@/components/ui';

const meta = {
  title: 'Utilities/Include',
  component: Include,
  tags: ['autodocs'],
  argTypes: {
    src: { control: 'text', description: 'URL of the HTML content to include' },
    'allow-scripts': {
      control: 'boolean',
      description: 'Allow script execution in included content',
    },
    mode: {
      control: 'select',
      options: ['cors', 'no-cors', 'same-origin'],
      table: { defaultValue: { summary: 'cors' } },
    },
    onLoad: { action: 'load' },
    onIncludeError: { action: 'include-error' },
  },
  args: {
    onLoad: fn(),
    onIncludeError: fn(),
  },
} satisfies Meta<typeof Include>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    src: 'https://www.w3schools.com/html/html_intro.asp',
  },
  render: (args) => (
    <div>
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--wa-color-neutral-600)',
          marginBottom: '1rem',
        }}
      >
        The <code>Include</code> component fetches and injects external HTML
        content. Note: CORS restrictions apply for cross-origin requests.
      </p>
      <div
        style={{
          border: '1px solid var(--wa-color-neutral-200)',
          borderRadius: '0.5rem',
          padding: '1rem',
          maxHeight: '200px',
          overflow: 'auto',
        }}
      >
        <Include {...args} />
      </div>
    </div>
  ),
};

export const ErrorState: Story = {
  args: {
    src: 'https://non-existent-domain-12345.invalid/page.html',
  },
  render: (args) => (
    <div>
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--wa-color-neutral-600)',
          marginBottom: '1rem',
        }}
      >
        When the URL is unreachable, the <code>wa-include-error</code> event
        fires. Check the Actions panel.
      </p>
      <Include {...args} />
    </div>
  ),
};

export const SameOrigin: Story = {
  args: {
    mode: 'same-origin',
  },
  render: (args) => (
    <div>
      <p style={{ fontSize: '0.875rem', color: 'var(--wa-color-neutral-600)' }}>
        Use <code>mode="same-origin"</code> for resources on the same domain.
        Provide a <code>src</code> pointing to a local HTML file.
      </p>
      <Include {...args} />
    </div>
  ),
};

export const ChromaticOnly: Story = {
  // tags: ['!dev', '!autodocs'],
  parameters: { chromatic: { pauseAnimationAtEnd: true } },
  render: () => (
    <div style={{ padding: '1.5rem' }}>
      <p
        style={{
          color: 'var(--wa-color-neutral-text-subtle)',
          fontSize: '0.875rem',
        }}
      >
        Include fetches external HTML content — not testable in a static
        Chromatic snapshot.
      </p>
      <Include src="https://non-existent.invalid/page.html" />
    </div>
  ),
};
