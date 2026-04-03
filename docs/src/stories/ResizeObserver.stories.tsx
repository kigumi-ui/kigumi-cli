import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { ResizeObserver } from '@/components/ui';

/** Reports changes to the dimensions of an element */
const meta = {
  title: 'Components/Resize Observer',
  component: ResizeObserver,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Disables the observer',
      table: { defaultValue: { summary: 'false' } },
    },
    onResize: {
      action: 'resize',
      description: 'Emitted when the element is resized.',
      table: { category: 'Events' },
    },
  },
  args: {
    onResize: fn(),
  },
} satisfies Meta<typeof ResizeObserver>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Logs resize events as the observed element's size changes. */
export const Default: Story = {
  render: (args) => {
    const [size, setSize] = useState({ width: 0, height: 0 });
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.875rem',
            color: 'var(--wa-color-neutral-600)',
          }}
        >
          Resize the box below by dragging its corner.
        </p>
        <ResizeObserver
          {...args}
          onResize={(e) => {
            args.onResize?.(e);
            const entry = (e.detail as { entries: ResizeObserverEntry[] })
              ?.entries?.[0];
            if (entry) {
              setSize({
                width: Math.round(entry.contentRect.width),
                height: Math.round(entry.contentRect.height),
              });
            }
          }}
        >
          <div
            style={{
              resize: 'both',
              overflow: 'auto',
              width: '200px',
              height: '150px',
              minWidth: '100px',
              minHeight: '80px',
              border: '2px dashed var(--wa-color-neutral-400)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--wa-color-neutral-600)',
              fontSize: '0.875rem',
            }}
          >
            Resize me!
          </div>
        </ResizeObserver>
        <div style={{ fontSize: '0.875rem' }}>
          Current size:{' '}
          <strong>
            {size.width} × {size.height}
          </strong>
          px
        </div>
      </div>
    );
  },
};

/** Shows the observer in a paused/disabled state. */
export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p
        style={{
          margin: 0,
          fontSize: '0.875rem',
          color: 'var(--wa-color-neutral-600)',
        }}
      >
        Observer is disabled, resize events will not fire.
      </p>
      <ResizeObserver {...args}>
        <div
          style={{
            resize: 'both',
            overflow: 'auto',
            width: '200px',
            height: '150px',
            border: '2px dashed var(--wa-color-neutral-300)',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--wa-color-neutral-400)',
            fontSize: '0.875rem',
          }}
        >
          Observer disabled
        </div>
      </ResizeObserver>
    </div>
  ),
};