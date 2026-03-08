import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Scoping classes that remap semantic color tokens to a specific hue. Apply to a parent element
 * to change the color theme of all children.
 */
const meta = {
  title: 'Style/Color Variants',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const semanticVariants = [
  'neutral',
  'brand',
  'success',
  'warning',
  'danger',
] as const;

/** Each scoping class remaps `--wa-color-fill-*`, `--wa-color-border-*`, and `--wa-color-on-*`
 * tokens to the matching hue. The inner badge uses the same CSS variables regardless of which
 * variant is active. */
export const Semantic: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      {semanticVariants.map((variant) => (
        <div
          key={variant}
          className={`wa-${variant}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              background: 'var(--wa-color-fill-normal)',
              color: 'var(--wa-color-on-normal)',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--wa-border-radius-m)',
              fontWeight:
                'var(--wa-font-weight-semibold)' as React.CSSProperties['fontWeight'],
              whiteSpace: 'nowrap',
            }}
          >
            {variant}
          </div>
          <span
            style={{
              fontSize: 'var(--wa-font-size-xs)',
              color: 'var(--wa-color-text-quiet)',
            }}
          >
            .wa-{variant}
          </span>
        </div>
      ))}
    </div>
  ),
};

const neutralPalettes = [
  'wa-neutral-gray',
  'wa-neutral-red',
  'wa-neutral-orange',
] as const;

/** Override the neutral hue by combining `.wa-neutral` with a palette modifier. */
export const NeutralPalette: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      {neutralPalettes.map((cls) => (
        <div
          key={cls}
          className={cls}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              background: 'var(--wa-color-neutral-fill-normal)',
              color: 'var(--wa-color-neutral-on-normal)',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--wa-border-radius-m)',
              whiteSpace: 'nowrap',
            }}
          >
            {cls.replace('wa-neutral-', '')}
          </div>
          <span
            style={{
              fontSize: 'var(--wa-font-size-xs)',
              color: 'var(--wa-color-text-quiet)',
            }}
          >
            .{cls}
          </span>
        </div>
      ))}
    </div>
  ),
};
