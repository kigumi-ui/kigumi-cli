import React from 'react';
import clsx from 'clsx';
import './DoughnutChart.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/doughnut-chart/doughnut-chart.js'));
}

/**
 * Shows proportional segments in a ring shape with an open center for summary content
 *
 * @example
 * ```jsx
 * <DoughnutChart label="Budget breakdown">
 *   <script type="application/json">{JSON.stringify({
 *     data: {
 *       labels: ['Rent', 'Food', 'Transport', 'Savings'],
 *       datasets: [{ data: [35, 25, 20, 20] }]
 *     }
 *   })}</script>
 * </DoughnutChart>
 * ```
 *
 * @typedef {Object} DoughnutChartProps
 * @property {string} [label] - Accessible name announced by assistive technology
 * @property {string} [description] - Extended accessible description for the chart
 * @property {string} [legend-position] - Placement of the legend: top | right | bottom | left | start | end
 * @property {boolean} [without-animation] - Disables entrance and update motion effects
 * @property {boolean} [without-legend] - Hides the dataset legend entirely
 * @property {boolean} [without-tooltip] - Prevents hover tooltips from appearing on data points
 */

export const DoughnutChart = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    const doughnutChartRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        get element() {
          return doughnutChartRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-doughnut-chart
        ref={doughnutChartRef}
        class={clsx('DoughnutChart', className)}
        {...props}
      >
        {children}
      </wa-doughnut-chart>
    );
  }
);

DoughnutChart.displayName = 'DoughnutChart';
