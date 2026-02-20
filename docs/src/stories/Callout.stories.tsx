import type { Meta, StoryObj } from '@storybook/react-vite';
import { Callout, Icon } from '@/components/ui';

const meta = {
  title: 'Display/Callout',
  component: Callout,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['brand', 'neutral', 'success', 'warning', 'danger'],
      table: { defaultValue: { summary: 'neutral' } },
    },
    appearance: {
      control: 'select',
      options: ['accent', 'filled', 'outlined', 'plain', 'filled-outlined'],
      table: { defaultValue: { summary: 'filled-outlined' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      table: { defaultValue: { summary: 'medium' } },
    },
    children: { control: 'text' },
  },
  args: { children: 'This is a callout message.' },
} satisfies Meta<typeof Callout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { variant: 'neutral', children: 'This is a neutral callout message.' },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Callout variant="neutral">
        <Icon slot="icon" name="info-circle" />
        <strong>Info:</strong> This is a neutral informational callout.
      </Callout>
      <Callout variant="brand">
        <Icon slot="icon" name="star" />
        <strong>Brand:</strong> This is a brand callout.
      </Callout>
      <Callout variant="success">
        <Icon slot="icon" name="circle-check" />
        <strong>Success:</strong> Your changes have been saved.
      </Callout>
      <Callout variant="warning">
        <Icon slot="icon" name="triangle-exclamation" />
        <strong>Warning:</strong> Please review before proceeding.
      </Callout>
      <Callout variant="danger">
        <Icon slot="icon" name="circle-xmark" />
        <strong>Error:</strong> Something went wrong.
      </Callout>
    </div>
  ),
};

export const Appearances: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Callout appearance="accent" variant="brand">
        Accent appearance
      </Callout>
      <Callout appearance="filled" variant="brand">
        Filled appearance
      </Callout>
      <Callout appearance="outlined" variant="brand">
        Outlined appearance
      </Callout>
      <Callout appearance="filled-outlined" variant="brand">
        Filled Outlined appearance
      </Callout>
      <Callout appearance="plain" variant="brand">
        Plain appearance
      </Callout>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Callout variant="success">
      <Icon slot="icon" name="circle-check" />
      Profile updated successfully! Your changes are now live.
    </Callout>
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
      {(['neutral', 'brand', 'success', 'warning', 'danger'] as const).map(
        (variant) => (
          <Callout key={variant} variant={variant} open>
            <Icon name="info-circle" slot="icon" />
            <strong>
              {variant.charAt(0).toUpperCase() + variant.slice(1)}
            </strong>{' '}
            — This is a {variant} callout message.
          </Callout>
        )
      )}
      <Callout variant="brand" open>
        <Icon name="star" slot="icon" />
        <strong>With header</strong>
        <span slot="header">Header Text</span>
        This callout has a header slot.
      </Callout>
    </div>
  ),
};
