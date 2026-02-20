import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormatNumber } from '@/components/ui';

const meta = {
  title: 'Data/FormatNumber',
  component: FormatNumber,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'number' },
    type: {
      control: 'select',
      options: ['currency', 'decimal', 'percent'],
      table: { defaultValue: { summary: 'decimal' } },
    },
    currency: { control: 'text' },
    'currency-display': {
      control: 'select',
      options: ['symbol', 'narrowSymbol', 'code', 'name'],
    },
    'without-grouping': { control: 'boolean' },
  },
  args: { value: 1234567.89 },
} satisfies Meta<typeof FormatNumber>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Currency: Story = {
  args: {
    value: 9.99,
    type: 'currency',
    currency: 'USD',
  },
};

export const Percent: Story = {
  args: {
    value: 0.753,
    type: 'percent',
  },
};

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
