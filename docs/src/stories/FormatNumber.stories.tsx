import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormatNumber } from '@/components/ui';

/** Formats a number using the Intl.NumberFormat API */
const meta = {
  title: 'Components/Format Number',
  component: FormatNumber,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'number',
      description: 'The number to format',
      table: { defaultValue: { summary: '0' } },
    },
    type: {
      control: 'select',
      options: ['currency', 'decimal', 'percent'],
      description: 'The formatting style',
      table: { defaultValue: { summary: 'decimal' } },
    },
    currency: {
      control: 'text',
      description: 'The currency to use (ISO 4217)',
      table: { defaultValue: { summary: 'USD' } },
    },
    'currency-display': {
      control: 'select',
      options: ['symbol', 'narrowSymbol', 'code', 'name'],
      description: 'How to display the currency',
      table: { defaultValue: { summary: 'symbol' } },
    },
    'minimum-integer-digits': {
      control: 'number',
      description: 'Minimum integer digits',
    },
    'minimum-fraction-digits': {
      control: 'number',
      description: 'Minimum fraction digits',
    },
    'maximum-fraction-digits': {
      control: 'number',
      description: 'Maximum fraction digits',
    },
    'minimum-significant-digits': {
      control: 'number',
      description: 'Minimum significant digits',
    },
    'maximum-significant-digits': {
      control: 'number',
      description: 'Maximum significant digits',
    },
    'without-grouping': {
      control: 'boolean',
      description: 'Disables grouping separators',
      table: { defaultValue: { summary: 'false' } },
    },
    lang: { control: 'text', description: 'The locale to use when formatting' },
  },
} satisfies Meta<typeof FormatNumber>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Formats a plain decimal number with locale-aware separators. */
export const Default: Story = {};

/** Displays a value as a currency amount with symbol. */
export const Currency: Story = {
  args: {
    value: 9.99,
    type: 'currency',
    currency: 'USD',
  },
};

/** Formats a fraction as a percentage. */
export const Percent: Story = {
  args: {
    value: 0.753,
    type: 'percent',
  },
};

/** Compares symbol, code, and name currency display formats. */
export const CurrencyFormats: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {[
        { label: 'USD symbol', currency: 'USD', display: 'symbol' as const },
        {
          label: 'EUR narrowSymbol',
          currency: 'EUR',
          display: 'narrowSymbol' as const,
        },
        { label: 'GBP code', currency: 'GBP', display: 'code' as const },
        { label: 'JPY name', currency: 'JPY', display: 'name' as const },
      ].map(({ label, currency, display }) => (
        <div key={label} style={{ display: 'flex', gap: '1rem' }}>
          <span
            style={{ width: '160px', color: 'var(--wa-color-neutral-600)' }}
          >
            {label}:
          </span>
          <FormatNumber
            value={1234.5}
            type="currency"
            currency={currency}
            currency-display={display}
          />
        </div>
      ))}
    </div>
  ),
};

/** Controls minimum and maximum fraction digit counts. */
export const Precision: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div>
        <strong>0 decimal places:</strong>{' '}
        <FormatNumber
          value={1234.567}
          minimum-fraction-digits={0}
          maximum-fraction-digits={0}
        />
      </div>
      <div>
        <strong>2 decimal places:</strong>{' '}
        <FormatNumber
          value={1234.567}
          minimum-fraction-digits={2}
          maximum-fraction-digits={2}
        />
      </div>
      <div>
        <strong>Without grouping:</strong>{' '}
        <FormatNumber value={1234567} without-grouping />
      </div>
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
        gap: '1rem',
        padding: '1.5rem',
      }}
    >
      <div>
        <FormatNumber value={1234567.89} />
      </div>
      <div>
        <FormatNumber value={0.45} type="percent" />
      </div>
      <div>
        <FormatNumber value={1234.56} type="currency" currency="USD" />
      </div>
      <div>
        <FormatNumber
          value={1234.56}
          type="currency"
          currency="EUR"
          locale="de-DE"
        />
      </div>
    </div>
  ),
};
