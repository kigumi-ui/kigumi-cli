import React, { forwardRef } from 'react';
import '@awesome.me/webawesome/dist/components/input/input.js';

/**
 * Inputs collect data from the user
 *
 * @example
 * ```tsx
 * <Input variant="primary" size="medium">
 *   Click me
 * </Input>
 * ```
 */
export interface InputProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Input type
   * @type 'text' | 'email' | 'password' | 'number' | 'date' | 'tel' | 'url' | 'search'
   * @default 'text'
   */
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'tel' | 'url' | 'search';
  /**
   * Accessible label for the input
   
   
   */
  label?: string;
  /**
   * Descriptive hint text
   
   
   */
  hint?: string;
  /**
   * Placeholder text
   
   
   */
  placeholder?: string;
  /**
   * Input value
   
   
   */
  value?: string;
  /**
   * Visual appearance style
   * @type 'filled' | 'filled-outlined' | 'outlined'
   * @default 'outlined'
   */
  appearance?: 'filled' | 'filled-outlined' | 'outlined';
  /**
   * Input size
   * @type 'small' | 'medium' | 'large'
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Gives the input rounded edges
   
   * @default 'false'
   */
  pill?: boolean;
  /**
   * Disables the input
   
   * @default 'false'
   */
  disabled?: boolean;
  /**
   * Adds a clear button when input has content
   
   * @default 'false'
   */
  'with-clear'?: boolean;
  /**
   * Adds a toggle button for password visibility
   
   * @default 'false'
   */
  'password-toggle'?: boolean;
}

export const Input = forwardRef<HTMLElement, InputProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <wa-input ref={ref} className={className} {...props}>
        {children}
      </wa-input>
    );
  }
);

Input.displayName = 'Input';
