import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, AfterViewInit, inject, Input, Output, EventEmitter, OnDestroy, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type WaElement from '@awesome.me/webawesome/dist/components/slider/slider.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/slider/slider.js'));
}

/**
 * Sliders allow the user to select a value within a range
 *
 * @see https://webawesome.com/docs/components/slider
 */
@Component({
  selector: 'k-slider',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-slider
        #element
        [attr.name]="name"
        [attr.value]="value"
        [attr.label]="label"
        [attr.hint]="hint"
        [attr.min]="min"
        [attr.max]="max"
        [attr.step]="step"
        [attr.orientation]="orientation"
        [attr.disabled]="disabled || null"
        [attr.readonly]="readonly || null"
        [attr.range]="range || null"
        [attr.with-markers]="withMarkers || null"
        [attr.with-tooltip]="withTooltip || null"
        [attr.size]="size"
        [attr.autofocus]="autofocus || null">
      <ng-content />
    </wa-slider>
  `,
  styleUrl: './slider.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SliderComponent),
      multi: true,
    },
  ],
})
export class SliderComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Form field name */
  @Input() name?: string;
  /** Current value */
  @Input() value?: number;
  /** Accessible label */
  @Input() label?: string;
  /** Hint text */
  @Input() hint?: string;
  /** Minimum value */
  @Input() min?: number;
  /** Maximum value */
  @Input() max?: number;
  /** Step increment */
  @Input() step?: number;
  /** The orientation of the slider */
  @Input() orientation?: 'horizontal' | 'vertical';
  /** Disables the slider */
  @Input() disabled?: boolean;
  /** Makes the slider readonly */
  @Input() readonly?: boolean;
  /** Converts to a range slider with two thumbs */
  @Input() range?: boolean;
  /** Draws markers at each step */
  @Input() withMarkers?: boolean;
  /** Draws a tooltip above the thumb */
  @Input() withTooltip?: boolean;
  /** Slider size */
  @Input() size?: 'small' | 'medium' | 'large';
  /** Automatically focuses the slider on page load */
  @Input() autofocus?: boolean;

  @Output() change = new EventEmitter<CustomEvent>();
  @Output() blurEvent = new EventEmitter<CustomEvent>();
  @Output() focusEvent = new EventEmitter<CustomEvent>();
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

    const handleChange = (e: Event) => this.change.emit(e as CustomEvent);
    el.addEventListener('change', handleChange);
    this.cleanups.push(() => el.removeEventListener('change', handleChange));
    const handleBlurEvent = (e: Event) => this.blurEvent.emit(e as CustomEvent);
    el.addEventListener('blur', handleBlurEvent);
    this.cleanups.push(() => el.removeEventListener('blur', handleBlurEvent));
    const handleFocusEvent = (e: Event) => this.focusEvent.emit(e as CustomEvent);
    el.addEventListener('focus', handleFocusEvent);
    this.cleanups.push(() => el.removeEventListener('focus', handleFocusEvent));
    const handleInputEvent = (e: Event) => this.inputEvent.emit(e as CustomEvent);
    el.addEventListener('input', handleInputEvent);
    this.cleanups.push(() => el.removeEventListener('input', handleInputEvent));
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

  focus(): void {
    (this.elementRef.nativeElement as unknown as { focus: () => void }).focus();
  }
  blur(): void {
    (this.elementRef.nativeElement as unknown as { blur: () => void }).blur();
  }
  stepDown(): void {
    (this.elementRef.nativeElement as unknown as { stepDown: () => void }).stepDown();
  }
  stepUp(): void {
    (this.elementRef.nativeElement as unknown as { stepUp: () => void }).stepUp();
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
