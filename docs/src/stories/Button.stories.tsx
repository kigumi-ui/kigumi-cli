import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Button } from '@/components/ui';

/** Buttons represent actions that are available to the user */
const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'brand', 'success', 'warning', 'danger'],
      description: 'Semantic variant of the button',
      table: { defaultValue: { summary: 'neutral' } },
    },
    appearance: {
      control: 'select',
      options: ['accent', 'filled-outlined', 'filled', 'outlined', 'plain'],
      description: 'Visual appearance style',
      table: { defaultValue: { summary: 'filled' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Button size',
      table: { defaultValue: { summary: 'medium' } },
    },
    pill: {
      control: 'boolean',
      description: 'Gives the button rounded edges',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
      table: { defaultValue: { summary: 'false' } },
    },
    loading: {
      control: 'boolean',
      description: 'Shows a loading indicator',
      table: { defaultValue: { summary: 'false' } },
    },
    'with-caret': {
      control: 'boolean',
      description: 'Adds a dropdown indicator caret',
      table: { defaultValue: { summary: 'false' } },
    },
    href: { control: 'text', description: 'Makes the button work like a link' },
    target: {
      control: 'select',
      options: ['_blank', '_self', '_parent', '_top'],
      description: 'Link target (when href is set)',
    },
    download: {
      control: 'text',
      description: 'Download filename (when href is set)',
    },
    rel: {
      control: 'text',
      description: 'Link relationship (when href is set)',
    },
    type: {
      control: 'select',
      options: ['button', 'submit', 'reset'],
      description: "The button's type for form submission",
      table: { defaultValue: { summary: 'button' } },
    },
    name: {
      control: 'text',
      description: 'The name of the button for form submission',
    },
    value: {
      control: 'text',
      description: 'The value of the button for form submission',
    },
    formaction: {
      control: 'text',
      description: "Override the form's action attribute",
    },
    formenctype: {
      control: 'text',
      description: "Override the form's enctype attribute",
    },
    formmethod: {
      control: 'text',
      description: "Override the form's method attribute",
    },
    formnovalidate: {
      control: 'boolean',
      description: 'Bypass form validation when this button submits',
      table: { defaultValue: { summary: 'false' } },
    },
    formtarget: {
      control: 'text',
      description: "Override the form's target attribute",
    },
    children: { control: 'text' },
    onBlur: {
      action: 'blur',
      description: 'Emitted when the button loses focus.',
      table: { category: 'Events' },
    },
    onFocus: {
      action: 'focus',
      description: 'Emitted when the button gains focus.',
      table: { category: 'Events' },
    },
    onInvalid: {
      action: 'invalid',
      description:
        "Emitted when the form control has been checked for validity and its constraints aren't satisfied.",
      table: { category: 'Events' },
    },
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
