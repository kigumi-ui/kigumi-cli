import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from '@/components/ui';

/**
 * Horizontal wrapping group with consistent gap via `.wa-cluster`. Ideal for tags, chips,
 * or action groups.
 */
const meta = {
  title: 'Layout/Cluster',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const pillWidths = [64, 80, 48, 96, 56, 72, 88, 48];

/** Horizontal wrapping group of skeleton pill badges. */
export const Default: Story = {
  render: () => (
    <div className="wa-cluster">
      {pillWidths.map((w, i) => (
        <Skeleton
          key={i}
          style={{ width: `${w}px`, height: '28px', borderRadius: '9999px' }}
        />
      ))}
    </div>
  ),
};

/** Tight spacing between items via a smaller `--wa-cluster-space` value. */
export const Dense: Story = {
  render: () => (
    <div
      className="wa-cluster"
      style={
        { '--wa-cluster-space': 'var(--wa-space-2xs)' } as React.CSSProperties
      }
    >
      {pillWidths.map((w, i) => (
        <Skeleton
          key={i}
          style={{ width: `${w}px`, height: '28px', borderRadius: '9999px' }}
        />
      ))}
    </div>
  ),
};

/** Realistic toolbar group with skeleton action buttons. */
export const ActionGroup: Story = {
  render: () => (
    <div className="wa-cluster">
      {[80, 80, 80].map((w, i) => (
        <Skeleton
          key={i}
          style={{ width: `${w}px`, height: '32px', borderRadius: '4px' }}
        />
      ))}
    </div>
  ),
};
