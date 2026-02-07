import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/format-date/format-date.js';
import './FormatDate.css';

export interface FormatDateProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** The date/time to format */
  date?: Date | string;
  /** Format for displaying the weekday */
  weekday?: 'narrow' | 'short' | 'long';
  /** Format for displaying the era */
  era?: 'narrow' | 'short' | 'long';
  /** Format for displaying the year */
  year?: 'numeric' | '2-digit';
  /** Format for displaying the month */
  month?: 'numeric' | '2-digit' | 'narrow' | 'short' | 'long';
  /** Format for displaying the day */
  day?: 'numeric' | '2-digit';
  /** Format for displaying the hour */
  hour?: 'numeric' | '2-digit';
  /** Format for displaying the minute */
  minute?: 'numeric' | '2-digit';
  /** Format for displaying the second */
  second?: 'numeric' | '2-digit';
  /** Format for 12 or 24-hour time */
  'hour-format'?: 'auto' | '12' | '24';
  /** Time zone to express the time in */
  'time-zone'?: string;
  /** Format for displaying the time zone */
  'time-zone-name'?: 'short' | 'long';
}

export const FormatDate = forwardRef<HTMLElement, FormatDateProps>(
  ({ className, ...props }, ref) => {
    return (
      <wa-format-date
        ref={ref}
        class={clsx('FormatDate', className)}
        {...(props as Record<string, unknown>)}
      />
    );
  }
);

FormatDate.displayName = 'FormatDate';
