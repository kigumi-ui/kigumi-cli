import {
  forwardRef,
  useRef,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/pie-chart/pie-chart.js';
import './PieChart.css';

/**
 * Divides a circle into wedges that represent each category's share of the whole
 *
 * @example
 * ```tsx
 * <PieChart label="Device usage">
 *   <script type="application/json">{JSON.stringify({
 *     data: {
 *       labels: ['Mobile', 'Desktop', 'Tablet'],
 *       datasets: [{ data: [55, 35, 10] }]
 *     }
 *   })}</script>
 * </PieChart>
 * ```
 */
export interface PieChartProps extends Omit<
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

export interface PieChartRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const PieChart = forwardRef<PieChartRef, PieChartProps>(
  ({ children, className, ...props }, ref) => {
    const pieChartRef = useRef<HTMLElement>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return pieChartRef.current;
        },
      }),
      []
    );

    return (
      <wa-pie-chart
        ref={pieChartRef}
        class={clsx('PieChart', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-pie-chart>
    );
  }
);

PieChart.displayName = 'PieChart';
