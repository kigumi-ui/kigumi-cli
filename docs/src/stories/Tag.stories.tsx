import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { Tag } from '@/components/ui';

const meta = {
  title: 'Display/Tag',
  component: Tag,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['brand', 'neutral', 'success', 'warning', 'danger'],
      table: { defaultValue: { summary: 'neutral' } },
    },
    appearance: {
      control: 'select',
      options: ['accent', 'filled', 'outlined', 'filled-outlined'],
      table: { defaultValue: { summary: 'filled-outlined' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      table: { defaultValue: { summary: 'medium' } },
    },
    pill: { control: 'boolean' },
    withRemove: { control: 'boolean', description: 'Shows a remove button' },
    children: { control: 'text' },
    onRemove: { action: 'removed' },
  },
  args: {
    children: 'Tag',
    onRemove: fn(),
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: 'Design System' },
};

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

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <Tag size="small">Small</Tag>
      <Tag size="medium">Medium</Tag>
      <Tag size="large">Large</Tag>
    </div>
  ),
};

export const Removable: Story = {
  render: () => {
    const [tags, setTags] = useState([
      'React',
      'TypeScript',
      'Web Awesome',
      'Storybook',
    ]);
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
        <Tag variant="brand" appearance="tinted">
          Tinted
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
        <Tag removable variant="success">
          Removable
        </Tag>
      </div>
    </div>
  ),
};
