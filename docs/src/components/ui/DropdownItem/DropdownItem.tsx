import {
  forwardRef,
  useRef,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/dropdown-item/dropdown-item.js';
import './DropdownItem.css';

export interface DropdownItemProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** The dropdown item's type */
  type?: 'normal' | 'checkbox';
  /** Set to true to check the dropdown item (only valid when type is checkbox) */
  checked?: boolean;
  /** Disables the dropdown item */
  disabled?: boolean;
  /** An optional value for the menu item */
  value?: string;
  /** The type of menu item to render */
  variant?: 'default' | 'danger';
}

export interface DropdownItemRef {
  openSubmenu: () => void;
  closeSubmenu: () => void;
  element: HTMLElement | null;
}

export const DropdownItem = forwardRef<DropdownItemRef, DropdownItemProps>(
  ({ children, className, ...props }, ref) => {
    const itemRef = useRef<
      HTMLElement & {
        openSubmenu?: () => void;
        closeSubmenu?: () => void;
      }
    >(null);

    useImperativeHandle(
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

    return (
      <wa-dropdown-item
        ref={itemRef}
        class={clsx('DropdownItem', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-dropdown-item>
    );
  }
);

DropdownItem.displayName = 'DropdownItem';
