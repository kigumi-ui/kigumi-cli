import React from 'react';
import clsx from 'clsx';
import './FormatNumber.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/format-number/format-number.js'));
}

export const FormatNumber = React.forwardRef(({ className, ...props }, ref) => {
  React.useEffect(() => {
    ensureLoaded();
  }, []);

  return (
    <wa-format-number
      ref={ref}
      class={clsx('FormatNumber', className)}
      {...props}
    />
  );
});

FormatNumber.displayName = 'FormatNumber';
