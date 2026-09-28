import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaStep from '@awesome.me/webawesome/dist/components/step/step.js';
import './Step.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/step/step.js'));
}

/**
 * Steps are the individual stages of a stepper, each with a label and a status
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Step />
 *
 * // With event handlers
 * <Step />
 *
 * ```
 */
export interface StepProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {
  /** The step's identifier; the stepper's active and its events use it */
  name?: string;

  /** Marks the step done and shows a checkmark */
  completed?: boolean;

  /** Shows a spinner in place of the step number */
  loading?: boolean;

  /** Makes the step unreachable and non-interactive */
  disabled?: boolean;

  /** Semantic color of the step marker */
  variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

  /** Animates the marker to draw attention to the step */
  attention?: 'none' | 'pulse' | 'bounce';

  /** Whether this is the current step; set by the stepper */
  active?: boolean;
}

export interface StepRef {
  /** Reference to the underlying HTML element */
  element: WaStep | null;
}

export const Step = forwardRef<StepRef, StepProps>(
  ({ children, className, ...props }, ref) => {
    const stepRef = useRef<WaStep | null>(null);
    const setStepRef = useCallback((el: WaStep | null) => {
      stepRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return stepRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-step
        ref={setStepRef}
        class={clsx('Step', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-step>
    );
  }
);

Step.displayName = 'Step';
