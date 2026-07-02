import { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, RandomContent, type RandomContentRef } from '@/components/ui';
import { fn } from 'storybook/test';

/** Randomly selects and displays one or more of its child elements */
const meta = {
  title: 'Components/RandomContent',
  component: RandomContent,
  tags: ['autodocs'],
  argTypes: {
    items: {
      control: 'number',
      description: 'The number of items to display at once',
      table: { defaultValue: { summary: '1' } },
    },
    mode: {
      control: 'select',
      options: ['random', 'unique', 'sequence'],
      description: 'How items are picked on each randomization',
      table: { defaultValue: { summary: 'unique' } },
    },
    autoplay: {
      control: 'boolean',
      description:
        'Automatically randomizes the displayed items on an interval',
      table: { defaultValue: { summary: 'false' } },
    },
    'autoplay-interval': {
      control: 'number',
      description:
        'The number of milliseconds between randomizations when autoplay is enabled',
      table: { defaultValue: { summary: '3000' } },
    },
    animation: {
      control: 'select',
      options: [
        'none',
        'fade',
        'fade-up',
        'fade-down',
        'fade-left',
        'fade-right',
      ],
      description: 'The animation to apply when displayed items change',
      table: { defaultValue: { summary: 'none' } },
    },
    onContentChange: {
      action: 'content-change',
      description:
        'Emitted whenever the displayed selection changes, including on first render, on `randomize()`, and on each autoplay tick.',
      table: { category: 'Events' },
    },
  },
  args: {
    onContentChange: fn(),
  },
} satisfies Meta<typeof RandomContent>;

export default meta;
type Story = StoryObj<typeof meta>;

const tips = [
  'You can theme every component with --wa-* custom properties.',
  'CSS parts are the public styling API for shadow DOM internals.',
  'Kigumi copies wrappers into your project, so you own the code.',
  'Semantic tokens should reference other semantic tokens.',
];

/** Shows one randomly chosen child on each mount. */
export const Default: Story = {
  render: (args) => (
    <RandomContent {...args}>
      {tips.map((tip) => (
        <p key={tip}>{tip}</p>
      ))}
    </RandomContent>
  ),
};

/** Rotates through the children automatically with a fade animation. */
export const Autoplay: Story = {
  args: { autoplay: true, 'autoplay-interval': 2000, animation: 'fade' },
  render: (args) => (
    <RandomContent {...args}>
      {tips.map((tip) => (
        <p key={tip}>{tip}</p>
      ))}
    </RandomContent>
  ),
};

/** Steps through the children in order instead of picking randomly. */
export const Sequence: Story = {
  args: { mode: 'sequence', autoplay: true, animation: 'fade-up' },
  render: (args) => (
    <RandomContent {...args}>
      {tips.map((tip) => (
        <p key={tip}>{tip}</p>
      ))}
    </RandomContent>
  ),
};

/** Displays two children at once. */
export const MultipleItems: Story = {
  args: { items: 2 },
  render: (args) => (
    <RandomContent {...args}>
      {tips.map((tip) => (
        <p key={tip}>{tip}</p>
      ))}
    </RandomContent>
  ),
};

/** Triggers a new selection imperatively via the randomize() ref method. */
export const ManualRandomize: Story = {
  render: () => {
    const ref = useRef<RandomContentRef>(null);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <RandomContent ref={ref} animation="fade">
          {tips.map((tip) => (
            <p key={tip}>{tip}</p>
          ))}
        </RandomContent>
        <Button onClick={() => ref.current?.randomize()}>Shuffle</Button>
      </div>
    );
  },
};
