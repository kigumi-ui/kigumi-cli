import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/tab-group/tab-group.js';
import './TabGroup.css';
import type { WaTabHideEvent } from '@awesome.me/webawesome-pro/dist/events/tab-hide.js';
import type { WaTabShowEvent } from '@awesome.me/webawesome-pro/dist/events/tab-show.js';

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
export interface TabGroupProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onTabShow' | 'onTabHide' | 'dir'
> {
  /** Tab position */
  placement?: 'top' | 'bottom' | 'start' | 'end';

  /** Panel activation method */
  activation?: 'auto' | 'manual';

  /** Disables scroll buttons */
  'without-scroll-controls'?: boolean;

  /** Active tab value (controlled) */
  active?: string;

  /** Emitted when a tab is shown. */
  onTabShow?: (event: WaTabShowEvent) => void;

  /** Emitted when a tab is hidden. */
  onTabHide?: (event: WaTabHideEvent) => void;
}

export interface TabGroupRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const TabGroup = forwardRef<TabGroupRef, TabGroupProps>(
  ({ children, className, onTabShow, onTabHide, ...props }, ref) => {
    const tabgroupRef = useRef<HTMLElement & {}>(null);

    const setTabgroupRef = useCallback((el: typeof tabgroupRef.current) => {
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
      const el = tabgroupRef.current;
      if (!el) return;

      const handleTabShow = (e: Event) => {
        if (onTabShow) onTabShow(e as WaTabShowEvent);
      };

      const handleTabHide = (e: Event) => {
        if (onTabHide) onTabHide(e as WaTabHideEvent);
      };

      el.addEventListener('wa-tab-show', handleTabShow);
      el.addEventListener('wa-tab-hide', handleTabHide);

      return () => {
        el.removeEventListener('wa-tab-show', handleTabShow);
        el.removeEventListener('wa-tab-hide', handleTabHide);
      };
    }, [onTabShow, onTabHide]);

    return (
      <wa-tab-group
        ref={setTabgroupRef}
        class={clsx('TabGroup', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-tab-group>
    );
  }
);

TabGroup.displayName = 'TabGroup';
