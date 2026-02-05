import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/color-picker/color-picker.js';
import './ColorPicker.css';

/**
 * Color pickers allow the user to select a color
 *
 * @example
 * ```tsx
 * <ColorPicker value="#ff0000" />
 * <ColorPicker format="rgb" opacity />
 * <ColorPicker swatches="#ff0000;#00ff00;#0000ff" />
 * ```
 */
export interface ColorPickerProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onInvalid' | 'dir'
> {
  /** The current color value */
  value?: string;
  /** Default value for form resets */
  defaultValue?: string;
  /** Color format */
  format?: 'hex' | 'rgb' | 'hsl' | 'hsv';
  /** Enables opacity slider */
  opacity?: boolean;
  /** Disables the color picker */
  disabled?: boolean;
  /** Makes field mandatory */
  required?: boolean;
  /** Color picker size */
  size?: 'small' | 'medium' | 'large';
  /** Label text */
  label?: string;
  /** Hint text */
  hint?: string;
  /** Form field name */
  name?: string;
  /** Whether the panel is open */
  open?: boolean;
  /** Predefined color swatches (semicolon-separated or array) */
  swatches?: string | string[];
  /** Displays hex values in uppercase */
  uppercase?: boolean;
  /** Hides the format toggle button */
  'without-format-toggle'?: boolean;
  /** Event fired when panel opens */
  onShow?: (event: CustomEvent) => void;
  /** Event fired after panel opens */
  onAfterShow?: (event: CustomEvent) => void;
  /** Event fired when panel closes */
  onHide?: (event: CustomEvent) => void;
  /** Event fired after panel closes */
  onAfterHide?: (event: CustomEvent) => void;
  /** Event fired when validation fails */
  onInvalid?: (event: CustomEvent) => void;
}

export interface ColorPickerRef {
  show: () => void;
  hide: () => void;
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  getFormattedValue: (format: string) => string;
  reportValidity: () => boolean;
  element: HTMLElement | null;
}

export const ColorPicker = forwardRef<ColorPickerRef, ColorPickerProps>(
  (
    {
      children,
      className,
      onShow,
      onAfterShow,
      onHide,
      onAfterHide,
      onInvalid,
      ...props
    },
    ref
  ) => {
    const pickerRef = useRef<
      HTMLElement & {
        show?: () => void;
        hide?: () => void;
        focus?: (options?: FocusOptions) => void;
        blur?: () => void;
        getFormattedValue?: (format: string) => string;
        reportValidity?: () => boolean;
      }
    >(null);

    useImperativeHandle(
      ref,
      () => ({
        show: () => {
          if (
            pickerRef.current &&
            typeof pickerRef.current.show === 'function'
          ) {
            pickerRef.current.show();
          }
        },
        hide: () => {
          if (
            pickerRef.current &&
            typeof pickerRef.current.hide === 'function'
          ) {
            pickerRef.current.hide();
          }
        },
        focus: (options?: FocusOptions) => {
          if (
            pickerRef.current &&
            typeof pickerRef.current.focus === 'function'
          ) {
            pickerRef.current.focus(options);
          }
        },
        blur: () => {
          if (
            pickerRef.current &&
            typeof pickerRef.current.blur === 'function'
          ) {
            pickerRef.current.blur();
          }
        },
        getFormattedValue: (format: string) => {
          if (
            pickerRef.current &&
            typeof pickerRef.current.getFormattedValue === 'function'
          ) {
            return pickerRef.current.getFormattedValue(format);
          }
          return '';
        },
        reportValidity: () => {
          if (
            pickerRef.current &&
            typeof pickerRef.current.reportValidity === 'function'
          ) {
            return pickerRef.current.reportValidity();
          }
          return true;
        },
        get element() {
          return pickerRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      const el = pickerRef.current;
      if (!el) return;

      const handleShow = (e: Event) => onShow?.(e as CustomEvent);
      const handleAfterShow = (e: Event) => onAfterShow?.(e as CustomEvent);
      const handleHide = (e: Event) => onHide?.(e as CustomEvent);
      const handleAfterHide = (e: Event) => onAfterHide?.(e as CustomEvent);
      const handleInvalid = (e: Event) => onInvalid?.(e as CustomEvent);

      el.addEventListener('wa-show', handleShow);
      el.addEventListener('wa-after-show', handleAfterShow);
      el.addEventListener('wa-hide', handleHide);
      el.addEventListener('wa-after-hide', handleAfterHide);
      el.addEventListener('wa-invalid', handleInvalid);

      return () => {
        el.removeEventListener('wa-show', handleShow);
        el.removeEventListener('wa-after-show', handleAfterShow);
        el.removeEventListener('wa-hide', handleHide);
        el.removeEventListener('wa-after-hide', handleAfterHide);
        el.removeEventListener('wa-invalid', handleInvalid);
      };
    }, [onShow, onAfterShow, onHide, onAfterHide, onInvalid]);

    return (
      <wa-color-picker
        ref={pickerRef}
        class={clsx('ColorPicker', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-color-picker>
    );
  }
);

ColorPicker.displayName = 'ColorPicker';
