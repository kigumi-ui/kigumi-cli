import React from 'react';
import clsx from 'clsx';
import './PieChart.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/pie-chart/pie-chart.js'));
}

/**
 * Divides a circle into wedges that represent each category's share of the whole
 *
 * @example
 * ```jsx
 * <PieChart label="Device usage">
 *   <script type="application/json">{JSON.stringify({
 *     data: {
 *       labels: ['Mobile', 'Desktop', 'Tablet'],
 *       datasets: [{ data: [55, 35, 10] }]
 *     }
 *   })}</script>
 * </PieChart>
 * ```
 *
 * @typedef {Object} PieChartProps
 * @property {string} [label] - Accessible name announced by assistive technology
 * @property {string} [description] - Extended accessible description for the chart
 * @property {string} [legend-position] - Placement of the legend: top | right | bottom | left | start | end
 * @property {boolean} [without-animation] - Disables entrance and update motion effects
 * @property {boolean} [without-legend] - Hides the dataset legend entirely
 * @property {boolean} [without-tooltip] - Prevents hover tooltips from appearing on data points
 */

export const PieChart = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    const pieChartRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        get element() {
          return pieChartRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-pie-chart
        ref={pieChartRef}
        class={clsx('PieChart', className)}
        {...props}
      >
        {children}
      </wa-pie-chart>
    );
  }
);

PieChart.displayName = 'PieChart';
