import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/input/input.js';
import './Input.css';

/**
 * Inputs collect data from the user
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Input />
 *
 * // With event handlers
 * <Input
 *   onInput={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<InputRef>(null);
 * <button onClick={() => ref.current?.focus()}>Call Method</button>
 * <Input ref={ref} />
 * ```
 */
export interface InputProps extends Omit<
  HTMLAttributes<HTMLElement>,
  | 'onInput'
  | 'onChange'
  | 'onBlur'
  | 'onFocus'
  | 'onClear'
  | 'onInvalid'
  | 'dir'
> {
  /** Input type */
  type?:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'date'
    | 'tel'
    | 'url'
    | 'search';

  /** Accessible label for the input */
  label?: string;

  /** Descriptive hint text */
  hint?: string;

  /** Placeholder text */
  placeholder?: string;

  /** Input value */
  value?: string;

  /** Visual appearance style */
  appearance?: 'filled' | 'filled-outlined' | 'outlined';

  /** Input size */
  size?: 'small' | 'medium' | 'large';

  /** Gives the input rounded edges */
  pill?: boolean;

  /** Disables the input */
  disabled?: boolean;

  /** Adds a clear button when input has content */
  'with-clear'?: boolean;

  /** Adds a toggle button for password visibility */
  'password-toggle'?: boolean;

  /** Shows the password as plain text when set */
  'password-visible'?: boolean;

  /** Makes the input readonly */
  readonly?: boolean;

  /** Makes the input required */
  required?: boolean;

  /** The name of the input for form submission */
  name?: string;

  /** A regular expression pattern the value must match */
  pattern?: string;

  /** Minimum string length */
  minlength?: number;

  /** Maximum string length */
  maxlength?: number;

  /** Minimum value for numeric and date types */
  min?: number | string;

  /** Maximum value for numeric and date types */
  max?: number | string;

  /** Step increment for numeric types */
  step?: number | string;

  /** Hides the browser's built-in spin buttons for number inputs */
  'without-spin-buttons'?: boolean;

  /** Hint for autocomplete behavior */
  autocomplete?: string;

  /** Controls automatic capitalization */
  autocapitalize?: 'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters';

  /** Hint for autocorrect behavior */
  autocorrect?: 'off' | 'on';

  /** Automatically focuses the input on page load */
  autofocus?: boolean;

  /** Hint for virtual keyboard type */
  inputmode?:
    | 'none'
    | 'text'
    | 'decimal'
    | 'numeric'
    | 'tel'
    | 'search'
    | 'email'
    | 'url';

  /** Hint for Enter key label on virtual keyboards */
  enterkeyhint?:
    | 'enter'
    | 'done'
    | 'go'
    | 'next'
    | 'previous'
    | 'search'
    | 'send';

  /** Emitted when the control receives input (native input event). */
  onInput?: (event: Event) => void;

  /** Emitted when an alteration to the control's value is committed by the user (native change event). */
  onChange?: (event: Event) => void;

  /** Emitted when the control loses focus. */
  onBlur?: (event: FocusEvent) => void;

  /** Emitted when the control gains focus. */
  onFocus?: (event: FocusEvent) => void;

  /** Emitted when the clear button is activated. */
  onClear?: (event: CustomEvent) => void;

  /** Emitted when the form control has been checked for validity and its constraints aren't satisfied. */
  onInvalid?: (event: CustomEvent) => void;
}

export interface InputRef {
  /** Sets focus on the input. */
  focus: (options: FocusOptions) => void;

  /** Removes focus from the input. */
  blur: () => void;

  /** Selects all the text in the input. */
  select: () => void;

  /** Sets the start and end positions of the text selection (0-based). */
  setSelectionRange: (
    selectionStart: number,
    selectionEnd: number,
    selectionDirection: 'forward' | 'backward' | 'none'
  ) => void;

  /** Replaces a range of text with a new string. */
  setRangeText: (
    replacement: string,
    start: number,
    end: number,
    selectMode: 'select' | 'start' | 'end' | 'preserve'
  ) => void;

  /** Displays the browser picker for an input element (only works if the browser supports it for the input type). */
  showPicker: () => void;

