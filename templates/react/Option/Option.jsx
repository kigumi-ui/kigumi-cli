import React from 'react';
import clsx from 'clsx';
import './Option.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/option/option.js'));
}

export const Option = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-option ref={ref} class={clsx('Option', className)} {...props}>
        {children}
      </wa-option>
    );
  }
);

Option.displayName = 'Option';
