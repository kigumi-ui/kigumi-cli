import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadarChart } from '@/components/ui';

/** Maps multiple variables onto radial axes to compare profiles at a glance */
const meta = {
  title: 'Components/RadarChart',
  component: RadarChart,
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
    stacked: {
      control: 'boolean',
      description: 'Layers multiple datasets on a single axis',
      table: { defaultValue: { summary: 'false' } },
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
} satisfies Meta<typeof RadarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const featureComparisonConfig = {
  data: {
    labels: [
      'Performance',
      'Reliability',
      'Usability',
      'Security',
      'Scalability',
      'Cost',
    ],
    datasets: [
      { label: 'Product Alpha', data: [88, 72, 91, 65, 78, 82] },
      { label: 'Product Beta', data: [75, 85, 68, 90, 84, 70] },
    ],
  },
};

/** Radar chart comparing two products across six feature dimensions. */
export const Default: Story = {
  args: { label: 'Product feature comparison' },
  render: (args) => (
    <RadarChart {...args} style={{ height: '300px' }}>
      <script type="application/json">
        {JSON.stringify(featureComparisonConfig)}
      </script>
    </RadarChart>
  ),
};

const skillAssessmentConfig = {
  data: {
    labels: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'CSS', 'Testing'],
    datasets: [{ label: 'Skill Level', data: [92, 85, 88, 70, 78, 65] }],
  },
};

/** Single-dataset radar showing an individual skill assessment profile. */
export const SingleProfile: Story = {
  render: () => (
    <RadarChart label="Developer skill assessment" style={{ height: '300px' }}>
      <script type="application/json">
        {JSON.stringify(skillAssessmentConfig)}
      </script>
    </RadarChart>
  ),
};
