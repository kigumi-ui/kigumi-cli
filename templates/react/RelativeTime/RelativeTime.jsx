import React from 'react';
import clsx from 'clsx';
import './RelativeTime.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/relative-time/relative-time.js'));
}

export const RelativeTime = React.forwardRef(({ className, ...props }, ref) => {
  React.useEffect(() => {
    ensureLoaded();
  }, []);

  return (
    <wa-relative-time
      ref={ref}
      class={clsx('RelativeTime', className)}
      {...props}
    />
  );
});

RelativeTime.displayName = 'RelativeTime';
