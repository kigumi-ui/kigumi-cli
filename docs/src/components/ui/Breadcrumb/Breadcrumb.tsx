import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/breadcrumb/breadcrumb.js';
import './Breadcrumb.css';

/**
 * Breadcrumbs provide a group of links so users can easily navigate a website hierarchy
 *
 * @example
 * ```tsx
 * import { Breadcrumb, BreadcrumbItem } from './components/ui';
 *
 * <Breadcrumb>
 *   <BreadcrumbItem>Home</BreadcrumbItem>
 *   <BreadcrumbItem>Category</BreadcrumbItem>
 *   <BreadcrumbItem>Product</BreadcrumbItem>
 * </Breadcrumb>
 *
 * // With links
 * <Breadcrumb>
 *   <BreadcrumbItem href="/">Home</BreadcrumbItem>
 *   <BreadcrumbItem href="/products">Products</BreadcrumbItem>
 *   <BreadcrumbItem>Current Page</BreadcrumbItem>
 * </Breadcrumb>
 *
 * // With custom separator
 * <Breadcrumb>
 *   <wa-icon slot="separator" name="angle-right" />
 *   <BreadcrumbItem>First</BreadcrumbItem>
 *   <BreadcrumbItem>Second</BreadcrumbItem>
 * </Breadcrumb>
 * ```
 */
export interface BreadcrumbProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** The label to use for the breadcrumb control for assistive devices */
  label?: string;
}

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <wa-breadcrumb
        ref={ref}
        class={clsx('Breadcrumb', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-breadcrumb>
    );
  }
);

Breadcrumb.displayName = 'Breadcrumb';
