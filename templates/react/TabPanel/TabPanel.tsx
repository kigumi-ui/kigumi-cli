import { forwardRef, useRef, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import './TabPanel.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js'));
}

/**
 * Tab panels are used inside tab groups to display content for each tab
 *
 * @example
 * ```tsx
 * // Basic usage
 * <TabPanel />
 *
 * // With event handlers
 * <TabPanel />
 *
 * ```
 */
export interface TabPanelProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {

  /** The panel name */
  name?: string;

  /** Whether the panel is shown */
  active?: boolean;
}

export interface TabPanelRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const TabPanel = forwardRef<TabPanelRef, TabPanelProps>(
  ({ children, className, ...props }, ref) => {
    const tabpanelRef = useRef<HTMLElement & {
    }>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return tabpanelRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-tab-panel
        ref={tabpanelRef}
        class={clsx('TabPanel', className)}
        suppressHydrationWarning
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-tab-panel>
    );
  }
);

TabPanel.displayName = 'TabPanel';
