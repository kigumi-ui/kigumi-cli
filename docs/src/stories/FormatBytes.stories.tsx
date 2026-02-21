import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormatBytes } from '@/components/ui';

/**
 * Format Bytes converts a raw byte count into a human-readable string using either metric
 * (SI) or binary (IEC) units. It auto-selects the appropriate unit (KB, MB, GB, …) and
 * respects the active locale for number formatting, making storage sizes easy to read
 * without any JavaScript helper functions.
 */
const meta = {
  title: 'Components/Format Bytes',
  component: FormatBytes,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'number', description: 'The number in bytes to format' },
    unit: {
      control: 'select',
      options: ['byte', 'bit'],
      table: { defaultValue: { summary: 'byte' } },
    },
    display: {
      control: 'select',
      options: ['long', 'short', 'narrow'],
      table: { defaultValue: { summary: 'short' } },
    },
  },
  args: { value: 1024 },
} satisfies Meta<typeof FormatBytes>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Formats a typical file size in metric units. */
export const Default: Story = {
  args: { value: 1024 },
};

/** Shows gigabyte- and terabyte-range values. */
export const LargeValues: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        fontFamily: 'monospace',
      }}
    >
      {[0, 512, 1024, 1024 ** 2, 1024 ** 3, 1024 ** 4].map((v) => (
        <div key={v} style={{ display: 'flex', gap: '2rem' }}>
          <span
            style={{
              width: '120px',
              textAlign: 'right',
              color: 'var(--wa-color-neutral-600)',
            }}
          >
            {v}
          </span>
          <FormatBytes value={v} />
        </div>
      ))}
    </div>
  ),
};

/** Compares long and short display formats. */
export const DisplayFormats: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {(['long', 'short', 'narrow'] as const).map((d) => (
        <div
          key={d}
          style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
        >
          <span style={{ width: '80px', color: 'var(--wa-color-neutral-600)' }}>
            {d}:
          </span>
          <FormatBytes value={1536} display={d} />
        </div>
      ))}
    </div>
  ),
};

/** Switches units to bits instead of bytes. */
export const Bits: Story = {
  args: { value: 8192, unit: 'bit' },
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
        <FormatBytes value={0} />
      </div>
      <div>
        <FormatBytes value={1024} />
      </div>
      <div>
        <FormatBytes value={1048576} />
      </div>
      <div>
        <FormatBytes value={1073741824} />
      </div>
      <div>
        <FormatBytes value={1024} unit="bit" />
      </div>
      <div>
        <FormatBytes value={1048576} locale="de" />
      </div>
    </div>
  ),
};
