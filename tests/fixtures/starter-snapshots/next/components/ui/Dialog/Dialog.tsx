'use client';

import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaDialog from '@awesome.me/webawesome/dist/components/dialog/dialog.js';
import './Dialog.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/dialog/dialog.js'));
}

/**
 * Dialogs display important prompts and information
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Dialog />
 *
 * // With event handlers
 * <Dialog
 *   onShow={(e) => console.log(e)} />
 *
 * ```
 */
export interface DialogProps extends Omit<HTMLAttributes<HTMLElement>, 'onShow' | 'onAfterShow' | 'onHide' | 'onAfterHide' | 'dir'> {

  /** Indicates whether or not the dialog is open */
  open?: boolean;

  /** The dialog's label as displayed in the header */
  label: string;

  /** Disables the header and removes the default close button */
  'without-header'?: boolean;

  /** When enabled, the dialog will be closed when the user clicks outside of it */
  'light-dismiss'?: boolean;

  /** Emitted when the dialog opens. */
  onShow?: (event: CustomEvent) => void;

  /** Emitted after the dialog opens and all animations are complete. */
  onAfterShow?: (event: CustomEvent) => void;

  /** Emitted when the dialog is requested to close. Calling `event.preventDefault()` will prevent the dialog from closing. You can inspect `event.detail.source` to see which element caused the dialog to close. If the source is the dialog element itself, the user has pressed [[Escape]] or the dialog has been closed programmatically. Avoid using this unless closing the dialog will result in destructive behavior such as data loss. */
  onHide?: (event: CustomEvent) => void;

  /** Emitted after the dialog closes and all animations are complete. */
  onAfterHide?: (event: CustomEvent) => void;
}

export interface DialogRef {
  /** Reference to the underlying HTML element */
  element: WaDialog | null;
}

export const Dialog = forwardRef<DialogRef, DialogProps>(
  ({ children, className, onShow, onAfterShow, onHide, onAfterHide, ...props }, ref) => {
    const dialogRef = useRef<WaDialog | null>(null);
    const setDialogRef = useCallback((el: WaDialog | null) => {
      dialogRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return dialogRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = dialogRef.current;
      if (!el) return;

      const handleWaShow = (e: Event) => {
        if (onShow) onShow(e as CustomEvent);
      };

      const handleWaAfterShow = (e: Event) => {
        if (onAfterShow) onAfterShow(e as CustomEvent);
      };

      const handleWaHide = (e: Event) => {
        if (onHide) onHide(e as CustomEvent);
      };

      const handleWaAfterHide = (e: Event) => {
        if (onAfterHide) onAfterHide(e as CustomEvent);
      };

      el.addEventListener('wa-show', handleWaShow);
      el.addEventListener('wa-after-show', handleWaAfterShow);
      el.addEventListener('wa-hide', handleWaHide);
      el.addEventListener('wa-after-hide', handleWaAfterHide);

      return () => {
        el.removeEventListener('wa-show', handleWaShow);
        el.removeEventListener('wa-after-show', handleWaAfterShow);
        el.removeEventListener('wa-hide', handleWaHide);
        el.removeEventListener('wa-after-hide', handleWaAfterHide);
      };
    }, [onShow, onAfterShow, onHide, onAfterHide]);

    return (
      <wa-dialog
        ref={setDialogRef}
        class={clsx('Dialog', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<string, unknown>)}
      >
        {children}
      </wa-dialog>
    );
  }
);

Dialog.displayName = 'Dialog';
