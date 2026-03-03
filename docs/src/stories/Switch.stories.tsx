import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Switch } from '@/components/ui';

/** Switches allow the user to toggle an option on or off */
const meta = {
  title: 'Components/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text', description: 'Form field name' },
    value: { control: 'text', description: 'Form value when checked' },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Switch size',
      table: { defaultValue: { summary: 'medium' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the switch',
      table: { defaultValue: { summary: 'false' } },
    },
    checked: {
      control: 'boolean',
      description: 'Whether the switch is on',
      table: { defaultValue: { summary: 'false' } },
    },
    required: {
      control: 'boolean',
      description: 'Makes the switch required',
      table: { defaultValue: { summary: 'false' } },
    },
    hint: { control: 'text', description: 'Hint text' },
    children: { control: 'text' },
    onChange: {
      action: 'change',
      description: "Emitted when the control's checked state changes.",
      table: { category: 'Events' },
    },
    onInput: {
      action: 'input',
      description: 'Emitted when the control receives input.',
      table: { category: 'Events' },
    },
    onBlur: {
      action: 'blur',
      description: 'Emitted when the control loses focus.',
      table: { category: 'Events' },
    },
    onFocus: {
      action: 'focus',
      description: 'Emitted when the control gains focus.',
      table: { category: 'Events' },
    },
    onInvalid: {
      action: 'invalid',
      description:
        "Emitted when the form control has been checked for validity and its constraints aren't satisfied.",
      table: { category: 'Events' },
    },
  },
  args: {
    children: 'Enable feature',
    onChange: fn(),
    onInput: fn(),
    onBlur: fn(),
    onFocus: fn(),
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
