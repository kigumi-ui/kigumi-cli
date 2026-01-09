import React from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/button/button.js';
import './Button.css';

/**
 * Buttons represent actions that are available to the user
 *
 * @example
 * ```tsx
 * <Button variant="brand">Click me</Button>
 * <Button appearance="outlined" size="large">Large Button</Button>
 * <Button loading>Loading...</Button>
 * <Button data-dialog="close">Close Dialog</Button>
 * ```
 */
export interface ButtonProps extends React.HTMLAttributes<HTMLElement> {
  /** Semantic variant of the button */
  variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
  /** Visual appearance style */
  appearance?: 'accent' | 'filled-outlined' | 'filled' | 'outlined' | 'plain';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Gives the button rounded edges */
  pill?: boolean;
  /** Disables the button */
  disabled?: boolean;
  /** Shows a loading indicator */
  loading?: boolean;
  /** Adds a dropdown indicator caret */
  'with-caret'?: boolean;
  /** Makes the button work like a link */
  href?: string;
  /** Link target (when href is set) */
  target?: '_blank' | '_self' | '_parent' | '_top';
  /** Download filename (when href is set) */
  download?: string;
  /** Link relationship (when href is set) */
  rel?: string;
  /** Dialog control attribute (e.g., "close" to close parent dialog) */
  'data-dialog'?: string;
}

export const Button = React.forwardRef<HTMLElement, ButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <wa-button ref={ref} class={clsx('Button', className)} {...props}>
        {children}
      </wa-button>
    );
  }
);

Button.displayName = 'Button';
