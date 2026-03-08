import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from '@/components/ui';

/**
 * Arranges children vertically with a consistent gap via the `.wa-stack` class.
 */
const meta = {
  title: 'Layout/Stack',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Basic vertical stack of skeleton text lines. */
export const Default: Story = {
  render: () => (
    <div className="wa-stack" style={{ maxWidth: '400px' }}>
      <Skeleton style={{ width: '100%', height: '1rem' }} />
      <Skeleton style={{ width: '80%', height: '1rem' }} />
      <Skeleton style={{ width: '60%', height: '1rem' }} />
    </div>
  ),
};

/** Override `--wa-stack-space` to increase the gap between items. */
export const WithCustomGap: Story = {
  render: () => (
    <div
      className="wa-stack"
      style={
        {
          '--wa-stack-space': 'var(--wa-space-xl)',
          maxWidth: '400px',
        } as React.CSSProperties
      }
    >
      <Skeleton style={{ width: '100%', height: '1rem' }} />
      <Skeleton style={{ width: '80%', height: '1rem' }} />
      <Skeleton style={{ width: '60%', height: '1rem' }} />
    </div>
  ),
};

/** Realistic list of content cards stacked vertically. */
export const CardList: Story = {
  render: () => (
    <div className="wa-stack" style={{ maxWidth: '400px' }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            border: '1px solid var(--wa-color-surface-border)',
            borderRadius: '6px',
            padding: '1rem',
          }}
        >
          <div className="wa-stack">
            <Skeleton
              style={{ width: '100%', height: '100px', borderRadius: '6px' }}
            />
            <Skeleton style={{ width: '90%', height: '1rem' }} />
            <Skeleton style={{ width: '70%', height: '1rem' }} />
          </div>
        </div>
      ))}
    </div>
  ),
};
