import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from '@/components/ui';

/**
 * Places sidebar content on the left and main content on the right via `.wa-flank`.
 */
const meta = {
  title: 'Layout/Flank',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Basic flank layout with a narrow sidebar and wide main area. */
export const Default: Story = {
  render: () => (
    <div className="wa-flank">
      <div>
        <Skeleton style={{ width: '140px', height: '1.25rem' }} />
      </div>
      <div style={{ flex: 1 }}>
        <Skeleton style={{ width: '100%', height: '1rem' }} />
      </div>
    </div>
  ),
};

/** Realistic page header with title + subtitle on the left and action buttons on the right. */
export const PageHeader: Story = {
  render: () => (
    <div className="wa-flank">
      <div className="wa-stack">
        <Skeleton style={{ width: '180px', height: '1.5rem' }} />
        <Skeleton style={{ width: '140px', height: '1rem' }} />
      </div>
      <div className="wa-cluster">
        <Skeleton
          style={{ width: '80px', height: '32px', borderRadius: '4px' }}
        />
        <Skeleton
          style={{ width: '80px', height: '32px', borderRadius: '4px' }}
        />
        <Skeleton
          style={{ width: '80px', height: '32px', borderRadius: '4px' }}
        />
      </div>
    </div>
  ),
};
