import React from 'react';
import clsx from 'clsx';
import './Scroller.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/scroller/scroller.js'));
}

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
