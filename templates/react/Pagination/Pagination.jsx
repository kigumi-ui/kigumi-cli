import React from 'react';
import clsx from 'clsx';
import './Pagination.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/pagination/pagination.js'));
}

/**
 * Pagination splits long lists of content into pages, letting users navigate between them
 *
 * @example
 * ```jsx
 * <Pagination total={237} page-size={10} page={3} label="Search results" />
 * <Pagination total={237} format="compact" with-summary />
 * ```
 */
export const Pagination = React.forwardRef(
  (
    { children, className, onBeforePageChange, onPageChange, ...props },
    ref
  ) => {
    const paginationRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        get element() {
          return paginationRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
      const el = paginationRef.current;
      if (!el) return;

      const handleWaBeforePageChange = (e) => {
        if (onBeforePageChange) onBeforePageChange(e);
      };

      const handleWaPageChange = (e) => {
        if (onPageChange) onPageChange(e);
      };

      el.addEventListener('wa-before-page-change', handleWaBeforePageChange);
      el.addEventListener('wa-page-change', handleWaPageChange);

      return () => {
        el.removeEventListener(
          'wa-before-page-change',
          handleWaBeforePageChange
        );
        el.removeEventListener('wa-page-change', handleWaPageChange);
      };
    }, [onBeforePageChange, onPageChange]);

    return (
      <wa-pagination
        ref={paginationRef}
        class={clsx('Pagination', className)}
        {...props}
      >
        {children}
      </wa-pagination>
    );
  }
);

Pagination.displayName = 'Pagination';
