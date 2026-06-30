import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { TimeInput } from '@/components/ui';

/** Time inputs collect a time of day from the user */
const meta = {
  title: 'Components/TimeInput',
  component: TimeInput,
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'The name of the control, submitted with form data',
    },
    value: {
      control: 'text',
      description: 'The current value as a 24-hour `HH:mm:ss` string',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the control is disabled',
      table: { defaultValue: { summary: 'false' } },
    },
    required: {
      control: 'boolean',
      description: 'Whether a value is required before form submission',
      table: { defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      description: 'Whether the control is read-only',
      table: { defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large', 'xs', 's', 'm', 'l', 'xl'],
      description: 'Controls the overall dimensions of the control',
      table: { defaultValue: { summary: 'medium' } },
    },
    appearance: {
      control: 'select',
      options: ['filled', 'outlined', 'filled-outlined'],
      description: 'The visual style of the control',
      table: { defaultValue: { summary: 'outlined' } },
    },
    pill: {
      control: 'boolean',
      description: 'Draws the control with rounded edges',
      table: { defaultValue: { summary: 'false' } },
    },
    label: {
      control: 'text',
      description: 'The control label. Use the `label` slot for rich labels.',
    },
    hint: {
      control: 'text',
      description:
        'Help text shown below the control. Use the `hint` slot for rich hints.',
    },
    'with-clear': {
      control: 'boolean',
      description: 'Shows a clear button when the control has a value',
      table: { defaultValue: { summary: 'false' } },
    },
    'with-now': {
      control: 'boolean',
      description: 'Shows a button that sets the value to the current time',
      table: { defaultValue: { summary: 'false' } },
    },
    min: { control: 'text', description: 'The earliest acceptable time' },
    max: { control: 'text', description: 'The latest acceptable time' },
    step: {
      control: 'number',
      description: 'The granularity of the value in seconds',
      table: { defaultValue: { summary: '60' } },
    },
    'hour-format': {
      control: 'select',
      options: ['auto', '12', '24'],
      description:
        'Whether to display a 12- or 24-hour clock. `auto` follows the locale.',
      table: { defaultValue: { summary: 'auto' } },
    },
    open: {
      control: 'boolean',
      description: 'Whether the time picker dropdown is open',
      table: { defaultValue: { summary: 'false' } },
    },
    placement: {
      control: 'select',
      options: [
        'top',
        'top-start',
        'top-end',
        'bottom',
        'bottom-start',
        'bottom-end',
      ],
      description: 'The preferred placement of the dropdown',
      table: { defaultValue: { summary: 'bottom-start' } },
    },
    onInput: {
      action: 'input',
      description:
        'Emitted as the user types into a segment or interacts with the popup columns.',
      table: { category: 'Events' },
    },
    onChange: {
      action: 'change',
      description: 'Emitted when the committed value changes.',
      table: { category: 'Events' },
    },
    onFocus: {
      action: 'focus',
      description: 'Emitted when the control receives focus.',
      table: { category: 'Events' },
    },
    onBlur: {
      action: 'blur',
      description: 'Emitted when the control loses focus.',
      table: { category: 'Events' },
    },
    onClear: {
      action: 'clear',
      description: 'Emitted when the clear button is activated.',
      table: { category: 'Events' },
    },
    onShow: {
      action: 'show',
      description: 'Emitted when the popup is about to open. Cancelable.',
      table: { category: 'Events' },
    },
    onAfterShow: {
      action: 'after-show',
      description: 'Emitted after the popup opens and animations complete.',
      table: { category: 'Events' },
    },
    onHide: {
      action: 'hide',
      description: 'Emitted when the popup is about to close. Cancelable.',
      table: { category: 'Events' },
    },
    onAfterHide: {
      action: 'after-hide',
      description: 'Emitted after the popup closes and animations complete.',
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
    onInput: fn(),
    onChange: fn(),
    onFocus: fn(),
    onBlur: fn(),
    onClear: fn(),
    onShow: fn(),
    onAfterShow: fn(),
    onHide: fn(),
    onAfterHide: fn(),
    onInvalid: fn(),
  },
} satisfies Meta<typeof TimeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A basic time input with a label. */
export const Default: Story = {
  args: {
    label: 'Meeting time',
  },
};

/** Shows the clear button and a "Now" shortcut button. */
export const WithClearAndNow: Story = {
  args: {
    label: 'Appointment time',
    'with-clear': true,
    'with-now': true,
    hint: 'Select a time or click Now for the current time',
  },
};

/** Forces 24-hour clock display regardless of locale. */
export const TwentyFourHour: Story = {
  args: {
    label: 'Departure time',
    'hour-format': '24',
    hint: 'Using 24-hour format',
  },
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
      <TimeInput label="Default" />
      <TimeInput label="With value" value="14:30:00" />
      <TimeInput label="With clear" with-clear value="09:00:00" />
      <TimeInput label="Disabled" disabled value="08:00:00" />
      <TimeInput label="Required" required />
    </div>
  ),
};
