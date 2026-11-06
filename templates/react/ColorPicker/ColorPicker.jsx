import React from 'react';
import clsx from 'clsx';
import './ColorPicker.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/color-picker/color-picker.js'));
}

/**
 * Color pickers allow the user to select a color
 *
 * @example
 * ```jsx
 * <ColorPicker value="#ff0000" />
 * <ColorPicker format="rgb" opacity />
 * ```
 */
/**
 * @typedef {Object} ColorPickerProps
 * @property {string} [value] - The current color value
 * @property {string} [format] - Color format: hex | rgb | hsl | hsv
 * @property {boolean} [opacity] - Enables opacity slider
 * @property {boolean} [disabled] - Disables the color picker
 * @property {boolean} [required] - Makes field mandatory
 * @property {string} [size] - Color picker size: small | medium | large | xs | s | m | l | xl
 * @property {string} [label] - Label text
 * @property {string} [hint] - Hint text
 * @property {string} [name] - Form field name
 * @property {boolean} [open] - Whether the panel is open
 * @property {string} [placement] - Preferred placement of the color picker panel: top | top-start | top-end | bottom | bottom-start | bottom-end | right | right-start | right-end | left | left-start | left-end
 * @property {string} [swatches] - Predefined color swatches
 * @property {boolean} [uppercase] - Displays hex values in uppercase
 * @property {boolean} [without-format-toggle] - Hides the format toggle button
 * @property {boolean} [inline] - Deprecated: The color picker has no inline mode, so remove this prop. Removed in the next major.
 * @property {string} [custom-error] - Custom validation message; the control is invalid while it is set
 */

export const ColorPicker = React.forwardRef(
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
    const pickerRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        show: () => pickerRef.current?.show?.(),
        hide: () => pickerRef.current?.hide?.(),
        focus: (options) => pickerRef.current?.focus?.(options),
        blur: () => pickerRef.current?.blur?.(),
        getFormattedValue: (format) =>
          pickerRef.current?.getFormattedValue?.(format) || '',
        reportValidity: () => pickerRef.current?.reportValidity?.() ?? true,
        get element() {
          return pickerRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
      const el = pickerRef.current;
      if (!el) return;

      const handleShow = (e) => {
        if (e.target !== e.currentTarget) return;
        onShow?.(e);
      };
      const handleAfterShow = (e) => {
        if (e.target !== e.currentTarget) return;
        onAfterShow?.(e);
      };
      const handleHide = (e) => {
        if (e.target !== e.currentTarget) return;
        onHide?.(e);
      };
      const handleAfterHide = (e) => {
        if (e.target !== e.currentTarget) return;
        onAfterHide?.(e);
      };
      const handleInvalid = (e) => {
        if (e.target !== e.currentTarget) return;
        onInvalid?.(e);
      };

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
        {...props}
      >
        {children}
      </wa-color-picker>
    );
  }
);

ColorPicker.displayName = 'ColorPicker';
