import type { Meta, StoryObj } from '@storybook/react-vite';
import { BarChart } from '@/components/ui';

/**
 * Displays categorical data as horizontal or vertical rectangular bars scaled to their
 * values
 */
const meta = {
  title: 'Components/BarChart',
  component: BarChart,
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
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
      description: 'Controls whether bars grow upward or sideways',
      table: { defaultValue: { summary: 'vertical' } },
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
      description:
        'Base axis for category labels (swap to flip chart orientation)',
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
} satisfies Meta<typeof BarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const quarterlySalesConfig = {
  data: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      { label: 'Online', data: [48, 62, 55, 71] },
      { label: 'In-Store', data: [35, 41, 38, 52] },
    ],
  },
};

/** Vertical bar chart showing quarterly sales across two channels. */
export const Default: Story = {
  args: { label: 'Quarterly sales breakdown' },
  render: (args) => (
    <BarChart {...args} style={{ height: '300px' }}>
      <script type="application/json">
        {JSON.stringify(quarterlySalesConfig)}
      </script>
    </BarChart>
  ),
};

const teamPerformanceConfig = {
  data: {
    labels: ['Engineering', 'Design', 'Marketing', 'Sales', 'Support'],
    datasets: [{ label: 'Completed Tasks', data: [134, 87, 112, 96, 78] }],
  },
};

/** Horizontal bars comparing completed tasks by department. */
export const Horizontal: Story = {
  render: () => (
    <BarChart
      orientation="horizontal"
      label="Department task completion"
      style={{ height: '300px' }}
    >
      <script type="application/json">
        {JSON.stringify(teamPerformanceConfig)}
      </script>
    </BarChart>
  ),
};

const stackedConfig = {
  data: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      { label: 'Bug Fixes', data: [5, 8, 3, 7, 4] },
      { label: 'Features', data: [3, 2, 6, 4, 5] },
      { label: 'Refactors', data: [2, 1, 4, 2, 3] },
    ],
  },
};

/** Stacked bars breaking down daily development work by category. */
export const Stacked: Story = {
  render: () => (
    <BarChart
      stacked
      label="Weekly development activity"
      style={{ height: '300px' }}
    >
      <script type="application/json">{JSON.stringify(stackedConfig)}</script>
    </BarChart>
  ),
};
