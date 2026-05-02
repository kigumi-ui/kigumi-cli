import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaSparkline from '@awesome.me/webawesome/dist/components/sparkline/sparkline.js';
import './Sparkline.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/sparkline/sparkline.js'));
}

/**
 * Sparklines are small inline data visualizations for showing trends
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Sparkline />
 *
 * // With event handlers
 * <Sparkline />
 *
 * ```
 */
export interface SparklineProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** Space-separated numeric data points */
  data?: string;

  /** An accessible label for assistive devices */
  label?: string;

  /** Visual style of the sparkline */
  appearance?: 'gradient' | 'line' | 'solid';

  /** Trend direction, used for coloring */
  trend?: 'positive' | 'negative' | 'neutral';

  /** Interpolation curve style */
  curve?: 'linear' | 'natural' | 'step';
}

export interface SparklineRef {
  /** Reference to the underlying HTML element */
  element: WaSparkline | null;
}

export const Sparkline = forwardRef<SparklineRef, SparklineProps>(
  ({ children, className, ...props }, ref) => {
    const sparklineRef = useRef<WaSparkline | null>(null);
    const setSparklineRef = useCallback((el: WaSparkline | null) => {
      sparklineRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return sparklineRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-sparkline
        ref={setSparklineRef}
        class={clsx('Sparkline', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-sparkline>
    );
  }
);

Sparkline.displayName = 'Sparkline';
