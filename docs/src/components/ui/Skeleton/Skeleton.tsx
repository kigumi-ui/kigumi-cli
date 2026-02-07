import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/skeleton/skeleton.js';
import './Skeleton.css';

export interface SkeletonProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** Determines which effect the skeleton will use */
  effect?: 'pulse' | 'sheen' | 'none';
}

export const Skeleton = forwardRef<HTMLElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <wa-skeleton
        ref={ref}
        class={clsx('Skeleton', className)}
        {...(props as Record<string, unknown>)}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';
