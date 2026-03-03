import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Tooltip, Button, Icon } from '@/components/ui';

/** Tooltips display additional information based on a specific action */
const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  argTypes: {
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
      description: 'Tooltip placement',
      table: { defaultValue: { summary: 'top' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the tooltip',
      table: { defaultValue: { summary: 'false' } },
    },
    distance: {
      control: 'number',
      description: 'Distance from target',
      table: { defaultValue: { summary: '8' } },
    },
    open: {
      control: 'boolean',
      description: 'Whether the tooltip is open',
      table: { defaultValue: { summary: 'false' } },
    },
    skidding: {
      control: 'number',
      description: 'Offset along target',
      table: { defaultValue: { summary: '0' } },
    },
    trigger: {
      control: 'text',
      description: 'Activation events',
      table: { defaultValue: { summary: 'hover focus' } },
    },
    'without-arrow': {
      control: 'boolean',
      description: 'Hides the arrow',
      table: { defaultValue: { summary: 'false' } },
    },
    'show-delay': {
      control: 'number',
      description: 'Show delay (ms)',
      table: { defaultValue: { summary: '150' } },
    },
    'hide-delay': {
      control: 'number',
      description: 'Hide delay (ms)',
      table: { defaultValue: { summary: '0' } },
    },
    for: {
      control: 'text',
      description: 'The ID of the element the tooltip is anchored to',
    },
    onShow: {
      action: 'show',
      description: 'Emitted when the tooltip begins to show.',
      table: { category: 'Events' },
    },
    onAfterShow: {
      action: 'after-show',
      description:
        'Emitted after the tooltip has shown and all animations are complete.',
      table: { category: 'Events' },
    },
    onHide: {
      action: 'hide',
      description: 'Emitted when the tooltip begins to hide.',
      table: { category: 'Events' },
    },
    onAfterHide: {
      action: 'after-hide',
      description:
        'Emitted after the tooltip has hidden and all animations are complete.',
      table: { category: 'Events' },
    },
    'method:show': {
      control: false,
      description: 'Shows the tooltip.',
      table: { category: 'Methods' },
    },
    'method:hide': {
      control: false,
      description: 'Hides the tooltip',
      table: { category: 'Methods' },
    },
  },
  args: {
    onShow: fn(),
    onAfterShow: fn(),
    onHide: fn(),
    onAfterHide: fn(),
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A tooltip that appears on hover over a button. */
export const Default: Story = {
  render: (args) => (
    <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
      <Tooltip {...args} for="default-btn">
        Click to copy
      </Tooltip>
      <Button id="default-btn">Hover me</Button>
    </div>
  ),
};

/** Shows tooltips at top, bottom, left, and right positions. */
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
      <span>
        <Tooltip for="placement-top" placement="top">
          Top
        </Tooltip>
        <Button id="placement-top" size="small">
          Top
        </Button>
      </span>
      <div />
      <span>
        <Tooltip for="placement-left" placement="left">
          Left
        </Tooltip>
        <Button id="placement-left" size="small">
          Left
        </Button>
      </span>
      <div />
      <span>
        <Tooltip for="placement-right" placement="right">
          Right
        </Tooltip>
        <Button id="placement-right" size="small">
          Right
        </Button>
      </span>
      <div />
      <span>
        <Tooltip for="placement-bottom" placement="bottom">
          Bottom
        </Tooltip>
        <Button id="placement-bottom" size="small">
          Bottom
        </Button>
      </span>
      <div />
    </div>
  ),
};

/** Opens the tooltip on click instead of hover. */
export const ClickTrigger: Story = {
  render: (args) => (
    <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
      <Tooltip {...args} for="click-btn" trigger="click">
        Click triggered tooltip
      </Tooltip>
      <Button id="click-btn">Click me</Button>
    </div>
  ),
};

/** Hides the directional arrow pointer. */
export const WithoutArrow: Story = {
  render: (args) => (
    <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
      <Tooltip {...args} for="no-arrow-btn" without-arrow>
        No arrow tooltip
      </Tooltip>
      <Button id="no-arrow-btn">Hover me</Button>
    </div>
  ),
};

/** Delays tooltip appearance by 500 ms after hovering. */
export const WithDelay: Story = {
  render: (args) => (
    <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
      <Tooltip {...args} for="delayed-btn" show-delay={500}>
        Appears after 500ms
      </Tooltip>
      <Button id="delayed-btn">Delayed tooltip</Button>
    </div>
  ),
};

/** Tooltips on icon-only buttons to clarify their action. */
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
      <Tooltip for="icon-add">Add new item</Tooltip>
      <Button id="icon-add" appearance="plain">
        <Icon name="plus" />
      </Button>

      <Tooltip for="icon-delete">Delete selected</Tooltip>
      <Button id="icon-delete" appearance="plain" variant="danger">
        <Icon name="trash" />
      </Button>

      <Tooltip for="icon-edit">Edit details</Tooltip>
      <Button id="icon-edit" appearance="plain">
        <Icon name="pencil" />
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
        gap: '4rem',
        padding: '3rem',
      }}
    >
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {(['top', 'bottom', 'left', 'right'] as const).map((placement) => (
          <span key={placement}>
            <Tooltip for={`chromatic-${placement}`} placement={placement} open>
              {placement} tooltip
            </Tooltip>
            <Button id={`chromatic-${placement}`}>{placement}</Button>
          </span>
        ))}
      </div>
      <span>
        <Tooltip for="chromatic-disabled" open>
          Disabled button tooltip
        </Tooltip>
        <span>
          <Button id="chromatic-disabled" disabled>
            Disabled
          </Button>
        </span>
      </span>
    </div>
  ),
};
