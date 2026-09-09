import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaColorPicker from '@awesome.me/webawesome/dist/components/color-picker/color-picker.js';
import './ColorPicker.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/color-picker/color-picker.js'));
}

/**
 * Color pickers allow the user to select a color
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ColorPicker />
 *
 * // With event handlers
 * <ColorPicker
 *   onChange={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<ColorPickerRef>(null);
 * <button onClick={() => ref.current?.getHexString()}>Call Method</button>
 * <ColorPicker ref={ref} />
 * ```
 */
export interface ColorPickerProps extends Omit<
  HTMLAttributes<HTMLElement>,
  | 'onChange'
  | 'onInput'
  | 'onShow'
  | 'onAfterShow'
  | 'onHide'
  | 'onAfterHide'
  | 'onBlur'
  | 'onFocus'
  | 'onInvalid'
  | 'dir'
> {
  /** The current color value */
  value?: string;

  /** Color format */
  format?: 'hex' | 'rgb' | 'hsl' | 'hsv';

  /** Enables opacity slider */
  opacity?: boolean;

  /** Disables the color picker */
  disabled?: boolean;

  /** Makes field mandatory */
  required?: boolean;

  /** Color picker size */
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';

  /** Label text */
  label?: string;

  /** Hint text */
  hint?: string;

  /** Form field name */
  name?: string;

  /** Whether the panel is open */
  open?: boolean;

  /** Preferred placement of the color picker panel */
  placement?:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'right'
    | 'right-start'
    | 'right-end'
    | 'left'
    | 'left-start'
    | 'left-end';

  /** Predefined color swatches */
  swatches?: string;

  /** Displays hex values in uppercase */
  uppercase?: boolean;

  /** Hides the format toggle button */
  'without-format-toggle'?: boolean;

  /** Renders the color picker inline instead of in a dropdown */
  inline?: boolean;

  /** Emitted when the color picker's value changes. */
  onChange?: (event: Event) => void;

  /** Emitted when the color picker receives input. */
  onInput?: (event: InputEvent) => void;

  onShow?: (event: CustomEvent) => void;

  onAfterShow?: (event: CustomEvent) => void;

  onHide?: (event: CustomEvent) => void;

  onAfterHide?: (event: CustomEvent) => void;

  /** Emitted when the color picker loses focus. */
  onBlur?: (event: FocusEvent) => void;

  /** Emitted when the color picker receives focus. */
  onFocus?: (event: FocusEvent) => void;

  /** Emitted when the form control has been checked for validity and its constraints aren't satisfied. */
  onInvalid?: (event: CustomEvent) => void;
}

export interface ColorPickerRef {
  /** Generates a hex string from HSV values. Hue must be 0-360. All other arguments must be 0-100. */
  getHexString: (
    hue: number,
    saturation: number,
    brightness: number,
    alpha: any
  ) => void;

  /** Sets focus on the color picker. */
  focus: (options: FocusOptions) => void;

  /** Removes focus from the color picker. */
  blur: () => void;

  /** Returns the current value as a string in the specified format. */
  getFormattedValue: (
    format: 'hex' | 'hexa' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hsv' | 'hsva'
  ) => void;

  /** Checks for validity and shows the browser's validation message if the control is invalid. */
  reportValidity: () => void;

  /** Shows the color picker panel. */
  show: () => void;

  /** Hides the color picker panel */
  hide: () => void;

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
  element: WaColorPicker | null;
}

