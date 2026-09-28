import type { Meta, StoryObj } from '@storybook/react-vite';
import { Step, Stepper, Icon } from '@/components/ui';

/** Steps are the individual stages of a stepper, each with a label and a status */
const meta = {
  title: 'Components/Step',
  component: Step,
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description:
        "The step's identifier; the stepper's active and its events use it",
    },
    completed: {
      control: 'boolean',
      description: 'Marks the step done and shows a checkmark',
      table: { defaultValue: { summary: 'false' } },
    },
    loading: {
      control: 'boolean',
      description: 'Shows a spinner in place of the step number',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Makes the step unreachable and non-interactive',
      table: { defaultValue: { summary: 'false' } },
    },
    variant: {
      control: 'select',
      options: ['neutral', 'brand', 'success', 'warning', 'danger'],
      description: 'Semantic color of the step marker',
      table: { defaultValue: { summary: 'brand' } },
    },
    attention: {
      control: 'select',
      options: ['none', 'pulse', 'bounce'],
      description: 'Animates the marker to draw attention to the step',
      table: { defaultValue: { summary: 'none' } },
    },
    active: {
      control: 'boolean',
      description: 'Whether this is the current step; set by the stepper',
      table: { defaultValue: { summary: 'false' } },
    },
  },
} satisfies Meta<typeof Step>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A single step inside a stepper; the controls apply to the middle step. */
export const Default: Story = {
  args: { name: 'shipping' },
  render: (args) => (
    <Stepper active="shipping" label="Checkout">
      <Step name="cart" completed>
        Cart
      </Step>
      <Step {...args}>Shipping</Step>
      <Step name="payment">Payment</Step>
    </Stepper>
  ),
};

/** Every variant color on the step marker. */
export const Variants: Story = {
  render: () => (
    <Stepper label="Variants">
      <Step name="neutral" variant="neutral" completed>
        Neutral
      </Step>
      <Step name="brand" variant="brand" completed>
        Brand
      </Step>
      <Step name="success" variant="success" completed>
        Success
      </Step>
      <Step name="warning" variant="warning" completed>
        Warning
      </Step>
      <Step name="danger" variant="danger" completed>
        Danger
      </Step>
    </Stepper>
  ),
};

/** An icon replaces the step number. */
export const WithIcon: Story = {
  render: () => (
    <Stepper active="profile" label="Setup">
      <Step name="account" completed>
        <Icon slot="icon" name="user" />
        Account
      </Step>
      <Step name="profile">
        <Icon slot="icon" name="id-card" />
        Profile
      </Step>
      <Step name="done">
        <Icon slot="icon" name="flag-checkered" />
        Done
      </Step>
    </Stepper>
  ),
};
