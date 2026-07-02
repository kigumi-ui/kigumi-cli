import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { Animation, Button, Badge } from '@/components/ui';

/**
 * Animate elements declaratively with nearly 100 baked-in presets, or roll your own with
 * custom keyframes
 */
const meta = {
  title: 'Components/Animation',
  component: Animation,
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'The name of the built-in animation to use',
      table: { defaultValue: { summary: 'none' } },
    },
    play: {
      control: 'boolean',
      description:
        'Plays the animation. When omitted, the animation will be paused',
      table: { defaultValue: { summary: 'false' } },
    },
    delay: {
      control: 'number',
      description:
        'The number of milliseconds to delay the start of the animation',
      table: { defaultValue: { summary: '0' } },
    },
    direction: {
      control: 'select',
      options: ['normal', 'reverse', 'alternate', 'alternate-reverse'],
      description: 'Determines the direction of playback',
      table: { defaultValue: { summary: 'normal' } },
    },
    duration: {
      control: 'number',
      description:
        'The number of milliseconds each iteration takes to complete',
      table: { defaultValue: { summary: '1000' } },
    },
    easing: {
      control: 'text',
      description: 'The easing function to use',
      table: { defaultValue: { summary: 'linear' } },
    },
    'end-delay': {
      control: 'number',
      description:
        'The number of milliseconds to delay after the active period',
      table: { defaultValue: { summary: '0' } },
    },
    fill: {
      control: 'select',
      options: ['auto', 'backwards', 'both', 'forwards', 'none'],
      description:
        'Sets how the animation applies styles before and after execution',
      table: { defaultValue: { summary: 'auto' } },
    },
    iterations: {
      control: 'number',
      description: 'The number of iterations to run before completing',
      table: { defaultValue: { summary: 'Infinity' } },
    },
    'iteration-start': {
      control: 'number',
      description: 'The offset at which to start the animation',
      table: { defaultValue: { summary: '0' } },
    },
    'playback-rate': {
      control: 'number',
      description: "Sets the animation's playback rate",
      table: { defaultValue: { summary: '1' } },
    },
    onCancel: {
      action: 'cancel',
      description: 'Emitted when the animation is canceled.',
      table: { category: 'Events' },
    },
    onFinish: {
      action: 'finish',
      description: 'Emitted when the animation finishes.',
      table: { category: 'Events' },
    },
    onStart: {
      action: 'start',
      description: 'Emitted when the animation starts or restarts.',
      table: { category: 'Events' },
    },
  },
  args: {
    onCancel: fn(),
    onFinish: fn(),
    onStart: fn(),
  },
} satisfies Meta<typeof Animation>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Plays the default "bounce" animation on the wrapped element. */
export const Default: Story = {
  render: (args) => {
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
        <Animation
          {...args}
          play={play}
          onFinish={() => {
            args.onFinish?.(new CustomEvent('finish'));
            setPlay(false);
          }}
        >
          <Badge
            variant="brand"
            style={{ fontSize: '2rem', padding: '1rem 2rem' }}
          >
            Animated!
          </Badge>
        </Animation>
        <Button onClick={() => setPlay(true)}>Play</Button>
      </div>
    );
  },
};

/** Demonstrates the pulse animation preset. */
export const Pulse: Story = {
  args: { name: 'pulse', iterations: Infinity, play: true },
  render: (args) => (
    <Animation {...args}>
      <Badge variant="danger">Live</Badge>
    </Animation>
  ),
};

/** Fades the element in from transparent on load. */
export const FadeIn: Story = {
  args: { name: 'fadeIn', play: true, duration: 800 },
  render: (args) => {
    const [key, setKey] = useState(0);
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          alignItems: 'flex-start',
        }}
      >
        <Animation key={key} {...args}>
          <div
            style={{
              padding: '1rem 2rem',
              background: 'var(--wa-color-brand-100)',
              borderRadius: '0.5rem',
            }}
          >
            Fading in...
          </div>
        </Animation>
        <Button onClick={() => setKey((k) => k + 1)}>Replay</Button>
      </div>
    );
  },
};

/** Renders a grid of common presets side-by-side for quick comparison. */
export const AnimationShowcase: Story = {
  render: () => {
    const animations = [
      'bounce',
      'flash',
      'pulse',
      'rubber-band',
      'shake-x',
      'heartbeat',
      'fadeIn',
      'zoomIn',
    ];
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {animations.map((name) => (
          <Animation key={name} name={name} play iterations={1} duration={1000}>
            <Badge style={{ cursor: 'pointer' }}>{name}</Badge>
          </Animation>
        ))}
      </div>
    );
  },
};
