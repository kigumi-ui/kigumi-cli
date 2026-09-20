import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent } from 'storybook/test';
import { OtpInput } from '@/components/ui';
import { installEventProbe, waitForCalled } from '@/test-utils/play-helpers';

/**
 * OTP inputs collect one-time passcodes, PINs, and other fixed-length codes, one character
 * per segment
 */
const meta = {
  title: 'Components/OTP Input',
  component: OtpInput,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text', description: 'A label shown above the segments' },
    hint: {
      control: 'text',
      description: 'Hint text shown below the segments',
    },
    value: {
      control: 'text',
      description: 'The current value of the OTP field',
    },
    length: {
      control: 'number',
      description:
        'Number of character segments to display. Overridden by format when set',
      table: { defaultValue: { summary: '6' } },
    },
    format: {
      control: 'text',
      description:
        'Segment format using # as a placeholder; other characters are literal separators',
    },
    type: {
      control: 'select',
      options: ['numeric', 'alpha', 'alphanumeric'],
      description: 'Allowed character class',
      table: { defaultValue: { summary: 'numeric' } },
    },
    case: {
      control: 'select',
      options: ['preserve', 'upper', 'lower'],
      description: 'Case transformation applied to entered characters',
      table: { defaultValue: { summary: 'preserve' } },
    },
    appearance: {
      control: 'select',
      options: ['outlined', 'filled', 'filled-outlined', 'contained'],
      description: 'Visual appearance of the segments',
      table: { defaultValue: { summary: 'outlined' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large', 'xs', 's', 'm', 'l', 'xl'],
      description: 'The size of each segment',
      table: { defaultValue: { summary: 'medium' } },
    },
    mask: {
      control: 'boolean',
      description:
        'Displays entered characters as a mask instead of their real value',
      table: { defaultValue: { summary: 'false' } },
    },
    'with-mask': {
      control: 'boolean',
      description: 'Shows a mask character in empty segments as a length hint',
      table: { defaultValue: { summary: 'false' } },
    },
    autocomplete: {
      control: 'text',
      description:
        'The autocomplete attribute forwarded to the underlying input',
      table: { defaultValue: { summary: 'one-time-code' } },
    },
    autosubmit: {
      control: 'boolean',
      description:
        'Submits the form automatically once all segments are filled',
      table: { defaultValue: { summary: 'false' } },
    },
    required: {
      control: 'boolean',
      description: 'Makes the field required',
      table: { defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      description: 'Makes the field readonly',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the form control',
      table: { defaultValue: { summary: 'false' } },
    },
    name: {
      control: 'text',
      description: 'The name of the input, submitted with form data',
    },
    onInput: {
      action: 'input',
      description: 'Emitted when a character is entered or removed.',
      table: { category: 'Events' },
    },
    onChange: {
      action: 'change',
      description: 'Emitted when the value changes and the field loses focus.',
      table: { category: 'Events' },
    },
    onFocus: {
      action: 'focus',
      description: 'Emitted when the control gains focus.',
      table: { category: 'Events' },
    },
    onBlur: {
      action: 'blur',
      description: 'Emitted when the control loses focus.',
      table: { category: 'Events' },
    },
    onComplete: {
      action: 'complete',
      description:
        'Emitted once when all segments are filled. Cancelable — call `preventDefault()` to stop `autosubmit` from submitting the form for this completion.',
      table: { category: 'Events' },
    },
    onClear: {
      action: 'clear',
      description: "Emitted when the control's value is cleared.",
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
    onComplete: fn(),
    onClear: fn(),
    onInvalid: fn(),
  },
} satisfies Meta<typeof OtpInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A six-segment numeric code field with a label. */
export const Default: Story = {
  tags: ['interaction'],
  args: { label: 'Verification code' },
  play: async ({ args, canvasElement }) => {
    const host = canvasElement.querySelector<HTMLElement>('wa-otp-input');
    if (!host) throw new Error('wa-otp-input not found');
    const cleanup = installEventProbe(host, 'input', args.onInput);
    const innerInput =
      host.shadowRoot?.querySelector<HTMLInputElement>('input');
    if (!innerInput) throw new Error('wa-otp-input shadow input not found');
    innerInput.focus();
    await userEvent.keyboard('123456');
    await waitForCalled(args, 'onInput');
    cleanup();
  },
};

/** Restricts input to letters. */
export const Alpha: Story = {
  args: { label: 'Invite code', type: 'alpha', length: 4 },
};

/** Groups segments with a format string. */
export const Formatted: Story = {
  args: { label: 'Code', format: '### ###' },
};

/** Masks entered characters like a PIN field. */
export const Masked: Story = {
  args: { label: 'PIN', mask: true, length: 4 },
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
        gap: '1.5rem',
        padding: '1.5rem',
        maxWidth: '400px',
      }}
    >
      <OtpInput label="Default" />
      <OtpInput label="Four digits" length={4} />
      <OtpInput label="Formatted" format="### ###" />
      <OtpInput label="Alpha" type="alpha" length={4} />
      <OtpInput label="Masked PIN" mask length={4} />
      <OtpInput label="With hint" hint="Check your SMS" />
      <OtpInput label="Disabled" disabled value="123456" />
    </div>
  ),
};
