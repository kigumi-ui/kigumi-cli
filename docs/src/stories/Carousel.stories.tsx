import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Carousel, CarouselItem } from '@/components/ui';

/** Displays an arbitrary number of content slides along a horizontal or vertical axis */
const meta = {
  title: 'Components/Carousel',
  component: Carousel,
  tags: ['autodocs', 'experimental'],
  argTypes: {
    autoplay: {
      control: 'boolean',
      description: "Automatically scrolls slides when user isn't interacting",
      table: { defaultValue: { summary: 'false' } },
    },
    'autoplay-interval': {
      control: 'number',
      description: 'Milliseconds between automatic scrolls',
      table: { defaultValue: { summary: '3000' } },
    },
    loop: {
      control: 'boolean',
      description: 'Allows infinite navigation in same direction',
      table: { defaultValue: { summary: 'false' } },
    },
    'mouse-dragging': {
      control: 'boolean',
      description: 'Enables dragging slides with mouse',
      table: { defaultValue: { summary: 'false' } },
    },
    navigation: {
      control: 'boolean',
      description: 'Shows previous/next buttons',
      table: { defaultValue: { summary: 'false' } },
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Carousel layout direction',
      table: { defaultValue: { summary: 'horizontal' } },
    },
    pagination: {
      control: 'boolean',
      description: 'Shows slide indicator dots',
      table: { defaultValue: { summary: 'false' } },
    },
    'slides-per-move': {
      control: 'number',
      description: 'Number of slides to advance per scroll',
      table: { defaultValue: { summary: '1' } },
    },
    'slides-per-page': {
      control: 'number',
      description: 'Number of slides visible at once',
      table: { defaultValue: { summary: '1' } },
    },
    onSlideChange: {
      action: 'slide-change',
      description: 'Emitted when the active slide changes.',
      table: { category: 'Events' },
    },
  },
  args: {
    onSlideChange: fn(),
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const SLIDES = [
  { bg: 'var(--wa-color-brand-fill-loud)', label: 'Slide 1' },
  { bg: 'var(--wa-color-success-fill-loud)', label: 'Slide 2' },
  { bg: 'var(--wa-color-warning-fill-loud)', label: 'Slide 3' },
  { bg: 'var(--wa-color-danger-fill-loud)', label: 'Slide 4' },
];

/** A carousel with three slides and default navigation controls. */
export const Default: Story = {
  args: { navigation: true, pagination: true },
  render: (args) => (
    <Carousel {...args} style={{ maxWidth: '500px' }}>
      {SLIDES.map(({ bg, label }) => (
        <CarouselItem key={label}>
          <div
            style={{
              background: bg,
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: 700,
            }}
          >
            {label}
          </div>
        </CarouselItem>
      ))}
    </Carousel>
  ),
};

/** Shows image slides with cover-fit photos. */
export const WithImages: Story = {
  args: { navigation: true, pagination: true, loop: true },
  render: (args) => (
    <Carousel {...args} style={{ maxWidth: '500px' }}>
      {[1, 2, 3, 4].map((n) => (
        <CarouselItem key={n}>
          <img
            src={`https://picsum.photos/500/250?random=${n}`}
            alt={`Slide ${n}`}
            style={{ width: '100%', display: 'block', objectFit: 'cover' }}
          />
        </CarouselItem>
      ))}
    </Carousel>
  ),
};

/** Displays more than one slide at a time using the slides-per-page prop. */
export const MultiplePerPage: Story = {
  args: { navigation: true, 'slides-per-page': 2, 'slides-per-move': 1 },
  render: (args) => (
    <Carousel {...args} style={{ maxWidth: '600px' }}>
      {SLIDES.map(({ bg, label }) => (
        <CarouselItem key={label}>
          <div
            style={{
              background: bg,
              height: '150px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              margin: '0 0.25rem',
            }}
          >
            {label}
          </div>
        </CarouselItem>
      ))}
    </Carousel>
  ),
};

/** Advances slides automatically on a set interval. */
export const Autoplay: Story = {
  args: {
    autoplay: true,
    'autoplay-interval': 2000,
    loop: true,
    pagination: true,
  },
  render: (args) => (
    <Carousel {...args} style={{ maxWidth: '500px' }}>
      {SLIDES.map(({ bg, label }) => (
        <CarouselItem key={label}>
          <div
            style={{
              background: bg,
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: 700,
            }}
          >
            {label}
          </div>
        </CarouselItem>
      ))}
    </Carousel>
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
      <Carousel
        navigation
        pagination
        style={{ '--aspect-ratio': '16/9', maxWidth: '600px' }}
      >
        {[
          'photo-1559209172-0ff8f6d49ff7',
          'photo-1506905925346-21bda4d32df4',
          'photo-1476514525535-07fb3b4ae5f1',
        ].map((id, i) => (
          <CarouselItem key={id}>
            <img
              src={`https://images.unsplash.com/${id}?w=600&h=338&fit=crop`}
              alt={`Slide ${i + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </CarouselItem>
        ))}
      </Carousel>
    </div>
  ),
};
