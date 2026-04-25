import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, AfterViewInit, inject, Input, Output, EventEmitter, OnDestroy, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type WaElement from '@awesome.me/webawesome/dist/components/file-input/file-input.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/file-input/file-input.js'));
}

/**
 * File inputs allow users to select and upload files from their device
 *
 * @see https://webawesome.com/docs/components/file-input
 */
@Component({
  selector: 'k-file-input',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-file-input
        #element
        [attr.label]="label"
        [attr.hint]="hint"
        [attr.accept]="accept"
        [attr.multiple]="multiple || null"
        [attr.disabled]="disabled || null"
        [attr.required]="required || null"
        [attr.size]="size">
      <ng-content />
    </wa-file-input>
  `,
  styleUrl: './file-input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileInputComponent),
      multi: true,
    },
  ],
})
export class FileInputComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Accessible label for the input */
  @Input() label?: string;
  /** Descriptive hint text */
  @Input() hint?: string;
  /** Accepted file types (MIME types or extensions) */
  @Input() accept?: string;
  /** Allow multiple file selection */
  @Input() multiple?: boolean;
  /** Disables the input */
  @Input() disabled?: boolean;
  /** Makes field mandatory */
  @Input() required?: boolean;
  /** Input size */
  @Input() size?: 'small' | 'medium' | 'large';

  @Output() inputEvent = new EventEmitter<CustomEvent>();
  @Output() change = new EventEmitter<CustomEvent>();
  @Output() focusEvent = new EventEmitter<CustomEvent>();
  @Output() blurEvent = new EventEmitter<CustomEvent>();
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

    const handleInputEvent = (e: Event) => this.inputEvent.emit(e as CustomEvent);
    el.addEventListener('input', handleInputEvent);
    this.cleanups.push(() => el.removeEventListener('input', handleInputEvent));
    const handleChange = (e: Event) => this.change.emit(e as CustomEvent);
    el.addEventListener('change', handleChange);
    this.cleanups.push(() => el.removeEventListener('change', handleChange));
    const handleFocusEvent = (e: Event) => this.focusEvent.emit(e as CustomEvent);
    el.addEventListener('focus', handleFocusEvent);
    this.cleanups.push(() => el.removeEventListener('focus', handleFocusEvent));
    const handleBlurEvent = (e: Event) => this.blurEvent.emit(e as CustomEvent);
    el.addEventListener('blur', handleBlurEvent);
    this.cleanups.push(() => el.removeEventListener('blur', handleBlurEvent));
    const handleInvalid = (e: Event) => this.invalid.emit(e as CustomEvent);
    el.addEventListener('wa-invalid', handleInvalid);
    this.cleanups.push(() => el.removeEventListener('wa-invalid', handleInvalid));

    const handleValueChange = () => this.onChangeCallback((el as unknown as { value: unknown }).value);
    el.addEventListener('input', handleValueChange);
    this.cleanups.push(() => el.removeEventListener('input', handleValueChange));
    const handleBlurTouch = () => this.onTouchedCallback();
    el.addEventListener('blur', handleBlurTouch);
    this.cleanups.push(() => el.removeEventListener('blur', handleBlurTouch));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }

  writeValue(value: unknown): void {
    if (this.elementRef?.nativeElement) {
      (this.elementRef.nativeElement as unknown as { value: unknown }).value = value ?? '';
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
      (this.elementRef.nativeElement as unknown as { disabled: boolean }).disabled = isDisabled;
    }
  }

  focus(options?: unknown): void {
    (this.elementRef.nativeElement as unknown as { focus: (options: unknown) => void }).focus(options);
  }
  blur(): void {
    (this.elementRef.nativeElement as unknown as { blur: () => void }).blur();
  }
  setCustomValidity(message?: unknown): void {
    (this.elementRef.nativeElement as unknown as { setCustomValidity: (message: unknown) => void }).setCustomValidity(message);
  }
  formStateRestoreCallback(state?: unknown, reason?: unknown): void {
    (this.elementRef.nativeElement as unknown as { formStateRestoreCallback: (state: unknown, reason: unknown) => void }).formStateRestoreCallback(state, reason);
  }
  resetValidity(): void {
    (this.elementRef.nativeElement as unknown as { resetValidity: () => void }).resetValidity();
  }
}
