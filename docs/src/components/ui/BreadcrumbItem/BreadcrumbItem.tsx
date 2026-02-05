import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/breadcrumb-item/breadcrumb-item.js';
import './BreadcrumbItem.css';

/**
 * Breadcrumb Items are used inside breadcrumbs to represent different links
 *
 * @example
 * ```tsx
 * import { Breadcrumb, BreadcrumbItem } from './components/ui';
 *
 * // As buttons (default)
 * <Breadcrumb>
 *   <BreadcrumbItem>Home</BreadcrumbItem>
 *   <BreadcrumbItem>Products</BreadcrumbItem>
 * </Breadcrumb>
 *
 * // As links
 * <Breadcrumb>
 *   <BreadcrumbItem href="/">Home</BreadcrumbItem>
 *   <BreadcrumbItem href="/products">Products</BreadcrumbItem>
 *   <BreadcrumbItem>Current</BreadcrumbItem>
 * </Breadcrumb>
 *
 * // With icons
 * <Breadcrumb>
 *   <BreadcrumbItem>
 *     <wa-icon slot="start" name="house" />
 *     Home
 *   </BreadcrumbItem>
 *   <BreadcrumbItem>
 *     Products
 *     <wa-icon slot="end" name="box" />
 *   </BreadcrumbItem>
 * </Breadcrumb>
 * ```
 */
export interface BreadcrumbItemProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** Optional URL to direct the user to when activated */
  href?: string;
  /** Tells the browser where to open the link */
  target?: '_blank' | '_parent' | '_self' | '_top';
  /** The rel attribute to use on the link */
  rel?: string;
}

export const BreadcrumbItem = forwardRef<HTMLElement, BreadcrumbItemProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <wa-breadcrumb-item
        ref={ref}
        class={clsx('BreadcrumbItem', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-breadcrumb-item>
    );
  }
);

BreadcrumbItem.displayName = 'BreadcrumbItem';
