import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaCheckbox from '@awesome.me/webawesome/dist/components/checkbox/checkbox.js';
import './Checkbox.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/checkbox/checkbox.js'));
}

/**
 * Checkboxes allow the user to toggle an option on or off
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Checkbox />
 *
 * // With event handlers
 * <Checkbox
 *   onChange={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<CheckboxRef>(null);
 * <button onClick={() => ref.current?.click()}>Call Method</button>
 * <Checkbox ref={ref} />
 * ```
 */
export interface CheckboxProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onChange' | 'onBlur' | 'onFocus' | 'onInput' | 'onInvalid' | 'dir'
> {
  /** Draws checkbox in checked state */
  checked?: boolean;

  /** Disables the checkbox */
  disabled?: boolean;

  /** Descriptive helper text */
  hint?: string;

  /** Mixed/parent selection state */
  indeterminate?: boolean;

  /** Form submission identifier */
  name?: string;

  /** Makes field mandatory */
  required?: boolean;

  /** Adjusts checkbox dimensions */
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';

  /** Form submission value */
  value?: string;

  /** Emitted when the checked state changes. */
  onChange?: (event: Event) => void;

  /** Emitted when the checkbox loses focus. */
  onBlur?: (event: FocusEvent) => void;

  /** Emitted when the checkbox gains focus. */
  onFocus?: (event: FocusEvent) => void;

  /** Emitted when the checkbox receives input. */
  onInput?: (event: InputEvent) => void;

  /** Emitted when the form control has been checked for validity and its constraints aren't satisfied. */
  onInvalid?: (event: CustomEvent) => void;
}

export interface CheckboxRef {
  /** Simulates a click on the checkbox. */
  click: () => void;

  /** Sets focus on the checkbox. */
  focus: (options: FocusOptions) => void;

  /** Removes focus from the checkbox. */
  blur: () => void;

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
  element: WaCheckbox | null;
}

export const Checkbox = forwardRef<CheckboxRef, CheckboxProps>(
  (
    {
      children,
      className,
      onChange,
      onBlur,
      onFocus,
      onInput,
      onInvalid,
      ...props
    },
    ref
  ) => {
    const checkboxRef = useRef<WaCheckbox | null>(null);
    const setCheckboxRef = useCallback((el: WaCheckbox | null) => {
      checkboxRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        click: () => {
          if (
            checkboxRef.current &&
            typeof checkboxRef.current.click === 'function'
          ) {
            checkboxRef.current.click();
          }
        },
        focus: (options: FocusOptions) => {
          if (
            checkboxRef.current &&
            typeof checkboxRef.current.focus === 'function'
          ) {
            checkboxRef.current.focus(options);
          }
        },
        blur: () => {
          if (
            checkboxRef.current &&
            typeof checkboxRef.current.blur === 'function'
          ) {
            checkboxRef.current.blur();
          }
        },
        setCustomValidity: (message: string) => {
          if (
            checkboxRef.current &&
            typeof checkboxRef.current.setCustomValidity === 'function'
          ) {
            checkboxRef.current.setCustomValidity(message);
          }
        },
        formStateRestoreCallback: (
          state: string | File | FormData | null,
          reason: 'autocomplete' | 'restore'
        ) => {
          if (
            checkboxRef.current &&
            typeof checkboxRef.current.formStateRestoreCallback === 'function'
          ) {
            checkboxRef.current.formStateRestoreCallback(state, reason);
          }
        },
        resetValidity: () => {
          if (
            checkboxRef.current &&
            typeof checkboxRef.current.resetValidity === 'function'
          ) {
            checkboxRef.current.resetValidity();
          }
        },
        get element() {
          return checkboxRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = checkboxRef.current;
      if (!el) return;

      const handleChange = (e: Event) => {
        if (onChange) onChange(e as Event);
      };

      const handleBlur = (e: Event) => {
        if (onBlur) onBlur(e as FocusEvent);
      };

      const handleFocus = (e: Event) => {
        if (onFocus) onFocus(e as FocusEvent);
      };

      const handleInput = (e: Event) => {
        if (onInput) onInput(e as InputEvent);
      };

      const handleWaInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as CustomEvent);
      };

      el.addEventListener('change', handleChange);
      el.addEventListener('blur', handleBlur);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('input', handleInput);
      el.addEventListener('wa-invalid', handleWaInvalid);

      return () => {
        el.removeEventListener('change', handleChange);
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('input', handleInput);
        el.removeEventListener('wa-invalid', handleWaInvalid);
      };
    }, [onChange, onBlur, onFocus, onInput, onInvalid]);

    return (
      <wa-checkbox
        ref={setCheckboxRef}
        class={clsx('Checkbox', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-checkbox>
    );
  }
);

Checkbox.displayName = 'Checkbox';
