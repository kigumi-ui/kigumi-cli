import type { Meta, StoryObj } from '@storybook/react-vite';
import { CarouselItem, Carousel } from '@/components/ui';

/**
 * Carousel Item is a single slide within a Carousel component. It acts as a content
 * container and can hold images, cards, or arbitrary markup. Items are identified by
 * their position and can carry an `aria-label` for accessibility.
 */
const meta = {
  title: 'Components/Carousel Item',
  component: CarouselItem,
  tags: ['autodocs'],
} satisfies Meta<typeof CarouselItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A single carousel item with placeholder text content. */
export const Default: Story = {
  render: (args) => (
    <Carousel>
      <CarouselItem {...args}>
        <div
          style={{
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--wa-color-brand-100)',
            fontSize: '1.5rem',
            fontWeight: 600,
          }}
        >
          Slide 1
        </div>
      </CarouselItem>
      <CarouselItem>
        <div
          style={{
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--wa-color-success-100)',
            fontSize: '1.5rem',
            fontWeight: 600,
          }}
        >
          Slide 2
        </div>
      </CarouselItem>
      <CarouselItem>
        <div
          style={{
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--wa-color-warning-100)',
            fontSize: '1.5rem',
            fontWeight: 600,
          }}
        >
          Slide 3
        </div>
      </CarouselItem>
    </Carousel>
  ),
};

/** Items containing full-bleed images. */
export const WithImages: Story = {
  render: () => (
    <Carousel pagination navigation>
      {[
        'https://picsum.photos/600/300?random=1',
        'https://picsum.photos/600/300?random=2',
        'https://picsum.photos/600/300?random=3',
        'https://picsum.photos/600/300?random=4',
      ].map((src, i) => (
        <CarouselItem key={i}>
          <img
            src={src}
            alt={`Slide ${i + 1}`}
            style={{
              width: '100%',
              height: '250px',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </CarouselItem>
      ))}
    </Carousel>
  ),
};

/** Items that wrap Card components for a rich slide layout. */
export const WithCards: Story = {
  render: () => (
    <Carousel slides-per-page={3} pagination>
      {[
        'Feature A',
        'Feature B',
        'Feature C',
        'Feature D',
        'Feature E',
        'Feature F',
      ].map((label, i) => (
        <CarouselItem key={i}>
          <div
            style={{
              margin: '0.5rem',
              padding: '1.5rem',
              border: '1px solid var(--wa-color-neutral-200)',
              borderRadius: '0.75rem',
              textAlign: 'center',
              minHeight: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
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
        style={{ '--aspect-ratio': '16/9', maxWidth: '600px' }}
      >
        <CarouselItem>
          <div
            style={{
              background: 'var(--wa-color-brand-fill-loud)',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '2rem',
            }}
          >
            Slide 1
          </div>
        </CarouselItem>
        <CarouselItem>
          <div
            style={{
              background: 'var(--wa-color-success-fill-loud)',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '2rem',
            }}
          >
            Slide 2
          </div>
        </CarouselItem>
        <CarouselItem>
          <div
            style={{
              background: 'var(--wa-color-warning-fill-loud)',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '2rem',
            }}
          >
            Slide 3
          </div>
        </CarouselItem>
      </Carousel>
    </div>
  ),
};
