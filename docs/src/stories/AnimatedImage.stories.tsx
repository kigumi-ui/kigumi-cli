import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import {
  AnimatedImage,
  Button,
  type AnimatedImageProps,
} from '@/components/ui';

/** A component for displaying animated GIFs and WEBPs that play and pause on interaction */
const meta = {
  title: 'Components/Animated Image',
  component: AnimatedImage,
  tags: ['autodocs'],
  argTypes: {
    src: { control: 'text', description: 'The path to the image to load' },
    alt: {
      control: 'text',
      description: 'A description of the image used by assistive devices',
    },
    play: {
      control: 'boolean',
      description:
        'Plays the animation. When this attribute is removed, the animation will pause',
      table: { defaultValue: { summary: 'false' } },
    },
    onLoad: {
      action: 'load',
      description: 'Emitted when the image loads successfully.',
      table: { category: 'Events' },
    },
    onError: {
      action: 'error',
      description: 'Emitted when the image fails to load.',
      table: { category: 'Events' },
    },
    'slot:play-icon': {
      control: false,
      description:
        'Optional play icon to use instead of the default. Works best with `<wa-icon>`.',
      table: { category: 'Slots' },
    },
    'slot:pause-icon': {
      control: false,
      description:
        'Optional pause icon to use instead of the default. Works best with `<wa-icon>`.',
      table: { category: 'Slots' },
    },
  },
  args: {
    onLoad: fn(),
    onError: fn(),
  },
} satisfies Meta<typeof AnimatedImage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Shows an animated image with default playback controls. */
export const Default: Story = {};

/** Starts the animation in the playing state on load. */
export const Playing: Story = {
  args: { play: true },
};

/** Demonstrates external control of play/pause state via the `play` prop. */
export const Controlled: Story = {
  render: (args: AnimatedImageProps) => {
    const [play, setPlay] = useState(false);
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          alignItems: 'flex-start',
        }}
      >
        <AnimatedImage {...args} play={play} />
        <Button onClick={() => setPlay((p) => !p)}>
          {play ? 'Pause' : 'Play'}
        </Button>
      </div>
    );
  },
};

/** Static snapshot for visual regression testing. */
export const ChromaticOnly: Story = {
  // tags: ['!dev', '!autodocs'],
  parameters: { chromatic: { delay: 300, pauseAnimationAtEnd: true } },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        padding: '1.5rem',
      }}
    >
      <AnimatedImage
        src="https://shoelace.style/assets/images/walk.gif"
        alt="Walking animation"
        style={{ width: 100 }}
        play
      />
      <AnimatedImage
        src="https://shoelace.style/assets/images/walk.gif"
        alt="Paused"
        style={{ width: 100 }}
      />
    </div>
  ),
};
