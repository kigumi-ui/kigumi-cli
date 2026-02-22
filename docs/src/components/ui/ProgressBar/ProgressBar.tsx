import {
  forwardRef,
  useRef,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/progress-bar/progress-bar.js';
import './ProgressBar.css';

/**
 * Progress bars are used to show the completion of a task or operation
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ProgressBar />
 *
 * // With event handlers
 * <ProgressBar />
 *
 * ```
 */
export interface ProgressBarProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** Current progress (0-100) */
  value?: number;

  /** Shows indeterminate state */
  indeterminate?: boolean;

  /** Accessible label */
  label?: string;
}

export interface ProgressBarRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const ProgressBar = forwardRef<ProgressBarRef, ProgressBarProps>(
  ({ children, className, ...props }, ref) => {
    const progressbarRef = useRef<HTMLElement & {}>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return progressbarRef.current;
        },
      }),
      []
    );

    return (
      <wa-progress-bar
        ref={progressbarRef}
        class={clsx('ProgressBar', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-progress-bar>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';
