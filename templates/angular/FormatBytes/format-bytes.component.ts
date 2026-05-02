import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
  Input,
} from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/format-bytes/format-bytes.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/format-bytes/format-bytes.js'));
}

/**
 * Formats a number as a human-readable byte value
 *
 * @see https://webawesome.com/docs/components/format-bytes
 */
@Component({
  selector: 'k-format-bytes',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-format-bytes
      #element
      [attr.value]="value"
      [attr.unit]="unit"
      [attr.display]="display"
      [attr.lang]="lang"
    >
      <ng-content />
    </wa-format-bytes>
  `,
  styleUrl: './format-bytes.component.css',
})
export class FormatBytesComponent implements AfterViewInit {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The number to format in bytes */
  @Input() value?: number;
  /** The unit to format the value in */
  @Input() unit?: 'byte' | 'bit';
  /** Determines how to display the result */
  @Input() display?: 'long' | 'short' | 'narrow';
  /** The locale to use when formatting */
  @Input() lang?: string;

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
