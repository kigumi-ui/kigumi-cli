import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressBar } from '@/components/ui';

const meta = {
  title: 'Display/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Progress percentage (0–100)',
      table: { defaultValue: { summary: '0' } },
    },
    indeterminate: {
      control: 'boolean',
      description: 'Shows an animated indeterminate state',
    },
    label: { control: 'text', description: 'Label for assistive devices' },
    children: { control: 'text', description: 'Content shown inside the bar' },
  },
  args: { value: 50 },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 50 },
};

export const WithLabel: Story = {
  args: { value: 75, children: '75%' },
};

export const Indeterminate: Story = {
  args: { indeterminate: true },
};

export const Values: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '400px',
      }}
    >
      <ProgressBar value={0} label="0%">
        <span slot="label">0%</span>
      </ProgressBar>
      <ProgressBar value={25} label="25%">
        <span slot="label">25%</span>
      </ProgressBar>
      <ProgressBar value={50} label="50%">
        <span slot="label">50%</span>
      </ProgressBar>
      <ProgressBar value={75} label="75%">
        <span slot="label">75%</span>
      </ProgressBar>
      <ProgressBar value={100} label="100%">
        <span slot="label">100%</span>
      </ProgressBar>
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
        gap: '1rem',
        padding: '1.5rem',
        maxWidth: '400px',
      }}
    >
      <ProgressBar value={0} label="0%" />
      <ProgressBar value={25} label="25%" />
      <ProgressBar value={50} label="50%">
        50%
      </ProgressBar>
      <ProgressBar value={75} label="75%" />
      <ProgressBar value={100} label="100%" />
      <ProgressBar indeterminate label="Loading..." />
    </div>
  ),
};
