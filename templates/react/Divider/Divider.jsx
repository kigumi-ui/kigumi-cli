import React from 'react';
import clsx from 'clsx';
import './Divider.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/divider/divider.js'));
}

/**
 * @typedef {Object} DividerProps
 * @property {'horizontal' | 'vertical'} [orientation] - Sets the divider's orientation
 */

export const Divider = React.forwardRef(
  ({ className, orientation, ...props }, ref) => {
    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-divider
        ref={ref}
        class={clsx('Divider', className)}
        orientation={orientation}
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';
