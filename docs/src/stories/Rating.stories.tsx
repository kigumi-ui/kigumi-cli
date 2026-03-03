import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Rating } from '@/components/ui';

/** Ratings give users a way to quickly view and provide feedback */
const meta = {
  title: 'Components/Rating',
  component: Rating,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text', description: 'Accessible label' },
    value: {
      control: 'number',
      description: 'Current rating value',
      table: { defaultValue: { summary: '0' } },
    },
    max: {
      control: 'number',
      description: 'Maximum rating value',
      table: { defaultValue: { summary: '5' } },
    },
    precision: {
      control: 'number',
      description: 'Rating precision (e.g., 0.5)',
      table: { defaultValue: { summary: '1' } },
    },
    readonly: {
      control: 'boolean',
      description: 'Makes the rating readonly',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the rating',
      table: { defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Rating size',
      table: { defaultValue: { summary: 'medium' } },
    },
    onChange: {
      action: 'change',
      description: "Emitted when the rating's value changes.",
      table: { category: 'Events' },
    },
    onHover: {
      action: 'hover',
      description:
        "Emitted when the user hovers over a value. The `phase` property indicates when hovering starts, moves to a new value, or ends. The `value` property tells what the rating's value would be if the user were to commit to the hovered value.",
      table: { category: 'Events' },
    },
  },
  args: {
    onChange: fn(),
    onHover: fn(),
  },
} satisfies Meta<typeof Rating>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A five-star rating input at zero stars. */
export const Default: Story = {
  args: { value: 3, label: 'Product rating' },
};

/** Allows selecting half-star increments. */
export const HalfPrecision: Story = {
  args: { value: 3.5, precision: 0.5, label: 'Half-star rating' },
};

/** Displays a fixed rating without allowing interaction. */
export const ReadOnly: Story = {
  args: { value: 4, readonly: true, label: 'Average rating' },
};

/** A non-interactive disabled rating field. */
export const Disabled: Story = {
  args: { value: 2, disabled: true, label: 'Disabled rating' },
};

/** Compares small, medium, and large star sizes. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Rating size="small" value={4} label="Small" />
      <Rating size="medium" value={4} label="Medium" />
      <Rating size="large" value={4} label="Large" />
    </div>
  ),
};

/** Changes the total number of stars (e.g., out of 10). */
export const WithMaxStars: Story = {
  args: { max: 10, value: 7, label: '10-star rating' },
};

/** A real-world product review widget composing ratings with labels. */
export const ProductReview: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {[
        { label: 'Quality', value: 4.5 },
        { label: 'Ease of use', value: 5 },
        { label: 'Support', value: 3.5 },
        { label: 'Value', value: 4 },
      ].map(({ label, value }) => (
        <div
          key={label}
          style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
        >
          <span style={{ width: '100px', fontSize: '0.875rem' }}>{label}</span>
          <Rating value={value} precision={0.5} readonly label={label} />
          <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>{value}</span>
        </div>
      ))}
    </div>
  ),
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
      <Rating value={3} />
      <Rating value={4.5} />
      <Rating value={5} />
      <Rating value={0} />
      <Rating value={3} max={10} />
      <Rating value={3} disabled />
      <Rating value={3} readonly />
    </div>
  ),
};
