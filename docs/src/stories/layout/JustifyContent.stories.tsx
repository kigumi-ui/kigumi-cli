import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from '@/components/ui';

/**
 * Controls main-axis alignment of flex items.
 *
 * Web Awesome does not ship dedicated `.wa-justify-content-*` utility classes. Use the
 * `justify-content` CSS property inline, or pick a layout primitive that encodes a
 * specific distribution: `.wa-split` uses `justify-content: space-between` and
 * `.wa-cluster` uses `justify-content: flex-start`.
 */
const meta = {
  title: 'Layout/Justify Content',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const justifyValues = [
  { value: 'flex-start', label: 'flex-start (cluster default)' },
  { value: 'center', label: 'center' },
  { value: 'flex-end', label: 'flex-end' },
  { value: 'space-between', label: 'space-between (split default)' },
  { value: 'space-around', label: 'space-around' },
] as const;

/** Demonstrates common `justify-content` values. Use inline `style` or a WA layout primitive
 * (`.wa-split`, `.wa-cluster`) that encodes the required distribution. */
export const Overview: Story = {
  render: () => (
    <div className="wa-stack">
      {justifyValues.map(({ value, label }) => (
        <div key={value}>
          <p
            style={{
              fontSize: 'var(--wa-font-size-xs)',
              color: 'var(--wa-color-text-quiet)',
              fontFamily: 'monospace',
              margin: '0 0 0.25rem',
            }}
          >
            justify-content: {label}
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: value,
              gap: 'var(--wa-space-s)',
              height: '60px',
              border: '1px solid var(--wa-color-surface-border)',
              borderRadius: 'var(--wa-border-radius-m)',
              padding: 'var(--wa-space-s)',
              alignItems: 'center',
            }}
          >
            <Skeleton style={{ width: '60px', height: '32px' }} />
            <Skeleton style={{ width: '60px', height: '32px' }} />
            <Skeleton style={{ width: '60px', height: '32px' }} />
          </div>
        </div>
      ))}
    </div>
  ),
};
