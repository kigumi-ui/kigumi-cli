import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaBarChart from '@awesome.me/webawesome/dist/components/bar-chart/bar-chart.js';
import './BarChart.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/bar-chart/bar-chart.js'));
}

/**
 * Displays categorical data as horizontal or vertical rectangular bars scaled to their values
 *
 * @example
 * ```tsx
 * // Basic usage
 * <BarChart />
 *
 * // With event handlers
 * <BarChart />
 *
 * ```
 */
export interface BarChartProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** Accessible name announced by assistive technology */
  label?: string;

  /** Extended accessible description for the chart */
  description?: string;

  /** Controls whether bars grow upward or sideways */
  orientation?: 'vertical' | 'horizontal';

  /** Caption displayed beneath the horizontal axis */
  'x-label'?: string;

  /** Caption displayed beside the vertical axis */
  'y-label'?: string;

  /** Placement of the dataset legend relative to the chart */
  'legend-position'?: 'top' | 'right' | 'bottom' | 'left' | 'start' | 'end';

  /** Layers multiple datasets on a single axis */
  stacked?: boolean;

  /** Base axis for category labels (swap to flip chart orientation) */
  'index-axis'?: 'x' | 'y';

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

export interface BarChartRef {
  /** Reference to the underlying HTML element */
  element: WaBarChart | null;
}

export const BarChart = forwardRef<BarChartRef, BarChartProps>(
  ({ children, className, ...props }, ref) => {
    const barchartRef = useRef<WaBarChart | null>(null);
    const setBarChartRef = useCallback((el: WaBarChart | null) => {
      barchartRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return barchartRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-bar-chart
        ref={setBarChartRef}
        class={clsx('BarChart', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-bar-chart>
    );
  }
);

BarChart.displayName = 'BarChart';
