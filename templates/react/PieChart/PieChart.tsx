import { forwardRef, useRef, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import './PieChart.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/pie-chart/pie-chart.js'));
}

/**
 * Divides a circle into wedges that represent each category's share of the whole
 *
 * @example
 * ```tsx
 * // Basic usage
 * <PieChart />
 *
 * // With event handlers
 * <PieChart />
 *
 * ```
 */
export interface PieChartProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {

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
    const piechartRef = useRef<HTMLElement & {
    }>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return piechartRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-pie-chart
        ref={piechartRef}
        class={clsx('PieChart', className)}
        suppressHydrationWarning
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-pie-chart>
    );
  }
);

PieChart.displayName = 'PieChart';
