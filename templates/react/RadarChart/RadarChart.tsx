import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaRadarChart from '@awesome.me/webawesome/dist/components/radar-chart/radar-chart.js';
import './RadarChart.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/radar-chart/radar-chart.js'));
}

/**
 * Maps multiple variables onto radial axes to compare profiles at a glance
 *
 * @example
 * ```tsx
 * // Basic usage
 * <RadarChart />
 *
 * // With event handlers
 * <RadarChart />
 *
 * ```
 */
export interface RadarChartProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** Accessible name announced by assistive technology */
  label?: string;

  /** Extended accessible description for the chart */
  description?: string;

  /** Placement of the dataset legend relative to the chart */
  'legend-position'?: 'top' | 'right' | 'bottom' | 'left' | 'start' | 'end';

  /** Layers multiple datasets on a single axis */
  stacked?: boolean;

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

export interface RadarChartRef {
  /** Reference to the underlying HTML element */
  element: WaRadarChart | null;
}

export const RadarChart = forwardRef<RadarChartRef, RadarChartProps>(
  ({ children, className, ...props }, ref) => {
    const radarchartRef = useRef<WaRadarChart | null>(null);
    const setRadarChartRef = useCallback((el: WaRadarChart | null) => {
      radarchartRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return radarchartRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-radar-chart
        ref={setRadarChartRef}
        class={clsx('RadarChart', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-radar-chart>
    );
  }
);

RadarChart.displayName = 'RadarChart';
