import { forwardRef, useRef, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/split-panel/split-panel.js';
import './SplitPanel.css';

export interface SplitPanelProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** Sets the split panel's orientation */
  orientation?: 'horizontal' | 'vertical';
  /** The current position of the divider (0-100) */
  position?: number;
  /** Disables resizing */
  disabled?: boolean;
  /** Designates a panel to maintain its size */
  primary?: 'start' | 'end';
  /** Space-separated snap points */
  snap?: string;
  /** Distance before snapping occurs */
  'snap-threshold'?: number;
  /** Event fired when the divider's position changes */
  onReposition?: (event: CustomEvent) => void;
}

export const SplitPanel = forwardRef<HTMLElement, SplitPanelProps>(
  ({ children, className, onReposition, ...props }, ref) => {
    const panelRef = useRef<HTMLElement>(null);

    useEffect(() => {
      const el = panelRef.current;
      if (!el) return;

      const handleReposition = (e: Event) => onReposition?.(e as CustomEvent);
      el.addEventListener('wa-reposition', handleReposition);

      return () => {
        el.removeEventListener('wa-reposition', handleReposition);
      };
    }, [onReposition]);

    return (
      <wa-split-panel
        ref={(node: HTMLElement | null) => {
          (panelRef as React.MutableRefObject<HTMLElement | null>).current =
            node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        class={clsx('SplitPanel', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-split-panel>
    );
  }
);

SplitPanel.displayName = 'SplitPanel';
