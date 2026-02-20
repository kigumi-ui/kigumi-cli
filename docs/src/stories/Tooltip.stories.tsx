import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Tooltip, Button, Icon } from '@/components/ui';

const meta = {
  title: 'Overlay/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  argTypes: {
    content: { control: 'text', description: 'Tooltip text content' },
    placement: {
      control: 'select',
      options: [
        'top',
        'top-start',
        'top-end',
        'bottom',
        'bottom-start',
        'bottom-end',
        'right',
        'right-start',
        'right-end',
        'left',
        'left-start',
        'left-end',
      ],
      table: { defaultValue: { summary: 'top' } },
    },
    trigger: {
      control: 'text',
      description: 'Space-separated list of triggers: hover focus click manual',
      table: { defaultValue: { summary: 'hover focus' } },
    },
    disabled: { control: 'boolean' },
    'without-arrow': { control: 'boolean' },
    'show-delay': {
      control: 'number',
      description: 'Show delay in ms',
      table: { defaultValue: { summary: '150' } },
    },
    'hide-delay': {
      control: 'number',
      description: 'Hide delay in ms',
      table: { defaultValue: { summary: '0' } },
    },
    onShow: { action: 'show' },
    onAfterShow: { action: 'after-show' },
    onHide: { action: 'hide' },
    onAfterHide: { action: 'after-hide' },
  },
  args: {
    content: 'This is a tooltip',
    onShow: fn(),
    onHide: fn(),
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { content: 'Click to copy' },
  render: (args) => (
    <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
      <Tooltip {...args}>
        <Button>Hover me</Button>
      </Tooltip>
    </div>
  ),
};

export const Placements: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, auto)',
        gap: '1rem',
        justifyContent: 'center',
        padding: '4rem',
      }}
    >
      <div />
      <Tooltip content="Top" placement="top">
        <Button size="small">Top</Button>
      </Tooltip>
      <div />
      <Tooltip content="Left" placement="left">
        <Button size="small">Left</Button>
      </Tooltip>
      <div />
      <Tooltip content="Right" placement="right">
        <Button size="small">Right</Button>
      </Tooltip>
      <div />
      <Tooltip content="Bottom" placement="bottom">
        <Button size="small">Bottom</Button>
      </Tooltip>
      <div />
    </div>
  ),
};

export const ClickTrigger: Story = {
  args: { content: 'Click triggered tooltip', trigger: 'click' },
  render: (args) => (
    <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
      <Tooltip {...args}>
        <Button>Click me</Button>
      </Tooltip>
    </div>
  ),
};

export const WithoutArrow: Story = {
  args: { content: 'No arrow tooltip', 'without-arrow': true },
  render: (args) => (
    <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
      <Tooltip {...args}>
        <Button>Hover me</Button>
      </Tooltip>
    </div>
  ),
};

export const WithDelay: Story = {
  args: { content: 'Appears after 500ms', 'show-delay': 500 },
  render: (args) => (
    <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
      <Tooltip {...args}>
        <Button>Delayed tooltip</Button>
      </Tooltip>
    </div>
  ),
};

export const OnIcon: Story = {
  render: () => (
    <div
      style={{
        padding: '3rem',
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
      }}
    >
      <Tooltip content="Add new item">
        <Button appearance="plain">
          <Icon name="plus" />
        </Button>
      </Tooltip>
      <Tooltip content="Delete selected">
        <Button appearance="plain" variant="danger">
          <Icon name="trash" />
        </Button>
      </Tooltip>
      <Tooltip content="Edit details">
        <Button appearance="plain">
          <Icon name="pencil" />
        </Button>
      </Tooltip>
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
        gap: '4rem',
        padding: '3rem',
      }}
    >
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {(['top', 'bottom', 'left', 'right'] as const).map((placement) => (
          <Tooltip
            key={placement}
            content={`${placement} tooltip`}
            placement={placement}
            open
          >
            <Button>{placement}</Button>
          </Tooltip>
        ))}
      </div>
      <Tooltip content="Disabled button tooltip" open>
        <span>
          <Button disabled>Disabled</Button>
        </span>
      </Tooltip>
    </div>
  ),
};
