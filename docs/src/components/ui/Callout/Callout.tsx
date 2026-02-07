import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/callout/callout.js';
import './Callout.css';

export interface CalloutProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {
  /** The callout's visual appearance */
  appearance?: 'accent' | 'filled' | 'outlined' | 'plain' | 'filled-outlined';
  /** The callout's size */
  size?: 'small' | 'medium' | 'large';
  /** The callout's theme variant */
  variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
}

export const Callout = forwardRef<HTMLElement, CalloutProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <wa-callout
        ref={ref}
        class={clsx('Callout', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-callout>
    );
  }
);

Callout.displayName = 'Callout';
