import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/card/card.js';
import './Card.css';

/**
 * Cards can be used to group related subjects in a container
 *
 * @example
 * ```tsx
 * <Card>
 *   <div slot="header">Card Header</div>
 *   <p>Card content goes here</p>
 *   <div slot="footer">Card Footer</div>
 * </Card>
 * ```
 */
export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {
  /** Visual appearance style */
  appearance?: 'outlined' | 'filled-outlined' | 'plain' | 'filled' | 'accent';
  /** Card layout orientation */
  orientation?: 'vertical' | 'horizontal';
  /** Adds header section (for SSR) */
  'with-header'?: boolean;
  /** Adds footer section (for SSR) */
  'with-footer'?: boolean;
  /** Adds media section (for SSR) */
  'with-media'?: boolean;
}

export const Card = forwardRef<HTMLElement, CardProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <wa-card
        ref={ref}
        class={clsx('Card', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-card>
    );
  }
);

Card.displayName = 'Card';
