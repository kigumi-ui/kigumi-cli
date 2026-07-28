import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaFileInput from '@awesome.me/webawesome/dist/components/file-input/file-input.js';
import './FileInput.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/file-input/file-input.js'));
}

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
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';

  onInput?: (event: CustomEvent) => void;

  onChange?: (event: CustomEvent) => void;

  onFocus?: (event: FocusEvent) => void;

  onBlur?: (event: FocusEvent) => void;

  onInvalid?: (event: CustomEvent) => void;
}

export interface FileInputRef {
  focus: (options: FocusOptions) => void;

  blur: () => void;

  setCustomValidity: (message: string) => void;

  formStateRestoreCallback: (
    state: string | File | FormData | null,
    reason: 'autocomplete' | 'restore'
  ) => void;

  resetValidity: () => void;
  /** Reference to the underlying HTML element */
  element: WaFileInput | null;
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
    const fileinputRef = useRef<WaFileInput | null>(null);
    const setFileInputRef = useCallback((el: WaFileInput | null) => {
      fileinputRef.current = el;
    }, []);

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
        setCustomValidity: (message: string) => {
          if (
            fileinputRef.current &&
            typeof fileinputRef.current.setCustomValidity === 'function'
          ) {
            fileinputRef.current.setCustomValidity(message);
          }
        },
        formStateRestoreCallback: (
          state: string | File | FormData | null,
          reason: 'autocomplete' | 'restore'
        ) => {
          if (
            fileinputRef.current &&
            typeof fileinputRef.current.formStateRestoreCallback === 'function'
          ) {
            fileinputRef.current.formStateRestoreCallback(state, reason);
          }
        },
        resetValidity: () => {
          if (
            fileinputRef.current &&
            typeof fileinputRef.current.resetValidity === 'function'
          ) {
            fileinputRef.current.resetValidity();
          }
        },
        get element() {
          return fileinputRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
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

      const handleWaInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as CustomEvent);
      };

      el.addEventListener('input', handleInput);
      el.addEventListener('change', handleChange);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('blur', handleBlur);
      el.addEventListener('wa-invalid', handleWaInvalid);

      return () => {
        el.removeEventListener('input', handleInput);
        el.removeEventListener('change', handleChange);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('wa-invalid', handleWaInvalid);
      };
    }, [onInput, onChange, onFocus, onBlur, onInvalid]);

    return (
      <wa-file-input
        ref={setFileInputRef}
        class={clsx('FileInput', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-file-input>
    );
  }
);

FileInput.displayName = 'FileInput';
