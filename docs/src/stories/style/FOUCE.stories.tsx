import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * The `.wa-cloak` class prevents flash of unstyled custom elements (FOUCE) by hiding elements
 * until the web component registers itself.
 */
const meta = {
  title: 'Style/Reducing FOUCE',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Demonstrates the difference between an element wrapped with `.wa-cloak` and one without.
 * In production, `.wa-cloak` causes the element to briefly fade out until defined, preventing
 * a flash of unstyled content. */
export const CloakDemo: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      <div>
        <p
          style={{
            marginBottom: '0.5rem',
            fontSize: 'var(--wa-font-size-s)',
            color: 'var(--wa-color-text-quiet)',
          }}
        >
          With <code>.wa-cloak</code>
        </p>
        <div
          className="wa-cloak"
          style={{
            border: '1px solid var(--wa-color-surface-border)',
            borderRadius: 'var(--wa-border-radius-m)',
            padding: '1rem',
            minWidth: '180px',
          }}
        >
          <p style={{ margin: 0 }}>Hidden until defined</p>
        </div>
      </div>
      <div>
        <p
          style={{
            marginBottom: '0.5rem',
            fontSize: 'var(--wa-font-size-s)',
            color: 'var(--wa-color-text-quiet)',
          }}
        >
          Without <code>.wa-cloak</code>
        </p>
        <div
          style={{
            border: '1px solid var(--wa-color-surface-border)',
            borderRadius: 'var(--wa-border-radius-m)',
            padding: '1rem',
            minWidth: '180px',
          }}
        >
          <p style={{ margin: 0 }}>Always visible</p>
        </div>
      </div>
      <p
        style={{
          width: '100%',
          fontSize: 'var(--wa-font-size-s)',
          color: 'var(--wa-color-text-quiet)',
          margin: 0,
        }}
      >
        In production, add <code>.wa-cloak</code> to web component elements.
        They fade in once registered.
      </p>
    </div>
  ),
};
