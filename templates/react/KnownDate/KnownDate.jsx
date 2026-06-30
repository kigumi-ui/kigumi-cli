import React from 'react';
import clsx from 'clsx';
import './KnownDate.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/known-date/known-date.js'));
}

/**
 * Known dates collect a calendar date the user already knows, such as a birthday
 *
 * @example
 * ```jsx
 * // Basic usage
 * <KnownDate />
 *
 * // With event handlers
 * <KnownDate onInput={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = React.useRef(null);
 * <button onClick={() => ref.current?.focus()}>Focus</button>
 * <KnownDate ref={ref} />
 * ```
 *
 * @param {Object} props
 * @param {string} [props.name] - The name of the control, submitted with form data
 * @param {string} [props.value] - The current value as a `YYYY-MM-DD` string
 * @param {boolean} [props.disabled] - Whether the control is disabled
 * @param {boolean} [props.required] - Whether a value is required before form submission
 * @param {boolean} [props.readonly] - Whether the control is read-only
 * @param {'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl'} [props.size] - Controls the overall dimensions of the control
 * @param {'filled' | 'outlined' | 'filled-outlined'} [props.appearance] - The visual style of the control
 * @param {boolean} [props.pill] - Draws the control with rounded edges
 * @param {string} [props.label] - The control label. Use the `label` slot for rich labels.
 * @param {string} [props.hint] - Help text shown below the control. Use the `hint` slot for rich hints.
 * @param {string} [props.min] - The earliest acceptable date
 * @param {string} [props.max] - The latest acceptable date
 * @param {string} [props.locale] - The locale used to format and parse the date
 * @param {function} [props.onInput] - Emitted as the user types in any field.
 * @param {function} [props.onChange] - Emitted when the committed value transitions to a new ISO date.
 * @param {function} [props.onBlur] - Emitted when the control loses focus.
 * @param {function} [props.onFocus] - Emitted when the control gains focus.
 * @param {function} [props.onInvalid] - Emitted when the form control has been checked for validity and its constraints aren't satisfied.
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} [props.children] - Slotted content
 * @param {React.Ref} ref - Ref with methods: focus(options), blur(), formStateRestoreCallback(state), setCustomValidity(message), resetValidity()
 */
export const KnownDate = React.forwardRef(
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
    const knowndateRef = React.useRef(null);
    const setKnownDateRef = React.useCallback((el) => {
      knowndateRef.current = el;
    }, []);

    React.useImperativeHandle(
      ref,
      () => ({
        focus: (options) => {
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
        formStateRestoreCallback: (state) => {
          if (
            knowndateRef.current &&
            typeof knowndateRef.current.formStateRestoreCallback === 'function'
          ) {
            knowndateRef.current.formStateRestoreCallback(state);
          }
        },
        setCustomValidity: (message) => {
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

    React.useEffect(() => {
      ensureLoaded();
      const el = knowndateRef.current;
      if (!el) return;

      const handleInput = (e) => {
        if (onInput) onInput(e);
      };

      const handleChange = (e) => {
        if (onChange) onChange(e);
      };

      const handleBlur = (e) => {
        if (onBlur) onBlur(e);
      };

      const handleFocus = (e) => {
        if (onFocus) onFocus(e);
      };

      const handleWaInvalid = (e) => {
        if (onInvalid) onInvalid(e);
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
        {...{ suppressHydrationWarning: true, ...props }}
      >
        {children}
      </wa-known-date>
    );
  }
);

KnownDate.displayName = 'KnownDate';
