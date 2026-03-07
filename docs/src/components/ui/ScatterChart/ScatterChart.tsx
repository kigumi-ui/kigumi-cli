import {
  forwardRef,
  useRef,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/scatter-chart/scatter-chart.js';
import './ScatterChart.css';

/**
 * Positions individual data points by two numeric axes to expose correlations
 *
 * @example
 * ```tsx
 * <ScatterChart label="Height vs Weight">
 *   <script type="application/json">{JSON.stringify({
 *     data: {
 *       datasets: [{ label: 'Measurements', data: [{ x: 170, y: 65 }, { x: 180, y: 80 }, { x: 165, y: 55 }] }]
 *     }
 *   })}</script>
 * </ScatterChart>
 * ```
 */
export interface ScatterChartProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
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
  element: HTMLElement | null;
}

export const ScatterChart = forwardRef<ScatterChartRef, ScatterChartProps>(
  ({ children, className, ...props }, ref) => {
    const scatterChartRef = useRef<HTMLElement>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return scatterChartRef.current;
        },
      }),
      []
    );

    return (
      <wa-scatter-chart
        ref={scatterChartRef}
        class={clsx('ScatterChart', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-scatter-chart>
    );
  }
);

ScatterChart.displayName = 'ScatterChart';
