import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/select/select.js';
import type WaElement from '@awesome.me/webawesome-pro/dist/components/select/select.js';
import './Select.css';

/**
 * Selects allow you to choose items from a menu of predefined options
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Select />
 *
 * // With event handlers
 * <Select
 *   onInput={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<SelectRef>(null);
 * <button onClick={() => ref.current?.show()}>Call Method</button>
 * <Select ref={ref} />
 * ```
 */
export interface SelectProps extends Omit<
  HTMLAttributes<HTMLElement>,
  | 'onInput'
  | 'onChange'
  | 'onFocus'
  | 'onBlur'
  | 'onClear'
  | 'onShow'
  | 'onAfterShow'
  | 'onHide'
  | 'onAfterHide'
  | 'onInvalid'
  | 'dir'
> {
  /** Form field name */
  name?: string;

  /** Selected value(s) */
  value?: string;

  /** Visual appearance */
  appearance?: 'filled' | 'outlined' | 'filled-outlined';

  /** Select size */
  size?: 'small' | 'medium' | 'large';

  /** Placeholder text */
  placeholder?: string;

  /** Allows multiple selections */
  multiple?: boolean;

  /** Max visible tags (multiple) */
  'max-options-visible'?: number;

  /** Disables the select */
  disabled?: boolean;

  /** Shows clear button */
  'with-clear'?: boolean;

  /** Whether listbox is open */
  open?: boolean;

  /** Hoists to body */
  hoist?: boolean;

  /** Listbox placement */
  placement?: 'top' | 'bottom';

  /** Rounded edges */
  pill?: boolean;

  /** Label text */
  label?: string;

  /** Hint text */
  hint?: string;

  /** Makes selection required */
  required?: boolean;

  /** Shows invalid/error state */
  invalid?: boolean;

  /** Help text below the control */
  'help-text'?: string;

  /** Emitted when the control receives input. */
  onInput?: (event: CustomEvent) => void;

  /** Emitted when the control's value changes. */
  onChange?: (event: CustomEvent) => void;

  /** Emitted when the control gains focus. */
  onFocus?: (event: FocusEvent) => void;

  /** Emitted when the control loses focus. */
  onBlur?: (event: FocusEvent) => void;

  /** Emitted when the control's value is cleared. */
  onClear?: (event: CustomEvent) => void;

  /** Emitted when the select's menu opens. */
  onShow?: (event: CustomEvent) => void;

  /** Emitted after the select's menu opens and all animations are complete. */
  onAfterShow?: (event: CustomEvent) => void;

  /** Emitted when the select's menu closes. */
  onHide?: (event: CustomEvent) => void;

  /** Emitted after the select's menu closes and all animations are complete. */
  onAfterHide?: (event: CustomEvent) => void;

  /** Emitted when the form control has been checked for validity and its constraints aren't satisfied. */
  onInvalid?: (event: CustomEvent) => void;
}

export interface SelectRef {
  /** Shows the listbox. */
  show: () => void;

  /** Hides the listbox. */
  hide: () => void;

  /** Sets focus on the control. */
  focus: (options: FocusOptions) => void;

  /** Removes focus from the control. */
  blur: () => void;
  /** Reference to the underlying element */
  element: WaElement | null;
}

export const Select = forwardRef<SelectRef, SelectProps>(
  (
    {
      children,
      className,
      onInput,
      onChange,
      onFocus,
      onBlur,
      onClear,
      onShow,
      onAfterShow,
      onHide,
      onAfterHide,
      onInvalid,
      ...props
    },
    ref
  ) => {
    const selectRef = useRef<WaElement | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        show: () => {
          if (
            selectRef.current &&
            typeof selectRef.current.show === 'function'
          ) {
            selectRef.current.show();
          }
        },
        hide: () => {
          if (
            selectRef.current &&
            typeof selectRef.current.hide === 'function'
          ) {
            selectRef.current.hide();
          }
        },
        focus: (options: FocusOptions) => {
          if (
            selectRef.current &&
            typeof selectRef.current.focus === 'function'
          ) {
            selectRef.current.focus(options);
          }
        },
        blur: () => {
          if (
            selectRef.current &&
            typeof selectRef.current.blur === 'function'
          ) {
            selectRef.current.blur();
          }
        },
        get element() {
          return selectRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      const el = selectRef.current;
      if (!el) return;

      const handleInput = (e: Event) => {
        if (onInput) onInput(e as CustomEvent);
      };

      const handleChange = (e: Event) => {
        if (onChange) onChange(e as CustomEvent);
      };

      const handleFocus = (e: Event) => {
        if (onFocus) onFocus(e as FocusEvent);
      };

      const handleBlur = (e: Event) => {
        if (onBlur) onBlur(e as FocusEvent);
      };

      const handleClear = (e: Event) => {
        if (onClear) onClear(e as CustomEvent);
      };

      const handleShow = (e: Event) => {
        if (onShow) onShow(e as CustomEvent);
      };

      const handleAfterShow = (e: Event) => {
        if (onAfterShow) onAfterShow(e as CustomEvent);
      };

      const handleHide = (e: Event) => {
        if (onHide) onHide(e as CustomEvent);
      };

      const handleAfterHide = (e: Event) => {
        if (onAfterHide) onAfterHide(e as CustomEvent);
      };

      const handleInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as CustomEvent);
      };

      el.addEventListener('input', handleInput);
      el.addEventListener('change', handleChange);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('blur', handleBlur);
      el.addEventListener('wa-clear', handleClear);
      el.addEventListener('wa-show', handleShow);
      el.addEventListener('wa-after-show', handleAfterShow);
      el.addEventListener('wa-hide', handleHide);
      el.addEventListener('wa-after-hide', handleAfterHide);
      el.addEventListener('wa-invalid', handleInvalid);

      return () => {
        el.removeEventListener('input', handleInput);
        el.removeEventListener('change', handleChange);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('wa-clear', handleClear);
        el.removeEventListener('wa-show', handleShow);
        el.removeEventListener('wa-after-show', handleAfterShow);
        el.removeEventListener('wa-hide', handleHide);
        el.removeEventListener('wa-after-hide', handleAfterHide);
        el.removeEventListener('wa-invalid', handleInvalid);
      };
    }, [
      onInput,
      onChange,
      onFocus,
      onBlur,
      onClear,
      onShow,
      onAfterShow,
      onHide,
      onAfterHide,
      onInvalid,
    ]);

    return (
      <wa-select
        ref={(el: WaElement | null) => {
          selectRef.current = el;
        }}
        class={clsx('Select', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-select>
    );
  }
);

Select.displayName = 'Select';
