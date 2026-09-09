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
import type WaElement from '@awesome.me/webawesome/dist/components/radio/radio.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/radio/radio.js'));
}

/**
 * Radios allow the user to select a single option from a group
 *
 * @see https://webawesome.com/docs/components/radio
 */
@Component({
  selector: 'k-radio',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-radio
      #element
      [attr.value]="value"
      [attr.disabled]="disabled || null"
      [attr.size]="size"
      [attr.appearance]="appearance"
    >
      <ng-content />
    </wa-radio>
  `,
  styleUrl: './radio.component.css',
})
export class RadioComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The radio value */
  @Input() value?: string;
  /** Disables the radio */
  @Input() disabled?: boolean;
  /** Radio size */
  @Input() size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';
  /** Radio appearance style */
  @Input() appearance?: 'default' | 'button';

  @Output() blur = new EventEmitter<FocusEvent>();
  @Output() focus = new EventEmitter<FocusEvent>();

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

    const handleBlur = (e: Event) => this.blur.emit(e as FocusEvent);
    el.addEventListener('blur', handleBlur);
    this.cleanups.push(() => el.removeEventListener('blur', handleBlur));
    const handleFocus = (e: Event) => this.focus.emit(e as FocusEvent);
    el.addEventListener('focus', handleFocus);
    this.cleanups.push(() => el.removeEventListener('focus', handleFocus));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
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
