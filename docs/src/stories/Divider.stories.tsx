import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider, Button } from '@/components/ui';

const meta = {
  title: 'Display/Divider',
  component: Divider,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      table: { defaultValue: { summary: 'horizontal' } },
    },
  },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div style={{ maxWidth: '400px' }}>
      <p>Content above the divider</p>
      <Divider {...args} />
      <p>Content below the divider</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        height: '40px',
      }}
    >
      <Button appearance="plain">Share</Button>
      <Divider orientation="vertical" />
      <Button appearance="plain">Edit</Button>
      <Divider orientation="vertical" />
      <Button appearance="plain" variant="danger">
        Delete
      </Button>
    </div>
  ),
};

export const InList: Story = {
  render: () => (
    <div
      style={{
        maxWidth: '300px',
        border: '1px solid var(--wa-color-neutral-stroke-quiet)',
        borderRadius: '8px',
        padding: '0.5rem',
      }}
    >
      {['Dashboard', 'Projects', 'Team'].map((item, i) => (
        <div key={item}>
          {i > 0 && <Divider />}
          <Button
            appearance="plain"
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            {item}
          </Button>
        </div>
      ))}
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
        maxWidth: '400px',
      }}
    >
      <div>
        <p>Above</p>
        <Divider />
        <p>Below</p>
      </div>
      <div
        style={{
          display: 'flex',
          height: '80px',
          alignItems: 'stretch',
          gap: '1rem',
        }}
      >
        <span>Left</span>
        <Divider vertical />
        <span>Right</span>
      </div>
      <div>
        <p>Custom styled</p>
        <Divider
          style={
            {
              '--color': 'var(--wa-color-brand-fill-loud)',
              '--width': '2px',
            } as React.CSSProperties
          }
        />
        <p>Below</p>
      </div>
    </div>
  ),
};
