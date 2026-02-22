import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/slider/slider.js';
import './Slider.css';

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

  /** Makes the slider required */
  required?: boolean;

  /** Converts to a range slider with two thumbs */
  range?: boolean;

  /** Draws markers at each step */
  'with-markers'?: boolean;

  /** Draws a tooltip above the thumb */
  'with-tooltip'?: boolean;

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
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
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
    const sliderRef = useRef<
      HTMLElement & {
        focus?: () => void;
        blur?: () => void;
        stepDown?: () => void;
        stepUp?: () => void;
      }
    >(null);

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
        get element() {
          return sliderRef.current;
        },
      }),
      []
    );

    useEffect(() => {
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

      const handleInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as CustomEvent);
      };

      el.addEventListener('change', handleChange);
      el.addEventListener('blur', handleBlur);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('input', handleInput);
      el.addEventListener('wa-invalid', handleInvalid);

      return () => {
        el.removeEventListener('change', handleChange);
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('input', handleInput);
        el.removeEventListener('wa-invalid', handleInvalid);
      };
    }, [onChange, onBlur, onFocus, onInput, onInvalid]);

    return (
      <wa-slider
        ref={sliderRef}
        class={clsx('Slider', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-slider>
    );
  }
);

Slider.displayName = 'Slider';
