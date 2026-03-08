import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from '@/components/ui';

/**
 * Responsive grid that auto-fits columns via `.wa-grid`.
 */
const meta = {
  title: 'Layout/Grid',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default auto-fit grid with six skeleton cards. */
export const Default: Story = {
  render: () => (
    <div className="wa-grid">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="wa-stack">
          <Skeleton style={{ width: '100%', height: '80px' }} />
          <Skeleton style={{ width: '90%', height: '1rem' }} />
          <Skeleton style={{ width: '70%', height: '1rem' }} />
        </div>
      ))}
    </div>
  ),
};

/** Narrower minimum column size forces more columns on wider viewports. */
export const NarrowColumns: Story = {
  render: () => (
    <div
      className="wa-grid"
      style={{ '--wa-grid-min-column-size': '120px' } as React.CSSProperties}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="wa-stack">
          <Skeleton style={{ width: '100%', height: '80px' }} />
          <Skeleton style={{ width: '90%', height: '1rem' }} />
          <Skeleton style={{ width: '70%', height: '1rem' }} />
        </div>
      ))}
    </div>
  ),
};

/** Realistic metric card layout using the grid. */
export const Dashboard: Story = {
  render: () => (
    <div className="wa-grid">
      {[0, 1, 2, 3, 4, 5].map((i) => (
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
              style={{ width: '40px', height: '40px', borderRadius: '50%' }}
            />
            <Skeleton style={{ width: '80%', height: '1rem' }} />
            <Skeleton style={{ width: '60%', height: '1rem' }} />
          </div>
        </div>
      ))}
    </div>
  ),
};
