import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SplitPanel } from '@/components/ui';

const PanelContent = ({ label, color }: { label: string; color: string }) => (
  <div
    style={{
      height: '100%',
      minHeight: '200px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: color,
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#fff',
      padding: '1rem',
    }}
  >
    {label}
  </div>
);

/**
 * Split Panel divides a container into two resizable panes separated by a draggable divider.
 * The `position` prop sets the initial split as a percentage (or absolute pixels when using
 * a primary pane), and the divider can snap to predefined positions. Supports horizontal
 * and vertical orientations and can be locked with `disabled`.
 */
const meta = {
  title: 'Components/Split Panel',
  component: SplitPanel,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      table: { defaultValue: { summary: 'horizontal' } },
    },
    position: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      table: { defaultValue: { summary: '50' } },
    },
    disabled: { control: 'boolean' },
    primary: { control: 'select', options: ['start', 'end'] },
    onReposition: { action: 'reposition' },
  },
  args: {
    position: 50,
    onReposition: fn(),
  },
} satisfies Meta<typeof SplitPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A horizontal split panel starting at 50 %. */
export const Default: Story = {
  render: (args) => (
    <SplitPanel {...args} style={{ height: '200px' }}>
      <PanelContent label="Start Panel" color="var(--wa-color-brand-600)" />
      <PanelContent label="End Panel" color="var(--wa-color-neutral-700)" />
    </SplitPanel>
  ),
};

/** Splits the container vertically into top and bottom panes. */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <SplitPanel {...args} style={{ height: '300px' }}>
      <PanelContent label="Top Panel" color="var(--wa-color-success-600)" />
      <PanelContent label="Bottom Panel" color="var(--wa-color-warning-600)" />
    </SplitPanel>
  ),
};

/** Locks the divider so the panels cannot be resized. */
export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <SplitPanel {...args} style={{ height: '200px' }}>
      <PanelContent label="Start (fixed)" color="var(--wa-color-neutral-400)" />
      <PanelContent label="End (fixed)" color="var(--wa-color-neutral-600)" />
    </SplitPanel>
  ),
};

/** The divider snaps to 25 %, 50 %, and 75 % positions. */
export const WithSnapping: Story = {
  args: { snap: '25% 50% 75%', 'snap-threshold': 10 },
  render: (args) => (
    <div>
      <p
        style={{
          marginBottom: '0.5rem',
          color: 'var(--wa-color-neutral-600)',
          fontSize: '0.875rem',
        }}
      >
        Drag the divider, snaps at 25%, 50%, and 75%
      </p>
      <SplitPanel {...args} style={{ height: '200px' }}>
        <PanelContent label="Start" color="var(--wa-color-danger-600)" />
        <PanelContent label="End" color="var(--wa-color-brand-600)" />
      </SplitPanel>
    </div>
  ),
};

/** The end panel has a fixed pixel width; the start panel fills remaining space. */
export const PrimaryEnd: Story = {
  args: { primary: 'end', position: 300 },
  render: (args) => (
    <SplitPanel {...args} style={{ height: '200px' }}>
      <PanelContent label="Start (fluid)" color="var(--wa-color-brand-600)" />
      <PanelContent
        label="End (fixed 300px)"
        color="var(--wa-color-neutral-700)"
      />
    </SplitPanel>
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
