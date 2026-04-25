import React from 'react';
import clsx from 'clsx';
import './Skeleton.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/skeleton/skeleton.js'));
}

export const Skeleton = React.forwardRef(({ className, ...props }, ref) => {
  React.useEffect(() => {
    ensureLoaded();
  }, []);

  return (
    <wa-skeleton ref={ref} class={clsx('Skeleton', className)} {...props} />
  );
});

Skeleton.displayName = 'Skeleton';
