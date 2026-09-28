import React from 'react';
import clsx from 'clsx';
import './Step.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/step/step.js'));
}

/**
 * Steps are the individual stages of a stepper, each with a label and a status
 *
 * @example
 * ```jsx
 * <Step name="payment" variant="warning" attention="pulse">
 *   Payment
 *   <span slot="description">Card declined, try again</span>
 * </Step>
 * ```
 */
export const Step = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    const stepRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        get element() {
          return stepRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-step ref={stepRef} class={clsx('Step', className)} {...props}>
        {children}
      </wa-step>
    );
  }
);

Step.displayName = 'Step';
