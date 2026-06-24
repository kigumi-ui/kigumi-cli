import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent } from 'storybook/test';
import { Slider } from '@/components/ui';
import { installEventProbe, waitForCalled } from '@/test-utils/play-helpers';

/** Sliders allow the user to select a value within a range */
const meta = {
  title: 'Components/Slider',
  component: Slider,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text', description: 'Form field name' },
    value: {
      control: 'number',
      description: 'Current value',
      table: { defaultValue: { summary: '0' } },
    },
    label: { control: 'text', description: 'Accessible label' },
    hint: { control: 'text', description: 'Hint text' },
    min: {
      control: 'number',
      description: 'Minimum value',
      table: { defaultValue: { summary: '0' } },
    },
    max: {
      control: 'number',
      description: 'Maximum value',
      table: { defaultValue: { summary: '100' } },
    },
    step: {
      control: 'number',
      description: 'Step increment',
      table: { defaultValue: { summary: '1' } },
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'The orientation of the slider',
      table: { defaultValue: { summary: 'horizontal' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the slider',
      table: { defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      description: 'Makes the slider readonly',
      table: { defaultValue: { summary: 'false' } },
    },
    range: {
      control: 'boolean',
      description: 'Converts to a range slider with two thumbs',
      table: { defaultValue: { summary: 'false' } },
    },
    'with-markers': {
      control: 'boolean',
      description: 'Draws markers at each step',
      table: { defaultValue: { summary: 'false' } },
    },
    'with-tooltip': {
      control: 'boolean',
      description: 'Draws a tooltip above the thumb',
      table: { defaultValue: { summary: 'true' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large', 'xs', 's', 'm', 'l', 'xl'],
      description: 'Slider size',
      table: { defaultValue: { summary: 'medium' } },
    },
    onChange: {
      action: 'change',
      description:
        "Emitted when an alteration to the control's value is committed by the user.",
      table: { category: 'Events' },
    },
    onBlur: {
      action: 'blur',
      description: 'Emitted when the control loses focus.',
      table: { category: 'Events' },
    },
    onFocus: {
      action: 'focus',
      description: 'Emitted when the control gains focus.',
      table: { category: 'Events' },
    },
    onInput: {
      action: 'input',
      description: 'Emitted when the control receives input.',
      table: { category: 'Events' },
    },
    onInvalid: {
      action: 'invalid',
      description:
        "Emitted when the form control has been checked for validity and its constraints aren't satisfied.",
      table: { category: 'Events' },
    },
  },
  args: {
    onChange: fn(),
    onBlur: fn(),
    onFocus: fn(),
    onInput: fn(),
    onInvalid: fn(),
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A horizontal slider with default range (0 to 100) at 50. */
export const Default: Story = {
  tags: ['interaction'],
  args: { label: 'Volume', value: 50 },
  // Drive the slider via keyboard rather than drag geometry to avoid layout
  // flake; ArrowRight increments the committed value and fires `change`.
  play: async ({ args, canvasElement }) => {
    const host = canvasElement.querySelector<HTMLElement>('wa-slider');
    if (!host) throw new Error('wa-slider not found');
    await (host as HTMLElement & { updateComplete?: Promise<unknown> })
      .updateComplete;
    const cleanup = installEventProbe(host, 'change', args.onChange);
    host.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitForCalled(args, 'onChange');
    cleanup();
  },
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
  tags: ['!dev', '!autodocs'],
  parameters: {
    chromatic: { disableSnapshot: false, pauseAnimationAtEnd: true },
  },
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
