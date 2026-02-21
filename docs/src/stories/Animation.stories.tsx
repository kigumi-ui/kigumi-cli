import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { Animation, Button, Badge } from '@/components/ui';

/**
 * Animation wraps any element and plays a named keyframe animation from the Web Animations API.
 * Choose from dozens of built-in presets (fade, bounce, spin, slide, etc.) or supply custom
 * keyframes. Control duration, delay, easing, iteration count, and direction — all without
 * writing a single line of CSS.
 */
const meta = {
  title: 'Components/Animation',
  component: Animation,
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'select',
      options: [
        'bounce',
        'flash',
        'pulse',
        'rubberBand',
        'shakeX',
        'shakeY',
        'headShake',
        'swing',
        'tada',
        'wobble',
        'jello',
        'heartBeat',
        'fadeIn',
        'fadeOut',
        'slideInDown',
        'slideInLeft',
        'slideInRight',
        'slideInUp',
        'zoomIn',
        'zoomOut',
        'rotateIn',
        'rotateOut',
        'flipInX',
        'flipInY',
      ],
    },
    play: { control: 'boolean' },
    duration: { control: 'number' },
    iterations: { control: 'number' },
    delay: { control: 'number' },
    direction: {
      control: 'select',
      options: ['normal', 'reverse', 'alternate', 'alternate-reverse'],
    },
    fill: {
      control: 'select',
      options: ['auto', 'backwards', 'both', 'forwards', 'none'],
    },
    onStart: { action: 'start' },
    onFinish: { action: 'finish' },
    onCancel: { action: 'cancel' },
  },
  args: {
    name: 'bounce',
    play: false,
    duration: 1000,
    iterations: 1,
    onStart: fn(),
    onFinish: fn(),
    onCancel: fn(),
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
            args.onFinish?.(new CustomEvent('wa-finish'));
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

/** Static snapshot for visual regression testing. */
export const ChromaticOnly: Story = {
  // tags: ['!dev', '!autodocs'],
  parameters: { chromatic: { delay: 500, pauseAnimationAtEnd: true } },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        padding: '1.5rem',
      }}
    >
      <Animation name="bounce" duration={2000} iterations={Infinity}>
        <Badge variant="brand">Bouncing</Badge>
      </Animation>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {[
          'bounce',
          'fade-in',
          'flip',
          'heart-beat',
          'jello',
          'pulse',
          'rubber-band',
          'shake-x',
          'tada',
          'zoom-in',
        ].map((name) => (
          <Animation
            key={name}
            name={name}
            duration={2000}
            iterations={Infinity}
          >
            <Button size="small">{name}</Button>
          </Animation>
        ))}
      </div>
    </div>
  ),
};
