import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from '@/components/ui';

/**
 * Controls cross-axis alignment within flex layout containers via `.wa-align-items-*` classes.
 */
const meta = {
  title: 'Layout/Align Items',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const alignValues = [
  'wa-align-items-start',
  'wa-align-items-end',
  'wa-align-items-center',
  'wa-align-items-stretch',
  'wa-align-items-baseline',
] as const;

/** Each `.wa-align-items-*` class controls the cross-axis alignment of flex children.
 * The flex items have differing heights to make the alignment visible. */
export const Overview: Story = {
  render: () => (
    <div className="wa-stack">
      {alignValues.map((cls) => (
        <div key={cls}>
          <p
            style={{
              fontSize: 'var(--wa-font-size-xs)',
              color: 'var(--wa-color-text-quiet)',
              fontFamily: 'monospace',
              margin: '0 0 0.25rem',
            }}
          >
            .{cls}
          </p>
          <div
            className={cls}
            style={{
              display: 'flex',
              gap: 'var(--wa-space-s)',
              height: '80px',
              border: '1px solid var(--wa-color-surface-border)',
              borderRadius: 'var(--wa-border-radius-m)',
              padding: 'var(--wa-space-s)',
            }}
          >
            <Skeleton style={{ width: '60px', height: '24px' }} />
            <Skeleton style={{ width: '60px', height: '40px' }} />
            <Skeleton style={{ width: '60px', height: '24px' }} />
          </div>
        </div>
      ))}
    </div>
  ),
};
