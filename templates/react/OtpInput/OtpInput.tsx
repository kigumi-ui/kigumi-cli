import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaOtpInput from '@awesome.me/webawesome/dist/components/otp-input/otp-input.js';
import './OtpInput.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/otp-input/otp-input.js'));
}

/**
 * OTP inputs collect one-time passcodes, PINs, and other fixed-length codes, one character per segment
 *
 * @example
 * ```tsx
 * // Basic usage
 * <OtpInput />
 *
 * // With event handlers
 * <OtpInput
 *   onInput={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<OtpInputRef>(null);
 * <button onClick={() => ref.current?.clear()}>Call Method</button>
 * <OtpInput ref={ref} />
 * ```
 */
export interface OtpInputProps extends Omit<
  HTMLAttributes<HTMLElement>,
  | 'onInput'
  | 'onChange'
  | 'onFocus'
  | 'onBlur'
  | 'onComplete'
  | 'onClear'
  | 'onInvalid'
  | 'dir'
> {
  /** A label shown above the segments */
  label?: string;

  /** Hint text shown below the segments */
  hint?: string;

  /** The current value of the OTP field */
  value?: string;

  /** Number of character segments to display. Overridden by format when set */
  length?: number;

  /** Segment format using # as a placeholder; other characters are literal separators */
  format?: string;

  /** Allowed character class */
  type?: 'numeric' | 'alpha' | 'alphanumeric';

  /** Case transformation applied to entered characters */
  case?: 'preserve' | 'upper' | 'lower';

  /** Visual appearance of the segments */
  appearance?: 'outlined' | 'filled' | 'filled-outlined' | 'contained';

  /** The size of each segment */
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';

  /** Displays entered characters as a mask instead of their real value */
  mask?: boolean;

  /** Shows a mask character in empty segments as a length hint */
  'with-mask'?: boolean;

  /** The autocomplete attribute forwarded to the underlying input */
  autocomplete?: string;

  /** Submits the form automatically once all segments are filled */
  autosubmit?: boolean;

  /** Makes the field required */
  required?: boolean;

  /** Makes the field readonly */
  readonly?: boolean;

  /** Disables the form control */
  disabled?: boolean;

  /** The name of the input, submitted with form data */
  name?: string;

  /** Emitted when a character is entered or removed. */
  onInput?: (event: InputEvent) => void;

  /** Emitted when the value changes and the field loses focus. */
  onChange?: (event: Event) => void;

  /** Emitted when the control gains focus. */
  onFocus?: (event: FocusEvent) => void;

  /** Emitted when the control loses focus. */
  onBlur?: (event: FocusEvent) => void;

  /** Emitted once when all segments are filled. Cancelable — call `preventDefault()` to stop `autosubmit` from submitting the form for this completion. */
  onComplete?: (event: CustomEvent) => void;

  /** Emitted when the control's value is cleared. */
  onClear?: (event: CustomEvent) => void;

  /** Emitted when the form control has been checked for validity and its constraints aren't satisfied. */
  onInvalid?: (event: CustomEvent) => void;
}

export interface OtpInputRef {
  /** Clears the current value and returns focus to the field. */
  clear: () => void;

  /** Focuses the field. */
  focus: (options: FocusOptions) => void;

  /** Removes focus from the field. */
  blur: () => void;

  /** Selects all entered characters in the hidden input. */
  select: () => void;

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
  element: WaOtpInput | null;
}

export const OtpInput = forwardRef<OtpInputRef, OtpInputProps>(
  (
    {
      children,
      className,
      onInput,
      onChange,
      onFocus,
      onBlur,
      onComplete,
      onClear,
      onInvalid,
      ...props
    },
    ref
  ) => {
    const otpinputRef = useRef<WaOtpInput | null>(null);
    const setOtpInputRef = useCallback((el: WaOtpInput | null) => {
      otpinputRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        clear: () => {
          if (
            otpinputRef.current &&
            typeof otpinputRef.current.clear === 'function'
          ) {
            otpinputRef.current.clear();
          }
        },
        focus: (options: FocusOptions) => {
          if (
            otpinputRef.current &&
            typeof otpinputRef.current.focus === 'function'
          ) {
            otpinputRef.current.focus(options);
          }
        },
        blur: () => {
          if (
            otpinputRef.current &&
            typeof otpinputRef.current.blur === 'function'
          ) {
            otpinputRef.current.blur();
          }
        },
        select: () => {
          if (
            otpinputRef.current &&
            typeof otpinputRef.current.select === 'function'
          ) {
            otpinputRef.current.select();
          }
        },
        setCustomValidity: (message: string) => {
          if (
            otpinputRef.current &&
            typeof otpinputRef.current.setCustomValidity === 'function'
          ) {
            otpinputRef.current.setCustomValidity(message);
          }
        },
        formStateRestoreCallback: (
          state: string | File | FormData | null,
          reason: 'autocomplete' | 'restore'
        ) => {
          if (
            otpinputRef.current &&
            typeof otpinputRef.current.formStateRestoreCallback === 'function'
          ) {
            otpinputRef.current.formStateRestoreCallback(state, reason);
          }
        },
        resetValidity: () => {
          if (
            otpinputRef.current &&
            typeof otpinputRef.current.resetValidity === 'function'
          ) {
            otpinputRef.current.resetValidity();
          }
        },
        get element() {
          return otpinputRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = otpinputRef.current;
      if (!el) return;

      const handleInput = (e: Event) => {
        if (onInput) onInput(e as InputEvent);
      };

      const handleChange = (e: Event) => {
        if (onChange) onChange(e as Event);
      };

      const handleFocus = (e: Event) => {
        if (onFocus) onFocus(e as FocusEvent);
      };

      const handleBlur = (e: Event) => {
        if (onBlur) onBlur(e as FocusEvent);
      };

      const handleWaComplete = (e: Event) => {
        if (onComplete) onComplete(e as CustomEvent);
      };

      const handleWaClear = (e: Event) => {
        if (onClear) onClear(e as CustomEvent);
      };

      const handleWaInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as CustomEvent);
      };

      el.addEventListener('input', handleInput);
      el.addEventListener('change', handleChange);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('blur', handleBlur);
      el.addEventListener('wa-complete', handleWaComplete);
      el.addEventListener('wa-clear', handleWaClear);
      el.addEventListener('wa-invalid', handleWaInvalid);

      return () => {
        el.removeEventListener('input', handleInput);
        el.removeEventListener('change', handleChange);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('wa-complete', handleWaComplete);
        el.removeEventListener('wa-clear', handleWaClear);
        el.removeEventListener('wa-invalid', handleWaInvalid);
      };
    }, [onInput, onChange, onFocus, onBlur, onComplete, onClear, onInvalid]);

    return (
      <wa-otp-input
        ref={setOtpInputRef}
        class={clsx('OtpInput', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-otp-input>
    );
  }
);

OtpInput.displayName = 'OtpInput';
