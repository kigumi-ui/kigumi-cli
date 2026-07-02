import type { Meta, StoryObj } from '@storybook/react-vite';
import { DatePicker } from '@/components/ui';
import { fn } from 'storybook/test';

/** An inline calendar for selecting a single date or a date range */
const meta = {
  title: 'Components/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['single', 'range'],
      description: 'The selection mode',
      table: { defaultValue: { summary: 'single' } },
    },
    value: {
      control: 'text',
      description: 'The selected date(s) in ISO format',
    },
    min: {
      control: 'text',
      description: 'The earliest selectable date (YYYY-MM-DD)',
    },
    max: {
      control: 'text',
      description: 'The latest selectable date (YYYY-MM-DD)',
    },
    today: {
      control: 'text',
      description: 'Overrides the date considered "today"',
    },
    'focused-date': {
      control: 'text',
      description: 'The currently focused date',
    },
    view: {
      control: 'select',
      options: ['months', 'days', 'years'],
      description: 'The current calendar view',
      table: { defaultValue: { summary: 'days' } },
    },
    months: {
      control: 'number',
      description: 'The number of months rendered side-by-side',
      table: { defaultValue: { summary: '1' } },
    },
    'page-by': {
      control: 'select',
      options: ['single', 'months'],
      description:
        'Whether prev/next advances by the visible range or one month',
      table: { defaultValue: { summary: 'months' } },
    },
    'first-day-of-week': {
      control: 'select',
      options: ['auto', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
      description: 'The first day of the week',
      table: { defaultValue: { summary: 'auto' } },
    },
    'with-outside-days': {
      control: 'boolean',
      description: 'Show leading/trailing days from adjacent months',
      table: { defaultValue: { summary: 'false' } },
    },
    'with-week-numbers': {
      control: 'boolean',
      description: 'Show the ISO week-number column',
      table: { defaultValue: { summary: 'false' } },
    },
    'weekday-format': {
      control: 'select',
      options: ['narrow', 'short', 'long'],
      description: 'The weekday header format',
      table: { defaultValue: { summary: 'short' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the entire picker',
      table: { defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      description: 'Displays the value without allowing changes',
      table: { defaultValue: { summary: 'false' } },
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
    size: {
      control: 'select',
      options: ['xs', 's', 'm', 'l', 'xl'],
      description: 'The visual size',
      table: { defaultValue: { summary: 'm' } },
    },
    locale: { control: 'text', description: 'A BCP-47 locale override' },
    onInput: {
      action: 'input',
      description:
        'Emitted when the value changes during interaction. In range mode, this fires after the first click of a new range.',
      table: { category: 'Events' },
    },
    onChange: {
      action: 'change',
      description:
        'Emitted when the user commits a new value. Read the current value from `event.target.value`.',
      table: { category: 'Events' },
    },
    onFocusDay: {
      action: 'focus-day',
      description:
        'Emitted when the focused day changes via keyboard navigation, paging, or pointer hover. `event.detail` is `{ date: Date }`.',
      table: { category: 'Events' },
    },
    onViewChange: {
      action: 'view-change',
      description:
        'Emitted when the date picker switches between day, month, and year views. `event.detail` is `{ view, date }`.',
      table: { category: 'Events' },
    },
  },
  args: {
    onInput: fn(),
    onChange: fn(),
    onFocusDay: fn(),
    onViewChange: fn(),
  },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A single-date calendar. */
export const Default: Story = {
  args: { value: '2026-07-02' },
};

/** Selecting a start and end date. */
export const RangeMode: Story = {
  args: { mode: 'range', value: '2026-07-02/2026-07-09' },
};

/** Shows the ISO week-number column alongside the grid. */
export const WithWeekNumbers: Story = {
  args: { value: '2026-07-02', 'with-week-numbers': true },
};
