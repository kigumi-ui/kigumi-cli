import {
  forwardRef,
  useRef,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/option/option.js';
import './Option.css';

/**
 * Options define the selectable items within various form controls
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Option />
 *
 * // With event handlers
 * <Option />
 *
 * ```
 */
export interface OptionProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {
  /** The option value */
  value?: string;

  /** Disables the option */
  disabled?: boolean;

  /** Draws the option in a selected state */
  selected?: boolean;

  /** A custom label for the option (used by select's display input) */
  label?: string;
}

export interface OptionRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const Option = forwardRef<OptionRef, OptionProps>(
  ({ children, className, ...props }, ref) => {
    const optionRef = useRef<HTMLElement & {}>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return optionRef.current;
        },
      }),
      []
    );

    return (
      <wa-option
        ref={optionRef}
        class={clsx('Option', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-option>
    );
  }
);

Option.displayName = 'Option';
