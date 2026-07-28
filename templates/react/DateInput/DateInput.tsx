import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaDateInput from '@awesome.me/webawesome/dist/components/date-input/date-input.js';
import './DateInput.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/date-input/date-input.js'));
}

/**
 * A segmented date field with an optional popup calendar, for use in forms
 *
 * @example
 * ```tsx
 * // Basic usage
 * <DateInput />
 *
 * // With event handlers
 * <DateInput
 *   onInput={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<DateInputRef>(null);
 * <button onClick={() => ref.current?.focus()}>Call Method</button>
 * <DateInput ref={ref} />
 * ```
 */
export interface DateInputProps extends Omit<
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
  /** The name of the form control, submitted with form data */
  name?: string;

  /** The current value; ISO date or range */
  value?: string;

  /** The selection mode */
  mode?: 'single' | 'range';

  /** The input label (use the label slot for HTML) */
  label?: string;

  /** The hint text (use the hint slot for HTML) */
  hint?: string;

  /** The visual size */
  size?: 'xs' | 's' | 'm' | 'l' | 'xl';

  /** The visual appearance */
  appearance?: 'filled' | 'outlined' | 'filled-outlined';

  /** Draws the input with pill-style rounded edges */
  pill?: boolean;

  /** Makes the input required for form submission */
  required?: boolean;

  /** Makes the input non-editable */
  readonly?: boolean;

  /** Disables the input */
  disabled?: boolean;

  /** Forwarded to the hidden form input for browser autofill */
  autocomplete?: string;

  /** Shows a clear button when a value is present */
  'with-clear'?: boolean;

  /** The earliest selectable date */
  min?: string;

  /** The latest selectable date */
  max?: string;

  /** Overrides the date considered "today" */
  today?: string;

  /** The first day of the week in the popup calendar */
  'first-day-of-week'?:
    'auto' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

  /** Whitespace-separated ISO dates to disable */
  'disabled-dates'?: string;

  /** Space-separated 3-letter weekday names to disable */
  'disabled-days-of-week'?: string;

  /** Disable all dates before today */
  'disable-past'?: boolean;

  /** Disable all dates after today */
  'disable-future'?: boolean;

  /** Minimum range length in days (range mode); 0 disables the check */
  'min-range'?: number;

  /** Maximum range length in days (range mode); 0 disables the check */
  'max-range'?: number;

  /** The number of months rendered in the popup calendar */
  months?: '1' | '2';

  /** Whether prev/next pages by the visible range or one month */
  'page-by'?: 'months' | 'single';

  /** Show leading/trailing adjacent-month days in the popup */
  'with-outside-days'?: boolean;

  /** Show ISO week numbers in the popup */
  'with-week-numbers'?: boolean;

  /** The weekday header format in the popup */
  'weekday-format'?: 'narrow' | 'short' | 'long';

  /** Whether the popup calendar is open */
  open?: boolean;

  /** The preferred popup placement */
  placement?:
    'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end';

  /** The distance in pixels between the popup and input */
  distance?: number;

  onInput?: (event: CustomEvent) => void;

  onChange?: (event: CustomEvent) => void;

  onFocus?: (event: FocusEvent) => void;

  onBlur?: (event: FocusEvent) => void;

  onClear?: (event: CustomEvent) => void;

  onShow?: (event: CustomEvent) => void;

  onAfterShow?: (event: CustomEvent) => void;

  onHide?: (event: CustomEvent) => void;

  onAfterHide?: (event: CustomEvent) => void;

  onInvalid?: (event: CustomEvent) => void;
}

export interface DateInputRef {
  focus: (options: FocusOptions) => void;

  blur: () => void;

  show: () => void;

  hide: () => void;

  clear: () => void;

  formStateRestoreCallback: (state: string | File | FormData | null) => void;

  setCustomValidity: (message: string) => void;

  resetValidity: () => void;
  /** Reference to the underlying HTML element */
  element: WaDateInput | null;
}

export const DateInput = forwardRef<DateInputRef, DateInputProps>(
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
    const dateinputRef = useRef<WaDateInput | null>(null);
    const setDateInputRef = useCallback((el: WaDateInput | null) => {
      dateinputRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        focus: (options: FocusOptions) => {
          if (
            dateinputRef.current &&
            typeof dateinputRef.current.focus === 'function'
          ) {
            dateinputRef.current.focus(options);
          }
        },
        blur: () => {
          if (
            dateinputRef.current &&
            typeof dateinputRef.current.blur === 'function'
          ) {
            dateinputRef.current.blur();
          }
        },
        show: () => {
          if (
            dateinputRef.current &&
            typeof dateinputRef.current.show === 'function'
          ) {
            dateinputRef.current.show();
          }
        },
        hide: () => {
          if (
            dateinputRef.current &&
            typeof dateinputRef.current.hide === 'function'
          ) {
            dateinputRef.current.hide();
          }
        },
        clear: () => {
          if (
            dateinputRef.current &&
            typeof dateinputRef.current.clear === 'function'
          ) {
            dateinputRef.current.clear();
          }
        },
        formStateRestoreCallback: (state: string | File | FormData | null) => {
          if (
            dateinputRef.current &&
            typeof dateinputRef.current.formStateRestoreCallback === 'function'
          ) {
            dateinputRef.current.formStateRestoreCallback(state);
          }
        },
        setCustomValidity: (message: string) => {
          if (
            dateinputRef.current &&
            typeof dateinputRef.current.setCustomValidity === 'function'
          ) {
            dateinputRef.current.setCustomValidity(message);
          }
        },
        resetValidity: () => {
          if (
            dateinputRef.current &&
            typeof dateinputRef.current.resetValidity === 'function'
          ) {
            dateinputRef.current.resetValidity();
          }
        },
        get element() {
          return dateinputRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = dateinputRef.current;
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
      <wa-date-input
        ref={setDateInputRef}
        class={clsx('DateInput', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-date-input>
    );
  }
);

DateInput.displayName = 'DateInput';
