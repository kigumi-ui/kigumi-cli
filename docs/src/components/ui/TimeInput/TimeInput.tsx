import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/time-input/time-input.js';
import './TimeInput.css';

/**
 * Time inputs collect a time of day from the user
 *
 * @example
 * ```tsx
 * // Basic usage
 * <TimeInput />
 *
 * // With event handlers
 * <TimeInput
 *   onInput={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<TimeInputRef>(null);
 * <button onClick={() => ref.current?.focus()}>Call Method</button>
 * <TimeInput ref={ref} />
 * ```
 */
export interface TimeInputProps extends Omit<
  HTMLAttributes<HTMLElement>,
  | 'onInput'
  | 'onChange'
  | 'onFocus'
  | 'onBlur'
  | 'onClear'
  | 'onShow'
  | 'onAfterShow'
  | 'onHide'
  | 'onAfterHide'
  | 'onInvalid'
  | 'dir'
> {
  /** The name of the control, submitted with form data */
  name?: string;

  /** The current value as a 24-hour `HH:mm:ss` string */
  value?: string;

  /** Whether the control is disabled */
  disabled?: boolean;

  /** Whether a value is required before form submission */
  required?: boolean;

  /** Whether the control is read-only */
  readonly?: boolean;

  /** Controls the overall dimensions of the control */
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';

  /** The visual style of the control */
  appearance?: 'filled' | 'outlined' | 'filled-outlined';

  /** Draws the control with rounded edges */
  pill?: boolean;

  /** The control label. Use the `label` slot for rich labels. */
  label?: string;

  /** Help text shown below the control. Use the `hint` slot for rich hints. */
  hint?: string;

  /** Shows a clear button when the control has a value */
  'with-clear'?: boolean;

  /** Shows a button that sets the value to the current time */
  'with-now'?: boolean;

  /** The earliest acceptable time */
  min?: string;

  /** The latest acceptable time */
  max?: string;

  /** The granularity of the value in seconds */
  step?: number;

  /** Whether to display a 12- or 24-hour clock. `auto` follows the locale. */
  'hour-format'?: 'auto' | '12' | '24';

  /** Whether the time picker dropdown is open */
  open?: boolean;

  /** The preferred placement of the dropdown */
  placement?:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end';

  /** Emitted as the user types into a segment or interacts with the popup columns. */
  onInput?: (event: CustomEvent) => void;

  /** Emitted when the committed value changes. */
  onChange?: (event: CustomEvent) => void;

  /** Emitted when the control receives focus. */
  onFocus?: (event: FocusEvent) => void;

  /** Emitted when the control loses focus. */
  onBlur?: (event: FocusEvent) => void;

  /** Emitted when the clear button is activated. */
  onClear?: (event: CustomEvent) => void;

  /** Emitted when the popup is about to open. Cancelable. */
  onShow?: (event: CustomEvent) => void;

  /** Emitted after the popup opens and animations complete. */
  onAfterShow?: (event: CustomEvent) => void;

  /** Emitted when the popup is about to close. Cancelable. */
  onHide?: (event: CustomEvent) => void;

  /** Emitted after the popup closes and animations complete. */
  onAfterHide?: (event: CustomEvent) => void;

  /** Emitted when the form control has been checked for validity and its constraints aren't satisfied. */
  onInvalid?: (event: CustomEvent) => void;
}

export interface TimeInputRef {
  /** Sets focus on the first empty (else first) segment. */
  focus: (options: FocusOptions) => void;

  /** Removes focus from the time picker. */
  blur: () => void;

  /** Opens the popup. */
  show: () => void;

  /** Closes the popup. */
  hide: () => void;

  /** Called when the browser is trying to restore element's state to state in which case reason is "restore", or when
the browser is trying to fulfill autofill on behalf of user in which case reason is "autocomplete". In the case of
"restore", state is a string, File, or FormData object previously set as the second argument to setFormValue. */
  formStateRestoreCallback: (state: string | File | FormData | null) => void;

  /** Do not use this when creating a "Validator". This is intended for end users of components.
We track manually defined custom errors so we don't clear them on accident in our validators. */
  setCustomValidity: (message: string) => void;

