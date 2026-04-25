import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaOption from '@awesome.me/webawesome/dist/components/option/option.js';
import './Option.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/option/option.js'));
}

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
  element: WaOption | null;
}

export const Option = forwardRef<OptionRef, OptionProps>(
  ({ children, className, ...props }, ref) => {
    const optionRef = useRef<WaOption | null>(null);
    const setOptionRef = useCallback((el: WaOption | null) => {
      optionRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return optionRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-option
        ref={setOptionRef}
        class={clsx('Option', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<string, unknown>)}
      >
        {children}
      </wa-option>
    );
  }
);

Option.displayName = 'Option';
