import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaNumberInput from '@awesome.me/webawesome/dist/components/number-input/number-input.js';
import './NumberInput.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/number-input/number-input.js'));
}

/**
 * Number inputs allow users to enter numeric values with optional step controls
 *
 * @example
 * ```tsx
 * // Basic usage
 * <NumberInput />
 *
 * // With event handlers
 * <NumberInput
 *   onInput={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<NumberInputRef>(null);
 * <button onClick={() => ref.current?.focus()}>Call Method</button>
 * <NumberInput ref={ref} />
 * ```
 */
export interface NumberInputProps extends Omit<
  HTMLAttributes<HTMLElement>,
  | 'onInput'
  | 'onChange'
  | 'onBlur'
  | 'onFocus'
  | 'onBeforeinput'
  | 'onInvalid'
  | 'dir'
> {
  /** Accessible label */
  label?: string;

  /** Descriptive hint text */
  hint?: string;

  /** Current value */
  value?: number;

  /** Minimum value */
  min?: number;

  /** Maximum value */
  max?: number;

  /** Step increment */
  step?: number;

  /** Disables the input */
  disabled?: boolean;

  /** Makes field mandatory */
  required?: boolean;

  /** Placeholder text */
  placeholder?: string;

  /** Input size */
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';

  /** Visual appearance */
  appearance?: 'filled' | 'outlined' | 'filled-outlined';

  /** Hides the stepper buttons */
  'without-steppers'?: boolean;

  onInput?: (event: CustomEvent) => void;

  onChange?: (event: CustomEvent) => void;

  onBlur?: (event: FocusEvent) => void;

  onFocus?: (event: FocusEvent) => void;

  onBeforeinput?: (event: CustomEvent) => void;

  onInvalid?: (event: CustomEvent) => void;
}

export interface NumberInputRef {
  focus: (options: FocusOptions) => void;

  blur: () => void;

  select: () => void;

  stepUp: () => void;

  stepDown: () => void;

  setCustomValidity: (message: string) => void;

  formStateRestoreCallback: (
    state: string | File | FormData | null,
    reason: 'autocomplete' | 'restore'
  ) => void;

  resetValidity: () => void;
  /** Reference to the underlying HTML element */
  element: WaNumberInput | null;
}

export const NumberInput = forwardRef<NumberInputRef, NumberInputProps>(
  (
    {
      children,
      className,
      onInput,
      onChange,
      onBlur,
      onFocus,
      onBeforeinput,
      onInvalid,
      ...props
    },
    ref
  ) => {
    const numberinputRef = useRef<WaNumberInput | null>(null);
    const setNumberInputRef = useCallback((el: WaNumberInput | null) => {
      numberinputRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        focus: (options: FocusOptions) => {
          if (
            numberinputRef.current &&
            typeof numberinputRef.current.focus === 'function'
          ) {
            numberinputRef.current.focus(options);
          }
        },
        blur: () => {
          if (
            numberinputRef.current &&
            typeof numberinputRef.current.blur === 'function'
          ) {
            numberinputRef.current.blur();
          }
        },
        select: () => {
          if (
            numberinputRef.current &&
            typeof numberinputRef.current.select === 'function'
          ) {
            numberinputRef.current.select();
          }
        },
        stepUp: () => {
          if (
            numberinputRef.current &&
            typeof numberinputRef.current.stepUp === 'function'
          ) {
            numberinputRef.current.stepUp();
          }
        },
        stepDown: () => {
          if (
            numberinputRef.current &&
            typeof numberinputRef.current.stepDown === 'function'
          ) {
            numberinputRef.current.stepDown();
          }
        },
        setCustomValidity: (message: string) => {
          if (
            numberinputRef.current &&
            typeof numberinputRef.current.setCustomValidity === 'function'
          ) {
            numberinputRef.current.setCustomValidity(message);
          }
        },
        formStateRestoreCallback: (
          state: string | File | FormData | null,
          reason: 'autocomplete' | 'restore'
        ) => {
          if (
            numberinputRef.current &&
            typeof numberinputRef.current.formStateRestoreCallback ===
              'function'
          ) {
            numberinputRef.current.formStateRestoreCallback(state, reason);
          }
        },
        resetValidity: () => {
          if (
            numberinputRef.current &&
            typeof numberinputRef.current.resetValidity === 'function'
          ) {
            numberinputRef.current.resetValidity();
          }
        },
        get element() {
          return numberinputRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = numberinputRef.current;
      if (!el) return;

      const handleInput = (e: Event) => {
        if (onInput) onInput(e as CustomEvent);
      };

      const handleChange = (e: Event) => {
        if (onChange) onChange(e as CustomEvent);
      };

      const handleBlur = (e: Event) => {
        if (onBlur) onBlur(e as FocusEvent);
      };

      const handleFocus = (e: Event) => {
        if (onFocus) onFocus(e as FocusEvent);
      };

      const handleBeforeinput = (e: Event) => {
        if (onBeforeinput) onBeforeinput(e as CustomEvent);
      };

      const handleWaInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as CustomEvent);
      };

      el.addEventListener('input', handleInput);
      el.addEventListener('change', handleChange);
      el.addEventListener('blur', handleBlur);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('beforeinput', handleBeforeinput);
      el.addEventListener('wa-invalid', handleWaInvalid);

      return () => {
        el.removeEventListener('input', handleInput);
        el.removeEventListener('change', handleChange);
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('beforeinput', handleBeforeinput);
        el.removeEventListener('wa-invalid', handleWaInvalid);
      };
    }, [onInput, onChange, onBlur, onFocus, onBeforeinput, onInvalid]);

    return (
      <wa-number-input
        ref={setNumberInputRef}
        class={clsx('NumberInput', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-number-input>
    );
  }
);

NumberInput.displayName = 'NumberInput';
