import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/progress-ring/progress-ring.js';
import './ProgressRing.css';

export interface ProgressRingProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** The current progress as a percentage, 0 to 100 */
  value?: number;
  /** A custom label for assistive devices */
  label?: string;
}

export const ProgressRing = forwardRef<HTMLElement, ProgressRingProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <wa-progress-ring
        ref={ref}
        class={clsx('ProgressRing', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-progress-ring>
    );
  }
);

ProgressRing.displayName = 'ProgressRing';
