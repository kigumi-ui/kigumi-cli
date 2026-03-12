import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkline } from '@/components/ui';

/** Sparklines are small inline data visualizations for showing trends */
const meta = {
  title: 'Components/Sparkline',
  component: Sparkline,
  tags: ['autodocs', 'pro', 'experimental'],
  argTypes: {
    data: {
      control: 'text',
      description: 'Space-separated numeric data points',
    },
    label: {
      control: 'text',
      description: 'An accessible label for assistive devices',
    },
    appearance: {
      control: 'select',
      options: ['gradient', 'line', 'solid'],
      description: 'Visual style of the sparkline',
      table: { defaultValue: { summary: 'line' } },
    },
    trend: {
      control: 'select',
      options: ['positive', 'negative', 'neutral'],
      description: 'Trend direction, used for coloring',
    },
    curve: {
      control: 'select',
      options: ['linear', 'natural', 'step'],
      description: 'Interpolation curve style',
      table: { defaultValue: { summary: 'natural' } },
    },
  },
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A gradient sparkline with a sample data series. */
export const Default: Story = {
  args: {
    data: '10 20 30 25 40 15 35 45 30 20',
    appearance: 'gradient',
  },
};

/** Compares gradient, line, and solid appearance styles side by side. */
export const Appearances: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-end' }}>
      {(['gradient', 'line', 'solid'] as const).map((appearance) => (
        <div key={appearance} style={{ textAlign: 'center' }}>
          <Sparkline
            data="10 20 30 25 40 15 35 45 30 20"
            appearance={appearance}
            style={{ display: 'block', width: '120px', height: '40px' }}
          />
          <div
            style={{
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--wa-color-neutral-text-subtle)',
            }}
          >
            {appearance}
          </div>
        </div>
      ))}
    </div>
  ),
};

/** Uses the trend prop to apply semantic coloring for growth, decline, or stability. */
export const Trends: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {(
        [
          { trend: 'positive', data: '5 15 10 25 20 35 30 40' },
          { trend: 'negative', data: '40 30 35 20 25 10 15 5' },
          { trend: 'neutral', data: '20 25 22 28 24 30 26 32' },
        ] as const
      ).map(({ trend, data }) => (
        <div
          key={trend}
          style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
        >
          <span
            style={{
              width: '72px',
              fontSize: '0.875rem',
              color: 'var(--wa-color-neutral-text-subtle)',
            }}
          >
            {trend}
          </span>
          <Sparkline
            data={data}
            trend={trend}
            style={{ display: 'block', width: '160px', height: '36px' }}
          />
        </div>
      ))}
    </div>
  ),
};

/** Compares linear, natural, and step curve interpolation styles. */
export const Curves: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-end' }}>
      {(['linear', 'natural', 'step'] as const).map((curve) => (
        <div key={curve} style={{ textAlign: 'center' }}>
          <Sparkline
            data="10 30 15 40 20 35 25 45"
            curve={curve}
            style={{ display: 'block', width: '120px', height: '40px' }}
          />
          <div
            style={{
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--wa-color-neutral-text-subtle)',
            }}
          >
            {curve}
          </div>
        </div>
      ))}
    </div>
  ),
};

/** Uses CSS custom properties to apply custom line and fill colors. */
export const WithCustomColors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Sparkline
        data="5 15 10 25 20 35 30 40"
        style={
          {
            display: 'block',
            width: '160px',
            height: '36px',
            '--line-color': 'var(--wa-color-success-600)',
            '--fill-color': 'var(--wa-color-success-200)',
          } as React.CSSProperties
        }
      />
      <Sparkline
        data="40 30 35 20 25 10 15 5"
        style={
          {
            display: 'block',
            width: '160px',
            height: '36px',
            '--line-color': 'var(--wa-color-danger-600)',
            '--fill-color': 'var(--wa-color-danger-200)',
          } as React.CSSProperties
        }
      />
    </div>
  ),
};

/** Renders sparklines inline with metric labels for dashboard usage. */
export const InlineDashboard: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '1rem',
        background: 'var(--wa-color-neutral-fill-subtle)',
        borderRadius: '0.5rem',
        maxWidth: '320px',
      }}
    >
      {[
        {
          label: 'Revenue',
          value: '$12.4k',
          data: '10 20 30 25 40 35 45',
          trend: 'positive' as const,
        },
        {
          label: 'Churn',
          value: '3.2%',
          data: '5 8 6 10 9 12 11',
          trend: 'negative' as const,
        },
        {
          label: 'Sessions',
          value: '8,241',
          data: '30 25 35 40 38 42 45',
          trend: 'neutral' as const,
        },
      ].map(({ label, value, data, trend }) => (
        <div
          key={label}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--wa-color-neutral-text-subtle)',
              }}
            >
              {label}
            </div>
            <div style={{ fontWeight: 600 }}>{value}</div>
          </div>
          <Sparkline
            data={data}
            trend={trend}
            style={{ display: 'block', width: '80px', height: '28px' }}
          />
        </div>
      ))}
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
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {(['gradient', 'line', 'solid'] as const).map((appearance) => (
          <div key={appearance} style={{ textAlign: 'center' }}>
            <Sparkline
              data="10 20 30 25 40 15 35"
              appearance={appearance}
              style={{ display: 'block', width: '100px', height: '36px' }}
            />
            <div
              style={{
                fontSize: '0.75rem',
                marginTop: '0.25rem',
                color: 'var(--wa-color-neutral-text-subtle)',
              }}
            >
              {appearance}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Sparkline
          data="10 20 30 25 40 35 45"
          trend="positive"
          style={{ display: 'block', width: '160px', height: '36px' }}
        />
        <Sparkline
          data="40 30 25 20 15 10 5"
          trend="negative"
          style={{ display: 'block', width: '160px', height: '36px' }}
        />
        <Sparkline
          data="20 25 22 28 24 30 26 32"
          trend="neutral"
          style={{ display: 'block', width: '160px', height: '36px' }}
        />
      </div>
    </div>
  ),
};
