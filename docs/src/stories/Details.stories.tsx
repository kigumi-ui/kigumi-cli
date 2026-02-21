import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Details, Icon } from '@/components/ui';

/**
 * Details is a collapsible disclosure widget with a summary trigger and an expandable body.
 * It can start open or closed, supports multiple appearance styles, and allows a custom
 * summary element to replace the plain-text trigger. Ideal for FAQs, advanced options, and
 * any content that benefits from progressive disclosure.
 */
const meta = {
  title: 'Components/Details',
  component: Details,
  tags: ['autodocs'],
  argTypes: {
    summary: { control: 'text' },
    open: { control: 'boolean' },
    disabled: { control: 'boolean' },
    appearance: {
      control: 'select',
      options: ['filled', 'outlined', 'filled-outlined', 'plain'],
      table: { defaultValue: { summary: 'outlined' } },
    },
    'icon-placement': {
      control: 'select',
      options: ['start', 'end'],
      table: { defaultValue: { summary: 'end' } },
    },
    children: { control: 'text' },
    onShow: { action: 'show' },
    onHide: { action: 'hide' },
  },
  args: {
    summary: 'Click to expand',
    children: 'This is the expanded content.',
    onShow: fn(),
    onHide: fn(),
  },
} satisfies Meta<typeof Details>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A collapsed details panel with a summary trigger. */
export const Default: Story = {
  args: {
    summary: 'What is Kigumi?',
    children:
      'Kigumi is a CLI to build framework-agnostic UIs. It provides ready-made web components for your design system. Same components, any stack.',
  },
};

/** The panel starts in the open/expanded state. */
export const DefaultOpen: Story = {
  args: {
    summary: 'Already open',
    open: true,
    children: 'This details panel starts open.',
  },
};

/** Compares available visual appearance styles. */
export const Appearances: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {(['outlined', 'filled-outlined', 'filled', 'plain'] as const).map(
        (a) => (
          <Details key={a} appearance={a} summary={`Appearance: ${a}`}>
            Content for the <strong>{a}</strong> appearance.
          </Details>
        )
      )}
    </div>
  ),
};

/** Moves the expand/collapse icon to the start of the summary. */
export const IconStart: Story = {
  args: {
    summary: 'Icon at start',
    'icon-placement': 'start',
    children: 'The expand/collapse icon is on the left.',
  },
};

/** Multiple details items arranged as a FAQ accordion. */
export const FAQ: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '600px',
      }}
    >
      <Details summary="How do I install the CLI?" appearance="filled-outlined">
        Run <code>npx kigumi init</code> in your project directory to get
        started.
      </Details>
      <Details
        summary="Which frameworks are supported?"
        appearance="filled-outlined"
      >
        Kigumi supports React (TypeScript &amp; JavaScript) and Vue 3.
      </Details>
      <Details summary="Is it free?" appearance="filled-outlined">
        Yes! The core component set is free and open source.
      </Details>
      <Details summary="Can I customize themes?" appearance="filled-outlined">
        Absolutely. Use <code>kigumi theme</code> command or the visual Kigumi
        Studio tool.
      </Details>
    </div>
  ),
};

/** Replaces the default summary text with a rich custom element. */
export const WithCustomSummary: Story = {
  render: () => (
    <Details summary="Advanced Settings" appearance="outlined">
      <div
        slot="summary"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <Icon name="gear" />
        <span>Advanced Settings</span>
      </div>
      Fine-grained control over component behaviour and appearance.
    </Details>
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
      <Details summary="Default Details">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </Details>
      <Details summary="Open by Default" open>
        This details panel is open by default.
      </Details>
      <Details summary="Disabled" disabled>
        This details panel is disabled.
      </Details>
      <Details open>
        <div slot="summary">
          <Icon name="gear" /> Custom Summary
        </div>
        Content with custom summary icon.
      </Details>
    </div>
  ),
};
