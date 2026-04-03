import {
  forwardRef,
  useRef,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/tab/tab.js';
import type WaElement from '@awesome.me/webawesome-pro/dist/components/tab/tab.js';
import './Tab.css';

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
  /** Reference to the underlying element */
  element: WaElement | null;
}

export const Tab = forwardRef<TabRef, TabProps>(
  ({ children, className, ...props }, ref) => {
    const tabRef = useRef<WaElement | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return tabRef.current;
        },
      }),
      []
    );

    return (
      <wa-tab
        ref={(el: WaElement | null) => {
          tabRef.current = el;
        }}
        class={clsx('Tab', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-tab>
    );
  }
);

Tab.displayName = 'Tab';
