import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/radar-chart/radar-chart.js';
import './RadarChart.css';

/**
 * Maps multiple variables onto radial axes to compare profiles at a glance
 *
 * @example
 * ```tsx
 * <RadarChart label="Player comparison">
 *   <script type="application/json">{JSON.stringify({
 *     data: {
 *       labels: ['Pace', 'Shooting', 'Passing', 'Defense', 'Physical'],
 *       datasets: [
 *         { label: 'Player A', data: [85, 70, 80, 60, 75] },
 *         { label: 'Player B', data: [70, 85, 75, 80, 65] }
 *       ]
 *     }
 *   })}</script>
 * </RadarChart>
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

  /**
   * Has no effect on a radar chart
   *
   * @deprecated Radar charts cannot stack datasets, so remove this prop. Removed in the next major.
   */
  stacked?: boolean;

  /**
   * Has no effect on a radar chart
   *
   * @deprecated Hide the radial grid by setting options.scales.r.grid.display to false in the chart JSON config (the application/json script inside the chart). Removed in the next major.
   */
  grid?: 'x' | 'y' | 'both' | 'none';

  /**
   * Has no effect on a radar chart
   *
   * @deprecated Set options.scales.r.min in the chart JSON config (the application/json script inside the chart) instead. Removed in the next major.
   */
  min?: number;

  /**
   * Has no effect on a radar chart
   *
   * @deprecated Set options.scales.r.max in the chart JSON config (the application/json script inside the chart) instead. Removed in the next major.
   */
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
  element: HTMLElement | null;
}

export const RadarChart = forwardRef<RadarChartRef, RadarChartProps>(
  ({ children, className, ...props }, ref) => {
    const radarChartRef = useRef<HTMLElement>(null);

    const setRadarChartRef = useCallback((el: typeof radarChartRef.current) => {
      radarChartRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return radarChartRef.current;
        },
      }),
      []
    );

    return (
      <wa-radar-chart
        ref={setRadarChartRef}
        class={clsx('RadarChart', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-radar-chart>
    );
  }
);

RadarChart.displayName = 'RadarChart';
