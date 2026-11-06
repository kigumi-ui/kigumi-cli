import React from 'react';
import clsx from 'clsx';
import './Scroller.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/scroller/scroller.js'));
}

/**
 * @typedef {Object} ScrollerProps
 * @property {string} [orientation] - Scroll direction: horizontal | vertical
 * @property {boolean} [with-scroll-indicator] - Deprecated: The scroll shadows show by default; set without-shadow to hide them. Removed in the next major.
 * @property {boolean} [without-scrollbar] - Hides the scrollbar
 * @property {boolean} [without-shadow] - Hides shadow indicators
 */

export const Scroller = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-scroller ref={ref} class={clsx('Scroller', className)} {...props}>
        {children}
      </wa-scroller>
    );
  }
);

Scroller.displayName = 'Scroller';
