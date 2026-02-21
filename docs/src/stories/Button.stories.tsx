import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Button } from '@/components/ui';

/**
 * Button triggers actions that users can initiate — submitting forms, navigating to a URL,
 * or calling any handler. It supports five semantic color variants, four visual appearances,
 * three sizes, pill corners, loading state, and can render as a native anchor element when
 * given an `href`.
 */
const meta = {
  title: 'Components/Button',
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

/** Shows the button in its default neutral/accent state. */
export const Default: Story = {
  args: {
    variant: 'brand',
    appearance: 'filled',
    children: 'Click me',
  },
};

/** Demonstrates all five color variants: neutral, brand, success, warning, and danger. */
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

/** Shows all four visual styles: accent, filled, outlined, and plain. */
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

/** Compares small, medium, and large sizes. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
    </div>
  ),
};

/** Matrix showing every combination of variant and appearance. */
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

/** Displays the loading spinner state while an async action is in progress. */
export const Loading: Story = {
  args: { loading: true, children: 'Saving...' },
};

/** Shows the button in a non-interactive disabled state. */
export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
};

/** Renders the button with fully rounded pill-shaped corners. */
export const Pill: Story = {
  args: { pill: true, variant: 'brand', children: 'Pill Button' },
};

/** Adds a dropdown caret to signal that a menu will open. */
export const WithCaret: Story = {
  args: { 'with-caret': true, children: 'Open Menu' },
};

/** Uses the href prop to render the button as a native anchor element. */
export const AsLink: Story = {
  args: {
    href: 'https://kigumi.style',
    target: '_blank',
    variant: 'brand',
    children: 'Visit Docs →',
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
