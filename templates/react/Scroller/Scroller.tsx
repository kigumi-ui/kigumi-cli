import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaScroller from '@awesome.me/webawesome/dist/components/scroller/scroller.js';
import './Scroller.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/scroller/scroller.js'));
}

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
export interface ScrollerProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {

  /** Scroll direction */
  orientation?: 'horizontal' | 'vertical' | 'both';

  /** Shows shadow indicators */
  'with-scroll-indicator'?: boolean;

  /** Hides the scrollbar */
  'without-scrollbar'?: boolean;

  /** Hides shadow indicators */
  'without-shadow'?: boolean;
}

export interface ScrollerRef {
  /** Reference to the underlying HTML element */
  element: WaScroller | null;
}

export const Scroller = forwardRef<ScrollerRef, ScrollerProps>(
  ({ children, className, ...props }, ref) => {
    const scrollerRef = useRef<WaScroller | null>(null);
    const setScrollerRef = useCallback((el: WaScroller | null) => {
      scrollerRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return scrollerRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-scroller
        ref={setScrollerRef}
        class={clsx('Scroller', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<string, unknown>)}
      >
        {children}
      </wa-scroller>
    );
  }
);

Scroller.displayName = 'Scroller';
