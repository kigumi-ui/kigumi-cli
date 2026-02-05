import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/scroller/scroller.js';
import './Scroller.css';

export interface ScrollerProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** The scroller's orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Removes the visible scrollbar */
  'without-scrollbar'?: boolean;
  /** Removes the shadows */
  'without-shadow'?: boolean;
}

export const Scroller = forwardRef<HTMLElement, ScrollerProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <wa-scroller
        ref={ref}
        class={clsx('Scroller', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-scroller>
    );
  }
);

Scroller.displayName = 'Scroller';
