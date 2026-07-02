import { fn } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToastItem } from '@/components/ui';

/** A single notification banner that can be stacked inside a Toast container */
const meta = {
  title: 'Components/Toast Item',
  component: ToastItem,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['brand', 'success', 'warning', 'danger', 'neutral'],
      description: 'Colour scheme reflecting the notification intent',
      table: { defaultValue: { summary: 'neutral' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large', 'xs', 's', 'm', 'l', 'xl'],
      description: 'Controls the overall dimensions of the notification',
      table: { defaultValue: { summary: 'medium' } },
    },
    duration: {
      control: 'number',
      description:
        'Milliseconds before auto-dismiss. Use 0 to keep the notification visible until closed.',
      table: { defaultValue: { summary: '5000' } },
    },
    children: { control: 'text' },
    onShow: {
      action: 'show',
      description: 'Emitted when the toast item begins to show.',
      table: { category: 'Events' },
    },
    onAfterShow: {
      action: 'after-show',
      description: 'Emitted after the toast item has finished showing.',
      table: { category: 'Events' },
    },
    onHide: {
      action: 'hide',
      description: 'Emitted when the toast item begins to hide.',
      table: { category: 'Events' },
    },
    onAfterHide: {
      action: 'after-hide',
      description: 'Emitted after the toast item has finished hiding.',
      table: { category: 'Events' },
    },
  },
  args: {
    children: 'This is a notification',
    onShow: fn(),
    onAfterShow: fn(),
    onHide: fn(),
    onAfterHide: fn(),
  },
} satisfies Meta<typeof ToastItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A basic toast item in its default state. */
export const Default: Story = {
  args: { variant: 'neutral' },
};

/** Shows all five variant colors side by side. */
export const Variants: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '400px',
      }}
    >
      <ToastItem variant="brand" duration={0}>
        Brand notification
      </ToastItem>
      <ToastItem variant="success" duration={0}>
        Success notification
      </ToastItem>
      <ToastItem variant="warning" duration={0}>
        Warning notification
      </ToastItem>
      <ToastItem variant="danger" duration={0}>
        Danger notification
      </ToastItem>
      <ToastItem variant="neutral" duration={0}>
        Neutral notification
      </ToastItem>
    </div>
  ),
};

/** Shows all three size options. */
export const Sizes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '400px',
      }}
    >
      <ToastItem size="small" duration={0}>
        Small notification
      </ToastItem>
      <ToastItem size="medium" duration={0}>
        Medium notification
      </ToastItem>
      <ToastItem size="large" duration={0}>
        Large notification
      </ToastItem>
    </div>
  ),
};

/** Toast item with a custom icon in the icon slot. */
export const WithIcon: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '400px',
      }}
    >
      <ToastItem variant="success" duration={0}>
        <wa-icon slot="icon" name="check" />
        File saved successfully
      </ToastItem>
      <ToastItem variant="danger" duration={0}>
        <wa-icon slot="icon" name="triangle-exclamation" />
        Something went wrong
      </ToastItem>
    </div>
  ),
};
