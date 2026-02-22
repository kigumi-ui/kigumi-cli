import type { Meta, StoryObj } from '@storybook/react-vite';
import { Comparison } from '@/components/ui';

/**
 * Comparison renders two images overlaid with a draggable divider so users can slide
 * between a "before" and "after" view. Useful for showcasing design changes, photo edits,
 * or any two-state visual comparison. The divider position can be set programmatically via
 * the `position` prop.
 */
const meta = {
  title: 'Components/Comparison',
  component: Comparison,
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Initial divider position (0 to 100)',
      table: { defaultValue: { summary: '50' } },
    },
  },
  args: { position: 50 },
} satisfies Meta<typeof Comparison>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A before/after comparison with a centered starting position. */
export const Default: Story = {
  render: (args) => (
    <Comparison {...args} style={{ maxWidth: '600px' }}>
      <img
        slot="before"
        src="https://picsum.photos/600/300?grayscale"
        alt="Before: grayscale"
        style={{ width: '100%', display: 'block' }}
      />
      <img
        slot="after"
        src="https://picsum.photos/600/300"
        alt="After: color"
        style={{ width: '100%', display: 'block' }}
      />
    </Comparison>
  ),
};

/** Sets the initial divider position to 25 % to emphasize the "after" side. */
export const StartPosition: Story = {
  args: { position: 25 },
  render: (args) => (
    <Comparison {...args} style={{ maxWidth: '600px' }}>
      <img
        slot="before"
        src="https://picsum.photos/600/300?grayscale"
        alt="Before"
        style={{ width: '100%', display: 'block' }}
      />
      <img
        slot="after"
        src="https://picsum.photos/600/300"
        alt="After"
        style={{ width: '100%', display: 'block' }}
      />
    </Comparison>
  ),
};

/** Static snapshot for visual regression testing. */
export const ChromaticOnly: Story = {
  // tags: ['!dev', '!autodocs'],
  parameters: { chromatic: { pauseAnimationAtEnd: true } },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        padding: '1.5rem',
      }}
    >
      <Comparison style={{ maxWidth: '600px' }}>
        <img
          slot="before"
          src="https://images.unsplash.com/photo-1547082299-de196ea013d6?w=600&h=400&fit=crop"
          alt="Before"
        />
        <img
          slot="after"
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop"
          alt="After"
        />
      </Comparison>
    </div>
  ),
};
