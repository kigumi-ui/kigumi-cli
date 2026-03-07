import type { Meta, StoryObj } from '@storybook/react-vite';
import { PieChart } from '@/components/ui';

/** Divides a circle into wedges that represent each category's share of the whole */
const meta = {
  title: 'Components/Pie Chart',
  component: PieChart,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Accessible name announced by assistive technology',
    },
    description: {
      control: 'text',
      description: 'Extended accessible description for the chart',
    },
    'legend-position': {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left', 'start', 'end'],
      description: 'Placement of the dataset legend relative to the chart',
      table: { defaultValue: { summary: 'top' } },
    },
    'without-animation': {
      control: 'boolean',
      description: 'Disables entrance and update motion effects',
      table: { defaultValue: { summary: 'false' } },
    },
    'without-legend': {
      control: 'boolean',
      description: 'Hides the dataset legend entirely',
      table: { defaultValue: { summary: 'false' } },
    },
    'without-tooltip': {
      control: 'boolean',
      description: 'Prevents hover tooltips from appearing on data points',
      table: { defaultValue: { summary: 'false' } },
    },
  },
} satisfies Meta<typeof PieChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const browserShareConfig = {
  data: {
    labels: ['Chrome', 'Safari', 'Firefox', 'Edge', 'Other'],
    datasets: [{ data: [64, 19, 4, 5, 8] }],
  },
};

/** Pie chart displaying browser market share distribution. */
export const Default: Story = {
  args: { label: 'Browser market share' },
  render: (args) => (
    <PieChart {...args} style={{ height: '300px' }}>
      <script type="application/json">
        {JSON.stringify(browserShareConfig)}
      </script>
    </PieChart>
  ),
};

const threeWayConfig = {
  data: {
    labels: ['Frontend', 'Backend', 'DevOps'],
    datasets: [{ data: [33, 33, 34] }],
  },
};

/** Three nearly equal segments showing balanced team allocation. */
export const ThreeWay: Story = {
  render: () => (
    <PieChart label="Team allocation" style={{ height: '300px' }}>
      <script type="application/json">{JSON.stringify(threeWayConfig)}</script>
    </PieChart>
  ),
};

/** Static snapshot for visual regression testing. */
export const ChromaticOnly: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { chromatic: { pauseAnimationAtEnd: true } },
  render: () => (
    <div style={{ padding: '1.5rem' }}>
      <PieChart
        label="Browser share"
        without-animation
        style={{ height: '200px', width: '300px' }}
      >
        <script type="application/json">
          {JSON.stringify(browserShareConfig)}
        </script>
      </PieChart>
    </div>
  ),
};
