import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { TabGroup, Tab, TabPanel, Icon } from '@/components/ui';

/** Tab groups organize content into a container that shows one section at a time */
const meta = {
  title: 'Components/Tab Group',
  component: TabGroup,
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'start', 'end'],
      description: 'Tab position',
      table: { defaultValue: { summary: 'top' } },
    },
    activation: {
      control: 'select',
      options: ['auto', 'manual'],
      description: 'Panel activation method',
      table: { defaultValue: { summary: 'auto' } },
    },
    'without-scroll-controls': {
      control: 'boolean',
      description: 'Disables scroll buttons',
      table: { defaultValue: { summary: 'false' } },
    },
    active: { control: 'text', description: 'The name of the active tab' },
    onTabShow: {
      action: 'tab-show',
      description: 'Emitted when a tab is shown.',
      table: { category: 'Events' },
    },
    onTabHide: {
      action: 'tab-hide',
      description: 'Emitted when a tab is hidden.',
      table: { category: 'Events' },
    },
  },
  args: {
    onTabShow: fn(),
    onTabHide: fn(),
  },
} satisfies Meta<typeof TabGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A standard tab group with four tabs and matching panels. */
export const Default: Story = {
  render: (args) => (
    <TabGroup {...args}>
      <Tab slot="nav" panel="general">
        General
      </Tab>
      <Tab slot="nav" panel="custom">
        Custom
      </Tab>
      <Tab slot="nav" panel="advanced">
        Advanced
      </Tab>
      <Tab slot="nav" panel="disabled" disabled>
        Disabled
      </Tab>
      <TabPanel name="general">
        <p>Manage general settings and preferences for your account.</p>
      </TabPanel>
      <TabPanel name="custom">
        <p>Customize the appearance and behavior of your dashboard.</p>
      </TabPanel>
      <TabPanel name="advanced">
        <p>Advanced configuration options for power users.</p>
      </TabPanel>
      <TabPanel name="disabled">
        <p>This panel is unreachable via the disabled tab.</p>
      </TabPanel>
    </TabGroup>
  ),
};

/** Shows all four tab-strip placement positions. */
export const Placements: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {(['top', 'bottom', 'start', 'end'] as const).map((placement) => (
        <div key={placement}>
          <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
            Placement: {placement}
          </p>
          <TabGroup placement={placement}>
            <Tab slot="nav" panel="a">
              Tab A
            </Tab>
            <Tab slot="nav" panel="b">
              Tab B
            </Tab>
            <Tab slot="nav" panel="c">
              Tab C
            </Tab>
            <TabPanel name="a" style={{ minHeight: '60px' }}>
              <p>Content A</p>
            </TabPanel>
            <TabPanel name="b" style={{ minHeight: '60px' }}>
              <p>Content B</p>
            </TabPanel>
            <TabPanel name="c" style={{ minHeight: '60px' }}>
              <p>Content C</p>
            </TabPanel>
          </TabGroup>
        </div>
      ))}
    </div>
  ),
};

/** Tabs decorated with icons for visual identification. */
export const WithIcons: Story = {
  render: (args) => (
    <TabGroup {...args}>
      <Tab slot="nav" panel="profile">
        <Icon name="user" /> Profile
      </Tab>
      <Tab slot="nav" panel="billing">
        <Icon name="credit-card" /> Billing
      </Tab>
      <Tab slot="nav" panel="security">
        <Icon name="lock" /> Security
      </Tab>
      <TabPanel name="profile">
        <p>Edit your profile information.</p>
      </TabPanel>
      <TabPanel name="billing">
        <p>Manage your billing details and subscriptions.</p>
      </TabPanel>
      <TabPanel name="security">
        <p>Update your password and 2FA settings.</p>
      </TabPanel>
    </TabGroup>
  ),
};

/** Arrow keys move focus without activating; Enter activates. */
export const ManualActivation: Story = {
  args: { activation: 'manual' },
  render: (args) => (
    <TabGroup {...args}>
      <Tab slot="nav" panel="a">
        Tab A
      </Tab>
      <Tab slot="nav" panel="b">
        Tab B
      </Tab>
      <Tab slot="nav" panel="c">
        Tab C
      </Tab>
      <TabPanel name="a">
        <p>Manual activation: focus a tab and press Enter to activate it.</p>
      </TabPanel>
      <TabPanel name="b">
        <p>Content B</p>
      </TabPanel>
      <TabPanel name="c">
        <p>Content C</p>
      </TabPanel>
    </TabGroup>
  ),
};

/** Static snapshot for visual regression testing. */
export const ChromaticOnly: Story = {
  tags: ['!dev', '!autodocs'],
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
        <Tab slot="nav" panel="one">
          Tab One
        </Tab>
        <Tab slot="nav" panel="two">
          Tab Two
        </Tab>
        <Tab slot="nav" panel="three">
          Tab Three
        </Tab>
        <TabPanel name="one">Panel One</TabPanel>
        <TabPanel name="two">Panel Two</TabPanel>
        <TabPanel name="three">Panel Three</TabPanel>
      </TabGroup>
      <TabGroup placement="bottom">
        <Tab slot="nav" panel="a">
          <Icon name="house" slot="prefix" />
          Home
        </Tab>
        <Tab slot="nav" panel="b">
          <Icon name="gear" slot="prefix" />
          Settings
        </Tab>
        <TabPanel name="a">Home content</TabPanel>
        <TabPanel name="b">Settings content</TabPanel>
      </TabGroup>
    </div>
  ),
};
