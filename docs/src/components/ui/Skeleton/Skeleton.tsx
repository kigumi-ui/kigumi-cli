import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/skeleton/skeleton.js';
import './Skeleton.css';

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
  element: HTMLElement | null;
}

export const Skeleton = forwardRef<SkeletonRef, SkeletonProps>(
  ({ children, className, ...props }, ref) => {
    const skeletonRef = useRef<HTMLElement & {}>(null);

    const setSkeletonRef = useCallback((el: typeof skeletonRef.current) => {
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

    return (
      <wa-skeleton
        ref={setSkeletonRef}
        class={clsx('Skeleton', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-skeleton>
    );
  }
);

Skeleton.displayName = 'Skeleton';
