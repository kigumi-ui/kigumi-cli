import { forwardRef, useRef, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import './PolarAreaChart.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/polar-area-chart/polar-area-chart.js'));
}

/**
 * Arranges segments of equal angle but varying radius around a central point
 *
 * @example
 * ```tsx
 * // Basic usage
 * <PolarAreaChart />
 *
 * // With event handlers
 * <PolarAreaChart />
 *
 * ```
 */
export interface PolarAreaChartProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {

  /** Accessible name announced by assistive technology */
  label?: string;

  /** Extended accessible description for the chart */
  description?: string;

  /** Placement of the dataset legend relative to the chart */
  'legend-position'?: 'top' | 'right' | 'bottom' | 'left' | 'start' | 'end';

  /** Disables entrance and update motion effects */
  'without-animation'?: boolean;

  /** Hides the dataset legend entirely */
  'without-legend'?: boolean;

  /** Prevents hover tooltips from appearing on data points */
  'without-tooltip'?: boolean;
}

export interface PolarAreaChartRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const PolarAreaChart = forwardRef<PolarAreaChartRef, PolarAreaChartProps>(
  ({ children, className, ...props }, ref) => {
    const polarareachartRef = useRef<HTMLElement & {
    }>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return polarareachartRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-polar-area-chart
        ref={polarareachartRef}
        class={clsx('PolarAreaChart', className)}
        suppressHydrationWarning
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-polar-area-chart>
    );
  }
);

PolarAreaChart.displayName = 'PolarAreaChart';
