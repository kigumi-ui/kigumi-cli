import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaDropdown from '@awesome.me/webawesome/dist/components/dropdown/dropdown.js';
import './Dropdown.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/dropdown/dropdown.js'));
}

/**
 * Dropdowns expose additional content that pops up when the user interacts with a trigger
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Dropdown />
 *
 * // With event handlers
 * <Dropdown
 *   onShow={(e) => console.log(e)} />
 *
 * ```
 */
export interface DropdownProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onShow' | 'onAfterShow' | 'onHide' | 'onAfterHide' | 'onSelect' | 'dir'
> {
  /** Indicates whether the dropdown is open */
  open?: boolean;

  /** Preferred placement of the dropdown panel */
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

  /** Disables the dropdown */
  disabled?: boolean;

  /** Keeps the dropdown open when an item is selected */
  'stay-open-on-select'?: boolean;

  /** Distance from the panel to the trigger */
  distance?: number;

  /** Offset along the trigger */
  skidding?: number;

  /** Hoists the dropdown panel to the body */
  hoist?: boolean;

  /** Dropdown size */
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';

  /** Emitted when the dropdown is about to show. */
  onShow?: (event: CustomEvent) => void;

  /** Emitted after the dropdown has been shown. */
  onAfterShow?: (event: CustomEvent) => void;

  /** Emitted when the dropdown is about to hide. */
  onHide?: (event: CustomEvent) => void;

  /** Emitted after the dropdown has been hidden. */
  onAfterHide?: (event: CustomEvent) => void;

  /** Emitted when an item in the dropdown is selected. */
  onSelect?: (event: CustomEvent) => void;
}

export interface DropdownRef {
  /** Reference to the underlying HTML element */
  element: WaDropdown | null;
}

export const Dropdown = forwardRef<DropdownRef, DropdownProps>(
  (
    {
      children,
      className,
      onShow,
      onAfterShow,
      onHide,
      onAfterHide,
      onSelect,
      ...props
    },
    ref
  ) => {
    const dropdownRef = useRef<WaDropdown | null>(null);
    const setDropdownRef = useCallback((el: WaDropdown | null) => {
      dropdownRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return dropdownRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = dropdownRef.current;
      if (!el) return;

      const handleWaShow = (e: Event) => {
        if (onShow) onShow(e as CustomEvent);
      };

      const handleWaAfterShow = (e: Event) => {
        if (onAfterShow) onAfterShow(e as CustomEvent);
      };

      const handleWaHide = (e: Event) => {
        if (onHide) onHide(e as CustomEvent);
      };

      const handleWaAfterHide = (e: Event) => {
        if (onAfterHide) onAfterHide(e as CustomEvent);
      };

      const handleWaSelect = (e: Event) => {
        if (onSelect) onSelect(e as CustomEvent);
      };

      el.addEventListener('wa-show', handleWaShow);
      el.addEventListener('wa-after-show', handleWaAfterShow);
      el.addEventListener('wa-hide', handleWaHide);
      el.addEventListener('wa-after-hide', handleWaAfterHide);
      el.addEventListener('wa-select', handleWaSelect);

      return () => {
        el.removeEventListener('wa-show', handleWaShow);
        el.removeEventListener('wa-after-show', handleWaAfterShow);
        el.removeEventListener('wa-hide', handleWaHide);
        el.removeEventListener('wa-after-hide', handleWaAfterHide);
        el.removeEventListener('wa-select', handleWaSelect);
      };
    }, [onShow, onAfterShow, onHide, onAfterHide, onSelect]);

    return (
      <wa-dropdown
        ref={setDropdownRef}
        class={clsx('Dropdown', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-dropdown>
    );
  }
);

Dropdown.displayName = 'Dropdown';
