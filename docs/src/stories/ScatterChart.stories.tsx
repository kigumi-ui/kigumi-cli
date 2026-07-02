import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScatterChart } from '@/components/ui';

/** Positions individual data points by two numeric axes to expose correlations */
const meta = {
  title: 'Components/ScatterChart',
  component: ScatterChart,
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
} satisfies Meta<typeof ScatterChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const studyScoresConfig = {
  data: {
    datasets: [
      {
        label: 'Students',
        data: [
          { x: 2, y: 55 },
          { x: 3, y: 62 },
          { x: 4, y: 68 },
          { x: 5, y: 74 },
          { x: 6, y: 78 },
          { x: 7, y: 82 },
          { x: 8, y: 88 },
          { x: 3.5, y: 60 },
          { x: 5.5, y: 71 },
          { x: 6.5, y: 80 },
          { x: 4.5, y: 65 },
          { x: 7.5, y: 85 },
        ],
      },
    ],
  },
};

/** Scatter chart plotting study hours against test scores to reveal correlation. */
export const Default: Story = {
  args: {
    label: 'Study hours vs test scores',
    'x-label': 'Hours Studied',
    'y-label': 'Test Score',
  },
  render: (args) => (
    <ScatterChart {...args} style={{ height: '300px' }}>
      <script type="application/json">
        {JSON.stringify(studyScoresConfig)}
      </script>
    </ScatterChart>
  ),
};
