import React from 'react';
import clsx from 'clsx';
import './FormatDate.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/format-date/format-date.js'));
}

export const FormatDate = React.forwardRef(({ className, ...props }, ref) => {
  React.useEffect(() => {
    ensureLoaded();
  }, []);

  return (
    <wa-format-date
      ref={ref}
      class={clsx('FormatDate', className)}
      {...props}
    />
  );
});

FormatDate.displayName = 'FormatDate';
