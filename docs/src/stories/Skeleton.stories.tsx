import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from '@/components/ui';

/**
 * Skeleton renders a placeholder shape that mimics the layout of content while it loads.
 * Use it to reduce perceived wait time and avoid layout shift. Three animation effects are
 * available (sheen by default, pulse, and none), and the shape is fully configurable via
 * CSS (width, height, border-radius).
 */
const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {
    effect: {
      control: 'select',
      options: ['pulse', 'sheen', 'none'],
      description: 'Loading animation style',
      table: { defaultValue: { summary: 'sheen' } },
    },
  },
  args: { effect: 'sheen' },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A single inline skeleton placeholder. */
export const Default: Story = {
  render: (args) => (
    <Skeleton {...args} style={{ width: '200px', height: '1rem' }} />
  ),
};

/** Compares the three animation effects: sheen, pulse, and none. */
export const Effects: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxWidth: '300px',
      }}
    >
      <div>
        <p
          style={{ fontSize: '0.75rem', marginBottom: '0.25rem', opacity: 0.7 }}
        >
          Sheen (default)
        </p>
        <Skeleton effect="sheen" style={{ width: '100%', height: '1rem' }} />
      </div>
      <div>
        <p
          style={{ fontSize: '0.75rem', marginBottom: '0.25rem', opacity: 0.7 }}
        >
          Pulse
        </p>
        <Skeleton effect="pulse" style={{ width: '100%', height: '1rem' }} />
      </div>
      <div>
        <p
          style={{ fontSize: '0.75rem', marginBottom: '0.25rem', opacity: 0.7 }}
        >
          None
        </p>
        <Skeleton effect="none" style={{ width: '100%', height: '1rem' }} />
      </div>
    </div>
  ),
};

/** Mimics a paragraph of text with multiple skeleton lines. */
export const TextLines: Story = {
  render: (args) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '400px',
      }}
    >
      <Skeleton {...args} style={{ width: '60%', height: '1.25rem' }} />
      <Skeleton {...args} style={{ width: '100%', height: '1rem' }} />
      <Skeleton {...args} style={{ width: '100%', height: '1rem' }} />
      <Skeleton {...args} style={{ width: '80%', height: '1rem' }} />
    </div>
  ),
};

/** A complete card layout skeleton with image, avatar, and text placeholders. */
export const CardSkeleton: Story = {
  render: (args) => (
    <div
      style={{
        maxWidth: '320px',
        border: '1px solid var(--wa-color-neutral-stroke-quiet)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <Skeleton
        {...args}
        style={{ width: '100%', height: '180px', borderRadius: 0 }}
      />
      <div
        style={{
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Skeleton
            {...args}
            style={{ width: '40px', height: '40px', borderRadius: '50%' }}
          />
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <Skeleton {...args} style={{ width: '60%', height: '0.875rem' }} />
            <Skeleton {...args} style={{ width: '40%', height: '0.75rem' }} />
          </div>
        </div>
        <Skeleton {...args} style={{ width: '100%', height: '0.875rem' }} />
        <Skeleton {...args} style={{ width: '90%', height: '0.875rem' }} />
        <Skeleton {...args} style={{ width: '70%', height: '0.875rem' }} />
      </div>
    </div>
  ),
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
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Skeleton
          style={{ width: '3rem', height: '3rem', borderRadius: '50%' }}
        />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <Skeleton style={{ width: '60%', height: '1rem' }} />
          <Skeleton style={{ width: '40%', height: '0.75rem' }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Skeleton style={{ height: '1rem' }} />
        <Skeleton style={{ height: '1rem', width: '90%' }} />
        <Skeleton style={{ height: '1rem', width: '80%' }} />
      </div>
      <Skeleton
        effect="sheen"
        style={{ height: '200px', borderRadius: '0.5rem' }}
      />
      <Skeleton effect="pulse" style={{ height: '80px' }} />
      <Skeleton effect="none" style={{ height: '60px' }} />
    </div>
  ),
};
