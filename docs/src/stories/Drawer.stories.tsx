import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { Drawer, Button } from '@/components/ui';

/** Drawers slide in from a container edge to expose additional options */
const meta = {
  title: 'Components/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Indicates whether the drawer is open',
      table: { disable: true, defaultValue: { summary: 'false' } },
    },
    label: {
      control: 'text',
      description: "The drawer's label as displayed in the header",
    },
    placement: {
      control: 'select',
      options: ['top', 'end', 'bottom', 'start'],
      description: 'The direction from which the drawer will open',
      table: { defaultValue: { summary: 'end' } },
    },
    'light-dismiss': {
      control: 'boolean',
      description: 'Closes the drawer when the user clicks outside of it',
      table: { defaultValue: { summary: 'false' } },
    },
    'without-header': {
      control: 'boolean',
      description: 'Removes the header',
      table: { defaultValue: { summary: 'false' } },
    },
    onShow: {
      action: 'show',
      description: 'Emitted when the drawer opens.',
      table: { category: 'Events' },
    },
    onAfterShow: {
      action: 'after-show',
      description:
        'Emitted after the drawer opens and all animations are complete.',
      table: { category: 'Events' },
    },
    onHide: {
      action: 'hide',
      description:
        'Emitted when the drawer is requesting to close. Calling `event.preventDefault()` will prevent the drawer from closing. You can inspect `event.detail.source` to see which element caused the drawer to close. If the source is the drawer element itself, the user has pressed [[Escape]] or the drawer has been closed programmatically. Avoid using this unless closing the drawer will result in destructive behavior such as data loss.',
      table: { category: 'Events' },
    },
    onAfterHide: {
      action: 'after-hide',
      description:
        'Emitted after the drawer closes and all animations are complete.',
      table: { category: 'Events' },
    },
    'slot:label': {
      control: false,
      description:
        "The drawer's label. Alternatively, you can use the `label` attribute.",
      table: { category: 'Slots' },
    },
    'slot:header-actions': {
      control: false,
      description:
        'Optional actions to add to the header. Works best with `<wa-button>`.',
      table: { category: 'Slots' },
    },
    'slot:footer': {
      control: false,
      description:
        "The drawer's footer, usually one or more buttons representing various options.",
      table: { category: 'Slots' },
    },
  },
  args: {
    onShow: fn(),
    onAfterShow: fn(),
    onHide: fn(),
    onAfterHide: fn(),
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A drawer that slides in from the end (right) side. */
export const Default: Story = {
  args: { label: 'Menu', placement: 'end' },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Drawer</Button>
        <Drawer
          {...args}
          open={open}
          onHide={() => {
            setOpen(false);
            args.onHide?.({} as CustomEvent);
          }}
          onAfterHide={() => args.onAfterHide?.({} as CustomEvent)}
        >
          <p>
            Drawer content goes here. Use drawers for navigation, settings, or
            supplementary content.
          </p>
          <Button slot="footer" onClick={() => setOpen(false)}>
            Close
          </Button>
        </Drawer>
      </>
    );
  },
};

/** Demonstrates all four placement options: top, end, bottom, and start. */
export const Placements: Story = {
  render: () => {
    const [placement, setPlacement] = useState<
      'top' | 'end' | 'bottom' | 'start' | null
    >(null);
    return (
      <>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['start', 'end', 'top', 'bottom'] as const).map((p) => (
            <Button key={p} onClick={() => setPlacement(p)}>
              From {p}
            </Button>
          ))}
        </div>
        {(['start', 'end', 'top', 'bottom'] as const).map((p) => (
          <Drawer
            key={p}
            label={`From ${p}`}
            placement={p}
            open={placement === p}
            onHide={() => setPlacement(null)}
          >
            <p>
              Drawer sliding in from the <strong>{p}</strong>.
            </p>
            <Button slot="footer" onClick={() => setPlacement(null)}>
              Close
            </Button>
          </Drawer>
        ))}
      </>
    );
  },
};

/** A practical navigation drawer with a list of links. */
export const WithNavigation: Story = {
  args: { label: 'Navigation', placement: 'start' },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Navigation</Button>
        <Drawer {...args} open={open} onHide={() => setOpen(false)}>
          <nav
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            {['Dashboard', 'Projects', 'Team', 'Settings', 'Help'].map(
              (item) => (
                <Button
                  key={item}
                  appearance="plain"
                  onClick={() => setOpen(false)}
                >
                  {item}
                </Button>
              )
            )}
          </nav>
        </Drawer>
      </>
    );
  },
};

/** Closes the drawer when clicking the backdrop. */
export const LightDismiss: Story = {
  args: { label: 'Filters', placement: 'end', 'light-dismiss': true },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>
          Open Filters (click outside to close)
        </Button>
        <Drawer {...args} open={open} onHide={() => setOpen(false)}>
          <p>Click outside the drawer to close it.</p>
        </Drawer>
      </>
    );
  },
};

/** Static snapshot for visual regression testing. */
export const ChromaticOnly: Story = {
  // tags: ['!dev', '!autodocs'],
  parameters: { chromatic: { pauseAnimationAtEnd: true } },
  render: () => (
    <div style={{ padding: '1.5rem' }}>
      <p
        style={{
          color: 'var(--wa-color-neutral-text-subtle)',
          fontSize: '0.875rem',
        }}
      >
        Drawer requires user interaction to open. Use the individual stories to
        test drawer states.
      </p>
      <Button>Open Drawer (interactive only)</Button>
    </div>
  ),
};
