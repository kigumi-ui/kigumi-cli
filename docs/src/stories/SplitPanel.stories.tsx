import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, waitFor } from 'storybook/test';
import { SplitPanel } from '@/components/ui';

/** Split panels display two adjacent panels with a divider for resizing */
const meta = {
  title: 'Components/Split Panel',
  component: SplitPanel,
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: 'number',
      description: 'Divider position (%)',
      table: { defaultValue: { summary: '50' } },
    },
    'position-in-pixels': {
      control: 'number',
      description: 'Divider position (px)',
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Panel orientation',
      table: { defaultValue: { summary: 'horizontal' } },
    },
    primary: {
      control: 'select',
      options: ['start', 'end'],
      description: 'Primary panel',
      table: { defaultValue: { summary: 'start' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables resizing',
      table: { defaultValue: { summary: 'false' } },
    },
    snap: { control: 'text', description: 'Snap points' },
    'snap-threshold': {
      control: 'number',
      description: 'Snap threshold (px)',
      table: { defaultValue: { summary: '12' } },
    },
    onReposition: {
      action: 'reposition',
      description: "Emitted when the divider's position changes.",
      table: { category: 'Events' },
    },
  },
  args: {
    onReposition: fn(),
  },
} satisfies Meta<typeof SplitPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A horizontal split panel starting at 50 %. */
export const Default: Story = {
  tags: ['interaction'],
  render: (args) => (
    <SplitPanel {...args} style={{ height: '200px' }}>
      <div
        slot="start"
        className="wa-align-items-center wa-justify-content-center"
      >
        Start Panel
      </div>
      <div
        slot="end"
        className="wa-align-items-center wa-justify-content-center"
      >
        End Panel
      </div>
    </SplitPanel>
  ),
  // The divider lives in shadow DOM and the runner cannot drive ArrowRight
  // through it reliably, so assert the wrapper renders the host with the
  // documented default position (50) and the two slotted panels mount.
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('wa-split-panel') as
      | (HTMLElement & { position?: number })
      | null;
    await expect(host).not.toBeNull();
    await waitFor(() => expect(host!.position).toBe(50));
    await expect(host!.querySelector('[slot="start"]')).not.toBeNull();
    await expect(host!.querySelector('[slot="end"]')).not.toBeNull();
  },
};

/** Splits the container vertically into top and bottom panes. */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <SplitPanel {...args} style={{ height: '300px' }}>
      <div
        slot="start"
        className="wa-align-items-center wa-justify-content-center"
      >
        Top Panel
      </div>
      <div
        slot="end"
        className="wa-align-items-center wa-justify-content-center"
      >
        Bottom Panel
      </div>
    </SplitPanel>
  ),
};

/** Locks the divider so the panels cannot be resized. */
export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <SplitPanel {...args} style={{ height: '200px' }}>
      <div
        slot="start"
        className="wa-align-items-center wa-justify-content-center"
      >
        Start Panel
      </div>
      <div
        slot="end"
        className="wa-align-items-center wa-justify-content-center"
      >
        End Panel
      </div>
    </SplitPanel>
  ),
};

/** The divider snaps to 25 %, 50 %, and 75 % positions. */
export const WithSnapping: Story = {
  args: { snap: '25% 50% 75%', 'snap-threshold': 10 },
  render: (args) => (
    <div>
      <p className="wa-text-body-small wa-text-neutral-600">
        Drag the divider, snaps at 25%, 50%, and 75%
      </p>
      <SplitPanel {...args} style={{ height: '200px' }}>
        <div
          slot="start"
          className="wa-align-items-center wa-justify-content-center"
        >
          Start Panel
        </div>
        <div
          slot="end"
          className="wa-align-items-center wa-justify-content-center"
        >
          End Panel
        </div>
      </SplitPanel>
    </div>
  ),
};

/** The end panel has a fixed pixel width; the start panel fills remaining space. */
export const NestedPanels: Story = {
  args: { primary: 'end', position: 300 },
  render: () => (
    <SplitPanel>
      <div
        slot="start"
        style={{
          height: 400,
          background: 'var(--wa-color-surface-lowered)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        Start Panel
      </div>
      <div slot="end">
        <SplitPanel orientation="vertical" style={{ height: 400 }}>
          <div
            slot="start"
            style={{
              height: '100%',
              background: 'var(--wa-color-surface-lowered)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            Top Panel
          </div>
          <div
            slot="end"
            style={{
              height: '100%',
              background: 'var(--wa-color-surface-lowered)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            Bottom Panel
          </div>
        </SplitPanel>
      </div>
    </SplitPanel>
  ),
};

/** Static snapshot for visual regression testing. */
export const ChromaticOnly: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: {
    chromatic: { disableSnapshot: false, pauseAnimationAtEnd: true },
  },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        padding: '1.5rem',
      }}
    >
      <SplitPanel
        style={{
          height: '200px',
          border: '1px solid var(--wa-color-neutral-border-normal)',
          borderRadius: '0.5rem',
        }}
      >
        <div
          slot="start"
          style={{
            padding: '1rem',
            height: '100%',
            background: 'var(--wa-color-brand-fill-subtle)',
          }}
        >
          Start Panel
        </div>
        <div
          slot="end"
          style={{
            padding: '1rem',
            height: '100%',
            background: 'var(--wa-color-neutral-fill-subtle)',
          }}
        >
          End Panel
        </div>
      </SplitPanel>
      <SplitPanel
        orientation="vertical"
        style={{
          height: '300px',
          border: '1px solid var(--wa-color-neutral-border-normal)',
          borderRadius: '0.5rem',
        }}
      >
        <div
          slot="start"
          style={{
            padding: '1rem',
            background: 'var(--wa-color-success-fill-subtle)',
          }}
        >
          Top Panel
        </div>
        <div
          slot="end"
          style={{
            padding: '1rem',
            background: 'var(--wa-color-neutral-fill-subtle)',
          }}
        >
          Bottom Panel
        </div>
      </SplitPanel>
    </div>
  ),
};
