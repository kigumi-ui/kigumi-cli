import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/split-panel/split-panel.js';
import './SplitPanel.css';
import type { WaRepositionEvent } from '@awesome.me/webawesome-pro/dist/events/reposition.js';

/**
 * Split panels display two adjacent panels with a divider for resizing
 *
 * @example
 * ```tsx
 * // Basic usage
 * <SplitPanel />
 *
 * // With event handlers
 * <SplitPanel
 *   onReposition={(e) => console.log(e)} />
 *
 * ```
 */
export interface SplitPanelProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onReposition' | 'dir'
> {
  /** Divider position (%) */
  position?: number;

  /** Divider position (px) */
  'position-in-pixels'?: number;

  /** Panel orientation */
  orientation?: 'horizontal' | 'vertical';

  /** Primary panel */
  primary?: 'start' | 'end';

  /** Disables resizing */
  disabled?: boolean;

  /** Snap points */
  snap?: string;

  /** Snap threshold (px) */
  'snap-threshold'?: number;

  /** Emitted when the divider's position changes. */
  onReposition?: (event: WaRepositionEvent) => void;
}

export interface SplitPanelRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const SplitPanel = forwardRef<SplitPanelRef, SplitPanelProps>(
  ({ children, className, onReposition, ...props }, ref) => {
    const splitpanelRef = useRef<HTMLElement & {}>(null);

    const setSplitpanelRef = useCallback((el: typeof splitpanelRef.current) => {
      splitpanelRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return splitpanelRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      const el = splitpanelRef.current;
      if (!el) return;

      const handleReposition = (e: Event) => {
        if (onReposition) onReposition(e as WaRepositionEvent);
      };

      el.addEventListener('wa-reposition', handleReposition);

      return () => {
        el.removeEventListener('wa-reposition', handleReposition);
      };
    }, [onReposition]);

    return (
      <wa-split-panel
        ref={setSplitpanelRef}
        class={clsx('SplitPanel', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-split-panel>
    );
  }
);

SplitPanel.displayName = 'SplitPanel';
