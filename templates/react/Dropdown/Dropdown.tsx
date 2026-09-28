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
import type { WaAfterHideEvent } from '@awesome.me/webawesome/dist/events/after-hide.js';
import type { WaAfterShowEvent } from '@awesome.me/webawesome/dist/events/after-show.js';
import type { WaHideEvent } from '@awesome.me/webawesome/dist/events/hide.js';
import type { WaSelectEvent } from '@awesome.me/webawesome/dist/events/select.js';
import type { WaShowEvent } from '@awesome.me/webawesome/dist/events/show.js';
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
  onShow?: (event: WaShowEvent) => void;

  /** Emitted after the dropdown has been shown. */
  onAfterShow?: (event: WaAfterShowEvent) => void;

  /** Emitted when the dropdown is about to hide. */
  onHide?: (event: WaHideEvent) => void;

  /** Emitted after the dropdown has been hidden. */
  onAfterHide?: (event: WaAfterHideEvent) => void;

  /** Emitted when an item in the dropdown is selected. */
  onSelect?: (event: WaSelectEvent) => void;
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
        if (onShow) onShow(e as WaShowEvent);
      };

      const handleWaAfterShow = (e: Event) => {
        if (onAfterShow) onAfterShow(e as WaAfterShowEvent);
      };

      const handleWaHide = (e: Event) => {
        if (onHide) onHide(e as WaHideEvent);
      };

      const handleWaAfterHide = (e: Event) => {
        if (onAfterHide) onAfterHide(e as WaAfterHideEvent);
      };

      const handleWaSelect = (e: Event) => {
        if (onSelect) onSelect(e as WaSelectEvent);
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
