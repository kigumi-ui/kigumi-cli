import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Slider } from '@/components/ui';

/**
 * Slider lets users select a numeric value along a track by dragging a thumb. It supports
 * configurable min, max, and step values, a value tooltip above the thumb, step markers
 * along the track, horizontal and vertical orientations, and three sizes. Native form
 * participation means the value is included automatically on form submit.
 */
const meta = {
  title: 'Components/Slider',
  component: Slider,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      table: { defaultValue: { summary: '50' } },
    },
    min: { control: 'number', table: { defaultValue: { summary: '0' } } },
    max: { control: 'number', table: { defaultValue: { summary: '100' } } },
    step: { control: 'number', table: { defaultValue: { summary: '1' } } },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      table: { defaultValue: { summary: 'medium' } },
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      table: { defaultValue: { summary: 'horizontal' } },
    },
    disabled: { control: 'boolean' },
    'with-tooltip': {
      control: 'boolean',
      description: 'Shows value in a tooltip above the thumb',
    },
    'with-markers': {
      control: 'boolean',
      description: 'Shows step markers along the track',
    },
    onChange: { action: 'changed' },
    onInvalid: { action: 'invalid' },
  },
  args: {
    label: 'Volume',
    value: 50,
    min: 0,
    max: 100,
    onChange: fn(),
    onInvalid: fn(),
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A horizontal slider with default range (0 to 100) at 50. */
export const Default: Story = {
  args: { label: 'Volume', value: 50 },
};

/** Shows the current value in a tooltip above the thumb. */
export const WithTooltip: Story = {
  args: { label: 'Brightness', value: 70, 'with-tooltip': true },
};

/** Renders step markers along the track for discrete increments. */
export const WithMarkers: Story = {
  args: {
    label: 'Quality',
    value: 3,
    min: 1,
    max: 5,
    step: 1,
    'with-markers': true,
    'with-tooltip': true,
  },
};

/** A non-interactive disabled slider. */
export const Disabled: Story = {
  args: { label: 'Locked setting', value: 30, disabled: true },
};

/** Configures min, max, and step to fit a temperature control. */
export const CustomRange: Story = {
  args: {
    label: 'Temperature (°C)',
    value: 22,
    min: 16,
    max: 30,
    step: 0.5,
    'with-tooltip': true,
    hint: 'Adjust room temperature',
  },
};

/** Compares small, medium, and large slider sizes. */
export const Sizes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        maxWidth: '400px',
      }}
    >
      <Slider label="Small" size="small" value={40} />
      <Slider label="Medium" size="medium" value={60} />
      <Slider label="Large" size="large" value={80} />
    </div>
  ),
};

/** Rotates the slider to a vertical orientation. */
export const Vertical: Story = {
  args: {
    label: 'Level',
    value: 60,
    orientation: 'vertical',
    'with-tooltip': true,
  },
  render: (args) => (
    <div style={{ height: '200px' }}>
      <Slider {...args} />
    </div>
  ),
};

/** Static snapshot for visual regression testing. */
export const ChromaticOnly: Story = {
  // tags: ['!dev', '!autodocs'],
  parameters: { chromatic: { pauseAnimationAtEnd: true } },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        padding: '1.5rem',
        maxWidth: '400px',
      }}
    >
      <Slider label="Default" value={50} />
      <Slider label="Min/Max" min={0} max={200} value={100} />
      <Slider label="Step" min={0} max={100} step={25} value={50} />
      <Slider label="Disabled" value={40} disabled />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Slider label="Small" size="small" value={30} />
        <Slider label="Medium" size="medium" value={50} />
        <Slider label="Large" size="large" value={70} />
      </div>
    </div>
  ),
};
