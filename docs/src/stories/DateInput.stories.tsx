import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateInput } from '@/components/ui';
import { fn } from 'storybook/test';

/** A segmented date field with an optional popup calendar, for use in forms */
const meta = {
  title: 'Components/DateInput',
  component: DateInput,
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'The name of the form control, submitted with form data',
    },
    value: {
      control: 'text',
      description: 'The current value; ISO date or range',
    },
    mode: {
      control: 'select',
      options: ['single', 'range'],
      description: 'The selection mode',
      table: { defaultValue: { summary: 'single' } },
    },
    label: {
      control: 'text',
      description: 'The input label (use the label slot for HTML)',
    },
    hint: {
      control: 'text',
      description: 'The hint text (use the hint slot for HTML)',
    },
    size: {
      control: 'select',
      options: ['xs', 's', 'm', 'l', 'xl'],
      description: 'The visual size',
      table: { defaultValue: { summary: 'm' } },
    },
    appearance: {
      control: 'select',
      options: ['filled', 'outlined', 'filled-outlined'],
      description: 'The visual appearance',
      table: { defaultValue: { summary: 'outlined' } },
    },
    pill: {
      control: 'boolean',
      description: 'Draws the input with pill-style rounded edges',
      table: { defaultValue: { summary: 'false' } },
    },
    required: {
      control: 'boolean',
      description: 'Makes the input required for form submission',
      table: { defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      description: 'Makes the input non-editable',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the input',
      table: { defaultValue: { summary: 'false' } },
    },
    autocomplete: {
      control: 'text',
      description: 'Forwarded to the hidden form input for browser autofill',
    },
    'with-clear': {
      control: 'boolean',
      description: 'Shows a clear button when a value is present',
      table: { defaultValue: { summary: 'false' } },
    },
    min: { control: 'text', description: 'The earliest selectable date' },
    max: { control: 'text', description: 'The latest selectable date' },
    today: {
      control: 'text',
      description: 'Overrides the date considered "today"',
    },
    'first-day-of-week': {
      control: 'select',
      options: ['auto', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
      description: 'The first day of the week in the popup calendar',
      table: { defaultValue: { summary: 'auto' } },
    },
    'disabled-dates': {
      control: 'text',
      description: 'Whitespace-separated ISO dates to disable',
    },
    'disabled-days-of-week': {
      control: 'text',
      description: 'Space-separated 3-letter weekday names to disable',
    },
    'disable-past': {
      control: 'boolean',
      description: 'Disable all dates before today',
      table: { defaultValue: { summary: 'false' } },
    },
    'disable-future': {
      control: 'boolean',
      description: 'Disable all dates after today',
      table: { defaultValue: { summary: 'false' } },
    },
    'min-range': {
      control: 'number',
      description:
        'Minimum range length in days (range mode); 0 disables the check',
      table: { defaultValue: { summary: '0' } },
    },
    'max-range': {
      control: 'number',
      description:
        'Maximum range length in days (range mode); 0 disables the check',
      table: { defaultValue: { summary: '0' } },
    },
    months: {
      control: 'number',
      description: 'The number of months rendered in the popup calendar',
      table: { defaultValue: { summary: '1' } },
    },
    'page-by': {
      control: 'select',
      options: ['months', 'single'],
      description: 'Whether prev/next pages by the visible range or one month',
      table: { defaultValue: { summary: 'months' } },
    },
    'with-outside-days': {
      control: 'boolean',
      description: 'Show leading/trailing adjacent-month days in the popup',
      table: { defaultValue: { summary: 'false' } },
    },
    'with-week-numbers': {
      control: 'boolean',
      description: 'Show ISO week numbers in the popup',
      table: { defaultValue: { summary: 'false' } },
    },
    'weekday-format': {
      control: 'select',
      options: ['narrow', 'short', 'long'],
      description: 'The weekday header format in the popup',
      table: { defaultValue: { summary: 'short' } },
    },
    open: {
      control: 'boolean',
      description: 'Whether the popup calendar is open',
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
      description: 'The preferred popup placement',
      table: { defaultValue: { summary: 'bottom-start' } },
    },
    distance: {
      control: 'number',
      description: 'The distance in pixels between the popup and input',
      table: { defaultValue: { summary: '0' } },
    },
    onInput: {
      action: 'input',
      description:
        'Emitted on every segment edit, step, calendar interaction, and clear, even while the value is incomplete.',
      table: { category: 'Events' },
    },
    onChange: {
      action: 'change',
      description:
        'Emitted on every committed value transition (each completed date edit, calendar selection, or clear), mirroring native `<input type="date">` rather than the commit-on-blur behavior of `<wa-input>`/`<wa-select>`. This matches the sibling `<wa-time-input>`. It does NOT fire while a value is still incomplete.',
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
} satisfies Meta<typeof DateInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A basic labeled date field. */
export const Default: Story = {
  args: { label: 'Start date' },
};

/** Required for form submission, with a clear button. */
export const Required: Story = {
  args: { label: 'Due date', required: true, 'with-clear': true },
};

/** Selecting a start and end date in one field. */
export const RangeMode: Story = {
  args: { label: 'Trip dates', mode: 'range' },
};
