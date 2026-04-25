import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, AfterViewInit, inject, Input, Output, EventEmitter, OnDestroy, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type WaElement from '@awesome.me/webawesome/dist/components/select/select.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/select/select.js'));
}

/**
 * Selects allow you to choose items from a menu of predefined options
 *
 * @see https://webawesome.com/docs/components/select
 */
@Component({
  selector: 'k-select',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-select
        #element
        [attr.name]="name"
        [attr.value]="value"
        [attr.appearance]="appearance"
        [attr.size]="size"
        [attr.placeholder]="placeholder"
        [attr.multiple]="multiple || null"
        [attr.max-options-visible]="maxOptionsVisible"
        [attr.disabled]="disabled || null"
        [attr.with-clear]="withClear || null"
        [attr.open]="open || null"
        [attr.hoist]="hoist || null"
        [attr.placement]="placement"
        [attr.pill]="pill || null"
        [attr.label]="label"
        [attr.hint]="hint"
        [attr.required]="required || null"
        [attr.invalid]="invalid || null"
        [attr.help-text]="helpText">
      <ng-content />
    </wa-select>
  `,
  styleUrl: './select.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Form field name */
  @Input() name?: string;
  /** Selected value(s) */
  @Input() value?: string;
  /** Visual appearance */
  @Input() appearance?: 'filled' | 'outlined' | 'filled-outlined';
  /** Select size */
  @Input() size?: 'small' | 'medium' | 'large';
  /** Placeholder text */
  @Input() placeholder?: string;
  /** Allows multiple selections */
  @Input() multiple?: boolean;
  /** Max visible tags (multiple) */
  @Input() maxOptionsVisible?: number;
  /** Disables the select */
  @Input() disabled?: boolean;
  /** Shows clear button */
  @Input() withClear?: boolean;
  /** Whether listbox is open */
  @Input() open?: boolean;
  /** Hoists to body */
  @Input() hoist?: boolean;
  /** Listbox placement */
  @Input() placement?: 'top' | 'bottom';
  /** Rounded edges */
  @Input() pill?: boolean;
  /** Label text */
  @Input() label?: string;
  /** Hint text */
  @Input() hint?: string;
  /** Makes selection required */
  @Input() required?: boolean;
  /** Shows invalid/error state */
  @Input() invalid?: boolean;
  /** Help text below the control */
  @Input() helpText?: string;

  @Output() inputEvent = new EventEmitter<CustomEvent>();
  @Output() change = new EventEmitter<CustomEvent>();
  @Output() focusEvent = new EventEmitter<CustomEvent>();
  @Output() blurEvent = new EventEmitter<CustomEvent>();
  @Output() clear = new EventEmitter<CustomEvent>();
  @Output() showEvent = new EventEmitter<CustomEvent>();
  @Output() afterShow = new EventEmitter<CustomEvent>();
  @Output() hideEvent = new EventEmitter<CustomEvent>();
  @Output() afterHide = new EventEmitter<CustomEvent>();
  @Output() invalidEvent = new EventEmitter<CustomEvent>();

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
    const handleClear = (e: Event) => this.clear.emit(e as CustomEvent);
    el.addEventListener('wa-clear', handleClear);
    this.cleanups.push(() => el.removeEventListener('wa-clear', handleClear));
    const handleShowEvent = (e: Event) => this.showEvent.emit(e as CustomEvent);
    el.addEventListener('wa-show', handleShowEvent);
    this.cleanups.push(() => el.removeEventListener('wa-show', handleShowEvent));
    const handleAfterShow = (e: Event) => this.afterShow.emit(e as CustomEvent);
    el.addEventListener('wa-after-show', handleAfterShow);
    this.cleanups.push(() => el.removeEventListener('wa-after-show', handleAfterShow));
    const handleHideEvent = (e: Event) => this.hideEvent.emit(e as CustomEvent);
    el.addEventListener('wa-hide', handleHideEvent);
    this.cleanups.push(() => el.removeEventListener('wa-hide', handleHideEvent));
    const handleAfterHide = (e: Event) => this.afterHide.emit(e as CustomEvent);
    el.addEventListener('wa-after-hide', handleAfterHide);
    this.cleanups.push(() => el.removeEventListener('wa-after-hide', handleAfterHide));
    const handleInvalidEvent = (e: Event) => this.invalidEvent.emit(e as CustomEvent);
    el.addEventListener('wa-invalid', handleInvalidEvent);
    this.cleanups.push(() => el.removeEventListener('wa-invalid', handleInvalidEvent));

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

  show(): void {
    (this.elementRef.nativeElement as unknown as { show: () => void }).show();
  }
  hide(): void {
    (this.elementRef.nativeElement as unknown as { hide: () => void }).hide();
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