  /** Reset validity is a way of removing manual custom errors and native validation. */
  resetValidity: () => void;
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const TimeInput = forwardRef<TimeInputRef, TimeInputProps>(
  (
    {
      children,
      className,
      onInput,
      onChange,
      onFocus,
      onBlur,
      onClear,
      onShow,
      onAfterShow,
      onHide,
      onAfterHide,
      onInvalid,
      ...props
    },
    ref
  ) => {
    const timeinputRef = useRef<
      HTMLElement & {
        focus?: (options?: FocusOptions) => void;
        blur?: () => void;
        show?: () => void;
        hide?: () => void;
        formStateRestoreCallback?: (
          state: string | File | FormData | null
        ) => void;
        setCustomValidity?: (message: string) => void;
        resetValidity?: () => void;
      }
    >(null);

    useImperativeHandle(
      ref,
      () => ({
        focus: (options: FocusOptions) => {
          if (
            timeinputRef.current &&
            typeof timeinputRef.current.focus === 'function'
          ) {
            timeinputRef.current.focus(options);
          }
        },
        blur: () => {
          if (
            timeinputRef.current &&
            typeof timeinputRef.current.blur === 'function'
          ) {
            timeinputRef.current.blur();
          }
        },
        show: () => {
          if (
            timeinputRef.current &&
            typeof timeinputRef.current.show === 'function'
          ) {
            timeinputRef.current.show();
          }
        },
        hide: () => {
          if (
            timeinputRef.current &&
            typeof timeinputRef.current.hide === 'function'
          ) {
            timeinputRef.current.hide();
          }
        },
        formStateRestoreCallback: (state: string | File | FormData | null) => {
          if (
            timeinputRef.current &&
            typeof timeinputRef.current.formStateRestoreCallback === 'function'
          ) {
            timeinputRef.current.formStateRestoreCallback(state);
          }
        },
        setCustomValidity: (message: string) => {
          if (
            timeinputRef.current &&
            typeof timeinputRef.current.setCustomValidity === 'function'
          ) {
            timeinputRef.current.setCustomValidity(message);
          }
        },
        resetValidity: () => {
          if (
            timeinputRef.current &&
            typeof timeinputRef.current.resetValidity === 'function'
          ) {
            timeinputRef.current.resetValidity();
          }
        },
        get element() {
          return timeinputRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      const el = timeinputRef.current;
      if (!el) return;

      const handleInput = (e: Event) => {
        if (onInput) onInput(e as CustomEvent);
      };

      const handleChange = (e: Event) => {
        if (onChange) onChange(e as CustomEvent);
      };

      const handleFocus = (e: Event) => {
        if (onFocus) onFocus(e as FocusEvent);
      };

      const handleBlur = (e: Event) => {
        if (onBlur) onBlur(e as FocusEvent);
      };

      const handleWaClear = (e: Event) => {
        if (onClear) onClear(e as CustomEvent);
      };

      const handleWaShow = (e: Event) => {
        if (onShow) onShow(e as CustomEvent);
      };

      const handleWaAfterShow = (e: Event) => {
        if (onAfterShow) onAfterShow(e as CustomEvent);
      };

      const handleWaHide = (e: Event) => {
        if (onHide) onHide(e as CustomEvent);
      };

      const handleWaAfterHide = (e: Event) => {
        if (onAfterHide) onAfterHide(e as CustomEvent);
      };

      const handleWaInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as CustomEvent);
      };

      el.addEventListener('input', handleInput);
      el.addEventListener('change', handleChange);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('blur', handleBlur);
      el.addEventListener('wa-clear', handleWaClear);
      el.addEventListener('wa-show', handleWaShow);
      el.addEventListener('wa-after-show', handleWaAfterShow);
      el.addEventListener('wa-hide', handleWaHide);
      el.addEventListener('wa-after-hide', handleWaAfterHide);
      el.addEventListener('wa-invalid', handleWaInvalid);

      return () => {
        el.removeEventListener('input', handleInput);
        el.removeEventListener('change', handleChange);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('wa-clear', handleWaClear);
        el.removeEventListener('wa-show', handleWaShow);
        el.removeEventListener('wa-after-show', handleWaAfterShow);
        el.removeEventListener('wa-hide', handleWaHide);
        el.removeEventListener('wa-after-hide', handleWaAfterHide);
        el.removeEventListener('wa-invalid', handleWaInvalid);
      };
    }, [
      onInput,
      onChange,
      onFocus,
      onBlur,
      onClear,
      onShow,
      onAfterShow,
      onHide,
      onAfterHide,
      onInvalid,
    ]);

    return (
      <wa-time-input
        ref={timeinputRef}
        class={clsx('TimeInput', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-time-input>
    );
  }
);

TimeInput.displayName = 'TimeInput';
