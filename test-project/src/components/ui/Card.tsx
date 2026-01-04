import React, { forwardRef } from 'react';
import '@awesome.me/webawesome/dist/components/card/card.js';

/**
 * Cards can be used to group related subjects in a container
 *
 * @example
 * ```tsx
 * <Card variant="primary" size="medium">
 *   Click me
 * </Card>
 * ```
 */
export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Visual appearance style
   * @type 'outlined' | 'filled-outlined' | 'plain' | 'filled' | 'accent'
   * @default 'outlined'
   */
  appearance?: 'outlined' | 'filled-outlined' | 'plain' | 'filled' | 'accent';
  /**
   * Card layout orientation
   * @type 'vertical' | 'horizontal'
   * @default 'vertical'
   */
  orientation?: 'vertical' | 'horizontal';
  /**
   * Adds header section (for SSR)
   
   * @default 'false'
   */
  'with-header'?: boolean;
  /**
   * Adds footer section (for SSR)
   
   * @default 'false'
   */
  'with-footer'?: boolean;
  /**
   * Adds media section (for SSR)
   
   * @default 'false'
   */
  'with-media'?: boolean;
}

export const Card = forwardRef<HTMLElement, CardProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <wa-card ref={ref} className={className} {...props}>
        {children}
      </wa-card>
    );
  }
);

Card.displayName = 'Card';
