import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaSkeleton from '@awesome.me/webawesome/dist/components/skeleton/skeleton.js';
import './Skeleton.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/skeleton/skeleton.js'));
}

/**
 * Skeletons are used to provide a visual representation of where content will eventually load
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Skeleton />
 *
 * // With event handlers
 * <Skeleton />
 *
 * ```
 */
export interface SkeletonProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** Animation effect */
  effect?: 'pulse' | 'sheen' | 'none';
}

export interface SkeletonRef {
  /** Reference to the underlying HTML element */
  element: WaSkeleton | null;
}

export const Skeleton = forwardRef<SkeletonRef, SkeletonProps>(
  ({ children, className, ...props }, ref) => {
    const skeletonRef = useRef<WaSkeleton | null>(null);
    const setSkeletonRef = useCallback((el: WaSkeleton | null) => {
      skeletonRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return skeletonRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-skeleton
        ref={setSkeletonRef}
        class={clsx('Skeleton', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-skeleton>
    );
  }
);

Skeleton.displayName = 'Skeleton';
