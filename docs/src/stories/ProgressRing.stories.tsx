import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressRing } from '@/components/ui';

/** Progress rings are used to show the completion of a task in a circular format */
const meta = {
  title: 'Components/Progress Ring',
  component: ProgressRing,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'number',
      description: 'Current progress (0-100)',
      table: { defaultValue: { summary: '0' } },
    },
    label: { control: 'text', description: 'Accessible label' },
  },
} satisfies Meta<typeof ProgressRing>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A ring at 25 % with no center label. */
export const Default: Story = {
  args: { value: 75 },
};

/** Places a percentage value inside the ring. */
export const WithLabel: Story = {
  args: { value: 75, children: '75%' },
};

/** Shows the ring at 0 %, 25 %, 50 %, 75 %, and 100 %. */
export const Values: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      {[0, 25, 50, 75, 100].map((v) => (
        <ProgressRing key={v} value={v} label={`${v}%`}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{v}%</span>
        </ProgressRing>
      ))}
    </div>
  ),
};

/** Compares ring sizes by adjusting the width/height and stroke. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <ProgressRing
        value={65}
        label="Small"
        style={
          { '--size': '48px', '--track-width': '4px' } as React.CSSProperties
        }
      />
      <ProgressRing value={65} label="Medium" />
      <ProgressRing
        value={65}
        label="Large"
        style={
          { '--size': '100px', '--track-width': '8px' } as React.CSSProperties
        }
      />
    </div>
  ),
};

/** Uses multiple rings as a metrics dashboard widget. */
export const Metrics: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      {[
        { label: 'CPU', value: 42, color: 'var(--wa-color-brand-fill-loud)' },
        {
          label: 'Memory',
          value: 78,
          color: 'var(--wa-color-warning-fill-loud)',
        },
        {
          label: 'Storage',
          value: 91,
          color: 'var(--wa-color-danger-fill-loud)',
        },
      ].map(({ label, value, color }) => (
        <div key={label} style={{ textAlign: 'center' }}>
          <ProgressRing
            value={value}
            label={label}
            style={{ '--indicator-color': color } as React.CSSProperties}
          >
            <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>
              {value}%
            </span>
          </ProgressRing>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>{label}</p>
        </div>
      ))}
    </div>
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
        gap: '2rem',
        flexWrap: 'wrap',
        padding: '1.5rem',
        alignItems: 'center',
      }}
    >
      <ProgressRing value={0} />
      <ProgressRing value={25} />
      <ProgressRing value={50} />
      <ProgressRing value={75} />
      <ProgressRing value={100} />
      <ProgressRing
        value={50}
        style={
          { '--size': '80px', '--track-width': '8px' } as React.CSSProperties
        }
      >
        50%
      </ProgressRing>
    </div>
  ),
};
