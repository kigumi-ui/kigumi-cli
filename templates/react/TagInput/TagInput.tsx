import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaTagInput from '@awesome.me/webawesome/dist/components/tag-input/tag-input.js';
import './TagInput.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/tag-input/tag-input.js'));
}

/**
 * Tag inputs collect a list of short values, such as keywords or labels, as removable tags
 *
 * @example
 * ```tsx
 * // Basic usage
 * <TagInput />
 *
 * // With event handlers
 * <TagInput
 *   onInput={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<TagInputRef>(null);
 * <button onClick={() => ref.current?.focus()}>Call Method</button>
 * <TagInput ref={ref} />
 * ```
 */
export interface TagInputProps extends Omit<
  HTMLAttributes<HTMLElement>,
  | 'onInput'
  | 'onChange'
  | 'onBlur'
  | 'onFocus'
  | 'onCreate'
  | 'onClear'
  | 'onInvalid'
  | 'dir'
> {
  /** The tag input's label */
  label?: string;

  /** The tag input's hint */
  hint?: string;

  /** Default value as a delimiter-separated string */
  value?: string;

  /** Placeholder text shown in the text box */
  placeholder?: string;

  /** Characters that turn typed text into a tag */
  delimiter?: string;

  /** The maximum number of tags that can be added */
  'max-tags'?: number;

  /** The minimum number of tags required for the control to be valid */
  'min-tags'?: number;

  /** Allows the same tag to be added more than once */
  'allow-duplicates'?: boolean;

  /** Adds a clear button that removes all tags */
  'with-clear'?: boolean;

  /** Visual appearance */
  appearance?: 'filled' | 'outlined' | 'filled-outlined';

  /** The tag input's size */
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';

  /** Draws a pill-style tag input with rounded edges */
  pill?: boolean;

  /** Requires at least one tag */
  required?: boolean;

  /** Makes the tag input readonly */
  readonly?: boolean;

  /** Disables the form control */
  disabled?: boolean;

  /** The name of the input, submitted with form data */
  name?: string;

  /** Emitted when the user types in the text box or when a tag is added or removed. */
  onInput?: (event: InputEvent) => void;

  /** Emitted when a tag is added, removed, or all tags are cleared by the user. */
  onChange?: (event: Event) => void;

  /** Emitted when the control loses focus. */
  onBlur?: (event: FocusEvent) => void;

  /** Emitted when the control gains focus. */
  onFocus?: (event: FocusEvent) => void;

  /** Emitted before typed text becomes a tag. Call `event.preventDefault()` to reject it. The event `detail` contains `{ inputValue: string }`, the text that would become the tag. */
  onCreate?: (event: CustomEvent) => void;

  /** Emitted when the clear button is activated. */
  onClear?: (event: CustomEvent) => void;

  /** Emitted when the form control has been checked for validity and its constraints aren't satisfied. */
  onInvalid?: (event: CustomEvent) => void;
}

export interface TagInputRef {
  /** Sets focus on the text box. */
  focus: (options: FocusOptions) => void;

  /** Removes focus from the text box. */
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
  element: WaTagInput | null;
}

export const TagInput = forwardRef<TagInputRef, TagInputProps>(
  (
    {
      children,
      className,
      onInput,
      onChange,
      onBlur,
      onFocus,
      onCreate,
      onClear,
      onInvalid,
      ...props
    },
    ref
  ) => {
    const taginputRef = useRef<WaTagInput | null>(null);
    const setTagInputRef = useCallback((el: WaTagInput | null) => {
      taginputRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        focus: (options: FocusOptions) => {
          if (
            taginputRef.current &&
            typeof taginputRef.current.focus === 'function'
          ) {
            taginputRef.current.focus(options);
          }
        },
        blur: () => {
          if (
            taginputRef.current &&
            typeof taginputRef.current.blur === 'function'
          ) {
            taginputRef.current.blur();
          }
        },
        setCustomValidity: (message: string) => {
          if (
            taginputRef.current &&
            typeof taginputRef.current.setCustomValidity === 'function'
          ) {
            taginputRef.current.setCustomValidity(message);
          }
        },
        formStateRestoreCallback: (
          state: string | File | FormData | null,
          reason: 'autocomplete' | 'restore'
        ) => {
          if (
            taginputRef.current &&
            typeof taginputRef.current.formStateRestoreCallback === 'function'
          ) {
            taginputRef.current.formStateRestoreCallback(state, reason);
          }
        },
        resetValidity: () => {
          if (
            taginputRef.current &&
            typeof taginputRef.current.resetValidity === 'function'
          ) {
            taginputRef.current.resetValidity();
          }
        },
        get element() {
          return taginputRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = taginputRef.current;
      if (!el) return;

      const handleInput = (e: Event) => {
        if (onInput) onInput(e as InputEvent);
      };

      const handleChange = (e: Event) => {
        if (onChange) onChange(e as Event);
      };

      const handleBlur = (e: Event) => {
        if (onBlur) onBlur(e as FocusEvent);
      };

      const handleFocus = (e: Event) => {
        if (onFocus) onFocus(e as FocusEvent);
      };

      const handleWaCreate = (e: Event) => {
        if (onCreate) onCreate(e as CustomEvent);
      };

      const handleWaClear = (e: Event) => {
        if (onClear) onClear(e as CustomEvent);
      };

      const handleWaInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as CustomEvent);
      };

      el.addEventListener('input', handleInput);
      el.addEventListener('change', handleChange);
      el.addEventListener('blur', handleBlur);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('wa-create', handleWaCreate);
      el.addEventListener('wa-clear', handleWaClear);
      el.addEventListener('wa-invalid', handleWaInvalid);

      return () => {
        el.removeEventListener('input', handleInput);
        el.removeEventListener('change', handleChange);
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('wa-create', handleWaCreate);
        el.removeEventListener('wa-clear', handleWaClear);
        el.removeEventListener('wa-invalid', handleWaInvalid);
      };
    }, [onInput, onChange, onBlur, onFocus, onCreate, onClear, onInvalid]);

    return (
      <wa-tag-input
        ref={setTagInputRef}
        class={clsx('TagInput', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-tag-input>
    );
  }
);

TagInput.displayName = 'TagInput';
