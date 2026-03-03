import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Avatar } from '@/components/ui';

/** Avatars are used to represent a person or object */
const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    image: {
      control: 'text',
      description: 'The image source to use for the avatar',
    },
    label: {
      control: 'text',
      description: 'A label to use to describe the avatar to assistive devices',
    },
    initials: {
      control: 'text',
      description: 'Initials to use as a fallback when no image is available',
    },
    loading: {
      control: 'select',
      options: ['eager', 'lazy'],
      description: 'Indicates how the browser should load the image',
      table: { defaultValue: { summary: 'eager' } },
    },
    shape: {
      control: 'select',
      options: ['circle', 'square', 'rounded'],
      description: 'The shape of the avatar',
      table: { defaultValue: { summary: 'circle' } },
    },
    onError: {
      action: 'error',
      description:
        'The image could not be loaded. This may because of an invalid URL, a temporary network condition, or some unknown cause.',
      table: { category: 'Events' },
    },
    'slot:icon': {
      control: false,
      description:
        'The default icon to use when no image or initials are present. Works best with `<wa-icon>`.',
      table: { category: 'Slots' },
    },
  },
  args: {
    onError: fn(),
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Displays an avatar with a photo URL. */
export const WithImage: Story = {
  args: {
    image: 'https://i.pravatar.cc/150?img=1',
    label: 'Jane Doe',
  },
};

/** Shows the initials fallback when no image src is provided. */
export const WithInitials: Story = {
  args: {
    initials: 'JD',
    label: 'Jane Doe',
  },
};

/** Compares the circle (default) and square shape variants. */
export const Shapes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Avatar
        image="https://i.pravatar.cc/150?img=2"
        label="Circle"
        shape="circle"
      />
      <Avatar
        image="https://i.pravatar.cc/150?img=3"
        label="Rounded"
        shape="rounded"
      />
      <Avatar
        image="https://i.pravatar.cc/150?img=4"
        label="Square"
        shape="square"
      />
    </div>
  ),
};

/** Demonstrates automatic fallback to initials when the image src is missing. */
export const InitialsFallback: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Avatar initials="AB" label="Alice Brown" />
      <Avatar initials="JD" label="Jane Doe" />
      <Avatar initials="MK" label="Mark Kim" />
    </div>
  ),
};

/** Shows all built-in sizes from small to extra-large. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Avatar
        image="https://i.pravatar.cc/150?img=5"
        label="Small"
        style={{ fontSize: '1.5rem' }}
      />
      <Avatar
        image="https://i.pravatar.cc/150?img=5"
        label="Medium"
        style={{ fontSize: '2.5rem' }}
      />
      <Avatar
        image="https://i.pravatar.cc/150?img=5"
        label="Large"
        style={{ fontSize: '4rem' }}
      />
    </div>
  ),
};

/** Renders overlapping avatars in a group using negative margin. */
export const Group: Story = {
  render: () => (
    <div style={{ display: 'flex' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Avatar
          key={i}
          image={`https://i.pravatar.cc/150?img=${i}`}
          label={`User ${i}`}
          style={{ marginLeft: i > 1 ? '-0.75rem' : 0, zIndex: 6 - i }}
        />
      ))}
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
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Avatar
          image="https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=300&h=300&fit=crop"
          label="User"
        />
        <Avatar initials="JD" />
        <Avatar />
        <Avatar
          shape="square"
          image="https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=300&h=300&fit=crop"
          label="Square"
        />
        <Avatar shape="square" initials="JD" />
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Avatar
          style={{ '--size': '2rem' } as React.CSSProperties}
          initials="S"
        />
        <Avatar
          style={{ '--size': '3rem' } as React.CSSProperties}
          initials="M"
        />
        <Avatar
          style={{ '--size': '4rem' } as React.CSSProperties}
          initials="L"
        />
        <Avatar
          style={{ '--size': '6rem' } as React.CSSProperties}
          initials="XL"
        />
      </div>
    </div>
  ),
};
