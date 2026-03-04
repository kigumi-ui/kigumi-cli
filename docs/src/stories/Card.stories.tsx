import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, Button, Badge, Avatar, Icon } from '@/components/ui';

/** Cards can be used to group related subjects in a container */
const meta = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    appearance: {
      control: 'select',
      options: ['outlined', 'filled-outlined', 'plain', 'filled', 'accent'],
      description: 'Visual appearance style',
      table: { defaultValue: { summary: 'outlined' } },
    },
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
      description: 'Card layout orientation',
      table: { defaultValue: { summary: 'vertical' } },
    },
    'with-header': {
      control: 'boolean',
      description: 'Adds header section (for SSR)',
      table: { defaultValue: { summary: 'false' } },
    },
    'with-footer': {
      control: 'boolean',
      description: 'Adds footer section (for SSR)',
      table: { defaultValue: { summary: 'false' } },
    },
    'with-media': {
      control: 'boolean',
      description: 'Adds media section (for SSR)',
      table: { defaultValue: { summary: 'false' } },
    },
    children: { table: { disable: true } },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A basic card with body content only. */
export const Default: Story = {
  render: (args) => (
    <Card {...args} style={{ maxWidth: '320px' }}>
      <p>
        This is a basic card with some body content. Cards are great for
        grouping related information.
      </p>
    </Card>
  ),
};

/** Adds a header slot with a title above the body. */
export const WithHeader: Story = {
  render: (args) => (
    <Card {...args} style={{ maxWidth: '320px' }}>
      <h3 slot="header" style={{ margin: 0 }} className="wa-heading-l">
        Card Title
      </h3>
      <Badge variant="success" slot="header-actions">
        Active
      </Badge>
      <p>Card body content with a custom header slot.</p>
    </Card>
  ),
};

/** Shows header, body, and footer sections together. */
export const WithHeaderAndFooter: Story = {
  render: (args) => (
    <Card {...args} style={{ maxWidth: '320px' }}>
      <div slot="header">
        <strong>Project Overview</strong>
      </div>
      <p>
        This card demonstrates both the header and footer slots for structured
        content layout.
      </p>
      <div
        slot="footer"
        style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}
      >
        <Button appearance="outlined">Cancel</Button>
        <Button variant="brand">Save</Button>
      </div>
    </Card>
  ),
};

/** Inserts an image into the media slot at the top of the card. */
export const WithMedia: Story = {
  render: (args) => (
    <Card {...args} style={{ maxWidth: '320px' }}>
      <img
        slot="media"
        src="https://picsum.photos/320/180"
        alt="Card media"
        style={{ width: '100%', display: 'block' }}
      />
      <div slot="header">
        <strong>Beautiful Landscape</strong>
      </div>
      <p>
        Cards can display media above the body content using the media slot.
      </p>
      <div slot="footer">
        <Button variant="brand" style={{ width: '100%' }}>
          View details
        </Button>
      </div>
    </Card>
  ),
};

/** Compares all available visual appearance styles. */
export const Appearances: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxWidth: '320px',
      }}
    >
      {(
        ['outlined', 'filled-outlined', 'filled', 'accent', 'plain'] as const
      ).map((appearance) => (
        <Card key={appearance} appearance={appearance}>
          <div slot="header">
            <strong style={{ textTransform: 'capitalize' }}>
              {appearance}
            </strong>
          </div>
          <p>
            Card with <code>{appearance}</code> appearance.
          </p>
        </Card>
      ))}
    </div>
  ),
};

/** Places media and content side by side in horizontal orientation. */
export const HorizontalOrientation: Story = {
  render: (args) => (
    <Card {...args} orientation="horizontal" style={{ maxWidth: '500px' }}>
      <img
        slot="media"
        src="https://picsum.photos/160/160"
        alt=""
        style={{ width: '160px', height: '160px', objectFit: 'cover' }}
      />
      <div slot="header">
        <strong>Horizontal Card</strong>
      </div>
      <p>
        In horizontal orientation, media is placed to the left of the content.
      </p>
      <div slot="footer">
        <Button size="small" variant="brand">
          Learn more
        </Button>
      </div>
    </Card>
  ),
};

/** A real-world example composing a user profile card. */
export const ProfileCard: Story = {
  render: () => (
    <Card appearance="outlined" style={{ maxWidth: '280px' }}>
      <div
        slot="header"
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
      >
        <Avatar image="https://i.pravatar.cc/150?img=8" label="Jane Doe" />
        <div>
          <div style={{ fontWeight: 600 }}>Jane Doe</div>
          <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
            Product Designer
          </div>
        </div>
      </div>
      <p>
        Passionate about creating user-centered designs that make a difference.
      </p>
      <div slot="footer" style={{ display: 'flex', gap: '0.5rem' }}>
        <Button size="small" appearance="outlined">
          Message
        </Button>
        <Button size="small" variant="brand">
          Follow
        </Button>
      </div>
    </Card>
  ),
};

/** Arranges multiple cards in a responsive grid layout. */
export const Grid: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
      }}
    >
      {[
        {
          title: 'Total Users',
          value: '12,431',
          icon: 'users',
          variant: 'brand',
        },
        {
          title: 'Revenue',
          value: '$48,295',
          icon: 'dollar-sign',
          variant: 'success',
        },
        { title: 'Pending', value: '84', icon: 'clock', variant: 'warning' },
      ].map(({ title, value, icon, variant }) => (
        <Card key={title} appearance="filled-outlined">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>{title}</div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  marginTop: '0.25rem',
                }}
              >
                {value}
              </div>
            </div>
            <Icon
              name={icon}
              style={{
                fontSize: '1.5rem',
                color: `var(--wa-color-${variant}-fill-loud)`,
              }}
            />
          </div>
        </Card>
      ))}
    </div>
  ),
};

/** Static snapshot for visual regression testing. */
export const ChromaticOnly: Story = {
  tags: ['!dev', '!autodocs'],
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
      <Card style={{ maxWidth: '340px' }}>
        <strong>Basic Card</strong>
        <p>Simple card without image.</p>
      </Card>
      <Card style={{ maxWidth: '340px' }}>
        <img
          slot="media"
          src="https://images.unsplash.com/photo-1559209172-0ff8f6d49ff7?w=500&h=300&fit=crop"
          alt="Cat"
        />
        <div slot="header">
          <strong>Card with Image</strong>
          <Badge variant="success" style={{ marginLeft: '0.5rem' }}>
            New
          </Badge>
        </div>
        <p>Card with image and header.</p>
        <div
          slot="footer"
          style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}
        >
          <Button size="small">Cancel</Button>
          <Button size="small" variant="brand">
            Save
          </Button>
        </div>
      </Card>
    </div>
  ),
};
