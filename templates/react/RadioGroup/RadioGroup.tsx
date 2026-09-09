import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaRadioGroup from '@awesome.me/webawesome/dist/components/radio-group/radio-group.js';
import './RadioGroup.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/radio-group/radio-group.js'));
}

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

  /** Makes selection required */
  required?: boolean;

  /** Layout direction */
  orientation?: 'horizontal' | 'vertical';

  /** Disables the group */
  disabled?: boolean;

  /** Shows invalid/error state */
  invalid?: boolean;

  /** Help text below the group */
  'help-text'?: string;

  /** Emitted when the radio group receives user input. */
  onInput?: (event: InputEvent) => void;

  /** Emitted when the radio group's selected value changes. */
  onChange?: (event: Event) => void;

  /** Emitted when the form control has been checked for validity and its constraints aren't satisfied. */
  onInvalid?: (event: CustomEvent) => void;
}

export interface RadioGroupRef {
  /** Sets focus on the radio group. */
  focus: (options: FocusOptions) => void;

  /** Do not use this when creating a "Validator". This is intended for end users of components.
We track manually defined custom errors so we don't clear them on accident in our validators. */
  setCustomValidity: (message: string) => void;

  /** Called when the browser is trying to restore element’s state to state in which case reason is "restore", or when
the browser is trying to fulfill autofill on behalf of user in which case reason is "autocomplete". In the case of
"restore", state is a string, File, or FormData object previously set as the second argument to setFormValue. */
  formStateRestoreCallback: (
    state: string | File | FormData | null,
    reason: 'autocomplete' | 'restore'
  ) => void;

  /** Reset validity is a way of removing manual custom errors and native validation. */
  resetValidity: () => void;
  /** Reference to the underlying HTML element */
  element: WaRadioGroup | null;
}

export const RadioGroup = forwardRef<RadioGroupRef, RadioGroupProps>(
  ({ children, className, onInput, onChange, onInvalid, ...props }, ref) => {
    const radiogroupRef = useRef<WaRadioGroup | null>(null);
    const setRadioGroupRef = useCallback((el: WaRadioGroup | null) => {
      radiogroupRef.current = el;
    }, []);

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
        setCustomValidity: (message: string) => {
          if (
            radiogroupRef.current &&
            typeof radiogroupRef.current.setCustomValidity === 'function'
          ) {
            radiogroupRef.current.setCustomValidity(message);
          }
        },
        formStateRestoreCallback: (
          state: string | File | FormData | null,
          reason: 'autocomplete' | 'restore'
        ) => {
          if (
            radiogroupRef.current &&
            typeof radiogroupRef.current.formStateRestoreCallback === 'function'
          ) {
            radiogroupRef.current.formStateRestoreCallback(state, reason);
          }
        },
        resetValidity: () => {
          if (
            radiogroupRef.current &&
            typeof radiogroupRef.current.resetValidity === 'function'
          ) {
            radiogroupRef.current.resetValidity();
          }
        },
        get element() {
          return radiogroupRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = radiogroupRef.current;
      if (!el) return;

      const handleInput = (e: Event) => {
        if (onInput) onInput(e as InputEvent);
      };

      const handleChange = (e: Event) => {
        if (onChange) onChange(e as Event);
      };

      const handleWaInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as CustomEvent);
      };

      el.addEventListener('input', handleInput);
      el.addEventListener('change', handleChange);
      el.addEventListener('wa-invalid', handleWaInvalid);

      return () => {
        el.removeEventListener('input', handleInput);
        el.removeEventListener('change', handleChange);
        el.removeEventListener('wa-invalid', handleWaInvalid);
      };
    }, [onInput, onChange, onInvalid]);

    return (
      <wa-radio-group
        ref={setRadioGroupRef}
        class={clsx('RadioGroup', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-radio-group>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';
