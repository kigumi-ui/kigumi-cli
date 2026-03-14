import type { Meta, StoryObj } from '@storybook/react-vite';
import { DoughnutChart } from '@/components/ui';

/** Shows proportional segments in a ring shape with an open center for summary content */
const meta = {
  title: 'Components/Doughnut Chart',
  component: DoughnutChart,
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
} satisfies Meta<typeof DoughnutChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const timeAllocationConfig = {
  data: {
    labels: ['Development', 'Meetings', 'Code Review', 'Planning', 'Testing'],
    datasets: [{ data: [40, 15, 20, 10, 15] }],
  },
};

/** Doughnut chart showing how project time is divided among activities. */
export const Default: Story = {
  args: { label: 'Project time allocation' },
  render: (args) => (
    <DoughnutChart {...args} style={{ height: '300px' }}>
      <script type="application/json">
        {JSON.stringify(timeAllocationConfig)}
      </script>
    </DoughnutChart>
  ),
};

const energySourcesConfig = {
  data: {
    labels: ['Solar', 'Wind', 'Hydro', 'Nuclear', 'Natural Gas', 'Coal'],
    datasets: [{ data: [22, 18, 16, 12, 20, 12] }],
  },
};

/** Six-segment doughnut illustrating energy source distribution. */
export const MultiSegment: Story = {
  render: () => (
    <DoughnutChart label="Energy sources breakdown" style={{ height: '300px' }}>
      <script type="application/json">
        {JSON.stringify(energySourcesConfig)}
      </script>
    </DoughnutChart>
  ),
};

/** Static snapshot for visual regression testing. */
export const ChromaticOnly: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: {
    chromatic: { disableSnapshot: false, pauseAnimationAtEnd: true },
  },
  render: () => (
    <div style={{ padding: '1.5rem' }}>
      <DoughnutChart
        label="Time allocation"
        without-animation
        style={{ height: '200px', width: '300px' }}
      >
        <script type="application/json">
          {JSON.stringify(timeAllocationConfig)}
        </script>
      </DoughnutChart>
    </div>
  ),
};
