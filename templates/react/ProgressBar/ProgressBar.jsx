import React from 'react';
import clsx from 'clsx';
import './ProgressBar.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js'));
}

export const ProgressBar = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-progress-bar
        ref={ref}
        class={clsx('ProgressBar', className)}
        {...props}
      >
        {children}
      </wa-progress-bar>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';
