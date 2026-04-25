import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaResizeObserver from '@awesome.me/webawesome/dist/components/resize-observer/resize-observer.js';
import './ResizeObserver.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/resize-observer/resize-observer.js'));
}

/**
 * Reports changes to the dimensions of an element
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ResizeObserver />
 *
 * // With event handlers
 * <ResizeObserver
 *   onResize={(e) => console.log(e)} />
 *
 * ```
 */
export interface ResizeObserverProps extends Omit<HTMLAttributes<HTMLElement>, 'onResize' | 'dir'> {

  /** Disables the observer */
  disabled?: boolean;

  /** Emitted when the element is resized. */
  onResize?: (event: CustomEvent) => void;
}

export interface ResizeObserverRef {
  /** Reference to the underlying HTML element */
  element: WaResizeObserver | null;
}

export const ResizeObserver = forwardRef<ResizeObserverRef, ResizeObserverProps>(
  ({ children, className, onResize, ...props }, ref) => {
    const resizeobserverRef = useRef<WaResizeObserver | null>(null);
    const setResizeObserverRef = useCallback((el: WaResizeObserver | null) => {
      resizeobserverRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return resizeobserverRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = resizeobserverRef.current;
      if (!el) return;

      const handleWaResize = (e: Event) => {
        if (onResize) onResize(e as CustomEvent);
      };

      el.addEventListener('wa-resize', handleWaResize);

      return () => {
        el.removeEventListener('wa-resize', handleWaResize);
      };
    }, [onResize]);

    return (
      <wa-resize-observer
        ref={setResizeObserverRef}
        class={clsx('ResizeObserver', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<string, unknown>)}
      >
        {children}
      </wa-resize-observer>
    );
  }
);

ResizeObserver.displayName = 'ResizeObserver';
