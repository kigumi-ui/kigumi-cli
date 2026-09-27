import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/combobox/combobox.js';
import './Combobox.css';
import type { WaAfterHideEvent } from '@awesome.me/webawesome-pro/dist/events/after-hide.js';
import type { WaAfterShowEvent } from '@awesome.me/webawesome-pro/dist/events/after-show.js';
import type { WaClearEvent } from '@awesome.me/webawesome-pro/dist/events/clear.js';
import type { WaCreateEvent } from '@awesome.me/webawesome-pro/dist/events/create.js';
import type { WaHideEvent } from '@awesome.me/webawesome-pro/dist/events/hide.js';
import type { WaInvalidEvent } from '@awesome.me/webawesome-pro/dist/events/invalid.js';
import type { WaShowEvent } from '@awesome.me/webawesome-pro/dist/events/show.js';

/**
 * Write a boolean as the keyword an enumerated attribute expects ("on"/"off",
 * "true"/"false"), or remove the attribute when the prop is unset so the
 * element keeps its own default. Web Awesome reads these by value, not
 * presence, and React would write a DOM property or a bare attribute.
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
  | 'onInvalid'
  | 'onCreate'
  | 'dir'
> {
  /** Allows entering custom values */
  'allow-custom-value'?: boolean;

  /** Allows creating new options not in the list */
  'allow-create'?: boolean;

  /** Visual appearance style */
  appearance?: 'filled' | 'outlined' | 'filled-outlined';

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

  /** Label text */
  label?: string;

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

  /** Selected value(s) */
  value?: string | string[];

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

  /** Emitted when the combobox's menu opens. */
  onShow?: (event: WaShowEvent) => void;

  /** Emitted after the combobox's menu opens and all animations are complete. */
  onAfterShow?: (event: WaAfterShowEvent) => void;

  /** Emitted when the combobox's menu closes. */
  onHide?: (event: WaHideEvent) => void;

  /** Emitted after the combobox's menu closes and all animations are complete. */
  onAfterHide?: (event: WaAfterHideEvent) => void;

  /** Emitted when the form control has been checked for validity and its constraints aren't satisfied. */
  onInvalid?: (event: WaInvalidEvent) => void;

  /** Emitted when a new option is created via allow-create. */
  onCreate?: (event: WaCreateEvent) => void;
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
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const Combobox = forwardRef<ComboboxRef, ComboboxProps>(
  (
    {
      children,
      className,
      value,
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
      onCreate,
      autocorrect,
      spellcheck,
      ...props
    },
    ref
  ) => {
    const comboboxRef = useRef<
      HTMLElement & {
        show?: () => void;
        hide?: () => void;
        focus?: (options: FocusOptions) => void;
        blur?: () => void;
      }
    >(null);

    const setComboboxRef = useCallback((el: typeof comboboxRef.current) => {
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
        get element() {
          return comboboxRef.current;
        },
      }),
      []
    );

    // Sync value after wa-combobox and its wa-option children have fully initialized.
    // See Select.tsx for detailed explanation of the optionValues cache bug.
    useEffect(() => {
      const el = comboboxRef.current as HTMLElement & {
        value?: string | string[];
        optionValues?: Set<string>;
        updateComplete?: Promise<boolean>;
        getAllOptions?: () => Array<
          HTMLElement & { updateComplete?: Promise<boolean> }
        >;
        handleValueChange?: () => void;
      };
      if (!el || value === undefined) return;

      const sync = async () => {
        await el.updateComplete;
        const options = el.getAllOptions?.() ?? [];
        await Promise.all(options.map((o) => o.updateComplete));
        el.optionValues = undefined;
        el.value = value;
        el.handleValueChange?.();
      };
      sync();
    }, [value]);

    useEffect(() => {
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

      const handleClear = (e: Event) => {
        if (onClear) onClear(e as WaClearEvent);
      };

      const handleShow = (e: Event) => {
        if (onShow) onShow(e as WaShowEvent);
      };

      const handleAfterShow = (e: Event) => {
        if (onAfterShow) onAfterShow(e as WaAfterShowEvent);
      };

      const handleHide = (e: Event) => {
        if (onHide) onHide(e as WaHideEvent);
      };

      const handleAfterHide = (e: Event) => {
        if (onAfterHide) onAfterHide(e as WaAfterHideEvent);
      };

      const handleInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as WaInvalidEvent);
      };

      const handleCreate = (e: Event) => {
        if (onCreate) onCreate(e as WaCreateEvent);
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
      el.addEventListener('wa-create', handleCreate);

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
        el.removeEventListener('wa-create', handleCreate);
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
      onCreate,
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
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-combobox>
    );
  }
);

Combobox.displayName = 'Combobox';
