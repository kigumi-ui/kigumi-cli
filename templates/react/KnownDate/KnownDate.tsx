import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaKnownDate from '@awesome.me/webawesome/dist/components/known-date/known-date.js';
import './KnownDate.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/known-date/known-date.js'));
}

/**
 * Known dates collect a calendar date the user already knows, such as a birthday
 *
 * @example
 * ```tsx
 * // Basic usage
 * <KnownDate />
 *
 * // With event handlers
 * <KnownDate
 *   onInput={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<KnownDateRef>(null);
 * <button onClick={() => ref.current?.focus()}>Call Method</button>
 * <KnownDate ref={ref} />
 * ```
 */
export interface KnownDateProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onInput' | 'onChange' | 'onBlur' | 'onFocus' | 'onInvalid' | 'dir'
> {
  /** The name of the control, submitted with form data */
  name?: string;

  /** The current value as a `YYYY-MM-DD` string */
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

  /** The earliest acceptable date */
  min?: string;

  /** The latest acceptable date */
  max?: string;

  /** The locale used to format and parse the date */
  locale?: string;

  /** Emitted as the user types in any field. */
  onInput?: (event: InputEvent) => void;

  /** Emitted when the committed value transitions to a new ISO date. */
  onChange?: (event: Event) => void;

  /** Emitted when the control loses focus. */
  onBlur?: (event: FocusEvent) => void;

  /** Emitted when the control gains focus. */
  onFocus?: (event: FocusEvent) => void;

  /** Emitted when the form control has been checked for validity and its constraints aren't satisfied. */
  onInvalid?: (event: CustomEvent) => void;
}

export interface KnownDateRef {
  /** Focuses the first empty field, or the first field when all are filled. */
  focus: (options: FocusOptions) => void;

  /** Removes focus from the known date. */
  blur: () => void;

  /** Called when the browser is trying to restore element’s state to state in which case reason is "restore", or when
the browser is trying to fulfill autofill on behalf of user in which case reason is "autocomplete". In the case of
"restore", state is a string, File, or FormData object previously set as the second argument to setFormValue. */
  formStateRestoreCallback: (state: string | File | FormData | null) => void;

  /** Do not use this when creating a "Validator". This is intended for end users of components.
We track manually defined custom errors so we don't clear them on accident in our validators. */
  setCustomValidity: (message: string) => void;

  /** Reset validity is a way of removing manual custom errors and native validation. */
  resetValidity: () => void;
  /** Reference to the underlying HTML element */
  element: WaKnownDate | null;
}

export const KnownDate = forwardRef<KnownDateRef, KnownDateProps>(
  (
    {
      children,
      className,
      onInput,
      onChange,
      onBlur,
      onFocus,
      onInvalid,
      ...props
    },
    ref
  ) => {
    const knowndateRef = useRef<WaKnownDate | null>(null);
    const setKnownDateRef = useCallback((el: WaKnownDate | null) => {
      knowndateRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        focus: (options: FocusOptions) => {
          if (
            knowndateRef.current &&
            typeof knowndateRef.current.focus === 'function'
          ) {
            knowndateRef.current.focus(options);
          }
        },
        blur: () => {
          if (
            knowndateRef.current &&
            typeof knowndateRef.current.blur === 'function'
          ) {
            knowndateRef.current.blur();
          }
        },
        formStateRestoreCallback: (state: string | File | FormData | null) => {
          if (
            knowndateRef.current &&
            typeof knowndateRef.current.formStateRestoreCallback === 'function'
          ) {
            knowndateRef.current.formStateRestoreCallback(state);
          }
        },
        setCustomValidity: (message: string) => {
          if (
            knowndateRef.current &&
            typeof knowndateRef.current.setCustomValidity === 'function'
          ) {
            knowndateRef.current.setCustomValidity(message);
          }
        },
        resetValidity: () => {
          if (
            knowndateRef.current &&
            typeof knowndateRef.current.resetValidity === 'function'
          ) {
            knowndateRef.current.resetValidity();
          }
        },
        get element() {
          return knowndateRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = knowndateRef.current;
      if (!el) return;

      const handleInput = (e: Event) => {
        if (onInput) onInput(e as InputEvent);
      };

      const handleChange = (e: Event) => {
        if (onChange) onChange(e as Event);
      };

      const handleBlur = (e: Event) => {
        if (onBlur) onBlur(e as FocusEvent);
      };

      const handleFocus = (e: Event) => {
        if (onFocus) onFocus(e as FocusEvent);
      };

      const handleWaInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as CustomEvent);
      };

      el.addEventListener('input', handleInput);
      el.addEventListener('change', handleChange);
      el.addEventListener('blur', handleBlur);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('wa-invalid', handleWaInvalid);

      return () => {
        el.removeEventListener('input', handleInput);
        el.removeEventListener('change', handleChange);
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('wa-invalid', handleWaInvalid);
      };
    }, [onInput, onChange, onBlur, onFocus, onInvalid]);

    return (
      <wa-known-date
        ref={setKnownDateRef}
        class={clsx('KnownDate', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-known-date>
    );
  }
);

KnownDate.displayName = 'KnownDate';
