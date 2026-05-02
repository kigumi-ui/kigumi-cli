import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaTab from '@awesome.me/webawesome/dist/components/tab/tab.js';
import './Tab.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/tab/tab.js'));
}

/**
 * Tabs are used inside tab groups to represent selectable tabs
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Tab />
 *
 * // With event handlers
 * <Tab />
 *
 * ```
 */
export interface TabProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {
  /** Associated panel name */
  panel?: string;

  /** Disables the tab */
  disabled?: boolean;
}

export interface TabRef {
  /** Reference to the underlying HTML element */
  element: WaTab | null;
}

export const Tab = forwardRef<TabRef, TabProps>(
  ({ children, className, ...props }, ref) => {
    const tabRef = useRef<WaTab | null>(null);
    const setTabRef = useCallback((el: WaTab | null) => {
      tabRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return tabRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-tab
        ref={setTabRef}
        class={clsx('Tab', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-tab>
    );
  }
);

Tab.displayName = 'Tab';
