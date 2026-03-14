import type { Meta, StoryObj } from '@storybook/react-vite';
import { LineChart } from '@/components/ui';

/** Connects sequential data points to reveal trends and patterns over a continuous axis */
const meta = {
  title: 'Components/Line Chart',
  component: LineChart,
  tags: ['autodocs', 'pro', 'beta'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Accessible name announced by assistive technology',
    },
    description: {
      control: 'text',
      description: 'Extended accessible description for the chart',
    },
    'x-label': {
      control: 'text',
      description: 'Caption displayed beneath the horizontal axis',
    },
    'y-label': {
      control: 'text',
      description: 'Caption displayed beside the vertical axis',
    },
    'legend-position': {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left', 'start', 'end'],
      description: 'Placement of the dataset legend relative to the chart',
      table: { defaultValue: { summary: 'top' } },
    },
    stacked: {
      control: 'boolean',
      description: 'Layers multiple datasets on a single axis',
      table: { defaultValue: { summary: 'false' } },
    },
    'index-axis': {
      control: 'select',
      options: ['x', 'y'],
      description: 'Base axis for category labels',
      table: { defaultValue: { summary: 'x' } },
    },
    grid: {
      control: 'select',
      options: ['x', 'y', 'both', 'none'],
      description: 'Selects which background grid lines are drawn',
      table: { defaultValue: { summary: 'both' } },
    },
    min: {
      control: 'number',
      description: 'Floor value for the value axis scale',
    },
    max: {
      control: 'number',
      description: 'Ceiling value for the value axis scale',
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
} satisfies Meta<typeof LineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const userGrowthConfig = {
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
    datasets: [
      {
        label: 'Active Users',
        data: [1200, 1450, 1680, 1920, 2340, 2810, 3150, 3600],
      },
    ],
  },
};

/** Line chart tracking monthly active user growth over eight months. */
export const Default: Story = {
  args: { label: 'Monthly user growth' },
  render: (args) => (
    <LineChart {...args} style={{ height: '300px' }}>
      <script type="application/json">
        {JSON.stringify(userGrowthConfig)}
      </script>
    </LineChart>
  ),
};

const revenueExpensesConfig = {
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      { label: 'Revenue', data: [42, 49, 53, 61, 58, 67] },
      { label: 'Expenses', data: [28, 32, 35, 38, 41, 39] },
    ],
  },
};

/** Two overlapping lines comparing revenue against expenses over time. */
export const MultiSeries: Story = {
  render: () => (
    <LineChart
      label="Revenue vs expenses (thousands)"
      style={{ height: '300px' }}
    >
      <script type="application/json">
        {JSON.stringify(revenueExpensesConfig)}
      </script>
    </LineChart>
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
        gap: '2rem',
        flexWrap: 'wrap',
        padding: '1.5rem',
      }}
    >
      <LineChart
        label="Single series"
        without-animation
        style={{ height: '200px', width: '300px' }}
      >
        <script type="application/json">
          {JSON.stringify(userGrowthConfig)}
        </script>
      </LineChart>
      <LineChart
        label="Multi series"
        without-animation
        style={{ height: '200px', width: '300px' }}
      >
        <script type="application/json">
          {JSON.stringify(revenueExpensesConfig)}
        </script>
      </LineChart>
    </div>
  ),
};
