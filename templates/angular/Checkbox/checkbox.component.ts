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
import type WaElement from '@awesome.me/webawesome/dist/components/checkbox/checkbox.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/checkbox/checkbox.js'));
}

/**
 * Checkboxes allow the user to toggle an option on or off
 *
 * @see https://webawesome.com/docs/components/checkbox
 */
@Component({
  selector: 'k-checkbox',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-checkbox
      #element
      [attr.checked]="checked || null"
      [attr.disabled]="disabled || null"
      [attr.hint]="hint"
      [attr.indeterminate]="indeterminate || null"
      [attr.name]="name"
      [attr.required]="required || null"
      [attr.size]="size"
      [attr.value]="value"
    >
      <ng-content />
    </wa-checkbox>
  `,
  styleUrl: './checkbox.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
})
export class CheckboxComponent
  implements AfterViewInit, OnDestroy, ControlValueAccessor
{
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Draws checkbox in checked state */
  @Input() checked?: boolean;
  /** Disables the checkbox */
  @Input() disabled?: boolean;
  /** Descriptive helper text */
  @Input() hint?: string;
  /** Mixed/parent selection state */
  @Input() indeterminate?: boolean;
  /** Form submission identifier */
  @Input() name?: string;
  /** Makes field mandatory */
  @Input() required?: boolean;
  /** Adjusts checkbox dimensions */
  @Input() size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';
  /** Form submission value */
  @Input() value?: string;

  @Output() change = new EventEmitter<Event>();
  @Output() blurEvent = new EventEmitter<FocusEvent>();
  @Output() focusEvent = new EventEmitter<FocusEvent>();
  @Output() inputEvent = new EventEmitter<InputEvent>();
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

    const handleChange = (e: Event) => this.change.emit(e as Event);
    el.addEventListener('change', handleChange);
    this.cleanups.push(() => el.removeEventListener('change', handleChange));
    const handleBlurEvent = (e: Event) => this.blurEvent.emit(e as FocusEvent);
    el.addEventListener('blur', handleBlurEvent);
    this.cleanups.push(() => el.removeEventListener('blur', handleBlurEvent));
    const handleFocusEvent = (e: Event) =>
      this.focusEvent.emit(e as FocusEvent);
    el.addEventListener('focus', handleFocusEvent);
    this.cleanups.push(() => el.removeEventListener('focus', handleFocusEvent));
    const handleInputEvent = (e: Event) =>
      this.inputEvent.emit(e as InputEvent);
    el.addEventListener('input', handleInputEvent);
    this.cleanups.push(() => el.removeEventListener('input', handleInputEvent));
    const handleInvalid = (e: Event) => this.invalid.emit(e as CustomEvent);
    el.addEventListener('wa-invalid', handleInvalid);
    this.cleanups.push(() =>
      el.removeEventListener('wa-invalid', handleInvalid)
    );

    const handleCheckedChange = () =>
      this.onChangeCallback((el as unknown as { checked: boolean }).checked);
    el.addEventListener('change', handleCheckedChange);
    this.cleanups.push(() =>
      el.removeEventListener('change', handleCheckedChange)
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
      (
        this.elementRef.nativeElement as unknown as { checked: boolean }
      ).checked = !!value;
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

  click(): void {
    (this.elementRef.nativeElement as unknown as { click: () => void }).click();
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
