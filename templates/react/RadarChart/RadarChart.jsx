import React from 'react';
import clsx from 'clsx';
import './RadarChart.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/radar-chart/radar-chart.js'));
}

/**
 * Maps multiple variables onto radial axes to compare profiles at a glance
 *
 * @example
 * ```jsx
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
 *
 * @typedef {Object} RadarChartProps
 * @property {string} [label] - Accessible name announced by assistive technology
 * @property {string} [description] - Extended accessible description for the chart
 * @property {string} [legend-position] - Placement of the legend: top | right | bottom | left | start | end
 * @property {boolean} [stacked] - Deprecated, no effect on a radar chart: remove it. Removed in the next major
 * @property {string} [grid] - Deprecated, no effect on a radar chart: set options.scales.r.grid.display in the JSON config. Removed in the next major
 * @property {number} [min] - Deprecated, no effect on a radar chart: set options.scales.r.min in the JSON config. Removed in the next major
 * @property {number} [max] - Deprecated, no effect on a radar chart: set options.scales.r.max in the JSON config. Removed in the next major
 * @property {boolean} [without-animation] - Disables entrance and update motion effects
 * @property {boolean} [without-legend] - Hides the dataset legend entirely
 * @property {boolean} [without-tooltip] - Prevents hover tooltips from appearing on data points
 */

export const RadarChart = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    const radarChartRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        get element() {
          return radarChartRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-radar-chart
        ref={radarChartRef}
        class={clsx('RadarChart', className)}
        {...props}
      >
        {children}
      </wa-radar-chart>
    );
  }
);

RadarChart.displayName = 'RadarChart';
