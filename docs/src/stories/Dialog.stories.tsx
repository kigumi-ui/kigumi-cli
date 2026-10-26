import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { Dialog, Button, Dropdown, DropdownItem } from '@/components/ui';
import {
  clickTrigger,
  installEventProbe,
  waitForCalled,
} from '@/test-utils/play-helpers';
import { expect, userEvent, waitFor, within } from 'storybook/test';

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
  tags: ['interaction'],
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
          onHide={(e) => {
            setOpen(false);
            args.onHide?.(e);
          }}
          onAfterHide={(e) => args.onAfterHide?.(e)}
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
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    // wa-dialog portals into document.body, outside canvasElement.
    const cleanup = installEventProbe(
      document.querySelector('wa-dialog'),
      'wa-show',
      args.onShow
    );
    await clickTrigger(canvas, 'Open Dialog');
    await waitForCalled(args, 'onShow');
    cleanup();
  },
};

/**
 * A dropdown inside the dialog. Its `wa-hide` bubbles to the dialog, which
 * stays open: the dialog reports only its own show and hide.
 */
export const WithDropdown: Story = {
  tags: ['interaction', '!autodocs'],
  args: { label: 'Export' },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="brand" onClick={() => setOpen(true)}>
          Open with Dropdown
        </Button>
        <p data-testid="dialog-state">{open ? 'open' : 'closed'}</p>
        <Dialog {...args} open={open} onHide={() => setOpen(false)}>
          <Dropdown>
            <Button slot="trigger" with-caret>
              Format
            </Button>
            <DropdownItem value="css">CSS</DropdownItem>
            <DropdownItem value="json">JSON</DropdownItem>
          </Dropdown>
        </Dialog>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The story's own `open`, which only the Dialog's onHide sets to false.
    const state = canvas.getByTestId('dialog-state');
    await clickTrigger(canvas, 'Open with Dropdown');
    await waitFor(() => expect(state).toHaveTextContent('open'));
    // wa-dialog portals into document.body, outside canvasElement.
    const dialog = await waitFor(() => {
      const el = document.querySelector<HTMLElement & { open: boolean }>(
        'wa-dialog'
      );
      expect(el?.open).toBe(true);
      return el!;
    });
    const dropdown = dialog.querySelector<HTMLElement & { open: boolean }>(
      'wa-dropdown'
    )!;
    const trigger = within(dialog).getByText('Format');

    await userEvent.click(trigger);
    await waitFor(() => expect(dropdown.open).toBe(true));
    const closed = new Promise((resolve) =>
      dropdown.addEventListener('wa-after-hide', resolve, { once: true })
    );
    await userEvent.click(trigger);
    await closed;
    expect(state).toHaveTextContent('open');

    // The dialog's own close still reaches onHide.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(state).toHaveTextContent('closed'));
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
  tags: ['!dev', '!autodocs'],
  args: { label: 'Dialog' },
  parameters: {
    chromatic: { disableSnapshot: false, pauseAnimationAtEnd: true },
  },
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
