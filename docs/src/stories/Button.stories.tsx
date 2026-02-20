import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Button } from '@/components/ui';

const meta = {
  title: 'Components/Actions/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'brand', 'success', 'warning', 'danger'],
      description: 'Semantic color variant',
      table: { defaultValue: { summary: 'neutral' } },
    },
    appearance: {
      control: 'select',
      options: ['accent', 'filled-outlined', 'filled', 'outlined', 'plain'],
      description: 'Visual style',
      table: { defaultValue: { summary: 'filled' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      table: { defaultValue: { summary: 'medium' } },
    },
    pill: { control: 'boolean' },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    'with-caret': { control: 'boolean' },
    href: { control: 'text', description: 'Makes the button render as a link' },
    children: { control: 'text' },
    onBlur: { action: 'blurred' },
    onFocus: { action: 'focused' },
    onInvalid: { action: 'invalid' },
  },
  args: {
    children: 'Button',
    onBlur: fn(),
    onFocus: fn(),
    onInvalid: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'brand',
    appearance: 'filled',
    children: 'Click me',
  },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Button variant="neutral">Neutral</Button>
      <Button variant="brand">Brand</Button>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};

export const Appearances: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Button appearance="accent">Accent</Button>
      <Button appearance="filled">Filled</Button>
      <Button appearance="outlined">Outlined</Button>
      <Button appearance="filled-outlined">Filled Outlined</Button>
      <Button appearance="plain">Plain</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
    </div>
  ),
};

export const AllVariantsAndAppearances: Story = {
  render: () => {
    const variants = [
      'neutral',
      'brand',
      'success',
      'warning',
      'danger',
    ] as const;
    const appearances = [
      'accent',
      'filled',
      'outlined',
      'filled-outlined',
      'plain',
    ] as const;
    return (
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {appearances.map((appearance) => (
          <div
            key={appearance}
            style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
          >
            {variants.map((variant) => (
              <Button key={variant} variant={variant} appearance={appearance}>
                {variant}
              </Button>
            ))}
          </div>
        ))}
      </div>
    );
  },
};

export const Loading: Story = {
  args: { loading: true, children: 'Saving...' },
};

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
};

export const Pill: Story = {
  args: { pill: true, variant: 'brand', children: 'Pill Button' },
};

export const WithCaret: Story = {
  args: { 'with-caret': true, children: 'Open Menu' },
};

export const AsLink: Story = {
  args: {
    href: 'https://webawesome.com',
    target: '_blank',
    variant: 'brand',
    children: 'Visit Docs →',
  },
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
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button variant="neutral">Neutral</Button>
        <Button variant="brand">Brand</Button>
        <Button variant="success">Success</Button>
        <Button variant="warning">Warning</Button>
        <Button variant="danger">Danger</Button>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button appearance="accent">Accent</Button>
        <Button appearance="filled">Filled</Button>
        <Button appearance="outlined">Outlined</Button>
        <Button appearance="filled-outlined">Filled Outlined</Button>
        <Button appearance="plain">Plain</Button>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Button size="small">Small</Button>
        <Button size="medium">Medium</Button>
        <Button size="large">Large</Button>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
        <Button pill variant="brand">
          Pill
        </Button>
        <Button with-caret>With Caret</Button>
      </div>
    </div>
  ),
};
