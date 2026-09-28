import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/tooltip/tooltip.js';
import './Tooltip.css';
import type { WaAfterHideEvent } from '@awesome.me/webawesome-pro/dist/events/after-hide.js';
import type { WaAfterShowEvent } from '@awesome.me/webawesome-pro/dist/events/after-show.js';
import type { WaHideEvent } from '@awesome.me/webawesome-pro/dist/events/hide.js';
import type { WaShowEvent } from '@awesome.me/webawesome-pro/dist/events/show.js';

/**
 * Tooltips display additional information based on a specific action
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Tooltip />
 *
 * // With event handlers
 * <Tooltip
 *   onShow={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<TooltipRef>(null);
 * <button onClick={() => ref.current?.show()}>Call Method</button>
 * <Tooltip ref={ref} />
 * ```
 */
export interface TooltipProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onShow' | 'onAfterShow' | 'onHide' | 'onAfterHide' | 'dir'
> {
  /** ID of the target element the tooltip is attached to */
  for?: string;

  /** Tooltip placement */
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

  /** Disables the tooltip */
  disabled?: boolean;

  /** Distance from target */
  distance?: number;

  /** Whether the tooltip is open */
  open?: boolean;

  /** Offset along target */
  skidding?: number;

  /** Activation events */
  trigger?: string;

  /** Hides the arrow */
  'without-arrow'?: boolean;

  /** Show delay (ms) */
  'show-delay'?: number;

  /** Hide delay (ms) */
  'hide-delay'?: number;

  /** Emitted when the tooltip begins to show. */
  onShow?: (event: WaShowEvent) => void;

  /** Emitted after the tooltip has shown and all animations are complete. */
  onAfterShow?: (event: WaAfterShowEvent) => void;

  /** Emitted when the tooltip begins to hide. */
  onHide?: (event: WaHideEvent) => void;

  /** Emitted after the tooltip has hidden and all animations are complete. */
  onAfterHide?: (event: WaAfterHideEvent) => void;
}

export interface TooltipRef {
  /** Shows the tooltip. */
  show: () => void;

  /** Hides the tooltip */
  hide: () => void;
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const Tooltip = forwardRef<TooltipRef, TooltipProps>(
  (
    { children, className, onShow, onAfterShow, onHide, onAfterHide, ...props },
    ref
  ) => {
    const tooltipRef = useRef<
      HTMLElement & {
        show?: () => void;
        hide?: () => void;
      }
    >(null);

    const setTooltipRef = useCallback((el: typeof tooltipRef.current) => {
      tooltipRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        show: () => {
          if (
            tooltipRef.current &&
            typeof tooltipRef.current.show === 'function'
          ) {
            tooltipRef.current.show();
          }
        },
        hide: () => {
          if (
            tooltipRef.current &&
            typeof tooltipRef.current.hide === 'function'
          ) {
            tooltipRef.current.hide();
          }
        },
        get element() {
          return tooltipRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      const el = tooltipRef.current;
      if (!el) return;

      const handleShow = (e: Event) => {
        if (onShow) onShow(e as WaShowEvent);
      };

      const handleAfterShow = (e: Event) => {
        if (onAfterShow) onAfterShow(e as WaAfterShowEvent);
      };

      const handleHide = (e: Event) => {
        if (onHide) onHide(e as WaHideEvent);
      };

      const handleAfterHide = (e: Event) => {
        if (onAfterHide) onAfterHide(e as WaAfterHideEvent);
      };

      el.addEventListener('wa-show', handleShow);
      el.addEventListener('wa-after-show', handleAfterShow);
      el.addEventListener('wa-hide', handleHide);
      el.addEventListener('wa-after-hide', handleAfterHide);

      return () => {
        el.removeEventListener('wa-show', handleShow);
        el.removeEventListener('wa-after-show', handleAfterShow);
        el.removeEventListener('wa-hide', handleHide);
        el.removeEventListener('wa-after-hide', handleAfterHide);
      };
    }, [onShow, onAfterShow, onHide, onAfterHide]);

    return (
      <wa-tooltip
        ref={setTooltipRef}
        class={clsx('Tooltip', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-tooltip>
    );
  }
);

Tooltip.displayName = 'Tooltip';
