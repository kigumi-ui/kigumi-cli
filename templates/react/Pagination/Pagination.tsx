import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaPagination from '@awesome.me/webawesome/dist/components/pagination/pagination.js';
import './Pagination.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/pagination/pagination.js'));
}

/**
 * Pagination splits long lists of content into pages, letting users navigate between them
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Pagination />
 *
 * // With event handlers
 * <Pagination
 *   onBeforePageChange={(e) => console.log(e)} />
 *
 * ```
 */
export interface PaginationProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onBeforePageChange' | 'onPageChange' | 'dir'
> {
  /** The total number of items to paginate */
  total?: number;

  /** The number of items shown per page */
  'page-size'?: number;

  /** The current page, starting at 1 */
  page?: number;

  /** The number of pages to show on each side of the current page */
  'sibling-count'?: number;

  /** The number of pages to always show at the start and end */
  'boundary-count'?: number;

  /** Hides the previous and next buttons */
  'without-nav'?: boolean;

  /** Shows buttons that jump to the first and last pages */
  'with-edges'?: boolean;

  /** Shows a summary of the items on the current page */
  'with-summary'?: boolean;

  /** The pagination layout */
  format?: 'standard' | 'compact';

  /** URL template with {page} placeholder to render page items as links */
  'href-template'?: string;

  /** Renders nothing when there is only one page */
  'hide-single-page'?: boolean;

  /** Accessible name announced by screen readers */
  label?: string;

  /** Visual appearance */
  appearance?: 'outlined' | 'filled' | 'plain';

  /** Disables the pagination */
  disabled?: boolean;

  /** Emitted when the page is about to change but before it does. Canceling this event with `event.preventDefault()` prevents the page from changing. */
  onBeforePageChange?: (event: CustomEvent) => void;

  /** Emitted after the page changes. */
  onPageChange?: (event: CustomEvent) => void;
}

export interface PaginationRef {
  /** Reference to the underlying HTML element */
  element: WaPagination | null;
}

export const Pagination = forwardRef<PaginationRef, PaginationProps>(
  (
    { children, className, onBeforePageChange, onPageChange, ...props },
    ref
  ) => {
    const paginationRef = useRef<WaPagination | null>(null);
    const setPaginationRef = useCallback((el: WaPagination | null) => {
      paginationRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return paginationRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = paginationRef.current;
      if (!el) return;

      const handleWaBeforePageChange = (e: Event) => {
        if (onBeforePageChange) onBeforePageChange(e as CustomEvent);
      };

      const handleWaPageChange = (e: Event) => {
        if (onPageChange) onPageChange(e as CustomEvent);
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
        ref={setPaginationRef}
        class={clsx('Pagination', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-pagination>
    );
  }
);

Pagination.displayName = 'Pagination';
