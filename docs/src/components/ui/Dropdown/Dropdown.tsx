import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/dropdown/dropdown.js';
import './Dropdown.css';

export interface DropdownProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir' | 'onSelect'
> {
  /** Opens or closes the dropdown */
  open?: boolean;
  /** The placement of the dropdown menu */
  placement?:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'right'
    | 'right-start'
    | 'right-end'
    | 'left'
    | 'left-start'
    | 'left-end';
  /** The dropdown's size */
  size?: 'small' | 'medium' | 'large';
  /** The distance of the dropdown menu from its trigger */
  distance?: number;
  /** The offset of the dropdown menu along its trigger */
  skidding?: number;
  /** Event fired when the dropdown is shown */
  onShow?: (event: CustomEvent) => void;
  /** Event fired after the dropdown is shown */
  onAfterShow?: (event: CustomEvent) => void;
  /** Event fired when the dropdown is about to hide */
  onHide?: (event: CustomEvent) => void;
  /** Event fired after the dropdown is hidden */
  onAfterHide?: (event: CustomEvent) => void;
  /** Event fired when an item is selected */
  onSelect?: (event: CustomEvent) => void;
}

export interface DropdownRef {
  show: () => void;
  hide: () => void;
  element: HTMLElement | null;
}

export const Dropdown = forwardRef<DropdownRef, DropdownProps>(
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
    const dropdownRef = useRef<
      HTMLElement & {
        show?: () => void;
        hide?: () => void;
        open?: boolean;
      }
    >(null);

    useImperativeHandle(
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

    useEffect(() => {
      const el = dropdownRef.current;
      if (!el || open === undefined) return;

      const isOpen = el.open ?? false;
      if (open && !isOpen) {
        el.show?.();
      } else if (!open && isOpen) {
        el.hide?.();
      }
    }, [open]);

    useEffect(() => {
      const el = dropdownRef.current;
      if (!el) return;

      const handleShow = (e: Event) => onShow?.(e as CustomEvent);
      const handleAfterShow = (e: Event) => onAfterShow?.(e as CustomEvent);
      const handleHide = (e: Event) => onHide?.(e as CustomEvent);
      const handleAfterHide = (e: Event) => onAfterHide?.(e as CustomEvent);
      const handleSelect = (e: Event) => onSelect?.(e as CustomEvent);

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
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-dropdown>
    );
  }
);

Dropdown.displayName = 'Dropdown';
