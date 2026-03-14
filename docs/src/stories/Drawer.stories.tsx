import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { Drawer, Button } from '@/components/ui';

const SlotBlock = ({
  label,
  height = '3rem',
  ...rest
}: {
  label: string;
  height?: string;
} & React.HTMLAttributes<HTMLDivElement>) => (
  <div
    style={{
      display: 'grid',
      placeItems: 'center',
      height,
      padding: '0.5rem',
      borderRadius: 'var(--wa-border-radius-m)',
      backgroundColor: 'var(--wa-color-brand-surface)',
      color: 'var(--wa-color-brand-text)',
      fontSize: 'var(--wa-font-size-s)',
      fontWeight: 'var(--wa-font-weight-semibold)',
    }}
    {...rest}
  >
    {label}
  </div>
);

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
      table: { defaultValue: { summary: 'true' } },
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

/** A drawer that slides in from the end (right) side, showing all available slots. */
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
            This is a basic drawer. Use it to display supplementary content that
            doesn't need to be visible at all times.
          </p>
          <p>
            Drawers are great for navigation menus, filters, settings panels,
            and detail views on smaller screens.
          </p>
          <div
            slot="footer"
            style={{
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'flex-end',
            }}
          >
            <Button appearance="plain" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save</Button>
          </div>
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
            <SlotBlock label="default" height="8rem" />
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
          <SlotBlock label="default" height="8rem" />
        </Drawer>
      </>
    );
  },
};

/** Static snapshot for visual regression testing. */
export const ChromaticOnly: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: {
    chromatic: { disableSnapshot: false, pauseAnimationAtEnd: true },
  },
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
