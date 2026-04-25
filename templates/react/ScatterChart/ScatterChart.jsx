import React from 'react';
import clsx from 'clsx';
import './ScatterChart.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/scatter-chart/scatter-chart.js'));
}

/**
 * Positions individual data points by two numeric axes to expose correlations
 *
 * @example
 * ```jsx
 * <ScatterChart label="Height vs Weight">
 *   <script type="application/json">{JSON.stringify({
 *     data: {
 *       datasets: [{ label: 'Measurements', data: [{ x: 170, y: 65 }, { x: 180, y: 80 }, { x: 165, y: 55 }] }]
 *     }
 *   })}</script>
 * </ScatterChart>
 * ```
 *
 * @typedef {Object} ScatterChartProps
 * @property {string} [label] - Accessible name announced by assistive technology
 * @property {string} [description] - Extended accessible description for the chart
 * @property {string} [x-label] - Caption displayed beneath the horizontal axis
 * @property {string} [y-label] - Caption displayed beside the vertical axis
 * @property {string} [legend-position] - Placement of the legend: top | right | bottom | left | start | end
 * @property {string} [grid] - Background grid lines: x | y | both | none
 * @property {number} [min] - Floor value for the value axis scale
 * @property {number} [max] - Ceiling value for the value axis scale
 * @property {boolean} [without-animation] - Disables entrance and update motion effects
 * @property {boolean} [without-legend] - Hides the dataset legend entirely
 * @property {boolean} [without-tooltip] - Prevents hover tooltips from appearing on data points
 */

export const ScatterChart = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    const scatterChartRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        get element() {
          return scatterChartRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-scatter-chart
        ref={scatterChartRef}
        class={clsx('ScatterChart', className)}
        {...props}
      >
        {children}
      </wa-scatter-chart>
    );
  }
);

ScatterChart.displayName = 'ScatterChart';
