import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormatDate } from '@/components/ui';

const now = new Date();

/**
 * Format Date displays a machine-readable date-time string in a locale-aware, human-friendly
 * format using the browser's `Intl.DateTimeFormat` API. Control which parts (date, time,
 * weekday, era, etc.) are shown and in which style — numeric, long, short, or narrow —
 * without writing any formatting code.
 */
const meta = {
  title: 'Components/Format Date',
  component: FormatDate,
  tags: ['autodocs'],
  argTypes: {
    weekday: { control: 'select', options: ['narrow', 'short', 'long'] },
    year: { control: 'select', options: ['numeric', '2-digit'] },
    month: {
      control: 'select',
      options: ['numeric', '2-digit', 'narrow', 'short', 'long'],
    },
    day: { control: 'select', options: ['numeric', '2-digit'] },
    hour: { control: 'select', options: ['numeric', '2-digit'] },
    minute: { control: 'select', options: ['numeric', '2-digit'] },
    second: { control: 'select', options: ['numeric', '2-digit'] },
    'hour-format': { control: 'select', options: ['auto', '12', '24'] },
  },
  args: {
    date: now,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  },
} satisfies Meta<typeof FormatDate>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Formats today's date in the default locale-aware style. */
export const Default: Story = {};

/** Shows both date and time parts together. */
export const DateAndTime: Story = {
  args: {
    date: now,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  },
};

/** Renders a compact date-only string. */
export const ShortDate: Story = {
  args: {
    date: now,
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  },
};

/** Displays only the time portion. */
export const TimeOnly: Story = {
  args: {
    date: now,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    'hour-format': '24',
  },
};

/** Compares long, short, and numeric date display formats. */
export const Formats: Story = {
  render: () => {
    const date = new Date('2024-06-15T14:30:00');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div>
          <strong>Full:</strong>{' '}
          <FormatDate
            date={date}
            weekday="long"
            month="long"
            day="numeric"
            year="numeric"
            hour="numeric"
            minute="2-digit"
          />
        </div>
        <div>
          <strong>Date only:</strong>{' '}
          <FormatDate date={date} month="long" day="numeric" year="numeric" />
        </div>
        <div>
          <strong>Short:</strong>{' '}
          <FormatDate
            date={date}
            month="2-digit"
            day="2-digit"
            year="2-digit"
          />
        </div>
        <div>
          <strong>Time 12h:</strong>{' '}
          <FormatDate
            date={date}
            hour="numeric"
            minute="2-digit"
            hour-format="12"
          />
        </div>
        <div>
          <strong>Time 24h:</strong>{' '}
          <FormatDate
            date={date}
            hour="numeric"
            minute="2-digit"
            hour-format="24"
          />
        </div>
      </div>
    );
  },
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
        gap: '1rem',
        padding: '1.5rem',
      }}
    >
      <div>
        <FormatDate date={new Date('2024-01-15')} />
      </div>
      <div>
        <FormatDate
          date={new Date('2024-01-15')}
          month="long"
          day="numeric"
          year="numeric"
        />
      </div>
      <div>
        <FormatDate
          date={new Date('2024-01-15T14:30:00')}
          hour="numeric"
          minute="numeric"
        />
      </div>
      <div>
        <FormatDate
          date={new Date('2024-01-15')}
          locale="de-DE"
          month="long"
          day="numeric"
          year="numeric"
        />
      </div>
    </div>
  ),
};
