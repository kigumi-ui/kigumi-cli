import React from 'react';
import clsx from 'clsx';
import './Select.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/select/select.js'));
}

/**
 * @typedef {Object} SelectProps
 * @property {string} [name] - Form field name
 * @property {string} [value] - Selected value(s)
 * @property {string} [appearance] - Visual appearance: filled | outlined | filled-outlined
 * @property {string} [size] - Select size: small | medium | large | xs | s | m | l | xl
 * @property {string} [placeholder] - Placeholder text
 * @property {boolean} [multiple] - Allows multiple selections
 * @property {number} [max-options-visible] - Max visible tags (multiple)
 * @property {boolean} [disabled] - Disables the select
 * @property {boolean} [with-clear] - Shows clear button
 * @property {boolean} [open] - Whether listbox is open
 * @property {boolean} [hoist] - Deprecated: The panel already renders in the top layer, where no ancestor can clip it, so remove this prop. Removed in the next major.
 * @property {string} [placement] - Listbox placement: top | bottom
 * @property {boolean} [pill] - Rounded edges
 * @property {string} [label] - Label text
 * @property {string} [hint] - Hint text
 * @property {boolean} [required] - Makes selection required
 * @property {boolean} [invalid] - Deprecated: The invalid state follows required and custom-error; style it with the :state(user-invalid) selector. Removed in the next major.
 * @property {string} [help-text] - Deprecated: Use hint instead. Removed in the next major.
 * @property {string} [custom-error] - Custom validation message; the control is invalid while it is set
 */

export const Select = React.forwardRef(
  (
    {
      children,
      className,
      open,
      onChange,
      onShow,
      onAfterShow,
      onHide,
      onAfterHide,
      onClear,
      onInvalid,
      ...props
    },
    ref
  ) => {
    const selectRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        show: () => selectRef.current?.show?.(),
        hide: () => selectRef.current?.hide?.(),
        focus: (options) => selectRef.current?.focus?.(options),
        blur: () => selectRef.current?.blur?.(),
        get element() {
          return selectRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
      const el = selectRef.current;
      if (!el || open === undefined) return;

      const isOpen = el.open ?? false;
      if (open && !isOpen) {
        el.show?.();
      } else if (!open && isOpen) {
        el.hide?.();
      }
    }, [open]);

    React.useEffect(() => {
      const el = selectRef.current;
      if (!el) return;

      const handleChange = (e) => {
        if (e.target !== e.currentTarget) return;
        onChange?.(e);
      };
      const handleShow = (e) => {
        if (e.target !== e.currentTarget) return;
        onShow?.(e);
      };
      const handleAfterShow = (e) => {
        if (e.target !== e.currentTarget) return;
        onAfterShow?.(e);
      };
      const handleHide = (e) => {
        if (e.target !== e.currentTarget) return;
        onHide?.(e);
      };
      const handleAfterHide = (e) => {
        if (e.target !== e.currentTarget) return;
        onAfterHide?.(e);
      };
      const handleClear = (e) => {
        if (e.target !== e.currentTarget) return;
        onClear?.(e);
      };
      const handleInvalid = (e) => {
        if (e.target !== e.currentTarget) return;
        onInvalid?.(e);
      };

      el.addEventListener('change', handleChange);
      el.addEventListener('wa-show', handleShow);
      el.addEventListener('wa-after-show', handleAfterShow);
      el.addEventListener('wa-hide', handleHide);
      el.addEventListener('wa-after-hide', handleAfterHide);
      el.addEventListener('wa-clear', handleClear);
      el.addEventListener('wa-invalid', handleInvalid);

      return () => {
        el.removeEventListener('change', handleChange);
        el.removeEventListener('wa-show', handleShow);
        el.removeEventListener('wa-after-show', handleAfterShow);
        el.removeEventListener('wa-hide', handleHide);
        el.removeEventListener('wa-after-hide', handleAfterHide);
        el.removeEventListener('wa-clear', handleClear);
        el.removeEventListener('wa-invalid', handleInvalid);
      };
    }, [
      onChange,
      onShow,
      onAfterShow,
      onHide,
      onAfterHide,
      onClear,
      onInvalid,
    ]);

    return (
      <wa-select ref={selectRef} class={clsx('Select', className)} {...props}>
        {children}
      </wa-select>
    );
  }
);

Select.displayName = 'Select';
