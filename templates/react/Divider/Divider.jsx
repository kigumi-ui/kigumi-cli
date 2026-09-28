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
 * @property {'start' | 'center' | 'end'} [label-placement] - Position of the slotted label along the line
 * @property {React.ReactNode} [children] - Optional label shown on the divider
 */

export const Divider = React.forwardRef(
  ({ children, className, orientation, ...props }, ref) => {
    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-divider
        ref={ref}
        class={clsx('Divider', className)}
        orientation={orientation}
        {...props}
      >
        {children}
      </wa-divider>
    );
  }
);

Divider.displayName = 'Divider';
