import React, { forwardRef } from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome/dist/components/input/input.js';
import './Input.css';

/**
 * Inputs collect data from the user
 *
 * @example
 * ```tsx
 * <Input label="Email" type="email" placeholder="Enter email" />
 * <Input type="password" password-toggle />
 * <Input with-clear hint="Help text" />
 * ```
 */
export interface InputProps extends React.HTMLAttributes<HTMLElement> {
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'tel' | 'url' | 'search';
  /** Accessible label for the input */
  label?: string;
  /** Descriptive hint text */
  hint?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Input value */
  value?: string;
  /** Visual appearance style */
  appearance?: 'filled' | 'filled-outlined' | 'outlined';
  /** Input size */
  size?: 'small' | 'medium' | 'large';
  /** Gives the input rounded edges */
  pill?: boolean;
  /** Disables the input */
  disabled?: boolean;
  /** Adds a clear button when input has content */
  'with-clear'?: boolean;
  /** Adds a toggle button for password visibility */
  'password-toggle'?: boolean;
}

export const Input = forwardRef<HTMLElement, InputProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <wa-input ref={ref} class={clsx('Input', className)} {...props}>
        {children}
      </wa-input>
    );
  }
);

Input.displayName = 'Input';
