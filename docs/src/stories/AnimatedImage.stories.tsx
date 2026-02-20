import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import {
  AnimatedImage,
  Button,
  type AnimatedImageProps,
} from '@/components/ui';

const meta = {
  title: 'Display/AnimatedImage',
  component: AnimatedImage,
  tags: ['autodocs'],
  argTypes: {
    src: { control: 'text' },
    alt: { control: 'text' },
    play: { control: 'boolean' },
    onLoad: { action: 'load' },
    onError: { action: 'error' },
  },
  args: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Rotating_earth_%28large%29.gif/200px-Rotating_earth_%28large%29.gif',
    alt: 'Rotating Earth',
    play: false,
    onLoad: fn(),
    onError: fn(),
  },
} satisfies Meta<typeof AnimatedImage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Playing: Story = {
  args: { play: true },
};

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
