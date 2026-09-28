import React from 'react';
import clsx from 'clsx';
import './Stepper.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/stepper/stepper.js'));
}

/**
 * Steppers walk users through a multi-stage process and show where they are in it
 *
 * @example
 * ```jsx
 * <Stepper active="shipping" label="Checkout" linear>
 *   <Step name="cart" completed>Cart</Step>
 *   <Step name="shipping">Shipping</Step>
 *   <Step name="payment">Payment</Step>
 * </Stepper>
 * ```
 */
export const Stepper = React.forwardRef(
  (
    { children, className, onBeforeStepChange, onStepChange, ...props },
    ref
  ) => {
    const stepperRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        goTo: (name) => stepperRef.current?.goTo?.(name),
        next: () => stepperRef.current?.next?.(),
        previous: () => stepperRef.current?.previous?.(),
        get element() {
          return stepperRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
      const el = stepperRef.current;
      if (!el) return;

      const handleWaBeforeStepChange = (e) => {
        if (onBeforeStepChange) onBeforeStepChange(e);
      };

      const handleWaStepChange = (e) => {
        if (onStepChange) onStepChange(e);
      };

      el.addEventListener('wa-before-step-change', handleWaBeforeStepChange);
      el.addEventListener('wa-step-change', handleWaStepChange);

      return () => {
        el.removeEventListener(
          'wa-before-step-change',
          handleWaBeforeStepChange
        );
        el.removeEventListener('wa-step-change', handleWaStepChange);
      };
    }, [onBeforeStepChange, onStepChange]);

    return (
      <wa-stepper
        ref={stepperRef}
        class={clsx('Stepper', className)}
        {...props}
      >
        {children}
      </wa-stepper>
    );
  }
);

Stepper.displayName = 'Stepper';
