import React from 'react';
import clsx from 'clsx';
import './ProgressRing.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/progress-ring/progress-ring.js'));
}

export const ProgressRing = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-progress-ring
        ref={ref}
        class={clsx('ProgressRing', className)}
        {...props}
      >
        {children}
      </wa-progress-ring>
    );
  }
);

ProgressRing.displayName = 'ProgressRing';
