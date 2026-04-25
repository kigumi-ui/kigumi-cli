import React from 'react';
import clsx from 'clsx';
import './BreadcrumbItem.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/breadcrumb-item/breadcrumb-item.js'));
}

/**
 * Breadcrumb Items are used inside breadcrumbs to represent different links
 *
 * @example
 * ```jsx
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
 *
 * @typedef {Object} BreadcrumbItemProps
 * @property {string} [href] - Optional URL to direct the user to
 * @property {string} [target] - Where to open the link
 * @property {string} [rel] - The rel attribute to use on the link
 */

export const BreadcrumbItem = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-breadcrumb-item
        ref={ref}
        class={clsx('BreadcrumbItem', className)}
        {...props}
      >
        {children}
      </wa-breadcrumb-item>
    );
  }
);

BreadcrumbItem.displayName = 'BreadcrumbItem';
