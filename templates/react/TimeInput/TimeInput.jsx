import React from 'react';
import clsx from 'clsx';
import './TimeInput.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/time-input/time-input.js'));
}

/**
 * Time inputs collect a time of day from the user
 *
 * @example
 * ```jsx
 * // Basic usage
 * <TimeInput />
 *
 * // With event handlers
 * <TimeInput onInput={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = React.useRef(null);
 * <button onClick={() => ref.current?.focus()}>Focus</button>
 * <TimeInput ref={ref} />
 * ```
 *
 * @param {Object} props
 * @param {string} [props.name] - The name of the control, submitted with form data
 * @param {string} [props.value] - The current value as a 24-hour `HH:mm:ss` string
 * @param {boolean} [props.disabled] - Whether the control is disabled
 * @param {boolean} [props.required] - Whether a value is required before form submission
 * @param {boolean} [props.readonly] - Whether the control is read-only
 * @param {'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl'} [props.size] - Controls the overall dimensions of the control
 * @param {'filled' | 'outlined' | 'filled-outlined'} [props.appearance] - The visual style of the control
 * @param {boolean} [props.pill] - Draws the control with rounded edges
 * @param {string} [props.label] - The control label. Use the `label` slot for rich labels.
 * @param {string} [props.hint] - Help text shown below the control. Use the `hint` slot for rich hints.
 * @param {boolean} [props['with-clear']] - Shows a clear button when the control has a value
 * @param {boolean} [props['with-now']] - Shows a button that sets the value to the current time
 * @param {string} [props.min] - The earliest acceptable time
 * @param {string} [props.max] - The latest acceptable time
 * @param {number} [props.step] - The granularity of the value in seconds
 * @param {'auto' | '12' | '24'} [props['hour-format']] - Whether to display a 12- or 24-hour clock
 * @param {boolean} [props.open] - Whether the time picker dropdown is open
 * @param {'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end'} [props.placement] - The preferred placement of the dropdown
 * @param {function} [props.onInput] - Emitted as the user types into a segment or interacts with the popup columns.
 * @param {function} [props.onChange] - Emitted when the committed value changes.
 * @param {function} [props.onFocus] - Emitted when the control receives focus.
 * @param {function} [props.onBlur] - Emitted when the control loses focus.
 * @param {function} [props.onClear] - Emitted when the clear button is activated.
 * @param {function} [props.onShow] - Emitted when the popup is about to open. Cancelable.
 * @param {function} [props.onAfterShow] - Emitted after the popup opens and animations complete.
 * @param {function} [props.onHide] - Emitted when the popup is about to close. Cancelable.
 * @param {function} [props.onAfterHide] - Emitted after the popup closes and animations complete.
 * @param {function} [props.onInvalid] - Emitted when the form control has been checked for validity and its constraints aren't satisfied.
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} [props.children] - Slotted content
 * @param {React.Ref} ref - Ref with methods: focus(options), blur(), show(), hide(), formStateRestoreCallback(state), setCustomValidity(message), resetValidity()
 */
export const TimeInput = React.forwardRef(
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
    const timeinputRef = React.useRef(null);
    const setTimeInputRef = React.useCallback((el) => {
      timeinputRef.current = el;
    }, []);

    React.useImperativeHandle(
      ref,
      () => ({
        focus: (options) => {
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
        formStateRestoreCallback: (state) => {
          if (
            timeinputRef.current &&
            typeof timeinputRef.current.formStateRestoreCallback === 'function'
          ) {
            timeinputRef.current.formStateRestoreCallback(state);
          }
        },
        setCustomValidity: (message) => {
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

    React.useEffect(() => {
      ensureLoaded();
      const el = timeinputRef.current;
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

      const handleWaClear = (e) => {
        if (onClear) onClear(e);
      };

      const handleWaShow = (e) => {
        if (onShow) onShow(e);
      };

      const handleWaAfterShow = (e) => {
        if (onAfterShow) onAfterShow(e);
      };

      const handleWaHide = (e) => {
        if (onHide) onHide(e);
      };

      const handleWaAfterHide = (e) => {
        if (onAfterHide) onAfterHide(e);
      };

      const handleWaInvalid = (e) => {
        if (onInvalid) onInvalid(e);
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
        ref={setTimeInputRef}
        class={clsx('TimeInput', className)}
        {...{ suppressHydrationWarning: true, ...props }}
      >
        {children}
      </wa-time-input>
    );
  }
);

TimeInput.displayName = 'TimeInput';
