import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/switch/switch.js';
import './Switch.css';

/**
 * Switches allow the user to toggle an option on or off
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Switch />
 *
 * // With event handlers
 * <Switch
 *   onChange={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<SwitchRef>(null);
 * <button onClick={() => ref.current?.click()}>Call Method</button>
 * <Switch ref={ref} />
 * ```
 */
export interface SwitchProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onChange' | 'onInput' | 'onBlur' | 'onFocus' | 'onInvalid' | 'dir'
> {
  /** Form field name */
  name?: string;

  /** Form value when checked */
  value?: string;

  /** Switch size */
  size?: 'small' | 'medium' | 'large';

  /** Disables the switch */
  disabled?: boolean;

  /** Whether the switch is on */
  checked?: boolean;

  /** Makes the switch required */
  required?: boolean;

  /** Hint text */
  hint?: string;

  /** Emitted when the control's checked state changes. */
  onChange?: (event: CustomEvent) => void;

  /** Emitted when the control receives input. */
  onInput?: (event: CustomEvent) => void;

  /** Emitted when the control loses focus. */
  onBlur?: (event: FocusEvent) => void;

  /** Emitted when the control gains focus. */
  onFocus?: (event: FocusEvent) => void;

  /** Emitted when the form control has been checked for validity and its constraints aren't satisfied. */
  onInvalid?: (event: CustomEvent) => void;
}

export interface SwitchRef {
  /** Simulates a click on the switch. */
  click: () => void;

  /** Sets focus on the switch. */
  focus: (options: FocusOptions) => void;

  /** Removes focus from the switch. */
  blur: () => void;
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const Switch = forwardRef<SwitchRef, SwitchProps>(
  (
    {
      children,
      className,
      onChange,
      onInput,
      onBlur,
      onFocus,
      onInvalid,
      ...props
    },
    ref
  ) => {
    const switchRef = useRef<
      HTMLElement & {
        click?: () => void;
        focus?: (options: FocusOptions) => void;
        blur?: () => void;
      }
    >(null);

    useImperativeHandle(
      ref,
      () => ({
        click: () => {
          if (
            switchRef.current &&
            typeof switchRef.current.click === 'function'
          ) {
            switchRef.current.click();
          }
        },
        focus: (options: FocusOptions) => {
          if (
            switchRef.current &&
            typeof switchRef.current.focus === 'function'
          ) {
            switchRef.current.focus(options);
          }
        },
        blur: () => {
          if (
            switchRef.current &&
            typeof switchRef.current.blur === 'function'
          ) {
            switchRef.current.blur();
          }
        },
        get element() {
          return switchRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      const el = switchRef.current;
      if (!el) return;

      const handleChange = (e: Event) => {
        if (onChange) onChange(e as CustomEvent);
      };

      const handleInput = (e: Event) => {
        if (onInput) onInput(e as CustomEvent);
      };

      const handleBlur = (e: Event) => {
        if (onBlur) onBlur(e as FocusEvent);
      };

      const handleFocus = (e: Event) => {
        if (onFocus) onFocus(e as FocusEvent);
      };

      const handleInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as CustomEvent);
      };

      el.addEventListener('change', handleChange);
      el.addEventListener('input', handleInput);
      el.addEventListener('blur', handleBlur);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('wa-invalid', handleInvalid);

      return () => {
        el.removeEventListener('change', handleChange);
        el.removeEventListener('input', handleInput);
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('wa-invalid', handleInvalid);
      };
    }, [onChange, onInput, onBlur, onFocus, onInvalid]);

    return (
      <wa-switch
        ref={switchRef}
        class={clsx('Switch', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-switch>
    );
  }
);

Switch.displayName = 'Switch';
