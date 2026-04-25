import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaBreadcrumb from '@awesome.me/webawesome/dist/components/breadcrumb/breadcrumb.js';
import './Breadcrumb.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/breadcrumb/breadcrumb.js'));
}

/**
 * Breadcrumbs provide a group of links so users can easily navigate a website hierarchy
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Breadcrumb />
 *
 * // With event handlers
 * <Breadcrumb />
 *
 * ```
 */
export interface BreadcrumbProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {

  /** The label to use for the breadcrumb control for assistive devices */
  label?: string;
}

export interface BreadcrumbRef {
  /** Reference to the underlying HTML element */
  element: WaBreadcrumb | null;
}

export const Breadcrumb = forwardRef<BreadcrumbRef, BreadcrumbProps>(
  ({ children, className, ...props }, ref) => {
    const breadcrumbRef = useRef<WaBreadcrumb | null>(null);
    const setBreadcrumbRef = useCallback((el: WaBreadcrumb | null) => {
      breadcrumbRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return breadcrumbRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-breadcrumb
        ref={setBreadcrumbRef}
        class={clsx('Breadcrumb', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<string, unknown>)}
      >
        {children}
      </wa-breadcrumb>
    );
  }
);

Breadcrumb.displayName = 'Breadcrumb';
