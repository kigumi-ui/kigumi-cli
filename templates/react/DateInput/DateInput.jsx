import React from 'react';
import clsx from 'clsx';
import './DateInput.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/date-input/date-input.js'));
}

/**
 * A segmented date field with an optional popup calendar, for use in forms
 *
 * @example
 * ```jsx
 * // Basic usage
 * <DateInput label="Start date" name="start" />
 *
 * // Required with a range
 * <DateInput label="Trip" mode="range" required with-clear />
 *
 * // Using ref methods
 * const inputRef = React.useRef(null);
 * <button onClick={() => inputRef.current?.show()}>Open calendar</button>
 * <DateInput ref={inputRef} />
 * ```
 *
 * @typedef {Object} DateInputProps
 * @property {string} [name] - The name of the form control, submitted with form data
 * @property {string} [value] - The current value; ISO date or range
 * @property {string} [mode] - The selection mode: single | range
 * @property {string} [label] - The input label (use the label slot for HTML)
 * @property {string} [hint] - The hint text (use the hint slot for HTML)
 * @property {string} [size] - The visual size: xs | s | m | l | xl
 * @property {string} [appearance] - The visual appearance: filled | outlined | filled-outlined
 * @property {boolean} [pill] - Draws the input with pill-style rounded edges
 * @property {boolean} [required] - Makes the input required for form submission
 * @property {boolean} [readonly] - Makes the input non-editable
 * @property {boolean} [disabled] - Disables the input
 * @property {string} [autocomplete] - Forwarded to the hidden form input for browser autofill
 * @property {boolean} [with-clear] - Shows a clear button when a value is present
 * @property {string} [min] - The earliest selectable date
 * @property {string} [max] - The latest selectable date
 * @property {string} [today] - Overrides the date considered "today"
 * @property {string} [first-day-of-week] - The first day of the week in the popup calendar
 * @property {string} [disabled-dates] - Whitespace-separated ISO dates to disable
 * @property {string} [disabled-days-of-week] - Space-separated 3-letter weekday names to disable
 * @property {boolean} [disable-past] - Disable all dates before today
 * @property {boolean} [disable-future] - Disable all dates after today
 * @property {number} [min-range] - Minimum range length in days (range mode)
 * @property {number} [max-range] - Maximum range length in days (range mode)
 * @property {string} [months] - The number of months rendered in the popup calendar: 1 | 2
 * @property {string} [page-by] - Whether prev/next pages by visible range or one month
 * @property {boolean} [with-outside-days] - Show leading/trailing adjacent-month days in the popup
 * @property {boolean} [with-week-numbers] - Show ISO week numbers in the popup
 * @property {string} [weekday-format] - The weekday header format in the popup
 * @property {boolean} [open] - Whether the popup calendar is open
 * @property {string} [placement] - The preferred popup placement
 * @property {number} [distance] - The distance in pixels between the popup and input
 * @property {function} [onInput] - Event fired on every segment edit, step, calendar interaction, and clear
 * @property {function} [onChange] - Event fired on every committed value transition
 * @property {function} [onFocus] - Event fired when the control receives focus
 * @property {function} [onBlur] - Event fired when the control loses focus
 * @property {function} [onClear] - Event fired when the clear button is activated
 * @property {function} [onShow] - Event fired when the popup is about to open
 * @property {function} [onAfterShow] - Event fired after the popup opens
 * @property {function} [onHide] - Event fired when the popup is about to close
 * @property {function} [onAfterHide] - Event fired after the popup closes
 * @property {function} [onInvalid] - Event fired when constraints aren't satisfied
 */

export const DateInput = React.forwardRef(
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
    const dateinputRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        focus: (options) => {
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
        formStateRestoreCallback: (state) => {
          if (
            dateinputRef.current &&
            typeof dateinputRef.current.formStateRestoreCallback === 'function'
          ) {
            dateinputRef.current.formStateRestoreCallback(state);
          }
        },
        setCustomValidity: (message) => {
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

    React.useEffect(() => {
      ensureLoaded();
      const el = dateinputRef.current;
      if (!el) return;

      const handleInput = (e) => {
        if (onInput) onInput(e);
      };

      const handleChange = (e) => {
        if (onChange) onChange(e);
      };

      const handleFocus = (e) => {
        if (onFocus) onFocus(e);
      };

      const handleBlur = (e) => {
        if (onBlur) onBlur(e);
      };

      const handleClear = (e) => {
        if (onClear) onClear(e);
      };

      const handleShow = (e) => {
        if (onShow) onShow(e);
      };

      const handleAfterShow = (e) => {
        if (onAfterShow) onAfterShow(e);
      };

      const handleHide = (e) => {
        if (onHide) onHide(e);
      };

      const handleAfterHide = (e) => {
        if (onAfterHide) onAfterHide(e);
      };

      const handleInvalid = (e) => {
        if (onInvalid) onInvalid(e);
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
        {...props}
      >
        {children}
      </wa-date-input>
    );
  }
);

DateInput.displayName = 'DateInput';
