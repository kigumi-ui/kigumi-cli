import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaPopover from '@awesome.me/webawesome/dist/components/popover/popover.js';
import './Popover.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/popover/popover.js'));
}

/**
 * Popovers display additional content when users interact with a trigger element
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Popover />
 *
 * // With event handlers
 * <Popover
 *   onShow={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<PopoverRef>(null);
 * <button onClick={() => ref.current?.show()}>Call Method</button>
 * <Popover ref={ref} />
 * ```
 */
export interface PopoverProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onShow' | 'onAfterShow' | 'onHide' | 'onAfterHide' | 'dir'
> {
  /** Indicates whether the popover is open */
  open?: boolean;

  /** Disables the popover */
  disabled?: boolean;

  /** Preferred placement */
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

  /** Activation events (click, hover, focus) */
  trigger?: string;

  /** Distance from trigger */
  distance?: number;

  /** Offset along trigger */
  skidding?: number;

  /** Shows an arrow */
  'with-arrow'?: boolean;

  /** Hides the arrow */
  'without-arrow'?: boolean;

  /** The ID of the element the popover is anchored to */
  for?: string;

  /** Emitted when the popover begins to show. Canceling this event will stop the popover from showing. */
  onShow?: (event: CustomEvent) => void;

  /** Emitted after the popover has shown and all animations are complete. */
  onAfterShow?: (event: CustomEvent) => void;

  /** Emitted when the popover begins to hide. Canceling this event will stop the popover from hiding. */
  onHide?: (event: CustomEvent) => void;

  /** Emitted after the popover has hidden and all animations are complete. */
  onAfterHide?: (event: CustomEvent) => void;
}

export interface PopoverRef {
  /** Shows the popover. */
  show: () => void;

  /** Hides the popover. */
  hide: () => void;
  /** Reference to the underlying HTML element */
  element: WaPopover | null;
}

export const Popover = forwardRef<PopoverRef, PopoverProps>(
  (
    { children, className, onShow, onAfterShow, onHide, onAfterHide, ...props },
    ref
  ) => {
    const popoverRef = useRef<WaPopover | null>(null);
    const setPopoverRef = useCallback((el: WaPopover | null) => {
      popoverRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        show: () => {
          if (
            popoverRef.current &&
            typeof popoverRef.current.show === 'function'
          ) {
            popoverRef.current.show();
          }
        },
        hide: () => {
          if (
            popoverRef.current &&
            typeof popoverRef.current.hide === 'function'
          ) {
            popoverRef.current.hide();
          }
        },
        get element() {
          return popoverRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = popoverRef.current;
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

      el.addEventListener('wa-show', handleWaShow);
      el.addEventListener('wa-after-show', handleWaAfterShow);
      el.addEventListener('wa-hide', handleWaHide);
      el.addEventListener('wa-after-hide', handleWaAfterHide);

      return () => {
        el.removeEventListener('wa-show', handleWaShow);
        el.removeEventListener('wa-after-show', handleWaAfterShow);
        el.removeEventListener('wa-hide', handleWaHide);
        el.removeEventListener('wa-after-hide', handleWaAfterHide);
      };
    }, [onShow, onAfterShow, onHide, onAfterHide]);

    return (
      <wa-popover
        ref={setPopoverRef}
        class={clsx('Popover', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-popover>
    );
  }
);

Popover.displayName = 'Popover';
