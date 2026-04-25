import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaTabGroup from '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';
import './TabGroup.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/tab-group/tab-group.js'));
}

/**
 * Tab groups organize content into a container that shows one section at a time
 *
 * @example
 * ```tsx
 * // Basic usage
 * <TabGroup />
 *
 * // With event handlers
 * <TabGroup
 *   onTabShow={(e) => console.log(e)} />
 *
 * ```
 */
export interface TabGroupProps extends Omit<HTMLAttributes<HTMLElement>, 'onTabShow' | 'onTabHide' | 'dir'> {

  /** Tab position */
  placement?: 'top' | 'bottom' | 'start' | 'end';

  /** Panel activation method */
  activation?: 'auto' | 'manual';

  /** Disables scroll buttons */
  'without-scroll-controls'?: boolean;

  /** The name of the active tab */
  active?: string;

  /** Emitted when a tab is shown. */
  onTabShow?: (event: CustomEvent) => void;

  /** Emitted when a tab is hidden. */
  onTabHide?: (event: CustomEvent) => void;
}

export interface TabGroupRef {
  /** Reference to the underlying HTML element */
  element: WaTabGroup | null;
}

export const TabGroup = forwardRef<TabGroupRef, TabGroupProps>(
  ({ children, className, onTabShow, onTabHide, ...props }, ref) => {
    const tabgroupRef = useRef<WaTabGroup | null>(null);
    const setTabGroupRef = useCallback((el: WaTabGroup | null) => {
      tabgroupRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return tabgroupRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = tabgroupRef.current;
      if (!el) return;

      const handleWaTabShow = (e: Event) => {
        if (onTabShow) onTabShow(e as CustomEvent);
      };

      const handleWaTabHide = (e: Event) => {
        if (onTabHide) onTabHide(e as CustomEvent);
      };

      el.addEventListener('wa-tab-show', handleWaTabShow);
      el.addEventListener('wa-tab-hide', handleWaTabHide);

      return () => {
        el.removeEventListener('wa-tab-show', handleWaTabShow);
        el.removeEventListener('wa-tab-hide', handleWaTabHide);
      };
    }, [onTabShow, onTabHide]);

    return (
      <wa-tab-group
        ref={setTabGroupRef}
        class={clsx('TabGroup', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<string, unknown>)}
      >
        {children}
      </wa-tab-group>
    );
  }
);

TabGroup.displayName = 'TabGroup';
