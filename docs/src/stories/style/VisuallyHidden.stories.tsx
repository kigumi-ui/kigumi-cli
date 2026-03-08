import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Hide content visually while keeping it accessible to screen readers.
 */
const meta = {
  title: 'Style/Visually Hidden',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The `.wa-visually-hidden` class hides the element from sighted users but keeps it in
 * the accessibility tree. Inspect the DOM to see the hidden span. */
export const Default: Story = {
  render: () => (
    <div className="wa-stack">
      <span className="wa-visually-hidden">Screen reader only text</span>
      <span
        style={{
          color: 'var(--wa-color-text-quiet)',
          fontSize: 'var(--wa-font-size-s)',
        }}
      >
        ↑ Hidden above (screen reader only) — inspect the DOM to confirm it is
        present.
      </span>
    </div>
  ),
};

/** `.wa-visually-hidden` becomes visible when the element or a descendant receives focus,
 * making it suitable for skip-navigation links. */
export const WithFocus: Story = {
  render: () => (
    <div className="wa-stack">
      <p
        style={{
          fontSize: 'var(--wa-font-size-s)',
          color: 'var(--wa-color-text-quiet)',
          margin: 0,
        }}
      >
        Tab into this story to reveal the skip link:
      </p>
      <a
        href="#"
        className="wa-visually-hidden"
        style={{ display: 'inline-block' }}
        onClick={(e) => e.preventDefault()}
      >
        Skip to main content
      </a>
      <p
        style={{
          fontSize: 'var(--wa-font-size-s)',
          color: 'var(--wa-color-text-quiet)',
          margin: 0,
        }}
      >
        The link above is hidden until focused. It becomes visible on keyboard
        focus, enabling keyboard-only users to skip repetitive navigation.
      </p>
    </div>
  ),
};
