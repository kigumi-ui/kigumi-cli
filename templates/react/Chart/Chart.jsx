import React from 'react';
import clsx from 'clsx';
import './Chart.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/chart/chart.js'));
}

/**
 * Renders interactive data visualisations including bars, lines, pies, and more via Chart.js
 *
 * @example
 * ```jsx
 * // Basic bar chart with JSON config
 * <Chart type="bar" label="Sales">
 *   <script type="application/json">{JSON.stringify({
 *     data: {
 *       labels: ['Jan', 'Feb', 'Mar'],
 *       datasets: [{ label: 'Sales', data: [10, 20, 30] }]
 *     }
 *   })}</script>
 * </Chart>
 *
 * // Line chart with options
 * <Chart type="line" label="Revenue" stacked without-legend />
 * ```
 *
 * @typedef {Object} ChartProps
 * @property {string} [label] - Accessible name read by screen readers
 * @property {string} [description] - Supplementary accessible description for the chart
 * @property {string} [type] - Visualisation style: bar | line | pie | doughnut | polarArea | radar | scatter | bubble
 * @property {string} [x-label] - Text label shown along the horizontal axis
 * @property {string} [y-label] - Text label shown along the vertical axis
 * @property {string} [legend-position] - Where the legend appears: top | right | bottom | left | start | end
 * @property {boolean} [stacked] - Layers multiple datasets on a single axis
 * @property {string} [index-axis] - Primary category axis: x | y
 * @property {string} [grid] - Background grid lines: x | y | both | none
 * @property {number} [min] - Lower bound for the value axis scale
 * @property {number} [max] - Upper bound for the value axis scale
 * @property {boolean} [without-animation] - Turns off entrance and update transitions
 * @property {boolean} [without-legend] - Removes the dataset legend from view
 * @property {boolean} [without-tooltip] - Suppresses hover tooltips
 */

export const Chart = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    const chartRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        get element() {
          return chartRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-chart ref={chartRef} class={clsx('Chart', className)} {...props}>
        {children}
      </wa-chart>
    );
  }
);

Chart.displayName = 'Chart';
