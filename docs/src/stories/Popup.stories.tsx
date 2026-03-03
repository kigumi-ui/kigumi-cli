import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Popup, Button } from '@/components/ui';

/** Popup is a utility component for positioning elements relative to an anchor */
const meta = {
  title: 'Components/Popup',
  component: Popup,
  tags: ['autodocs'],
  argTypes: {
    active: {
      control: 'boolean',
      description: 'Activates the positioning logic',
      table: { defaultValue: { summary: 'false' } },
    },
    anchor: {
      control: 'text',
      description: 'Anchor element ID or reference',
      table: { disable: true },
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
      description: 'Preferred placement',
      table: { defaultValue: { summary: 'top' } },
    },
    strategy: {
      control: 'select',
      options: ['absolute', 'fixed'],
      description: 'Positioning strategy',
      table: { defaultValue: { summary: 'absolute' } },
    },
    distance: {
      control: 'number',
      description: 'Distance from anchor',
      table: { defaultValue: { summary: '0' } },
    },
    skidding: {
      control: 'number',
      description: 'Offset along anchor',
      table: { defaultValue: { summary: '0' } },
    },
    arrow: {
      control: 'boolean',
      description: 'Shows an arrow',
      table: { defaultValue: { summary: 'false' } },
    },
    'arrow-placement': {
      control: 'select',
      options: ['start', 'end', 'center', 'anchor'],
      description: 'Arrow position',
      table: { defaultValue: { summary: 'anchor' } },
    },
    'arrow-padding': {
      control: 'number',
      description: 'Arrow edge padding',
      table: { defaultValue: { summary: '10' } },
    },
    flip: {
      control: 'boolean',
      description: 'Flips when constrained',
      table: { defaultValue: { summary: 'false' } },
    },
    'flip-fallback-placements': {
      control: 'text',
      description: 'Fallback placements',
    },
    'flip-fallback-strategy': {
      control: 'select',
      options: ['best-fit', 'initial'],
      description: 'Fallback strategy',
      table: { defaultValue: { summary: 'best-fit' } },
    },
    'flip-padding': {
      control: 'number',
      description: 'Flip boundary padding',
      table: { defaultValue: { summary: '0' } },
    },
    shift: {
      control: 'boolean',
      description: 'Shifts to stay visible',
      table: { defaultValue: { summary: 'false' } },
    },
    'shift-padding': {
      control: 'number',
      description: 'Shift boundary padding',
      table: { defaultValue: { summary: '0' } },
    },
    'auto-size': {
      control: 'select',
      options: ['horizontal', 'vertical', 'both'],
      description: 'Auto-resize behavior',
    },
    sync: {
      control: 'select',
      options: ['width', 'height', 'both'],
      description: 'Syncs dimensions with anchor',
    },
    'auto-size-padding': {
      control: 'number',
      description: 'Auto-size boundary padding',
      table: { defaultValue: { summary: '0' } },
    },
    onReposition: {
      action: 'reposition',
      description:
        'Emitted when the popup is repositioned. This event can fire a lot, so avoid putting expensive operations in your listener or consider debouncing it.',
      table: { category: 'Events' },
    },
    'slot:anchor': {
      control: false,
      description:
        'The element the popup will be anchored to. If the anchor lives outside of the popup, you can use the `anchor` attribute or property instead.',
      table: { category: 'Slots' },
    },
    'method:reposition': {
      control: false,
      description: 'Forces the popup to recalculate and reposition itself.',
      table: { category: 'Methods' },
    },
  },
  args: {
    onReposition: fn(),
  },
} satisfies Meta<typeof Popup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A basic popup positioned above its anchor. */
export const Default: Story = {
  render: (args) => (
    <div style={{ padding: '6rem', display: 'flex', justifyContent: 'center' }}>
      <Popup {...args} anchor="popup-anchor">
        <div
          style={{
            background: 'var(--wa-color-neutral-900)',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
          }}
        >
          Popup content
        </div>
      </Popup>
      <Button id="popup-anchor">Anchor Element</Button>
    </div>
  ),
};

/** Adds a directional arrow pointing at the anchor element. */
export const WithArrow: Story = {
  args: { arrow: true, placement: 'bottom' },
  render: (args) => (
    <div style={{ padding: '5rem', display: 'flex', justifyContent: 'center' }}>
      <Popup {...args} anchor="popup-arrow-anchor">
        <div
          style={{
            background: 'var(--wa-color-brand-600)',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
          }}
        >
          Popup with arrow
        </div>
      </Popup>
      <Button id="popup-arrow-anchor" variant="brand">
        Anchor
      </Button>
    </div>
  ),
};

/** Shows all twelve supported placement positions. */
export const Placements: Story = {
  render: () => {
    const placements = ['top', 'bottom', 'left', 'right'] as const;
    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4rem',
          padding: '4rem',
          justifyContent: 'center',
        }}
      >
        {placements.map((p) => (
          <div key={p} style={{ position: 'relative' }}>
            <Popup
              active
              anchor={`popup-${p}`}
              placement={p}
              distance={8}
              arrow
            >
              <div
                style={{
                  background: 'var(--wa-color-neutral-800)',
                  color: '#fff',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {p}
              </div>
            </Popup>
            <Button id={`popup-${p}`} size="small">
              {p}
            </Button>
          </div>
        ))}
      </div>
    );
  },
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
        gap: '6rem',
        padding: '3rem',
      }}
    >
      <Popup active placement="bottom">
        <Button slot="anchor">Anchor</Button>
        <div
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--wa-color-neutral-fill-loud)',
            color: 'white',
            borderRadius: '4px',
          }}
        >
          Popup Content
        </div>
      </Popup>
    </div>
  ),
};
