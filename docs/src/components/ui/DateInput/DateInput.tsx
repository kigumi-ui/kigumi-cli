import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/date-input/date-input.js';
import './DateInput.css';

/**
 * A segmented date field with an optional popup calendar, for use in forms
 *
 * @example
 * ```tsx
 * <DateInput label="Start date" name="start" />
 * <DateInput label="Trip" mode="range" required with-clear />
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
    | 'auto'
    | 'sun'
    | 'mon'
    | 'tue'
    | 'wed'
    | 'thu'
    | 'fri'
    | 'sat';

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
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end';

  /** The distance in pixels between the popup and input */
  distance?: number;

  /** Emitted on every segment edit, step, calendar interaction, and clear. */
  onInput?: (event: CustomEvent) => void;

  /** Emitted on every committed value transition. */
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

  /** Emitted when the form control's constraints aren't satisfied. */
  onInvalid?: (event: CustomEvent) => void;
}

export interface DateInputRef {
  /** Sets focus on the first empty (else first) segment. */
  focus: (options?: FocusOptions) => void;

  /** Removes focus from the date input. */
  blur: () => void;

  /** Opens the popup calendar. */
  show: () => void;

  /** Closes the popup calendar. */
  hide: () => void;

  /** Clears the current value and emits `wa-clear`, `input`, and `change`. */
  clear: () => void;

  /** Sets a custom validation message. */
  setCustomValidity: (message: string) => void;

  /** Removes manual custom errors and native validation. */
  resetValidity: () => void;
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
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
    const dateinputRef = useRef<
      HTMLElement & {
        focus?: (options?: FocusOptions) => void;
        blur?: () => void;
        show?: () => void;
        hide?: () => void;
        clear?: () => void;
        setCustomValidity?: (message: string) => void;
        resetValidity?: () => void;
      }
    >(null);

    useImperativeHandle(
      ref,
      () => ({
        focus: (options?: FocusOptions) => {
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

      const handleClear = (e: Event) => {
        if (onClear) onClear(e as CustomEvent);
      };

      const handleShow = (e: Event) => {
        if (onShow) onShow(e as CustomEvent);
      };

      const handleAfterShow = (e: Event) => {
        if (onAfterShow) onAfterShow(e as CustomEvent);
      };

      const handleHide = (e: Event) => {
        if (onHide) onHide(e as CustomEvent);
      };

      const handleAfterHide = (e: Event) => {
        if (onAfterHide) onAfterHide(e as CustomEvent);
      };

      const handleInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as CustomEvent);
      };

      el.addEventListener('input', handleInput);
      el.addEventListener('change', handleChange);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('blur', handleBlur);
      el.addEventListener('wa-clear', handleClear);
      el.addEventListener('wa-show', handleShow);
      el.addEventListener('wa-after-show', handleAfterShow);
      el.addEventListener('wa-hide', handleHide);
      el.addEventListener('wa-after-hide', handleAfterHide);
      el.addEventListener('wa-invalid', handleInvalid);

      return () => {
        el.removeEventListener('input', handleInput);
        el.removeEventListener('change', handleChange);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('wa-clear', handleClear);
        el.removeEventListener('wa-show', handleShow);
        el.removeEventListener('wa-after-show', handleAfterShow);
        el.removeEventListener('wa-hide', handleHide);
        el.removeEventListener('wa-after-hide', handleAfterHide);
        el.removeEventListener('wa-invalid', handleInvalid);
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
        ref={dateinputRef}
        class={clsx('DateInput', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-date-input>
    );
  }
);

DateInput.displayName = 'DateInput';
