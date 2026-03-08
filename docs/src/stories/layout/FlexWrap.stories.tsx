import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from '@/components/ui';

/**
 * Controls whether flex items wrap onto multiple lines.
 *
 * Web Awesome does not ship dedicated `.wa-flex-wrap-*` utility classes. Use the `flex-wrap`
 * CSS property directly, or choose a layout primitive that wraps by default:
 * `.wa-cluster` wraps with `flex-wrap: wrap`, and `.wa-grid` wraps via `auto-fit` columns.
 */
const meta = {
  title: 'Layout/Flex Wrap',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const pills = [0, 1, 2, 3, 4, 5] as const;

/** `.wa-cluster` uses `flex-wrap: wrap` by default — items wrap naturally when the container
 * is too narrow to fit them on a single line. */
export const WrapWithCluster: Story = {
  render: () => (
    <div
      style={{
        maxWidth: '300px',
        border: '1px solid var(--wa-color-surface-border)',
        borderRadius: 'var(--wa-border-radius-m)',
        padding: 'var(--wa-space-s)',
      }}
    >
      <div className="wa-cluster">
        {pills.map((i) => (
          <Skeleton
            key={i}
            style={{ width: '80px', height: '28px', borderRadius: '9999px' }}
          />
        ))}
      </div>
    </div>
  ),
};

/** Apply `flex-wrap: nowrap` inline when you need items to stay on one line and scroll. */
export const NoWrapInline: Story = {
  render: () => (
    <div
      style={{
        maxWidth: '300px',
        border: '1px solid var(--wa-color-surface-border)',
        borderRadius: 'var(--wa-border-radius-m)',
        padding: 'var(--wa-space-s)',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 'var(--wa-space-s)',
        }}
      >
        {pills.map((i) => (
          <Skeleton
            key={i}
            style={{
              width: '80px',
              flexShrink: 0,
              height: '28px',
              borderRadius: '9999px',
            }}
          />
        ))}
      </div>
    </div>
  ),
};
