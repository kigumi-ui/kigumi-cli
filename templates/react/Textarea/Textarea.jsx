import React, { useRef, useImperativeHandle, useEffect } from 'react';
import clsx from 'clsx';
import './Textarea.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/textarea/textarea.js'));
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

export const Textarea = React.forwardRef(
  (
    {
      className,
      onInput,
      onChange,
      onInvalid,
      onFocus,
      onBlur,
      autocorrect,
      spellcheck,
      ...props
    },
    ref
  ) => {
    const textareaRef = useRef(null);

    useImperativeHandle(
      ref,
      () => ({
        focus: (options) => textareaRef.current?.focus?.(options),
        blur: () => textareaRef.current?.blur?.(),
        select: () => textareaRef.current?.select?.(),
        setRangeText: (replacement, start, end, selectMode) =>
          textareaRef.current?.setRangeText?.(
            replacement,
            start,
            end,
            selectMode
          ),
        setSelectionRange: (start, end, direction) =>
          textareaRef.current?.setSelectionRange?.(start, end, direction),
        get element() {
          return textareaRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = textareaRef.current;
      if (!el) return;

      const handleInput = (e) => onInput?.(e);
      const handleChange = (e) => onChange?.(e);
      const handleInvalid = (e) => onInvalid?.(e);
      const handleFocus = (e) => onFocus?.(e);
      const handleBlur = (e) => onBlur?.(e);

      el.addEventListener('input', handleInput);
      el.addEventListener('change', handleChange);
      el.addEventListener('wa-invalid', handleInvalid);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('blur', handleBlur);

      return () => {
        el.removeEventListener('input', handleInput);
        el.removeEventListener('change', handleChange);
        el.removeEventListener('wa-invalid', handleInvalid);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('blur', handleBlur);
      };
    }, [onInput, onChange, onInvalid, onFocus, onBlur]);

    React.useEffect(() => {
      const el = textareaRef.current;
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
      <wa-textarea
        ref={textareaRef}
        class={clsx('Textarea', className)}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
