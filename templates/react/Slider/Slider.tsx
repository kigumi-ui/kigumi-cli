import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaSlider from '@awesome.me/webawesome/dist/components/slider/slider.js';
import './Slider.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/slider/slider.js'));
}

/**
 * Sliders allow the user to select a value within a range
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Slider />
 *
 * // With event handlers
 * <Slider
 *   onChange={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<SliderRef>(null);
 * <button onClick={() => ref.current?.focus()}>Call Method</button>
 * <Slider ref={ref} />
 * ```
 */
export interface SliderProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onChange' | 'onBlur' | 'onFocus' | 'onInput' | 'onInvalid' | 'dir'
> {
  /** Form field name */
  name?: string;

  /** Current value */
  value?: number;

  /** Accessible label */
  label?: string;

  /** Hint text */
  hint?: string;

  /** Minimum value */
  min?: number;

  /** Maximum value */
  max?: number;

  /** Step increment */
  step?: number;

  /** The orientation of the slider */
  orientation?: 'horizontal' | 'vertical';

  /** Disables the slider */
  disabled?: boolean;

  /** Makes the slider readonly */
  readonly?: boolean;

  /** Converts to a range slider with two thumbs */
  range?: boolean;

  /** Draws markers at each step */
  'with-markers'?: boolean;

  /** Draws a tooltip above the thumb */
  'with-tooltip'?: boolean;

  /** Slider size */
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';

  /** Automatically focuses the slider on page load */
  autofocus?: boolean;

  /** Emitted when an alteration to the control's value is committed by the user. */
  onChange?: (event: CustomEvent) => void;

  /** Emitted when the control loses focus. */
  onBlur?: (event: FocusEvent) => void;

  /** Emitted when the control gains focus. */
  onFocus?: (event: FocusEvent) => void;

  /** Emitted when the control receives input. */
  onInput?: (event: CustomEvent) => void;

  /** Emitted when the form control has been checked for validity and its constraints aren't satisfied. */
  onInvalid?: (event: CustomEvent) => void;
}

export interface SliderRef {
  /** Sets focus to the slider. */
  focus: () => void;

  /** Removes focus from the slider. */
  blur: () => void;

  /** Decreases the slider's value by `step`. This is a programmatic change, so `input` and `change` events will not be
emitted when this is called. */
  stepDown: () => void;

  /** Increases the slider's value by `step`. This is a programmatic change, so `input` and `change` events will not be
emitted when this is called. */
  stepUp: () => void;

  /** Do not use this when creating a "Validator". This is intended for end users of components.
We track manually defined custom errors so we don't clear them on accident in our validators. */
  setCustomValidity: (message: string) => void;

  /** Called when the browser is trying to restore element’s state to state in which case reason is "restore", or when
the browser is trying to fulfill autofill on behalf of user in which case reason is "autocomplete". In the case of
"restore", state is a string, File, or FormData object previously set as the second argument to setFormValue. */
  formStateRestoreCallback: (
    state: string | File | FormData | null,
    reason: 'autocomplete' | 'restore'
  ) => void;

  /** Reset validity is a way of removing manual custom errors and native validation. */
  resetValidity: () => void;
  /** Reference to the underlying HTML element */
  element: WaSlider | null;
}

export const Slider = forwardRef<SliderRef, SliderProps>(
  (
    {
      children,
      className,
      onChange,
      onBlur,
      onFocus,
      onInput,
      onInvalid,
      ...props
    },
    ref
  ) => {
    const sliderRef = useRef<WaSlider | null>(null);
    const setSliderRef = useCallback((el: WaSlider | null) => {
      sliderRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          if (
            sliderRef.current &&
            typeof sliderRef.current.focus === 'function'
          ) {
            sliderRef.current.focus();
          }
        },
        blur: () => {
          if (
            sliderRef.current &&
            typeof sliderRef.current.blur === 'function'
          ) {
            sliderRef.current.blur();
          }
        },
        stepDown: () => {
          if (
            sliderRef.current &&
            typeof sliderRef.current.stepDown === 'function'
          ) {
            sliderRef.current.stepDown();
          }
        },
        stepUp: () => {
          if (
            sliderRef.current &&
            typeof sliderRef.current.stepUp === 'function'
          ) {
            sliderRef.current.stepUp();
          }
        },
        setCustomValidity: (message: string) => {
          if (
            sliderRef.current &&
            typeof sliderRef.current.setCustomValidity === 'function'
          ) {
            sliderRef.current.setCustomValidity(message);
          }
        },
        formStateRestoreCallback: (
          state: string | File | FormData | null,
          reason: 'autocomplete' | 'restore'
        ) => {
          if (
            sliderRef.current &&
            typeof sliderRef.current.formStateRestoreCallback === 'function'
          ) {
            sliderRef.current.formStateRestoreCallback(state, reason);
          }
        },
        resetValidity: () => {
          if (
            sliderRef.current &&
            typeof sliderRef.current.resetValidity === 'function'
          ) {
            sliderRef.current.resetValidity();
          }
        },
        get element() {
          return sliderRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = sliderRef.current;
      if (!el) return;

      const handleChange = (e: Event) => {
        if (onChange) onChange(e as CustomEvent);
      };

      const handleBlur = (e: Event) => {
        if (onBlur) onBlur(e as FocusEvent);
      };

      const handleFocus = (e: Event) => {
        if (onFocus) onFocus(e as FocusEvent);
      };

      const handleInput = (e: Event) => {
        if (onInput) onInput(e as CustomEvent);
      };

      const handleWaInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as CustomEvent);
      };

      el.addEventListener('change', handleChange);
      el.addEventListener('blur', handleBlur);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('input', handleInput);
      el.addEventListener('wa-invalid', handleWaInvalid);

      return () => {
        el.removeEventListener('change', handleChange);
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('input', handleInput);
        el.removeEventListener('wa-invalid', handleWaInvalid);
      };
    }, [onChange, onBlur, onFocus, onInput, onInvalid]);

    return (
      <wa-slider
        ref={setSliderRef}
        class={clsx('Slider', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-slider>
    );
  }
);

Slider.displayName = 'Slider';
