import React from 'react';
import clsx from 'clsx';
import './DropdownItem.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js'));
}

/**
 * @typedef {Object} DropdownItemRef
 * @property {() => void} openSubmenu
 * @property {() => void} closeSubmenu
 * @property {HTMLElement | null} element
 */

/**
 * @typedef {Object} DropdownItemProps
 * @property {string} [type] - The type of menu item: normal | checkbox
 * @property {boolean} [checked] - Draws the item in a checked state (checkbox type)
 * @property {string} [value] - A unique value for the menu item
 * @property {boolean} [disabled] - Disables the menu item
 * @property {boolean} [loading] - Deprecated: Dropdown items have no loading state, so remove this prop. Removed in the next major.
 * @property {string} [variant] - The dropdown item variant: default | danger
 * @property {string} [href] - When set, selecting the item navigates to this URL
 * @property {string} [target] - Tells the browser where to open the link (when href is set): _blank | _parent | _self | _top
 * @property {string} [rel] - The rel attribute on the underlying link (when href is set)
 * @property {string} [download] - Download filename (when href is set)
 */

export const DropdownItem = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    const itemRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        openSubmenu: () => itemRef.current?.openSubmenu?.(),
        closeSubmenu: () => itemRef.current?.closeSubmenu?.(),
        get element() {
          return itemRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-dropdown-item
        ref={itemRef}
        class={clsx('DropdownItem', className)}
        {...props}
      >
        {children}
      </wa-dropdown-item>
    );
  }
);

DropdownItem.displayName = 'DropdownItem';
