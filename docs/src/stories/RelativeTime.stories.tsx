import type { Meta, StoryObj } from '@storybook/react-vite';
import { RelativeTime } from '@/components/ui';

const now = new Date();
const minuteAgo = new Date(now.getTime() - 60 * 1000);
const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
const inHour = new Date(now.getTime() + 60 * 60 * 1000);
const inDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);

const meta = {
  title: 'Data/RelativeTime',
  component: RelativeTime,
  tags: ['autodocs'],
  argTypes: {
    format: {
      control: 'select',
      options: ['long', 'short', 'narrow'],
      table: { defaultValue: { summary: 'long' } },
    },
    numeric: {
      control: 'select',
      options: ['always', 'auto'],
      table: { defaultValue: { summary: 'always' } },
    },
    sync: {
      control: 'boolean',
      description: 'Automatically update as time passes',
    },
  },
  args: { date: minuteAgo },
} satisfies Meta<typeof RelativeTime>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Formats: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {(['long', 'short', 'narrow'] as const).map((f) => (
        <div
          key={f}
          style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
        >
          <span style={{ width: '80px', color: 'var(--wa-color-neutral-600)' }}>
            {f}:
          </span>
          <RelativeTime date={hourAgo} format={f} />
        </div>
      ))}
    </div>
  ),
};

export const PastAndFuture: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {[
        { label: '1 minute ago', date: minuteAgo },
        { label: '1 hour ago', date: hourAgo },
        { label: '1 day ago', date: dayAgo },
        { label: '1 week ago', date: weekAgo },
        { label: '1 month ago', date: monthAgo },
        { label: 'In 1 hour', date: inHour },
        { label: 'In 1 day', date: inDay },
      ].map(({ label, date }) => (
        <div key={label} style={{ display: 'flex', gap: '1rem' }}>
          <span
            style={{ width: '140px', color: 'var(--wa-color-neutral-600)' }}
          >
            {label}:
          </span>
          <RelativeTime date={date} />
        </div>
      ))}
    </div>
  ),
};

export const NumericAuto: Story = {
  args: { date: dayAgo, numeric: 'auto' },
};

export const LiveSync: Story = {
  args: { date: minuteAgo, sync: true },
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
      }}
    >
      <div>
        <RelativeTime date={new Date(Date.now() - 60000)} />
      </div>
      <div>
        <RelativeTime date={new Date(Date.now() - 3600000)} />
      </div>
      <div>
        <RelativeTime date={new Date(Date.now() - 86400000)} />
      </div>
      <div>
        <RelativeTime date={new Date(Date.now() + 3600000)} />
      </div>
    </div>
  ),
};
