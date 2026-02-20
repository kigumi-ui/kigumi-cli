import type { Meta, StoryObj } from '@storybook/react-vite';
import { QrCode } from '@/components/ui';

const meta = {
  title: 'Display/QrCode',
  component: QrCode,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text', description: 'The data to encode (required)' },
    size: {
      control: 'number',
      description: 'Size in pixels',
      table: { defaultValue: { summary: '128' } },
    },
    fill: {
      control: 'color',
      description: 'Foreground color',
      table: { defaultValue: { summary: '#000' } },
    },
    background: {
      control: 'color',
      description: 'Background color',
      table: { defaultValue: { summary: 'transparent' } },
    },
    radius: {
      control: { type: 'range', min: 0, max: 0.5, step: 0.1 },
      description: 'Corner radius of QR code cells',
      table: { defaultValue: { summary: '0' } },
    },
    'error-correction': {
      control: 'select',
      options: ['L', 'M', 'Q', 'H'],
      description: 'Error correction level (L=7%, M=15%, Q=25%, H=30%)',
      table: { defaultValue: { summary: 'H' } },
    },
    label: { control: 'text', description: 'Accessibility label' },
  },
  args: { value: 'https://webawesome.com', label: 'QR code' },
} satisfies Meta<typeof QrCode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 'https://webawesome.com', size: 200 },
};

export const WithText: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
      }}
    >
      <QrCode
        value="https://webawesome.com"
        size={180}
        label="Web Awesome QR code"
      />
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--wa-color-neutral-text-muted)',
        }}
      >
        Scan to visit webawesome.com
      </p>
    </div>
  ),
};

export const CustomColors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      <QrCode
        value="https://webawesome.com"
        fill="#6366f1"
        size={140}
        label="Purple QR"
      />
      <QrCode
        value="https://webawesome.com"
        fill="#22c55e"
        size={140}
        label="Green QR"
      />
      <QrCode
        value="https://webawesome.com"
        fill="#ef4444"
        size={140}
        label="Red QR"
      />
    </div>
  ),
};

export const Rounded: Story = {
  args: { value: 'https://webawesome.com', size: 200, radius: 0.5 },
};

export const ErrorCorrection: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '1.5rem',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
      }}
    >
      {(['L', 'M', 'Q', 'H'] as const).map((level) => (
        <div key={level} style={{ textAlign: 'center' }}>
          <QrCode
            value="https://webawesome.com"
            size={120}
            error-correction={level}
            label={`Level ${level}`}
          />
          <p
            style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.7 }}
          >
            Level {level}
          </p>
        </div>
      ))}
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
        gap: '2rem',
        flexWrap: 'wrap',
        padding: '1.5rem',
        alignItems: 'flex-start',
      }}
    >
      <QrCode value="https://example.com" />
      <QrCode value="https://example.com" fill="#4a90d9" background="white" />
      <QrCode value="https://example.com" radius={0.5} />
      <QrCode value="https://example.com" style={{ width: '80px' }} />
      <QrCode value="https://example.com" style={{ width: '200px' }} />
    </div>
  ),
};
