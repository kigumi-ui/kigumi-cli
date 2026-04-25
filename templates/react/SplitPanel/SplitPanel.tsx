import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaSplitPanel from '@awesome.me/webawesome/dist/components/split-panel/split-panel.js';
import './SplitPanel.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/split-panel/split-panel.js'));
}

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
export interface SplitPanelProps extends Omit<HTMLAttributes<HTMLElement>, 'onReposition' | 'dir'> {

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
  onReposition?: (event: CustomEvent) => void;
}

export interface SplitPanelRef {
  /** Reference to the underlying HTML element */
  element: WaSplitPanel | null;
}

export const SplitPanel = forwardRef<SplitPanelRef, SplitPanelProps>(
  ({ children, className, onReposition, ...props }, ref) => {
    const splitpanelRef = useRef<WaSplitPanel | null>(null);
    const setSplitPanelRef = useCallback((el: WaSplitPanel | null) => {
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
      ensureLoaded();
      const el = splitpanelRef.current;
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
      <wa-split-panel
        ref={setSplitPanelRef}
        class={clsx('SplitPanel', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<string, unknown>)}
      >
        {children}
      </wa-split-panel>
    );
  }
);

SplitPanel.displayName = 'SplitPanel';
