import React from 'react';
import clsx from 'clsx';
import './DatePicker.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/date-picker/date-picker.js'));
}

/**
 * An inline calendar for selecting a single date or a date range
 *
 * @example
 * ```jsx
 * // Basic usage
 * <DatePicker value="2026-07-02" />
 *
 * // Range selection
 * <DatePicker mode="range" onChange={(e) => console.log(e.target.value)} />
 *
 * // Using ref methods
 * const pickerRef = React.useRef(null);
 * <button onClick={() => pickerRef.current?.goToToday()}>Today</button>
 * <DatePicker ref={pickerRef} />
 * ```
 *
 * @typedef {Object} DatePickerProps
 * @property {string} [mode] - The selection mode: single | range
 * @property {string} [value] - The selected date(s) in ISO format
 * @property {string} [min] - The earliest selectable date (YYYY-MM-DD)
 * @property {string} [max] - The latest selectable date (YYYY-MM-DD)
 * @property {string} [today] - Overrides the date considered "today"
 * @property {string} [focused-date] - The currently focused date
 * @property {string} [view] - The current calendar view: months | days | years
 * @property {string} [months] - The number of months rendered side-by-side: 1 | 2
 * @property {string} [page-by] - Whether prev/next advances by visible range or one month
 * @property {string} [first-day-of-week] - The first day of the week
 * @property {boolean} [with-outside-days] - Show leading/trailing days from adjacent months
 * @property {boolean} [with-week-numbers] - Show the ISO week-number column
 * @property {string} [weekday-format] - The weekday header format: narrow | short | long
 * @property {boolean} [disabled] - Disables the entire picker
 * @property {boolean} [readonly] - Displays the value without allowing changes
 * @property {string} [disabled-dates] - Whitespace-separated ISO dates to disable
 * @property {string} [disabled-days-of-week] - Space-separated 3-letter weekday names to disable
 * @property {boolean} [disable-past] - Disable all dates before today
 * @property {boolean} [disable-future] - Disable all dates after today
 * @property {number} [min-range] - Minimum range length in days (range mode)
 * @property {number} [max-range] - Maximum range length in days (range mode)
 * @property {string} [size] - The visual size: xs | s | m | l | xl
 * @property {string} [locale] - A BCP-47 locale override
 * @property {function} [onInput] - Event fired when the value changes during interaction
 * @property {function} [onChange] - Event fired when the user commits a new value
 * @property {function} [onFocusDay] - Event fired when the focused day changes
 * @property {function} [onViewChange] - Event fired when the view changes
 */

export const DatePicker = React.forwardRef(
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
    const datepickerRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        focus: (options) => {
          if (
            datepickerRef.current &&
            typeof datepickerRef.current.focus === 'function'
          ) {
            datepickerRef.current.focus(options);
          }
        },
        goToDate: (date) => {
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

    React.useEffect(() => {
      ensureLoaded();
      const el = datepickerRef.current;
      if (!el) return;

      const handleInput = (e) => {
        if (onInput) onInput(e);
      };

      const handleChange = (e) => {
        if (onChange) onChange(e);
      };

      const handleFocusDay = (e) => {
        if (onFocusDay) onFocusDay(e);
      };

      const handleViewChange = (e) => {
        if (onViewChange) onViewChange(e);
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
        {...props}
      >
        {children}
      </wa-date-picker>
    );
  }
);

DatePicker.displayName = 'DatePicker';
