import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Button } from '@/components/ui';

/** Badges are used to draw attention and display statuses or counts */
const meta = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['brand', 'neutral', 'success', 'warning', 'danger'],
      description: "The badge's theme variant",
      table: { defaultValue: { summary: 'brand' } },
    },
    appearance: {
      control: 'select',
      options: ['accent', 'filled', 'outlined', 'filled-outlined'],
      description: "The badge's visual appearance",
      table: { defaultValue: { summary: 'accent' } },
    },
    pill: {
      control: 'boolean',
      description: 'Draws a pill-style badge with rounded edges',
      table: { defaultValue: { summary: 'false' } },
    },
    attention: {
      control: 'select',
      options: ['none', 'pulse', 'bounce'],
      description: 'Adds an animation to draw attention to the badge',
      table: { defaultValue: { summary: 'none' } },
    },
    children: { control: 'text' },
  },
  args: {
    children: 'New',
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Shows a badge in its default neutral/accent state. */
export const Default: Story = {
  args: { variant: 'brand', children: 'New' },
};

/** Demonstrates all five color variants: neutral, brand, success, warning, and danger. */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Badge variant="brand">Brand</Badge>
      <Badge variant="neutral">Neutral</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
    </div>
  ),
};

/** Shows all four visual styles: accent, filled, outlined, and filled-outlined. */
export const Appearances: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Badge appearance="accent">Accent</Badge>
      <Badge appearance="filled">Filled</Badge>
      <Badge appearance="outlined">Outlined</Badge>
      <Badge appearance="filled-outlined">Filled Outlined</Badge>
    </div>
  ),
};

/** Adds the pulsating animation to draw the user's eye to urgent indicators. */
export const Attention: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Badge attention="none" pill>
        None
      </Badge>
      <Badge attention="pulse" pill variant="brand">
        Pulse
      </Badge>
      <Badge attention="bounce" pill variant="success">
        Bounce
      </Badge>
    </div>
  ),
};

/** Renders the badge with fully rounded pill corners. */
export const Pill: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Badge pill variant="brand">
        3
      </Badge>
      <Badge pill variant="danger">
        99+
      </Badge>
      <Badge pill variant="success">
        ✓
      </Badge>
    </div>
  ),
};

/** Positions a badge over a button to mimic a notification counter. */
export const OnButton: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Button variant="neutral">
        Notifications{' '}
        <Badge pill variant="danger">
          4
        </Badge>
      </Button>
      <Button variant="neutral">
        Messages{' '}
        <Badge pill variant="brand">
          12
        </Badge>
      </Button>
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
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Badge variant="neutral">Neutral</Badge>
        <Badge variant="brand">Brand</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Badge variant="brand" appearance="accent">
          Accent
        </Badge>
        <Badge variant="brand" appearance="filled">
          Filled
        </Badge>
        <Badge variant="brand" appearance="outlined">
          Outlined
        </Badge>
        <Badge variant="brand" appearance="filled-outlined">
          Filled Outlined
        </Badge>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Badge variant="success" pill>
          Success Pill
        </Badge>
        <Badge variant="danger" pill>
          Danger Pill
        </Badge>
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Button style={{ position: 'relative' }}>
          Inbox
          <Badge
            variant="danger"
            style={{ position: 'absolute', top: '-8px', right: '-8px' }}
          >
            3
          </Badge>
        </Button>
        <Button style={{ position: 'relative' }}>
          Updates
          <Badge
            variant="brand"
            style={{ position: 'absolute', top: '-8px', right: '-8px' }}
          >
            12
          </Badge>
        </Button>
      </div>
    </div>
  ),
};
