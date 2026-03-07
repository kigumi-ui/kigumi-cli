import {
  forwardRef,
  useRef,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/doughnut-chart/doughnut-chart.js';
import './DoughnutChart.css';

/**
 * Shows proportional segments in a ring shape with an open center for summary content
 *
 * @example
 * ```tsx
 * <DoughnutChart label="Budget breakdown">
 *   <script type="application/json">{JSON.stringify({
 *     data: {
 *       labels: ['Rent', 'Food', 'Transport', 'Savings'],
 *       datasets: [{ data: [35, 25, 20, 20] }]
 *     }
 *   })}</script>
 * </DoughnutChart>
 * ```
 */
export interface DoughnutChartProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
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

export interface DoughnutChartRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const DoughnutChart = forwardRef<DoughnutChartRef, DoughnutChartProps>(
  ({ children, className, ...props }, ref) => {
    const doughnutChartRef = useRef<HTMLElement>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return doughnutChartRef.current;
        },
      }),
      []
    );

    return (
      <wa-doughnut-chart
        ref={doughnutChartRef}
        class={clsx('DoughnutChart', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-doughnut-chart>
    );
  }
);

DoughnutChart.displayName = 'DoughnutChart';
