import { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toast, Button } from '@/components/ui';
import type { ToastRef } from '@/components/ui/Toast/Toast';

/** Container that manages and stacks lightweight notification banners at a chosen screen edge */
const meta = {
  title: 'Components/Toast',
  component: Toast,
  tags: ['autodocs', 'pro', 'beta'],
  argTypes: {
    placement: {
      control: 'select',
      options: [
        'top-start',
        'top-center',
        'top-end',
        'bottom-start',
        'bottom-center',
        'bottom-end',
      ],
      description: 'Screen corner or edge where notifications are anchored',
      table: { defaultValue: { summary: 'top-end' } },
    },
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Shows a toast via programmatic creation using the ref API. */
export const Default: Story = {
  render: () => {
    const toastRef = useRef<ToastRef>(null);

    return (
      <div>
        <Button
          onClick={() =>
            toastRef.current?.create('This is a toast notification!', {
              variant: 'brand',
            })
          }
        >
          Show Toast
        </Button>
        <Toast ref={toastRef} />
      </div>
    );
  },
};

/** Shows toasts with different variant colors. */
export const Variants: Story = {
  render: () => {
    const toastRef = useRef<ToastRef>(null);

    return (
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(['neutral', 'brand', 'success', 'warning', 'danger'] as const).map(
          (variant) => (
            <Button
              key={variant}
              variant={variant === 'neutral' ? 'neutral' : variant}
              onClick={() =>
                toastRef.current?.create(`${variant} notification`, { variant })
              }
            >
              {variant}
            </Button>
          )
        )}
        <Toast ref={toastRef} />
      </div>
    );
  },
};

/** Demonstrates different toast placement positions. */
export const Placements: Story = {
  render: () => {
    const topStartRef = useRef<ToastRef>(null);
    const topCenterRef = useRef<ToastRef>(null);
    const bottomEndRef = useRef<ToastRef>(null);

    return (
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button
          onClick={() =>
            topStartRef.current?.create('Top start toast', { variant: 'brand' })
          }
        >
          Top Start
        </Button>
        <Button
          onClick={() =>
            topCenterRef.current?.create('Top center toast', {
              variant: 'success',
            })
          }
        >
          Top Center
        </Button>
        <Button
          onClick={() =>
            bottomEndRef.current?.create('Bottom end toast', {
              variant: 'warning',
            })
          }
        >
          Bottom End
        </Button>
        <Toast ref={topStartRef} placement="top-start" />
        <Toast ref={topCenterRef} placement="top-center" />
        <Toast ref={bottomEndRef} placement="bottom-end" />
      </div>
    );
  },
};
