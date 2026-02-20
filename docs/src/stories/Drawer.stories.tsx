import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { Drawer, Button } from '@/components/ui';

const meta = {
  title: 'Overlay/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text', description: 'Drawer title shown in the header' },
    placement: {
      control: 'select',
      options: ['top', 'end', 'bottom', 'start'],
      description: 'Side from which the drawer slides in',
      table: { defaultValue: { summary: 'end' } },
    },
    'light-dismiss': {
      control: 'boolean',
      description: 'Close when clicking outside',
    },
    'without-header': { control: 'boolean', description: 'Removes the header' },
    onShow: { action: 'show' },
    onAfterShow: { action: 'after-show' },
    onHide: { action: 'hide' },
    onAfterHide: { action: 'after-hide' },
    open: { table: { disable: true } },
  },
  args: {
    label: 'Drawer Title',
    onShow: fn(),
    onAfterShow: fn(),
    onHide: fn(),
    onAfterHide: fn(),
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

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
