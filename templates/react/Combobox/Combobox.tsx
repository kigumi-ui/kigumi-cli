import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaCombobox from '@awesome.me/webawesome/dist/components/combobox/combobox.js';
import type { WaAfterHideEvent } from '@awesome.me/webawesome/dist/events/after-hide.js';
import type { WaAfterShowEvent } from '@awesome.me/webawesome/dist/events/after-show.js';
import type { WaClearEvent } from '@awesome.me/webawesome/dist/events/clear.js';
import type { WaCreateEvent } from '@awesome.me/webawesome/dist/events/create.js';
import type { WaHideEvent } from '@awesome.me/webawesome/dist/events/hide.js';
import type { WaInvalidEvent } from '@awesome.me/webawesome/dist/events/invalid.js';
import type { WaShowEvent } from '@awesome.me/webawesome/dist/events/show.js';
import './Combobox.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/combobox/combobox.js'));
}

/**
 * Write a boolean as the keyword an enumerated attribute expects ("on"/"off",
 * "true"/"false"), or remove the attribute when the prop is unset so the
 * element keeps its own default.
 */
function setEnumeratedAttribute(
  el: Pick<Element, 'setAttribute' | 'removeAttribute'>,
  name: string,
  value: boolean | undefined,
  keywords: { true: string; false: string }
): void {
  if (value === undefined) el.removeAttribute(name);
  else el.setAttribute(name, value ? keywords.true : keywords.false);
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
export interface ComboboxProps extends Omit<
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
  | 'onCreate'
  | 'onInvalid'
  | 'dir'
> {
  /** Allows entering custom values */
  'allow-custom-value'?: boolean;

  /** Visual appearance style */
  appearance?: 'filled' | 'outlined' | 'filled-outlined';

  /** Allows creating new options not in the list */
  'allow-create'?: boolean;

  /** Controls autocapitalization on supported devices */
  autocapitalize?: 'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters';

  /** Turns autocorrect on or off; the browser decides when unset */
  autocorrect?: boolean;

  /** Disables the combobox */
  disabled?: boolean;

  /** Customizes the keyboard's Enter key label */
  enterkeyhint?:
    'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';

  /** Hint text */
  hint?: string;

  /** Controls virtual keyboard type */
  inputmode?:
    | 'none'
    | 'text'
    | 'decimal'
    | 'numeric'
    | 'tel'
    | 'search'
    | 'email'
    | 'url';

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
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';

  /** Turns spell checking on or off; on when unset */
  spellcheck?: boolean;

  /** Shows clear button */
  'with-clear'?: boolean;

  /** Current value of the combobox */
  value?: string;

  /** Custom validation message; the control is invalid while it is set */
  'custom-error'?: string;

  onInput?: (event: InputEvent) => void;

  onChange?: (event: Event) => void;

  onFocus?: (event: FocusEvent) => void;

  onBlur?: (event: FocusEvent) => void;

  onClear?: (event: WaClearEvent) => void;

  onShow?: (event: WaShowEvent) => void;

  onAfterShow?: (event: WaAfterShowEvent) => void;

  onHide?: (event: WaHideEvent) => void;

  onAfterHide?: (event: WaAfterHideEvent) => void;

  onCreate?: (event: WaCreateEvent) => void;

  onInvalid?: (event: WaInvalidEvent) => void;
}

export interface ComboboxRef {
  show: () => void;

  hide: () => void;

  focus: (options: FocusOptions) => void;

  blur: () => void;

  setCustomValidity: (message: string) => void;

  formStateRestoreCallback: (
    state: string | File | FormData | null,
    reason: 'autocomplete' | 'restore'
  ) => void;

  resetValidity: () => void;
  /** Reference to the underlying HTML element */
  element: WaCombobox | null;
}

export const Combobox = forwardRef<ComboboxRef, ComboboxProps>(
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
      onCreate,
      onInvalid,
      autocorrect,
      spellcheck,
      ...props
    },
    ref
  ) => {
    const comboboxRef = useRef<WaCombobox | null>(null);
    const setComboboxRef = useCallback((el: WaCombobox | null) => {
      comboboxRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        show: () => {
          if (
            comboboxRef.current &&
            typeof comboboxRef.current.show === 'function'
          ) {
            comboboxRef.current.show();
          }
        },
        hide: () => {
          if (
            comboboxRef.current &&
            typeof comboboxRef.current.hide === 'function'
          ) {
            comboboxRef.current.hide();
          }
        },
        focus: (options: FocusOptions) => {
          if (
            comboboxRef.current &&
            typeof comboboxRef.current.focus === 'function'
          ) {
            comboboxRef.current.focus(options);
          }
        },
        blur: () => {
          if (
            comboboxRef.current &&
            typeof comboboxRef.current.blur === 'function'
          ) {
            comboboxRef.current.blur();
          }
        },
        setCustomValidity: (message: string) => {
          if (
            comboboxRef.current &&
            typeof comboboxRef.current.setCustomValidity === 'function'
          ) {
            comboboxRef.current.setCustomValidity(message);
          }
        },
        formStateRestoreCallback: (
          state: string | File | FormData | null,
          reason: 'autocomplete' | 'restore'
        ) => {
          if (
            comboboxRef.current &&
            typeof comboboxRef.current.formStateRestoreCallback === 'function'
          ) {
            comboboxRef.current.formStateRestoreCallback(state, reason);
          }
        },
        resetValidity: () => {
          if (
            comboboxRef.current &&
            typeof comboboxRef.current.resetValidity === 'function'
          ) {
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
        if (onInput) onInput(e as InputEvent);
      };

      const handleChange = (e: Event) => {
        if (onChange) onChange(e);
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

      const handleWaCreate = (e: Event) => {
        if (onCreate) onCreate(e as WaCreateEvent);
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
      onCreate,
      onInvalid,
    ]);

    useEffect(() => {
      const el = comboboxRef.current;
      if (!el) return;
      setEnumeratedAttribute(el, 'autocorrect', autocorrect, {
        true: 'on',
        false: 'off',
      });
      setEnumeratedAttribute(el, 'spellcheck', spellcheck, {
        true: 'true',
        false: 'false',
      });
    }, [autocorrect, spellcheck]);

    return (
      <wa-combobox
        ref={setComboboxRef}
        class={clsx('Combobox', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-combobox>
    );
  }
);

Combobox.displayName = 'Combobox';
