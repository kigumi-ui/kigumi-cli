import type { Meta, StoryObj } from '@storybook/react-vite';
import { Markdown } from '@/components/ui/Markdown/Markdown';

/** Renders markdown content as plain HTML using the Web Awesome markdown parser */
const meta = {
  title: 'Components/Markdown',
  component: Markdown,
  tags: ['autodocs', 'beta'],
  argTypes: {
    'tab-size': {
      control: 'number',
      description: 'Tab stop width for whitespace normalization',
      table: { defaultValue: { summary: '4' } },
    },
  },
} satisfies Meta<typeof Markdown>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Renders a markdown document from an inline script tag. */
export const Default: Story = {
  render: (args) => (
    <Markdown {...args}>
      <script type="text/markdown">{`# Hello, Markdown

Web Awesome's \`wa-markdown\` component renders markdown content as plain HTML.

## Features

- Renders **bold** and *italic* text
- Supports \`inline code\` and code blocks
- Renders [links](https://webawesome.com) and lists
- Handles headings, blockquotes, and more

> Markdown is a lightweight markup language for creating formatted text.

\`\`\`js
const greeting = 'Hello, World!';
console.log(greeting);
\`\`\`
`}</script>
    </Markdown>
  ),
};

/** Demonstrates custom tab stop width for whitespace-sensitive content. */
export const CustomTabSize: Story = {
  args: { 'tab-size': 2 },
  render: (args) => (
    <Markdown {...args}>
      <script type="text/markdown">{`## Custom Tab Size

This story uses a \`tab-size\` of 2 instead of the default 4.

\`\`\`
	Indented with a tab character
\`\`\`
`}</script>
    </Markdown>
  ),
};

/** Static snapshot for visual regression testing. */
export const ChromaticOnly: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: {
    chromatic: { disableSnapshot: false, pauseAnimationAtEnd: true },
  },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        padding: '1.5rem',
      }}
    >
      <Markdown>
        <script type="text/markdown">{`# Heading 1

Some **bold** and *italic* text with a [link](https://webawesome.com).

- Item one
- Item two
- Item three
`}</script>
      </Markdown>
    </div>
  ),
};
