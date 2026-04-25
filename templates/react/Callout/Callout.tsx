import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaCallout from '@awesome.me/webawesome/dist/components/callout/callout.js';
import './Callout.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/callout/callout.js'));
}

/**
 * Callouts are used to display important messages inline
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Callout />
 *
 * // With event handlers
 * <Callout />
 *
 * ```
 */
export interface CalloutProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {

  /** The callout's visual appearance */
  appearance?: 'accent' | 'filled' | 'outlined' | 'plain' | 'filled-outlined';

  /** The callout's size */
  size?: 'small' | 'medium' | 'large';

  /** The callout's theme variant */
  variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
}

export interface CalloutRef {
  /** Reference to the underlying HTML element */
  element: WaCallout | null;
}

export const Callout = forwardRef<CalloutRef, CalloutProps>(
  ({ children, className, ...props }, ref) => {
    const calloutRef = useRef<WaCallout | null>(null);
    const setCalloutRef = useCallback((el: WaCallout | null) => {
      calloutRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return calloutRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-callout
        ref={setCalloutRef}
        class={clsx('Callout', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<string, unknown>)}
      >
        {children}
      </wa-callout>
    );
  }
);

Callout.displayName = 'Callout';
