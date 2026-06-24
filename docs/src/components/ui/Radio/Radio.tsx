import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/radio/radio.js';
import './Radio.css';

/**
 * Radios allow the user to select a single option from a group
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Radio />
 *
 * // With event handlers
 * <Radio
 *   onBlur={(e) => console.log(e)} />
 *
 * ```
 */
export interface RadioProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onBlur' | 'onFocus' | 'dir'
> {
  /** The radio value */
  value?: string;

  /** Visual appearance */
  appearance?: string;

  /** Disables the radio */
  disabled?: boolean;

  /** Radio size */
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';

  /** Emitted when the control loses focus. */
  onBlur?: (event: FocusEvent) => void;

  /** Emitted when the control gains focus. */
  onFocus?: (event: FocusEvent) => void;
}

export interface RadioRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const Radio = forwardRef<RadioRef, RadioProps>(
  ({ children, className, onBlur, onFocus, ...props }, ref) => {
    const radioRef = useRef<HTMLElement & {}>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return radioRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      const el = radioRef.current;
      if (!el) return;

      const handleBlur = (e: Event) => {
        if (onBlur) onBlur(e as FocusEvent);
      };

      const handleFocus = (e: Event) => {
        if (onFocus) onFocus(e as FocusEvent);
      };

      el.addEventListener('blur', handleBlur);
      el.addEventListener('focus', handleFocus);

      return () => {
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('focus', handleFocus);
      };
    }, [onBlur, onFocus]);

    return (
      <wa-radio
        ref={radioRef}
        class={clsx('Radio', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-radio>
    );
  }
);

Radio.displayName = 'Radio';
