import {
  forwardRef,
  useRef,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/relative-time/relative-time.js';
import './RelativeTime.css';

/**
 * Outputs a localized time phrase relative to the current date and time
 *
 * @example
 * ```tsx
 * // Basic usage
 * <RelativeTime />
 *
 * // With event handlers
 * <RelativeTime />
 *
 * ```
 */
export interface RelativeTimeProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** The date/time to calculate from */
  date?: string;

  /** The formatting style */
  format?: 'long' | 'short' | 'narrow';

  /** When to use numeric values */
  numeric?: 'always' | 'auto';

  /** Keeps time in sync */
  sync?: boolean;

  /** The locale to use */
  lang?: string;
}

export interface RelativeTimeRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const RelativeTime = forwardRef<RelativeTimeRef, RelativeTimeProps>(
  ({ children, className, ...props }, ref) => {
    const relativetimeRef = useRef<HTMLElement & {}>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return relativetimeRef.current;
        },
      }),
      []
    );

    return (
      <wa-relative-time
        ref={relativetimeRef}
        class={clsx('RelativeTime', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-relative-time>
    );
  }
);

RelativeTime.displayName = 'RelativeTime';
