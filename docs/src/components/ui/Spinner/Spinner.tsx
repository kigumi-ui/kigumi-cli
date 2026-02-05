import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/spinner/spinner.js';
import './Spinner.css';

export type SpinnerProps = Omit<HTMLAttributes<HTMLElement>, 'dir'>;

export const Spinner = forwardRef<HTMLElement, SpinnerProps>(
  ({ className, ...props }, ref) => {
    return (
      <wa-spinner
        ref={ref}
        class={clsx('Spinner', className)}
        {...(props as Record<string, unknown>)}
      />
    );
  }
);

Spinner.displayName = 'Spinner';
