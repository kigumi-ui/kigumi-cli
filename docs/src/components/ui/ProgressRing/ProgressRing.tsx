import {
  forwardRef,
  useRef,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/progress-ring/progress-ring.js';
import './ProgressRing.css';

/**
 * Progress rings are used to show the completion of a task in a circular format
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ProgressRing />
 *
 * // With event handlers
 * <ProgressRing />
 *
 * ```
 */
export interface ProgressRingProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** Current progress (0-100) */
  value?: number;

  /** Accessible label */
  label?: string;
}

export interface ProgressRingRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const ProgressRing = forwardRef<ProgressRingRef, ProgressRingProps>(
  ({ children, className, ...props }, ref) => {
    const progressringRef = useRef<HTMLElement & {}>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return progressringRef.current;
        },
      }),
      []
    );

    return (
      <wa-progress-ring
        ref={progressringRef}
        class={clsx('ProgressRing', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-progress-ring>
    );
  }
);

ProgressRing.displayName = 'ProgressRing';
