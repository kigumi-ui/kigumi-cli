import React from 'react';
import clsx from 'clsx';
import './Select.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/select/select.js'));
}

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
