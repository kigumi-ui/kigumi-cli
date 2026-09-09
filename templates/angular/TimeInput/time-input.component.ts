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
} from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/time-input/time-input.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/time-input/time-input.js'));
}

/**
 * Time inputs collect a time of day from the user
 *
 * @see https://webawesome.com/docs/components/time-input
 */
@Component({
  selector: 'k-time-input',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-time-input
      #element
      [attr.name]="name"
      [attr.value]="value"
      [attr.disabled]="disabled || null"
      [attr.required]="required || null"
      [attr.readonly]="readonly || null"
      [attr.size]="size"
      [attr.appearance]="appearance"
      [attr.pill]="pill || null"
      [attr.label]="label"
      [attr.hint]="hint"
      [attr.with-clear]="withClear || null"
      [attr.with-now]="withNow || null"
      [attr.min]="min"
      [attr.max]="max"
      [attr.step]="step"
      [attr.hour-format]="hourFormat"
      [attr.open]="open || null"
      [attr.placement]="placement"
    >
      <ng-content />
    </wa-time-input>
  `,
  styleUrl: './time-input.component.css',
})
export class TimeInputComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The name of the control, submitted with form data */
  @Input() name?: string;
  /** The current value as a 24-hour `HH:mm:ss` string */
  @Input() value?: string;
  /** Whether the control is disabled */
  @Input() disabled?: boolean;
  /** Whether a value is required before form submission */
  @Input() required?: boolean;
  /** Whether the control is read-only */
  @Input() readonly?: boolean;
  /** Controls the overall dimensions of the control */
  @Input() size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';
  /** The visual style of the control */
  @Input() appearance?: 'filled' | 'outlined' | 'filled-outlined';
  /** Draws the control with rounded edges */
  @Input() pill?: boolean;
  /** The control label. Use the `label` slot for rich labels. */
  @Input() label?: string;
  /** Help text shown below the control. Use the `hint` slot for rich hints. */
  @Input() hint?: string;
  /** Shows a clear button when the control has a value */
  @Input() withClear?: boolean;
  /** Shows a button that sets the value to the current time */
  @Input() withNow?: boolean;
  /** The earliest acceptable time */
  @Input() min?: string;
  /** The latest acceptable time */
  @Input() max?: string;
  /** The granularity of the value in seconds */
  @Input() step?: number;
  /** Whether to display a 12- or 24-hour clock. `auto` follows the locale. */
  @Input() hourFormat?: 'auto' | '12' | '24';
  /** Whether the time picker dropdown is open */
  @Input() open?: boolean;
  /** The preferred placement of the dropdown */
  @Input() placement?:
    'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end';

  @Output() inputEvent = new EventEmitter<InputEvent>();
  @Output() change = new EventEmitter<Event>();
  @Output() focusEvent = new EventEmitter<FocusEvent>();
  @Output() blurEvent = new EventEmitter<FocusEvent>();
  @Output() clear = new EventEmitter<CustomEvent>();
  @Output() showEvent = new EventEmitter<CustomEvent>();
  @Output() afterShow = new EventEmitter<CustomEvent>();
  @Output() hideEvent = new EventEmitter<CustomEvent>();
  @Output() afterHide = new EventEmitter<CustomEvent>();
  @Output() invalid = new EventEmitter<CustomEvent>();

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
    const handleClear = (e: Event) => this.clear.emit(e as CustomEvent);
    el.addEventListener('wa-clear', handleClear);
    this.cleanups.push(() => el.removeEventListener('wa-clear', handleClear));
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
    const handleInvalid = (e: Event) => this.invalid.emit(e as CustomEvent);
    el.addEventListener('wa-invalid', handleInvalid);
    this.cleanups.push(() =>
      el.removeEventListener('wa-invalid', handleInvalid)
    );
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
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
  show(): void {
    (this.elementRef.nativeElement as unknown as { show: () => void }).show();
  }
  hide(): void {
    (this.elementRef.nativeElement as unknown as { hide: () => void }).hide();
  }
  formStateRestoreCallback(state?: string | File | FormData | null): void {
    (
      this.elementRef.nativeElement as unknown as {
        formStateRestoreCallback: (
          state?: string | File | FormData | null
        ) => void;
      }
    ).formStateRestoreCallback(state);
  }
  setCustomValidity(message?: string): void {
    (
      this.elementRef.nativeElement as unknown as {
        setCustomValidity: (message?: string) => void;
      }
    ).setCustomValidity(message);
  }
  resetValidity(): void {
    (
      this.elementRef.nativeElement as unknown as { resetValidity: () => void }
    ).resetValidity();
  }
}
