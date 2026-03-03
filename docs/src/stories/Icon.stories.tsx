import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Icon } from '@/components/ui';

/** Icons are symbols that can be used to represent various options within an application */
const meta = {
  title: 'Components/Icon',
  component: Icon,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text', description: 'The name of the icon to draw' },
    library: {
      control: 'text',
      description: 'The name of a registered custom icon library',
      table: { defaultValue: { summary: 'default' } },
    },
    src: { control: 'text', description: 'An external URL of an SVG file' },
    label: {
      control: 'text',
      description: 'An alternate description for assistive devices',
    },
    family: {
      control: 'text',
      description:
        'The family of icons (classic, brands, sharp, duotone, sharp-duotone)',
    },
    variant: {
      control: 'text',
      description: "The icon's variant (thin, light, regular, solid)",
    },
    'auto-width': {
      control: 'boolean',
      description: 'Sets the width to match the cropped SVG viewBox',
      table: { defaultValue: { summary: 'false' } },
    },
    'swap-opacity': {
      control: 'boolean',
      description: 'Swaps the opacity of duotone icons',
      table: { defaultValue: { summary: 'false' } },
    },
    rotate: {
      control: 'number',
      description: 'Rotate the icon by this many degrees',
    },
    flip: {
      control: 'select',
      options: ['horizontal', 'vertical', 'both'],
      description: 'Flip the icon horizontally, vertically, or both',
    },
    animation: {
      control: 'text',
      description: 'The name of a built-in animation to apply',
    },
    onLoad: {
      action: 'load',
      description:
        'Emitted when the icon has loaded. When using `spriteSheet: true` this will not emit.',
      table: { category: 'Events' },
    },
    onError: {
      action: 'error',
      description:
        'Emitted when the icon fails to load due to an error. When using `spriteSheet: true` this will not emit.',
      table: { category: 'Events' },
    },
  },
  args: {
    onLoad: fn(),
    onError: fn(),
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A single icon rendered at the default (inherited) size. */
export const Default: Story = {
  args: { name: 'star', style: { fontSize: '2rem' } },
};

/** Shows regular, solid, and brand icon style variants. */
export const Variants: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '1.5rem',
        alignItems: 'center',
        fontSize: '2rem',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <Icon name="heart" variant="thin" />
        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>thin</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icon name="heart" variant="light" />
        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>light</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icon name="heart" variant="regular" />
        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>regular</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icon name="heart" variant="solid" />
        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>solid</div>
      </div>
    </div>
  ),
};

/** A gallery of frequently used interface icons. */
export const CommonIcons: Story = {
  render: () => {
    const icons = [
      'house',
      'user',
      'envelope',
      'bell',
      'gear',
      'search',
      'plus',
      'xmark',
      'check',
      'trash',
      'pencil',
      'eye',
      'lock',
      'heart',
      'star',
    ];
    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.5rem',
          fontSize: '1.5rem',
        }}
      >
        {icons.map((name) => (
          <div key={name} style={{ textAlign: 'center' }}>
            <Icon name={name} />
            <div
              style={{
                fontSize: '0.625rem',
                marginTop: '0.25rem',
                color: 'var(--wa-color-neutral-text-normal)',
              }}
            >
              {name}
            </div>
          </div>
        ))}
      </div>
    );
  },
};

/** Demonstrates icon size scaling via font-size. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Icon name="star" style={{ fontSize: '1rem' }} />
      <Icon name="star" style={{ fontSize: '1.5rem' }} />
      <Icon name="star" style={{ fontSize: '2rem' }} />
      <Icon name="star" style={{ fontSize: '3rem' }} />
      <Icon name="star" style={{ fontSize: '5rem' }} />
    </div>
  ),
};

/** Shows brand/logo icons such as GitHub and Twitter. */
export const BrandIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '2rem' }}>
      <Icon name="github" family="brands" label="GitHub" />
      <Icon name="twitter" family="brands" label="Twitter" />
      <Icon name="linkedin" family="brands" label="LinkedIn" />
      <Icon name="react" family="brands" label="React" />
    </div>
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
      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center',
          fontSize: '2rem',
        }}
      >
        {(['thin', 'light', 'regular', 'solid'] as const).map((v) => (
          <div key={v} style={{ textAlign: 'center' }}>
            <Icon name="heart" variant={v} />
            <div style={{ fontSize: '0.75rem' }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Icon name="star" style={{ fontSize: '1rem' }} />
        <Icon name="star" style={{ fontSize: '1.5rem' }} />
        <Icon name="star" style={{ fontSize: '2rem' }} />
        <Icon name="star" style={{ fontSize: '3rem' }} />
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '2rem' }}>
        <Icon name="github" family="brands" label="GitHub" />
        <Icon name="twitter" family="brands" label="Twitter" />
        <Icon name="react" family="brands" label="React" />
      </div>
    </div>
  ),
};
