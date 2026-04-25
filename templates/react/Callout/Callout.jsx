import React from 'react';
import clsx from 'clsx';
import './Callout.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/callout/callout.js'));
}

/**
 * @typedef {Object} CalloutProps
 * @property {'accent' | 'filled' | 'outlined' | 'plain' | 'filled-outlined'} [appearance] - The callout's visual appearance
 * @property {'small' | 'medium' | 'large'} [size] - The callout's size
 * @property {'brand' | 'neutral' | 'success' | 'warning' | 'danger'} [variant] - The callout's theme variant
 * @property {React.ReactNode} [children] - The callout's content
 * @property {string} [className] - Additional CSS classes
 */

export const Callout = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-callout ref={ref} class={clsx('Callout', className)} {...props}>
        {children}
      </wa-callout>
    );
  }
);

Callout.displayName = 'Callout';
