import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaScatterChart from '@awesome.me/webawesome/dist/components/scatter-chart/scatter-chart.js';
import './ScatterChart.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/scatter-chart/scatter-chart.js'));
}

/**
 * Positions individual data points by two numeric axes to expose correlations
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ScatterChart />
 *
 * // With event handlers
 * <ScatterChart />
 *
 * ```
 */
export interface ScatterChartProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {

  /** Accessible name announced by assistive technology */
  label?: string;

  /** Extended accessible description for the chart */
  description?: string;

  /** Caption displayed beneath the horizontal axis */
  'x-label'?: string;

  /** Caption displayed beside the vertical axis */
  'y-label'?: string;

  /** Placement of the dataset legend relative to the chart */
  'legend-position'?: 'top' | 'right' | 'bottom' | 'left' | 'start' | 'end';

  /** Selects which background grid lines are drawn */
  grid?: 'x' | 'y' | 'both' | 'none';

  /** Floor value for the value axis scale */
  min?: number;

  /** Ceiling value for the value axis scale */
  max?: number;

  /** Disables entrance and update motion effects */
  'without-animation'?: boolean;

  /** Hides the dataset legend entirely */
  'without-legend'?: boolean;

  /** Prevents hover tooltips from appearing on data points */
  'without-tooltip'?: boolean;
}

export interface ScatterChartRef {
  /** Reference to the underlying HTML element */
  element: WaScatterChart | null;
}

export const ScatterChart = forwardRef<ScatterChartRef, ScatterChartProps>(
  ({ children, className, ...props }, ref) => {
    const scatterchartRef = useRef<WaScatterChart | null>(null);
    const setScatterChartRef = useCallback((el: WaScatterChart | null) => {
      scatterchartRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return scatterchartRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-scatter-chart
        ref={setScatterChartRef}
        class={clsx('ScatterChart', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<string, unknown>)}
      >
        {children}
      </wa-scatter-chart>
    );
  }
);

ScatterChart.displayName = 'ScatterChart';
