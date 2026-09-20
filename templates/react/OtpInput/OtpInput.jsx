import React from 'react';
import clsx from 'clsx';
import './OtpInput.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/otp-input/otp-input.js'));
}

/**
 * OTP inputs collect one-time passcodes, PINs, and other fixed-length codes, one character per segment
 *
 * @example
 * ```jsx
 * // Basic usage
 * <OtpInput label="Verification code" />
 *
 * // With event handlers
 * <OtpInput
 *   label="Code"
 *   onComplete={(e) => console.log('complete')}
 * />
 *
 * // With ref methods
 * const otpRef = React.useRef(null);
 * <button onClick={() => otpRef.current?.clear()}>Clear</button>
 * <OtpInput ref={otpRef} label="Code" />
 * ```
 */
export const OtpInput = React.forwardRef(
  (
    {
      children,
      className,
      onInput,
      onChange,
      onFocus,
      onBlur,
      onComplete,
      onClear,
      onInvalid,
      ...props
    },
    ref
  ) => {
    const otpinputRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        clear: () => {
          if (
            otpinputRef.current &&
            typeof otpinputRef.current.clear === 'function'
          ) {
            otpinputRef.current.clear();
          }
        },
        focus: (options) => {
          if (
            otpinputRef.current &&
            typeof otpinputRef.current.focus === 'function'
          ) {
            otpinputRef.current.focus(options);
          }
        },
        blur: () => {
          if (
            otpinputRef.current &&
            typeof otpinputRef.current.blur === 'function'
          ) {
            otpinputRef.current.blur();
          }
        },
        select: () => {
          if (
            otpinputRef.current &&
            typeof otpinputRef.current.select === 'function'
          ) {
            otpinputRef.current.select();
          }
        },
        setCustomValidity: (message) => {
          if (
            otpinputRef.current &&
            typeof otpinputRef.current.setCustomValidity === 'function'
          ) {
            otpinputRef.current.setCustomValidity(message);
          }
        },
        formStateRestoreCallback: (state, reason) => {
          if (
            otpinputRef.current &&
            typeof otpinputRef.current.formStateRestoreCallback === 'function'
          ) {
            otpinputRef.current.formStateRestoreCallback(state, reason);
          }
        },
        resetValidity: () => {
          if (
            otpinputRef.current &&
            typeof otpinputRef.current.resetValidity === 'function'
          ) {
            otpinputRef.current.resetValidity();
          }
        },
        get element() {
          return otpinputRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
      const el = otpinputRef.current;
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

      const handleWaComplete = (e) => {
        if (onComplete) onComplete(e);
      };

      const handleWaClear = (e) => {
        if (onClear) onClear(e);
      };

      const handleWaInvalid = (e) => {
        if (onInvalid) onInvalid(e);
      };

      el.addEventListener('input', handleInput);
      el.addEventListener('change', handleChange);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('blur', handleBlur);
      el.addEventListener('wa-complete', handleWaComplete);
      el.addEventListener('wa-clear', handleWaClear);
      el.addEventListener('wa-invalid', handleWaInvalid);

      return () => {
        el.removeEventListener('input', handleInput);
        el.removeEventListener('change', handleChange);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('wa-complete', handleWaComplete);
        el.removeEventListener('wa-clear', handleWaClear);
        el.removeEventListener('wa-invalid', handleWaInvalid);
      };
    }, [onInput, onChange, onFocus, onBlur, onComplete, onClear, onInvalid]);

    return (
      <wa-otp-input
        ref={otpinputRef}
        class={clsx('OtpInput', className)}
        {...props}
      >
        {children}
      </wa-otp-input>
    );
  }
);

OtpInput.displayName = 'OtpInput';
