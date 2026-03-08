import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from '@/components/ui';

/**
 * Divides space evenly between two children via `.wa-split`.
 */
const meta = {
  title: 'Layout/Split',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Equal split between two skeleton cards. */
export const Default: Story = {
  render: () => (
    <div className="wa-split">
      <div className="wa-stack">
        <Skeleton style={{ width: '100%', height: '80px' }} />
        <Skeleton style={{ width: '90%', height: '1rem' }} />
        <Skeleton style={{ width: '70%', height: '1rem' }} />
      </div>
      <div className="wa-stack">
        <Skeleton style={{ width: '100%', height: '80px' }} />
        <Skeleton style={{ width: '90%', height: '1rem' }} />
        <Skeleton style={{ width: '70%', height: '1rem' }} />
      </div>
    </div>
  ),
};

/** Asymmetric 1/3 + 2/3 split. */
export const Asymmetric: Story = {
  render: () => (
    <div
      className="wa-split"
      style={{ '--wa-split-fraction': '1/3' } as React.CSSProperties}
    >
      <div className="wa-stack">
        <Skeleton style={{ width: '100%', height: '80px' }} />
        <Skeleton style={{ width: '90%', height: '1rem' }} />
        <Skeleton style={{ width: '70%', height: '1rem' }} />
      </div>
      <div className="wa-stack">
        <Skeleton style={{ width: '100%', height: '80px' }} />
        <Skeleton style={{ width: '90%', height: '1rem' }} />
        <Skeleton style={{ width: '70%', height: '1rem' }} />
      </div>
    </div>
  ),
};

/** Side-by-side comparison layout representing "before" and "after" states. */
export const SideBySide: Story = {
  render: () => (
    <div className="wa-split">
      <div
        style={{
          border: '1px solid var(--wa-color-surface-border)',
          borderRadius: '6px',
          padding: '1rem',
        }}
      >
        <div className="wa-stack">
          <Skeleton style={{ width: '100%', height: '1rem' }} />
          <Skeleton style={{ width: '90%', height: '1rem' }} />
          <Skeleton style={{ width: '80%', height: '1rem' }} />
        </div>
      </div>
      <div
        style={{
          border: '1px solid var(--wa-color-surface-border)',
          borderRadius: '6px',
          padding: '1rem',
        }}
      >
        <div className="wa-stack">
          <Skeleton style={{ width: '100%', height: '1rem' }} />
          <Skeleton style={{ width: '90%', height: '1rem' }} />
          <Skeleton style={{ width: '80%', height: '1rem' }} />
        </div>
      </div>
    </div>
  ),
};
