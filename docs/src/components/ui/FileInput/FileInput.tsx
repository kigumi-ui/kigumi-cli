import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/file-input/file-input.js';
import './FileInput.css';

/**
 * File inputs allow users to select and upload files from their device
 *
 * @example
 * ```tsx
 * // Basic usage
 * <FileInput />
 *
 * // With event handlers
 * <FileInput
 *   onInput={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<FileInputRef>(null);
 * <button onClick={() => ref.current?.focus()}>Call Method</button>
 * <FileInput ref={ref} />
 * ```
 */
export interface FileInputProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onInput' | 'onChange' | 'onFocus' | 'onBlur' | 'onInvalid' | 'dir'
> {
  /** Accessible label for the input */
  label?: string;

  /** Descriptive hint text */
  hint?: string;

  /** Accepted file types (MIME types or extensions) */
  accept?: string;

  /** Allow multiple file selection */
  multiple?: boolean;

  /** Disables the input */
  disabled?: boolean;

  /** Makes field mandatory */
  required?: boolean;

  /** Input size */
  size?: 'small' | 'medium' | 'large';

  /** Emitted when file selection changes. */
  onInput?: (event: CustomEvent) => void;

  /** Emitted when files are added or removed. */
  onChange?: (event: CustomEvent) => void;

  /** Emitted when the dropzone gains focus. */
  onFocus?: (event: FocusEvent) => void;

  /** Emitted when the dropzone loses focus. */
  onBlur?: (event: FocusEvent) => void;

  /** Emitted when the form control has been checked for validity and its constraints aren't satisfied. */
  onInvalid?: (event: CustomEvent) => void;
}

export interface FileInputRef {
  /** Sets focus on the file input. */
  focus: (options: FocusOptions) => void;

  /** Removes focus from the file input. */
  blur: () => void;
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const FileInput = forwardRef<FileInputRef, FileInputProps>(
  (
    {
      children,
      className,
      onInput,
      onChange,
      onFocus,
      onBlur,
      onInvalid,
      ...props
    },
    ref
  ) => {
    const fileinputRef = useRef<
      HTMLElement & {
        focus?: (options: FocusOptions) => void;
        blur?: () => void;
      }
    >(null);

    useImperativeHandle(
      ref,
      () => ({
        focus: (options: FocusOptions) => {
          if (
            fileinputRef.current &&
            typeof fileinputRef.current.focus === 'function'
          ) {
            fileinputRef.current.focus(options);
          }
        },
        blur: () => {
          if (
            fileinputRef.current &&
            typeof fileinputRef.current.blur === 'function'
          ) {
            fileinputRef.current.blur();
          }
        },
        get element() {
          return fileinputRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      const el = fileinputRef.current;
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

      const handleInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as CustomEvent);
      };

      el.addEventListener('input', handleInput);
      el.addEventListener('change', handleChange);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('blur', handleBlur);
      el.addEventListener('wa-invalid', handleInvalid);

      return () => {
        el.removeEventListener('input', handleInput);
        el.removeEventListener('change', handleChange);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('wa-invalid', handleInvalid);
      };
    }, [onInput, onChange, onFocus, onBlur, onInvalid]);

    return (
      <wa-file-input
        ref={fileinputRef}
        class={clsx('FileInput', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-file-input>
    );
  }
);

FileInput.displayName = 'FileInput';
