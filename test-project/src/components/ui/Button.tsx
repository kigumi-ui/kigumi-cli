import React, { forwardRef } from 'react';
import '@awesome.me/webawesome/dist/components/button/button.js';

/**
 * Buttons represent actions that are available to the user
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="medium">
 *   Click me
 * </Button>
 * ```
 */
export interface ButtonProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Semantic variant of the button
   * @type 'neutral' | 'brand' | 'success' | 'warning' | 'danger'
   * @default 'neutral'
   */
  variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
  /**
   * Visual appearance style
   * @type 'accent' | 'filled-outlined' | 'filled' | 'outlined' | 'plain'
   * @default 'filled'
   */
  appearance?: 'accent' | 'filled-outlined' | 'filled' | 'outlined' | 'plain';
  /**
   * Button size
   * @type 'small' | 'medium' | 'large'
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Gives the button rounded edges
   
   * @default 'false'
   */
  pill?: boolean;
  /**
   * Disables the button
   
   * @default 'false'
   */
  disabled?: boolean;
  /**
   * Shows a loading indicator
   
   * @default 'false'
   */
  loading?: boolean;
  /**
   * Adds a dropdown indicator caret
   
   * @default 'false'
   */
  'with-caret'?: boolean;
  /**
   * Makes the button work like a link
   
   
   */
  href?: string;
  /**
   * Link target (when href is set)
   * @type '_blank' | '_self' | '_parent' | '_top'
   
   */
  target?: '_blank' | '_self' | '_parent' | '_top';
  /**
   * Download filename (when href is set)
   
   
   */
  download?: string;
  /**
   * Link relationship (when href is set)
   
   
   */
  rel?: string;
}

export const Button = forwardRef<HTMLElement, ButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <wa-button ref={ref} className={className} {...props}>
        {children}
      </wa-button>
    );
  }
);

Button.displayName = 'Button';
