import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/combobox/combobox.js';
import './Combobox.css';

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

  /** Enable or disable autocorrect on supported devices */
  autocorrect?: boolean;

  /** Disables the combobox */
  disabled?: boolean;

  /** Customizes the keyboard's Enter key label */
  enterkeyhint?:
    | 'enter'
    | 'done'
    | 'go'
    | 'next'
    | 'previous'
    | 'search'
    | 'send';

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
  size?: 'small' | 'medium' | 'large';

  /** Enable or disable spellchecking */
  spellcheck?: boolean;

  /** Shows clear button */
  'with-clear'?: boolean;

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

  /** Emitted when the form control has been checked for validity and its constraints aren't satisfied. */
  onInvalid?: (event: CustomEvent) => void;

  /** Emitted when a new option is created via allow-create. */
  onCreate?: (event: CustomEvent) => void;
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

      const handleCreate = (e: Event) => {
        if (onCreate) onCreate(e as CustomEvent);
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

    return (
      <wa-combobox
        ref={comboboxRef}
        class={clsx('Combobox', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-combobox>
    );
  }
);

Combobox.displayName = 'Combobox';
