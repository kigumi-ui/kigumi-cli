import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, waitFor, within } from 'storybook/test';
import { useState } from 'react';
import { Tag } from '@/components/ui';

/** Tags are used as labels to organize things or indicate selections */
const meta = {
  title: 'Components/Tag',
  component: Tag,
  tags: ['autodocs'],
  argTypes: {
    appearance: {
      control: 'select',
      options: ['accent', 'filled', 'outlined', 'filled-outlined'],
      description: 'Visual appearance',
      table: { defaultValue: { summary: 'filled-outlined' } },
    },
    pill: {
      control: 'boolean',
      description: 'Rounded edges',
      table: { defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large', 'xs', 's', 'm', 'l', 'xl'],
      description: 'Tag size',
      table: { defaultValue: { summary: 'medium' } },
    },
    variant: {
      control: 'select',
      options: ['brand', 'neutral', 'success', 'warning', 'danger'],
      description: 'Theme variant',
      table: { defaultValue: { summary: 'neutral' } },
    },
    'with-remove': {
      control: 'boolean',
      description: 'Shows remove button',
      table: { defaultValue: { summary: 'false' } },
    },
    children: { control: 'text' },
    onRemove: {
      action: 'remove',
      description: 'Emitted when the remove button is activated.',
      table: { category: 'Events' },
    },
  },
  args: {
    children: 'Tag',
    onRemove: fn(),
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A single tag in the default neutral/filled-outlined style. */
export const Default: Story = {
  tags: ['interaction'],
  args: { children: 'Design System' },
  // Default Tag has no remove button, so assert the host renders with the
  // slotted label landing inside it. The remove-flow is exercised by the
  // Removable story below for visual coverage.
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('wa-tag') as HTMLElement | null;
    await expect(host).not.toBeNull();
    await waitFor(() =>
      expect(
        within(host as HTMLElement).getByText('Design System')
      ).toBeInTheDocument()
    );
  },
};

/** Shows all five semantic color variants. */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Tag variant="brand">Brand</Tag>
      <Tag variant="neutral">Neutral</Tag>
      <Tag variant="success">Success</Tag>
      <Tag variant="warning">Warning</Tag>
      <Tag variant="danger">Danger</Tag>
    </div>
  ),
};

/** Compares accent, filled, outlined, and filled-outlined styles. */
export const Appearances: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Tag appearance="accent">Accent</Tag>
      <Tag appearance="filled">Filled</Tag>
      <Tag appearance="outlined">Outlined</Tag>
      <Tag appearance="filled-outlined">Filled Outlined</Tag>
    </div>
  ),
};

/** Shows small, medium, and large tag sizes. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <Tag size="small">Small</Tag>
      <Tag size="medium">Medium</Tag>
      <Tag size="large">Large</Tag>
    </div>
  ),
};

/** Interactive tags with a remove button that deletes them from the list. */
export const Removable: Story = {
  render: () => {
    const [tags, setTags] = useState(['React', 'TypeScript', 'Storybook']);
    return (
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {tags.map((tag) => (
          <Tag
            key={tag}
            variant="brand"
            withRemove
            onRemove={() => setTags((prev) => prev.filter((t) => t !== tag))}
          >
            {tag}
          </Tag>
        ))}
      </div>
    );
  },
};

/** Tags with fully rounded pill corners. */
export const Pill: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Tag pill variant="brand">
        React
      </Tag>
      <Tag pill variant="success">
        TypeScript
      </Tag>
      <Tag pill variant="neutral">
        CSS
      </Tag>
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
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Tag variant="neutral">Neutral</Tag>
        <Tag variant="brand">Brand</Tag>
        <Tag variant="success">Success</Tag>
        <Tag variant="warning">Warning</Tag>
        <Tag variant="danger">Danger</Tag>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Tag variant="brand" appearance="accent">
          Accent
        </Tag>
        <Tag variant="brand" appearance="filled">
          Filled
        </Tag>
        <Tag variant="brand" appearance="outlined">
          Outlined
        </Tag>
        <Tag variant="brand" appearance="filled-outlined">
          Filled Outlined
        </Tag>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Tag size="small">Small</Tag>
        <Tag size="medium">Medium</Tag>
        <Tag size="large">Large</Tag>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Tag pill variant="brand">
          Pill
        </Tag>
        <Tag withRemove variant="success">
          Removable
        </Tag>
      </div>
    </div>
  ),
};
