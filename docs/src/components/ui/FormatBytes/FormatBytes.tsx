import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/format-bytes/format-bytes.js';
import './FormatBytes.css';

export interface FormatBytesProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** The number to format in bytes */
  value: number;
  /** The type of unit to display */
  unit?: 'byte' | 'bit';
  /** Determines how to display the result */
  display?: 'long' | 'short' | 'narrow';
}

export const FormatBytes = forwardRef<HTMLElement, FormatBytesProps>(
  ({ className, ...props }, ref) => {
    return (
      <wa-format-bytes
        ref={ref}
        class={clsx('FormatBytes', className)}
        {...(props as Record<string, unknown>)}
      />
    );
  }
);

FormatBytes.displayName = 'FormatBytes';
