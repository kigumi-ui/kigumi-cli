import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from '@/components/ui';

const meta = {
  title: 'Display/Spinner',
  component: Spinner,
  tags: ['autodocs'],
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Spinner style={{ fontSize: '1rem' }} />
      <Spinner style={{ fontSize: '2rem' }} />
      <Spinner style={{ fontSize: '3rem' }} />
      <Spinner style={{ fontSize: '5rem' }} />
    </div>
  ),
};

export const CustomColors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Spinner
        style={{ fontSize: '2rem', color: 'var(--wa-color-brand-fill-loud)' }}
      />
      <Spinner
        style={{ fontSize: '2rem', color: 'var(--wa-color-success-fill-loud)' }}
      />
      <Spinner
        style={{ fontSize: '2rem', color: 'var(--wa-color-warning-fill-loud)' }}
      />
      <Spinner
        style={{ fontSize: '2rem', color: 'var(--wa-color-danger-fill-loud)' }}
      />
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
        gap: '2rem',
        padding: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Spinner style={{ fontSize: '1rem' }} />
        <Spinner style={{ fontSize: '2rem' }} />
        <Spinner style={{ fontSize: '3rem' }} />
        <Spinner style={{ fontSize: '5rem' }} />
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Spinner
          style={{ fontSize: '2rem', color: 'var(--wa-color-brand-fill-loud)' }}
        />
        <Spinner
          style={{
            fontSize: '2rem',
            color: 'var(--wa-color-success-fill-loud)',
          }}
        />
        <Spinner
          style={{
            fontSize: '2rem',
            color: 'var(--wa-color-warning-fill-loud)',
          }}
        />
        <Spinner
          style={{
            fontSize: '2rem',
            color: 'var(--wa-color-danger-fill-loud)',
          }}
        />
      </div>
    </div>
  ),
};
