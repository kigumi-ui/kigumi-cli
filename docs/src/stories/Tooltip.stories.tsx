import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Tooltip, Button, Icon } from '@/components/ui';

/**
 * Tooltip displays a brief text label near a target element when the user hovers,
 * focuses, or clicks it. Use the `for` prop to point to a target element by its `id`.
 * The tooltip text is the component's children. Positioning is automatic via Floating UI;
 * a small directional arrow (optional) points at the trigger. Show and hide delays,
 * the trigger type, and all twelve placement positions are configurable.
 */
const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  argTypes: {
    for: {
      control: 'text',
      description: 'ID of the target element the tooltip is attached to',
    },
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
    onShow: fn(),
    onHide: fn(),
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
