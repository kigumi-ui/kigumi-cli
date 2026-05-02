import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
  Input,
} from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/relative-time/relative-time.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/relative-time/relative-time.js'));
}

/**
 * Outputs a localized time phrase relative to the current date and time
 *
 * @see https://webawesome.com/docs/components/relative-time
 */
@Component({
  selector: 'k-relative-time',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-relative-time
      #element
      [attr.date]="date"
      [attr.format]="format"
      [attr.numeric]="numeric"
      [attr.sync]="sync || null"
      [attr.lang]="lang"
    >
      <ng-content />
    </wa-relative-time>
  `,
  styleUrl: './relative-time.component.css',
})
export class RelativeTimeComponent implements AfterViewInit {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The date/time to calculate from */
  @Input() date?: string;
  /** The formatting style */
  @Input() format?: 'long' | 'short' | 'narrow';
  /** When to use numeric values */
  @Input() numeric?: 'always' | 'auto';
  /** Keeps time in sync */
  @Input() sync?: boolean;
  /** The locale to use */
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
