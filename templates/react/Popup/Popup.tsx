import { forwardRef, useRef, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import './Popup.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/popup/popup.js'));
}

/**
 * Popup is a utility component for positioning elements relative to an anchor
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Popup />
 *
 * // With event handlers
 * <Popup
 *   onReposition={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<PopupRef>(null);
 * <button onClick={() => ref.current?.reposition()}>Call Method</button>
 * <Popup ref={ref} />
 * ```
 */
export interface PopupProps extends Omit<HTMLAttributes<HTMLElement>, 'onReposition' | 'dir'> {

  /** Activates the positioning logic */
  active?: boolean;

  /** Anchor element ID or reference */
  anchor?: string;

  /** Preferred placement */
  placement?: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'right' | 'right-start' | 'right-end' | 'left' | 'left-start' | 'left-end';

  /** Positioning strategy */
  strategy?: 'absolute' | 'fixed';

  /** Distance from anchor */
  distance?: number;

  /** Offset along anchor */
  skidding?: number;

  /** Shows an arrow */
  arrow?: boolean;

  /** Arrow position */
  'arrow-placement'?: 'start' | 'end' | 'center' | 'anchor';

  /** Arrow edge padding */
  'arrow-padding'?: number;

  /** Flips when constrained */
  flip?: boolean;

  /** Fallback placements */
  'flip-fallback-placements'?: string;

  /** Fallback strategy */
  'flip-fallback-strategy'?: 'best-fit' | 'initial';

  /** Flip boundary padding */
  'flip-padding'?: number;

  /** Shifts to stay visible */
  shift?: boolean;

  /** Shift boundary padding */
  'shift-padding'?: number;

  /** Auto-resize behavior */
  'auto-size'?: 'horizontal' | 'vertical' | 'both';

  /** Syncs dimensions with anchor */
  sync?: 'width' | 'height' | 'both';

  /** Auto-size boundary padding */
  'auto-size-padding'?: number;

  /** Emitted when the popup is repositioned. This event can fire a lot, so avoid putting expensive operations in your listener or consider debouncing it. */
  onReposition?: (event: CustomEvent) => void;
}

export interface PopupRef {

  /** Forces the popup to recalculate and reposition itself. */
  reposition: () => void;
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const Popup = forwardRef<PopupRef, PopupProps>(
  ({ children, className, onReposition, ...props }, ref) => {
    const popupRef = useRef<HTMLElement & {
      reposition?: () => void;
    }>(null);

    useImperativeHandle(
      ref,
      () => ({
        reposition: () => {
          if (popupRef.current && typeof popupRef.current.reposition === 'function') {
            popupRef.current.reposition();
          }
        },
        get element() {
          return popupRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = popupRef.current;
      if (!el) return;

      const handleWaReposition = (e: Event) => {
        if (onReposition) onReposition(e as CustomEvent);
      };

      el.addEventListener('wa-reposition', handleWaReposition);

      return () => {
        el.removeEventListener('wa-reposition', handleWaReposition);
      };
    }, [onReposition]);

    return (
      <wa-popup
        ref={popupRef}
        class={clsx('Popup', className)}
        suppressHydrationWarning
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-popup>
    );
  }
);

Popup.displayName = 'Popup';
