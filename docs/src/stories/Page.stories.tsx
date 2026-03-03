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
    'slot:banner': {
      control: false,
      description:
        'The banner that gets display above the header. The banner will not be shown if no content is provided.',
      table: { category: 'Slots' },
    },
    'slot:header': {
      control: false,
      description:
        'The header to display at the top of the page. If a banner is present, the header will appear below the banner. The header will not be shown if there is no content.',
      table: { category: 'Slots' },
    },
    'slot:subheader': {
      control: false,
      description:
        'A subheader to display below the `header`. This is a good place to put things like breadcrumbs.',
      table: { category: 'Slots' },
    },
    'slot:menu': {
      control: false,
      description:
        'The left side of the page. If you slot an element in here, you will override the default `navigation` slot and will be handling navigation on your own. This also will not disable the fallback behavior of the navigation button. This section "sticks" to the top as the page scrolls.',
      table: { category: 'Slots' },
    },
    'slot:navigation-header': {
      control: false,
      description:
        'The header for a navigation area. On mobile this will be the header for `<wa-drawer>`.',
      table: { category: 'Slots' },
    },
    'slot:navigation': {
      control: false,
      description:
        'The main content to display in the navigation area. This is displayed on the left side of the page, if `menu` is not used. This section "sticks" to the top as the page scrolls.',
      table: { category: 'Slots' },
    },
    'slot:navigation-footer': {
      control: false,
      description:
        'The footer for a navigation area. On mobile this will be the footer for `<wa-drawer>`.',
      table: { category: 'Slots' },
    },
    'slot:navigation-toggle': {
      control: false,
      description:
        'Use this slot to slot in your own button + icon for toggling the navigation drawer. By default it is a `<wa-button>` + a 3 bars `<wa-icon>`',
      table: { category: 'Slots' },
    },
    'slot:navigation-toggle-icon': {
      control: false,
      description:
        'Use this to slot in your own icon for toggling the navigation drawer. By default it is 3 bars `<wa-icon>`.',
      table: { category: 'Slots' },
    },
    'slot:main-header': {
      control: false,
      description: 'Header to display inline above the main content.',
      table: { category: 'Slots' },
    },
    'slot:main-footer': {
      control: false,
      description: 'Footer to display inline below the main content.',
      table: { category: 'Slots' },
    },
    'slot:aside': {
      control: false,
      description:
        'Content to be shown on the right side of the page. Typically contains a table of contents, ads, etc. This section "sticks" to the top as the page scrolls.',
      table: { category: 'Slots' },
    },
    'slot:skip-to-content': {
      control: false,
      description:
        'The "skip to content" slot. You can override this If you would like to override the `Skip to content` button and add additional "Skip to X", they can be inserted here.',
      table: { category: 'Slots' },
    },
    'slot:footer': {
      control: false,
      description:
        'The content to display in the footer. This is always displayed underneath the viewport so will always make the page "scrollable".',
      table: { category: 'Slots' },
    },
    'method:visiblePixelsInViewport': {
      control: false,
      description:
        'https://stackoverflow.com/a/26831113 This prevents awkward gaps when scrolling the page and the aside / menu dont "fill" the gaps.',
      table: { category: 'Methods' },
    },
    'method:showNavigation': {
      control: false,
      description: 'Shows the mobile navigation drawer',
      table: { category: 'Methods' },
    },
    'method:hideNavigation': {
      control: false,
      description: 'Hides the mobile navigation drawer',
      table: { category: 'Methods' },
    },
    'method:toggleNavigation': {
      control: false,
      description: 'Toggles the mobile navigation drawer',
      table: { category: 'Methods' },
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
