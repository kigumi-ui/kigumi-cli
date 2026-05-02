import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaTooltip from '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
import './Tooltip.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/tooltip/tooltip.js'));
}

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

  /** The ID of the element the tooltip is anchored to */
  for?: string;

  /** Emitted when the tooltip begins to show. */
  onShow?: (event: CustomEvent) => void;

  /** Emitted after the tooltip has shown and all animations are complete. */
  onAfterShow?: (event: CustomEvent) => void;

  /** Emitted when the tooltip begins to hide. */
  onHide?: (event: CustomEvent) => void;

  /** Emitted after the tooltip has hidden and all animations are complete. */
  onAfterHide?: (event: CustomEvent) => void;
}

export interface TooltipRef {
  /** Shows the tooltip. */
  show: () => void;

  /** Hides the tooltip */
  hide: () => void;
  /** Reference to the underlying HTML element */
  element: WaTooltip | null;
}

export const Tooltip = forwardRef<TooltipRef, TooltipProps>(
  (
    { children, className, onShow, onAfterShow, onHide, onAfterHide, ...props },
    ref
  ) => {
    const tooltipRef = useRef<WaTooltip | null>(null);
    const setTooltipRef = useCallback((el: WaTooltip | null) => {
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
      ensureLoaded();
      const el = tooltipRef.current;
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
      <wa-tooltip
        ref={setTooltipRef}
        class={clsx('Tooltip', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-tooltip>
    );
  }
);

Tooltip.displayName = 'Tooltip';
