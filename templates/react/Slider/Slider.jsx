import React from 'react';
import clsx from 'clsx';
import './Slider.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/slider/slider.js'));
}

export const Slider = React.forwardRef(
  ({ className, onChange, onInvalid, ...props }, ref) => {
    const sliderRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        focus: (options) => sliderRef.current?.focus?.(options),
        blur: () => sliderRef.current?.blur?.(),
        stepUp: () => sliderRef.current?.stepUp?.(),
        stepDown: () => sliderRef.current?.stepDown?.(),
        get element() {
          return sliderRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
      const el = sliderRef.current;
      if (!el) return;

      const handleChange = (e) => onChange?.(e);
      const handleInvalid = (e) => onInvalid?.(e);

      el.addEventListener('change', handleChange);
      el.addEventListener('wa-invalid', handleInvalid);

      return () => {
        el.removeEventListener('change', handleChange);
        el.removeEventListener('wa-invalid', handleInvalid);
      };
    }, [onChange, onInvalid]);

    return (
      <wa-slider ref={sliderRef} class={clsx('Slider', className)} {...props} />
    );
  }
);

Slider.displayName = 'Slider';
