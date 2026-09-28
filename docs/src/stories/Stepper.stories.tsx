import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent } from 'storybook/test';
import { Stepper, Step } from '@/components/ui';
import { installEventProbe, waitForCalled } from '@/test-utils/play-helpers';

/** Steppers walk users through a multi-stage process and show where they are in it */
const meta = {
  title: 'Components/Stepper',
  component: Stepper,
  tags: ['autodocs'],
  argTypes: {
    active: {
      control: 'text',
      description:
        'Name of the current step; the first step when unset or unmatched',
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical', 'auto'],
      description:
        'Layout direction; auto stacks the steps when they run out of room',
      table: { defaultValue: { summary: 'horizontal' } },
    },
    linear: {
      control: 'boolean',
      description: 'Steps can only be reached once the ones before are done',
      table: { defaultValue: { summary: 'false' } },
    },
    clickable: {
      control: 'boolean',
      description: 'Lets users jump to a step by clicking or activating it',
      table: { defaultValue: { summary: 'false' } },
    },
    label: { control: 'text', description: 'Accessible name for the stepper' },
    onBeforeStepChange: {
      action: 'before-step-change',
      description:
        'Emitted before the active step changes. Calling `event.preventDefault()` prevents the change, to guard against invalid or unsaved data.',
      table: { category: 'Events' },
    },
    onStepChange: {
      action: 'step-change',
      description: 'Emitted after the active step changes.',
      table: { category: 'Events' },
    },
  },
  args: {
    onBeforeStepChange: fn(),
    onStepChange: fn(),
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A clickable checkout flow; the finished step shows a checkmark. */
export const Default: Story = {
  tags: ['interaction'],
  args: { active: 'shipping', label: 'Checkout', clickable: true },
  render: (args) => (
    <Stepper {...args}>
      <Step name="cart" completed>
        Cart
      </Step>
      <Step name="shipping">Shipping</Step>
      <Step name="payment">Payment</Step>
      <Step name="review">Review</Step>
    </Stepper>
  ),
  play: async ({ args, canvasElement }) => {
    const host = canvasElement.querySelector<HTMLElement>('wa-stepper');
    if (!host) throw new Error('wa-stepper not found');
    const cleanup = installEventProbe(
      host,
      'wa-step-change',
      args.onStepChange
    );
    const payment = canvasElement.querySelector('wa-step[name="payment"]');
    const button = payment?.shadowRoot?.querySelector('[part~="button"]');
    if (!button) throw new Error('payment step button not found');
    await userEvent.click(button);
    await waitForCalled(args, 'onStepChange');
    cleanup();
  },
};

/** Steps stacked in a column, each with a description under its label. */
export const Vertical: Story = {
  args: { active: 'details', orientation: 'vertical', label: 'Onboarding' },
  render: (args) => (
    <Stepper {...args}>
      <Step name="account" completed>
        Account
        <span slot="description">Email and password</span>
      </Step>
      <Step name="details">
        Details
        <span slot="description">Name and company</span>
      </Step>
      <Step name="invite">
        Invite
        <span slot="description">Add your team</span>
      </Step>
    </Stepper>
  ),
};

/** Linear mode: steps after the first incomplete one cannot be reached yet. */
export const Linear: Story = {
  args: { active: 'cart', linear: true, clickable: true, label: 'Checkout' },
  render: (args) => (
    <Stepper {...args}>
      <Step name="cart">Cart</Step>
      <Step name="shipping">Shipping</Step>
      <Step name="payment">Payment</Step>
    </Stepper>
  ),
};

/** Step states: loading, warning with attention, disabled. */
export const StepStates: Story = {
  args: { active: 'payment', label: 'Order status' },
  render: (args) => (
    <Stepper {...args}>
      <Step name="cart" completed variant="success">
        Cart
      </Step>
      <Step name="shipping" loading>
        Shipping
      </Step>
      <Step name="payment" variant="warning" attention="pulse">
        Payment
      </Step>
      <Step name="gift" disabled>
        Gift wrap
      </Step>
    </Stepper>
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
      <Stepper active="shipping" label="Horizontal">
        <Step name="cart" completed>
          Cart
        </Step>
        <Step name="shipping">Shipping</Step>
        <Step name="payment">Payment</Step>
      </Stepper>
      <Stepper active="details" orientation="vertical" label="Vertical">
        <Step name="account" completed>
          Account
          <span slot="description">Email and password</span>
        </Step>
        <Step name="details">Details</Step>
        <Step name="invite" disabled>
          Invite
        </Step>
      </Stepper>
    </div>
  ),
};
