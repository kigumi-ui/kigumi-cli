import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Icon } from '@/components/ui';

const meta = {
  title: 'Display/Icon',
  component: Icon,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text', description: 'Font Awesome icon name' },
    family: {
      control: 'select',
      options: ['classic', 'brands', 'sharp', 'duotone', 'sharp-duotone'],
      description: 'Icon family',
      table: { defaultValue: { summary: 'classic' } },
    },
    variant: {
      control: 'select',
      options: ['thin', 'light', 'regular', 'solid'],
      description: 'Icon weight/style',
      table: { defaultValue: { summary: 'regular' } },
    },
    label: { control: 'text', description: 'Accessibility label' },
    'auto-width': { control: 'boolean' },
    onLoad: { action: 'loaded' },
    onError: { action: 'error' },
  },
  args: {
    name: 'star',
    onLoad: fn(),
    onError: fn(),
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { name: 'star', style: { fontSize: '2rem' } },
};

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
