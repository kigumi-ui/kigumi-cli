import React from 'react';
import clsx from 'clsx';
import './PolarAreaChart.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/polar-area-chart/polar-area-chart.js'));
}

/**
 * Arranges segments of equal angle but varying radius around a central point
 *
 * @example
 * ```jsx
 * <PolarAreaChart label="Skill levels">
 *   <script type="application/json">{JSON.stringify({
 *     data: {
 *       labels: ['Speed', 'Strength', 'Agility', 'Endurance'],
 *       datasets: [{ data: [80, 65, 90, 70] }]
 *     }
 *   })}</script>
 * </PolarAreaChart>
 * ```
 *
 * @typedef {Object} PolarAreaChartProps
 * @property {string} [label] - Accessible name announced by assistive technology
 * @property {string} [description] - Extended accessible description for the chart
 * @property {string} [legend-position] - Placement of the legend: top | right | bottom | left | start | end
 * @property {boolean} [without-animation] - Disables entrance and update motion effects
 * @property {boolean} [without-legend] - Hides the dataset legend entirely
 * @property {boolean} [without-tooltip] - Prevents hover tooltips from appearing on data points
 */

export const PolarAreaChart = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    const polarAreaChartRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        get element() {
          return polarAreaChartRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-polar-area-chart
        ref={polarAreaChartRef}
        class={clsx('PolarAreaChart', className)}
        {...props}
      >
        {children}
      </wa-polar-area-chart>
    );
  }
);

PolarAreaChart.displayName = 'PolarAreaChart';
