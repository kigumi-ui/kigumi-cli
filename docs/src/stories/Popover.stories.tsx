import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { Popover, Button, Icon } from '@/components/ui';

/**
 * Popover displays rich content in a floating panel anchored to a trigger element. Unlike
 * Tooltip it is not limited to plain text: any markup can go inside, and it stays open
 * until explicitly dismissed. It positions itself automatically using Floating UI and
 * supports a directional arrow pointing at the trigger.
 */
const meta = {
  title: 'Components/Popover',
  component: Popover,
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
      table: { defaultValue: { summary: 'top' } },
    },
    distance: { control: 'number', table: { defaultValue: { summary: '8' } } },
    'without-arrow': { control: 'boolean' },
    onShow: { action: 'show' },
    onAfterShow: { action: 'after-show' },
    onHide: { action: 'hide' },
    onAfterHide: { action: 'after-hide' },
    open: { table: { disable: true } },
    for: { table: { disable: true } },
  },
  args: {
    onShow: fn(),
    onHide: fn(),
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A popover with a text paragraph opened by a button trigger. */
export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div
        style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}
      >
        <Button id="popover-default-trigger" onClick={() => setOpen(!open)}>
          Toggle Popover
        </Button>
        <Popover {...args} for="popover-default-trigger" open={open}>
          <div style={{ padding: '0.75rem 1rem' }}>
            <strong>Popover title</strong>
            <p style={{ margin: '0.5rem 0 0' }}>
              This is some additional information shown in the popover.
            </p>
          </div>
        </Popover>
      </div>
    );
  },
};

/** Shows all supported placement positions around the trigger. */
export const Placements: Story = {
  render: () => {
    const [active, setActive] = useState<string | null>(null);
    const placements = ['top', 'bottom', 'left', 'right'] as const;
    return (
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          padding: '5rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {placements.map((p) => (
          <span key={p}>
            <Button
              id={`pop-${p}`}
              size="small"
              onClick={() => setActive(active === p ? null : p)}
            >
              {p}
            </Button>
            <Popover for={`pop-${p}`} placement={p} open={active === p}>
              <div style={{ padding: '0.5rem 0.75rem' }}>Placement: {p}</div>
            </Popover>
          </span>
        ))}
      </div>
    );
  },
};

/** Inserts a form or complex layout inside the popover body. */
export const WithRichContent: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div
        style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}
      >
        <Button id="popover-rich-trigger" onClick={() => setOpen(!open)}>
          <Icon name="info-circle" /> Help
        </Button>
        <Popover
          {...args}
          for="popover-rich-trigger"
          open={open}
          placement="bottom-start"
        >
          <div style={{ padding: '1rem', maxWidth: '280px' }}>
            <strong>How it works</strong>
            <p style={{ margin: '0.5rem 0', fontSize: '0.875rem' }}>
              Popovers display rich content anchored to a trigger element.
              Unlike tooltips, they support interactive content.
            </p>
            <Button size="small" variant="brand" onClick={() => setOpen(false)}>
              Got it
            </Button>
          </div>
        </Popover>
      </div>
    );
  },
};

/** Hides the directional arrow for a floating-panel style. */
export const WithoutArrow: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div
        style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}
      >
        <Button id="popover-noarrow-trigger" onClick={() => setOpen(!open)}>
          No arrow
        </Button>
        <Popover
          {...args}
          for="popover-noarrow-trigger"
          open={open}
          without-arrow
        >
          <div style={{ padding: '0.75rem 1rem' }}>
            Popover without an arrow indicator.
          </div>
        </Popover>
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
        gap: '4rem',
        padding: '3rem',
      }}
    >
      <Popover open>
        <Button slot="anchor">Trigger</Button>
        <div style={{ padding: '1rem' }}>
          <strong>Popover Title</strong>
          <p style={{ margin: '0.5rem 0 0' }}>Popover content goes here.</p>
        </div>
      </Popover>
    </div>
  ),
};
