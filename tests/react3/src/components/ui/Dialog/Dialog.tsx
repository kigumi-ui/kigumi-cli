import React from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/dialog/dialog.js';
import './Dialog.css';

/**
 * Dialogs display important prompts and information
 *
 * @example
 * ```tsx
 * // Using ref methods
 * const dialogRef = React.useRef<DialogRef>(null);
 * <Dialog ref={dialogRef} label="Dialog Title">
 *   <p>Dialog content</p>
 *   <div slot="footer">
 *     <Button data-dialog="close">Close</Button>
 *   </div>
 * </Dialog>
 * dialogRef.current?.show();
 *
 * // Using open prop (recommended)
 * const [open, setOpen] = React.useState(false);
 * <Dialog open={open} label="Dialog Title" onWaHide={() => setOpen(false)}>
 *   <p>Dialog content</p>
 * </Dialog>
 * ```
 */
export interface DialogProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onLoad'> {
  /** Indicates whether or not the dialog is open */
  open?: boolean;
  /** The dialog's label as displayed in the header */
  label: string;
  /** Disables the header and removes the default close button */
  'without-header'?: boolean;
  /** When enabled, the dialog will be closed when the user clicks outside of it */
  'light-dismiss'?: boolean;
  /** Event fired when the dialog is shown */
  onShow?: (event: CustomEvent) => void;
  /** Event fired after the dialog is shown */
  onAfterShow?: (event: CustomEvent) => void;
  /** Event fired when the dialog is about to hide */
  onHide?: (event: CustomEvent) => void;
  /** Event fired after the dialog is hidden */
  onAfterHide?: (event: CustomEvent) => void;
}

export interface DialogRef {
  show: () => void;
  hide: () => void;
  requestClose: () => void;
  element: HTMLElement | null;
}

export const Dialog = React.forwardRef<DialogRef, DialogProps>(
  ({ children, className, onShow, onAfterShow, onHide, onAfterHide, ...props }, ref) => {
    const dialogRef = React.useRef<any>(null);

    React.useImperativeHandle(
      ref,
      () => ({
        show: () => {
          if (dialogRef.current && typeof dialogRef.current.show === 'function') {
            dialogRef.current.show();
          }
        },
        hide: () => {
          // hide is an alias for requestClose for consistency with other components
          if (dialogRef.current && typeof dialogRef.current.requestClose === 'function') {
            dialogRef.current.requestClose();
          }
        },
        requestClose: () => {
          if (dialogRef.current && typeof dialogRef.current.requestClose === 'function') {
            dialogRef.current.requestClose();
          }
        },
        get element() {
          return dialogRef.current;
        },
      }),
      []
    );

    // Setup event listeners
    React.useEffect(() => {
      const el = dialogRef.current;
      if (!el) return;

      const handleShow = (e: Event) => {
        if (onShow) onShow(e as CustomEvent);
      };

      const handleAfterShow = (e: Event) => {
        if (onAfterShow) onAfterShow(e as CustomEvent);
      };

      const handleHide = (e: Event) => {
        if (onHide) onHide(e as CustomEvent);
      };

      const handleAfterHide = (e: Event) => {
        if (onAfterHide) onAfterHide(e as CustomEvent);
      };

      el.addEventListener('wa-show', handleShow);
      el.addEventListener('wa-after-show', handleAfterShow);
      el.addEventListener('wa-hide', handleHide);
      el.addEventListener('wa-after-hide', handleAfterHide);

      return () => {
        el.removeEventListener('wa-show', handleShow);
        el.removeEventListener('wa-after-show', handleAfterShow);
        el.removeEventListener('wa-hide', handleHide);
        el.removeEventListener('wa-after-hide', handleAfterHide);
      };
    }, [onShow, onAfterShow, onHide, onAfterHide]);

    return (
      <wa-dialog
        ref={dialogRef}
        class={clsx('Dialog', className)}
        {...props}
      >
        {children}
      </wa-dialog>
    );
  }
);

Dialog.displayName = 'Dialog';
