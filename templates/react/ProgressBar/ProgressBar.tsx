import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaProgressBar from '@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js';
import './ProgressBar.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js'));
}

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
  element: WaProgressBar | null;
}

export const ProgressBar = forwardRef<ProgressBarRef, ProgressBarProps>(
  ({ children, className, ...props }, ref) => {
    const progressbarRef = useRef<WaProgressBar | null>(null);
    const setProgressBarRef = useCallback((el: WaProgressBar | null) => {
      progressbarRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return progressbarRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-progress-bar
        ref={setProgressBarRef}
        class={clsx('ProgressBar', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-progress-bar>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';
