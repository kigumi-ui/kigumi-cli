import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Carousel, CarouselItem } from '@/components/ui';

const meta = {
  title: 'Display/Carousel',
  component: Carousel,
  tags: ['autodocs'],
  argTypes: {
    autoplay: { control: 'boolean' },
    'autoplay-interval': {
      control: 'number',
      table: { defaultValue: { summary: '3000' } },
    },
    loop: { control: 'boolean' },
    navigation: { control: 'boolean', description: 'Shows prev/next arrows' },
    pagination: { control: 'boolean', description: 'Shows dot indicators' },
    'mouse-dragging': { control: 'boolean' },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      table: { defaultValue: { summary: 'horizontal' } },
    },
    'slides-per-page': {
      control: 'number',
      table: { defaultValue: { summary: '1' } },
    },
    'slides-per-move': {
      control: 'number',
      table: { defaultValue: { summary: '1' } },
    },
    onSlideChange: { action: 'slide-change' },
  },
  args: { onSlideChange: fn() },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const SLIDES = [
  { bg: 'var(--wa-color-brand-fill-loud)', label: 'Slide 1' },
  { bg: 'var(--wa-color-success-fill-loud)', label: 'Slide 2' },
  { bg: 'var(--wa-color-warning-fill-loud)', label: 'Slide 3' },
  { bg: 'var(--wa-color-danger-fill-loud)', label: 'Slide 4' },
];

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
