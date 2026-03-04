import type { Meta, StoryObj } from '@storybook/react-vite';
import { Page, Button, Icon } from '@/components/ui';

/** Pages offer an easy way to scaffold entire page layouts using minimal markup */
const meta = {
  title: 'Components/Page',
  component: Page,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    'disable-navigation-toggle': {
      control: 'boolean',
      description:
        'Hide default hamburger button; auto-sets true if custom toggle element present',
      table: { defaultValue: { summary: 'false' } },
    },
    'mobile-breakpoint': {
      control: 'text',
      description:
        'Viewport width threshold for navigation collapse; accepts numbers (px) or CSS lengths',
      table: { defaultValue: { summary: '768px' } },
    },
    'navigation-placement': {
      control: 'select',
      options: ['start', 'end'],
      description: 'Navigation drawer position on mobile',
      table: { defaultValue: { summary: 'start' } },
    },
    'nav-open': {
      control: 'boolean',
      description: 'Mobile navigation drawer open state',
      table: { defaultValue: { summary: 'false' } },
    },
    view: {
      control: 'select',
      options: ['mobile', 'desktop'],
      description: 'Current viewport classification relative to breakpoint',
      table: { defaultValue: { summary: 'desktop' } },
    },
  },
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

const navItems = ['Dashboard', 'Projects', 'Team', 'Reports', 'Settings'];

/** A full page shell with header, navigation, and content area. */
export const Default: Story = {
  render: (args) => (
    <Page {...args} style={{ height: '500px' }}>
      <nav
        slot="navigation"
        style={{
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <div
          style={{
            fontWeight: 700,
            padding: '0.5rem 1rem',
            marginBottom: '0.5rem',
            fontSize: '1.125rem',
          }}
        >
          App Name
        </div>
        {navItems.map((item) => (
          <Button
            key={item}
            appearance="plain"
            style={{ justifyContent: 'flex-start' }}
          >
            <Icon name="circle" slot="prefix" />
            {item}
          </Button>
        ))}
      </nav>
      <div style={{ padding: '2rem' }}>
        <h1 style={{ margin: '0 0 1rem' }}>Dashboard</h1>
        <p>Main content area. The navigation panel slides in from the side.</p>
      </div>
    </Page>
  ),
};

/** Positions the side navigation on the end (right) side. */
export const NavigationEnd: Story = {
  args: { 'navigation-placement': 'end' },
  render: (args) => (
    <Page {...args} style={{ height: '500px' }}>
      <nav
        slot="navigation"
        style={{
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {navItems.map((item) => (
          <Button
            key={item}
            appearance="plain"
            style={{ justifyContent: 'flex-start' }}
          >
            {item}
          </Button>
        ))}
      </nav>
      <div style={{ padding: '2rem' }}>
        <h1 style={{ margin: '0 0 1rem' }}>Navigation from End</h1>
        <p>Navigation panel slides in from the right/end side.</p>
      </div>
    </Page>
  ),
};

/** Shows the responsive collapsed navigation on a narrow viewport. */
export const MobileView: Story = {
  args: { view: 'mobile' },
  render: (args) => (
    <Page {...args} style={{ height: '500px' }}>
      <nav
        slot="navigation"
        style={{
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {navItems.map((item) => (
          <Button
            key={item}
            appearance="plain"
            style={{ justifyContent: 'flex-start' }}
          >
            {item}
          </Button>
        ))}
      </nav>
      <div style={{ padding: '2rem' }}>
        <h1 style={{ margin: '0 0 1rem' }}>Mobile View</h1>
        <p>
          Navigation is collapsed in mobile view. Use the toggle to show it.
        </p>
      </div>
    </Page>
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
      <Page
        style={{
          height: '300px',
          border: '1px solid var(--wa-color-neutral-border-normal)',
        }}
      >
        <div
          slot="header"
          style={{
            padding: '1rem',
            background: 'var(--wa-color-neutral-fill-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Icon name="house" />
          <strong>Header</strong>
        </div>
        <div style={{ padding: '1rem' }}>
          <p>Main content area</p>
          <Button variant="brand">Action</Button>
        </div>
        <div
          slot="footer"
          style={{
            padding: '1rem',
            background: 'var(--wa-color-neutral-fill-subtle)',
            textAlign: 'center',
            fontSize: '0.875rem',
          }}
        >
          Footer
        </div>
      </Page>
    </div>
  ),
};
