import type { Meta, StoryObj } from '@storybook/react-vite';
import { PolarAreaChart } from '@/components/ui';

/** Arranges segments of equal angle but varying radius around a central point */
const meta = {
  title: 'Components/Polar Area Chart',
  component: PolarAreaChart,
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
} satisfies Meta<typeof PolarAreaChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const rainfallConfig = {
  data: {
    labels: ['Spring', 'Summer', 'Autumn', 'Winter'],
    datasets: [{ data: [85, 42, 110, 68] }],
  },
};

/** Polar area chart comparing seasonal rainfall amounts in millimetres. */
export const Default: Story = {
  args: { label: 'Seasonal rainfall (mm)' },
  render: (args) => (
    <PolarAreaChart {...args} style={{ height: '300px' }}>
      <script type="application/json">{JSON.stringify(rainfallConfig)}</script>
    </PolarAreaChart>
  ),
};
