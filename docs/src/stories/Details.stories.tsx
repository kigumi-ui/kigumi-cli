import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Details, Icon } from '@/components/ui';

/** Shows a brief summary and expands to show additional content */
const meta = {
  title: 'Components/Details',
  component: Details,
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the details are expanded',
      table: { defaultValue: { summary: 'false' } },
    },
    summary: { control: 'text', description: 'Summary text shown in header' },
    disabled: {
      control: 'boolean',
      description: 'Disables the details',
      table: { defaultValue: { summary: 'false' } },
    },
    appearance: {
      control: 'select',
      options: ['filled', 'outlined', 'filled-outlined', 'plain'],
      description: 'Visual appearance style',
      table: { defaultValue: { summary: 'outlined' } },
    },
    'icon-placement': {
      control: 'select',
      options: ['start', 'end'],
      description: 'Position of the expand icon',
      table: { defaultValue: { summary: 'end' } },
    },
    name: { control: 'text', description: 'Name for accordion grouping' },
    children: { control: 'text' },
    onShow: {
      action: 'show',
      description: 'Emitted when the details opens.',
      table: { category: 'Events' },
    },
    onAfterShow: {
      action: 'after-show',
      description:
        'Emitted after the details opens and all animations are complete.',
      table: { category: 'Events' },
    },
    onHide: {
      action: 'hide',
      description: 'Emitted when the details closes.',
      table: { category: 'Events' },
    },
    onAfterHide: {
      action: 'after-hide',
      description:
        'Emitted after the details closes and all animations are complete.',
      table: { category: 'Events' },
    },
  },
  args: {
    children: 'This is the expanded content.',
    onShow: fn(),
    onAfterShow: fn(),
    onHide: fn(),
    onAfterHide: fn(),
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
