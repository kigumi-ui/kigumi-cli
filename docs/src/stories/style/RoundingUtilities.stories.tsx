import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from '@/components/ui';

/**
 * Apply border radius tokens directly to any element using `.wa-border-radius-*` utility
 * classes.
 */
const meta = {
  title: 'Style/Rounding Utilities',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const radiusClasses = [
  'wa-border-radius-square',
  'wa-border-radius-s',
  'wa-border-radius-m',
  'wa-border-radius-l',
  'wa-border-radius-pill',
  'wa-border-radius-circle',
] as const;

/** Each class applies a different border-radius token. */
export const Scale: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '1.5rem',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
      }}
    >
      {radiusClasses.map((cls) => (
        <div
          key={cls}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <div
            className={cls}
            style={{
              width: '64px',
              height: '64px',
              background: 'var(--wa-color-brand-fill-normal)',
            }}
          />
          <span
            style={{
              fontSize: 'var(--wa-font-size-2xs)',
              color: 'var(--wa-color-text-quiet)',
              textAlign: 'center',
              maxWidth: '80px',
              wordBreak: 'break-word',
            }}
          >
            .{cls}
          </span>
        </div>
      ))}
    </div>
  ),
};

/** `.wa-border-radius-m` applied to a realistic card element. */
export const Applied: Story = {
  render: () => (
    <div
      className="wa-border-radius-m"
      style={{
        border: '1px solid var(--wa-color-surface-border)',
        padding: '1rem',
        maxWidth: '320px',
      }}
    >
      <div className="wa-stack">
        <Skeleton
          style={{
            width: '100%',
            height: '120px',
            borderRadius: 'var(--wa-border-radius-m)',
          }}
        />
        <Skeleton style={{ width: '80%', height: '1rem' }} />
        <Skeleton style={{ width: '60%', height: '1rem' }} />
      </div>
    </div>
  ),
};
