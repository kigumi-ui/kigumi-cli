import type { Meta, StoryObj } from '@storybook/react-vite';
import { BubbleChart } from '@/components/ui';

/** Plots three-dimensional data using position and circle size to encode a third variable */
const meta = {
  title: 'Components/Bubble Chart',
  component: BubbleChart,
  tags: ['autodocs', 'pro', 'experimental'],
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
} satisfies Meta<typeof BubbleChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const cityPopulationConfig = {
  data: {
    datasets: [
      {
        label: 'Cities',
        data: [
          { x: 15, y: 72, r: 18 },
          { x: 35, y: 58, r: 12 },
          { x: 55, y: 85, r: 25 },
          { x: 70, y: 42, r: 9 },
          { x: 90, y: 68, r: 15 },
          { x: 25, y: 35, r: 20 },
        ],
      },
    ],
  },
};

/** Bubble chart plotting cities by geographic coordinates with population as bubble size. */
export const Default: Story = {
  args: {
    label: 'City population distribution',
    'x-label': 'Longitude Index',
    'y-label': 'Latitude Index',
  },
  render: (args) => (
    <BubbleChart {...args} style={{ height: '300px' }}>
      <script type="application/json">
        {JSON.stringify(cityPopulationConfig)}
      </script>
    </BubbleChart>
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
      <BubbleChart
        label="City populations"
        without-animation
        style={{ height: '200px', width: '400px' }}
      >
        <script type="application/json">
          {JSON.stringify(cityPopulationConfig)}
        </script>
      </BubbleChart>
    </div>
  ),
};
