import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaBreadcrumbItem from '@awesome.me/webawesome/dist/components/breadcrumb-item/breadcrumb-item.js';
import './BreadcrumbItem.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/breadcrumb-item/breadcrumb-item.js'));
}

/**
 * Breadcrumb Items are used inside breadcrumbs to represent different links
 *
 * @example
 * ```tsx
 * // Basic usage
 * <BreadcrumbItem />
 *
 * // With event handlers
 * <BreadcrumbItem />
 *
 * ```
 */
export interface BreadcrumbItemProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {

  /** Optional URL to direct the user to when activated */
  href?: string;

  /** Tells the browser where to open the link */
  target?: '_blank' | '_parent' | '_self' | '_top';

  /** The rel attribute to use on the link */
  rel?: string;
}

export interface BreadcrumbItemRef {
  /** Reference to the underlying HTML element */
  element: WaBreadcrumbItem | null;
}

export const BreadcrumbItem = forwardRef<BreadcrumbItemRef, BreadcrumbItemProps>(
  ({ children, className, ...props }, ref) => {
    const breadcrumbitemRef = useRef<WaBreadcrumbItem | null>(null);
    const setBreadcrumbItemRef = useCallback((el: WaBreadcrumbItem | null) => {
      breadcrumbitemRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return breadcrumbitemRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-breadcrumb-item
        ref={setBreadcrumbItemRef}
        class={clsx('BreadcrumbItem', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<string, unknown>)}
      >
        {children}
      </wa-breadcrumb-item>
    );
  }
);

BreadcrumbItem.displayName = 'BreadcrumbItem';
