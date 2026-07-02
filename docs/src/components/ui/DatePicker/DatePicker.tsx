import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/date-picker/date-picker.js';
import './DatePicker.css';

/**
 * An inline calendar for selecting a single date or a date range
 *
 * @example
 * ```tsx
 * <DatePicker value="2026-07-02" />
 * <DatePicker mode="range" onChange={(e) => console.log(e.target.value)} />
 * ```
 */
export interface DatePickerProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onInput' | 'onChange' | 'dir'
> {
  /** The selection mode */
  mode?: 'single' | 'range';

  /** The selected date(s) in ISO format */
  value?: string;

  /** The earliest selectable date (YYYY-MM-DD) */
  min?: string;

  /** The latest selectable date (YYYY-MM-DD) */
  max?: string;

  /** Overrides the date considered "today" */
  today?: string;

  /** The currently focused date */
  'focused-date'?: string;

  /** The current calendar view */
  view?: 'months' | 'days' | 'years';

  /** The number of months rendered side-by-side */
  months?: '1' | '2';

  /** Whether prev/next advances by the visible range or one month */
  'page-by'?: 'single' | 'months';

  /** The first day of the week */
  'first-day-of-week'?:
    | 'auto'
    | 'sun'
    | 'mon'
    | 'tue'
    | 'wed'
    | 'thu'
    | 'fri'
    | 'sat';

  /** Show leading/trailing days from adjacent months */
  'with-outside-days'?: boolean;

  /** Show the ISO week-number column */
  'with-week-numbers'?: boolean;

  /** The weekday header format */
  'weekday-format'?: 'narrow' | 'short' | 'long';

  /** Disables the entire picker */
  disabled?: boolean;

  /** Displays the value without allowing changes */
  readonly?: boolean;

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

  /** The visual size */
  size?: 'xs' | 's' | 'm' | 'l' | 'xl';

  /** A BCP-47 locale override */
  locale?: string;

  /** Emitted when the value changes during interaction. */
  onInput?: (event: CustomEvent) => void;

  /** Emitted when the user commits a new value. */
  onChange?: (event: CustomEvent) => void;

  /** Emitted when the focused day changes. */
  onFocusDay?: (event: CustomEvent) => void;

  /** Emitted when the calendar view changes. */
  onViewChange?: (event: CustomEvent) => void;
}

export interface DatePickerRef {
  /** Focuses the calendar at the currently focused day. */
  focus: (options?: FocusOptions) => void;

  /** Scrolls the view to show the given date and sets the focused day. */
  goToDate: (date: string | Date) => void;

  /** Equivalent to `goToDate(today)`. */
  goToToday: () => void;

  /** Clears the current selection and emits `input` then `change`. */
  clear: () => void;
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const DatePicker = forwardRef<DatePickerRef, DatePickerProps>(
  (
    {
      children,
      className,
      onInput,
      onChange,
      onFocusDay,
      onViewChange,
      ...props
    },
    ref
  ) => {
    const datepickerRef = useRef<
      HTMLElement & {
        focus?: (options?: FocusOptions) => void;
        goToDate?: (date: string | Date) => void;
        goToToday?: () => void;
        clear?: () => void;
      }
    >(null);

    useImperativeHandle(
      ref,
      () => ({
        focus: (options?: FocusOptions) => {
          if (
            datepickerRef.current &&
            typeof datepickerRef.current.focus === 'function'
          ) {
            datepickerRef.current.focus(options);
          }
        },
        goToDate: (date: string | Date) => {
          if (
            datepickerRef.current &&
            typeof datepickerRef.current.goToDate === 'function'
          ) {
            datepickerRef.current.goToDate(date);
          }
        },
        goToToday: () => {
          if (
            datepickerRef.current &&
            typeof datepickerRef.current.goToToday === 'function'
          ) {
            datepickerRef.current.goToToday();
          }
        },
        clear: () => {
          if (
            datepickerRef.current &&
            typeof datepickerRef.current.clear === 'function'
          ) {
            datepickerRef.current.clear();
          }
        },
        get element() {
          return datepickerRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      const el = datepickerRef.current;
      if (!el) return;

      const handleInput = (e: Event) => {
        if (onInput) onInput(e as CustomEvent);
      };

      const handleChange = (e: Event) => {
        if (onChange) onChange(e as CustomEvent);
      };

      const handleFocusDay = (e: Event) => {
        if (onFocusDay) onFocusDay(e as CustomEvent);
      };

      const handleViewChange = (e: Event) => {
        if (onViewChange) onViewChange(e as CustomEvent);
      };

      el.addEventListener('input', handleInput);
      el.addEventListener('change', handleChange);
      el.addEventListener('wa-focus-day', handleFocusDay);
      el.addEventListener('wa-view-change', handleViewChange);

      return () => {
        el.removeEventListener('input', handleInput);
        el.removeEventListener('change', handleChange);
        el.removeEventListener('wa-focus-day', handleFocusDay);
        el.removeEventListener('wa-view-change', handleViewChange);
      };
    }, [onInput, onChange, onFocusDay, onViewChange]);

    return (
      <wa-date-picker
        ref={datepickerRef}
        class={clsx('DatePicker', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-date-picker>
    );
  }
);

DatePicker.displayName = 'DatePicker';
