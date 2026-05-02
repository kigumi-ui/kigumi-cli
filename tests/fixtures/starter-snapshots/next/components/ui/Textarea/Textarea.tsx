'use client';

import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaTextarea from '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import './Textarea.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/textarea/textarea.js'));
}

/**
 * Textareas collect multi-line text data from the user
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Textarea />
 *
 * // With event handlers
 * <Textarea
 *   onBlur={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<TextareaRef>(null);
 * <button onClick={() => ref.current?.focus()}>Call Method</button>
 * <Textarea ref={ref} />
 * ```
 */
export interface TextareaProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onBlur' | 'onChange' | 'onFocus' | 'onInput' | 'onInvalid' | 'dir'
> {
  /** Form field name */
  name?: string;

  /** Current value */
  value?: string;

  /** Visual appearance */
  appearance?: 'filled' | 'outlined' | 'filled-outlined';

  /** Textarea size */
  size?: 'small' | 'medium' | 'large';

  /** Label text */
  label?: string;

  /** Hint text */
  hint?: string;

  /** Placeholder text */
  placeholder?: string;

  /** Visible rows */
  rows?: number;

  /** Resize behavior */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both' | 'auto';

  /** Disables the textarea */
  disabled?: boolean;

  /** Makes it readonly */
  readonly?: boolean;

  /** Makes it required */
  required?: boolean;

  /** Minimum length */
  minlength?: number;

  /** Maximum length */
  maxlength?: number;

  /** Enable spell checking */
  spellcheck?: boolean;

  /** Shows a character count when maxlength is set */
  'with-count'?: boolean;

  /** Emitted when the control loses focus. */
  onBlur?: (event: FocusEvent) => void;

  /** Emitted when an alteration to the control's value is committed by the user. */
  onChange?: (event: CustomEvent) => void;

  /** Emitted when the control gains focus. */
  onFocus?: (event: FocusEvent) => void;

  /** Emitted when the control receives input. */
  onInput?: (event: CustomEvent) => void;

  /** Emitted when the form control has been checked for validity and its constraints aren't satisfied. */
  onInvalid?: (event: CustomEvent) => void;
}

export interface TextareaRef {
  /** Sets focus on the textarea. */
  focus: (options: FocusOptions) => void;

  /** Removes focus from the textarea. */
  blur: () => void;

  /** Selects all the text in the textarea. */
  select: () => void;

  /** Gets or sets the textarea's scroll position. */
  scrollPosition: (position: { top?: number; left?: number }) => void;

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
  element: WaTextarea | null;
}

export const Textarea = forwardRef<TextareaRef, TextareaProps>(
  (
    {
      children,
      className,
      onBlur,
      onChange,
      onFocus,
      onInput,
      onInvalid,
      ...props
    },
    ref
  ) => {
    const textareaRef = useRef<WaTextarea | null>(null);
    const setTextareaRef = useCallback((el: WaTextarea | null) => {
      textareaRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        focus: (options: FocusOptions) => {
          if (
            textareaRef.current &&
            typeof textareaRef.current.focus === 'function'
          ) {
            textareaRef.current.focus(options);
          }
        },
        blur: () => {
          if (
            textareaRef.current &&
            typeof textareaRef.current.blur === 'function'
          ) {
            textareaRef.current.blur();
          }
        },
        select: () => {
          if (
            textareaRef.current &&
            typeof textareaRef.current.select === 'function'
          ) {
            textareaRef.current.select();
          }
        },
        scrollPosition: (position: { top?: number; left?: number }) => {
          if (
            textareaRef.current &&
            typeof textareaRef.current.scrollPosition === 'function'
          ) {
            textareaRef.current.scrollPosition(position);
          }
        },
        setSelectionRange: (
          selectionStart: number,
          selectionEnd: number,
          selectionDirection: 'forward' | 'backward' | 'none'
        ) => {
          if (
            textareaRef.current &&
            typeof textareaRef.current.setSelectionRange === 'function'
          ) {
            textareaRef.current.setSelectionRange(
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
            textareaRef.current &&
            typeof textareaRef.current.setRangeText === 'function'
          ) {
            textareaRef.current.setRangeText(
              replacement,
              start,
              end,
              selectMode
            );
          }
        },
        setCustomValidity: (message: string) => {
          if (
            textareaRef.current &&
            typeof textareaRef.current.setCustomValidity === 'function'
          ) {
            textareaRef.current.setCustomValidity(message);
          }
        },
        formStateRestoreCallback: (
          state: string | File | FormData | null,
          reason: 'autocomplete' | 'restore'
        ) => {
          if (
            textareaRef.current &&
            typeof textareaRef.current.formStateRestoreCallback === 'function'
          ) {
            textareaRef.current.formStateRestoreCallback(state, reason);
          }
        },
        resetValidity: () => {
          if (
            textareaRef.current &&
            typeof textareaRef.current.resetValidity === 'function'
          ) {
            textareaRef.current.resetValidity();
          }
        },
        get element() {
          return textareaRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = textareaRef.current;
      if (!el) return;

      const handleBlur = (e: Event) => {
        if (onBlur) onBlur(e as FocusEvent);
      };

      const handleChange = (e: Event) => {
        if (onChange) onChange(e as CustomEvent);
      };

      const handleFocus = (e: Event) => {
        if (onFocus) onFocus(e as FocusEvent);
      };

      const handleInput = (e: Event) => {
        if (onInput) onInput(e as CustomEvent);
      };

      const handleWaInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as CustomEvent);
      };

      el.addEventListener('blur', handleBlur);
      el.addEventListener('change', handleChange);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('input', handleInput);
      el.addEventListener('wa-invalid', handleWaInvalid);

      return () => {
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('change', handleChange);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('input', handleInput);
        el.removeEventListener('wa-invalid', handleWaInvalid);
      };
    }, [onBlur, onChange, onFocus, onInput, onInvalid]);

    return (
      <wa-textarea
        ref={setTextareaRef}
        class={clsx('Textarea', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-textarea>
    );
  }
);

Textarea.displayName = 'Textarea';
