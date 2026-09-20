import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/callout/callout.js';
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
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';

  /** The callout's theme variant */
  variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
}

export interface CalloutRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const Callout = forwardRef<CalloutRef, CalloutProps>(
  ({ children, className, ...props }, ref) => {
    const calloutRef = useRef<HTMLElement & {}>(null);

    const setCalloutRef = useCallback((el: typeof calloutRef.current) => {
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

    return (
      <wa-callout
        ref={setCalloutRef}
        class={clsx('Callout', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-callout>
    );
  }
);

Callout.displayName = 'Callout';
