import React from 'react';
import clsx from 'clsx';
import './Tab.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/tab/tab.js'));
}

export const Tab = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-tab ref={ref} class={clsx('Tab', className)} {...props}>
        {children}
      </wa-tab>
    );
  }
);

Tab.displayName = 'Tab';
