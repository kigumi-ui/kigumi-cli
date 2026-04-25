import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaFormatDate from '@awesome.me/webawesome/dist/components/format-date/format-date.js';
import './FormatDate.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/format-date/format-date.js'));
}

/**
 * Formats a date/time using the Intl.DateTimeFormat API
 *
 * @example
 * ```tsx
 * // Basic usage
 * <FormatDate />
 *
 * // With event handlers
 * <FormatDate />
 *
 * ```
 */
export interface FormatDateProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {

  /** The date/time to format */
  date?: string;

  /** How to display the weekday */
  weekday?: 'narrow' | 'short' | 'long';

  /** How to display the era */
  era?: 'narrow' | 'short' | 'long';

  /** How to display the year */
  year?: 'numeric' | '2-digit';

  /** How to display the month */
  month?: 'numeric' | '2-digit' | 'narrow' | 'short' | 'long';

  /** How to display the day */
  day?: 'numeric' | '2-digit';

  /** How to display the hour */
  hour?: 'numeric' | '2-digit';

  /** How to display the minute */
  minute?: 'numeric' | '2-digit';

  /** How to display the second */
  second?: 'numeric' | '2-digit';

  /** 12 or 24 hour format */
  'hour-format'?: 'auto' | '12' | '24';

  /** How to display the time zone */
  'time-zone-name'?: 'short' | 'long';

  /** The time zone to use */
  'time-zone'?: string;

  /** The locale to use when formatting */
  lang?: string;
}

export interface FormatDateRef {
  /** Reference to the underlying HTML element */
  element: WaFormatDate | null;
}

export const FormatDate = forwardRef<FormatDateRef, FormatDateProps>(
  ({ children, className, ...props }, ref) => {
    const formatdateRef = useRef<WaFormatDate | null>(null);
    const setFormatDateRef = useCallback((el: WaFormatDate | null) => {
      formatdateRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return formatdateRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-format-date
        ref={setFormatDateRef}
        class={clsx('FormatDate', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<string, unknown>)}
      >
        {children}
      </wa-format-date>
    );
  }
);

FormatDate.displayName = 'FormatDate';
