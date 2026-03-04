import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { MutationObserver, Button } from '@/components/ui';

/** Observes changes to a target element and emits events when they occur */
const meta = {
  title: 'Components/Mutation Observer',
  component: MutationObserver,
  tags: ['autodocs'],
  argTypes: {
    attr: {
      control: 'text',
      description: 'Space-separated list of attributes to observe',
    },
    'attr-old-value': {
      control: 'boolean',
      description: 'Records previous attribute values',
      table: { defaultValue: { summary: 'false' } },
    },
    'char-data': {
      control: 'boolean',
      description: 'Observes character data changes',
      table: { defaultValue: { summary: 'false' } },
    },
    'char-data-old-value': {
      control: 'boolean',
      description: 'Records previous character data',
      table: { defaultValue: { summary: 'false' } },
    },
    'child-list': {
      control: 'boolean',
      description: 'Observes child node changes',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the observer',
      table: { defaultValue: { summary: 'false' } },
    },
    subtree: {
      control: 'boolean',
      description: 'Observes changes in subtree',
      table: { defaultValue: { summary: 'false' } },
    },
    onMutation: {
      action: 'mutation',
      description: 'Emitted when a mutation occurs.',
      table: { category: 'Events' },
    },
  },
  args: {
    onMutation: fn(),
  },
} satisfies Meta<typeof MutationObserver>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Reports child-list mutations as nodes are added to the observed subtree. */
export const Default: Story = {
  args: { 'child-list': true },
  render: (args) => {
    const [items, setItems] = useState(['Item 1', 'Item 2', 'Item 3']);
    const [mutations, setMutations] = useState(0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div
          style={{ fontSize: '0.875rem', color: 'var(--wa-color-neutral-600)' }}
        >
          Mutations detected: <strong>{mutations}</strong>
        </div>
        <MutationObserver
          {...args}
          onMutation={(e) => {
            args.onMutation?.(e);
            setMutations((m) => m + 1);
          }}
        >
          <div
            style={{
              border: '1px solid var(--wa-color-neutral-200)',
              borderRadius: '0.5rem',
              padding: '1rem',
            }}
          >
            <ul style={{ margin: '0 0 1rem', padding: '0 0 0 1.5rem' }}>
              {items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                size="small"
                onClick={() =>
                  setItems((prev) => [...prev, `Item ${prev.length + 1}`])
                }
              >
                Add Item
              </Button>
              <Button
                size="small"
                variant="danger"
                appearance="outlined"
                onClick={() => setItems((prev) => prev.slice(0, -1))}
              >
                Remove Last
              </Button>
            </div>
          </div>
        </MutationObserver>
      </div>
    );
  },
};

/** Watches for attribute changes on the observed element. */
export const AttributeObserver: Story = {
  args: { attr: 'class,style', 'attr-old-value': true },
  render: (args) => {
    const [highlighted, setHighlighted] = useState(false);
    const [mutations, setMutations] = useState(0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div
          style={{ fontSize: '0.875rem', color: 'var(--wa-color-neutral-600)' }}
        >
          Attribute mutations: <strong>{mutations}</strong>
        </div>
        <MutationObserver
          {...args}
          onMutation={(e) => {
            args.onMutation?.(e);
            setMutations((m) => m + 1);
          }}
        >
          <div
            style={{
              padding: '1rem',
              borderRadius: '0.5rem',
              background: highlighted
                ? 'var(--wa-color-warning-100)'
                : 'var(--wa-color-neutral-50)',
              border: `1px solid ${highlighted ? 'var(--wa-color-warning-400)' : 'var(--wa-color-neutral-200)'}`,
              transition: 'all 0.3s',
              marginBottom: '0.75rem',
            }}
          >
            Observed element: style changes trigger mutation events
          </div>
        </MutationObserver>
        <Button size="small" onClick={() => setHighlighted((h) => !h)}>
          Toggle Highlight
        </Button>
      </div>
    );
  },
};

/** Static snapshot for visual regression testing. */
export const ChromaticOnly: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { chromatic: { pauseAnimationAtEnd: true } },
  render: () => (
    <div style={{ padding: '1.5rem' }}>
      <p
        style={{
          marginBottom: '1rem',
          color: 'var(--wa-color-neutral-text-subtle)',
          fontSize: '0.875rem',
        }}
      >
        MutationObserver observes DOM changes and is not directly visual.
      </p>
      <MutationObserver attr="class">
        <div
          style={{
            padding: '2rem',
            background: 'var(--wa-color-neutral-fill-subtle)',
            borderRadius: '0.5rem',
            textAlign: 'center',
          }}
        >
          Observed Element
        </div>
      </MutationObserver>
      <Button style={{ marginTop: '1rem' }}>Add Mutation</Button>
    </div>
  ),
};
