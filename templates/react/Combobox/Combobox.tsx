import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaCombobox from '@awesome.me/webawesome/dist/components/combobox/combobox.js';
import './Combobox.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/combobox/combobox.js'));
}

/**
 * Combines a text input with a listbox for filtering and selecting options
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Combobox />
 *
 * // With event handlers
 * <Combobox
 *   onInput={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<ComboboxRef>(null);
 * <button onClick={() => ref.current?.show()}>Call Method</button>
 * <Combobox ref={ref} />
 * ```
 */
export interface ComboboxProps extends Omit<HTMLAttributes<HTMLElement>, 'onInput' | 'onChange' | 'onFocus' | 'onBlur' | 'onClear' | 'onShow' | 'onAfterShow' | 'onHide' | 'onAfterHide' | 'onCreate' | 'onInvalid' | 'dir'> {

  /** Allows entering custom values */
  'allow-custom-value'?: boolean;

  /** Visual appearance style */
  appearance?: 'filled' | 'outlined' | 'filled-outlined';

  /** Allows creating new options not in the list */
  'allow-create'?: boolean;

  /** Controls autocapitalization on supported devices */
  autocapitalize?: 'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters';

  /** Enable or disable autocorrect on supported devices */
  autocorrect?: boolean;

  /** Disables the combobox */
  disabled?: boolean;

  /** Customizes the keyboard's Enter key label */
  enterkeyhint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';

  /** Hint text */
  hint?: string;

  /** Controls virtual keyboard type */
  inputmode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';

  /** Label text */
  label?: string;

  /** Maximum visible options before scrolling */
  'max-options-visible'?: number;

  /** Allows multiple selections */
  multiple?: boolean;

  /** Form field name */
  name?: string;

  /** Whether the listbox is open */
  open?: boolean;

  /** Rounded edges style */
  pill?: boolean;

  /** Placeholder text */
  placeholder?: string;

  /** Listbox placement */
  placement?: 'top' | 'bottom';

  /** Makes field mandatory */
  required?: boolean;

  /** Combobox size */
  size?: 'small' | 'medium' | 'large';

  /** Enable or disable spellchecking */
  spellcheck?: boolean;

  /** Shows clear button */
  'with-clear'?: boolean;

  /** Current value of the combobox */
  value?: string;

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

  /** Emitted when the combobox's menu opens. */
  onShow?: (event: CustomEvent) => void;

  /** Emitted after the combobox's menu opens and all animations are complete. */
  onAfterShow?: (event: CustomEvent) => void;

  /** Emitted when the combobox's menu closes. */
  onHide?: (event: CustomEvent) => void;

  /** Emitted after the combobox's menu closes and all animations are complete. */
  onAfterHide?: (event: CustomEvent) => void;

  /** Emitted when the user selects the "create" option. Call `event.preventDefault()` to handle creation yourself. The event `detail` contains `{ inputValue: string }`. */
  onCreate?: (event: CustomEvent) => void;

  /** Emitted when the form control has been checked for validity and its constraints aren't satisfied. */
  onInvalid?: (event: CustomEvent) => void;
}

export interface ComboboxRef {

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
  formStateRestoreCallback: (state: string | File | FormData | null, reason: 'autocomplete' | 'restore') => void;

  /** Reset validity is a way of removing manual custom errors and native validation. */
  resetValidity: () => void;
  /** Reference to the underlying HTML element */
  element: WaCombobox | null;
}

export const Combobox = forwardRef<ComboboxRef, ComboboxProps>(
  ({ children, className, onInput, onChange, onFocus, onBlur, onClear, onShow, onAfterShow, onHide, onAfterHide, onCreate, onInvalid, ...props }, ref) => {
    const comboboxRef = useRef<WaCombobox | null>(null);
    const setComboboxRef = useCallback((el: WaCombobox | null) => {
      comboboxRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        show: () => {
          if (comboboxRef.current && typeof comboboxRef.current.show === 'function') {
            comboboxRef.current.show();
          }
        },
        hide: () => {
          if (comboboxRef.current && typeof comboboxRef.current.hide === 'function') {
            comboboxRef.current.hide();
          }
        },
        focus: (options: FocusOptions) => {
          if (comboboxRef.current && typeof comboboxRef.current.focus === 'function') {
            comboboxRef.current.focus(options);
          }
        },
        blur: () => {
          if (comboboxRef.current && typeof comboboxRef.current.blur === 'function') {
            comboboxRef.current.blur();
          }
        },
        setCustomValidity: (message: string) => {
          if (comboboxRef.current && typeof comboboxRef.current.setCustomValidity === 'function') {
            comboboxRef.current.setCustomValidity(message);
          }
        },
        formStateRestoreCallback: (state: string | File | FormData | null, reason: 'autocomplete' | 'restore') => {
          if (comboboxRef.current && typeof comboboxRef.current.formStateRestoreCallback === 'function') {
            comboboxRef.current.formStateRestoreCallback(state, reason);
          }
        },
        resetValidity: () => {
          if (comboboxRef.current && typeof comboboxRef.current.resetValidity === 'function') {
            comboboxRef.current.resetValidity();
          }
        },
        get element() {
          return comboboxRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = comboboxRef.current;
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

      const handleWaClear = (e: Event) => {
        if (onClear) onClear(e as CustomEvent);
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

      const handleWaCreate = (e: Event) => {
        if (onCreate) onCreate(e as CustomEvent);
      };

      const handleWaInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as CustomEvent);
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
      el.addEventListener('wa-create', handleWaCreate);
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
        el.removeEventListener('wa-create', handleWaCreate);
        el.removeEventListener('wa-invalid', handleWaInvalid);
      };
    }, [onInput, onChange, onFocus, onBlur, onClear, onShow, onAfterShow, onHide, onAfterHide, onCreate, onInvalid]);

    return (
      <wa-combobox
        ref={setComboboxRef}
        class={clsx('Combobox', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<string, unknown>)}
      >
        {children}
      </wa-combobox>
    );
  }
);

Combobox.displayName = 'Combobox';