export const ColorPicker = forwardRef<ColorPickerRef, ColorPickerProps>(
  (
    {
      children,
      className,
      onChange,
      onInput,
      onShow,
      onAfterShow,
      onHide,
      onAfterHide,
      onBlur,
      onFocus,
      onInvalid,
      ...props
    },
    ref
  ) => {
    const colorpickerRef = useRef<WaColorPicker | null>(null);
    const setColorPickerRef = useCallback((el: WaColorPicker | null) => {
      colorpickerRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        getHexString: (
          hue: number,
          saturation: number,
          brightness: number,
          alpha: any
        ) => {
          if (
            colorpickerRef.current &&
            typeof colorpickerRef.current.getHexString === 'function'
          ) {
            colorpickerRef.current.getHexString(
              hue,
              saturation,
              brightness,
              alpha
            );
          }
        },
        focus: (options: FocusOptions) => {
          if (
            colorpickerRef.current &&
            typeof colorpickerRef.current.focus === 'function'
          ) {
            colorpickerRef.current.focus(options);
          }
        },
        blur: () => {
          if (
            colorpickerRef.current &&
            typeof colorpickerRef.current.blur === 'function'
          ) {
            colorpickerRef.current.blur();
          }
        },
        getFormattedValue: (
          format:
            'hex' | 'hexa' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hsv' | 'hsva'
        ) => {
          if (
            colorpickerRef.current &&
            typeof colorpickerRef.current.getFormattedValue === 'function'
          ) {
            colorpickerRef.current.getFormattedValue(format);
          }
        },
        reportValidity: () => {
          if (
            colorpickerRef.current &&
            typeof colorpickerRef.current.reportValidity === 'function'
          ) {
            colorpickerRef.current.reportValidity();
          }
        },
        show: () => {
          if (
            colorpickerRef.current &&
            typeof colorpickerRef.current.show === 'function'
          ) {
            colorpickerRef.current.show();
          }
        },
        hide: () => {
          if (
            colorpickerRef.current &&
            typeof colorpickerRef.current.hide === 'function'
          ) {
            colorpickerRef.current.hide();
          }
        },
        setCustomValidity: (message: string) => {
          if (
            colorpickerRef.current &&
            typeof colorpickerRef.current.setCustomValidity === 'function'
          ) {
            colorpickerRef.current.setCustomValidity(message);
          }
        },
        formStateRestoreCallback: (
          state: string | File | FormData | null,
          reason: 'autocomplete' | 'restore'
        ) => {
          if (
            colorpickerRef.current &&
            typeof colorpickerRef.current.formStateRestoreCallback ===
              'function'
          ) {
            colorpickerRef.current.formStateRestoreCallback(state, reason);
          }
        },
        resetValidity: () => {
          if (
            colorpickerRef.current &&
            typeof colorpickerRef.current.resetValidity === 'function'
          ) {
            colorpickerRef.current.resetValidity();
          }
        },
        get element() {
          return colorpickerRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = colorpickerRef.current;
      if (!el) return;

      const handleChange = (e: Event) => {
        if (onChange) onChange(e as Event);
      };

      const handleInput = (e: Event) => {
        if (onInput) onInput(e as InputEvent);
      };

      const handleWaShow = (e: Event) => {
        if (onShow) onShow(e as CustomEvent);
      };

      const handleWaAfterShow = (e: Event) => {
        if (onAfterShow) onAfterShow(e as CustomEvent);
      };

      const handleWaHide = (e: Event) => {
        if (onHide) onHide(e as CustomEvent);
      };

      const handleWaAfterHide = (e: Event) => {
        if (onAfterHide) onAfterHide(e as CustomEvent);
      };

      const handleBlur = (e: Event) => {
        if (onBlur) onBlur(e as FocusEvent);
      };

      const handleFocus = (e: Event) => {
        if (onFocus) onFocus(e as FocusEvent);
      };

      const handleWaInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as CustomEvent);
      };

      el.addEventListener('change', handleChange);
      el.addEventListener('input', handleInput);
      el.addEventListener('wa-show', handleWaShow);
      el.addEventListener('wa-after-show', handleWaAfterShow);
      el.addEventListener('wa-hide', handleWaHide);
      el.addEventListener('wa-after-hide', handleWaAfterHide);
      el.addEventListener('blur', handleBlur);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('wa-invalid', handleWaInvalid);

      return () => {
        el.removeEventListener('change', handleChange);
        el.removeEventListener('input', handleInput);
        el.removeEventListener('wa-show', handleWaShow);
        el.removeEventListener('wa-after-show', handleWaAfterShow);
        el.removeEventListener('wa-hide', handleWaHide);
        el.removeEventListener('wa-after-hide', handleWaAfterHide);
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('wa-invalid', handleWaInvalid);
      };
    }, [
      onChange,
      onInput,
      onShow,
      onAfterShow,
      onHide,
      onAfterHide,
      onBlur,
      onFocus,
      onInvalid,
    ]);

    return (
      <wa-color-picker
        ref={setColorPickerRef}
        class={clsx('ColorPicker', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-color-picker>
    );
  }
);

ColorPicker.displayName = 'ColorPicker';
