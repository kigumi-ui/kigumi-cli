import React from 'react';
import clsx from 'clsx';
import './Popover.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/popover/popover.js'));
}

export const Popover = React.forwardRef(
  (
    {
      children,
      className,
      open,
      onShow,
      onAfterShow,
      onHide,
      onAfterHide,
      ...props
    },
    ref
  ) => {
    const popoverRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        show: () => popoverRef.current?.show?.(),
        hide: () => popoverRef.current?.hide?.(),
        get element() {
          return popoverRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
      const el = popoverRef.current;
      if (!el || open === undefined) return;

      const isOpen = el.open ?? false;
      if (open && !isOpen) {
        el.show?.();
      } else if (!open && isOpen) {
        el.hide?.();
      }
    }, [open]);

    React.useEffect(() => {
      const el = popoverRef.current;
      if (!el) return;

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

      el.addEventListener('wa-show', handleShow);
      el.addEventListener('wa-after-show', handleAfterShow);
      el.addEventListener('wa-hide', handleHide);
      el.addEventListener('wa-after-hide', handleAfterHide);

      return () => {
        el.removeEventListener('wa-show', handleShow);
        el.removeEventListener('wa-after-show', handleAfterShow);
        el.removeEventListener('wa-hide', handleHide);
        el.removeEventListener('wa-after-hide', handleAfterHide);
      };
    }, [onShow, onAfterShow, onHide, onAfterHide]);

    return (
      <wa-popover
        ref={popoverRef}
        class={clsx('Popover', className)}
        {...props}
      >
        {children}
      </wa-popover>
    );
  }
);

Popover.displayName = 'Popover';
