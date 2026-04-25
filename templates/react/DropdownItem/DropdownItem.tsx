import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaDropdownItem from '@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js';
import './DropdownItem.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js'));
}

/**
 * Dropdown items are used inside dropdowns to represent individual menu items
 *
 * @example
 * ```tsx
 * // Basic usage
 * <DropdownItem />
 *
 * // With event handlers
 * <DropdownItem
 *   onBlur={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<DropdownItemRef>(null);
 * <button onClick={() => ref.current?.openSubmenu()}>Call Method</button>
 * <DropdownItem ref={ref} />
 * ```
 */
export interface DropdownItemProps extends Omit<HTMLAttributes<HTMLElement>, 'onBlur' | 'onFocus' | 'dir'> {

  /** The type of menu item */
  type?: 'normal' | 'checkbox';

  /** Draws the item in a checked state (checkbox type) */
  checked?: boolean;

  /** A unique value for the menu item */
  value?: string;

  /** Disables the menu item */
  disabled?: boolean;

  /** Draws the item in a loading state */
  loading?: boolean;

  /** The dropdown item variant */
  variant?: 'neutral' | 'danger';

  /** Emitted when the dropdown item loses focus. */
  onBlur?: (event: FocusEvent) => void;

  /** Emitted when the dropdown item gains focus. */
  onFocus?: (event: FocusEvent) => void;
}

export interface DropdownItemRef {

  /** Opens the submenu. */
  openSubmenu: () => void;

  /** Closes the submenu. */
  closeSubmenu: () => void;
  /** Reference to the underlying HTML element */
  element: WaDropdownItem | null;
}

export const DropdownItem = forwardRef<DropdownItemRef, DropdownItemProps>(
  ({ children, className, onBlur, onFocus, ...props }, ref) => {
    const dropdownitemRef = useRef<WaDropdownItem | null>(null);
    const setDropdownItemRef = useCallback((el: WaDropdownItem | null) => {
      dropdownitemRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        openSubmenu: () => {
          if (dropdownitemRef.current && typeof dropdownitemRef.current.openSubmenu === 'function') {
            dropdownitemRef.current.openSubmenu();
          }
        },
        closeSubmenu: () => {
          if (dropdownitemRef.current && typeof dropdownitemRef.current.closeSubmenu === 'function') {
            dropdownitemRef.current.closeSubmenu();
          }
        },
        get element() {
          return dropdownitemRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = dropdownitemRef.current;
      if (!el) return;

      const handleBlur = (e: Event) => {
        if (onBlur) onBlur(e as FocusEvent);
      };

      const handleFocus = (e: Event) => {
        if (onFocus) onFocus(e as FocusEvent);
      };

      el.addEventListener('blur', handleBlur);
      el.addEventListener('focus', handleFocus);

      return () => {
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('focus', handleFocus);
      };
    }, [onBlur, onFocus]);

    return (
      <wa-dropdown-item
        ref={setDropdownItemRef}
        class={clsx('DropdownItem', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<string, unknown>)}
      >
        {children}
      </wa-dropdown-item>
    );
  }
);

DropdownItem.displayName = 'DropdownItem';
