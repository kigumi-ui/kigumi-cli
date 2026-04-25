import React from 'react';
import clsx from 'clsx';
import './TabPanel.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js'));
}

export const TabPanel = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-tab-panel ref={ref} class={clsx('TabPanel', className)} {...props}>
        {children}
      </wa-tab-panel>
    );
  }
);

TabPanel.displayName = 'TabPanel';
