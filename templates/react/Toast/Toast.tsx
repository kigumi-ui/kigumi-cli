import { forwardRef, useRef, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import './Toast.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/toast/toast.js'));
}

/**
 * Container that manages and stacks lightweight notification banners at a chosen screen edge
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Toast />
 *
 * // With event handlers
 * <Toast />
 *
 * // With ref methods
 * const ref = useRef<ToastRef>(null);
 * <button onClick={() => ref.current?.create()}>Call Method</button>
 * <Toast ref={ref} />
 * ```
 */
export interface ToastProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {

  /** Screen corner or edge where notifications are anchored */
  placement?: 'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end';
}

export interface ToastRef {

  /** Creates a toast notification programmatically and adds it to the stack. Returns a reference to the created toast
item element. */
  create: (message: string, options: ToastCreateOptions) => void;
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const Toast = forwardRef<ToastRef, ToastProps>(
  ({ children, className, ...props }, ref) => {
    const toastRef = useRef<HTMLElement & {
      create?: (message: string, options: ToastCreateOptions) => void;
    }>(null);

    useImperativeHandle(
      ref,
      () => ({
        create: (message: string, options: ToastCreateOptions) => {
          if (toastRef.current && typeof toastRef.current.create === 'function') {
            toastRef.current.create(message, options);
          }
        },
        get element() {
          return toastRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-toast
        ref={toastRef}
        class={clsx('Toast', className)}
        suppressHydrationWarning
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-toast>
    );
  }
);

Toast.displayName = 'Toast';
