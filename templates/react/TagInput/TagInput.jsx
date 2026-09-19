import React from 'react';
import clsx from 'clsx';
import './TagInput.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/tag-input/tag-input.js'));
}

/**
 * Tag inputs collect a list of short values, such as keywords or labels, as removable tags
 *
 * @example
 * ```jsx
 * // Basic usage
 * <TagInput label="Keywords" placeholder="Add a keyword" />
 *
 * // With event handlers
 * <TagInput
 *   label="Topics"
 *   onChange={(e) => console.log('tags changed')}
 * />
 *
 * // With ref methods
 * const tagInputRef = React.useRef(null);
 * <button onClick={() => tagInputRef.current?.focus()}>Focus</button>
 * <TagInput ref={tagInputRef} label="Tags" />
 * ```
 */
export const TagInput = React.forwardRef(
  (
    {
      children,
      className,
      onInput,
      onChange,
      onBlur,
      onFocus,
      onCreate,
      onClear,
      onInvalid,
      ...props
    },
    ref
  ) => {
    const taginputRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        focus: (options) => {
          if (
            taginputRef.current &&
            typeof taginputRef.current.focus === 'function'
          ) {
            taginputRef.current.focus(options);
          }
        },
        blur: () => {
          if (
            taginputRef.current &&
            typeof taginputRef.current.blur === 'function'
          ) {
            taginputRef.current.blur();
          }
        },
        setCustomValidity: (message) => {
          if (
            taginputRef.current &&
            typeof taginputRef.current.setCustomValidity === 'function'
          ) {
            taginputRef.current.setCustomValidity(message);
          }
        },
        formStateRestoreCallback: (state, reason) => {
          if (
            taginputRef.current &&
            typeof taginputRef.current.formStateRestoreCallback === 'function'
          ) {
            taginputRef.current.formStateRestoreCallback(state, reason);
          }
        },
        resetValidity: () => {
          if (
            taginputRef.current &&
            typeof taginputRef.current.resetValidity === 'function'
          ) {
            taginputRef.current.resetValidity();
          }
        },
        get element() {
          return taginputRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
      const el = taginputRef.current;
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

      const handleWaCreate = (e) => {
        if (onCreate) onCreate(e);
      };

      const handleWaClear = (e) => {
        if (onClear) onClear(e);
      };

      const handleWaInvalid = (e) => {
        if (onInvalid) onInvalid(e);
      };

      el.addEventListener('input', handleInput);
      el.addEventListener('change', handleChange);
      el.addEventListener('blur', handleBlur);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('wa-create', handleWaCreate);
      el.addEventListener('wa-clear', handleWaClear);
      el.addEventListener('wa-invalid', handleWaInvalid);

      return () => {
        el.removeEventListener('input', handleInput);
        el.removeEventListener('change', handleChange);
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('wa-create', handleWaCreate);
        el.removeEventListener('wa-clear', handleWaClear);
        el.removeEventListener('wa-invalid', handleWaInvalid);
      };
    }, [onInput, onChange, onBlur, onFocus, onCreate, onClear, onInvalid]);

    return (
      <wa-tag-input
        ref={taginputRef}
        class={clsx('TagInput', className)}
        {...props}
      >
        {children}
      </wa-tag-input>
    );
  }
);

TagInput.displayName = 'TagInput';
