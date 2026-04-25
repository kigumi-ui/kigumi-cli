import React from 'react';
import clsx from 'clsx';
import './Comparison.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/comparison/comparison.js'));
}

/**
 * Compare visual differences between similar content with a sliding panel
 *
 * @example
 * ```jsx
 * <Comparison position={50}>
 *   <img slot="before" src="before.jpg" alt="Before" />
 *   <img slot="after" src="after.jpg" alt="After" />
 * </Comparison>
 * ```
 */
export const Comparison = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-comparison ref={ref} class={clsx('Comparison', className)} {...props}>
        {children}
      </wa-comparison>
    );
  }
);

Comparison.displayName = 'Comparison';
