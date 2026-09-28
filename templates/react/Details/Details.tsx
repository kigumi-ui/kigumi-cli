import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaDetails from '@awesome.me/webawesome/dist/components/details/details.js';
import type { WaAfterHideEvent } from '@awesome.me/webawesome/dist/events/after-hide.js';
import type { WaAfterShowEvent } from '@awesome.me/webawesome/dist/events/after-show.js';
import type { WaHideEvent } from '@awesome.me/webawesome/dist/events/hide.js';
import type { WaShowEvent } from '@awesome.me/webawesome/dist/events/show.js';
import './Details.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/details/details.js'));
}

/**
 * Shows a brief summary and expands to show additional content
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Details />
 *
 * // With event handlers
 * <Details
 *   onShow={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<DetailsRef>(null);
 * <button onClick={() => ref.current?.show()}>Call Method</button>
 * <Details ref={ref} />
 * ```
 */
export interface DetailsProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onShow' | 'onAfterShow' | 'onHide' | 'onAfterHide' | 'dir'
> {
  /** Whether the details are expanded */
  open?: boolean;

  /** Summary text shown in header */
  summary?: string;

  /** Disables the details */
  disabled?: boolean;

  /** Visual appearance style */
  appearance?: 'filled' | 'outlined' | 'filled-outlined' | 'plain';

  /** Position of the expand icon */
  'icon-placement'?: 'start' | 'end';

  /** Name for accordion grouping */
  name?: string;

  /** Emitted when the details opens. */
  onShow?: (event: WaShowEvent) => void;

  /** Emitted after the details opens and all animations are complete. */
  onAfterShow?: (event: WaAfterShowEvent) => void;

  /** Emitted when the details closes. */
  onHide?: (event: WaHideEvent) => void;

  /** Emitted after the details closes and all animations are complete. */
  onAfterHide?: (event: WaAfterHideEvent) => void;
}

export interface DetailsRef {
  /** Shows the details. */
  show: () => void;

  /** Hides the details */
  hide: () => void;
  /** Reference to the underlying HTML element */
  element: WaDetails | null;
}

export const Details = forwardRef<DetailsRef, DetailsProps>(
  (
    { children, className, onShow, onAfterShow, onHide, onAfterHide, ...props },
    ref
  ) => {
    const detailsRef = useRef<WaDetails | null>(null);
    const setDetailsRef = useCallback((el: WaDetails | null) => {
      detailsRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        show: () => {
          if (
            detailsRef.current &&
            typeof detailsRef.current.show === 'function'
          ) {
            detailsRef.current.show();
          }
        },
        hide: () => {
          if (
            detailsRef.current &&
            typeof detailsRef.current.hide === 'function'
          ) {
            detailsRef.current.hide();
          }
        },
        get element() {
          return detailsRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = detailsRef.current;
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
      <wa-details
        ref={setDetailsRef}
        class={clsx('Details', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-details>
    );
  }
);

Details.displayName = 'Details';
