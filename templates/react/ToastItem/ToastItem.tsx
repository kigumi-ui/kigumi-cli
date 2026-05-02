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
  size?: 'small' | 'medium' | 'large';

  /** Milliseconds before auto-dismiss. Use 0 to keep the notification visible until closed. */
  duration?: number;

  /** Emitted when the toast item begins to show. */
  onShow?: (event: CustomEvent) => void;

  /** Emitted after the toast item has finished showing. */
  onAfterShow?: (event: CustomEvent) => void;

  /** Emitted when the toast item begins to hide. */
  onHide?: (event: CustomEvent) => void;

  /** Emitted after the toast item has finished hiding. */
  onAfterHide?: (event: CustomEvent) => void;
}

export interface ToastItemRef {
  /** Hides the toast item with animation and removes it from the DOM. */
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
