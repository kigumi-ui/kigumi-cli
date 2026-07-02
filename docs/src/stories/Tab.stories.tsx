import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tab, TabGroup, TabPanel, Icon } from '@/components/ui';

/** Tabs are used inside tab groups to represent selectable tabs */
const meta = {
  title: 'Components/Tab',
  component: Tab,
  tags: ['autodocs'],
  argTypes: {
    panel: { control: 'text', description: 'Associated panel name' },
    disabled: {
      control: 'boolean',
      description: 'Disables the tab',
      table: { defaultValue: { summary: 'false' } },
    },
  },
} satisfies Meta<typeof Tab>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A single tab linked to a tab panel inside a tab group. */
export const Default: Story = {
  render: (args) => (
    <TabGroup>
      <Tab slot="nav" {...args}>
        Tab Label
      </Tab>
      <TabPanel name={args.panel ?? 'example'}>
        <p style={{ padding: '1rem 0', margin: 0 }}>Tab panel content</p>
      </TabPanel>
    </TabGroup>
  ),
};

/** One tab is disabled and cannot be activated. */
export const Disabled: Story = {
  render: () => (
    <TabGroup>
      <Tab slot="nav" panel="a">
        Active Tab
      </Tab>
      <Tab slot="nav" panel="b" disabled>
        Disabled Tab
      </Tab>
      <Tab slot="nav" panel="c">
        Another Tab
      </Tab>
      <TabPanel name="a">
        <p style={{ padding: '1rem 0', margin: 0 }}>Content for Tab A</p>
      </TabPanel>
      <TabPanel name="b">
        <p style={{ padding: '1rem 0', margin: 0 }}>
          Content for Tab B (disabled)
        </p>
      </TabPanel>
      <TabPanel name="c">
        <p style={{ padding: '1rem 0', margin: 0 }}>Content for Tab C</p>
      </TabPanel>
    </TabGroup>
  ),
};

/** Tabs decorated with prefix icons. */
export const WithIcons: Story = {
  render: () => (
    <TabGroup>
      <Tab slot="nav" panel="home">
        <Icon slot="prefix" name="house" />
        Home
      </Tab>
      <Tab slot="nav" panel="settings">
        <Icon slot="prefix" name="gear" />
        Settings
      </Tab>
      <Tab slot="nav" panel="profile">
        <Icon slot="prefix" name="person" />
        Profile
      </Tab>
      <TabPanel name="home">
        <p style={{ padding: '1rem 0', margin: 0 }}>Home content</p>
      </TabPanel>
      <TabPanel name="settings">
        <p style={{ padding: '1rem 0', margin: 0 }}>Settings content</p>
      </TabPanel>
      <TabPanel name="profile">
        <p style={{ padding: '1rem 0', margin: 0 }}>Profile content</p>
      </TabPanel>
    </TabGroup>
  ),
};

/** A tab group with many tabs to test overflow and scroll behavior. */
export const ManyTabs: Story = {
  render: () => (
    <TabGroup>
      {Array.from({ length: 6 }, (_, i) => (
        <Tab key={i} slot="nav" panel={`tab-${i}`}>
          Tab {i + 1}
        </Tab>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <TabPanel key={i} name={`tab-${i}`}>
          <p style={{ padding: '1rem 0', margin: 0 }}>
            Content for Tab {i + 1}
          </p>
        </TabPanel>
      ))}
    </TabGroup>
  ),
};
