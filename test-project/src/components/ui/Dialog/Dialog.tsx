import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';
import './Dialog.css';

/**
 * Dialogs display important prompts and information
 *
 * @example
 * ```tsx
 * const dialogRef = useRef<DialogRef>(null);
 *
 * <Dialog ref={dialogRef} label="Dialog Title">
 *   <p>Dialog content goes here</p>
 *   <div slot="footer">
 *     <Button onClick={() => dialogRef.current?.hide()}>Close</Button>
 *   </div>
 * </Dialog>
 *
 * // Show dialog
 * dialogRef.current?.show();
 * ```
 */
export interface DialogProps extends React.HTMLAttributes<HTMLElement> {
  /** Indicates whether or not the dialog is open */
  open?: boolean;
  /** The dialog's label as displayed in the header */
  label: string;
  /** Disables the header and removes the default close button */
  'without-header'?: boolean;
  /** When enabled, the dialog will be closed when the user clicks outside of it */
  'light-dismiss'?: boolean;
}

export interface DialogRef {
  show: () => void;
  hide: () => void;
}

export const Dialog = forwardRef<DialogRef, DialogProps>(
  ({ children, className, ...props }, ref) => {
    const dialogRef = useRef<HTMLElement>(null);

    useImperativeHandle(ref, () => ({
      show: () => {
        if (dialogRef.current && 'show' in dialogRef.current) {
          (dialogRef.current as any).show();
        }
      },
      hide: () => {
        if (dialogRef.current && 'hide' in dialogRef.current) {
          (dialogRef.current as any).hide();
        }
      },
    }));

    return (
      <wa-dialog ref={dialogRef} class={clsx('Dialog', className)} {...props}>
        {children}
      </wa-dialog>
    );
  }
);

Dialog.displayName = 'Dialog';
