import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Switch } from '@/components/ui';

const meta = {
  title: 'Inputs/Switch',
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

export const Default: Story = {
  args: { children: 'Dark mode' },
};

export const Checked: Story = {
  args: { checked: true, children: 'Notifications enabled' },
};

export const Disabled: Story = {
  args: { disabled: true, children: 'Unavailable option' },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Switch size="small">Small</Switch>
      <Switch size="medium">Medium</Switch>
      <Switch size="large">Large</Switch>
    </div>
  ),
};

export const WithHint: Story = {
  args: {
    children: 'Email notifications',
    hint: 'Receive updates and announcements via email',
  },
};

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
