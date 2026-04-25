import React from 'react';
import clsx from 'clsx';
import './Sparkline.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/sparkline/sparkline.js'));
}

/**
 * Sparklines are small inline data visualizations for showing trends
 *
 * CSS Custom Properties:
 * - --fill-color: Fill color for the area below the line
 * - --line-color: Color of the sparkline
 * - --line-width: Width of the sparkline in pixels
 *
 * @example
 * ```jsx
 * // Basic usage
 * <Sparkline data="1 4 2 8 5 3 7" appearance="line" />
 *
 * // With trend indicator
 * <Sparkline data="1 4 2 8 5 3 7" appearance="area" trend="positive" />
 *
 * // With ref
 * const sparklineRef = React.useRef(null);
 * <Sparkline ref={sparklineRef} data="10 20 15 30" appearance="gradient" />
 * ```
 *
 * @typedef {Object} SparklineProps
 * @property {string} [data] - Space-separated numeric data points
 * @property {string} [label] - An accessible label for assistive devices
 * @property {string} [appearance] - Visual style: gradient | line | solid
 * @property {string} [trend] - Trend direction for coloring: positive | negative | neutral
 * @property {string} [curve] - Interpolation curve: linear | natural | step
 */

export const Sparkline = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    const sparklineRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        get element() {
          return sparklineRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-sparkline
        ref={sparklineRef}
        class={clsx('Sparkline', className)}
        {...props}
      >
        {children}
      </wa-sparkline>
    );
  }
);

Sparkline.displayName = 'Sparkline';
