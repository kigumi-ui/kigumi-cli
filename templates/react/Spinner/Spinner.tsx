import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaSpinner from '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import './Spinner.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/spinner/spinner.js'));
}

/**
 * Spinners are used to show the progress of an indeterminate operation
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Spinner />
 *
 * // With event handlers
 * <Spinner />
 *
 * ```
 */
export interface SpinnerProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {

}

export interface SpinnerRef {
  /** Reference to the underlying HTML element */
  element: WaSpinner | null;
}

export const Spinner = forwardRef<SpinnerRef, SpinnerProps>(
  ({ children, className, ...props }, ref) => {
    const spinnerRef = useRef<WaSpinner | null>(null);
    const setSpinnerRef = useCallback((el: WaSpinner | null) => {
      spinnerRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return spinnerRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-spinner
        ref={setSpinnerRef}
        class={clsx('Spinner', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<string, unknown>)}
      >
        {children}
      </wa-spinner>
    );
  }
);

Spinner.displayName = 'Spinner';
