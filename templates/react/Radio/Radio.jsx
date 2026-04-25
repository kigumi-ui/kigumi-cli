import React from 'react';
import clsx from 'clsx';
import './Radio.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/radio/radio.js'));
}

export const Radio = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-radio ref={ref} class={clsx('Radio', className)} {...props}>
        {children}
      </wa-radio>
    );
  }
);

Radio.displayName = 'Radio';
