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
import type WaElement from '@awesome.me/webawesome/dist/components/color-picker/color-picker.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/color-picker/color-picker.js'));
}

/**
 * Color pickers allow the user to select a color
 *
 * @see https://webawesome.com/docs/components/color-picker
 */
@Component({
  selector: 'k-color-picker',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-color-picker
      #element
      [attr.value]="value"
      [attr.format]="format"
      [attr.opacity]="opacity || null"
      [attr.disabled]="disabled || null"
      [attr.required]="required || null"
      [attr.size]="size"
      [attr.label]="label"
      [attr.hint]="hint"
      [attr.name]="name"
      [attr.open]="open || null"
      [attr.placement]="placement"
      [attr.swatches]="swatches"
      [attr.uppercase]="uppercase || null"
      [attr.without-format-toggle]="withoutFormatToggle || null"
      [attr.inline]="inline || null"
    >
      <ng-content />
    </wa-color-picker>
  `,
  styleUrl: './color-picker.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ColorPickerComponent),
      multi: true,
    },
  ],
})
export class ColorPickerComponent
  implements AfterViewInit, OnDestroy, ControlValueAccessor
{
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The current color value */
  @Input() value?: string;
  /** Color format */
  @Input() format?: 'hex' | 'rgb' | 'hsl' | 'hsv';
  /** Enables opacity slider */
  @Input() opacity?: boolean;
  /** Disables the color picker */
  @Input() disabled?: boolean;
  /** Makes field mandatory */
  @Input() required?: boolean;
  /** Color picker size */
  @Input() size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';
  /** Label text */
  @Input() label?: string;
  /** Hint text */
  @Input() hint?: string;
  /** Form field name */
  @Input() name?: string;
  /** Whether the panel is open */
  @Input() open?: boolean;
  /** Preferred placement of the color picker panel */
  @Input() placement?:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'right'
    | 'right-start'
    | 'right-end'
    | 'left'
    | 'left-start'
    | 'left-end';
  /** Predefined color swatches */
  @Input() swatches?: string;
  /** Displays hex values in uppercase */
  @Input() uppercase?: boolean;
  /** Hides the format toggle button */
  @Input() withoutFormatToggle?: boolean;
  /** Renders the color picker inline instead of in a dropdown */
  @Input() inline?: boolean;

  @Output() change = new EventEmitter<CustomEvent>();
  @Output() inputEvent = new EventEmitter<CustomEvent>();
  @Output() showEvent = new EventEmitter<CustomEvent>();
  @Output() afterShow = new EventEmitter<CustomEvent>();
  @Output() hideEvent = new EventEmitter<CustomEvent>();
  @Output() afterHide = new EventEmitter<CustomEvent>();
  @Output() blurEvent = new EventEmitter<CustomEvent>();
  @Output() focusEvent = new EventEmitter<FocusEvent>();
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
    const handleInputEvent = (e: Event) =>
      this.inputEvent.emit(e as CustomEvent);
    el.addEventListener('input', handleInputEvent);
    this.cleanups.push(() => el.removeEventListener('input', handleInputEvent));
    const handleShowEvent = (e: Event) => this.showEvent.emit(e as CustomEvent);
    el.addEventListener('wa-show', handleShowEvent);
    this.cleanups.push(() =>
      el.removeEventListener('wa-show', handleShowEvent)
    );
    const handleAfterShow = (e: Event) => this.afterShow.emit(e as CustomEvent);
    el.addEventListener('wa-after-show', handleAfterShow);
    this.cleanups.push(() =>
      el.removeEventListener('wa-after-show', handleAfterShow)
    );
    const handleHideEvent = (e: Event) => this.hideEvent.emit(e as CustomEvent);
    el.addEventListener('wa-hide', handleHideEvent);
    this.cleanups.push(() =>
      el.removeEventListener('wa-hide', handleHideEvent)
    );
    const handleAfterHide = (e: Event) => this.afterHide.emit(e as CustomEvent);
    el.addEventListener('wa-after-hide', handleAfterHide);
    this.cleanups.push(() =>
      el.removeEventListener('wa-after-hide', handleAfterHide)
    );
    const handleBlurEvent = (e: Event) => this.blurEvent.emit(e as CustomEvent);
    el.addEventListener('blur', handleBlurEvent);
    this.cleanups.push(() => el.removeEventListener('blur', handleBlurEvent));
    const handleFocusEvent = (e: Event) =>
      this.focusEvent.emit(e as FocusEvent);
    el.addEventListener('focus', handleFocusEvent);
    this.cleanups.push(() => el.removeEventListener('focus', handleFocusEvent));
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

  getHexString(
    hue?: number,
    saturation?: number,
    brightness?: number,
    alpha?: any
  ): void {
    (
      this.elementRef.nativeElement as unknown as {
        getHexString: (
          hue?: number,
          saturation?: number,
          brightness?: number,
          alpha?: any
        ) => void;
      }
    ).getHexString(hue, saturation, brightness, alpha);
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
  getFormattedValue(
    format?: 'hex' | 'hexa' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hsv' | 'hsva'
  ): void {
    (
      this.elementRef.nativeElement as unknown as {
        getFormattedValue: (
          format?:
            'hex' | 'hexa' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hsv' | 'hsva'
        ) => void;
      }
    ).getFormattedValue(format);
  }
  reportValidity(): void {
    (
      this.elementRef.nativeElement as unknown as { reportValidity: () => void }
    ).reportValidity();
  }
  show(): void {
    (this.elementRef.nativeElement as unknown as { show: () => void }).show();
  }
  hide(): void {
    (this.elementRef.nativeElement as unknown as { hide: () => void }).hide();
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
