import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { Dialog, Button } from '@/components/ui';

/** Dialogs display important prompts and information */
const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Indicates whether or not the dialog is open',
      table: { disable: true, defaultValue: { summary: 'false' } },
    },
    label: {
      control: 'text',
      description: "The dialog's label as displayed in the header",
    },
    'without-header': {
      control: 'boolean',
      description: 'Disables the header and removes the default close button',
      table: { defaultValue: { summary: 'false' } },
    },
    'light-dismiss': {
      control: 'boolean',
      description:
        'When enabled, the dialog will be closed when the user clicks outside of it',
      table: { defaultValue: { summary: 'false' } },
    },
    onShow: {
      action: 'show',
      description: 'Emitted when the dialog opens.',
      table: { category: 'Events' },
    },
    onAfterShow: {
      action: 'after-show',
      description:
        'Emitted after the dialog opens and all animations are complete.',
      table: { category: 'Events' },
    },
    onHide: {
      action: 'hide',
      description:
        'Emitted when the dialog is requested to close. Calling `event.preventDefault()` will prevent the dialog from closing. You can inspect `event.detail.source` to see which element caused the dialog to close. If the source is the dialog element itself, the user has pressed [[Escape]] or the dialog has been closed programmatically. Avoid using this unless closing the dialog will result in destructive behavior such as data loss.',
      table: { category: 'Events' },
    },
    onAfterHide: {
      action: 'after-hide',
      description:
        'Emitted after the dialog closes and all animations are complete.',
      table: { category: 'Events' },
    },
  },
  args: {
    onShow: fn(),
    onAfterShow: fn(),
    onHide: fn(),
    onAfterHide: fn(),
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A basic dialog with a title and body text. */
export const Default: Story = {
  args: { label: 'Confirm Action' },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="brand" onClick={() => setOpen(true)}>
          Open Dialog
        </Button>
        <Dialog
          {...args}
          open={open}
          onHide={() => {
            setOpen(false);
            args.onHide?.({} as CustomEvent);
          }}
          onAfterHide={() => args.onAfterHide?.({} as CustomEvent)}
        >
          <p>This is the dialog body. You can place any content here.</p>
          <Button
            slot="footer"
            appearance="outlined"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button slot="footer" variant="brand" onClick={() => setOpen(false)}>
            Confirm
          </Button>
        </Dialog>
      </>
    );
  },
};

/** Adds action buttons inside the footer slot. */
export const WithFooter: Story = {
  args: { label: 'Save Changes' },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="brand" onClick={() => setOpen(true)}>
          Open with Footer
        </Button>
        <Dialog {...args} open={open} onHide={() => setOpen(false)}>
          <p>
            Your changes will be saved permanently. This action cannot be
            undone.
          </p>
          <Button
            slot="footer"
            appearance="plain"
            onClick={() => setOpen(false)}
          >
            Discard
          </Button>
          <Button slot="footer" variant="brand" onClick={() => setOpen(false)}>
            Save
          </Button>
        </Dialog>
      </>
    );
  },
};

/** Closes the dialog when clicking the backdrop outside it. */
export const LightDismiss: Story = {
  args: { label: 'Click Outside to Close', 'light-dismiss': true },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>
          Open (click backdrop to close)
        </Button>
        <Dialog {...args} open={open} onHide={() => setOpen(false)}>
          <p>Click anywhere outside this dialog to close it.</p>
        </Dialog>
      </>
    );
  },
};

/** Hides the header bar for a bare, content-only dialog. */
export const WithoutHeader: Story = {
  args: { label: 'Hidden Header', 'without-header': true },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open (no header)</Button>
        <Dialog {...args} open={open} onHide={() => setOpen(false)}>
          <p>This dialog has no title bar or default close button.</p>
          <Button slot="footer" variant="brand" onClick={() => setOpen(false)}>
            Done
          </Button>
        </Dialog>
      </>
    );
  },
};

/** A confirmation dialog for irreversible destructive actions. */
export const DestructiveConfirm: Story = {
  args: { label: 'Delete Account' },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Delete Account
        </Button>
        <Dialog {...args} open={open} onHide={() => setOpen(false)}>
          <p>
            Are you sure you want to delete your account?{' '}
            <strong>This action is permanent and cannot be undone.</strong>
          </p>
          <Button
            slot="footer"
            appearance="outlined"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button slot="footer" variant="danger" onClick={() => setOpen(false)}>
            Delete permanently
          </Button>
        </Dialog>
      </>
    );
  },
};

/** Shows the dialog with content that scrolls inside the body. */
export const ScrollingContent: Story = {
  args: { label: 'Terms of Service' },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Read Terms</Button>
        <Dialog {...args} open={open} onHide={() => setOpen(false)}>
          {Array.from({ length: 20 }, (_, i) => (
            <p key={i}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          ))}
          <Button slot="footer" variant="brand" onClick={() => setOpen(false)}>
            I Accept
          </Button>
        </Dialog>
      </>
    );
  },
};

/** Static snapshot for visual regression testing. */
export const ChromaticOnly: Story = {
  // tags: ['!dev', '!autodocs'],
  parameters: { chromatic: { pauseAnimationAtEnd: true } },
  render: () => (
    <div style={{ padding: '1.5rem' }}>
      <p
        style={{
          color: 'var(--wa-color-neutral-text-subtle)',
          fontSize: '0.875rem',
        }}
      >
        Dialog requires user interaction to open. Use the individual stories to
        test dialog states.
      </p>
      <Button>Open Dialog (interactive only)</Button>
    </div>
  ),
};
