import React from 'react';
import clsx from 'clsx';
import './RadioGroup.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/radio-group/radio-group.js'));
}

/**
 * @typedef {Object} RadioGroupProps
 * @property {string} [label] - Group label
 * @property {string} [hint] - Hint text
 * @property {string} [name] - Form field name
 * @property {string} [value] - Selected value
 * @property {string} [size] - Radio size: small | medium | large | xs | s | m | l | xl
 * @property {boolean} [required] - Makes selection required
 * @property {string} [orientation] - Layout direction: horizontal | vertical
 * @property {boolean} [disabled] - Disables the group
 * @property {boolean} [invalid] - Deprecated: The invalid state follows required and custom-error; style it with the :state(user-invalid) selector. Removed in the next major.
 * @property {string} [help-text] - Deprecated: Use hint instead. Removed in the next major.
 * @property {string} [custom-error] - Custom validation message; the control is invalid while it is set
 */

export const RadioGroup = React.forwardRef(
  ({ children, className, onChange, onInvalid, ...props }, ref) => {
    const groupRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        focus: (options) => groupRef.current?.focus?.(options),
        get element() {
          return groupRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
      const el = groupRef.current;
      if (!el) return;

      const handleChange = (e) => {
        if (e.target !== e.currentTarget) return;
        onChange?.(e);
      };
      const handleInvalid = (e) => {
        if (e.target !== e.currentTarget) return;
        onInvalid?.(e);
      };

      el.addEventListener('change', handleChange);
      el.addEventListener('wa-invalid', handleInvalid);

      return () => {
        el.removeEventListener('change', handleChange);
        el.removeEventListener('wa-invalid', handleInvalid);
      };
    }, [onChange, onInvalid]);

    return (
      <wa-radio-group
        ref={groupRef}
        class={clsx('RadioGroup', className)}
        {...props}
      >
        {children}
      </wa-radio-group>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';
