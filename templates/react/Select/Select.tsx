import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaSelect from '@awesome.me/webawesome/dist/components/select/select.js';
import type { WaAfterHideEvent } from '@awesome.me/webawesome/dist/events/after-hide.js';
import type { WaAfterShowEvent } from '@awesome.me/webawesome/dist/events/after-show.js';
import type { WaClearEvent } from '@awesome.me/webawesome/dist/events/clear.js';
import type { WaHideEvent } from '@awesome.me/webawesome/dist/events/hide.js';
import type { WaInvalidEvent } from '@awesome.me/webawesome/dist/events/invalid.js';
import type { WaShowEvent } from '@awesome.me/webawesome/dist/events/show.js';
import './Select.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/select/select.js'));
}

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
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';

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

  /** Custom validation message; the control is invalid while it is set */
  'custom-error'?: string;

  /** Emitted when the control receives input. */
  onInput?: (event: InputEvent) => void;

  /** Emitted when the control's value changes. */
  onChange?: (event: Event) => void;

  /** Emitted when the control gains focus. */
  onFocus?: (event: FocusEvent) => void;

  /** Emitted when the control loses focus. */
  onBlur?: (event: FocusEvent) => void;

  /** Emitted when the control's value is cleared. */
  onClear?: (event: WaClearEvent) => void;

  /** Emitted when the select's menu opens. */
  onShow?: (event: WaShowEvent) => void;

  /** Emitted after the select's menu opens and all animations are complete. */
  onAfterShow?: (event: WaAfterShowEvent) => void;

  /** Emitted when the select's menu closes. */
  onHide?: (event: WaHideEvent) => void;

  /** Emitted after the select's menu closes and all animations are complete. */
  onAfterHide?: (event: WaAfterHideEvent) => void;

  /** Emitted when the form control has been checked for validity and its constraints aren't satisfied. */
  onInvalid?: (event: WaInvalidEvent) => void;
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
  element: WaSelect | null;
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
    const selectRef = useRef<WaSelect | null>(null);
    const setSelectRef = useCallback((el: WaSelect | null) => {
      selectRef.current = el;
    }, []);

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
        setCustomValidity: (message: string) => {
          if (
            selectRef.current &&
            typeof selectRef.current.setCustomValidity === 'function'
          ) {
            selectRef.current.setCustomValidity(message);
          }
        },
        formStateRestoreCallback: (
          state: string | File | FormData | null,
          reason: 'autocomplete' | 'restore'
        ) => {
          if (
            selectRef.current &&
            typeof selectRef.current.formStateRestoreCallback === 'function'
          ) {
            selectRef.current.formStateRestoreCallback(state, reason);
          }
        },
        resetValidity: () => {
          if (
            selectRef.current &&
            typeof selectRef.current.resetValidity === 'function'
          ) {
            selectRef.current.resetValidity();
          }
        },
        get element() {
          return selectRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = selectRef.current;
      if (!el) return;

      const handleInput = (e: Event) => {
        if (onInput) onInput(e as InputEvent);
      };

      const handleChange = (e: Event) => {
        if (onChange) onChange(e as Event);
      };

      const handleFocus = (e: Event) => {
        if (onFocus) onFocus(e as FocusEvent);
      };

      const handleBlur = (e: Event) => {
        if (onBlur) onBlur(e as FocusEvent);
      };

      const handleWaClear = (e: Event) => {
        if (onClear) onClear(e as WaClearEvent);
      };

      const handleWaShow = (e: Event) => {
        if (onShow) onShow(e as WaShowEvent);
      };

      const handleWaAfterShow = (e: Event) => {
        if (onAfterShow) onAfterShow(e as WaAfterShowEvent);
      };

      const handleWaHide = (e: Event) => {
        if (onHide) onHide(e as WaHideEvent);
      };

      const handleWaAfterHide = (e: Event) => {
        if (onAfterHide) onAfterHide(e as WaAfterHideEvent);
      };

      const handleWaInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as WaInvalidEvent);
      };

      el.addEventListener('input', handleInput);
      el.addEventListener('change', handleChange);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('blur', handleBlur);
      el.addEventListener('wa-clear', handleWaClear);
      el.addEventListener('wa-show', handleWaShow);
      el.addEventListener('wa-after-show', handleWaAfterShow);
      el.addEventListener('wa-hide', handleWaHide);
      el.addEventListener('wa-after-hide', handleWaAfterHide);
      el.addEventListener('wa-invalid', handleWaInvalid);

      return () => {
        el.removeEventListener('input', handleInput);
        el.removeEventListener('change', handleChange);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('wa-clear', handleWaClear);
        el.removeEventListener('wa-show', handleWaShow);
        el.removeEventListener('wa-after-show', handleWaAfterShow);
        el.removeEventListener('wa-hide', handleWaHide);
        el.removeEventListener('wa-after-hide', handleWaAfterHide);
        el.removeEventListener('wa-invalid', handleWaInvalid);
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
        ref={setSelectRef}
        class={clsx('Select', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-select>
    );
  }
);

Select.displayName = 'Select';
