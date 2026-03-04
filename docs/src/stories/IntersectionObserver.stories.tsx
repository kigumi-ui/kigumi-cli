import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { IntersectionObserver } from '@/components/ui';

/** Observes changes in the intersection of a target element with an ancestor */
const meta = {
  title: 'Components/Intersection Observer',
  component: IntersectionObserver,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Disables the observer',
      table: { defaultValue: { summary: 'false' } },
    },
    once: {
      control: 'boolean',
      description: 'Stops observing after first intersection',
      table: { defaultValue: { summary: 'false' } },
    },
    threshold: {
      control: 'text',
      description: 'Intersection thresholds',
      table: { defaultValue: { summary: '0' } },
    },
    'root-margin': {
      control: 'text',
      description: 'Root element margin',
      table: { defaultValue: { summary: '0px' } },
    },
    'intersect-class': {
      control: 'text',
      description: 'CSS class to apply when intersecting',
    },
    onIntersect: {
      action: 'intersect',
      description:
        'Fired when a tracked element begins or ceases intersecting.',
      table: { category: 'Events' },
    },
  },
  args: {
    onIntersect: fn(),
  },
} satisfies Meta<typeof IntersectionObserver>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fires an event when the observed element enters the viewport. */
export const Default: Story = {
  render: (args) => {
    const [intersecting, setIntersecting] = useState(false);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div
          style={{
            padding: '0.75rem 1rem',
            background: intersecting
              ? 'var(--wa-color-success-50)'
              : 'var(--wa-color-neutral-50)',
            border: `1px solid ${intersecting ? 'var(--wa-color-success-300)' : 'var(--wa-color-neutral-200)'}`,
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            transition: 'all 0.2s',
          }}
        >
          Status:{' '}
          <strong>
            {intersecting ? '✓ Intersecting' : '✗ Not intersecting'}
          </strong>
        </div>
        <div
          style={{
            height: '200px',
            overflow: 'auto',
            border: '1px solid var(--wa-color-neutral-200)',
            borderRadius: '0.5rem',
            padding: '1rem',
          }}
        >
          <div
            style={{
              height: '300px',
              display: 'flex',
              alignItems: 'flex-start',
              color: 'var(--wa-color-neutral-500)',
              fontSize: '0.875rem',
            }}
          >
            ↓ Scroll down to see the target element
          </div>
          <IntersectionObserver
            {...args}
            onIntersect={(e) => {
              args.onIntersect?.(e);
              setIntersecting(true);
            }}
          >
            <div
              style={{
                padding: '1rem',
                background: 'var(--wa-color-brand-100)',
                borderRadius: '0.5rem',
                textAlign: 'center',
                fontWeight: 600,
              }}
            >
              Target Element (scroll to see)
            </div>
          </IntersectionObserver>
          <div style={{ height: '200px' }} />
        </div>
      </div>
    );
  },
};

/** A practical example that loads an image only when it scrolls into view. */
export const LazyLoad: Story = {
  args: { once: true, threshold: '0.5' },
  render: (args) => {
    const [loaded, setLoaded] = useState(false);
    return (
      <div
        style={{
          height: '300px',
          overflow: 'auto',
          border: '1px solid var(--wa-color-neutral-200)',
          borderRadius: '0.5rem',
          padding: '1rem',
        }}
      >
        <div
          style={{
            height: '400px',
            display: 'flex',
            alignItems: 'flex-start',
            color: 'var(--wa-color-neutral-500)',
            fontSize: '0.875rem',
          }}
        >
          ↓ Scroll down to lazy-load the content
        </div>
        <IntersectionObserver {...args} onIntersect={() => setLoaded(true)}>
          <div
            style={{
              padding: '1.5rem',
              background: loaded
                ? 'var(--wa-color-success-50)'
                : 'var(--wa-color-neutral-100)',
              borderRadius: '0.5rem',
              textAlign: 'center',
              minHeight: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s',
            }}
          >
            {loaded ? '✓ Content loaded!' : 'Content not yet visible...'}
          </div>
        </IntersectionObserver>
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
        IntersectionObserver triggers events based on element visibility and is
        not directly visual.
      </p>
      <IntersectionObserver>
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
      </IntersectionObserver>
    </div>
  ),
};
