import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaDatePicker from '@awesome.me/webawesome/dist/components/date-picker/date-picker.js';
import './DatePicker.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/date-picker/date-picker.js'));
}

/**
 * An inline calendar for selecting a single date or a date range
 *
 * @example
 * ```tsx
 * // Basic usage
 * <DatePicker />
 *
 * // With event handlers
 * <DatePicker
 *   onInput={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<DatePickerRef>(null);
 * <button onClick={() => ref.current?.focus()}>Call Method</button>
 * <DatePicker ref={ref} />
 * ```
 */
export interface DatePickerProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onInput' | 'onChange' | 'onFocusDay' | 'onViewChange' | 'dir'
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
    'auto' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

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

  onInput?: (event: CustomEvent) => void;

  onChange?: (event: CustomEvent) => void;

  onFocusDay?: (event: CustomEvent) => void;

  onViewChange?: (event: CustomEvent) => void;
}

export interface DatePickerRef {
  focus: (options: FocusOptions) => void;

  goToDate: (date: string | Date) => void;

  goToToday: () => void;

  clear: () => void;
  /** Reference to the underlying HTML element */
  element: WaDatePicker | null;
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
    const datepickerRef = useRef<WaDatePicker | null>(null);
    const setDatePickerRef = useCallback((el: WaDatePicker | null) => {
      datepickerRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        focus: (options: FocusOptions) => {
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
      ensureLoaded();
      const el = datepickerRef.current;
      if (!el) return;

      const handleInput = (e: Event) => {
        if (onInput) onInput(e as CustomEvent);
      };

      const handleChange = (e: Event) => {
        if (onChange) onChange(e as CustomEvent);
      };

      const handleWaFocusDay = (e: Event) => {
        if (onFocusDay) onFocusDay(e as CustomEvent);
      };

      const handleWaViewChange = (e: Event) => {
        if (onViewChange) onViewChange(e as CustomEvent);
      };

      el.addEventListener('input', handleInput);
      el.addEventListener('change', handleChange);
      el.addEventListener('wa-focus-day', handleWaFocusDay);
      el.addEventListener('wa-view-change', handleWaViewChange);

      return () => {
        el.removeEventListener('input', handleInput);
        el.removeEventListener('change', handleChange);
        el.removeEventListener('wa-focus-day', handleWaFocusDay);
        el.removeEventListener('wa-view-change', handleWaViewChange);
      };
    }, [onInput, onChange, onFocusDay, onViewChange]);

    return (
      <wa-date-picker
        ref={setDatePickerRef}
        class={clsx('DatePicker', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-date-picker>
    );
  }
);

DatePicker.displayName = 'DatePicker';
