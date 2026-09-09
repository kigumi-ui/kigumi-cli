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
import type WaElement from '@awesome.me/webawesome/dist/components/known-date/known-date.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/known-date/known-date.js'));
}

/**
 * Known dates collect a calendar date the user already knows, such as a birthday
 *
 * @see https://webawesome.com/docs/components/known-date
 */
@Component({
  selector: 'k-known-date',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-known-date
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
      [attr.min]="min"
      [attr.max]="max"
      [attr.locale]="locale"
    >
      <ng-content />
    </wa-known-date>
  `,
  styleUrl: './known-date.component.css',
})
export class KnownDateComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The name of the control, submitted with form data */
  @Input() name?: string;
  /** The current value as a `YYYY-MM-DD` string */
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
  /** The earliest acceptable date */
  @Input() min?: string;
  /** The latest acceptable date */
  @Input() max?: string;
  /** The locale used to format and parse the date */
  @Input() locale?: string;

  @Output() inputEvent = new EventEmitter<InputEvent>();
  @Output() change = new EventEmitter<Event>();
  @Output() blurEvent = new EventEmitter<FocusEvent>();
  @Output() focusEvent = new EventEmitter<FocusEvent>();
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
    const handleBlurEvent = (e: Event) => this.blurEvent.emit(e as FocusEvent);
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
