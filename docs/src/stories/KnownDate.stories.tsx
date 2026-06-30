import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { KnownDate } from '@/components/ui';

/** Known dates collect a calendar date the user already knows, such as a birthday */
const meta = {
  title: 'Components/KnownDate',
  component: KnownDate,
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'The name of the control, submitted with form data',
    },
    value: {
      control: 'text',
      description: 'The current value as a `YYYY-MM-DD` string',
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
    min: { control: 'text', description: 'The earliest acceptable date' },
    max: { control: 'text', description: 'The latest acceptable date' },
    locale: {
      control: 'text',
      description: 'The locale used to format and parse the date',
    },
    onInput: {
      action: 'input',
      description: 'Emitted as the user types in any field.',
      table: { category: 'Events' },
    },
    onChange: {
      action: 'change',
      description:
        'Emitted when the committed value transitions to a new ISO date.',
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
    onBlur: fn(),
    onFocus: fn(),
    onInvalid: fn(),
  },
} satisfies Meta<typeof KnownDate>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A basic known-date input for collecting a date the user already knows. */
export const Default: Story = {
  args: {
    label: 'Date of birth',
  },
};

/** Includes a label, hint, and a pre-filled value. */
export const WithLabelAndHint: Story = {
  args: {
    label: 'Passport expiry date',
    hint: 'Enter the date exactly as it appears on your passport',
    value: '2028-06-15',
  },
};

/** A required field with a date range constraint. */
export const WithConstraints: Story = {
  args: {
    label: 'Event date',
    hint: 'Must be within the next year',
    required: true,
    min: '2026-01-01',
    max: '2027-12-31',
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
      <KnownDate label="Default" />
      <KnownDate label="With value" value="1990-07-04" />
      <KnownDate label="With hint" hint="Enter your date of birth" />
      <KnownDate label="Disabled" disabled value="1990-07-04" />
      <KnownDate label="Required" required />
    </div>
  ),
};
