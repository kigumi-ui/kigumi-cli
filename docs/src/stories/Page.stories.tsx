import type { Meta, StoryObj } from '@storybook/react-vite';
import { Page, Button, Icon } from '@/components/ui';

/** Pages offer an easy way to scaffold entire page layouts using minimal markup */
const meta = {
  title: 'Components/Page',
  component: Page,
  tags: ['autodocs', 'pro', 'beta'],
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

/** Visual slot map showing all 11 available slots in `<wa-page>`. */
export const Default: Story = {
  render: (args) => (
    <div>
      <Page {...args}>
        <div
          style={{
            background: 'var(--wa-color-neutral-fill-normal)',
            margin: '0.25rem',
            height: 'calc(100% - 0.5rem)',
            width: 'calc(100%-0.5rem)',
          }}
          className="wa-align-items-center wa-justify-content-center wa-gap-m"
          slot="banner"
        >
          banner
        </div>
        <div
          style={{
            background: 'var(--wa-color-neutral-fill-normal)',
            margin: '0.25rem',
            height: 'calc(100% - 0.5rem)',
            width: 'calc(100%-0.5rem)',
          }}
          className="wa-align-items-center wa-justify-content-center wa-gap-m"
          slot="header"
        >
          header
        </div>
        <div
          style={{
            background: 'var(--wa-color-neutral-fill-normal)',
            margin: '0.25rem',
            height: 'calc(100% - 0.5rem)',
            width: 'calc(100%-0.5rem)',
          }}
          className="wa-align-items-center wa-justify-content-center wa-gap-m"
          slot="subheader"
        >
          subheader
        </div>
        <div
          style={{
            background: 'var(--wa-color-neutral-fill-normal)',
            margin: '0.25rem',
            height: 'calc(100% - 0.5rem)',
            width: 'calc(100%-0.5rem)',
          }}
          className="wa-align-items-center wa-justify-content-center wa-gap-m"
          slot="navigation-header"
        >
          navigation-header
        </div>
        <div
          style={{
            background: 'var(--wa-color-neutral-fill-normal)',
            margin: '0.25rem',
            height: 'calc(100% - 0.5rem)',
            width: 'calc(100%-0.5rem)',
          }}
          className="wa-align-items-center wa-justify-content-center wa-gap-m"
          slot="main-header"
        >
          main-header
        </div>
        <div
          style={{
            background: 'var(--wa-color-neutral-fill-normal)',
            margin: '0.25rem',
            height: 'calc(100% - 0.5rem)',
            width: 'calc(100%-0.5rem)',
          }}
          className="wa-align-items-center wa-justify-content-center wa-gap-m"
          slot="navigation"
        >
          navigation
        </div>
        <div
          style={{
            background: 'var(--wa-color-neutral-fill-normal)',
            margin: '0.25rem',
            height: 'calc(100% - 0.5rem)',
            width: 'calc(100%-0.5rem)',
          }}
          className="wa-align-items-center wa-justify-content-center wa-gap-m"
        >
          (default)
        </div>
        <div
          style={{
            background: 'var(--wa-color-neutral-fill-normal)',
            margin: '0.25rem',
            height: 'calc(100% - 0.5rem)',
            width: 'calc(100%-0.5rem)',
          }}
          className="wa-align-items-center wa-justify-content-center wa-gap-m"
          slot="aside"
        >
          aside
        </div>
        <div
          style={{
            background: 'var(--wa-color-neutral-fill-normal)',
            margin: '0.25rem',
            height: 'calc(100% - 0.5rem)',
            width: 'calc(100%-0.5rem)',
          }}
          className="wa-align-items-center wa-justify-content-center wa-gap-m"
          slot="navigation-footer"
        >
          navigation-footer
        </div>
        <div
          style={{
            background: 'var(--wa-color-neutral-fill-normal)',
            margin: '0.25rem',
            height: 'calc(100% - 0.5rem)',
            width: 'calc(100%-0.5rem)',
          }}
          className="wa-align-items-center wa-justify-content-center wa-gap-m"
          slot="main-footer"
        >
          main-footer
        </div>
        <div
          style={{
            background: 'var(--wa-color-neutral-fill-normal)',
            margin: '0.25rem',
            height: 'calc(100% - 0.5rem)',
            width: 'calc(100%-0.5rem)',
          }}
          className="wa-align-items-center wa-justify-content-center wa-gap-m"
          slot="footer"
        >
          footer
        </div>
      </Page>
    </div>
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
