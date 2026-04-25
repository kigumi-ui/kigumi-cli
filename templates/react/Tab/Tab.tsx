import { forwardRef, useRef, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import './Tab.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/tab/tab.js'));
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
  element: HTMLElement | null;
}

export const Tab = forwardRef<TabRef, TabProps>(
  ({ children, className, ...props }, ref) => {
    const tabRef = useRef<HTMLElement & {
    }>(null);

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
        ref={tabRef}
        class={clsx('Tab', className)}
        suppressHydrationWarning
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-tab>
    );
  }
);

Tab.displayName = 'Tab';
