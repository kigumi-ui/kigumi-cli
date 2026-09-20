import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/dropdown-item/dropdown-item.js';
import './DropdownItem.css';

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
export interface DropdownItemProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onBlur' | 'onFocus' | 'dir'
> {
  /** The type of menu item */
  type?: 'normal' | 'checkbox';

  /** Draws the item in a checked state (checkbox type) */
  checked?: boolean;

  /** A unique value for the menu item */
  value?: string;

  /** Disables the menu item */
  disabled?: boolean;

  /** Visual variant */
  variant?: string;

  /** Draws the item in a loading state */
  loading?: boolean;

  /** When set, selecting the item navigates to this URL */
  href?: string;

  /** Tells the browser where to open the link (when href is set) */
  target?: '_blank' | '_parent' | '_self' | '_top';

  /** The rel attribute on the underlying link (when href is set) */
  rel?: string;

  /** Download filename (when href is set) */
  download?: string;

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
  element: HTMLElement | null;
}

export const DropdownItem = forwardRef<DropdownItemRef, DropdownItemProps>(
  ({ children, className, onBlur, onFocus, ...props }, ref) => {
    const dropdownitemRef = useRef<
      HTMLElement & {
        openSubmenu?: () => void;
        closeSubmenu?: () => void;
      }
    >(null);

    const setDropdownitemRef = useCallback(
      (el: typeof dropdownitemRef.current) => {
        dropdownitemRef.current = el;
      },
      []
    );

    useImperativeHandle(
      ref,
      () => ({
        openSubmenu: () => {
          if (
            dropdownitemRef.current &&
            typeof dropdownitemRef.current.openSubmenu === 'function'
          ) {
            dropdownitemRef.current.openSubmenu();
          }
        },
        closeSubmenu: () => {
          if (
            dropdownitemRef.current &&
            typeof dropdownitemRef.current.closeSubmenu === 'function'
          ) {
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
        ref={setDropdownitemRef}
        class={clsx('DropdownItem', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-dropdown-item>
    );
  }
);

DropdownItem.displayName = 'DropdownItem';
