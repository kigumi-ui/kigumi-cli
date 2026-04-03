import {
  forwardRef,
  useRef,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/callout/callout.js';
import type WaElement from '@awesome.me/webawesome-pro/dist/components/callout/callout.js';
import './Callout.css';

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
  /** Reference to the underlying element */
  element: WaElement | null;
}

export const Callout = forwardRef<CalloutRef, CalloutProps>(
  ({ children, className, ...props }, ref) => {
    const calloutRef = useRef<WaElement | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return calloutRef.current;
        },
      }),
      []
    );

    return (
      <wa-callout
        ref={(el: WaElement | null) => {
          calloutRef.current = el;
        }}
        class={clsx('Callout', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-callout>
    );
  }
);

Callout.displayName = 'Callout';
