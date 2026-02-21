import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Switch } from '@/components/ui';

/**
 * Switch is a toggle control that represents an on/off boolean state. It is semantically
 * equivalent to a checkbox but communicates immediate effect (like enabling a feature)
 * rather than selection within a list. Supports three sizes, a hint line, and a disabled
 * state. Works with native form submission via the `name` and `value` attributes.
 */
const meta = {
  title: 'Components/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      table: { defaultValue: { summary: 'medium' } },
    },
    hint: { control: 'text' },
    children: { control: 'text' },
    onChange: { action: 'changed' },
    onInvalid: { action: 'invalid' },
  },
  args: {
    children: 'Enable feature',
    onChange: fn(),
    onInvalid: fn(),
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An unchecked switch with a label. */
export const Default: Story = {
  args: { children: 'Dark mode' },
};

/** Shows the switch in the checked (on) state. */
export const Checked: Story = {
  args: { checked: true, children: 'Notifications enabled' },
};

/** A non-interactive disabled switch. */
export const Disabled: Story = {
  args: { disabled: true, children: 'Unavailable option' },
};

/** Compares small, medium, and large switch sizes. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Switch size="small">Small</Switch>
      <Switch size="medium">Medium</Switch>
      <Switch size="large">Large</Switch>
    </div>
  ),
};

/** Adds a hint line below the switch label for context. */
export const WithHint: Story = {
  args: {
    children: 'Email notifications',
    hint: 'Receive updates and announcements via email',
  },
};

/** A practical settings panel with multiple switches. */
export const SettingsList: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '400px',
      }}
    >
      <Switch checked>Email notifications</Switch>
      <Switch>Push notifications</Switch>
      <Switch checked>Weekly digest</Switch>
      <Switch disabled>Beta features (unavailable)</Switch>
    </div>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Switch>Off</Switch>
        <Switch checked>On</Switch>
        <Switch disabled>Disabled</Switch>
        <Switch checked disabled>
          Checked Disabled
        </Switch>
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Switch size="small">Small</Switch>
        <Switch size="medium" checked>
          Medium
        </Switch>
        <Switch size="large" checked>
          Large
        </Switch>
      </div>
    </div>
  ),
};
