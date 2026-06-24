import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  forwardRef,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type WaElement from '@awesome.me/webawesome/dist/components/textarea/textarea.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/textarea/textarea.js'));
}

/**
 * Textareas collect multi-line text data from the user
 *
 * @see https://webawesome.com/docs/components/textarea
 */
@Component({
  selector: 'k-textarea',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-textarea
      #element
      [attr.name]="name"
      [attr.value]="value"
      [attr.appearance]="appearance"
      [attr.size]="size"
      [attr.label]="label"
      [attr.hint]="hint"
      [attr.placeholder]="placeholder"
      [attr.rows]="rows"
      [attr.resize]="resize"
      [attr.disabled]="disabled || null"
      [attr.readonly]="readonly || null"
      [attr.required]="required || null"
      [attr.minlength]="minlength"
      [attr.maxlength]="maxlength"
      [attr.spellcheck]="spellcheck || null"
      [attr.with-count]="withCount || null"
    >
      <ng-content />
    </wa-textarea>
  `,
  styleUrl: './textarea.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
})
export class TextareaComponent
  implements AfterViewInit, OnDestroy, ControlValueAccessor
{
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Form field name */
  @Input() name?: string;
  /** Current value */
  @Input() value?: string;
  /** Visual appearance */
  @Input() appearance?: 'filled' | 'outlined' | 'filled-outlined';
  /** Textarea size */
  @Input() size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';
  /** Label text */
  @Input() label?: string;
  /** Hint text */
  @Input() hint?: string;
  /** Placeholder text */
  @Input() placeholder?: string;
  /** Visible rows */
  @Input() rows?: number;
  /** Resize behavior */
  @Input() resize?: 'none' | 'vertical' | 'horizontal' | 'both' | 'auto';
  /** Disables the textarea */
  @Input() disabled?: boolean;
  /** Makes it readonly */
  @Input() readonly?: boolean;
  /** Makes it required */
  @Input() required?: boolean;
  /** Minimum length */
  @Input() minlength?: number;
  /** Maximum length */
  @Input() maxlength?: number;
  /** Enable spell checking */
  @Input() spellcheck?: boolean;
  /** Shows a character count when maxlength is set */
  @Input() withCount?: boolean;

  @Output() blurEvent = new EventEmitter<CustomEvent>();
  @Output() change = new EventEmitter<CustomEvent>();
  @Output() focusEvent = new EventEmitter<FocusEvent>();
  @Output() inputEvent = new EventEmitter<CustomEvent>();
  @Output() invalid = new EventEmitter<CustomEvent>();

  private onChangeCallback: (value: unknown) => void = () => {};
  private onTouchedCallback: () => void = () => {};

  private cleanups: (() => void)[] = [];

  ngAfterViewInit(): void {
    ensureLoaded();
    const el = this.elementRef.nativeElement;

    // Forward host attributes to inner wa-* element
    const host = this.hostRef.nativeElement;
    const hostStyle = host.getAttribute('style');
    if (hostStyle) {
      el.setAttribute('style', hostStyle);
      host.removeAttribute('style');
    }
    // When slotted, override display:contents so ::slotted() margins apply
    if (host.hasAttribute('slot')) {
      host.style.display = 'inline';
    }

    const handleBlurEvent = (e: Event) => this.blurEvent.emit(e as CustomEvent);
    el.addEventListener('blur', handleBlurEvent);
    this.cleanups.push(() => el.removeEventListener('blur', handleBlurEvent));
    const handleChange = (e: Event) => this.change.emit(e as CustomEvent);
    el.addEventListener('change', handleChange);
    this.cleanups.push(() => el.removeEventListener('change', handleChange));
    const handleFocusEvent = (e: Event) =>
      this.focusEvent.emit(e as FocusEvent);
    el.addEventListener('focus', handleFocusEvent);
    this.cleanups.push(() => el.removeEventListener('focus', handleFocusEvent));
    const handleInputEvent = (e: Event) =>
      this.inputEvent.emit(e as CustomEvent);
    el.addEventListener('input', handleInputEvent);
    this.cleanups.push(() => el.removeEventListener('input', handleInputEvent));
    const handleInvalid = (e: Event) => this.invalid.emit(e as CustomEvent);
    el.addEventListener('wa-invalid', handleInvalid);
    this.cleanups.push(() =>
      el.removeEventListener('wa-invalid', handleInvalid)
    );

    const handleValueChange = () =>
      this.onChangeCallback((el as unknown as { value: unknown }).value);
    el.addEventListener('input', handleValueChange);
    this.cleanups.push(() =>
      el.removeEventListener('input', handleValueChange)
    );
    const handleBlurTouch = () => this.onTouchedCallback();
    el.addEventListener('blur', handleBlurTouch);
    this.cleanups.push(() => el.removeEventListener('blur', handleBlurTouch));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }

  writeValue(value: unknown): void {
    if (this.elementRef?.nativeElement) {
      (this.elementRef.nativeElement as unknown as { value: unknown }).value =
        value ?? '';
    }
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.elementRef?.nativeElement) {
      (
        this.elementRef.nativeElement as unknown as { disabled: boolean }
      ).disabled = isDisabled;
    }
  }

  focus(options?: FocusOptions): void {
    (
      this.elementRef.nativeElement as unknown as {
        focus: (options?: FocusOptions) => void;
      }
    ).focus(options);
  }
  blur(): void {
    (this.elementRef.nativeElement as unknown as { blur: () => void }).blur();
  }
  select(): void {
    (
      this.elementRef.nativeElement as unknown as { select: () => void }
    ).select();
  }
  scrollPosition(position?: { top?: number; left?: number }): void {
    (
      this.elementRef.nativeElement as unknown as {
        scrollPosition: (position?: { top?: number; left?: number }) => void;
      }
    ).scrollPosition(position);
  }
  setSelectionRange(
    selectionStart?: number,
    selectionEnd?: number,
    selectionDirection?: 'forward' | 'backward' | 'none'
  ): void {
    (
      this.elementRef.nativeElement as unknown as {
        setSelectionRange: (
          selectionStart?: number,
          selectionEnd?: number,
          selectionDirection?: 'forward' | 'backward' | 'none'
        ) => void;
      }
    ).setSelectionRange(selectionStart, selectionEnd, selectionDirection);
  }
  setRangeText(
    replacement?: string,
    start?: number,
    end?: number,
    selectMode?: 'select' | 'start' | 'end' | 'preserve'
  ): void {
    (
      this.elementRef.nativeElement as unknown as {
        setRangeText: (
          replacement?: string,
          start?: number,
          end?: number,
          selectMode?: 'select' | 'start' | 'end' | 'preserve'
        ) => void;
      }
    ).setRangeText(replacement, start, end, selectMode);
  }
  setCustomValidity(message?: string): void {
    (
      this.elementRef.nativeElement as unknown as {
        setCustomValidity: (message?: string) => void;
      }
    ).setCustomValidity(message);
  }
  formStateRestoreCallback(
    state?: string | File | FormData | null,
    reason?: 'autocomplete' | 'restore'
  ): void {
    (
      this.elementRef.nativeElement as unknown as {
        formStateRestoreCallback: (
          state?: string | File | FormData | null,
          reason?: 'autocomplete' | 'restore'
        ) => void;
      }
    ).formStateRestoreCallback(state, reason);
  }
  resetValidity(): void {
    (
      this.elementRef.nativeElement as unknown as { resetValidity: () => void }
    ).resetValidity();
  }
}
