import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
  Input,
} from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/option/option.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/option/option.js'));
}

/**
 * Options define the selectable items within various form controls
 *
 * @see https://webawesome.com/docs/components/option
 */
@Component({
  selector: 'k-option',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-option
      #element
      [attr.value]="value"
      [attr.disabled]="disabled || null"
      [attr.selected]="selected || null"
      [attr.label]="label"
    >
      <ng-content />
    </wa-option>
  `,
  styleUrl: './option.component.css',
})
export class OptionComponent implements AfterViewInit {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The option value */
  @Input() value?: string;
  /** Disables the option */
  @Input() disabled?: boolean;
  /** Draws the option in a selected state */
  @Input() selected?: boolean;
  /** A custom label for the option (used by select's display input) */
  @Input() label?: string;

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
  }
}
