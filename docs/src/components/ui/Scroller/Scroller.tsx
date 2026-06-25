import {
  forwardRef,
  useRef,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/scroller/scroller.js';
import './Scroller.css';

/**
 * Adds a scrollable container with optional shadow indicators
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Scroller />
 *
 * // With event handlers
 * <Scroller />
 *
 * ```
 */
export interface ScrollerProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** Scroll direction */
  orientation?: 'horizontal' | 'vertical';

  /** Shows shadow indicators */
  'with-scroll-indicator'?: boolean;

  /** Hides the scrollbar */
  'without-scrollbar'?: boolean;

  /** Hides shadow indicators */
  'without-shadow'?: boolean;
}

export interface ScrollerRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const Scroller = forwardRef<ScrollerRef, ScrollerProps>(
  ({ children, className, ...props }, ref) => {
    const scrollerRef = useRef<HTMLElement & {}>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return scrollerRef.current;
        },
      }),
      []
    );

    return (
      <wa-scroller
        ref={scrollerRef}
        class={clsx('Scroller', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-scroller>
    );
  }
);

Scroller.displayName = 'Scroller';
