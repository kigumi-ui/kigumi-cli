import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from '@/components/ui';

/** Spinners are used to show the progress of an indeterminate operation */
const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A spinner at the default inherited size. */
export const Default: Story = {};

/** Shows spinners at 1 rem, 2 rem, 3 rem, and 5 rem. */
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

/** Overrides the spinner color with semantic palette tokens. */
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
