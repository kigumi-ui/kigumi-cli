import React from 'react';
import clsx from 'clsx';
import './Dropdown.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/dropdown/dropdown.js'));
}

/**
 * @typedef {Object} DropdownRef
 * @property {() => void} show
 * @property {() => void} hide
 * @property {HTMLElement | null} element
 */

/**
 * @typedef {Object} DropdownProps
 * @property {boolean} [open] - Indicates whether the dropdown is open
 * @property {string} [placement] - Preferred placement of the dropdown panel: top | top-start | top-end | bottom | bottom-start | bottom-end | right | right-start | right-end | left | left-start | left-end
 * @property {boolean} [disabled] - Deprecated: Disable the trigger button instead. Removed in the next major.
 * @property {boolean} [stay-open-on-select] - Deprecated: Call preventDefault() on the select event to keep the dropdown open. Removed in the next major.
 * @property {number} [distance] - Distance from the panel to the trigger
 * @property {number} [skidding] - Offset along the trigger
 * @property {boolean} [hoist] - Deprecated: The panel already renders in the top layer, where no ancestor can clip it, so remove this prop. Removed in the next major.
 * @property {string} [size] - Dropdown size: small | medium | large | xs | s | m | l | xl
 */

export const Dropdown = React.forwardRef(
  (
    {
      children,
      className,
      open,
      onShow,
      onAfterShow,
      onHide,
      onAfterHide,
      onSelect,
      ...props
    },
    ref
  ) => {
    const dropdownRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        show: () => dropdownRef.current?.show?.(),
        hide: () => dropdownRef.current?.hide?.(),
        get element() {
          return dropdownRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
      const el = dropdownRef.current;
      if (!el || open === undefined) return;

      const isOpen = el.open ?? false;
      if (open && !isOpen) {
        el.show?.();
      } else if (!open && isOpen) {
        el.hide?.();
      }
    }, [open]);

    React.useEffect(() => {
      const el = dropdownRef.current;
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
      const handleSelect = (e) => {
        if (e.target !== e.currentTarget) return;
        onSelect?.(e);
      };

      el.addEventListener('wa-show', handleShow);
      el.addEventListener('wa-after-show', handleAfterShow);
      el.addEventListener('wa-hide', handleHide);
      el.addEventListener('wa-after-hide', handleAfterHide);
      el.addEventListener('wa-select', handleSelect);

      return () => {
        el.removeEventListener('wa-show', handleShow);
        el.removeEventListener('wa-after-show', handleAfterShow);
        el.removeEventListener('wa-hide', handleHide);
        el.removeEventListener('wa-after-hide', handleAfterHide);
        el.removeEventListener('wa-select', handleSelect);
      };
    }, [onShow, onAfterShow, onHide, onAfterHide, onSelect]);

    return (
      <wa-dropdown
        ref={dropdownRef}
        class={clsx('Dropdown', className)}
        {...props}
      >
        {children}
      </wa-dropdown>
    );
  }
);

Dropdown.displayName = 'Dropdown';
