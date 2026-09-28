import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaStepper from '@awesome.me/webawesome-pro/dist/components/stepper/stepper.js';
import '@awesome.me/webawesome-pro/dist/components/stepper/stepper.js';
import type { WaBeforeStepChangeEvent } from '@awesome.me/webawesome-pro/dist/events/before-step-change.js';
import type { WaStepChangeEvent } from '@awesome.me/webawesome-pro/dist/events/step-change.js';
import './Stepper.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome-pro/dist/components/stepper/stepper.js'));
}

/**
 * Steppers walk users through a multi-stage process and show where they are in it
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Stepper />
 *
 * // With event handlers
 * <Stepper
 *   onBeforeStepChange={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<StepperRef>(null);
 * <button onClick={() => ref.current?.next()}>Call Method</button>
 * <Stepper ref={ref} />
 * ```
 */
export interface StepperProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onBeforeStepChange' | 'onStepChange' | 'dir'
> {
  /** Name of the current step; the first step when unset or unmatched */
  active?: string;

  /** Layout direction; auto stacks the steps when they run out of room */
  orientation?: 'horizontal' | 'vertical' | 'auto';

  /** Steps can only be reached once the ones before are done */
  linear?: boolean;

  /** Lets users jump to a step by clicking or activating it */
  clickable?: boolean;

  /** Accessible name for the stepper */
  label?: string;

  /** Emitted before the active step changes. Calling `event.preventDefault()` prevents the change, to guard against invalid or unsaved data. */
  onBeforeStepChange?: (event: WaBeforeStepChangeEvent) => void;

  /** Emitted after the active step changes. */
  onStepChange?: (event: WaStepChangeEvent) => void;
}

export interface StepperRef {
  /** Requests a change to the named step. Emits a cancelable `wa-before-step-change`; if not canceled, updates
`active`, emits `wa-step-change`, and announces the new position to assistive technology. No-ops silently if the
step doesn't exist, is disabled, or (in `linear` mode) isn't reachable yet. */
  goTo: (name: string) => void;

  /** Advances to the step after the active one, if any. */
  next: () => void;

  /** Goes back to the step before the active one, if any. */
  previous: () => void;
  /** Reference to the underlying HTML element */
  element: WaStepper | null;
}

export const Stepper = forwardRef<StepperRef, StepperProps>(
  (
    { children, className, onBeforeStepChange, onStepChange, ...props },
    ref
  ) => {
    const stepperRef = useRef<WaStepper | null>(null);
    const setStepperRef = useCallback((el: WaStepper | null) => {
      stepperRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        goTo: (name: string) => {
          if (
            stepperRef.current &&
            typeof stepperRef.current.goTo === 'function'
          ) {
            stepperRef.current.goTo(name);
          }
        },
        next: () => {
          if (
            stepperRef.current &&
            typeof stepperRef.current.next === 'function'
          ) {
            stepperRef.current.next();
          }
        },
        previous: () => {
          if (
            stepperRef.current &&
            typeof stepperRef.current.previous === 'function'
          ) {
            stepperRef.current.previous();
          }
        },
        get element() {
          return stepperRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = stepperRef.current;
      if (!el) return;

      const handleWaBeforeStepChange = (e: Event) => {
        if (onBeforeStepChange)
          onBeforeStepChange(e as WaBeforeStepChangeEvent);
      };

      const handleWaStepChange = (e: Event) => {
        if (onStepChange) onStepChange(e as WaStepChangeEvent);
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
        ref={setStepperRef}
        class={clsx('Stepper', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-stepper>
    );
  }
);

Stepper.displayName = 'Stepper';
