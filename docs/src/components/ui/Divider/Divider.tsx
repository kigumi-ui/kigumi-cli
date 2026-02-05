import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/divider/divider.js';
import './Divider.css';

export interface DividerProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {
  /** Sets the divider's orientation */
  orientation?: 'horizontal' | 'vertical';
}

export const Divider = forwardRef<HTMLElement, DividerProps>(
  ({ className, orientation, ...props }, ref) => {
    return (
      <wa-divider
        ref={ref}
        class={clsx('Divider', className)}
        orientation={orientation}
        {...(props as Record<string, unknown>)}
      />
    );
  }
);

Divider.displayName = 'Divider';
