import React from 'react';
import clsx from 'clsx';
import './Spinner.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/spinner/spinner.js'));
}

export const Spinner = React.forwardRef(({ className, ...props }, ref) => {
  React.useEffect(() => {
    ensureLoaded();
  }, []);

  return <wa-spinner ref={ref} class={clsx('Spinner', className)} {...props} />;
});

Spinner.displayName = 'Spinner';
