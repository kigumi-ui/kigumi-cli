import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Typography utility classes for font size, weight, color, and text behavior.
 */
const meta = {
  title: 'Style/Text',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const fontSizes = [
  { cls: 'wa-font-size-xs', label: 'xs' },
  { cls: 'wa-font-size-s', label: 's' },
  { cls: 'wa-font-size-m', label: 'm' },
  { cls: 'wa-font-size-l', label: 'l' },
  { cls: 'wa-font-size-xl', label: 'xl' },
  { cls: 'wa-font-size-2xl', label: '2xl' },
] as const;

/** Font size utilities map directly to `--wa-font-size-*` tokens. */
export const FontSizes: Story = {
  render: () => (
    <div className="wa-stack">
      {fontSizes.map(({ cls, label }) => (
        <div
          key={cls}
          style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}
        >
          <span
            style={{
              fontSize: 'var(--wa-font-size-xs)',
              color: 'var(--wa-color-text-quiet)',
              minWidth: '100px',
              fontFamily: 'monospace',
            }}
          >
            .wa-font-size-{label}
          </span>
          <span className={cls}>The quick brown fox</span>
        </div>
      ))}
    </div>
  ),
};

const fontWeights = [
  { cls: 'wa-font-weight-light', label: 'light' },
  { cls: 'wa-font-weight-normal', label: 'normal' },
  { cls: 'wa-font-weight-semibold', label: 'semibold' },
  { cls: 'wa-font-weight-bold', label: 'bold' },
] as const;

/** Font weight utilities map to `--wa-font-weight-*` tokens. */
export const FontWeights: Story = {
  render: () => (
    <div className="wa-stack">
      {fontWeights.map(({ cls, label }) => (
        <div
          key={cls}
          style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}
        >
          <span
            style={{
              fontSize: 'var(--wa-font-size-xs)',
              color: 'var(--wa-color-text-quiet)',
              minWidth: '120px',
              fontFamily: 'monospace',
            }}
          >
            .wa-font-weight-{label}
          </span>
          <span className={cls}>The quick brown fox</span>
        </div>
      ))}
    </div>
  ),
};

/** Text color utilities that reference semantic color tokens. */
export const TextColors: Story = {
  render: () => (
    <div className="wa-stack">
      <span className="wa-color-text-normal">
        .wa-color-text-normal — Primary body text
      </span>
      <span className="wa-color-text-quiet">
        .wa-color-text-quiet — Secondary / de-emphasized text
      </span>
      <span className="wa-color-text-link">
        .wa-color-text-link — Interactive link text
      </span>
    </div>
  ),
};

/** `.wa-text-truncate` clips overflowing text with an ellipsis. */
export const Truncate: Story = {
  render: () => (
    <div style={{ maxWidth: '400px' }}>
      <p
        style={{
          marginBottom: '0.5rem',
          fontSize: 'var(--wa-font-size-s)',
          color: 'var(--wa-color-text-quiet)',
        }}
      >
        Container is 200px wide:
      </p>
      <div
        className="wa-text-truncate"
        style={{
          width: '200px',
          border: '1px solid var(--wa-color-surface-border)',
          padding: '0.25rem 0.5rem',
          borderRadius: 'var(--wa-border-radius-s)',
        }}
      >
        This sentence is intentionally long to demonstrate text truncation
        behavior.
      </div>
    </div>
  ),
};
