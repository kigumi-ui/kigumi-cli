import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaDivider from '@awesome.me/webawesome/dist/components/divider/divider.js';
import './Divider.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/divider/divider.js'));
}

/**
 * Dividers are used to visually separate content
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Divider />
 *
 * // With event handlers
 * <Divider />
 *
 * ```
 */
export interface DividerProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {

  /** Divider orientation */
  orientation?: 'horizontal' | 'vertical';
}

export interface DividerRef {
  /** Reference to the underlying HTML element */
  element: WaDivider | null;
}

export const Divider = forwardRef<DividerRef, DividerProps>(
  ({ children, className, ...props }, ref) => {
    const dividerRef = useRef<WaDivider | null>(null);
    const setDividerRef = useCallback((el: WaDivider | null) => {
      dividerRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return dividerRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-divider
        ref={setDividerRef}
        class={clsx('Divider', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<string, unknown>)}
      >
        {children}
      </wa-divider>
    );
  }
);

Divider.displayName = 'Divider';
