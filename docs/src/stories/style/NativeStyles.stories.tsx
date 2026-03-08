import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * When `utilities.css` is imported, Web Awesome applies opinionated resets to native HTML
 * elements via `@layer wa-native`.
 */
const meta = {
  title: 'Style/Native Styles',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Native heading elements styled via `--wa-font-family-heading`. */
export const Headings: Story = {
  render: () => (
    <div>
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <h3>Heading 3</h3>
      <h4>Heading 4</h4>
    </div>
  ),
};

/** Native inline elements receive WA-consistent styling automatically. */
export const InlineElements: Story = {
  render: () => (
    <p>
      This paragraph contains <strong>bold text</strong>, <em>italic text</em>,{' '}
      <code>inline code</code>, <a href="#">a link</a>, and{' '}
      <mark>highlighted text</mark>.
    </p>
  ),
};

/** Ordered and unordered lists with default WA list styling. */
export const Lists: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <ul>
        <li>Unordered item one</li>
        <li>Unordered item two</li>
        <li>Unordered item three</li>
      </ul>
      <ol>
        <li>Ordered item one</li>
        <li>Ordered item two</li>
        <li>Ordered item three</li>
      </ol>
    </div>
  ),
};
