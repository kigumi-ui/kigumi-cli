import React from 'react';
import clsx from 'clsx';
import './Combobox.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/combobox/combobox.js'));
}

/**
 * Write a boolean as the keyword an enumerated attribute expects ("on"/"off",
 * "true"/"false"), or remove the attribute when the prop is unset so the
 * element keeps its own default. Web Awesome reads these by value, not
 * presence, and React would write a DOM property or a bare attribute.
 *
 * @param {Element} el
 * @param {string} name
 * @param {boolean | undefined} value
 * @param {Object} keywords - the attribute values for true and for false
 * @param {string} keywords.true
 * @param {string} keywords.false
 */
function setEnumeratedAttribute(el, name, value, keywords) {
  if (value === undefined) el.removeAttribute(name);
  else el.setAttribute(name, value ? keywords.true : keywords.false);
}

/**
 * Combines a text input with a listbox for filtering and selecting options
 */
export const Combobox = React.forwardRef(
  (
    {
      children,
      className,
      onInput,
      onChange,
      onFocus,
      onBlur,
      onShow,
      onAfterShow,
      onHide,
      onAfterHide,
      onClear,
      onInvalid,
      onCreate,
      autocorrect,
      spellcheck,
      ...props
    },
    ref
  ) => {
    const comboboxRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        show: () => comboboxRef.current?.show?.(),
        hide: () => comboboxRef.current?.hide?.(),
        focus: (options) => comboboxRef.current?.focus?.(options),
        blur: () => comboboxRef.current?.blur?.(),
        get element() {
          return comboboxRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
      const el = comboboxRef.current;
      if (!el) return;

      const handleInput = (e) => onInput?.(e);
      const handleChange = (e) => onChange?.(e);
      const handleFocus = (e) => onFocus?.(e);
      const handleBlur = (e) => onBlur?.(e);
      const handleShow = (e) => onShow?.(e);
      const handleAfterShow = (e) => onAfterShow?.(e);
      const handleHide = (e) => onHide?.(e);
      const handleAfterHide = (e) => onAfterHide?.(e);
      const handleClear = (e) => onClear?.(e);
      const handleInvalid = (e) => onInvalid?.(e);
      const handleCreate = (e) => onCreate?.(e);

      el.addEventListener('input', handleInput);
      el.addEventListener('change', handleChange);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('blur', handleBlur);
      el.addEventListener('wa-show', handleShow);
      el.addEventListener('wa-after-show', handleAfterShow);
      el.addEventListener('wa-hide', handleHide);
      el.addEventListener('wa-after-hide', handleAfterHide);
      el.addEventListener('wa-clear', handleClear);
      el.addEventListener('wa-invalid', handleInvalid);
      el.addEventListener('wa-create', handleCreate);

      return () => {
        el.removeEventListener('input', handleInput);
        el.removeEventListener('change', handleChange);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('wa-show', handleShow);
        el.removeEventListener('wa-after-show', handleAfterShow);
        el.removeEventListener('wa-hide', handleHide);
        el.removeEventListener('wa-after-hide', handleAfterHide);
        el.removeEventListener('wa-clear', handleClear);
        el.removeEventListener('wa-invalid', handleInvalid);
        el.removeEventListener('wa-create', handleCreate);
      };
    }, [
      onInput,
      onChange,
      onFocus,
      onBlur,
      onShow,
      onAfterShow,
      onHide,
      onAfterHide,
      onClear,
      onInvalid,
      onCreate,
    ]);

    React.useEffect(() => {
      const el = comboboxRef.current;
      if (!el) return;
      setEnumeratedAttribute(el, 'autocorrect', autocorrect, {
        true: 'on',
        false: 'off',
      });
      setEnumeratedAttribute(el, 'spellcheck', spellcheck, {
        true: 'true',
        false: 'false',
      });
    }, [autocorrect, spellcheck]);

    return (
      <wa-combobox
        ref={comboboxRef}
        class={clsx('Combobox', className)}
        {...props}
      >
        {children}
      </wa-combobox>
    );
  }
);

Combobox.displayName = 'Combobox';
