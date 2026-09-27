import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaToastItem from '@awesome.me/webawesome/dist/components/toast-item/toast-item.js';
import type { WaAfterHideEvent } from '@awesome.me/webawesome/dist/events/after-hide.js';
import type { WaAfterShowEvent } from '@awesome.me/webawesome/dist/events/after-show.js';
import type { WaHideEvent } from '@awesome.me/webawesome/dist/events/hide.js';
import type { WaShowEvent } from '@awesome.me/webawesome/dist/events/show.js';
import './ToastItem.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/toast-item/toast-item.js'));
}

/**
 * A single notification banner that can be stacked inside a Toast container
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ToastItem />
 *
 * // With event handlers
 * <ToastItem
 *   onShow={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<ToastItemRef>(null);
 * <button onClick={() => ref.current?.hide()}>Call Method</button>
 * <ToastItem ref={ref} />
 * ```
 */
export interface ToastItemProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onShow' | 'onAfterShow' | 'onHide' | 'onAfterHide' | 'dir'
> {
  /** Colour scheme reflecting the notification intent */
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

  /** Controls the overall dimensions of the notification */
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';

  /** Milliseconds before auto-dismiss. Use 0 to keep the notification visible until closed. */
  duration?: number;

  onShow?: (event: WaShowEvent) => void;

  onAfterShow?: (event: WaAfterShowEvent) => void;

  onHide?: (event: WaHideEvent) => void;

  onAfterHide?: (event: WaAfterHideEvent) => void;
}

export interface ToastItemRef {
  hide: () => void;
  /** Reference to the underlying HTML element */
  element: WaToastItem | null;
}

export const ToastItem = forwardRef<ToastItemRef, ToastItemProps>(
  (
    { children, className, onShow, onAfterShow, onHide, onAfterHide, ...props },
    ref
  ) => {
    const toastitemRef = useRef<WaToastItem | null>(null);
    const setToastItemRef = useCallback((el: WaToastItem | null) => {
      toastitemRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        hide: () => {
          if (
            toastitemRef.current &&
            typeof toastitemRef.current.hide === 'function'
          ) {
            toastitemRef.current.hide();
          }
        },
        get element() {
          return toastitemRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = toastitemRef.current;
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
      <wa-toast-item
        ref={setToastItemRef}
        class={clsx('ToastItem', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-toast-item>
    );
  }
);

ToastItem.displayName = 'ToastItem';
