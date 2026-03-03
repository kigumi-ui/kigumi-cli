import type { Meta, StoryObj } from '@storybook/react-vite';
import { TabPanel, TabGroup, Tab } from '@/components/ui';

/** Tab panels are used inside tab groups to display content for each tab */
const meta = {
  title: 'Components/Tab Panel',
  component: TabPanel,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text', description: 'The panel name' },
    active: {
      control: 'boolean',
      description: 'Whether the panel is shown',
      table: { defaultValue: { summary: 'false' } },
    },
  },
} satisfies Meta<typeof TabPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A single active tab panel inside a minimal tab group. */
export const Default: Story = {
  render: (args) => (
    <TabGroup>
      <Tab slot="nav" panel={args.name ?? 'panel'}>
        Tab
      </Tab>
      <TabPanel {...args}>
        <div style={{ padding: '1rem 0' }}>
          <h3 style={{ margin: '0 0 0.5rem' }}>Panel Content</h3>
          <p style={{ margin: 0 }}>This is the content inside the tab panel.</p>
        </div>
      </TabPanel>
    </TabGroup>
  ),
};

/** Three panels in a tab group, each with distinct content. */
export const MultiplePanels: Story = {
  render: () => (
    <TabGroup>
      <Tab slot="nav" panel="overview">
        Overview
      </Tab>
      <Tab slot="nav" panel="details">
        Details
      </Tab>
      <Tab slot="nav" panel="history">
        History
      </Tab>

      <TabPanel name="overview">
        <div style={{ padding: '1rem 0' }}>
          <h3 style={{ margin: '0 0 0.5rem' }}>Overview</h3>
          <p style={{ margin: 0 }}>High-level summary of the project.</p>
        </div>
      </TabPanel>

      <TabPanel name="details">
        <div style={{ padding: '1rem 0' }}>
          <h3 style={{ margin: '0 0 0.5rem' }}>Details</h3>
          <p style={{ margin: 0 }}>Detailed breakdown of all specifications.</p>
        </div>
      </TabPanel>

      <TabPanel name="history">
        <div style={{ padding: '1rem 0' }}>
          <h3 style={{ margin: '0 0 0.5rem' }}>History</h3>
          <p style={{ margin: 0 }}>Changelog and version history.</p>
        </div>
      </TabPanel>
    </TabGroup>
  ),
};

/** A panel containing multiple styled sections. */
export const WithRichContent: Story = {
  render: () => (
    <TabGroup>
      <Tab slot="nav" panel="content">
        Content
      </Tab>
      <TabPanel name="content">
        <div
          style={{
            padding: '1rem 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div
            style={{
              padding: '1rem',
              background: 'var(--wa-color-neutral-50)',
              borderRadius: '0.5rem',
            }}
          >
            Section 1
          </div>
          <div
            style={{
              padding: '1rem',
              background: 'var(--wa-color-neutral-50)',
              borderRadius: '0.5rem',
            }}
          >
            Section 2
          </div>
          <div
            style={{
              padding: '1rem',
              background: 'var(--wa-color-neutral-50)',
              borderRadius: '0.5rem',
            }}
          >
            Section 3
          </div>
        </div>
      </TabPanel>
    </TabGroup>
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
      <TabGroup>
        <Tab slot="nav" panel="p1">
          Panel 1
        </Tab>
        <Tab slot="nav" panel="p2">
          Panel 2
        </Tab>
        <TabPanel name="p1" style={{ padding: '1rem' }}>
          <strong>Tab Panel 1</strong>
          <p>This is the first panel content.</p>
        </TabPanel>
        <TabPanel name="p2" style={{ padding: '1rem' }}>
          <strong>Tab Panel 2</strong>
          <p>This is the second panel content.</p>
        </TabPanel>
      </TabGroup>
    </div>
  ),
};
