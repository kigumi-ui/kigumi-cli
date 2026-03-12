import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chart } from '@/components/ui';

/** Renders interactive data visualisations including bars, lines, pies, and more via Chart.js */
const meta = {
  title: 'Components/Chart',
  component: Chart,
  tags: ['autodocs', 'pro', 'experimental'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Accessible name read by screen readers',
    },
    description: {
      control: 'text',
      description: 'Supplementary accessible description for the chart',
    },
    type: {
      control: 'select',
      options: [
        'bar',
        'line',
        'pie',
        'doughnut',
        'polarArea',
        'radar',
        'scatter',
        'bubble',
      ],
      description: 'Visualisation style to use for the datasets',
      table: { defaultValue: { summary: 'bar' } },
    },
    'x-label': {
      control: 'text',
      description: 'Text label shown along the horizontal axis',
    },
    'y-label': {
      control: 'text',
      description: 'Text label shown along the vertical axis',
    },
    'legend-position': {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left', 'start', 'end'],
      description: 'Where the dataset legend appears around the chart area',
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
      description:
        'Primary axis for categories (swap to create horizontal charts)',
      table: { defaultValue: { summary: 'x' } },
    },
    grid: {
      control: 'select',
      options: ['x', 'y', 'both', 'none'],
      description: 'Controls which background grid lines are visible',
      table: { defaultValue: { summary: 'both' } },
    },
    min: {
      control: 'number',
      description: 'Lower bound for the value axis scale',
    },
    max: {
      control: 'number',
      description: 'Upper bound for the value axis scale',
    },
    'without-animation': {
      control: 'boolean',
      description: 'Turns off entrance and update transitions',
      table: { defaultValue: { summary: 'false' } },
    },
    'without-legend': {
      control: 'boolean',
      description: 'Removes the dataset legend from view',
      table: { defaultValue: { summary: 'false' } },
    },
    'without-tooltip': {
      control: 'boolean',
      description: 'Suppresses hover tooltips on data points',
      table: { defaultValue: { summary: 'false' } },
    },
  },
} satisfies Meta<typeof Chart>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleConfig = {
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      { label: 'Revenue', data: [12, 19, 3, 5, 2, 3] },
      { label: 'Expenses', data: [7, 11, 5, 8, 3, 7] },
    ],
  },
};

/** A basic bar chart with sample data. */
export const Default: Story = {
  args: { type: 'bar', label: 'Monthly data' },
  render: (args) => (
    <Chart {...args} style={{ height: '300px' }}>
      <script type="application/json">{JSON.stringify(sampleConfig)}</script>
    </Chart>
  ),
};

/** A line chart showing trends over time. */
export const LineChart: Story = {
  render: () => (
    <Chart type="line" label="Revenue trend" style={{ height: '300px' }}>
      <script type="application/json">
        {JSON.stringify({
          data: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: [{ label: 'Revenue', data: [30, 45, 28, 60] }],
          },
        })}
      </script>
    </Chart>
  ),
};

/** A pie chart showing distribution. */
export const PieChart: Story = {
  render: () => (
    <Chart type="pie" label="Market share" style={{ height: '300px' }}>
      <script type="application/json">
        {JSON.stringify({
          data: {
            labels: ['Product A', 'Product B', 'Product C'],
            datasets: [{ data: [40, 35, 25] }],
          },
        })}
      </script>
    </Chart>
  ),
};

/** A horizontal bar chart using index-axis. */
export const HorizontalBar: Story = {
  render: () => (
    <Chart type="bar" index-axis="y" label="Scores" style={{ height: '300px' }}>
      <script type="application/json">
        {JSON.stringify({
          data: {
            labels: ['Alice', 'Bob', 'Charlie'],
            datasets: [{ label: 'Score', data: [85, 92, 78] }],
          },
        })}
      </script>
    </Chart>
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
      <Chart
        type="bar"
        label="Bar"
        without-animation
        style={{ height: '200px', width: '300px' }}
      >
        <script type="application/json">{JSON.stringify(sampleConfig)}</script>
      </Chart>
      <Chart
        type="line"
        label="Line"
        without-animation
        style={{ height: '200px', width: '300px' }}
      >
        <script type="application/json">{JSON.stringify(sampleConfig)}</script>
      </Chart>
    </div>
  ),
};