  /** Increments the value of a numeric input type by the value of the step attribute. */
  stepUp: () => void;

  /** Decrements the value of a numeric input type by the value of the step attribute. */
  stepDown: () => void;
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const Input = forwardRef<InputRef, InputProps>(
  (
    {
      children,
      className,
      onInput,
      onChange,
      onBlur,
      onFocus,
      onClear,
      onInvalid,
      ...props
    },
    ref
  ) => {
    const inputRef = useRef<
      HTMLElement & {
        focus?: (options: FocusOptions) => void;
        blur?: () => void;
        select?: () => void;
        setSelectionRange?: (
          selectionStart: number,
          selectionEnd: number,
          selectionDirection: 'forward' | 'backward' | 'none'
        ) => void;
        setRangeText?: (
          replacement: string,
          start: number,
          end: number,
          selectMode: 'select' | 'start' | 'end' | 'preserve'
        ) => void;
        showPicker?: () => void;
        stepUp?: () => void;
        stepDown?: () => void;
      }
    >(null);

    useImperativeHandle(
      ref,
      () => ({
        focus: (options: FocusOptions) => {
          if (
            inputRef.current &&
            typeof inputRef.current.focus === 'function'
          ) {
            inputRef.current.focus(options);
          }
        },
        blur: () => {
          if (inputRef.current && typeof inputRef.current.blur === 'function') {
            inputRef.current.blur();
          }
        },
        select: () => {
          if (
            inputRef.current &&
            typeof inputRef.current.select === 'function'
          ) {
            inputRef.current.select();
          }
        },
        setSelectionRange: (
          selectionStart: number,
          selectionEnd: number,
          selectionDirection: 'forward' | 'backward' | 'none'
        ) => {
          if (
            inputRef.current &&
            typeof inputRef.current.setSelectionRange === 'function'
          ) {
            inputRef.current.setSelectionRange(
              selectionStart,
              selectionEnd,
              selectionDirection
            );
          }
        },
        setRangeText: (
          replacement: string,
          start: number,
          end: number,
          selectMode: 'select' | 'start' | 'end' | 'preserve'
        ) => {
          if (
            inputRef.current &&
            typeof inputRef.current.setRangeText === 'function'
          ) {
            inputRef.current.setRangeText(replacement, start, end, selectMode);
          }
        },
        showPicker: () => {
          if (
            inputRef.current &&
            typeof inputRef.current.showPicker === 'function'
          ) {
            inputRef.current.showPicker();
          }
        },
        stepUp: () => {
          if (
            inputRef.current &&
            typeof inputRef.current.stepUp === 'function'
          ) {
            inputRef.current.stepUp();
          }
        },
        stepDown: () => {
          if (
            inputRef.current &&
            typeof inputRef.current.stepDown === 'function'
          ) {
            inputRef.current.stepDown();
          }
        },
        get element() {
          return inputRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      const el = inputRef.current;
      if (!el) return;

      const handleInput = (e: Event) => {
        if (onInput) onInput(e);
      };

      const handleChange = (e: Event) => {
        if (onChange) onChange(e);
      };

      const handleBlur = (e: Event) => {
        if (onBlur) onBlur(e as FocusEvent);
      };

      const handleFocus = (e: Event) => {
        if (onFocus) onFocus(e as FocusEvent);
      };

      const handleClear = (e: Event) => {
        if (onClear) onClear(e as CustomEvent);
      };

      const handleInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as CustomEvent);
      };

      el.addEventListener('input', handleInput);
      el.addEventListener('change', handleChange);
      el.addEventListener('blur', handleBlur);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('wa-clear', handleClear);
      el.addEventListener('wa-invalid', handleInvalid);

      return () => {
        el.removeEventListener('input', handleInput);
        el.removeEventListener('change', handleChange);
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('wa-clear', handleClear);
        el.removeEventListener('wa-invalid', handleInvalid);
      };
    }, [onInput, onChange, onBlur, onFocus, onClear, onInvalid]);

    return (
      <wa-input
        ref={inputRef}
        class={clsx('Input', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-input>
    );
  }
);

Input.displayName = 'Input';
