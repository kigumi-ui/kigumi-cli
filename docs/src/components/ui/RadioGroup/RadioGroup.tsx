import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/radio-group/radio-group.js';
import './RadioGroup.css';

/**
 * Radio groups are used to group multiple radios so only one can be selected
 *
 * @example
 * ```tsx
 * // Basic usage
 * <RadioGroup />
 *
 * // With event handlers
 * <RadioGroup
 *   onInput={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<RadioGroupRef>(null);
 * <button onClick={() => ref.current?.focus()}>Call Method</button>
 * <RadioGroup ref={ref} />
 * ```
 */
export interface RadioGroupProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onInput' | 'onChange' | 'onInvalid' | 'dir'
> {
  /** Group label */
  label?: string;

  /** Hint text */
  hint?: string;

  /** Form field name */
  name?: string;

  /** Selected value */
  value?: string;

  /** Radio size */
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';

  /** Layout direction */
  orientation?: 'horizontal' | 'vertical';

  /** Disables the group */
  disabled?: boolean;

  /** Shows invalid/error state */
  invalid?: boolean;

  /** Help text below the group */
  'help-text'?: string;

  /** Makes selection required */
  required?: boolean;

  /** Emitted when the radio group receives user input. */
  onInput?: (event: CustomEvent) => void;

  /** Emitted when the radio group's selected value changes. */
  onChange?: (event: CustomEvent) => void;

  /** Emitted when the form control has been checked for validity and its constraints aren't satisfied. */
  onInvalid?: (event: CustomEvent) => void;
}

export interface RadioGroupRef {
  /** Sets focus on the radio group. */
  focus: (options: FocusOptions) => void;
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const RadioGroup = forwardRef<RadioGroupRef, RadioGroupProps>(
  ({ children, className, onInput, onChange, onInvalid, ...props }, ref) => {
    const radiogroupRef = useRef<
      HTMLElement & {
        focus?: (options: FocusOptions) => void;
      }
    >(null);

    useImperativeHandle(
      ref,
      () => ({
        focus: (options: FocusOptions) => {
          if (
            radiogroupRef.current &&
            typeof radiogroupRef.current.focus === 'function'
          ) {
            radiogroupRef.current.focus(options);
          }
        },
        get element() {
          return radiogroupRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      const el = radiogroupRef.current;
      if (!el) return;

      const handleInput = (e: Event) => {
        if (onInput) onInput(e as CustomEvent);
      };

      const handleChange = (e: Event) => {
        if (onChange) onChange(e as CustomEvent);
      };

      const handleInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as CustomEvent);
      };

      el.addEventListener('input', handleInput);
      el.addEventListener('change', handleChange);
      el.addEventListener('wa-invalid', handleInvalid);

      return () => {
        el.removeEventListener('input', handleInput);
        el.removeEventListener('change', handleChange);
        el.removeEventListener('wa-invalid', handleInvalid);
      };
    }, [onInput, onChange, onInvalid]);

    return (
      <wa-radio-group
        ref={radiogroupRef}
        class={clsx('RadioGroup', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-radio-group>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';
