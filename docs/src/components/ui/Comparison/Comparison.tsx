import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/comparison/comparison.js';
import './Comparison.css';

/**
 * Compare visual differences between similar content with a sliding panel
 *
 * @example
 * ```tsx
 * <Comparison position={50}>
 *   <img slot="before" src="before.jpg" alt="Before" />
 *   <img slot="after" src="after.jpg" alt="After" />
 * </Comparison>
 * ```
 */
export interface ComparisonProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** Divider location as percentage (0-100) */
  position?: number;
}

export const Comparison = forwardRef<HTMLElement, ComparisonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <wa-comparison
        ref={ref}
        class={clsx('Comparison', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-comparison>
    );
  }
);

Comparison.displayName = 'Comparison';
