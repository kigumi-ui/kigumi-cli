import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/resize-observer/resize-observer.js';
import './ResizeObserver.css';

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
export interface ResizeObserverProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onResize' | 'dir'
> {
  /** Disables the observer */
  disabled?: boolean;

  /** Emitted when the element is resized. */
  onResize?: (event: CustomEvent) => void;
}

export interface ResizeObserverRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const ResizeObserver = forwardRef<
  ResizeObserverRef,
  ResizeObserverProps
>(({ children, className, onResize, ...props }, ref) => {
  const resizeobserverRef = useRef<HTMLElement & {}>(null);

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
    const el = resizeobserverRef.current;
    if (!el) return;

    const handleResize = (e: Event) => {
      if (onResize) onResize(e as CustomEvent);
    };

    el.addEventListener('wa-resize', handleResize);

    return () => {
      el.removeEventListener('wa-resize', handleResize);
    };
  }, [onResize]);

  return (
    <wa-resize-observer
      ref={resizeobserverRef}
      class={clsx('ResizeObserver', className)}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </wa-resize-observer>
  );
});

ResizeObserver.displayName = 'ResizeObserver';
