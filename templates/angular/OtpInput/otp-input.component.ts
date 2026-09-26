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
import type WaElement from '@awesome.me/webawesome/dist/components/otp-input/otp-input.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/otp-input/otp-input.js'));
}

/**
 * OTP inputs collect one-time passcodes, PINs, and other fixed-length codes, one character per segment
 *
 * @see https://webawesome.com/docs/components/otp-input
 */
@Component({
  selector: 'k-otp-input',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-otp-input
      #element
      [attr.label]="label"
      [attr.hint]="hint"
      [attr.value]="value"
      [attr.length]="length"
      [attr.format]="format"
      [attr.type]="type"
      [attr.case]="case"
      [attr.appearance]="appearance"
      [attr.size]="size"
      [attr.mask]="mask || null"
      [attr.with-mask]="withMask || null"
      [attr.autocomplete]="autocomplete"
      [attr.autosubmit]="autosubmit || null"
      [attr.required]="required || null"
      [attr.readonly]="readonly || null"
      [attr.disabled]="disabled || null"
      [attr.name]="name"
    >
      <ng-content />
    </wa-otp-input>
  `,
  styleUrl: './otp-input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OtpInputComponent),
      multi: true,
    },
  ],
})
export class OtpInputComponent
  implements AfterViewInit, OnDestroy, ControlValueAccessor
{
  @ViewChild('element', { static: true }) elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** A label shown above the segments */
  @Input() label?: string;
  /** Hint text shown below the segments */
  @Input() hint?: string;
  /** The current value of the OTP field */
  @Input() value?: string;
  /** Number of character segments to display. Overridden by format when set */
  @Input() length?: number;
  /** Segment format using # as a placeholder; other characters are literal separators */
  @Input() format?: string;
  /** Allowed character class */
  @Input() type?: 'numeric' | 'alpha' | 'alphanumeric';
  /** Case transformation applied to entered characters */
  @Input() case?: 'preserve' | 'upper' | 'lower';
  /** Visual appearance of the segments */
  @Input() appearance?: 'outlined' | 'filled' | 'filled-outlined' | 'contained';
  /** The size of each segment */
  @Input() size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';
  /** Displays entered characters as a mask instead of their real value */
  @Input() mask?: boolean;
  /** Shows a mask character in empty segments as a length hint */
  @Input() withMask?: boolean;
  /** The autocomplete attribute forwarded to the underlying input */
  @Input() autocomplete?: string;
  /** Submits the form automatically once all segments are filled */
  @Input() autosubmit?: boolean;
  /** Makes the field required */
  @Input() required?: boolean;
  /** Makes the field readonly */
  @Input() readonly?: boolean;
  /** Disables the form control */
  @Input() disabled?: boolean;
  /** The name of the input, submitted with form data */
  @Input() name?: string;

  @Output() inputEvent = new EventEmitter<InputEvent>();
  @Output() change = new EventEmitter<Event>();
  @Output() focusEvent = new EventEmitter<FocusEvent>();
  @Output() blurEvent = new EventEmitter<FocusEvent>();
  @Output() complete = new EventEmitter<CustomEvent>();
  @Output() clearEvent = new EventEmitter<CustomEvent>();
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

    const handleInputEvent = (e: Event) =>
      this.inputEvent.emit(e as InputEvent);
    el.addEventListener('input', handleInputEvent);
    this.cleanups.push(() => el.removeEventListener('input', handleInputEvent));
    const handleChange = (e: Event) => this.change.emit(e as Event);
    el.addEventListener('change', handleChange);
    this.cleanups.push(() => el.removeEventListener('change', handleChange));
    const handleFocusEvent = (e: Event) =>
      this.focusEvent.emit(e as FocusEvent);
    el.addEventListener('focus', handleFocusEvent);
    this.cleanups.push(() => el.removeEventListener('focus', handleFocusEvent));
    const handleBlurEvent = (e: Event) => this.blurEvent.emit(e as FocusEvent);
    el.addEventListener('blur', handleBlurEvent);
    this.cleanups.push(() => el.removeEventListener('blur', handleBlurEvent));
    const handleComplete = (e: Event) => this.complete.emit(e as CustomEvent);
    el.addEventListener('wa-complete', handleComplete);
    this.cleanups.push(() =>
      el.removeEventListener('wa-complete', handleComplete)
    );
    const handleClearEvent = (e: Event) =>
      this.clearEvent.emit(e as CustomEvent);
    el.addEventListener('wa-clear', handleClearEvent);
    this.cleanups.push(() =>
      el.removeEventListener('wa-clear', handleClearEvent)
    );
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

  clear(): void {
    (this.elementRef.nativeElement as unknown as { clear: () => void }).clear();
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
