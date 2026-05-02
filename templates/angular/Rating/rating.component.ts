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
import type WaElement from '@awesome.me/webawesome/dist/components/rating/rating.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/rating/rating.js'));
}

/**
 * Ratings give users a way to quickly view and provide feedback
 *
 * @see https://webawesome.com/docs/components/rating
 */
@Component({
  selector: 'k-rating',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-rating
      #element
      [attr.label]="label"
      [attr.value]="value"
      [attr.max]="max"
      [attr.precision]="precision"
      [attr.readonly]="readonly || null"
      [attr.disabled]="disabled || null"
      [attr.name]="name"
      [attr.required]="required || null"
      [attr.size]="size"
    >
      <ng-content />
    </wa-rating>
  `,
  styleUrl: './rating.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RatingComponent),
      multi: true,
    },
  ],
})
export class RatingComponent
  implements AfterViewInit, OnDestroy, ControlValueAccessor
{
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Accessible label */
  @Input() label?: string;
  /** Current rating value */
  @Input() value?: number;
  /** Maximum rating value */
  @Input() max?: number;
  /** Rating precision (e.g., 0.5) */
  @Input() precision?: number;
  /** Makes the rating readonly */
  @Input() readonly?: boolean;
  /** Disables the rating */
  @Input() disabled?: boolean;
  /** Form field name for submission */
  @Input() name?: string;
  /** Makes the rating required for form submission */
  @Input() required?: boolean;
  /** Rating size */
  @Input() size?: 'small' | 'medium' | 'large';

  @Output() change = new EventEmitter<CustomEvent>();
  @Output() hover = new EventEmitter<CustomEvent>();
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
    const handleHover = (e: Event) => this.hover.emit(e as CustomEvent);
    el.addEventListener('wa-hover', handleHover);
    this.cleanups.push(() => el.removeEventListener('wa-hover', handleHover));
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
