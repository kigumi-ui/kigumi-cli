import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from '@/components/ui';

/**
 * Applies consistent spacing between flex or grid children using space tokens via `.wa-gap-*`.
 *
 * Note: `.wa-gap-*` classes also set `display: flex` on the container (see `gap.css`).
 */
const meta = {
  title: 'Layout/Gap',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const gapSizes = [
  { cls: 'wa-gap-0', label: 'wa-gap-0', approx: '0px' },
  { cls: 'wa-gap-3xs', label: 'wa-gap-3xs', approx: '~2px' },
  { cls: 'wa-gap-2xs', label: 'wa-gap-2xs', approx: '~4px' },
  { cls: 'wa-gap-xs', label: 'wa-gap-xs', approx: '~8px' },
  { cls: 'wa-gap-s', label: 'wa-gap-s', approx: '~12px' },
  { cls: 'wa-gap-m', label: 'wa-gap-m', approx: '~16px' },
  { cls: 'wa-gap-l', label: 'wa-gap-l', approx: '~24px' },
  { cls: 'wa-gap-xl', label: 'wa-gap-xl', approx: '~32px' },
  { cls: 'wa-gap-2xl', label: 'wa-gap-2xl', approx: '~40px' },
  { cls: 'wa-gap-3xl', label: 'wa-gap-3xl', approx: '~48px' },
] as const;

/** Each `.wa-gap-*` class applies a `gap` value from the `--wa-space-*` token scale.
 * These classes also implicitly set `display: flex`. */
export const Scale: Story = {
  render: () => (
    <div className="wa-stack">
      {gapSizes.map(({ cls, label, approx }) => (
        <div
          key={cls}
          style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
        >
          <span
            style={{
              fontSize: 'var(--wa-font-size-xs)',
              color: 'var(--wa-color-text-quiet)',
              fontFamily: 'monospace',
              minWidth: '120px',
            }}
          >
            .{label} <span style={{ opacity: 0.6 }}>({approx})</span>
          </span>
          <div className={cls}>
            <Skeleton style={{ width: '48px', height: '32px' }} />
            <Skeleton style={{ width: '48px', height: '32px' }} />
            <Skeleton style={{ width: '48px', height: '32px' }} />
          </div>
        </div>
      ))}
    </div>
  ),
};
