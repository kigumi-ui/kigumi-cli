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
import type WaElement from '@awesome.me/webawesome/dist/components/button/button.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/button/button.js'));
}

/**
 * Buttons represent actions that are available to the user
 *
 * @see https://webawesome.com/docs/components/button
 */
@Component({
  selector: 'k-button',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-button
      #element
      [attr.variant]="variant"
      [attr.appearance]="appearance"
      [attr.size]="size"
      [attr.pill]="pill || null"
      [attr.disabled]="disabled || null"
      [attr.loading]="loading || null"
      [attr.with-caret]="withCaret || null"
      [attr.href]="href"
      [attr.target]="target"
      [attr.download]="download"
      [attr.rel]="rel"
      [attr.type]="type"
      [attr.name]="name"
      [attr.value]="value"
      [attr.formaction]="formaction"
      [attr.formenctype]="formenctype"
      [attr.formmethod]="formmethod"
      [attr.formnovalidate]="formnovalidate || null"
      [attr.formtarget]="formtarget"
    >
      <ng-content />
    </wa-button>
  `,
  styleUrl: './button.component.css',
})
export class ButtonComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Semantic variant of the button */
  @Input() variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
  /** Visual appearance style */
  @Input() appearance?:
    | 'accent'
    | 'filled-outlined'
    | 'filled'
    | 'outlined'
    | 'plain';
  /** Button size */
  @Input() size?: 'small' | 'medium' | 'large';
  /** Gives the button rounded edges */
  @Input() pill?: boolean;
  /** Disables the button */
  @Input() disabled?: boolean;
  /** Shows a loading indicator */
  @Input() loading?: boolean;
  /** Adds a dropdown indicator caret */
  @Input() withCaret?: boolean;
  /** Makes the button work like a link */
  @Input() href?: string;
  /** Link target (when href is set) */
  @Input() target?: '_blank' | '_self' | '_parent' | '_top';
  /** Download filename (when href is set) */
  @Input() download?: string;
  /** Link relationship (when href is set) */
  @Input() rel?: string;
  /** The button's type for form submission */
  @Input() type?: 'button' | 'submit' | 'reset';
  /** The name of the button for form submission */
  @Input() name?: string;
  /** The value of the button for form submission */
  @Input() value?: string;
  /** Override the form's action attribute */
  @Input() formaction?: string;
  /** Override the form's enctype attribute */
  @Input() formenctype?: string;
  /** Override the form's method attribute */
  @Input() formmethod?: string;
  /** Bypass form validation when this button submits */
  @Input() formnovalidate?: boolean;
  /** Override the form's target attribute */
  @Input() formtarget?: string;

  @Output() blurEvent = new EventEmitter<CustomEvent>();
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
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
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
