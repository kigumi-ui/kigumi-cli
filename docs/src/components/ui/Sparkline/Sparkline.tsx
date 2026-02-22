import {
  forwardRef,
  useRef,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/sparkline/sparkline.js';
import './Sparkline.css';

/**
 * Sparklines are small inline data visualizations for showing trends
 *
 * @cssvar --fill-color - Fill color for the area below the line
 * @cssvar --line-color - Color of the sparkline
 * @cssvar --line-width - Width of the sparkline in pixels
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Sparkline data="1 4 2 8 5 3 7" appearance="line" />
 *
 * // With trend indicator
 * <Sparkline data="1 4 2 8 5 3 7" appearance="area" trend="positive" />
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
  element: HTMLElement | null;
}

export const Sparkline = forwardRef<SparklineRef, SparklineProps>(
  ({ children, className, ...props }, ref) => {
    const sparklineRef = useRef<HTMLElement & {}>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return sparklineRef.current;
        },
      }),
      []
    );

    return (
      <wa-sparkline
        ref={sparklineRef}
        class={clsx('Sparkline', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-sparkline>
    );
  }
);

Sparkline.displayName = 'Sparkline';
