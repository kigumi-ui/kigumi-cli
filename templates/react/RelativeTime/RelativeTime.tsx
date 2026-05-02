import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaRelativeTime from '@awesome.me/webawesome/dist/components/relative-time/relative-time.js';
import './RelativeTime.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/relative-time/relative-time.js'));
}

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
  element: WaRelativeTime | null;
}

export const RelativeTime = forwardRef<RelativeTimeRef, RelativeTimeProps>(
  ({ children, className, ...props }, ref) => {
    const relativetimeRef = useRef<WaRelativeTime | null>(null);
    const setRelativeTimeRef = useCallback((el: WaRelativeTime | null) => {
      relativetimeRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return relativetimeRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-relative-time
        ref={setRelativeTimeRef}
        class={clsx('RelativeTime', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-relative-time>
    );
  }
);

RelativeTime.displayName = 'RelativeTime';
