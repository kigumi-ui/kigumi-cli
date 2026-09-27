import type { Meta, StoryObj } from '@storybook/react-vite';
import { QrCode } from '@/components/ui';

/** Generates QR codes for encoding text, URLs, or data */
const meta = {
  title: 'Components/QR Code',
  component: QrCode,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text', description: 'The data to encode' },
    label: { control: 'text', description: 'Accessible label' },
    size: {
      control: 'number',
      description: 'Size in pixels',
      table: { defaultValue: { summary: '128' } },
    },
    fill: {
      control: 'text',
      description:
        '**Deprecated.** Set the CSS color property on the QR code instead.',
      table: { category: 'Deprecated' },
    },
    background: {
      control: 'text',
      description:
        '**Deprecated.** Set the CSS background-color property on the QR code instead.',
      table: { category: 'Deprecated' },
    },
    radius: {
      control: 'number',
      description: 'Corner radius',
      table: { defaultValue: { summary: '0' } },
    },
    'error-correction': {
      control: 'select',
      options: ['L', 'M', 'Q', 'H'],
      description: 'Error correction level',
      table: { defaultValue: { summary: 'H' } },
    },
  },
} satisfies Meta<typeof QrCode>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A QR code encoding a simple URL. */
export const Default: Story = {
  args: { value: 'https://kigumi.style', size: 200 },
};

/** Adds a descriptive label beneath the QR code. */
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
      <QrCode value="https://kigumi.style" size={180} label="Kigumi QR code" />
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--wa-color-neutral-text-muted)',
        }}
      >
        Scan to visit kigumi.style
      </p>
    </div>
  ),
};

/** Changes the foreground color through the CSS color property. */
export const CustomColors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      <QrCode
        value="https://kigumi.style"
        size={140}
        label="Purple QR"
        style={{ color: '#6366f1' }}
      />
      <QrCode
        value="https://kigumi.style"
        size={140}
        label="Green QR"
        style={{ color: '#22c55e' }}
      />
      <QrCode
        value="https://kigumi.style"
        size={140}
        label="Red QR"
        style={{ color: '#ef4444' }}
      />
    </div>
  ),
};

/** Uses CSS color and background-color for theme-aware styling. */
export const CssStyling: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      <QrCode
        value="https://kigumi.style"
        size={140}
        label="CSS styled QR"
        style={{ color: '#6366f1', backgroundColor: '#f5f3ff' }}
      />
      <QrCode
        value="https://kigumi.style"
        size={140}
        label="Dark mode QR"
        style={{ color: 'white', backgroundColor: '#1e1b4b' }}
      />
    </div>
  ),
};

/** Increases module radius for rounded-corner QR aesthetics. */
export const Rounded: Story = {
  args: { value: 'https://kigumi.style', size: 200, radius: 0.5 },
};

/** Compares the four error-correction levels (L, M, Q, H). */
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
            value="https://kigumi.style"
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
        gap: '2rem',
        flexWrap: 'wrap',
        padding: '1.5rem',
        alignItems: 'flex-start',
      }}
    >
      <QrCode value="https://example.com" />
      <QrCode
        value="https://example.com"
        style={{ color: '#4a90d9', backgroundColor: 'white' }}
      />
      <QrCode value="https://example.com" radius={0.5} />
      <QrCode value="https://example.com" style={{ width: '80px' }} />
      <QrCode value="https://example.com" style={{ width: '200px' }} />
    </div>
  ),
};
